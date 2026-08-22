package com.neurotwin.app.caregiver

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neurotwin.app.data.ApiResult
import com.neurotwin.app.data.Medicine
import com.neurotwin.app.ui.common.*

/** 💊 Medication schedule — full CRUD, seeded defaults visible. */
@Composable
fun MedicinesScreen(vm: CaregiverViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    LaunchedEffect(Unit) { if (vm.medicines == null) vm.refreshMedicines() }

    var editing by remember { mutableStateOf<Medicine?>(null) }
    var deletingId by remember { mutableStateOf<String?>(null) }
    var busySaving by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically) {
            Text("Medicines", fontSize = 30.sp)
            Button(onClick = {
                editing = Medicine(name = "", dosage = "", scheduleTime = "", instructions = "")
            }, shape = RoundedCornerShape(12.dp)) {
                Icon(Icons.Filled.Add, contentDescription = null,
                    modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Add", fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(12.dp))
        when (val r = vm.medicines) {
            null -> LoadingBox()
            is ApiResult.Failure -> ErrorRetryBox(r.message) { vm.refreshMedicines() }
            is ApiResult.Success -> {
                if (r.data.isEmpty()) EmptyState("💊", "No medicines scheduled",
                    "Tap Add to create the first reminder")
                else LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(r.data, key = { it.id }) { m ->
                        Card(Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp, MaterialTheme.colorScheme.outline)) {
                            Row(Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(m.name, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                                    Text("${m.dosage} · ${m.scheduleTime}",
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.SemiBold)
                                    if (m.instructions.isNotBlank())
                                        Text(m.instructions,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                TextButton(onClick = { editing = m }) { Text("Edit") }
                                IconButton(onClick = { deletingId = m.id }) {
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

    editing?.let { initial ->
        MedicineDialog(initial,
            onSave = { m -> busySaving = true; vm.saveMedicine(m) { err ->
                busySaving = false; err ?: run { editing = null } } },
            onDismiss = { if (!busySaving) editing = null })
    }
    deletingId?.let { id ->
        ConfirmDeleteDialog("medicine", onConfirm = { vm.deleteMedicine(id) },
            onDismiss = { deletingId = null })
    }
}

@Composable
private fun MedicineDialog(initial: Medicine, onSave: (Medicine) -> Unit, onDismiss: () -> Unit) {
    var m by remember { mutableStateOf(initial) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial.id.isBlank()) "Add medicine" else "Edit medicine") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(m.name, { m = m.copy(name = it) },
                    label = { Text("Name") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())
                OutlinedTextField(m.dosage, { m = m.copy(dosage = it) },
                    label = { Text("Dosage (e.g. 10 mg)") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())
                OutlinedTextField(m.scheduleTime, { m = m.copy(scheduleTime = it) },
                    label = { Text("Schedule (e.g. 08:00 AM Daily)") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())
                OutlinedTextField(m.instructions, { m = m.copy(instructions = it) },
                    label = { Text("Instructions") }, minLines = 2,
                    modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(enabled = m.name.isNotBlank() && m.dosage.isNotBlank(),
                onClick = { onSave(m) }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
