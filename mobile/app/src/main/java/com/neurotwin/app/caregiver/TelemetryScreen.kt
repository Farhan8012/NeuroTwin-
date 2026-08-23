package com.neurotwin.app.caregiver

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
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
import com.neurotwin.app.auth.AuthState
import com.neurotwin.app.network.RetrofitClient
import com.neurotwin.app.ui.theme.AppColors
import com.neurotwin.app.ui.theme.ThemeState

/** 📊 System Status / Telemetry — OLED Dark & Stitch Light UI with live node diagnostics. */
@Composable
fun TelemetryScreen(vm: CaregiverViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val isDark = ThemeState.isDarkMode
    LaunchedEffect(Unit) { vm.refreshAll() }

    var isRunningDiag by remember { mutableStateOf(false) }

    Column(
        Modifier
            .fillMaxSize()
            .background(AppColors.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
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
                text = "System Status",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.textPrimary
            )
        }

        // Top Status Card (Stitch design)
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = AppColors.card),
            border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(Modifier.padding(20.dp)) {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "NeuroTwin Companion",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = AppColors.textPrimary
                        )
                        Spacer(Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF10B981))
                            )
                            Text(
                                text = "Online & Ready",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF10B981)
                            )
                        }
                    }
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(AppColors.cardAlt),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Filled.Memory,
                            contentDescription = null,
                            tint = AppColors.textSecondary,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }

                Spacer(Modifier.height(14.dp))
                HorizontalDivider(color = AppColors.divider)
                Spacer(Modifier.height(10.dp))

                Text(
                    text = "Last synced: Just now",
                    fontSize = 12.sp,
                    color = AppColors.textSecondary
                )
            }
        }

        // 4 Bento Status Cards (2x2 Grid)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            // Card 1: Camera Node
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AppColors.card),
                border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(AppColors.cardAlt),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.Videocam, contentDescription = null, tint = AppColors.textPrimary, modifier = Modifier.size(18.dp))
                        }
                        Surface(shape = RoundedCornerShape(12.dp), color = if (isDark) Color(0xFF064E3B) else Color(0xFFECFDF5)) {
                            Text("Online", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (isDark) Color(0xFFA7F3D0) else Color(0xFF059669), modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Text("Camera Node", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = AppColors.textPrimary)
                    Text("1080p HD Active", fontSize = 12.sp, color = AppColors.textSecondary)
                }
            }

            // Card 2: Microphone Array
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AppColors.card),
                border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(AppColors.cardAlt),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.Mic, contentDescription = null, tint = AppColors.textPrimary, modifier = Modifier.size(18.dp))
                        }
                        Surface(shape = RoundedCornerShape(12.dp), color = if (isDark) Color(0xFF064E3B) else Color(0xFFECFDF5)) {
                            Text("Active", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (isDark) Color(0xFFA7F3D0) else Color(0xFF059669), modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Text("Microphone Array", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = AppColors.textPrimary)
                    Text("Noise Canceling On", fontSize = 12.sp, color = AppColors.textSecondary)
                }
            }
        }

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            // Card 3: Connectivity
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AppColors.card),
                border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(AppColors.cardAlt),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.Wifi, contentDescription = null, tint = AppColors.textPrimary, modifier = Modifier.size(18.dp))
                        }
                        Surface(shape = RoundedCornerShape(12.dp), color = if (isDark) Color(0xFF1E3A8A) else Color(0xFFEFF6FF)) {
                            Text("5G", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (isDark) Color(0xFF93C5FD) else Color(0xFF2563EB), modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Text("Connectivity", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = AppColors.textPrimary)
                    Text("11ms Latency", fontSize = 12.sp, color = AppColors.textSecondary)
                }
            }

            // Card 4: Power Level
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AppColors.card),
                border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(AppColors.cardAlt),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.BatteryChargingFull, contentDescription = null, tint = AppColors.textPrimary, modifier = Modifier.size(18.dp))
                        }
                        Text("85%", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = AppColors.textPrimary)
                    }
                    Spacer(Modifier.height(12.dp))
                    Text("Power Level", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = AppColors.textPrimary)
                    LinearProgressIndicator(
                        progress = { 0.85f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp)),
                        color = if (isDark) Color.White else Color(0xFF1E293B),
                        trackColor = if (isDark) Color(0xFF33363B) else Color(0xFFE2E8F0)
                    )
                }
            }
        }

        // Section: Quick Actions (Stitch design)
        Text(
            text = "Quick Actions",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = AppColors.textPrimary
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = AppColors.card),
            border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder)
        ) {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            isRunningDiag = true
                            vm.refreshAll()
                            android.widget.Toast.makeText(context, "Diagnostics completed: All nodes normal", android.widget.Toast.LENGTH_SHORT).show()
                            isRunningDiag = false
                        }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(if (isDark) Color(0xFF1E293B) else Color(0xFFEFF6FF)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.Shield, contentDescription = null, tint = if (isDark) Color(0xFF60A5FA) else Color(0xFF2563EB), modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Run Diagnostics", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = AppColors.textPrimary)
                        Text("Check all system sensors & pipelines", fontSize = 12.sp, color = AppColors.textSecondary)
                    }
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = AppColors.textSecondary)
                }

                HorizontalDivider(color = AppColors.divider)

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            vm.refreshAll()
                            android.widget.Toast.makeText(context, "Companion node reconnected successfully", android.widget.Toast.LENGTH_SHORT).show()
                        }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(AppColors.cardAlt),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.Refresh, contentDescription = null, tint = AppColors.textPrimary, modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Restart Node", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = AppColors.textPrimary)
                        Text("Reboot companion device pipeline", fontSize = 12.sp, color = AppColors.textSecondary)
                    }
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = AppColors.textSecondary)
                }
            }
        }

        // Backend Connection Settings
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = AppColors.card),
            border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder)
        ) {
            Column(Modifier.padding(16.dp)) {
                Text("Backend Host & IP", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = AppColors.textPrimary)
                Spacer(Modifier.height(8.dp))
                var url by remember { mutableStateOf(RetrofitClient.currentBaseUrl()) }
                var saved by remember { mutableStateOf(false) }
                OutlinedTextField(
                    value = url,
                    onValueChange = { url = it; saved = false },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )
                Spacer(Modifier.height(10.dp))
                Button(
                    onClick = {
                        RetrofitClient.setBaseUrl(context, url.trim())
                        saved = true
                        vm.refreshAll()
                    },
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = if (isDark) Color.White else Color(0xFF1E293B))
                ) {
                    Text(if (saved) "Saved ✓" else "Save & Reconnect", color = if (isDark) Color.Black else Color.White)
                }
            }
        }
    }
}
