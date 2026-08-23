package com.neurotwin.app

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.neurotwin.app.auth.AuthState
import com.neurotwin.app.auth.Mode
import com.neurotwin.app.caregiver.CaregiverApp
import com.neurotwin.app.network.RetrofitClient
import com.neurotwin.app.service.BLEScannerService
import com.neurotwin.app.service.CameraForegroundService
import com.neurotwin.app.service.ServiceRestartWorker
import com.neurotwin.app.service.VoiceConversationManager
import com.neurotwin.app.ui.screens.ModeSelectScreen
import com.neurotwin.app.ui.theme.NeuroTwinTheme

class MainActivity : ComponentActivity() {

    private lateinit var voiceManager: VoiceConversationManager

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        val micGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false

        if (cameraGranted && AuthState.session.value.mode == Mode.PATIENT) {
            startPatientServices()
        }
        if (!micGranted) {
            Toast.makeText(this, "Microphone needed for voice conversations",
                Toast.LENGTH_LONG).show()
        }
    }

    // Broadcast receiver for face recognition from CameraForegroundService
    private val recognitionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            // Recognition updates flow through the camera service UI hooks
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        RetrofitClient.init(this)
        AuthState.rememberContext(this)
        com.neurotwin.app.ui.theme.ThemeState.init(this)

        voiceManager = VoiceConversationManager(this)

        // Register for recognition broadcasts
        val filter = IntentFilter(CameraForegroundService.ACTION_PERSON_RECOGNIZED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(recognitionReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(recognitionReceiver, filter)
        }

        setContent {
            NeuroTwinTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background,
                ) {
                    var showSplash by remember { mutableStateOf(true) }

                    if (showSplash) {
                        com.neurotwin.app.ui.screens.SplashScreen(onAnimationFinished = { showSplash = false })
                    } else {
                        val session = AuthState.session.collectAsState().value
                        if (!session.isLoggedIn) {
                            com.neurotwin.app.ui.screens.AuthScreen(
                                onAuthSuccess = { /* AuthState session automatically triggers recomposition */ }
                            )
                        } else {
                            when (session.mode) {
                                null -> ModeSelectScreen()
                                Mode.CAREGIVER -> {
                                    // Cancel watchdog — no services needed in caregiver mode
                                    ServiceRestartWorker.cancel(this@MainActivity)
                                    CaregiverApp()
                                }
                                Mode.PATIENT -> {
                                    ensurePermissions()
                                    SeniorPatientMainScreen(voiceManager)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun ensurePermissions() {
        checkAndRequestPermissions()
    }

    override fun onDestroy() {
        super.onDestroy()
        voiceManager.stop()
        try { unregisterReceiver(recognitionReceiver) } catch (_: Exception) {}
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            permissionLauncher.launch(missing.toTypedArray())
        } else {
            startPatientServices()
        }
    }

    private fun startPatientServices() {
        if (AuthState.session.value.mode != Mode.PATIENT) return

        // Start foreground services
        val cameraIntent = Intent(this, CameraForegroundService::class.java)
        val bleIntent = Intent(this, BLEScannerService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(cameraIntent)
            startForegroundService(bleIntent)
        } else {
            startService(cameraIntent)
            startService(bleIntent)
        }

        // Schedule WorkManager watchdog to restart services if OS kills them
        ServiceRestartWorker.schedule(this)
    }
}

