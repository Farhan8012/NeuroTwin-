package com.neurotwin.app.ui.theme

import android.content.Context
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight

// ── Theme State Singleton ──
object ThemeState {
    var isDarkMode by mutableStateOf(false)
        private set

    fun init(context: Context) {
        val prefs = context.getSharedPreferences("neurotwin_theme_prefs", Context.MODE_PRIVATE)
        isDarkMode = prefs.getBoolean("is_dark_mode", false)
    }

    fun toggle(context: Context) {
        isDarkMode = !isDarkMode
        val prefs = context.getSharedPreferences("neurotwin_theme_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("is_dark_mode", isDarkMode).apply()
    }
}

// ── Shared Colors ──
val NtSuccess = Color(0xFF22C55E)
val NtDanger = Color(0xFFEF4444)
val NtGold = Color(0xFFFBBF24)

// ── Dynamic Color Helper ──
object AppColors {
    val background: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF000000) else Color(0xFFFBF9FA)
    val topBar: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF000000) else Color(0xFFFFFFFF)
    val card: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF141619) else Color(0xFFFFFFFF)
    val cardAlt: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF1C1F23) else Color(0xFFF8FAFC)
    val cardBorder: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF26282B) else Color(0xFFE2E8F0)
    val textPrimary: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFFFFFFFF) else Color(0xFF0F172A)
    val textSecondary: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF94A3B8) else Color(0xFF64748B)
    val textMuted: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF64748B) else Color(0xFF94A3B8)
    val divider: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF22252A) else Color(0xFFF1F5F9)
    val navBar: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF000000) else Color(0xFFFFFFFF)
    val navIndicator: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF33363B) else Color(0xFFEFF6FF)
    val navSelectedIcon: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFFFFFFFF) else Color(0xFF2563EB)
    val navUnselectedIcon: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF64748B) else Color(0xFF64748B)
    
    // Emergency SOS
    val sosCard: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF7F0F16) else Color(0xFFFEF2F2)
    val sosCardBorder: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF991B1B) else Color(0xFFFECACA)
    val sosTitle: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFFFFFFFF) else Color(0xFF991B1B)
    val sosText: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFFFFD1D1) else Color(0xFFDC2626)
    val sosButton: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFFFFA4A2) else Color(0xFFDC2626)
    val sosButtonText: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF7F0F16) else Color(0xFFFFFFFF)
    
    // Buttons & Chips
    val pillButtonBg: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF2A2D32) else Color(0xFFEFF6FF)
    val pillButtonText: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFFFFFFFF) else Color(0xFF2563EB)
    val liveSessionBtn: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFFE5E7EB) else Color(0xFF1E293B)
    val liveSessionBtnText: Color @Composable get() = if (ThemeState.isDarkMode) Color(0xFF111827) else Color(0xFFFFFFFF)
}

// ── 99% OLED Pure Black Scheme ──
private val OLEDBlackColors = darkColorScheme(
    primary = Color(0xFF3B82F6),
    onPrimary = Color.White,
    primaryContainer = Color(0xFF1E3A8A),
    onPrimaryContainer = Color(0xFFDBEAFE),
    secondary = Color(0xFF10B981),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFF064E3B),
    onSecondaryContainer = Color(0xFFA7F3D0),
    background = Color(0xFF000000),
    onBackground = Color(0xFFFFFFFF),
    surface = Color(0xFF141619),
    onSurface = Color(0xFFFFFFFF),
    surfaceVariant = Color(0xFF1C1F23),
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF26282B),
    outlineVariant = Color(0xFF22252A),
    error = Color(0xFFEF4444),
    onError = Color.White,
    errorContainer = Color(0xFF450A0A),
    onErrorContainer = Color(0xFFFCA5A5),
)

// ── Stitch Clean Light Scheme ──
private val CleanLightColors = lightColorScheme(
    primary = Color(0xFF2563EB),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFEFF6FF),
    onPrimaryContainer = Color(0xFF1E40AF),
    secondary = Color(0xFF059669),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFECFDF5),
    onSecondaryContainer = Color(0xFF065F46),
    background = Color(0xFFFBF9FA),
    onBackground = Color(0xFF0F172A),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = Color(0xFF64748B),
    outline = Color(0xFFE2E8F0),
    outlineVariant = Color(0xFFCBD5E1),
    error = Color(0xFFDC2626),
    onError = Color.White,
    errorContainer = Color(0xFFFEE2E2),
    onErrorContainer = Color(0xFF991B1B),
)

val Typography = Typography().let { base ->
    base.copy(
        displayLarge = base.displayLarge.copy(fontWeight = FontWeight.Black),
        headlineLarge = base.headlineLarge.copy(fontWeight = FontWeight.Black),
        headlineMedium = base.headlineMedium.copy(fontWeight = FontWeight.Black),
        headlineSmall = base.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
        titleLarge = base.titleLarge.copy(fontWeight = FontWeight.Bold),
        titleMedium = base.titleMedium.copy(fontWeight = FontWeight.Bold),
        titleSmall = base.titleSmall.copy(fontWeight = FontWeight.SemiBold),
        labelLarge = base.labelLarge.copy(fontWeight = FontWeight.SemiBold),
        labelMedium = base.labelMedium.copy(fontWeight = FontWeight.SemiBold),
    )
}

@Composable
fun NeuroTwinTheme(
    darkTheme: Boolean = ThemeState.isDarkMode,
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) OLEDBlackColors else CleanLightColors

    MaterialTheme(
        colorScheme = colors,
        typography = Typography,
        content = content,
    )
}
