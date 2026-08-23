package com.neurotwin.app.caregiver

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neurotwin.app.data.ApiResult
import com.neurotwin.app.data.Medicine
import com.neurotwin.app.ui.common.*
import com.neurotwin.app.ui.theme.AppColors
import com.neurotwin.app.ui.theme.ThemeState

/** 💊 Medication schedule — OLED Dark & Stitch Light UI with full CRUD. */
@Composable
fun MedicinesScreen(vm: CaregiverViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val isDark = ThemeState.isDarkMode
    LaunchedEffect(Unit) { if (vm.medicines == null) vm.refreshMedicines() }

    var editing by remember { mutableStateOf<Medicine?>(null) }
    var deletingId by remember { mutableStateOf<String?>(null) }
    var busySaving by remember { mutableStateOf(false) }

    Column(
        Modifier
            .fillMaxSize()
            .background(AppColors.background)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        // Top Header (Stitch design)
        Row(
            Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Medicines",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.textPrimary
            )
            IconButton(
                onClick = {
                    editing = Medicine(name = "", dosage = "", scheduleTime = "", instructions = "")
                },
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(AppColors.pillButtonBg)
            ) {
                Icon(
                    Icons.Filled.Add,
                    contentDescription = "Add Medicine",
                    tint = AppColors.pillButtonText,
                    modifier = Modifier.size(22.dp)
                )
            }
        }

        Spacer(Modifier.height(14.dp))

        when (val r = vm.medicines) {
            null -> LoadingBox()
            is ApiResult.Failure -> ErrorRetryBox(r.message) { vm.refreshMedicines() }
            is ApiResult.Success -> {
                if (r.data.isEmpty()) {
                    EmptyState(
                        "💊",
                        "No medicines scheduled",
                        "Tap + to create a medication schedule"
                    )
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        items(r.data, key = { it.id }) { m ->
                            Card(
                                Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = AppColors.card),
                                border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Column(Modifier.padding(16.dp)) {
                                    // Row 1: Medicine Name + Edit / Delete Actions
                                    Row(
                                        Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = m.name,
                                            fontSize = 19.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = AppColors.textPrimary,
                                            modifier = Modifier.weight(1f)
                                        )
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            IconButton(
                                                onClick = { editing = m },
                                                modifier = Modifier.size(36.dp)
                                            ) {
                                                Icon(
                                                    Icons.Filled.Edit,
                                                    contentDescription = "Edit",
                                                    tint = AppColors.textSecondary,
                                                    modifier = Modifier.size(18.dp)
                                                )
                                            }
                                            IconButton(
                                                onClick = { deletingId = m.id },
                                                modifier = Modifier.size(36.dp)
                                            ) {
                                                Icon(
                                                    Icons.Filled.DeleteOutline,
                                                    contentDescription = "Delete",
                                                    tint = Color(0xFFEF4444),
                                                    modifier = Modifier.size(19.dp)
                                                )
                                            }
                                        }
                                    }

                                    Spacer(Modifier.height(8.dp))

                                    // Row 2: Dosage & Schedule Info
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Icon(
                                            Icons.Filled.Medication,
                                            contentDescription = null,
                                            tint = AppColors.textSecondary,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Text(
                                            text = "${m.dosage} · ${m.scheduleTime}",
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = AppColors.textSecondary
                                        )
                                    }

                                    // Row 3: Instructions Box
                                    if (m.instructions.isNotBlank()) {
                                        Spacer(Modifier.height(10.dp))
                                        Surface(
                                            shape = RoundedCornerShape(10.dp),
                                            color = AppColors.cardAlt,
                                            border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                Icon(
                                                    Icons.Filled.Info,
                                                    contentDescription = null,
                                                    tint = AppColors.textSecondary,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                                Text(
                                                    text = m.instructions,
                                                    fontSize = 13.sp,
                                                    color = AppColors.textSecondary,
                                                    lineHeight = 18.sp
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

    editing?.let { initial ->
        MedicineDialog(
            initial,
            onSave = { m ->
                busySaving = true
                vm.saveMedicine(m) { err ->
                    busySaving = false
                    if (err == null) editing = null
                }
            },
            onDismiss = { if (!busySaving) editing = null }
        )
    }
    deletingId?.let { id ->
        ConfirmDeleteDialog(
            "medicine",
            onConfirm = { vm.deleteMedicine(id) },
            onDismiss = { deletingId = null }
        )
    }
}

@Composable
private fun MedicineDialog(initial: Medicine, onSave: (Medicine) -> Unit, onDismiss: () -> Unit) {
    var m by remember { mutableStateOf(initial) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial.id.isBlank()) "Add Medicine" else "Edit Medicine", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    m.name,
                    { m = m.copy(name = it) },
                    label = { Text("Name (e.g. Donepezil)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    m.dosage,
                    { m = m.copy(dosage = it) },
                    label = { Text("Dosage (e.g. 10 mg / 1 Tablet)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    m.scheduleTime,
                    { m = m.copy(scheduleTime = it) },
                    label = { Text("Schedule (e.g. 08:00 AM Daily)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    m.instructions,
                    { m = m.copy(instructions = it) },
                    label = { Text("Instructions (e.g. Take with breakfast)") },
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
            }
        },
        confirmButton = {
            Button(
                enabled = m.name.isNotBlank() && m.dosage.isNotBlank(),
                onClick = { onSave(m) },
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
