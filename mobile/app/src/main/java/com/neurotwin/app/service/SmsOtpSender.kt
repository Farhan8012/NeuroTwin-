package com.neurotwin.app.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.telephony.SmsManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.neurotwin.app.MainActivity
import com.neurotwin.app.R

/**
 * Dispatches real OTP messages directly using:
 * 1. Phone SIM Card hardware (android.telephony.SmsManager) for real cellular carrier SMS
 * 2. Android System Heads-Up Notification (Sound + Vibration + Status bar banner)
 * 3. WhatsApp Direct API / Intent when selected
 */
object SmsOtpSender {
    private const val TAG = "SmsOtpSender"
    private const val CHANNEL_ID = "neurotwin_otp_channel"
    private const val NOTIFICATION_ID = 8849

    fun initNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "NeuroTwin Security Codes"
            val desc = "Real-time OTP verification codes and alerts"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = desc
                enableVibration(true)
                setShowBadge(true)
            }
            val manager = context.getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    /**
     * Sends a REAL SMS message via the phone's physical SIM card and
     * simultaneously triggers a high-priority heads-up system notification.
     */
    fun sendRealSmsOtp(context: Context, destinationPhone: String, otpCode: String): Boolean {
        initNotificationChannel(context)

        val cleanPhone = destinationPhone.replace(" ", "").trim()
        val messageBody = "Your NeuroTwin verification code is: $otpCode. Valid for 5 minutes. Remember Together."

        var smsSent = false

        // 1. Send real cellular carrier SMS from the device SIM card
        val hasSmsPermission = ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED

        if (hasSmsPermission) {
            try {
                val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    context.getSystemService(SmsManager::class.java) ?: SmsManager.getDefault()
                } else {
                    @Suppress("DEPRECATION")
                    SmsManager.getDefault()
                }

                smsManager.sendTextMessage(cleanPhone, null, messageBody, null, null)
                smsSent = true
                Log.i(TAG, "✅ Real SIM card SMS successfully transmitted to $cleanPhone")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to send SMS via SIM card: ${e.message}", e)
            }
        } else {
            Log.w(TAG, "⚠️ SEND_SMS permission not yet granted by user")
        }

        // 2. Always deliver an immediate real Android Heads-Up Notification to the status bar
        try {
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.app_logo_zoomed)
                .setContentTitle("MESSAGE · OTP")
                .setContentText("$otpCode is your NeuroTwin verification code.")
                .setStyle(
                    NotificationCompat.BigTextStyle()
                        .bigText("$otpCode is your NeuroTwin verification code.\nValid for 5 minutes.")
                )
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .build()

            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(NOTIFICATION_ID, notification)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to display notification: ${e.message}")
        }

        return smsSent
    }

    /**
     * Launches WhatsApp with pre-filled OTP message to the recipient number.
     */
    fun openWhatsAppWithOtp(context: Context, destinationPhone: String, otpCode: String) {
        val cleanPhone = destinationPhone.replace("+", "").replace(" ", "").trim()
        val message = "Your NeuroTwin verification code is: $otpCode"
        try {
            val uri = Uri.parse("https://api.whatsapp.com/send?phone=$cleanPhone&text=${Uri.encode(message)}")
            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open WhatsApp: ${e.message}")
        }
    }
}
