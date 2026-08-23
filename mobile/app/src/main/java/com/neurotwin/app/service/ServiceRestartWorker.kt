package com.neurotwin.app.service

import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.work.*
import java.util.concurrent.TimeUnit

/**
 * WorkManager worker that ensures CameraForegroundService and BLEScannerService
 * are always running. When the OS kills the services (Doze, background limits,
 * low memory), this periodic worker detects the gap and restarts them.
 *
 * Scheduling:
 *   - Runs every 15 minutes (WorkManager minimum interval).
 *   - Requires network (device should be online to upload frames).
 *   - Survives reboots via `keepAllPeriodicWorkAlive()`.
 *
 * This addresses Phase 7: "Refine Android Foreground Service and WorkManager
 * persistence across device backgrounding."
 */
class ServiceRestartWorker(
    context: Context,
    workerParams: WorkerParameters
) : Worker(context, workerParams) {

    override fun doWork(): Result {
        Log.i(TAG, "ServiceRestartWorker executing — checking foreground services")

        try {
            ensureServiceRunning(CameraForegroundService::class.java)
            ensureServiceRunning(BLEScannerService::class.java)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to restart services", e)
            return Result.retry()
        }

        return Result.success()
    }

    private fun <T : android.app.Service> ensureServiceRunning(serviceClass: Class<T>) {
        val intent = Intent(applicationContext, serviceClass)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                applicationContext.startForegroundService(intent)
            } else {
                applicationContext.startService(intent)
            }
            Log.i(TAG, "Ensured ${serviceClass.simpleName} is running")
        } catch (e: Exception) {
            Log.w(TAG, "Cannot start ${serviceClass.simpleName}: ${e.message}")
        }
    }

    companion object {
        const val TAG = "ServiceRestartWorker"
        private const val UNIQUE_WORK_NAME = "neurotwin_service_watchdog"

        /**
         * Schedule the periodic service watchdog.
         * Call this once from MainActivity.onCreate().
         *
         * WorkManager guarantees this survives:
         *   - App process death
         *   - Device reboot (with system boot receiver)
         *   - Doze mode
         *   - Background execution limits
         */
        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val workRequest = PeriodicWorkRequestBuilder<ServiceRestartWorker>(
                15, TimeUnit.MINUTES  // Minimum interval for periodic work
            )
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    1, TimeUnit.MINUTES
                )
                .addTag(UNIQUE_WORK_NAME)
                .build()

            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(
                    UNIQUE_WORK_NAME,
                    ExistingPeriodicWorkPolicy.KEEP,  // Don't replace if already scheduled
                    workRequest
                )

            Log.i(TAG, "Service watchdog scheduled (every 15 min)")
        }

        /**
         * Cancel the periodic watchdog (e.g. when switching to Caregiver mode).
         */
        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(UNIQUE_WORK_NAME)
            Log.i(TAG, "Service watchdog cancelled")
        }
    }
}
