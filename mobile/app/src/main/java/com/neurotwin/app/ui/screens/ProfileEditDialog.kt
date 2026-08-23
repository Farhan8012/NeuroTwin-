package com.neurotwin.app.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.neurotwin.app.auth.AuthState
import com.neurotwin.app.auth.Mode
import com.neurotwin.app.ui.theme.ThemeState

/**
 * Premium Adaptive Profile & Account Settings Dialog.
 * Supports dynamic Avatar image picking, Email, Name, Phone, Mode, and Theme editing.
 */
@Composable
fun ProfileEditDialog(
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val session by AuthState.session.collectAsState()
    val isDark = ThemeState.isDarkMode

    var userName by remember { mutableStateOf(session.userName.ifBlank { "Farhan" }) }
    var email by remember { mutableStateOf(session.email.ifBlank { "farhan@neurotwin.ai" }) }
    var phone by remember { mutableStateOf(session.phone.ifBlank { "+91 98765 43210" }) }
    var selectedRole by remember { mutableStateOf(session.mode ?: Mode.PATIENT) }
    var bio by remember { mutableStateOf(session.bio.ifBlank { "NeuroTwin Companion User" }) }
    var selectedAvatarUri by remember { mutableStateOf<String?>(session.avatarUri) }

    // Photo Gallery Picker Launcher
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            selectedAvatarUri = uri.toString()
            Toast.makeText(context, "Profile picture selected! Tap 'Save Changes' to apply", Toast.LENGTH_SHORT).show()
        }
    }

    // Adaptive Theme Palette Tokens
    val cardBg = if (isDark) Color(0xFF111317) else Color(0xFFFFFFFF)
    val cardBorder = if (isDark) Color(0xFF262B35) else Color(0xFFE2E8F0)
    val textPrimary = if (isDark) Color.White else Color(0xFF0F172A)
    val textSecondary = if (isDark) Color(0xFF94A3B8) else Color(0xFF64748B)
    val inputBg = if (isDark) Color(0xFF191C22) else Color(0xFFF8FAFC)
    val inputBorder = if (isDark) Color(0xFF2A2E38) else Color(0xFFCBD5E1)
    val closeBtnBg = if (isDark) Color(0xFF1E222A) else Color(0xFFF1F5F9)
    val pillBg = if (isDark) Color(0xFF191C22) else Color(0xFFF1F5F9)
    val pillBorder = if (isDark) Color(0xFF2A2E38) else Color(0xFFE2E8F0)
    val pillActiveBg = if (isDark) Color(0xFF1E2838) else Color(0xFFE0F2FE)
    val scrimBg = if (isDark) Color.Black.copy(alpha = 0.85f) else Color.Black.copy(alpha = 0.50f)

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(scrimBg)
                .padding(horizontal = 20.dp, vertical = 24.dp),
            contentAlignment = Alignment.Center
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.92f),
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg),
                border = androidx.compose.foundation.BorderStroke(1.dp, cardBorder),
                elevation = CardDefaults.cardElevation(defaultElevation = if (isDark) 0.dp else 12.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(22.dp)
                ) {
                    // Header Bar
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "ACCOUNT SETTINGS",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF0284C7),
                                letterSpacing = 1.5.sp
                            )
                            Text(
                                text = "Edit Profile",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = textPrimary
                            )
                        }

                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(closeBtnBg)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Close,
                                contentDescription = "Close",
                                tint = textSecondary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // Scrollable form fields
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Clickable Avatar with Photo Picker Launcher
                        Box(
                            modifier = Modifier
                                .size(92.dp)
                                .clickable { imagePickerLauncher.launch("image/*") },
                            contentAlignment = Alignment.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(86.dp)
                                    .clip(CircleShape)
                                    .background(
                                        Brush.linearGradient(
                                            listOf(Color(0xFF38BDF8), Color(0xFF818CF8))
                                        )
                                    )
                                    .border(2.dp, Color(0xFF38BDF8), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                if (!selectedAvatarUri.isNullOrEmpty()) {
                                    AsyncImage(
                                        model = selectedAvatarUri,
                                        contentDescription = "User Avatar",
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .clip(CircleShape),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Text(
                                        text = userName.take(1).uppercase().ifBlank { "F" },
                                        fontSize = 34.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.White
                                    )
                                }
                            }

                            // Camera / Edit Badge
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF0284C7))
                                    .border(2.dp, cardBg, CircleShape)
                                    .align(Alignment.BottomEnd),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.CameraAlt,
                                    contentDescription = "Change Picture",
                                    tint = Color.White,
                                    modifier = Modifier.size(15.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Tap to change photo",
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF0284C7),
                            modifier = Modifier.clickable { imagePickerLauncher.launch("image/*") }
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = userName,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = textPrimary
                        )
                        Text(
                            text = if (selectedRole == Mode.PATIENT) "🧓 Patient Companion" else "👨‍👩‍👧 Caregiver Portal",
                            fontSize = 12.sp,
                            color = textSecondary
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Theme Mode Toggle Row inside Profile
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(pillBg)
                                .border(1.dp, pillBorder, RoundedCornerShape(14.dp))
                                .padding(horizontal = 14.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(
                                    imageVector = if (isDark) Icons.Filled.DarkMode else Icons.Filled.LightMode,
                                    contentDescription = "Theme",
                                    tint = if (isDark) Color(0xFFFBBF24) else Color(0xFF0284C7),
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = if (isDark) "Dark Theme" else "Light Theme",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = textPrimary
                                )
                            }
                            Switch(
                                checked = isDark,
                                onCheckedChange = { ThemeState.toggle(context) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = Color(0xFF38BDF8),
                                    uncheckedThumbColor = Color(0xFF0284C7),
                                    uncheckedTrackColor = Color(0xFFE2E8F0)
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Full Name Field
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = "Full Name",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = textSecondary
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            OutlinedTextField(
                                value = userName,
                                onValueChange = { userName = it },
                                placeholder = { Text("Your Name", color = Color(0xFF94A3B8)) },
                                leadingIcon = {
                                    Icon(Icons.Filled.Person, contentDescription = null, tint = Color(0xFF0284C7))
                                },
                                singleLine = true,
                                shape = RoundedCornerShape(14.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFF0284C7),
                                    unfocusedBorderColor = inputBorder,
                                    focusedTextColor = textPrimary,
                                    unfocusedTextColor = textPrimary,
                                    focusedContainerColor = inputBg,
                                    unfocusedContainerColor = inputBg
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Email Field (Requested by User)
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Email Address",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = textSecondary
                                )
                                Text(
                                    text = "Required",
                                    fontSize = 11.sp,
                                    color = Color(0xFF0284C7)
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            OutlinedTextField(
                                value = email,
                                onValueChange = { email = it },
                                placeholder = { Text("name@example.com", color = Color(0xFF94A3B8)) },
                                leadingIcon = {
                                    Icon(Icons.Filled.Email, contentDescription = null, tint = Color(0xFF0284C7))
                                },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                shape = RoundedCornerShape(14.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFF0284C7),
                                    unfocusedBorderColor = inputBorder,
                                    focusedTextColor = textPrimary,
                                    unfocusedTextColor = textPrimary,
                                    focusedContainerColor = inputBg,
                                    unfocusedContainerColor = inputBg
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Phone Number Field
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = "Phone Number",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = textSecondary
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            OutlinedTextField(
                                value = phone,
                                onValueChange = { phone = it },
                                placeholder = { Text("+91 98765 43210", color = Color(0xFF94A3B8)) },
                                leadingIcon = {
                                    Icon(Icons.Filled.Phone, contentDescription = null, tint = Color(0xFF0284C7))
                                },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                shape = RoundedCornerShape(14.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFF0284C7),
                                    unfocusedBorderColor = inputBorder,
                                    focusedTextColor = textPrimary,
                                    unfocusedTextColor = textPrimary,
                                    focusedContainerColor = inputBg,
                                    unfocusedContainerColor = inputBg
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Active Role Switcher
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = "Active Mode",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = textSecondary
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(
                                            if (selectedRole == Mode.PATIENT) pillActiveBg else pillBg
                                        )
                                        .border(
                                            1.dp,
                                            if (selectedRole == Mode.PATIENT) Color(0xFF0284C7) else pillBorder,
                                            RoundedCornerShape(12.dp)
                                        )
                                        .clickable { selectedRole = Mode.PATIENT }
                                        .padding(vertical = 10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        "🧓 Patient",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = if (selectedRole == Mode.PATIENT) Color(0xFF0284C7) else textSecondary
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(
                                            if (selectedRole == Mode.CAREGIVER) pillActiveBg else pillBg
                                        )
                                        .border(
                                            1.dp,
                                            if (selectedRole == Mode.CAREGIVER) Color(0xFF0284C7) else pillBorder,
                                            RoundedCornerShape(12.dp)
                                        )
                                        .clickable { selectedRole = Mode.CAREGIVER }
                                        .padding(vertical = 10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        "👨‍👩‍👧 Caregiver",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = if (selectedRole == Mode.CAREGIVER) Color(0xFF0284C7) else textSecondary
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Bio / Memory Notes Field
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = "Companion Bio & Notes",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = textSecondary
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            OutlinedTextField(
                                value = bio,
                                onValueChange = { bio = it },
                                placeholder = { Text("Add daily memory reminders or notes...", color = Color(0xFF94A3B8)) },
                                minLines = 2,
                                maxLines = 4,
                                shape = RoundedCornerShape(14.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFF0284C7),
                                    unfocusedBorderColor = inputBorder,
                                    focusedTextColor = textPrimary,
                                    unfocusedTextColor = textPrimary,
                                    focusedContainerColor = inputBg,
                                    unfocusedContainerColor = inputBg
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // Bottom Action Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                AuthState.logout()
                                onDismiss()
                            },
                            modifier = Modifier
                                .weight(0.4f)
                                .height(50.dp),
                            shape = RoundedCornerShape(16.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.5f)),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFEF4444))
                        ) {
                            Text("Sign Out", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }

                        Button(
                            onClick = {
                                if (email.isBlank() || !email.contains("@")) {
                                    Toast.makeText(context, "Please enter a valid email address", Toast.LENGTH_SHORT).show()
                                    return@Button
                                }
                                AuthState.updateProfile(
                                    userName = userName.trim(),
                                    email = email.trim(),
                                    phone = phone.trim(),
                                    mode = selectedRole,
                                    bio = bio.trim(),
                                    avatarUri = selectedAvatarUri
                                )
                                Toast.makeText(context, "Profile updated successfully! ✅", Toast.LENGTH_SHORT).show()
                                onDismiss()
                            },
                            modifier = Modifier
                                .weight(0.6f)
                                .height(50.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isDark) Color(0xFF38BDF8) else Color(0xFF0284C7),
                                contentColor = if (isDark) Color(0xFF0B1220) else Color.White
                            )
                        ) {
                            Text("Save Changes", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                }
            }
        }
    }
}
