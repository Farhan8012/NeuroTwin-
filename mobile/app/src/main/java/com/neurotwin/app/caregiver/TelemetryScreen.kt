package com.neurotwin.app.caregiver

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neurotwin.app.auth.AuthState
import com.neurotwin.app.data.ApiResult
import com.neurotwin.app.network.RetrofitClient
import com.neurotwin.app.ui.common.*

/** 📊 Telemetry — live backend health, data counts, connection settings. */
@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
fun TelemetryScreen(vm: CaregiverViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val context = androidx.compose.ui.platform.LocalContext.current
    LaunchedEffect(Unit) { vm.refreshAll() }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically) {
            Text("Telemetry", fontSize = 30.sp)
            IconButton(onClick = { AuthState.switchMode() }) {
                Icon(Icons.Filled.Logout, contentDescription = "Switch mode",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }

        when (val h = vm.health) {
            null -> LoadingBox("Connecting to backend…")
            is ApiResult.Failure -> ErrorRetryBox(h.message) { vm.refreshAll() }
            is ApiResult.Success -> {
                val online = h.data.status == "online"
                SectionCard("System Status") {
                    AssistChip(
                        onClick = {},
                        label = {
                            Text(if (online) "All systems online" else "Degraded",
                                fontWeight = FontWeight.Bold)
                        },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = if (online) MaterialTheme.colorScheme.primaryContainer
                                             else MaterialTheme.colorScheme.errorContainer),
                    )
                    Spacer(Modifier.height(10.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        h.data.components.forEach { (name, state) ->
                            StatusChip(
                                label = name.replace("_", " "),
                                ok = state in setOf("connected", "active", "ready"),
                                detail = state,
                            )
                        }
                    }
                }
            }
        }

        fun countOf(r: ApiResult<List<*>>?) = (r as? ApiResult.Success)?.data?.size ?: 0
        val peopleCount = countOf(vm.people)
        val memoryCount = countOf(vm.memories)
        val medCount = countOf(vm.medicines)
        val contactCount = countOf(vm.contacts)

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard("People", "$peopleCount",
                if (peopleCount > 0) "face-indexed" else "empty registry",
                modifier = Modifier.weight(1f))
            StatCard("Memories", "$memoryCount", "anchors stored",
                modifier = Modifier.weight(1f))
        }
        Spacer(Modifier.height(4.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard("Medicines", "$medCount", "scheduled",
                modifier = Modifier.weight(1f))
            StatCard("Contacts", "$contactCount", "emergency-ready",
                modifier = Modifier.weight(1f))
        }

        val meds = (vm.medicines as? ApiResult.Success)?.data.orEmpty()
        SectionCard("Today's Reminders") {
            if (meds.isEmpty()) EmptyState("💊", "No medicines scheduled")
            else Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                meds.sortedBy { it.scheduleTime }.take(5).forEach { m ->
                    Row(Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween) {
                        Column(Modifier.weight(1f)) {
                            Text(m.name, fontWeight = FontWeight.SemiBold)
                            Text(m.dosage, style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Text(m.scheduleTime, fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary)
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                }
            }
        }

        SectionCard("Backend Connection") {
            var url by remember { mutableStateOf(RetrofitClient.currentBaseUrl()) }
            var saved by remember { mutableStateOf(false) }
            OutlinedTextField(url, { url = it; saved = false },
                label = { Text("API base URL") }, singleLine = true,
                modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Button(onClick = {
                RetrofitClient.setBaseUrl(context, url.trim())
                saved = true; vm.refreshAll()
            }) { Text(if (saved) "Saved ✓" else "Save & reconnect") }
            Spacer(Modifier.height(6.dp))
            Text("Emulator: ${RetrofitClient.DEFAULT_BASE_URL} · Real phone: your Mac's Wi-Fi IP",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
