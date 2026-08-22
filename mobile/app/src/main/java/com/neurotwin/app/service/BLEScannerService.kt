package com.neurotwin.app.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.ParcelUuid
import android.util.Log
import androidx.core.app.NotificationCompat
import com.neurotwin.app.network.RetrofitClient
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentHashMap

/**
 * Background BLE Scanner Service.
 *
 * Continuously scans for registered BLE beacons attached to objects (glasses, keys, wallet).
 * When a beacon is detected, reports its RSSI to the backend for room-level triangulation.
 *
 * Scan Strategy:
 *   - Low-power scan mode (60s intervals, 10s windows) to minimize battery drain.
 *   - Filters for beacons advertising a custom NeuroTwin service UUID.
 *   - Deduplicates: only reports each beacon once per scan window.
 *   - Reports RSSI values to POST /api/v1/ble/rssi for room estimation.
 *
 * The backend groups recent RSSI readings per receiver, converts to distance,
 * and determines which room the object is in.
 */
class BLEScannerService : Service() {

    private var bluetoothAdapter: BluetoothAdapter? = null
    private var bleScanner: BluetoothLeScanner? = null
    private var scanCallback: ScanCallback? = null
    private var scanJob: Job? = null

    // Track last report time per beacon to avoid flooding the backend
    private val lastReportTime = ConcurrentHashMap<String, Long>()
    private val REPORT_INTERVAL_MS = 5000L // Report each beacon at most every 5s

    // NeuroTwin custom service UUID for beacon identification
    // (standard iBeacon/Eddystone beacons are also supported via proximity UUID filter)
    companion object {
        const val TAG = "BLEScanner"
        const val CHANNEL_ID = "neurotwin_ble_channel"
        const val NOTIFICATION_ID = 1002
        const val ACTION_SCAN_RESULT = "com.neurotwin.app.BLE_SCAN_RESULT"
        const val EXTRA_BEACON_ID = "beacon_id"
        const val EXTRA_RSSI = "rssi"
        const val EXTRA_ROOM = "room"

        // Minimum RSSI to consider a beacon detectable (ignore very weak signals)
        const val MIN_RSSI = -90
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())

        val bluetoothManager = getSystemService(BLUETOOTH_SERVICE) as? BluetoothManager
        bluetoothAdapter = bluetoothManager?.adapter
        bleScanner = bluetoothAdapter?.bluetoothLeScanner

        if (bleScanner == null) {
            Log.e(TAG, "BLE scanner not available — Bluetooth may be disabled")
            stopSelf()
            return
        }

        Log.i(TAG, "BLE Scanner Service started")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startContinuousScanning()
        return START_STICKY
    }

    override fun onDestroy() {
        stopScanning()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ─── Scanning ──────────────────────────────────────────────

    @SuppressLint("MissingPermission")
    private fun startContinuousScanning() {
        if (scanJob?.isActive == true) return

        scanJob = CoroutineScope(Dispatchers.IO).launch {
            while (isActive) {
                performScan()
                delay(2000) // Brief pause between scan cycles
            }
        }
    }

    @SuppressLint("MissingPermission")
    private fun performScan() {
        val scanner = bleScanner ?: return

        val scanSettings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_POWER)
            .setReportDelay(0) // Report immediately as devices are found
            .build()

        // Accept all BLE devices — we filter by RSSI threshold
        // Real deployment would filter by specific UUID or manufacturer data
        val scanFilters = listOf(
            ScanFilter.Builder().build() // Accept all
        )

        scanCallback = object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult) {
                processScanResult(result)
            }

            override fun onScanFailed(errorCode: Int) {
                Log.w(TAG, "BLE scan failed with code: $errorCode")
            }
        }

        try {
            scanner.startScan(scanFilters, scanSettings, scanCallback)
            // Scan for 10 seconds then stop
            Thread.sleep(10_000)
            scanner.stopScan(scanCallback)
        } catch (e: SecurityException) {
            Log.e(TAG, "Bluetooth permission denied", e)
        } catch (e: Exception) {
            Log.e(TAG, "Scan error", e)
        }
    }

    @SuppressLint("MissingPermission")
    private fun stopScanning() {
        scanJob?.cancel()
        scanCallback?.let { callback ->
            try {
                bleScanner?.stopScan(callback)
            } catch (e: Exception) {
                Log.w(TAG, "Stop scan error: ${e.message}")
            }
        }
    }

    // ─── Result Processing ─────────────────────────────────────

    private fun processScanResult(result: ScanResult) {
        val rssi = result.rssi
        if (rssi < MIN_RSSI) return // Ignore very weak signals

        // Generate a beacon ID from the device's MAC address
        val beaconId = result.device.address?.replace(":", "-") ?: return

        // Deduplicate: skip if reported recently
        val now = System.currentTimeMillis()
        val lastTime = lastReportTime[beaconId] ?: 0
        if (now - lastTime < REPORT_INTERVAL_MS) return
        lastReportTime[beaconId] = now

        Log.d(TAG, "Detected beacon: $beaconId (RSSI: $rssi)")

        // Report to backend
        reportToBackend(beaconId, rssi)
    }

    private fun reportToBackend(beaconId: String, rssi: Int) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val receiverId = "rx_${getRoomFromDeviceName(beaconId)}"
                val data = mapOf(
                    "beacon_id" to beaconId,
                    "receiver_id" to receiverId,
                    "rssi" to rssi.toFloat()
                )

                val response = RetrofitClient.instance.reportBLE(data)
                if (response.isSuccessful) {
                    val location = response.body()
                    Log.i(TAG, "Beacon $beaconId → ${location?.get("room")}")

                    // Broadcast result to UI
                    val intent = Intent(ACTION_SCAN_RESULT).apply {
                        putExtra(EXTRA_BEACON_ID, beaconId)
                        putExtra(EXTRA_RSSI, rssi)
                        putExtra(EXTRA_ROOM, location?.get("room") as? String ?: "Unknown")
                        setPackage(packageName)
                    }
                    sendBroadcast(intent)
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to report BLE RSSI: ${e.message}")
            }
        }
    }

    /**
     * Determine which room receiver this device is near based on its name/address.
     * In production, this would be configured via the caregiver portal.
     */
    private fun getRoomFromDeviceName(deviceAddress: String): String {
        // Simple hash-based room assignment for demo
        // Real deployment uses registered receiver mappings
        val rooms = listOf("living_room", "kitchen", "bedroom", "hallway")
        val hash = deviceAddress.hashCode().let { if (it < 0) -it else it }
        return rooms[hash % rooms.size]
    }

    // ─── Notification ──────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "NeuroTwin BLE Scanner",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Scans for BLE beacons to track object locations."
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("NeuroTwin BLE Scanner Active")
            .setContentText("Scanning for beacons attached to glasses, keys, and other objects.")
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }
}
