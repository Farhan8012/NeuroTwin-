package com.neurotwin.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neurotwin.app.auth.AuthState
import com.neurotwin.app.auth.Mode

/** Startup screen: one tap to enter Patient or Caregiver mode. */
@Composable
fun ModeSelectScreen() {
    Column(
        Modifier
            .fillMaxSize()
            .padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("NeuroTwin", fontSize = 40.sp,
            color = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(8.dp))
        Text("Cognitive Companion",
            fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(56.dp))

        Button(
            onClick = { AuthState.enter(Mode.PATIENT) },
            modifier = Modifier.fillMaxWidth().height(96.dp),
            shape = RoundedCornerShape(20.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary),
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("🧓  I'm the Patient", fontSize = 24.sp)
                Text("Simple companion with voice", fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f))
            }
        }

        Spacer(Modifier.height(20.dp))

        OutlinedButton(
            onClick = { AuthState.enter(Mode.CAREGIVER) },
            modifier = Modifier.fillMaxWidth().height(96.dp),
            shape = RoundedCornerShape(20.dp),
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("👨‍👩‍👧  I'm the Caregiver", fontSize = 24.sp,
                    color = MaterialTheme.colorScheme.primary)
                Text("Manage people, memories & medicines", fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
