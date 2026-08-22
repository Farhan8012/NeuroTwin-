package com.neurotwin.app

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neurotwin.app.service.VoiceConversationManager

/**
 * The senior-patient companion experience — unchanged from v1.
 * Large type, hold-to-talk voice, recognized-person card.
 */
@Composable
fun SeniorPatientMainScreen(voiceManager: VoiceConversationManager) {
    var recognizedPerson by remember { mutableStateOf("Sarah Varma") }
    var relationship by remember { mutableStateOf("Your Daughter") }
    var summaryText by remember { mutableStateOf("Tap the microphone and ask a question. I'm here to help you remember.") }

    // Voice conversation state
    var isRecording by remember { mutableStateOf(false) }
    var isSending by remember { mutableStateOf(false) }
    var isPlaying by remember { mutableStateOf(false) }
    var responseText by remember { mutableStateOf<String?>(null) }
    var responseAudioUrl by remember { mutableStateOf<String?>(null) }
    var statusMessage by remember { mutableStateOf("") }

    val recordButtonColor by animateColorAsState(
        if (isRecording) Color(0xFFEF4444) else Color.White,
        label = "record_btn"
    )
    val recordButtonTextColor by animateColorAsState(
        if (isRecording) Color.White else Color(0xFF090A0F),
        label = "record_btn_text"
    )

    // Cleanup on dispose
    DisposableEffect(Unit) {
        onDispose { voiceManager.stop() }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // App Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "NeuroTwin Companion",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        // Senior Hero Recognized Person Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(2.dp, Color(0xFF2C334A), RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1C2030))
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text(
                    text = relationship.uppercase(),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFFBBF24),
                    modifier = Modifier
                        .background(Color(0x26FBBF24), RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = recognizedPerson,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = summaryText,
                    fontSize = 18.sp,
                    color = Color(0xFFC5CBD8),
                    lineHeight = 26.sp
                )
            }
        }

        // ===== VOICE CONVERSATION: Big Hold-to-Talk Button =====
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(88.dp)
                .background(recordButtonColor, RoundedCornerShape(16.dp))
                .pointerInput(Unit) {
                    detectTapGestures(
                        onPress = {
                            // Finger down → start recording
                            isRecording = true
                            statusMessage = "🎤 Listening... speak now"
                            responseText = null

                            voiceManager.startConversationFromRecording(
                                object : VoiceConversationManager.Callback {
                                    override fun onRecordingStopped() {
                                        isRecording = false
                                        isSending = true
                                        statusMessage = "🧠 Thinking..."
                                    }
                                    override fun onResponseReceived(transcript: String, response: String, audioUrl: String?) {
                                        isSending = false
                                        responseText = response
                                        responseAudioUrl = audioUrl
                                        statusMessage = "✓ Response ready"
                                    }
                                    override fun onAudioPlaybackStarted() {
                                        isPlaying = true
                                        statusMessage = "🔊 Playing response..."
                                    }
                                    override fun onAudioPlaybackFinished() {
                                        isPlaying = false
                                        statusMessage = ""
                                    }
                                    override fun onError(message: String) {
                                        isRecording = false
                                        isSending = false
                                        statusMessage = "⚠ $message"
                                    }
                                }
                            )

                            tryAwaitRelease()

                            // Finger up → stop recording
                            voiceManager.stopRecording()
                            isRecording = false
                        }
                    )
                },
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = when {
                        isRecording -> "🎤 Listening..."
                        isSending -> "🧠 Thinking..."
                        isPlaying -> "🔊 Playing..."
                        else -> "🎙️ Hold to Talk"
                    },
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = recordButtonTextColor
                )
                if (statusMessage.isNotEmpty() && !isRecording) {
                    Text(
                        text = statusMessage,
                        fontSize = 14.sp,
                        color = recordButtonTextColor.copy(alpha = 0.7f)
                    )
                }
            }
        }

        // Status indicator
        if (statusMessage.isNotEmpty() && !isRecording) {
            Text(
                text = statusMessage,
                fontSize = 16.sp,
                color = when {
                    statusMessage.startsWith("⚠") -> Color(0xFFEF4444)
                    statusMessage.startsWith("✓") -> Color(0xFF22C55E)
                    else -> Color(0xFFC5CBD8)
                },
                textAlign = TextAlign.Center
            )
        }

        // ===== RESPONSE DISPLAY =====
        if (responseText != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(2.dp, Color(0xFFFBBF24), RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1C2030))
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Companion Response",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFFBBF24),
                        modifier = Modifier
                            .background(Color(0x26FBBF24), RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = responseText!!,
                        fontSize = 20.sp,
                        color = Color.White,
                        lineHeight = 28.sp
                    )

                    // Play audio button if available
                    if (responseAudioUrl != null) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = {
                                val url = responseAudioUrl!!
                                val fullUrl = if (url.startsWith("http")) url else "http://10.0.2.2:8000$url"
                                // Use MediaPlayer directly for playback
                                try {
                                    val mp = android.media.MediaPlayer()
                                    mp.setDataSource(fullUrl)
                                    mp.setOnPreparedListener { mp.start() }
                                    mp.setOnCompletionListener { it.release() }
                                    mp.prepareAsync()
                                    isPlaying = true
                                } catch (e: Exception) { /* ignore */ }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(56.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFBBF24))
                        ) {
                            Text(
                                text = "🔊 Play Audio Response",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF090A0F)
                            )
                        }
                    }
                }
            }
        }

        // ===== QUICK ACTION BUTTONS =====
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Quick text query buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickQueryButton(
                    label = "👤 Who is this?",
                    query = "Who is this person?",
                    voiceManager = voiceManager,
                    enabled = !isSending,
                    onStarted = { isSending = true; statusMessage = "🧠 Thinking..." },
                    onResponse = { response, audio ->
                        isSending = false; responseText = response; responseAudioUrl = audio
                        statusMessage = "✓ Response ready"
                    },
                    onError = { isSending = false; statusMessage = "⚠ $it" },
                    modifier = Modifier.weight(1f),
                )

                QuickQueryButton(
                    label = "🔍 Where are my glasses?",
                    query = "Where are my glasses?",
                    voiceManager = voiceManager,
                    enabled = !isSending,
                    onStarted = { isSending = true; statusMessage = "🧠 Thinking..." },
                    onResponse = { response, audio ->
                        isSending = false; responseText = response; responseAudioUrl = audio
                        statusMessage = "✓ Response ready"
                    },
                    onError = { isSending = false; statusMessage = "⚠ $it" },
                    modifier = Modifier.weight(1f),
                )
            }

            // Play music button (stub until audio assets land)
            Button(
                onClick = { /* Play music via TTS or bundled audio */ },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF131622))
            ) {
                Text(
                    text = "🎵 Play \"You Are My Sunshine\"",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
            }

            // Call emergency contact (stub until contact fetch lands)
            Button(
                onClick = { /* Initiate phone call */ },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF131622))
            ) {
                Text(
                    text = "📞 Call Daughter Sarah",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
            }
        }
    }
}

@Composable
private fun QuickQueryButton(
    label: String,
    query: String,
    voiceManager: VoiceConversationManager,
    enabled: Boolean,
    onStarted: () -> Unit,
    onResponse: (String, String?) -> Unit,
    onError: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Button(
        onClick = {
            onStarted()
            voiceManager.sendTextQuery(query, object : VoiceConversationManager.Callback {
                override fun onResponseReceived(transcript: String, response: String, audioUrl: String?) =
                    onResponse(response, audioUrl)
                override fun onError(message: String) = onError(message)
            })
        },
        enabled = enabled,
        modifier = modifier.height(64.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF131622))
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White
        )
    }
}
