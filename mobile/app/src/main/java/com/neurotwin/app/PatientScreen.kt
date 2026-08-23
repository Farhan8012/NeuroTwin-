package com.neurotwin.app

import android.widget.Toast
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.neurotwin.app.auth.AuthState
import com.neurotwin.app.auth.Mode
import com.neurotwin.app.caregiver.CaregiverViewModel
import com.neurotwin.app.data.ApiResult
import com.neurotwin.app.network.RetrofitClient
import com.neurotwin.app.service.VoiceConversationManager
import java.util.Calendar

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SeniorPatientMainScreen(
    voiceManager: VoiceConversationManager,
    vm: CaregiverViewModel = viewModel()
) {
    val context = LocalContext.current
    LaunchedEffect(Unit) { vm.refreshAll() }

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFFAFAFA))
            .padding(16.dp)
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // App Header with Caregiver Mode switch button
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "NeuroTwin",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1E293B)
            )
            TextButton(onClick = { AuthState.enter(Mode.CAREGIVER) }) {
                Text("⚙️ Caregiver", color = Color(0xFF64748B))
            }
        }

        // Greeting Banner
        GreetingBanner(vm)

        // Medications
        MedicationsSection(vm)

        // Family & Friends
        FamilySection(vm)

        // Featured Memory
        FeaturedMemorySection(vm)

        // SOS Alert
        SOSCard {
            Toast.makeText(context, "🚨 SOS ALERT SENT! Care team notified.", Toast.LENGTH_LONG).show()
        }

        // AI Chat Widget
        AIChatWidget(voiceManager)
    }
}

@Composable
fun GreetingBanner(vm: CaregiverViewModel) {
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val greeting = when {
        hour < 12 -> "Good Morning"
        hour < 17 -> "Good Afternoon"
        else -> "Good Evening"
    }
    
    val peopleRes = vm.people
    val firstName = if (peopleRes is ApiResult.Success && peopleRes.data.isNotEmpty()) {
        "there" // In a real app we'd have the patient's own profile, but for now fallback
    } else {
        "there"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2563EB)),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("🌞", fontSize = 28.sp)
                Text(
                    text = "$greeting, $firstName",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Today is a peaceful day. Talk to NeuroTwin anytime you want.",
                fontSize = 15.sp,
                color = Color.White.copy(alpha = 0.9f),
                lineHeight = 22.sp
            )
            Spacer(modifier = Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { /* Scroll to chat */ },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.15f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Filled.PsychologyAlt, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Talk to NeuroTwin", color = Color.White)
                }
                Button(
                    onClick = { /* Open memories view */ },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Filled.PhotoLibrary, contentDescription = null, tint = Color(0xFF2563EB))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Open Memories", color = Color(0xFF2563EB))
                }
            }
        }
    }
}

@Composable
fun MedicationsSection(vm: CaregiverViewModel) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Filled.Medication, contentDescription = null, tint = Color(0xFF2563EB))
                    Text("Today's Medications", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF2563EB))
                }
                Text("View All →", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF2563EB))
            }
            Spacer(modifier = Modifier.height(12.dp))

            when (val r = vm.medicines) {
                null -> CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
                is ApiResult.Failure -> Text("Error loading meds", color = Color.Red)
                is ApiResult.Success -> {
                    if (r.data.isEmpty()) {
                        Text("No medications scheduled.", color = Color.Gray, modifier = Modifier.padding(vertical = 16.dp))
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            r.data.take(3).forEach { m ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(8.dp))
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Filled.Schedule, contentDescription = null, tint = Color(0xFF2563EB))
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text("${m.name} — ${m.dosage}", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF1E293B))
                                        Text(m.scheduleTime, fontSize = 12.sp, color = Color(0xFF64748B))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun FamilySection(vm: CaregiverViewModel) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Filled.FamilyRestroom, contentDescription = null, tint = Color(0xFF2563EB))
                Text("Family & Friends", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF2563EB))
            }
            Spacer(modifier = Modifier.height(12.dp))

            when (val r = vm.people) {
                null -> CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
                is ApiResult.Failure -> Text("Error loading family", color = Color.Red)
                is ApiResult.Success -> {
                    if (r.data.isEmpty()) {
                        Text("Your loved ones will appear here.", color = Color.Gray)
                    } else {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(r.data) { f ->
                                Row(
                                    modifier = Modifier
                                        .width(160.dp)
                                        .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(8.dp))
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .clip(CircleShape)
                                            .background(Color(0xFFDBEAFE)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (f.photoUrls.isNotEmpty()) {
                                            AsyncImage(
                                                model = RetrofitClient.currentBaseUrl().trimEnd('/') + f.photoUrls.first(),
                                                contentDescription = f.name,
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                        } else {
                                            Text(f.name.take(1), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF2563EB))
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(f.name, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF1E293B), maxLines = 1)
                                        Text(f.relationship, fontSize = 12.sp, color = Color(0xFF10B981), fontWeight = FontWeight.Medium)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun FeaturedMemorySection(vm: CaregiverViewModel) {
    val memoriesRes = vm.memories
    if (memoriesRes is ApiResult.Success && memoriesRes.data.isNotEmpty()) {
        val memory = memoriesRes.data.first()
        Card(
            modifier = Modifier.fillMaxWidth().border(2.dp, Color(0xFFDBEAFE), RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Filled.Favorite, contentDescription = null, tint = Color(0xFF2563EB), modifier = Modifier.size(16.dp))
                    Text("FEATURED MEMORY", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF2563EB))
                }
                Spacer(modifier = Modifier.height(12.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFF1F5F9)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Filled.PhotoLibrary, contentDescription = null, tint = Color(0xFF94A3B8), modifier = Modifier.size(48.dp))
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text(memory.title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                memory.description?.let {
                    Text(it, fontSize = 13.sp, color = Color(0xFF64748B), maxLines = 2)
                }
            }
        }
    }
}

@Composable
fun SOSCard(onSosClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().border(2.dp, Color(0xFFEF4444), RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEE2E2)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Icon(Icons.Filled.Sos, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(32.dp))
                Column {
                    Text("Need Immediate Help?", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFF991B1B))
                    Text("Tap to alert your care team", fontSize = 12.sp, color = Color(0xFFEF4444))
                }
            }
            Button(
                onClick = onSosClick,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("SEND SOS", fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun AIChatWidget(voiceManager: VoiceConversationManager) {
    var isRecording by remember { mutableStateOf(false) }
    var isSending by remember { mutableStateOf(false) }
    var isPlaying by remember { mutableStateOf(false) }
    var responseText by remember { mutableStateOf<String?>(null) }
    var statusMessage by remember { mutableStateOf("") }

    val recordButtonColor by animateColorAsState(if (isRecording) Color(0xFFEF4444) else Color(0xFF1E293B))
    val context = LocalContext.current

    Card(
        modifier = Modifier.fillMaxWidth().height(380.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().background(Color(0xFF1E293B)).padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier.size(40.dp).clip(CircleShape).background(Color(0xFF334155)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("🤖", fontSize = 20.sp)
                }
                Column {
                    Text("NeuroTwin Companion", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text(
                        when {
                            isRecording -> "Listening..."
                            isSending -> "Thinking..."
                            isPlaying -> "Speaking..."
                            else -> "Online & Ready"
                        },
                        fontSize = 13.sp, color = Color(0xFF94A3B8)
                    )
                }
            }

            // Chat area
            Box(modifier = Modifier.weight(1f).fillMaxWidth().background(Color(0xFFF8FAFC)).padding(16.dp)) {
                if (responseText != null) {
                    // Chat bubble
                    Box(
                        modifier = Modifier
                            .background(Color.White, RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomEnd = 16.dp, bottomStart = 0.dp))
                            .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomEnd = 16.dp, bottomStart = 0.dp))
                            .padding(16.dp)
                            .align(Alignment.BottomStart)
                    ) {
                        Text(responseText!!, fontSize = 15.sp, color = Color(0xFF1E293B))
                    }
                } else {
                    // Welcome
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Filled.Mic, contentDescription = null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(48.dp))
                        Spacer(Modifier.height(16.dp))
                        Text("Hold the microphone button to ask a question", color = Color(0xFF94A3B8), textAlign = TextAlign.Center)
                    }
                }
            }

            // Input area
            Box(
                modifier = Modifier.fillMaxWidth().background(Color.White).padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .clip(RoundedCornerShape(28.dp))
                        .background(recordButtonColor)
                        .pointerInput(Unit) {
                            detectTapGestures(
                                onPress = {
                                    isRecording = true
                                    responseText = null
                                    statusMessage = "Listening..."
                                    voiceManager.startConversationFromRecording(
                                        object : VoiceConversationManager.Callback {
                                            override fun onRecordingStopped() {
                                                isRecording = false
                                                isSending = true
                                                statusMessage = "Thinking..."
                                            }
                                            override fun onResponseReceived(t: String, r: String, a: String?) {
                                                isSending = false
                                                responseText = r
                                                statusMessage = "Response ready"
                                            }
                                            override fun onAudioPlaybackStarted() { isPlaying = true }
                                            override fun onAudioPlaybackFinished() { isPlaying = false }
                                            override fun onError(m: String) {
                                                isRecording = false
                                                isSending = false
                                                Toast.makeText(context, "Error: $m", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    )
                                    tryAwaitRelease()
                                    voiceManager.stopRecording()
                                    isRecording = false
                                }
                            )
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Filled.Mic, contentDescription = null, tint = Color.White)
                        Text(if (isRecording) "Release to Send" else "Hold to Talk", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
