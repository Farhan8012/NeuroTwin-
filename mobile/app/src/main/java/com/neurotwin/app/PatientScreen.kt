package com.neurotwin.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.HealthAndSafety
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.QuestionAnswer
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neurotwin.app.caregiver.CaregiverViewModel
import com.neurotwin.app.data.ApiResult
import com.neurotwin.app.data.EmergencyContact
import com.neurotwin.app.data.Medicine
import com.neurotwin.app.data.Memory
import com.neurotwin.app.data.MemoryCategories
import com.neurotwin.app.network.RetrofitClient
import com.neurotwin.app.service.CameraForegroundService
import com.neurotwin.app.service.VoiceConversationManager
import com.neurotwin.app.ui.theme.NtDanger
import com.neurotwin.app.ui.theme.NtGold
import com.neurotwin.app.ui.theme.NtSuccess

fun categoryLabel(cat: String): String =
    MemoryCategories.API_TO_WEB[cat] ?: cat.replace('_', ' ')

fun categoryEmoji(cat: String): String = when (cat) {
    "story" -> "👨‍👩‍👧"
    "place" -> "✈️"
    "song" -> "🎵"
    "life_event" -> "🎓"
    "hobby" -> "🍳"
    "anecdote" -> "😄"
    else -> "🧠"
}

private fun playTts(url: String?, onDone: () -> Unit = {}): Boolean {
    if (url.isNullOrBlank()) return false
    val full = if (url.startsWith("http")) url
    else RetrofitClient.currentBaseUrl().trimEnd('/') + "/" + url.trimStart('/')
    return try {
        val mp = MediaPlayer()
        mp.setDataSource(full)
        mp.setOnPreparedListener { it.start() }
        mp.setOnCompletionListener { it.release(); onDone() }
        mp.setOnErrorListener { _, _, _ -> onDone(); true }
        mp.prepareAsync()
        true
    } catch (e: Exception) {
        false
    }
}

private fun dial(context: Context, phone: String) {
    val tel = phone.filter { it.isDigit() || it == '+' }
    context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$tel")))
}

private fun greeting(): String {
    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    return when (hour) {
        in 5..11 -> "Good Morning"
        in 12..17 -> "Good Afternoon"
        else -> "Good Evening"
    }
}

@Composable
fun SeniorPatientMainScreen(
    voiceManager: VoiceConversationManager,
    vm: CaregiverViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
) {
    var tab by remember { mutableIntStateOf(0) }
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        if (vm.memories == null) vm.refreshMemories()
        if (vm.medicines == null) vm.refreshMedicines()
        if (vm.contacts == null) vm.refreshContacts()
    }

    var recognizedName by remember { mutableStateOf<String?>(null) }
    var recognizedRelation by remember { mutableStateOf("") }
    DisposableEffect(Unit) {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(c: Context?, i: Intent?) {
                recognizedName = i?.getStringExtra(CameraForegroundService.EXTRA_PERSON_NAME)
                recognizedRelation =
                    i?.getStringExtra(CameraForegroundService.EXTRA_PERSON_RELATION) ?: ""
            }
        }
        val filter = IntentFilter(CameraForegroundService.ACTION_PERSON_RECOGNIZED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(receiver, filter)
        }
        onDispose { runCatching { context.unregisterReceiver(receiver) } }
    }

    DisposableEffect(Unit) { onDispose { voiceManager.stop() } }

    val doneMap = remember { mutableStateMapOf<String, Boolean>() }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                NavigationBarItem(
                    selected = tab == 0, onClick = { tab = 0 },
                    icon = { Icon(Icons.Filled.Home, contentDescription = null) },
                    label = { Text("Home") },
                )
                NavigationBarItem(
                    selected = tab == 1, onClick = { tab = 1 },
                    icon = { Icon(Icons.Filled.PhotoLibrary, contentDescription = null) },
                    label = { Text("Memories") },
                )
                NavigationBarItem(
                    selected = tab == 2, onClick = { tab = 2 },
                    icon = { Icon(Icons.Filled.QuestionAnswer, contentDescription = null) },
                    label = { Text("Ask") },
                )
                NavigationBarItem(
                    selected = tab == 3, onClick = { tab = 3 },
                    icon = { Icon(Icons.Filled.Schedule, contentDescription = null) },
                    label = { Text("Reminders") },
                )
                NavigationBarItem(
                    selected = tab == 4, onClick = { tab = 4 },
                    icon = { Icon(Icons.Filled.HealthAndSafety, contentDescription = null) },
                    label = { Text("SOS") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = MaterialTheme.colorScheme.error,
                        selectedTextColor = MaterialTheme.colorScheme.error,
                        indicatorColor = MaterialTheme.colorScheme.errorContainer,
                    ),
                )
            }
        },
    ) { padding ->
        Box(Modifier.padding(padding)) {
            when (tab) {
                0 -> PatientHomeTab(vm, voiceManager, recognizedName, recognizedRelation,
                    doneMap) { tab = it }
                1 -> PatientMemoriesTab(vm, voiceManager)
                2 -> PatientAskTab(voiceManager)
                3 -> PatientRemindersTab(vm, doneMap)
                else -> PatientEmergencyTab(vm)
            }
        }
    }
}

private fun <T> unwrap(r: ApiResult<List<T>>?): List<T> =
    (r as? ApiResult.Success)?.data ?: emptyList()

@Composable
private fun PatientHomeTab(
    vm: CaregiverViewModel,
    voiceManager: VoiceConversationManager,
    recognizedName: String?,
    recognizedRelation: String,
    doneMap: MutableMap<String, Boolean>,
    onGoTab: (Int) -> Unit,
) {
    val context = LocalContext.current
    val memories = unwrap(vm.memories)
    val medicines = unwrap(vm.medicines)
    val contacts = unwrap(vm.contacts)
    val primary = contacts.firstOrNull { it.isPrimary } ?: contacts.firstOrNull()
    val featured = memories.firstOrNull()

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Box(
            Modifier.fillMaxWidth()
                .background(
                    Brush.horizontalGradient(listOf(NtGold, Color(0xFF38B2AC))),
                    RoundedCornerShape(20.dp))
                .padding(20.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("🌞", fontSize = 28.sp)
                    Spacer(Modifier.height(6.dp))
                    Text(greeting(), fontSize = 26.sp, fontWeight = FontWeight.Black,
                        color = Color(0xFF09090B))
                    Spacer(Modifier.height(8.dp))
                    Text(
                        buildString {
                            append("Today ")
                            append(if (primary != null)
                                "${primary.name.split(" ").first()} might visit"
                            else "is a peaceful day")
                            if (featured != null) {
                                append(". Would you like to revisit ")
                                append(featured.title)
                                append("?")
                            } else {
                                append(". Your memories are waiting for you")
                            }
                            append(" or talk to NeuroTwin?")
                        },
                        fontSize = 15.sp, fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF09090B).copy(alpha = 0.85f),
                    )
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(onClick = { onGoTab(1) }, shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color.White,
                                contentColor = Color(0xFF09090B))) {
                            Text("Open Memories", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        OutlinedButton(onClick = { onGoTab(2) },
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Color(0xFF09090B))) {
                            Text("Ask NeuroTwin", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                }
                if (primary != null) {
                    Spacer(Modifier.width(12.dp))
                    Surface(shape = RoundedCornerShape(16.dp),
                        color = Color.White.copy(alpha = 0.25f)) {
                        Column(Modifier.padding(12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("FAMILY CHECK-IN", fontSize = 10.sp,
                                fontWeight = FontWeight.Black, color = Color(0xFF09090B))
                            Spacer(Modifier.height(4.dp))
                            Text(primary.name.split(" ").first(), fontSize = 18.sp,
                                fontWeight = FontWeight.Black, color = Color(0xFF09090B))
                            Text(primary.relationship, fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold, color = Color(0xFF09090B))
                        }
                    }
                }
            }
        }

        if (recognizedName != null) {
            Surface(shape = RoundedCornerShape(16.dp),
                color = NtGold.copy(alpha = 0.12f),
                border = BorderStroke(1.dp, NtGold.copy(alpha = 0.4f))) {
                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("📷", fontSize = 22.sp)
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("I can see ${recognizedName}", fontSize = 18.sp,
                            fontWeight = FontWeight.Bold, color = NtGold)
                        if (recognizedRelation.isNotBlank()) {
                            Text("Your $recognizedRelation is nearby",
                                fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }

        Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
            Column(Modifier.padding(16.dp)) {
                Row(Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically) {
                    Text("How are you feeling?", fontSize = 17.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(12.dp))
                val moods = listOf(
                    "😊" to "Happy & Peaceful", "😌" to "Calm & Rested",
                    "💭" to "Nostalgic", "🤗" to "Need a Hug")
                var mood by remember { mutableStateOf<String?>(null) }
                for (row in moods.chunked(2)) {
                    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        for ((emoji, label) in row) {
                            val selected = mood == label
                            Surface(
                                onClick = { mood = label },
                                shape = RoundedCornerShape(16.dp),
                                color = if (selected) NtGold.copy(alpha = 0.22f)
                                        else MaterialTheme.colorScheme.background,
                                border = BorderStroke(1.dp,
                                    if (selected) NtGold else MaterialTheme.colorScheme.outline),
                                modifier = Modifier.weight(1f),
                            ) {
                                Column(Modifier.padding(14.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(emoji, fontSize = 30.sp)
                                    Spacer(Modifier.height(6.dp))
                                    Text(label, fontSize = 13.sp, fontWeight = FontWeight.Bold,
                                        textAlign = TextAlign.Center,
                                        color = if (selected) NtGold
                                                else MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
                if (mood != null) {
                    Spacer(Modifier.height(8.dp))
                    Text("Noted — thank you for sharing. 💛", fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold, color = NtSuccess)
                }
            }
        }

        val doneCount = medicines.count { doneMap[it.id] == true }
        Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
            Column(Modifier.padding(16.dp)) {
                Row(Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically) {
                    Text("Today's Reminders", fontSize = 17.sp, fontWeight = FontWeight.Bold)
                    if (medicines.isNotEmpty()) {
                        Surface(shape = RoundedCornerShape(50),
                            color = NtSuccess.copy(alpha = 0.15f)) {
                            Text("$doneCount of ${medicines.size} Done", fontSize = 12.sp,
                                fontWeight = FontWeight.Bold, color = NtSuccess,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp))
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
                if (medicines.isEmpty()) {
                    Text("No medicines scheduled yet.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp)
                } else {
                    medicines.take(3).forEach { m: Medicine ->
                        MedicineRow(m, doneMap[m.id] == true) {
                            doneMap[m.id] = !(doneMap[m.id] ?: false)
                        }
                    }
                    if (medicines.size > 3) {
                        TextButton(onClick = { onGoTab(3) }) {
                            Text("See all ${medicines.size} reminders →",
                                color = NtGold, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        if (featured != null) {
            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(Modifier.padding(16.dp)) {
                    Row(Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically) {
                        Text("FEATURED MEMORY", fontSize = 11.sp, fontWeight = FontWeight.Black,
                            color = NtGold)
                        TextButton(onClick = { onGoTab(1) }) {
                            Text("View All (${memories.size}) →", fontSize = 12.sp,
                                color = NtGold, fontWeight = FontWeight.Bold)
                        }
                    }
                    Box(
                        Modifier.fillMaxWidth().height(150.dp)
                            .background(
                                Brush.verticalGradient(listOf(
                                    NtGold.copy(alpha = 0.18f),
                                    Color(0xFF38B2AC).copy(alpha = 0.12f))),
                                RoundedCornerShape(14.dp))
                            .border(1.dp, MaterialTheme.colorScheme.outline,
                                RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(categoryEmoji(featured.category), fontSize = 56.sp)
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(featured.title, fontSize = 19.sp, fontWeight = FontWeight.Black)
                    featured.description?.let {
                        Spacer(Modifier.height(4.dp))
                        Text(it, fontSize = 14.sp, maxLines = 2,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = {
                            voiceManager.sendTextQuery(
                                "Please tell me about this memory: ${featured.title}",
                                object : VoiceConversationManager.Callback {
                                    override fun onResponseReceived(
                                        transcript: String, response: String,
                                        audioUrl: String?,
                                    ) {
                                        playTts(audioUrl)
                                    }
                                })
                        },
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Text("🔊 Listen to Audio Memory Story",
                            fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                }
            }
        }

        if (memories.drop(1).isNotEmpty()) {
            Text("Recent Albums", fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                memories.drop(1).take(3).forEach { m: Memory ->
                    Box(
                        Modifier.weight(1f).height(80.dp)
                            .background(MaterialTheme.colorScheme.background,
                                RoundedCornerShape(12.dp))
                            .border(1.dp, MaterialTheme.colorScheme.outline,
                                RoundedCornerShape(12.dp))
                            .clickable { onGoTab(1) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(categoryEmoji(m.category), fontSize = 30.sp)
                    }
                }
            }
        }

        if (primary != null) {
            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = RoundedCornerShape(50), color = NtGold.copy(alpha = 0.15f)) {
                        Text(primary.name.take(1), fontSize = 22.sp, fontWeight = FontWeight.Black,
                            color = NtGold,
                            modifier = Modifier.padding(12.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(primary.name, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                        Text(primary.relationship, fontSize = 13.sp, color = NtSuccess,
                            fontWeight = FontWeight.Bold)
                    }
                    Button(onClick = { dial(context, primary.phone) },
                        shape = RoundedCornerShape(14.dp)) {
                        Icon(Icons.Filled.Call, contentDescription = null,
                            modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Call", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF2A1215)),
            border = BorderStroke(2.dp, NtDanger)) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("🆘", fontSize = 32.sp)
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text("Need Immediate Help?", fontSize = 17.sp,
                        fontWeight = FontWeight.Black, color = Color(0xFFFCA5A5))
                    Text(
                        if (primary != null) "Tap to alert ${primary.name.split(" ").first()} & care team"
                        else "Add an emergency contact first",
                        fontSize = 13.sp, color = Color(0xFFFCA5A5).copy(alpha = 0.8f))
                }
                Button(
                    onClick = { primary?.let { dial(context, it.phone) } },
                    enabled = primary != null,
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = NtDanger),
                    modifier = Modifier.height(52.dp),
                ) {
                    Text("SEND SOS", fontWeight = FontWeight.Black, fontSize = 14.sp)
                }
            }
        }
    }
}

@Composable
private fun MedicineRow(m: Medicine, done: Boolean, onToggle: () -> Unit) {
    Surface(
        onClick = onToggle,
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.background,
        border = BorderStroke(1.dp,
            if (done) MaterialTheme.colorScheme.outlineVariant else NtGold.copy(alpha = 0.35f)),
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
    ) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(if (done) "✅" else "⏰", fontSize = 20.sp)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(m.name, fontSize = 15.sp, fontWeight = FontWeight.Bold,
                    textDecoration = if (done)
                        androidx.compose.ui.text.style.TextDecoration.LineThrough
                    else androidx.compose.ui.text.style.TextDecoration.None,
                    color = if (done) MaterialTheme.colorScheme.onSurfaceVariant
                            else MaterialTheme.colorScheme.onSurface)
                Text("Scheduled for ${m.scheduleTime}", fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun PatientMemoriesTab(
    vm: CaregiverViewModel,
    voiceManager: VoiceConversationManager,
) {
    val memories = unwrap(vm.memories)
    var index by remember { mutableIntStateOf(0) }
    var storyText by remember { mutableStateOf<String?>(null) }
    var thanked by remember { mutableStateOf(false) }
    var loadingStory by remember { mutableStateOf(false) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Row(Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically) {
            Text("Today's Special Memory", fontSize = 24.sp, fontWeight = FontWeight.Black)
            if (memories.isNotEmpty())
                Text("Slide ${index % memories.size + 1} of ${memories.size}",
                    fontSize = 14.sp, fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
        }

        if (memories.isEmpty()) {
            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(Modifier.padding(40.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🧠", fontSize = 40.sp)
                    Spacer(Modifier.height(10.dp))
                    Text("No memories yet", fontWeight = FontWeight.Bold)
                    Text("Your family can add memories for you.",
                        fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        } else {
            val safeIndex = index % memories.size
            val m = memories[safeIndex]
            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(2.dp, NtGold.copy(alpha = 0.4f))) {
                Column(Modifier.padding(16.dp)) {
                    Box(
                        Modifier.fillMaxWidth().height(200.dp)
                            .background(
                                Brush.verticalGradient(listOf(
                                    NtGold.copy(alpha = 0.18f),
                                    Color(0xFF38B2AC).copy(alpha = 0.12f))),
                                RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(categoryEmoji(m.category), fontSize = 72.sp)
                        Surface(modifier = Modifier.align(Alignment.BottomEnd)
                            .padding(10.dp), shape = RoundedCornerShape(12.dp),
                            color = NtGold) {
                            Text("🔊 Listen", fontSize = 13.sp, fontWeight = FontWeight.Bold,
                                color = Color(0xFF09090B),
                                modifier = Modifier.clickable {
                                    loadingStory = true; storyText = null; thanked = false
                                    voiceManager.sendTextQuery(
                                        "Please tell me about this memory: ${m.title}. ${m.description ?: ""}",
                                        object : VoiceConversationManager.Callback {
                                            override fun onResponseReceived(
                                                transcript: String, response: String,
                                                audioUrl: String?,
                                            ) {
                                                loadingStory = false; storyText = response
                                                playTts(audioUrl)
                                            }
                                            override fun onError(message: String) {
                                                loadingStory = false
                                            }
                                        })
                                }.padding(horizontal = 14.dp, vertical = 8.dp))
                        }
                    }
                    Spacer(Modifier.height(14.dp))
                    Text(m.title, fontSize = 26.sp, fontWeight = FontWeight.Black)
                    Spacer(Modifier.height(4.dp))
                    Text(categoryLabel(m.category) +
                            (m.personBinding?.let { " · With ${it}" } ?: ""),
                        fontSize = 15.sp, fontWeight = FontWeight.Bold, color = NtGold)
                    m.description?.let {
                        Spacer(Modifier.height(10.dp))
                        Text(it, fontSize = 16.sp, lineHeight = 24.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    if (loadingStory) {
                        Spacer(Modifier.height(12.dp))
                        Text("🧠 NeuroTwin is finding your story…", fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold, color = NtGold)
                    }
                    storyText?.let {
                        Spacer(Modifier.height(12.dp))
                        Text(it, fontSize = 15.sp, lineHeight = 23.sp,
                            color = MaterialTheme.colorScheme.onSurface)
                    }
                    Spacer(Modifier.height(16.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(
                            onClick = { thanked = true },
                            modifier = Modifier.weight(1f).height(64.dp),
                            shape = RoundedCornerShape(14.dp),
                        ) {
                            Text(if (thanked) "💛 Saved!" else "❤️ I Remember This!",
                                fontWeight = FontWeight.Bold, fontSize = 14.sp,
                                maxLines = 1)
                        }
                        OutlinedButton(
                            onClick = { index++; storyText = null; thanked = false },
                            modifier = Modifier.weight(1f).height(64.dp),
                            shape = RoundedCornerShape(14.dp),
                        ) {
                            Text("➡️ Next Memory", fontWeight = FontWeight.Bold,
                                fontSize = 14.sp, maxLines = 1)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PatientAskTab(voiceManager: VoiceConversationManager) {
    var isRecording by remember { mutableStateOf(false) }
    var isSending by remember { mutableStateOf(false) }
    var responseText by remember { mutableStateOf<String?>(null) }
    var responseAudioUrl by remember { mutableStateOf<String?>(null) }
    var statusMessage by remember { mutableStateOf("") }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = NtGold.copy(alpha = 0.1f)),
            border = BorderStroke(2.dp, NtGold.copy(alpha = 0.3f))) {
            Column(Modifier.padding(20.dp)) {
                Text("✨ Ask NeuroTwin", fontSize = 26.sp, fontWeight = FontWeight.Black)
                Spacer(Modifier.height(6.dp))
                Text("Your friendly memory companion. Hold the button and speak, or tap a question below.",
                    fontSize = 15.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(88.dp)
                .background(if (isRecording) NtDanger else NtGold, RoundedCornerShape(18.dp))
                .pointerInput(Unit) {
                    detectTapGestures(
                        onPress = {
                            isRecording = true
                            statusMessage = "🎤 Listening... speak now"
                            responseText = null
                            voiceManager.startConversationFromRecording(
                                object : VoiceConversationManager.Callback {
                                    override fun onRecordingStopped() {
                                        isRecording = false; isSending = true
                                        statusMessage = "🧠 Thinking..."
                                    }
                                    override fun onResponseReceived(
                                        transcript: String, response: String,
                                        audioUrl: String?,
                                    ) {
                                        isSending = false
                                        responseText = response
                                        responseAudioUrl = audioUrl
                                        statusMessage = ""
                                        playTts(audioUrl)
                                    }
                                    override fun onError(message: String) {
                                        isRecording = false; isSending = false
                                        statusMessage = "⚠ $message"
                                    }
                                })
                            tryAwaitRelease()
                            voiceManager.stopRecording()
                            isRecording = false
                        }
                    )
                },
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = when {
                    isRecording -> "🎤 Listening..."
                    isSending -> "🧠 Thinking..."
                    else -> "🎙️ Hold to Talk"
                },
                fontSize = 22.sp, fontWeight = FontWeight.Black,
                color = Color(0xFF09090B),
            )
        }

        if (statusMessage.isNotEmpty() && !isRecording) {
            Text(statusMessage, fontSize = 15.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            QuickChip("👤 Who is this?", "Who is this person?", voiceManager,
                enabled = !isSending && !isRecording,
                onStarted = { isSending = true; statusMessage = "🧠 Thinking..." },
                onResponse = { r, a -> isSending = false; responseText = r;
                    responseAudioUrl = a; statusMessage = ""; playTts(a) },
                onError = { isSending = false; statusMessage = "⚠ $it" },
                modifier = Modifier.weight(1f))
            QuickChip("🔍 Where are my glasses?", "Where are my glasses?", voiceManager,
                enabled = !isSending && !isRecording,
                onStarted = { isSending = true; statusMessage = "🧠 Thinking..." },
                onResponse = { r, a -> isSending = false; responseText = r;
                    responseAudioUrl = a; statusMessage = ""; playTts(a) },
                onError = { isSending = false; statusMessage = "⚠ $it" },
                modifier = Modifier.weight(1f))
        }

        responseText?.let { resp ->
            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(2.dp, NtGold)) {
                Column(Modifier.padding(18.dp)) {
                    Text("NEUROTWIN COMPANION", fontSize = 11.sp, fontWeight = FontWeight.Black,
                        color = NtGold)
                    Spacer(Modifier.height(10.dp))
                    Text(resp, fontSize = 18.sp, lineHeight = 27.sp)
                    if (responseAudioUrl != null) {
                        Spacer(Modifier.height(14.dp))
                        OutlinedButton(
                            onClick = { playTts(responseAudioUrl) },
                            modifier = Modifier.fillMaxWidth().height(54.dp),
                            shape = RoundedCornerShape(12.dp),
                        ) {
                            Text("🔊 Play Again", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickChip(
    label: String,
    query: String,
    voiceManager: VoiceConversationManager,
    enabled: Boolean,
    onStarted: () -> Unit,
    onResponse: (String, String?) -> Unit,
    onError: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    OutlinedButton(
        onClick = {
            onStarted()
            voiceManager.sendTextQuery(query, object : VoiceConversationManager.Callback {
                override fun onResponseReceived(transcript: String, response: String,
                                                audioUrl: String?) = onResponse(response, audioUrl)
                override fun onError(message: String) = onError(message)
            })
        },
        enabled = enabled,
        modifier = modifier.height(60.dp),
        shape = RoundedCornerShape(14.dp),
    ) {
        Text(label, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
    }
}

@Composable
private fun PatientRemindersTab(
    vm: CaregiverViewModel,
    doneMap: MutableMap<String, Boolean>,
) {
    val medicines = unwrap(vm.medicines)
    val doneCount = medicines.count { doneMap[it.id] == true }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Today's Reminders", fontSize = 26.sp, fontWeight = FontWeight.Black)
        if (medicines.isNotEmpty()) {
            Surface(shape = RoundedCornerShape(50), color = NtSuccess.copy(alpha = 0.15f)) {
                Text("$doneCount of ${medicines.size} Done", fontSize = 13.sp,
                    fontWeight = FontWeight.Bold, color = NtSuccess,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp))
            }
        }
        if (medicines.isEmpty()) {
            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(Modifier.padding(40.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("💊", fontSize = 36.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("No medicines scheduled")
                }
            }
        } else {
            medicines.forEach { m: Medicine ->
                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(Modifier.padding(14.dp)) {
                        MedicineRow(m, doneMap[m.id] == true) {
                            doneMap[m.id] = !(doneMap[m.id] ?: false)
                        }
                        if (m.instructions.isNotBlank()) {
                            Text(m.instructions, fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(start = 42.dp, top = 4.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PatientEmergencyTab(vm: CaregiverViewModel) {
    val context = LocalContext.current
    val contacts = unwrap(vm.contacts)
    val primary = contacts.firstOrNull { it.isPrimary } ?: contacts.firstOrNull()

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text("Emergency Help", fontSize = 26.sp, fontWeight = FontWeight.Black)
        Text("One press calls the first person on your list.",
            fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

        Button(
            onClick = { primary?.let { dial(context, it.phone) } },
            enabled = primary != null,
            modifier = Modifier.fillMaxWidth().height(96.dp),
            shape = RoundedCornerShape(20.dp),
            colors = ButtonDefaults.buttonColors(containerColor = NtDanger),
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("🚨 SEND SOS", fontSize = 24.sp, fontWeight = FontWeight.Black)
                if (primary != null) {
                    Text("Calls ${primary.name}", fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.85f))
                }
            }
        }

        if (contacts.isEmpty()) {
            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(Modifier.padding(40.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("📞", fontSize = 34.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("No emergency contacts yet")
                }
            }
        } else {
            Text("All Contacts", fontSize = 17.sp, fontWeight = FontWeight.Bold)
            contacts.forEach { c: EmergencyContact ->
                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(c.name, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                                if (c.isPrimary) {
                                    Spacer(Modifier.width(8.dp))
                                    Text("PRIMARY", fontSize = 10.sp, fontWeight = FontWeight.Black,
                                        color = NtGold, modifier = Modifier.background(
                                            NtGold.copy(alpha = 0.15f),
                                            RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 3.dp))
                                }
                            }
                            Text("${c.relationship} · ${c.phone}", fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Button(onClick = { dial(context, c.phone) },
                            shape = RoundedCornerShape(14.dp)) {
                            Icon(Icons.Filled.Call, contentDescription = null,
                                modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Call", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
