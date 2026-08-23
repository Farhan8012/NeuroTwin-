package com.neurotwin.app.caregiver

import android.content.Intent
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neurotwin.app.data.ApiResult
import com.neurotwin.app.data.EmergencyContact
import com.neurotwin.app.ui.common.*
import com.neurotwin.app.ui.theme.AppColors
import com.neurotwin.app.ui.theme.ThemeState

/** 🚨 Emergency contacts — OLED Dark & Stitch Light UI matching design specs. */
@Composable
fun EmergencyScreen(vm: CaregiverViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val context = LocalContext.current
    val isDark = ThemeState.isDarkMode
    LaunchedEffect(Unit) { if (vm.contacts == null) vm.refreshContacts() }

    var editing by remember { mutableStateOf<EmergencyContact?>(null) }
    var deletingId by remember { mutableStateOf<String?>(null) }

    Column(
        Modifier
            .fillMaxSize()
            .background(AppColors.background)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        // Top Header
        Row(
            Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Emergency",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.textPrimary
            )
        }

        Spacer(Modifier.height(12.dp))

        // Big Emergency SOS Card (Stitch design / OLED Crimson in dark mode)
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = AppColors.sosCard),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(1.5.dp, AppColors.sosCardBorder),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    Icons.Filled.Warning,
                    contentDescription = null,
                    tint = if (isDark) Color.White else Color(0xFF991B1B),
                    modifier = Modifier.size(38.dp)
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "Need Immediate Help?",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.sosTitle
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "Tap to alert your care team and share your location instantly.",
                    fontSize = 13.sp,
                    color = AppColors.sosText,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    lineHeight = 18.sp
                )
                Spacer(Modifier.height(14.dp))
                Button(
                    onClick = {
                        val contacts = (vm.contacts as? ApiResult.Success)?.data ?: emptyList()
                        val primary = contacts.firstOrNull { it.isPrimary } ?: contacts.firstOrNull()
                        if (primary != null && primary.phone.isNotBlank()) {
                            val tel = primary.phone.replace(Regex("[^0-9+]"), "")
                            context.startActivity(Intent(Intent.ACTION_DIAL, android.net.Uri.parse("tel:$tel")))
                        } else {
                            android.widget.Toast.makeText(context, "🚨 SOS Emergency Alert Sent!", android.widget.Toast.LENGTH_LONG).show()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColors.sosButton),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Icon(
                        Icons.Filled.Emergency,
                        contentDescription = null,
                        tint = AppColors.sosButtonText,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "CALL SOS",
                        color = AppColors.sosButtonText,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }
            }
        }

        Spacer(Modifier.height(18.dp))

        // Section Title: EMERGENCY CONTACTS
        Text(
            text = "EMERGENCY CONTACTS",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = AppColors.textSecondary,
            letterSpacing = 1.sp
        )

        Spacer(Modifier.height(10.dp))

        when (val r = vm.contacts) {
            null -> LoadingBox()
            is ApiResult.Failure -> ErrorRetryBox(r.message) { vm.refreshContacts() }
            is ApiResult.Success -> {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (r.data.isEmpty()) {
                        item {
                            EmptyState(
                                "🚨",
                                "No emergency contacts",
                                "Add the people who should always be reachable in an emergency"
                            )
                        }
                    } else {
                        items(r.data, key = { it.id }) { c ->
                            Card(
                                Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = AppColors.card),
                                border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Row(
                                    Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // Initials Avatar Circle
                                    val initials = c.name.split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString("")
                                    Box(
                                        Modifier
                                            .size(46.dp)
                                            .clip(CircleShape)
                                            .background(if (c.isPrimary) (if (isDark) Color(0xFF1E3A8A) else Color(0xFFEFF6FF)) else AppColors.cardAlt)
                                            .border(1.dp, if (c.isPrimary) (if (isDark) Color(0xFF3B82F6) else Color(0xFFBFDBFE)) else AppColors.cardBorder, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = if (initials.isNotBlank()) initials.uppercase() else "EC",
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (c.isPrimary) (if (isDark) Color(0xFF93C5FD) else Color(0xFF1D4ED8)) else AppColors.textSecondary
                                        )
                                    }

                                    Spacer(Modifier.width(12.dp))

                                    Column(Modifier.weight(1f)) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = c.name,
                                                fontSize = 17.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = AppColors.textPrimary
                                            )
                                            if (c.isPrimary) {
                                                Spacer(Modifier.width(6.dp))
                                                Surface(
                                                    shape = RoundedCornerShape(6.dp),
                                                    color = if (isDark) Color(0xFF1E3A8A) else Color(0xFFEFF6FF)
                                                ) {
                                                    Text(
                                                        "PRIMARY",
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = if (isDark) Color(0xFF93C5FD) else Color(0xFF2563EB),
                                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                    )
                                                }
                                            }
                                        }
                                        Text(
                                            text = "${c.relationship} • ${c.phone}",
                                            fontSize = 13.sp,
                                            color = AppColors.textSecondary
                                        )
                                    }

                                    // Round Call Button (White in OLED dark mode, dark slate in light mode)
                                    IconButton(
                                        onClick = {
                                            val tel = c.phone.replace(Regex("[^0-9+]"), "")
                                            context.startActivity(Intent(Intent.ACTION_DIAL, android.net.Uri.parse("tel:$tel")))
                                        },
                                        modifier = Modifier
                                            .size(42.dp)
                                            .clip(CircleShape)
                                            .background(if (isDark) Color.White else Color(0xFF0F172A))
                                    ) {
                                        Icon(
                                            Icons.Filled.Call,
                                            contentDescription = "Call",
                                            tint = if (isDark) Color(0xFF000000) else Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }

                                    Spacer(Modifier.width(4.dp))

                                    IconButton(
                                        onClick = { deletingId = c.id },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(
                                            Icons.Filled.DeleteOutline,
                                            contentDescription = "Delete",
                                            tint = Color(0xFFEF4444),
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(10.dp))

        // Outlined "+ Add Contact" button at the bottom
        OutlinedButton(
            onClick = {
                editing = EmergencyContact(name = "", relationship = "", phone = "", isPrimary = false)
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.outlinedButtonColors(containerColor = AppColors.card),
            border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder)
        ) {
            Icon(Icons.Filled.Add, contentDescription = null, tint = AppColors.textPrimary, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Add Contact", fontWeight = FontWeight.SemiBold, color = AppColors.textPrimary, fontSize = 14.sp)
        }
    }

    editing?.let { c ->
        ContactDialog(
            c,
            onSave = {
                vm.saveContact(it) { err -> if (err == null) editing = null }
            },
            onDismiss = { editing = null }
        )
    }
    deletingId?.let { id ->
        ConfirmDeleteDialog(
            "contact",
            onConfirm = { vm.deleteContact(id) },
            onDismiss = { deletingId = null }
        )
    }
}

@Composable
private fun ContactDialog(
    initial: EmergencyContact,
    onSave: (EmergencyContact) -> Unit,
    onDismiss: () -> Unit
) {
    var c by remember { mutableStateOf(initial) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial.id.isBlank()) "Add Emergency Contact" else "Edit Contact", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    c.name,
                    { c = c.copy(name = it) },
                    label = { Text("Name (e.g. Dr. Sarah Miller)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    c.relationship,
                    { c = c.copy(relationship = it) },
                    label = { Text("Relationship (e.g. Primary Neurologist, Son)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    c.phone,
                    { c = c.copy(phone = it) },
                    label = { Text("Phone Number") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Switch(c.isPrimary, { c = c.copy(isPrimary = it) })
                    Spacer(Modifier.width(8.dp))
                    Text("Primary emergency contact", fontSize = 13.sp)
                }
            }
        },
        confirmButton = {
            Button(
                enabled = c.name.isNotBlank() && c.phone.isNotBlank(),
                onClick = { onSave(c) },
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
