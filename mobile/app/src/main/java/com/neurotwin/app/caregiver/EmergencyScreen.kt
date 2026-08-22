package com.neurotwin.app.caregiver

import android.content.Intent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neurotwin.app.data.ApiResult
import com.neurotwin.app.data.EmergencyContact
import com.neurotwin.app.ui.common.*

/** 🚨 Emergency contacts — CRUD + one-tap dial. */
@Composable
fun EmergencyScreen(vm: CaregiverViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val context = LocalContext.current
    LaunchedEffect(Unit) { if (vm.contacts == null) vm.refreshContacts() }

    var editing by remember { mutableStateOf<EmergencyContact?>(null) }
    var deletingId by remember { mutableStateOf<String?>(null) }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically) {
            Text("Emergency", fontSize = 30.sp)
            Button(onClick = {
                editing = EmergencyContact(name = "", relationship = "", phone = "", isPrimary = false)
            }, shape = RoundedCornerShape(12.dp)) {
                Icon(Icons.Filled.Add, contentDescription = null,
                    modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Add", fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(16.dp))

        when (val r = vm.contacts) {
            null -> LoadingBox()
            is ApiResult.Failure -> ErrorRetryBox(r.message) { vm.refreshContacts() }
            is ApiResult.Success -> {
                if (r.data.isEmpty()) EmptyState("🚨", "No emergency contacts",
                    "Add the people who should always be reachable")
                else LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(r.data, key = { it.id }) { c ->
                        Card(Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp, MaterialTheme.colorScheme.outline)) {
                            Row(Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(c.name, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                                        if (c.isPrimary) {
                                            Spacer(Modifier.width(8.dp))
                                            AssistChip(
                                                onClick = {},
                                                label = { Text("PRIMARY") },
                                                colors = AssistChipDefaults.assistChipColors(
                                                    containerColor =
                                                        MaterialTheme.colorScheme.primaryContainer),
                                            )
                                        }
                                    }
                                    Text("${c.relationship} · ${c.phone}",
                                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Button(
                                    onClick = {
                                        val tel = c.phone.replace(Regex("[^0-9+]"), "")
                                        context.startActivity(Intent(Intent.ACTION_DIAL,
                                            android.net.Uri.parse("tel:$tel")))
                                    },
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.height(52.dp),
                                ) {
                                    Icon(Icons.Filled.Call, contentDescription = "Call",
                                        modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text("Call")
                                }
                                IconButton(onClick = { deletingId = c.id }) {
                                    Icon(Icons.Filled.Delete, contentDescription = "Delete",
                                        tint = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    editing?.let { c ->
        ContactDialog(c, onSave = { vm.saveContact(it) { err ->
            err ?: run { editing = null } } }, onDismiss = { editing = null })
    }
    deletingId?.let { id ->
        ConfirmDeleteDialog("contact", onConfirm = { vm.deleteContact(id) },
            onDismiss = { deletingId = null })
    }
}

@Composable
private fun ContactDialog(initial: EmergencyContact, onSave: (EmergencyContact) -> Unit,
                          onDismiss: () -> Unit) {
    var c by remember { mutableStateOf(initial) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial.id.isBlank()) "Add contact" else "Edit contact") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(c.name, { c = c.copy(name = it) },
                    label = { Text("Name") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())
                OutlinedTextField(c.relationship, { c = c.copy(relationship = it) },
                    label = { Text("Relationship") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())
                OutlinedTextField(c.phone, { c = c.copy(phone = it) },
                    label = { Text("Phone") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Switch(c.isPrimary, { c = c.copy(isPrimary = it) })
                    Spacer(Modifier.width(8.dp))
                    Text("Primary emergency contact")
                }
            }
        },
        confirmButton = {
            Button(enabled = c.name.isNotBlank() && c.phone.isNotBlank(),
                onClick = { onSave(c) }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
