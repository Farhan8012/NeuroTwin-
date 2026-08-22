package com.neurotwin.app.caregiver

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.HealthAndSafety
import androidx.compose.material.icons.filled.Insights
import androidx.compose.material.icons.filled.Medication
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController

private data class Tab(val route: String, val label: String, val icon: ImageVector)

/** The five caregiver tabs from the spec. */
private val TABS = listOf(
    Tab("people", "People", Icons.Filled.People),
    Tab("memories", "Memories", Icons.Filled.PhotoLibrary),
    Tab("medicines", "Medicines", Icons.Filled.Medication),
    Tab("emergency", "Emergency", Icons.Filled.HealthAndSafety),
    Tab("telemetry", "Telemetry", Icons.Filled.Insights),
)

@Composable
fun CaregiverApp() {
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val current = backStack?.destination?.route ?: "people"

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                TABS.forEach { tab ->
                    NavigationBarItem(
                        selected = current == tab.route,
                        onClick = {
                            nav.navigate(tab.route) {
                                popUpTo(nav.graph.startDestinationId) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                        ),
                    )
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = nav,
            startDestination = "people",
            modifier = Modifier.padding(padding),
        ) {
            composable("people") { PeopleScreen() }
            composable("memories") { MemoriesScreen() }
            composable("medicines") { MedicinesScreen() }
            composable("emergency") { EmergencyScreen() }
            composable("telemetry") { TelemetryScreen() }
        }
    }
}
