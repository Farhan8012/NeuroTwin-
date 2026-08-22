package com.neurotwin.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight

// ── NeuroTwin design system (ADR #4: senior-accessibility-first dark theme) ──
// Dark canvas #09090b · card surfaces #1c2030 · gold accents #fbbf24 · Inter.

val NtBackground = Color(0xFF09090B)
val NtCard = Color(0xFF1C2030)
val NtCardBorder = Color(0xFF2C334A)
val NtGold = Color(0xFFFBBF24)
val NtGoldDim = Color(0x26FBBF24)
val NtTextPrimary = Color(0xFFFFFFFF)
val NtTextSecondary = Color(0xFFC5CBD8)
val NtTextMuted = Color(0xFF8B93A7)
val NtSuccess = Color(0xFF22C55E)
val NtDanger = Color(0xFFEF4444)
val NtInfo = Color(0xFF60A5FA)

private val NeuroTwinColors = darkColorScheme(
    primary = NtGold,
    onPrimary = Color(0xFF09090B),
    primaryContainer = Color(0xFF3A3113),
    onPrimaryContainer = NtGold,
    secondary = Color(0xFF38B2AC),
    onSecondary = Color(0xFF09090B),
    secondaryContainer = Color(0xFF173230),
    onSecondaryContainer = Color(0xFF7DE3DC),
    tertiary = NtInfo,
    onTertiary = Color(0xFF09090B),
    background = NtBackground,
    onBackground = NtTextPrimary,
    surface = NtCard,
    onSurface = NtTextPrimary,
    surfaceVariant = Color(0xFF232838),
    onSurfaceVariant = NtTextSecondary,
    error = NtDanger,
    onError = Color.White,
    errorContainer = Color(0xFF3B1414),
    onErrorContainer = Color(0xFFFCA5A5),
    outline = NtCardBorder,
    outlineVariant = Color(0xFF232838),
)

val Typography = Typography().let { base ->
    base.copy(
        // 32px headers, black weight — senior-readable hierarchy
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

/** Strict dark theme — always. */
@Composable
fun NeuroTwinTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = NeuroTwinColors,
        typography = Typography,
        content = content,
    )
}
