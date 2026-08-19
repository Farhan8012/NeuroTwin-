package com.neurotwin.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.common.util.concurrent.ListenableFuture
import com.neurotwin.app.ml.MlKitFilter
import com.neurotwin.app.network.RetrofitClient
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayOutputStream
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class CameraForegroundService : Service(), LifecycleOwner {

    private lateinit var cameraExecutor: ExecutorService
    private lateinit var mlKitFilter: MlKitFilter
    private val isProcessing = AtomicBoolean(false)
    private var frameCount = 0

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

        lifecycleRegistry.currentState = androidx.lifecycle.Lifecycle.State.STARTED
        lifecycleRegistry.currentState = androidx.lifecycle.Lifecycle.State.RESUMED

        startCamera()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onDestroy() {
        lifecycleRegistry.currentState = androidx.lifecycle.Lifecycle.State.DESTROYED
        cameraExecutor.shutdown()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

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
            val call = RetrofitClient.instance.uploadFrame(framePart)
            call.enqueue(object : retrofit2.Callback<com.neurotwin.app.network.FrameResponse> {
                override fun onResponse(
                    call: retrofit2.Call<com.neurotwin.app.network.FrameResponse>,
                    response: retrofit2.Response<com.neurotwin.app.network.FrameResponse>
                ) {
                    if (response.isSuccessful) {
                        val body = response.body()
                        if (body?.matched == true) {
                            Log.i(TAG, "Matched person: ${body.person?.get("name")} (score: ${body.confidence})")
                            broadcastRecognition(body)
                        }
                    }
                    isProcessing.set(false)
                }

                override fun onFailure(
                    call: retrofit2.Call<com.neurotwin.app.network.FrameResponse>,
                    t: Throwable
                ) {
                    Log.w(TAG, "Frame upload failed: ${t.message}")
                    isProcessing.set(false)
                }
            })
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
    }
}
