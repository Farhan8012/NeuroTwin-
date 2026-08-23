package com.neurotwin.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.common.util.concurrent.ListenableFuture
import com.neurotwin.app.ml.MlKitFilter
import com.neurotwin.app.network.RetrofitClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayOutputStream
import java.util.Timer
import java.util.TimerTask
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class CameraForegroundService : Service(), LifecycleOwner {

    private lateinit var cameraExecutor: ExecutorService
    private lateinit var mlKitFilter: MlKitFilter
    private val isProcessing = AtomicBoolean(false)
    private var frameCount = 0

    // Wake lock to prevent CPU sleep during continuous frame gating
    private var wakeLock: PowerManager.WakeLock? = null

    // Battery/thermal telemetry timer
    private var telemetryTimer: Timer? = null

    // Simple LifecycleOwner implementation for CameraX
    private val lifecycleRegistry = androidx.lifecycle.LifecycleRegistry(this).apply {
        currentState = androidx.lifecycle.Lifecycle.State.CREATED
    }

    override val lifecycle: androidx.lifecycle.Lifecycle
        get() = lifecycleRegistry

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)

        cameraExecutor = Executors.newSingleThreadExecutor()
        mlKitFilter = MlKitFilter()

        // Acquire partial wake lock so CPU stays active for frame processing
        val powerManager = getSystemService(POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "neurotwin:camera_service_wakelock"
        ).apply {
            acquire(4 * 60 * 60 * 1000L) // 4-hour max timeout
        }

        lifecycleRegistry.currentState = androidx.lifecycle.Lifecycle.State.STARTED
        lifecycleRegistry.currentState = androidx.lifecycle.Lifecycle.State.RESUMED

        startCamera()
        startTelemetryLogging()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onDestroy() {
        lifecycleRegistry.currentState = androidx.lifecycle.Lifecycle.State.DESTROYED
        cameraExecutor.shutdown()
        stopTelemetryLogging()
        wakeLock?.let {
            if (it.isHeld) it.release()
        }
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ─── Battery & Thermal Telemetry ────────────────────────────

    /**
     * Logs battery level, temperature, and thermal throttle status every 60 seconds.
     * This data is critical for benchmarking multi-hour continuous operation
     * and identifying thermal throttling on various Android devices.
     */
    private fun startTelemetryLogging() {
        telemetryTimer = Timer("TelemetryTimer", true).apply {
            scheduleAtFixedRate(object : TimerTask() {
                override fun run() {
                    logBatteryTelemetry()
                }
            }, 0L, TELEMETRY_INTERVAL_MS)
        }
    }

    private fun stopTelemetryLogging() {
        telemetryTimer?.cancel()
        telemetryTimer = null
    }

    private fun logBatteryTelemetry() {
        try {
            // Battery status
            val batteryIntent = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, 100) ?: 100
            val batteryPct = if (scale > 0) (level * 100 / scale) else -1

            // Battery temperature (in tenths of a degree Celsius)
            val tempRaw = batteryIntent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1) ?: -1
            val tempC = if (tempRaw > 0) tempRaw / 10.0 else -1.0

            // Charging state
            val plugged = batteryIntent?.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1) ?: -1
            val isCharging = plugged != 0

            // Thermal status (API 29+)
            val thermalStatus = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val pm = getSystemService(POWER_SERVICE) as PowerManager
                when (pm.currentThermalStatus) {
                    PowerManager.THERMAL_STATUS_NONE -> "NONE"
                    PowerManager.THERMAL_STATUS_LIGHT -> "LIGHT"
                    PowerManager.THERMAL_STATUS_MODERATE -> "MODERATE"
                    PowerManager.THERMAL_STATUS_SEVERE -> "SEVERE"
                    PowerManager.THERMAL_STATUS_CRITICAL -> "CRITICAL"
                    PowerManager.THERMAL_STATUS_EMERGENCY -> "EMERGENCY"
                    PowerManager.THERMAL_STATUS_SHUTDOWN -> "SHUTDOWN"
                    else -> "UNKNOWN"
                }
            } else {
                "N/A"
            }

            Log.i(
                TAG,
                "TELEMETRY | battery=$batteryPct% | temp=${tempC}°C | thermal=$thermalStatus | " +
                "charging=$isCharging | frames=$frameCount"
            )

            // Warn if device is getting hot
            if (tempC > 40.0) {
                Log.w(TAG, "⚠️ Battery temperature above 40°C ($tempC°C) — consider reducing frame rate")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Telemetry logging failed: ${e.message}")
        }
    }

    // ─── Camera Pipeline ────────────────────────────────────────

    private fun startCamera() {
        val cameraProviderFuture: ListenableFuture<ProcessCameraProvider> =
            ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            try {
                val cameraProvider = cameraProviderFuture.get()
                bindCameraUseCases(cameraProvider)
            } catch (e: Exception) {
                Log.e(TAG, "Camera initialization failed", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun bindCameraUseCases(cameraProvider: ProcessCameraProvider) {
        val imageAnalysis = ImageAnalysis.Builder()
            .setTargetResolution(android.util.Size(640, 480))
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()

        imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
            processFrame(imageProxy)
        }

        val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

        try {
            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(this, cameraSelector, imageAnalysis)
            Log.i(TAG, "Camera bound — processing at ~1.5 fps")
        } catch (e: Exception) {
            Log.e(TAG, "Camera bind failed", e)
        }
    }

    @androidx.annotation.OptIn(ExperimentalGetImage::class)
    private fun processFrame(imageProxy: ImageProxy) {
        // Rate-limit: skip if previous frame is still being processed
        if (!isProcessing.compareAndSet(false, true)) {
            imageProxy.close()
            return
        }

        mlKitFilter.processFrame(imageProxy) { shouldUpload, faceCount ->
            if (shouldUpload && faceCount > 0) {
                uploadFrame(imageProxy)
            } else {
                isProcessing.set(false)
                // Don't close here — MlKitFilter already closes on complete
            }
        }
    }

    private fun uploadFrame(imageProxy: ImageProxy) {
        try {
            val mediaImage = imageProxy.image
            if (mediaImage == null) {
                isProcessing.set(false)
                imageProxy.close()
                return
            }

            val buffer = imageProxy.planes[0].buffer
            val bytes = ByteArray(buffer.remaining())
            buffer.get(bytes)

            // Convert to JPEG
            val bitmap = imageProxy.toBitmap()
            val stream = ByteArrayOutputStream()
            bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 80, stream)
            val jpegBytes = stream.toByteArray()

            val requestFile = jpegBytes.toRequestBody("image/jpeg".toMediaTypeOrNull())
            val framePart = MultipartBody.Part.createFormData("file", "frame_${frameCount++}.jpg", requestFile)

            // Fire-and-forget upload (don't block camera pipeline)
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val response = RetrofitClient.instance.uploadFrame(framePart)
                    if (response.isSuccessful) {
                        val body = response.body()
                        if (body?.matched == true) {
                            Log.i(TAG, "Matched person: ${body.person?.get("name")} (score: ${body.confidence})")
                            broadcastRecognition(body)
                        }
                    }
                } catch (t: Throwable) {
                    Log.w(TAG, "Frame upload failed: ${t.message}")
                } finally {
                    isProcessing.set(false)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Frame processing error", e)
            isProcessing.set(false)
        } finally {
            imageProxy.close()
        }
    }

    private fun broadcastRecognition(result: com.neurotwin.app.network.FrameResponse) {
        val intent = Intent(ACTION_PERSON_RECOGNIZED).apply {
            putExtra(EXTRA_PERSON_NAME, result.person?.get("name") as? String ?: "Unknown")
            putExtra(EXTRA_PERSON_RELATION, result.person?.get("relationship") as? String ?: "")
            putExtra(EXTRA_CONFIDENCE, result.confidence)
            setPackage(packageName)
        }
        sendBroadcast(intent)
    }

    // ─── Notification ───────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "NeuroTwin Ambient Vision Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors environment for familiar faces and objects."
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("NeuroTwin Ambient Monitor Active")
            .setContentText("Continuously analyzing surroundings for familiar faces.")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    companion object {
        const val TAG = "CameraService"
        const val CHANNEL_ID = "neurotwin_camera_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_PERSON_RECOGNIZED = "com.neurotwin.app.PERSON_RECOGNIZED"
        const val EXTRA_PERSON_NAME = "person_name"
        const val EXTRA_PERSON_RELATION = "person_relationship"
        const val EXTRA_CONFIDENCE = "confidence"
        const val TELEMETRY_INTERVAL_MS = 60_000L  // Log every 60 seconds
    }
}

