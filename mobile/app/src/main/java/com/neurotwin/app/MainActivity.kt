package com.neurotwin.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.neurotwin.app.network.RetrofitClient
import com.neurotwin.app.network.VoiceRequest
import com.neurotwin.app.service.CameraForegroundService
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        if (cameraGranted) {
            startCameraService()
        } else {
            Toast.makeText(this, "Camera permission is required for ambient recognition", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate()
        checkAndRequestPermissions()

        setContent {
            NeuroTwinAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF0B0D12)
                ) {
                    NeuroTwinMainScreen(
                        onTriggerVoice = { query -> sendVoiceQuery(query) }
                    )
                }
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.BLUETOOTH_CONNECT)
        }

        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            permissionLauncher.launch(missing.toTypedArray())
        } else {
            startCameraService()
        }
    }

    private fun startCameraService() {
        val intent = Intent(this, CameraForegroundService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun sendVoiceQuery(query: String) {
        // Coroutine api call demo
    }
}

@Composable
fun NeuroTwinAppTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            background = Color(0xFF0B0D12),
            surface = Color(0xFF12151E),
            primary = Color(0xFFF0F3F8),
            secondary = Color(0xFF9DA6B8)
        ),
        content = content
    )
}

@Composable
fun NeuroTwinMainScreen(onTriggerVoice: (String) -> Unit) {
    var lastMatchPerson by remember { mutableStateOf("Sarah Varma (Daughter)") }
    var lastMatchConfidence by remember { mutableStateOf("94%") }
    var gateStatus by remember { mutableStateOf("ML Kit Gate: Face Detected (1.5 fps)") }
    var voiceResponseText by remember { mutableStateOf("This is your daughter Sarah. She visited you yesterday afternoon and brought your favorite blueberry muffins.") }
    var isProcessing by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header Status
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .background(Color(0xFF3FB950), shape = CircleShape)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "NeuroTwin Mobile Client",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFFF0F3F8)
                )
            }
            Text(
                text = "FastAPI: Connected",
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                color = Color(0xFF626B7D)
            )
        }

        // Camera Frame Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(280.dp)
                .border(1.dp, Color(0xFF242936), RoundedCornerShape(12.dp)),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF12151E))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(120.dp, 130.dp)
                            .border(1.5.dp, Color(0xFFF0F3F8), RoundedCornerShape(6.dp)),
                        contentAlignment = Alignment.TopStart
                    ) {
                        Text(
                            text = lastMatchConfidence,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF0B0D12),
                            modifier = Modifier
                                .background(Color(0xFFF0F3F8), RoundedCornerShape(2.dp))
                                .padding(horizontal = 4.dp, vertical = 2.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Active Face Match: $lastMatchPerson",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFFF0F3F8)
                    )
                    Text(
                        text = gateStatus,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        color = Color(0xFF9DA6B8)
                    )
                }
            }
        }

        // Voice Response Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Color(0xFF242936), RoundedCornerShape(12.dp)),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF181C27))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "EARPIECE AUDIO SPEECH RESPONSE",
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFF626B7D)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "\"$voiceResponseText\"",
                    fontSize = 14.sp,
                    color = Color(0xFFF0F3F8),
                    lineHeight = 20.sp
                )
            }
        }

        // Patient Voice Question Action Button
        Button(
            onClick = {
                scope.launch {
                    isProcessing = true
                    try {
                        val res = RetrofitClient.instance.sendVoiceQuery(VoiceRequest("Who is she?"))
                        if (res.isSuccessful) {
                            voiceResponseText = res.body()?.llm_response ?: voiceResponseText
                        }
                    } catch (e: Exception) {
                        // Fallback simulated response
                    } finally {
                        isProcessing = false
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF0F3F8))
        ) {
            Text(
                text = if (isProcessing) "Processing Speech..." else "Ask Companion: \"Who is she?\"",
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF0B0D12)
            )
        }
    }
}
