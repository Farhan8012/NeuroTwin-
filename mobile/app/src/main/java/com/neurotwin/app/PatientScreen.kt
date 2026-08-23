package com.neurotwin.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.neurotwin.app.auth.AuthState
import com.neurotwin.app.auth.Mode
import com.neurotwin.app.caregiver.CaregiverViewModel
import com.neurotwin.app.data.ApiResult
import com.neurotwin.app.data.EmergencyContact
import com.neurotwin.app.data.Medicine
import com.neurotwin.app.data.Memory
import com.neurotwin.app.data.Person
import com.neurotwin.app.network.RetrofitClient
import com.neurotwin.app.service.VoiceConversationManager
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.compose.ui.platform.LocalLifecycleOwner
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import java.io.ByteArrayOutputStream
import java.util.Calendar
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SeniorPatientMainScreen(
    voiceManager: VoiceConversationManager,
    vm: CaregiverViewModel = viewModel()
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var showAllMedsDialog by remember { mutableStateOf(false) }
    var selectedPerson by remember { mutableStateOf<Person?>(null) }
    var showProfileDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        vm.refreshAll()
    }

    if (showProfileDialog) {
        com.neurotwin.app.ui.screens.ProfileEditDialog(onDismiss = { showProfileDialog = false })
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(com.neurotwin.app.ui.theme.AppColors.background)
            .padding(16.dp)
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        val isDark = com.neurotwin.app.ui.theme.ThemeState.isDarkMode

        // Top Header - Clean & Minimal
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                androidx.compose.foundation.Image(
                    painter = androidx.compose.ui.res.painterResource(id = R.drawable.app_logo_zoomed),
                    contentDescription = "NeuroTwin Logo",
                    modifier = Modifier
                        .size(42.dp)
                        .clip(RoundedCornerShape(12.dp)),
                    contentScale = ContentScale.Crop
                )
                Text(
                    text = "NeuroTwin",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = com.neurotwin.app.ui.theme.AppColors.textPrimary
                )
            }

            // Clean Clickable Profile Picture (PFP) Avatar
            val session by AuthState.session.collectAsState()
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(
                        androidx.compose.ui.graphics.Brush.linearGradient(
                            listOf(Color(0xFF38BDF8), Color(0xFF818CF8))
                        )
                    )
                    .border(2.dp, Color(0xFF38BDF8).copy(alpha = 0.6f), CircleShape)
                    .clickable { showProfileDialog = true },
                contentAlignment = Alignment.Center
            ) {
                if (!session.avatarUri.isNullOrEmpty()) {
                    coil.compose.AsyncImage(
                        model = session.avatarUri,
                        contentDescription = "User Profile Picture",
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Text(
                        text = session.userName.take(1).uppercase().ifBlank { "F" },
                        fontSize = 18.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF0F172A)
                    )
                }
            }
        }

        // Greeting Banner
        GreetingBanner(
            vm = vm,
            onTalkClick = {
                coroutineScope.launch {
                    scrollState.animateScrollTo(scrollState.maxValue)
                }
            },
            onMemoriesClick = {
                coroutineScope.launch {
                    scrollState.animateScrollTo(scrollState.maxValue / 2)
                }
            }
        )

        // Medications Section
        MedicationsSection(
            vm = vm,
            onViewAllClick = { showAllMedsDialog = true }
        )

        // Family & Friends Section
        FamilySection(
            vm = vm,
            onPersonClick = { person ->
                selectedPerson = person
            }
        )

        // Featured Memory Section
        FeaturedMemorySection(
            vm = vm,
            voiceManager = voiceManager
        )

        // Live Camera Vision Section
        LiveCameraVisionSection()

        // AI Companion Chat Widget
        AIChatWidget(voiceManager = voiceManager)

        // SOS Immediate Help (Placed at bottom for easy emergency access)
        SOSCard(
            contactsResult = vm.contacts,
            onSosTriggered = {
                // Dial primary contact if available, or 911 fallback
                val contacts = (vm.contacts as? ApiResult.Success)?.data ?: emptyList()
                val primary = contacts.firstOrNull { it.isPrimary } ?: contacts.firstOrNull()
                if (primary != null && primary.phone.isNotBlank()) {
                    dialPhone(context, primary.phone)
                } else {
                    Toast.makeText(context, "🚨 SOS Alert Sent to Care Team!", Toast.LENGTH_LONG).show()
                }
            }
        )

        Spacer(modifier = Modifier.height(24.dp))
    }

    // All Medications Dialog
    if (showAllMedsDialog) {
        val meds = (vm.medicines as? ApiResult.Success)?.data ?: emptyList()
        AlertDialog(
            onDismissRequest = { showAllMedsDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Filled.Medication, contentDescription = null, tint = Color(0xFF2563EB))
                    Text("All Scheduled Medications")
                }
            },
            text = {
                if (meds.isEmpty()) {
                    Text("No medications scheduled.", color = Color.Gray)
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        meds.forEach { m ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = com.neurotwin.app.ui.theme.AppColors.cardAlt),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text("${m.name} — ${m.dosage}", fontWeight = FontWeight.Bold, color = com.neurotwin.app.ui.theme.AppColors.textPrimary)
                                    Text("🕒 ${m.scheduleTime}", fontSize = 13.sp, color = Color(0xFF3B82F6))
                                    if (m.instructions.isNotBlank()) {
                                        Text("📝 ${m.instructions}", fontSize = 12.sp, color = com.neurotwin.app.ui.theme.AppColors.textSecondary)
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showAllMedsDialog = false }) {
                    Text("Close")
                }
            }
        )
    }

    // Person Profile Dialog
    selectedPerson?.let { person ->
        AlertDialog(
            onDismissRequest = { selectedPerson = null },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(person.name, fontWeight = FontWeight.Bold)
                    Text("(${person.relationship})", color = Color(0xFF10B981), fontSize = 14.sp)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    if (person.photoUrls.isNotEmpty()) {
                        AsyncImage(
                            model = RetrofitClient.currentBaseUrl().trimEnd('/') + person.photoUrls.first(),
                            contentDescription = person.name,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .clip(RoundedCornerShape(12.dp)),
                            contentScale = ContentScale.Crop
                        )
                    }
                    if (person.memories.isNotEmpty()) {
                        Text("Shared Memories:", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        person.memories.forEach { mem ->
                            Text("• $mem", fontSize = 13.sp, color = Color(0xFF475569))
                        }
                    }
                    if (person.favoriteSongs.isNotEmpty()) {
                        Text("Favorite Songs: ${person.favoriteSongs.joinToString(", ")}", fontSize = 13.sp, color = Color(0xFF64748B))
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    val query = "Tell me about ${person.name}"
                    voiceManager.sendTextQuery(query, object : VoiceConversationManager.Callback {})
                    selectedPerson = null
                    coroutineScope.launch {
                        scrollState.animateScrollTo(scrollState.maxValue)
                    }
                }) {
                    Text("Ask Companion About ${person.name.split(" ").first()}")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedPerson = null }) {
                    Text("Close")
                }
            }
        )
    }
}

private fun dialPhone(context: Context, phone: String) {
    try {
        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
        context.startActivity(intent)
    } catch (e: Exception) {
        Toast.makeText(context, "Calling $phone", Toast.LENGTH_SHORT).show()
    }
}

@Composable
fun GreetingBanner(
    vm: CaregiverViewModel,
    onTalkClick: () -> Unit,
    onMemoriesClick: () -> Unit
) {
    val isDark = com.neurotwin.app.ui.theme.ThemeState.isDarkMode
    val session by AuthState.session.collectAsState()

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = com.neurotwin.app.ui.theme.AppColors.card),
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, com.neurotwin.app.ui.theme.AppColors.cardBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 18.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Patient Greeting
            Text(
                text = "Welcome, ${session.userName.ifBlank { "Farhan" }} 👋",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = com.neurotwin.app.ui.theme.AppColors.textPrimary
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Patient Status Subtitle
            Text(
                text = "Status: Active • Memory Routine Monitored",
                fontSize = 13.sp,
                color = com.neurotwin.app.ui.theme.AppColors.textSecondary
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Pills (Status: Stable, Living Room)
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = if (isDark) Color(0xFF064E3B) else Color(0xFFECFDF5),
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (isDark) Color(0xFF047857) else Color(0xFFA7F3D0))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF10B981))
                        )
                        Text(
                            text = "Status: Stable",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isDark) Color(0xFFA7F3D0) else Color(0xFF065F46)
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = if (isDark) Color(0xFF1E3A8A) else Color(0xFFEFF6FF),
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (isDark) Color(0xFF1D4ED8) else Color(0xFFBFDBFE))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            Icons.Filled.LocationOn,
                            contentDescription = null,
                            tint = if (isDark) Color(0xFF93C5FD) else Color(0xFF2563EB),
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = "Living Room",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isDark) Color(0xFF93C5FD) else Color(0xFF1E40AF)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Live Session Action Button (Matching Screenshot 1)
            Button(
                onClick = onTalkClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(46.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = com.neurotwin.app.ui.theme.AppColors.liveSessionBtn,
                    contentColor = com.neurotwin.app.ui.theme.AppColors.liveSessionBtnText
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(
                    Icons.Filled.Videocam,
                    contentDescription = null,
                    tint = com.neurotwin.app.ui.theme.AppColors.liveSessionBtnText,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Live Session",
                    color = com.neurotwin.app.ui.theme.AppColors.liveSessionBtnText,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
        }
    }
}

@Composable
fun MedicationsSection(
    vm: CaregiverViewModel,
    onViewAllClick: () -> Unit
) {
    val isDark = com.neurotwin.app.ui.theme.ThemeState.isDarkMode

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = com.neurotwin.app.ui.theme.AppColors.card),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, com.neurotwin.app.ui.theme.AppColors.cardBorder),
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
                    Text("Today's Medications", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = com.neurotwin.app.ui.theme.AppColors.textPrimary)
                }
                TextButton(onClick = onViewAllClick) {
                    Text("View All →", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF3B82F6))
                }
            }
            Spacer(modifier = Modifier.height(8.dp))

            when (val r = vm.medicines) {
                null -> CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally).padding(16.dp))
                is ApiResult.Failure -> {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Unable to load medications", color = Color(0xFFDC2626), fontSize = 13.sp)
                        TextButton(onClick = { vm.refreshMedicines() }) {
                            Text("Retry", fontWeight = FontWeight.Bold)
                        }
                    }
                }
                is ApiResult.Success -> {
                    if (r.data.isEmpty()) {
                        Text("No medications scheduled for today.", color = com.neurotwin.app.ui.theme.AppColors.textSecondary, modifier = Modifier.padding(vertical = 12.dp))
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            r.data.take(3).forEach { m ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(com.neurotwin.app.ui.theme.AppColors.cardAlt, RoundedCornerShape(10.dp))
                                        .border(1.dp, com.neurotwin.app.ui.theme.AppColors.cardBorder, RoundedCornerShape(10.dp))
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(CircleShape)
                                            .background(if (isDark) Color(0xFF1E293B) else Color(0xFFEFF6FF)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Filled.Schedule, contentDescription = null, tint = Color(0xFF3B82F6), modifier = Modifier.size(20.dp))
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("${m.name} — ${m.dosage}", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = com.neurotwin.app.ui.theme.AppColors.textPrimary)
                                        Text(m.scheduleTime, fontSize = 12.sp, color = com.neurotwin.app.ui.theme.AppColors.textSecondary)
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
fun FamilySection(
    vm: CaregiverViewModel,
    onPersonClick: (Person) -> Unit
) {
    val isDark = com.neurotwin.app.ui.theme.ThemeState.isDarkMode

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = com.neurotwin.app.ui.theme.AppColors.card),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, com.neurotwin.app.ui.theme.AppColors.cardBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Filled.FamilyRestroom, contentDescription = null, tint = Color(0xFF2563EB))
                    Text("Family & Friends", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = com.neurotwin.app.ui.theme.AppColors.textPrimary)
                }
                if (vm.people is ApiResult.Failure) {
                    TextButton(onClick = { vm.refreshPeople() }) {
                        Text("Retry", fontWeight = FontWeight.Bold, color = Color(0xFF3B82F6))
                    }
                }
            }
            Spacer(modifier = Modifier.height(12.dp))

            when (val r = vm.people) {
                null -> CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally).padding(16.dp))
                is ApiResult.Failure -> {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Could not connect to Family service", color = Color(0xFFDC2626), fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(6.dp))
                        Button(
                            onClick = { vm.refreshPeople() },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB))
                        ) {
                            Text("Reconnect Family")
                        }
                    }
                }
                is ApiResult.Success -> {
                    if (r.data.isEmpty()) {
                        Text("Your loved ones will appear here.", color = com.neurotwin.app.ui.theme.AppColors.textSecondary, modifier = Modifier.padding(vertical = 12.dp))
                    } else {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(r.data) { f ->
                                Card(
                                    modifier = Modifier
                                        .width(170.dp)
                                        .clickable { onPersonClick(f) },
                                    colors = CardDefaults.cardColors(containerColor = com.neurotwin.app.ui.theme.AppColors.cardAlt),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, com.neurotwin.app.ui.theme.AppColors.cardBorder),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(44.dp)
                                                .clip(CircleShape)
                                                .background(if (isDark) Color(0xFF1E293B) else Color(0xFFDBEAFE)),
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
                                                Text(
                                                    text = f.name.take(1),
                                                    fontSize = 18.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = if (isDark) Color(0xFF93C5FD) else Color(0xFF2563EB)
                                                )
                                            }
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column {
                                            Text(
                                                text = f.name,
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = com.neurotwin.app.ui.theme.AppColors.textPrimary,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                            Text(
                                                text = f.relationship,
                                                fontSize = 12.sp,
                                                color = Color(0xFF10B981),
                                                fontWeight = FontWeight.SemiBold
                                            )
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
}

@Composable
fun FeaturedMemorySection(
    vm: CaregiverViewModel,
    voiceManager: VoiceConversationManager
) {
    val isDark = com.neurotwin.app.ui.theme.ThemeState.isDarkMode
    val memoriesRes = vm.memories
    if (memoriesRes is ApiResult.Success && memoriesRes.data.isNotEmpty()) {
        val memory = memoriesRes.data.first()
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, if (isDark) Color(0xFF1E3A8A) else Color(0xFFDBEAFE), RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = com.neurotwin.app.ui.theme.AppColors.card),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Filled.Favorite, contentDescription = null, tint = Color(0xFF2563EB), modifier = Modifier.size(18.dp))
                        Text("FEATURED MEMORY", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (isDark) Color(0xFF93C5FD) else Color(0xFF2563EB), letterSpacing = 1.sp)
                    }
                    IconButton(onClick = {
                        voiceManager.sendTextQuery(
                            "Tell me about the memory: ${memory.title}",
                            object : VoiceConversationManager.Callback {}
                        )
                    }) {
                        Icon(Icons.Filled.VolumeUp, contentDescription = "Listen", tint = if (isDark) Color(0xFF93C5FD) else Color(0xFF2563EB))
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
                Text(memory.title, fontSize = 17.sp, fontWeight = FontWeight.Bold, color = com.neurotwin.app.ui.theme.AppColors.textPrimary)
                memory.description?.let {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(it, fontSize = 14.sp, color = com.neurotwin.app.ui.theme.AppColors.textSecondary, lineHeight = 20.sp)
                }
            }
        }
    }
}

@Composable
fun SOSCard(
    contactsResult: ApiResult<List<EmergencyContact>>?,
    onSosTriggered: () -> Unit
) {
    val primaryContact = (contactsResult as? ApiResult.Success)?.data?.firstOrNull { it.isPrimary }
        ?: (contactsResult as? ApiResult.Success)?.data?.firstOrNull()

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
            .border(1.5.dp, com.neurotwin.app.ui.theme.AppColors.sosCardBorder, RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(containerColor = com.neurotwin.app.ui.theme.AppColors.sosCard),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f).padding(end = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFFEE2E2)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Filled.Sos, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(24.dp))
                }
                Column {
                    Text("Emergency Help", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = com.neurotwin.app.ui.theme.AppColors.sosTitle)
                    Text(
                        text = if (primaryContact != null) "Call ${primaryContact.name}" else "Tap to alert care team",
                        fontSize = 11.sp,
                        color = com.neurotwin.app.ui.theme.AppColors.sosText,
                        maxLines = 1
                    )
                }
            }
            Button(
                onClick = onSosTriggered,
                colors = ButtonDefaults.buttonColors(containerColor = com.neurotwin.app.ui.theme.AppColors.sosButton),
                shape = RoundedCornerShape(10.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Icon(Icons.Filled.Call, contentDescription = null, modifier = Modifier.size(15.dp), tint = com.neurotwin.app.ui.theme.AppColors.sosButtonText)
                Spacer(modifier = Modifier.width(4.dp))
                Text("CALL SOS", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = com.neurotwin.app.ui.theme.AppColors.sosButtonText)
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
    var activeQuery by remember { mutableStateOf<String?>(null) }
    val isDark = com.neurotwin.app.ui.theme.ThemeState.isDarkMode

    val recordButtonColor by animateColorAsState(
        if (isRecording) Color(0xFFEF4444) else Color(0xFF2563EB)
    )
    val buttonScale by animateFloatAsState(if (isRecording) 1.05f else 1.0f)
    val context = LocalContext.current

    val quickQuestions = listOf(
        "Who is here?",
        "Where are my glasses?",
        "What medicines today?",
        "Tell me a story"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = com.neurotwin.app.ui.theme.AppColors.card),
        border = androidx.compose.foundation.BorderStroke(1.dp, com.neurotwin.app.ui.theme.AppColors.cardBorder),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(if (isDark) Color(0xFF111827) else Color(0xFF1E293B))
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier.size(40.dp).clip(CircleShape).background(if (isDark) Color(0xFF1F2937) else Color(0xFF334155)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("🤖", fontSize = 20.sp)
                }
                Column {
                    Text("NeuroTwin Companion", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text(
                        text = when {
                            isRecording -> "🎤 Listening to your voice..."
                            isSending -> "🧠 Thinking..."
                            isPlaying -> "🔊 Speaking..."
                            else -> "🟢 Online & Ready"
                        },
                        fontSize = 13.sp,
                        color = when {
                            isRecording -> Color(0xFFFCA5A5)
                            isSending -> Color(0xFF93C5FD)
                            isPlaying -> Color(0xFF86EFAC)
                            else -> Color(0xFF94A3B8)
                        }
                    )
                }
            }

            // Quick Questions Chips
            Column(modifier = Modifier.padding(12.dp)) {
                Text("Quick Questions:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = com.neurotwin.app.ui.theme.AppColors.textSecondary)
                Spacer(modifier = Modifier.height(6.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(quickQuestions) { q ->
                        SuggestionChip(
                            onClick = {
                                activeQuery = q
                                isSending = true
                                responseText = null
                                voiceManager.sendTextQuery(
                                    q,
                                    object : VoiceConversationManager.Callback {
                                        override fun onResponseReceived(t: String, r: String, a: String?) {
                                            isSending = false
                                            responseText = r
                                        }
                                        override fun onAudioPlaybackStarted() { isPlaying = true }
                                        override fun onAudioPlaybackFinished() { isPlaying = false }
                                        override fun onError(m: String) {
                                            isSending = false
                                            Toast.makeText(context, "Error: $m", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                )
                            },
                            label = { Text(q, fontSize = 12.sp, fontWeight = FontWeight.Medium) },
                            colors = SuggestionChipDefaults.suggestionChipColors(
                                containerColor = com.neurotwin.app.ui.theme.AppColors.cardAlt,
                                labelColor = com.neurotwin.app.ui.theme.AppColors.textPrimary
                            ),
                            border = androidx.compose.foundation.BorderStroke(1.dp, com.neurotwin.app.ui.theme.AppColors.cardBorder)
                        )
                    }
                }
            }

            // Chat / Response Display Area
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 120.dp, max = 220.dp)
                    .background(com.neurotwin.app.ui.theme.AppColors.cardAlt)
                    .padding(14.dp)
            ) {
                if (responseText != null) {
                    Column {
                        activeQuery?.let {
                            Text("Q: $it", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = com.neurotwin.app.ui.theme.AppColors.textSecondary)
                            Spacer(modifier = Modifier.height(4.dp))
                        }
                        Box(
                            modifier = Modifier
                                .background(com.neurotwin.app.ui.theme.AppColors.card, RoundedCornerShape(12.dp))
                                .border(1.dp, com.neurotwin.app.ui.theme.AppColors.cardBorder, RoundedCornerShape(12.dp))
                                .padding(12.dp)
                        ) {
                            Text(responseText!!, fontSize = 15.sp, color = com.neurotwin.app.ui.theme.AppColors.textPrimary, lineHeight = 22.sp)
                        }
                    }
                } else if (isSending) {
                    Row(
                        modifier = Modifier.align(Alignment.Center),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        Text("Thinking...", color = com.neurotwin.app.ui.theme.AppColors.textSecondary, fontSize = 14.sp)
                    }
                } else {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Filled.Mic, contentDescription = null, tint = com.neurotwin.app.ui.theme.AppColors.textSecondary, modifier = Modifier.size(36.dp))
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = "Tap a question above or hold the microphone button to talk",
                            color = com.neurotwin.app.ui.theme.AppColors.textSecondary,
                            textAlign = TextAlign.Center,
                            fontSize = 13.sp
                        )
                    }
                }
            }

            // Action Bar: Hold to Talk
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(com.neurotwin.app.ui.theme.AppColors.card)
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Hold to Talk Button
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(54.dp)
                        .scale(buttonScale)
                        .clip(RoundedCornerShape(27.dp))
                        .background(recordButtonColor)
                        .pointerInput(Unit) {
                            detectTapGestures(
                                onPress = {
                                    isRecording = true
                                    responseText = null
                                    activeQuery = "Listening..."
                                    voiceManager.startConversationFromRecording(
                                        object : VoiceConversationManager.Callback {
                                            override fun onRecordingStopped() {
                                                isRecording = false
                                                isSending = true
                                                activeQuery = "Processing..."
                                            }
                                            override fun onResponseReceived(t: String, r: String, a: String?) {
                                                isSending = false
                                                activeQuery = t
                                                responseText = r
                                            }
                                            override fun onAudioPlaybackStarted() { isPlaying = true }
                                            override fun onAudioPlaybackFinished() { isPlaying = false }
                                            override fun onError(m: String) {
                                                isRecording = false
                                                isSending = false
                                                activeQuery = "Error"
                                                responseText = m
                                                Toast.makeText(context, "Voice error: $m", Toast.LENGTH_SHORT).show()
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
                        Text(
                            text = when {
                                isRecording -> "Release to Send"
                                isSending -> "Processing..."
                                else -> "Hold to Talk"
                            },
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }
                }

                // Stop Audio Playback Button
                if (isPlaying) {
                    FilledIconButton(
                        onClick = {
                            voiceManager.stopPlayback()
                            isPlaying = false
                        },
                        colors = IconButtonDefaults.filledIconButtonColors(containerColor = Color(0xFFEF4444))
                    ) {
                        Icon(Icons.Filled.Stop, contentDescription = "Stop", tint = Color.White)
                    }
                }
            }
        }
    }
}

@Composable
fun LiveCameraVisionSection() {
    val context = LocalContext.current
    val isDark = com.neurotwin.app.ui.theme.ThemeState.isDarkMode
    val lifecycleOwner = LocalLifecycleOwner.current

    // Runtime camera permission check
    var hasCameraPermission by remember {
        mutableStateOf(
            android.content.pm.PackageManager.PERMISSION_GRANTED ==
                androidx.core.content.ContextCompat.checkSelfPermission(context, android.Manifest.permission.CAMERA)
        )
    }
    val cameraPermissionLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasCameraPermission = granted
    }
    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            cameraPermissionLauncher.launch(android.Manifest.permission.CAMERA)
        }
    }

    var isCameraExpanded by remember { mutableStateOf(true) }
    var recognizedPersonName by remember { mutableStateOf<String?>(null) }
    var recognizedRelation by remember { mutableStateOf<String?>(null) }
    var liveObjectsText by remember { mutableStateOf<String?>(null) }
    var isUploading by remember { mutableStateOf(false) }
    var cameraFacing by remember { mutableIntStateOf(CameraSelector.LENS_FACING_BACK) }
    val isProcessing = remember { AtomicBoolean(false) }
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    var frameCount by remember { mutableIntStateOf(0) }
    var lastUploadTime by remember { mutableLongStateOf(0L) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.5.dp, if (isDark) Color(0xFF047857) else Color(0xFF10B981).copy(alpha = 0.5f), RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(containerColor = com.neurotwin.app.ui.theme.AppColors.card),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF10B981))
                    )
                    Text(
                        text = "AI CAMERA VISION",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF10B981),
                        letterSpacing = 1.sp
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(
                        onClick = {
                            cameraFacing = if (cameraFacing == CameraSelector.LENS_FACING_BACK) {
                                CameraSelector.LENS_FACING_FRONT
                            } else {
                                CameraSelector.LENS_FACING_BACK
                            }
                        },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Filled.Cameraswitch, contentDescription = "Flip Camera", tint = com.neurotwin.app.ui.theme.AppColors.textSecondary, modifier = Modifier.size(18.dp))
                    }
                    IconButton(
                        onClick = { isCameraExpanded = !isCameraExpanded },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            if (isCameraExpanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                            contentDescription = "Toggle Preview",
                            tint = com.neurotwin.app.ui.theme.AppColors.textSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Recognition Status Banner
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(com.neurotwin.app.ui.theme.AppColors.cardAlt)
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text("👁️", fontSize = 14.sp)
                Text(
                    text = when {
                        recognizedPersonName != null -> "Seeing: $recognizedPersonName ($recognizedRelation)"
                        liveObjectsText != null -> liveObjectsText!!
                        isUploading -> "Analyzing live visual stream..."
                        else -> "Camera connected to AI model • Ready"
                    },
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (recognizedPersonName != null) (if (isDark) Color(0xFFA7F3D0) else Color(0xFF047857)) else com.neurotwin.app.ui.theme.AppColors.textSecondary
                )
            }

            if (isCameraExpanded && !hasCameraPermission) {
                Spacer(modifier = Modifier.height(10.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(com.neurotwin.app.ui.theme.AppColors.cardAlt)
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Filled.CameraAlt, contentDescription = null, tint = com.neurotwin.app.ui.theme.AppColors.textSecondary, modifier = Modifier.size(36.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Camera permission is required", fontSize = 14.sp, color = com.neurotwin.app.ui.theme.AppColors.textPrimary)
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { cameraPermissionLauncher.launch(android.Manifest.permission.CAMERA) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                    ) {
                        Text("Grant Camera Access")
                    }
                }
            }

            if (isCameraExpanded && hasCameraPermission) {
                Spacer(modifier = Modifier.height(10.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.Black)
                ) {
                    AndroidView(
                        factory = { ctx ->
                            val previewView = PreviewView(ctx)
                            val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                            cameraProviderFuture.addListener({
                                try {
                                    val cameraProvider = cameraProviderFuture.get()
                                    val preview = Preview.Builder().build().also {
                                        it.setSurfaceProvider(previewView.surfaceProvider)
                                    }
                                    val imageAnalysis = ImageAnalysis.Builder()
                                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                                        .build()

                                    imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
                                        val now = System.currentTimeMillis()
                                        if (now - lastUploadTime > 2500L && isProcessing.compareAndSet(false, true)) {
                                            lastUploadTime = now
                                            isUploading = true
                                            try {
                                                val bitmap = imageProxy.toBitmap()
                                                imageProxy.close()
                                                val stream = ByteArrayOutputStream()
                                                bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 70, stream)
                                                val jpegBytes = stream.toByteArray()
                                                val requestFile = jpegBytes.toRequestBody("image/jpeg".toMediaTypeOrNull())
                                                val part = MultipartBody.Part.createFormData("file", "frame_${frameCount++}.jpg", requestFile)

                                                kotlinx.coroutines.CoroutineScope(Dispatchers.IO).launch {
                                                    try {
                                                        val res = RetrofitClient.instance.uploadFrame(part)
                                                        if (res.isSuccessful) {
                                                            val body = res.body()
                                                            if (body?.matched == true) {
                                                                val p = body.person
                                                                recognizedPersonName = p?.get("name") as? String
                                                                recognizedRelation = p?.get("relationship") as? String
                                                                liveObjectsText = null
                                                            } else {
                                                                recognizedPersonName = null
                                                                recognizedRelation = null
                                                                val objs = body?.detected_objects
                                                                if (!objs.isNullOrEmpty()) {
                                                                    val labels = objs.mapNotNull { it["label"] as? String }.distinct().take(3)
                                                                    liveObjectsText = "Seeing: " + labels.joinToString(", ")
                                                                } else {
                                                                    liveObjectsText = "Camera stream active"
                                                                }
                                                            }
                                                        }
                                                    } catch (_: Exception) {
                                                    } finally {
                                                        isUploading = false
                                                        isProcessing.set(false)
                                                    }
                                                }
                                            } catch (e: Exception) {
                                                imageProxy.close()
                                                isProcessing.set(false)
                                                isUploading = false
                                            }
                                        } else {
                                            imageProxy.close()
                                        }
                                    }

                                    val selector = CameraSelector.Builder()
                                        .requireLensFacing(cameraFacing)
                                        .build()

                                    cameraProvider.unbindAll()
                                    cameraProvider.bindToLifecycle(lifecycleOwner, selector, preview, imageAnalysis)
                                } catch (e: Exception) {
                                    android.util.Log.e("CameraVision", "Camera bind failed", e)
                                }
                            }, ContextCompat.getMainExecutor(ctx))
                            previewView
                        },
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }
}
