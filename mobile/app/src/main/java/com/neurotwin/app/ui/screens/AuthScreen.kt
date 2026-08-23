package com.neurotwin.app.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
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
import androidx.compose.material.icons.automirrored.filled.ArrowForward
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.neurotwin.app.R
import com.neurotwin.app.auth.AuthState
import com.neurotwin.app.auth.Mode
import com.neurotwin.app.network.RetrofitClient
import com.neurotwin.app.network.SendOtpRequest
import com.neurotwin.app.service.SmsOtpSender
import kotlinx.coroutines.launch

enum class AuthTab {
    SIGN_IN,
    SIGN_UP
}

/**
 * Modern OLED Black Login & Sign Up Screen connecting directly to the real SIM card SMS sender,
 * Android notification manager, and backend API.
 */
@Composable
fun AuthScreen(
    onAuthSuccess: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var currentTab by remember { mutableStateOf(AuthTab.SIGN_IN) }
    var showOtpScreen by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }

    // Form fields
    var phoneNumber by remember { mutableStateOf("+91 98765 43210") }
    var fullName by remember { mutableStateOf("Farhan") }
    var emailAddress by remember { mutableStateOf("farhan@neurotwin.ai") }
    var selectedRole by remember { mutableStateOf(Mode.PATIENT) }
    var deliveryChannel by remember { mutableStateOf("sms") } // 'sms' or 'whatsapp'
    var generatedRealOtp by remember { mutableStateOf("") }

    // Runtime Permission Launcher for real SMS and Notifications
    val smsPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        // Continue sending after permission grant
    }

    LaunchedEffect(Unit) {
        val needed = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.SEND_SMS)
        }
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        if (needed.isNotEmpty()) {
            smsPermissionLauncher.launch(needed.toTypedArray())
        }
    }

    fun dispatchRealOtp() {
        if (phoneNumber.trim().length < 6) {
            Toast.makeText(context, "Please enter a valid phone number", Toast.LENGTH_SHORT).show()
            return
        }

        isLoading = true
        // Generate a real dynamic 4-digit code
        val newCode = (1000..9999).random().toString()
        generatedRealOtp = newCode

        scope.launch {
            // 1. Try sending via Backend API
            try {
                val api = RetrofitClient.api(context)
                api.sendOtp(
                    SendOtpRequest(
                        phone = phoneNumber.trim(),
                        user_name = if (currentTab == AuthTab.SIGN_UP) fullName.trim() else "",
                        mode = selectedRole.name,
                        channel = deliveryChannel
                    )
                )
            } catch (_: Exception) {}

            // 2. Transmit REAL cellular carrier SMS from device SIM card and trigger Heads-Up Notification
            if (deliveryChannel == "sms") {
                SmsOtpSender.sendRealSmsOtp(context, phoneNumber, newCode)
            } else {
                SmsOtpSender.openWhatsAppWithOtp(context, phoneNumber, newCode)
            }

            isLoading = false
            showOtpScreen = true
            Toast.makeText(context, "Real OTP sent to $phoneNumber", Toast.LENGTH_SHORT).show()
        }
    }

    if (showOtpScreen) {
        OtpVerificationScreen(
            phoneNumber = phoneNumber,
            userName = if (currentTab == AuthTab.SIGN_UP) fullName else (if (phoneNumber.contains("Farhan")) "Farhan" else "User"),
            email = emailAddress,
            mode = selectedRole,
            channel = deliveryChannel,
            initialDebugOtp = generatedRealOtp,
            onVerified = {
                onAuthSuccess()
            },
            onBack = {
                showOtpScreen = false
            }
        )
    } else {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF000000))
                .statusBarsPadding()
                .navigationBarsPadding(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp, vertical = 20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Brain Logo with subtle glowing halo
                Box(
                    modifier = Modifier.size(92.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(90.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.radialGradient(
                                    colors = listOf(
                                        Color(0xFF38BDF8).copy(alpha = 0.3f),
                                        Color.Transparent
                                    )
                                )
                            )
                    )
                    Image(
                        painter = painterResource(id = R.drawable.app_logo_zoomed),
                        contentDescription = "NeuroTwin Emblem",
                        modifier = Modifier
                            .size(76.dp)
                            .clip(RoundedCornerShape(20.dp)),
                        contentScale = ContentScale.Crop
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Title
                Text(
                    text = "NeuroTwin",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Cognitive Care & Memory Companion",
                    fontSize = 14.sp,
                    color = Color(0xFF94A3B8),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(28.dp))

                // Card Container
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(26.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF111317)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF222630))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(22.dp)
                    ) {
                        // Tab Switcher Pill
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFF191C22))
                                .padding(4.dp),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(
                                        if (currentTab == AuthTab.SIGN_IN) Color(0xFF262A34)
                                        else Color.Transparent
                                    )
                                    .clickable { currentTab = AuthTab.SIGN_IN },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Sign In",
                                    fontSize = 14.sp,
                                    fontWeight = if (currentTab == AuthTab.SIGN_IN) FontWeight.Bold else FontWeight.Normal,
                                    color = if (currentTab == AuthTab.SIGN_IN) Color.White else Color(0xFF94A3B8)
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(
                                        if (currentTab == AuthTab.SIGN_UP) Color(0xFF262A34)
                                        else Color.Transparent
                                    )
                                    .clickable { currentTab = AuthTab.SIGN_UP },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Sign Up",
                                    fontSize = 14.sp,
                                    fontWeight = if (currentTab == AuthTab.SIGN_UP) FontWeight.Bold else FontWeight.Normal,
                                    color = if (currentTab == AuthTab.SIGN_UP) Color.White else Color(0xFF94A3B8)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        AnimatedContent(
                            targetState = currentTab,
                            transitionSpec = {
                                fadeIn(animationSpec = tween(220)) togetherWith fadeOut(animationSpec = tween(180))
                            },
                            label = "authTabContent"
                        ) { tab ->
                            Column(modifier = Modifier.fillMaxWidth()) {
                                if (tab == AuthTab.SIGN_UP) {
                                    // Full Name Field
                                    Text(
                                        text = "Full Name",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFF94A3B8)
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    OutlinedTextField(
                                        value = fullName,
                                        onValueChange = { fullName = it },
                                        placeholder = { Text("e.g. Farhan", color = Color(0xFF64748B)) },
                                        leadingIcon = {
                                            Icon(Icons.Filled.Person, contentDescription = null, tint = Color(0xFF38BDF8))
                                        },
                                        singleLine = true,
                                        shape = RoundedCornerShape(14.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = Color(0xFF38BDF8),
                                            unfocusedBorderColor = Color(0xFF2A2E38),
                                            focusedTextColor = Color.White,
                                            unfocusedTextColor = Color.White,
                                            focusedContainerColor = Color(0xFF191C22),
                                            unfocusedContainerColor = Color(0xFF191C22)
                                        ),
                                        modifier = Modifier.fillMaxWidth()
                                    )

                                    Spacer(modifier = Modifier.height(16.dp))

                                    // Email Address Field
                                    Text(
                                        text = "Email Address",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFF94A3B8)
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    OutlinedTextField(
                                        value = emailAddress,
                                        onValueChange = { emailAddress = it },
                                        placeholder = { Text("e.g. farhan@example.com", color = Color(0xFF64748B)) },
                                        leadingIcon = {
                                            Icon(Icons.Filled.Email, contentDescription = null, tint = Color(0xFF38BDF8))
                                        },
                                        singleLine = true,
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                        shape = RoundedCornerShape(14.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = Color(0xFF38BDF8),
                                            unfocusedBorderColor = Color(0xFF2A2E38),
                                            focusedTextColor = Color.White,
                                            unfocusedTextColor = Color.White,
                                            focusedContainerColor = Color(0xFF191C22),
                                            unfocusedContainerColor = Color(0xFF191C22)
                                        ),
                                        modifier = Modifier.fillMaxWidth()
                                    )

                                    Spacer(modifier = Modifier.height(18.dp))

                                    // Role Selection
                                    Text(
                                        text = "Primary Role",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFF94A3B8)
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        // Patient Role Card
                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .clip(RoundedCornerShape(14.dp))
                                                .background(
                                                    if (selectedRole == Mode.PATIENT) Color(0xFF1E2838)
                                                    else Color(0xFF191C22)
                                                )
                                                .border(
                                                    width = 1.dp,
                                                    color = if (selectedRole == Mode.PATIENT) Color(0xFF38BDF8)
                                                    else Color(0xFF2A2E38),
                                                    shape = RoundedCornerShape(14.dp)
                                                )
                                                .clickable { selectedRole = Mode.PATIENT }
                                                .padding(12.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                Text("🧓", fontSize = 22.sp)
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    "Patient",
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = if (selectedRole == Mode.PATIENT) Color(0xFF38BDF8) else Color.White
                                                )
                                            }
                                        }

                                        // Caregiver Role Card
                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .clip(RoundedCornerShape(14.dp))
                                                .background(
                                                    if (selectedRole == Mode.CAREGIVER) Color(0xFF1E2838)
                                                    else Color(0xFF191C22)
                                                )
                                                .border(
                                                    width = 1.dp,
                                                    color = if (selectedRole == Mode.CAREGIVER) Color(0xFF38BDF8)
                                                    else Color(0xFF2A2E38),
                                                    shape = RoundedCornerShape(14.dp)
                                                )
                                                .clickable { selectedRole = Mode.CAREGIVER }
                                                .padding(12.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                Text("👨‍👩‍👧", fontSize = 22.sp)
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    "Caregiver",
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = if (selectedRole == Mode.CAREGIVER) Color(0xFF38BDF8) else Color.White
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(18.dp))
                                }

                                // Phone Number Field
                                Text(
                                    text = "Mobile Phone Number",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF94A3B8)
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                OutlinedTextField(
                                    value = phoneNumber,
                                    onValueChange = { phoneNumber = it },
                                    placeholder = { Text("+91 98765 43210", color = Color(0xFF64748B)) },
                                    leadingIcon = {
                                        Icon(Icons.Filled.Phone, contentDescription = null, tint = Color(0xFF38BDF8))
                                    },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Color(0xFF38BDF8),
                                        unfocusedBorderColor = Color(0xFF2A2E38),
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White,
                                        focusedContainerColor = Color(0xFF191C22),
                                        unfocusedContainerColor = Color(0xFF191C22)
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                )

                                Spacer(modifier = Modifier.height(18.dp))

                                // Channel Selection: SMS vs WhatsApp
                                Text(
                                    text = "Receive Real Code Via",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF94A3B8)
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    // SMS Pill
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(
                                                if (deliveryChannel == "sms") Color(0xFF1E2838)
                                                else Color(0xFF191C22)
                                            )
                                            .border(
                                                width = 1.dp,
                                                color = if (deliveryChannel == "sms") Color(0xFF38BDF8)
                                                else Color(0xFF2A2E38),
                                                shape = RoundedCornerShape(12.dp)
                                            )
                                            .clickable { deliveryChannel = "sms" }
                                            .padding(vertical = 10.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            "💬 Messages (SMS)",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (deliveryChannel == "sms") Color(0xFF38BDF8) else Color(0xFF94A3B8)
                                        )
                                    }

                                    // WhatsApp Pill
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(
                                                if (deliveryChannel == "whatsapp") Color(0xFF143026)
                                                else Color(0xFF191C22)
                                            )
                                            .border(
                                                width = 1.dp,
                                                color = if (deliveryChannel == "whatsapp") Color(0xFF25D366)
                                                else Color(0xFF2A2E38),
                                                shape = RoundedCornerShape(12.dp)
                                            )
                                            .clickable { deliveryChannel = "whatsapp" }
                                            .padding(vertical = 10.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            "🟢 WhatsApp",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (deliveryChannel == "whatsapp") Color(0xFF25D366) else Color(0xFF94A3B8)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(28.dp))

                                // Submit Button
                                Button(
                                    onClick = { dispatchRealOtp() },
                                    enabled = !isLoading,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(52.dp),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF38BDF8),
                                        contentColor = Color(0xFF0B1220)
                                    )
                                ) {
                                    if (isLoading) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(22.dp),
                                            strokeWidth = 2.5.dp,
                                            color = Color(0xFF0B1220)
                                        )
                                    } else {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Text(
                                                text = if (tab == AuthTab.SIGN_IN) "Send Real OTP Code" else "Create Account & Verify",
                                                fontSize = 15.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Icon(
                                                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                                contentDescription = null,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))

                // Footer Info
                Text(
                    text = "By continuing, you agree to NeuroTwin's\nPrivacy Policy and Medical Companion Terms",
                    fontSize = 11.5.sp,
                    color = Color(0xFF64748B),
                    textAlign = TextAlign.Center,
                    lineHeight = 16.sp
                )
            }
        }
    }
}
