package com.neurotwin.app.caregiver

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.neurotwin.app.R
import com.neurotwin.app.auth.AuthState
import com.neurotwin.app.auth.Mode
import com.neurotwin.app.ui.theme.AppColors
import com.neurotwin.app.ui.theme.ThemeState

private data class Tab(val route: String, val label: String, val icon: ImageVector)

private val TABS = listOf(
    Tab("people", "People", Icons.Filled.People),
    Tab("memories", "Memories", Icons.Filled.PhotoLibrary),
    Tab("medicines", "Meds", Icons.Filled.Medication),
    Tab("emergency", "SOS", Icons.Filled.HealthAndSafety),
    Tab("telemetry", "Status", Icons.Filled.Insights),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaregiverApp() {
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val current = backStack?.destination?.route ?: "people"
    val context = LocalContext.current
    val isDark = ThemeState.isDarkMode
    var showProfileDialog by remember { mutableStateOf(false) }

    if (showProfileDialog) {
        com.neurotwin.app.ui.screens.ProfileEditDialog(onDismiss = { showProfileDialog = false })
    }

    Scaffold(
        containerColor = AppColors.background,
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Image(
                            painter = painterResource(id = R.drawable.app_logo_zoomed),
                            contentDescription = "NeuroTwin Logo",
                            modifier = Modifier
                                .size(38.dp)
                                .clip(RoundedCornerShape(10.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Text(
                            "Caregiver Portal",
                            fontWeight = FontWeight.Bold,
                            fontSize = 19.sp,
                            color = AppColors.textPrimary
                        )
                    }
                },
                actions = {
                    // Clean Clickable Profile Picture (PFP) Avatar
                    val session by AuthState.session.collectAsState()
                    Box(
                        modifier = Modifier
                            .padding(end = 12.dp)
                            .size(38.dp)
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
                                fontSize = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color(0xFF0F172A)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = AppColors.topBar
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = AppColors.navBar,
                tonalElevation = 0.dp,
                modifier = Modifier.border(0.5.dp, AppColors.cardBorder)
            ) {
                TABS.forEach { tab ->
                    val isSelected = current == tab.route
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = {
                            nav.navigate(tab.route) {
                                popUpTo(nav.graph.startDestinationId) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            Icon(
                                tab.icon,
                                contentDescription = tab.label,
                                modifier = Modifier.size(22.dp)
                            )
                        },
                        label = {
                            Text(
                                text = tab.label,
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                maxLines = 1,
                                softWrap = false
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = AppColors.navSelectedIcon,
                            selectedTextColor = AppColors.navSelectedIcon,
                            unselectedIconColor = AppColors.navUnselectedIcon,
                            unselectedTextColor = AppColors.navUnselectedIcon,
                            indicatorColor = AppColors.navIndicator
                        )
                    )
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = nav,
            startDestination = "people",
            modifier = Modifier
                .fillMaxSize()
                .background(AppColors.background)
                .padding(padding),
        ) {
            composable("people") { PeopleScreen() }
            composable("memories") { MemoriesScreen() }
            composable("medicines") { MedicinesScreen() }
            composable("emergency") { EmergencyScreen() }
            composable("telemetry") { TelemetryScreen() }
        }
    }
}
