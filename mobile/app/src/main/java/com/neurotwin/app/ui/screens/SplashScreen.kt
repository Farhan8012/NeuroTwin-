package com.neurotwin.app.ui.screens

import android.media.MediaPlayer
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neurotwin.app.R
import kotlinx.coroutines.delay

/**
 * Opening Splash Page:
 * - Plays soothing ambient chime soundtrack (res/raw/splash_sound.wav)
 * - Animated glowing brain emblem with breathing pulse
 * - Exact styled typography matching the logo brand:
 *   "Neur" + [Neural Node Icon for 'o'] + "Twin" (Cyan/Purple gradient)
 * - Tagline: "— REMEMBER TOGETHER —" with sleek tapered divider lines
 * - Smooth staggered letter-by-letter entrance transitions
 * - Extended display time (4.2s) with instant tap-to-skip
 */
@Composable
fun SplashScreen(onAnimationFinished: () -> Unit) {
    val context = LocalContext.current
    var startAnimation by remember { mutableStateOf(false) }

    // Ambient Splash Chime Audio
    DisposableEffect(Unit) {
        var mediaPlayer: MediaPlayer? = null
        try {
            mediaPlayer = MediaPlayer.create(context, R.raw.splash_sound)?.apply {
                setVolume(0.85f, 0.85f)
                start()
            }
        } catch (_: Exception) {}

        onDispose {
            try {
                mediaPlayer?.let {
                    if (it.isPlaying) it.stop()
                    it.release()
                }
            } catch (_: Exception) {}
        }
    }

    LaunchedEffect(Unit) {
        delay(120)
        startAnimation = true
        // Extended delay so the user experiences the full musical chime & letter animation
        delay(4200)
        onAnimationFinished()
    }

    // Logo entrance scale & alpha
    val logoScale by animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0.65f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "logoScale"
    )

    val logoAlpha by animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0f,
        animationSpec = tween(durationMillis = 900, easing = FastOutSlowInEasing),
        label = "logoAlpha"
    )

    // Continuous breathing pulse
    val infiniteTransition = rememberInfiniteTransition(label = "infiniteGlow")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    // Tagline reveal animation
    val taglineAlpha by animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0f,
        animationSpec = tween(durationMillis = 1000, delayMillis = 1400, easing = LinearOutSlowInEasing),
        label = "taglineAlpha"
    )
    val taglineY by animateFloatAsState(
        targetValue = if (startAnimation) 0f else 18f,
        animationSpec = tween(durationMillis = 1000, delayMillis = 1400, easing = FastOutSlowInEasing),
        label = "taglineY"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF000000))
            .clickable { onAnimationFinished() }, // Tap to skip
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(horizontal = 24.dp)
        ) {
            // Glowing Brain Emblem Card
            Box(
                modifier = Modifier
                    .size(190.dp)
                    .scale(logoScale * pulseScale)
                    .alpha(logoAlpha),
                contentAlignment = Alignment.Center
            ) {
                // Radial ambient halo
                Box(
                    modifier = Modifier
                        .size(185.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(
                                    Color(0xFF38BDF8).copy(alpha = 0.40f),
                                    Color(0xFF818CF8).copy(alpha = 0.20f),
                                    Color.Transparent
                                )
                            )
                        )
                )

                // Logo Emblem
                Image(
                    painter = painterResource(id = R.drawable.app_logo_zoomed),
                    contentDescription = "NeuroTwin Emblem",
                    modifier = Modifier
                        .size(150.dp)
                        .clip(RoundedCornerShape(36.dp)),
                    contentScale = ContentScale.Crop
                )
            }

            Spacer(modifier = Modifier.height(40.dp))

            // Stylized "Neur [o] Twin" Letter Transition
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 1. "Neur" letters
                val neurLetters = listOf("N", "e", "u", "r")
                neurLetters.forEachIndexed { index, letter ->
                    val letterAlpha by animateFloatAsState(
                        targetValue = if (startAnimation) 1f else 0f,
                        animationSpec = tween(
                            durationMillis = 420,
                            delayMillis = 400 + (index * 70),
                            easing = FastOutSlowInEasing
                        ),
                        label = "neur_alpha_$index"
                    )

                    val letterOffsetY by animateFloatAsState(
                        targetValue = if (startAnimation) 0f else 26f,
                        animationSpec = spring(
                            dampingRatio = Spring.DampingRatioMediumBouncy,
                            stiffness = Spring.StiffnessLow
                        ),
                        label = "neur_offsetY_$index"
                    )

                    Text(
                        text = letter,
                        fontSize = 42.sp,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = FontFamily.SansSerif,
                        color = Color(0xFFFFFFFF),
                        modifier = Modifier
                            .offset(y = letterOffsetY.dp)
                            .alpha(letterAlpha)
                    )
                }

                // 2. Neural Badge for 'o'
                val oAlpha by animateFloatAsState(
                    targetValue = if (startAnimation) 1f else 0f,
                    animationSpec = tween(
                        durationMillis = 450,
                        delayMillis = 400 + (4 * 70),
                        easing = FastOutSlowInEasing
                    ),
                    label = "o_alpha"
                )

                val oOffsetY by animateFloatAsState(
                    targetValue = if (startAnimation) 0f else 26f,
                    animationSpec = spring(
                        dampingRatio = Spring.DampingRatioMediumBouncy,
                        stiffness = Spring.StiffnessLow
                    ),
                    label = "o_offsetY"
                )

                val oScale by animateFloatAsState(
                    targetValue = if (startAnimation) 1f else 0.4f,
                    animationSpec = spring(
                        dampingRatio = Spring.DampingRatioMediumBouncy,
                        stiffness = Spring.StiffnessLow
                    ),
                    label = "o_scale"
                )

                Box(
                    modifier = Modifier
                        .padding(horizontal = 2.dp)
                        .offset(y = oOffsetY.dp)
                        .alpha(oAlpha)
                        .scale(oScale),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.neuro_o_badge),
                        contentDescription = "Neural Network Icon",
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape),
                        contentScale = ContentScale.Fit
                    )
                }

                // 3. "Twin" letters with vibrant gradient style
                val twinLetters = listOf("T", "w", "i", "n")
                val twinGradient = Brush.linearGradient(
                    colors = listOf(
                        Color(0xFF0284C7),
                        Color(0xFF38BDF8),
                        Color(0xFFA855F7)
                    )
                )

                twinLetters.forEachIndexed { index, letter ->
                    val totalIndex = 5 + index
                    val letterAlpha by animateFloatAsState(
                        targetValue = if (startAnimation) 1f else 0f,
                        animationSpec = tween(
                            durationMillis = 420,
                            delayMillis = 400 + (totalIndex * 70),
                            easing = FastOutSlowInEasing
                        ),
                        label = "twin_alpha_$index"
                    )

                    val letterOffsetY by animateFloatAsState(
                        targetValue = if (startAnimation) 0f else 26f,
                        animationSpec = spring(
                            dampingRatio = Spring.DampingRatioMediumBouncy,
                            stiffness = Spring.StiffnessLow
                        ),
                        label = "twin_offsetY_$index"
                    )

                    Text(
                        text = letter,
                        fontSize = 42.sp,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = FontFamily.SansSerif,
                        style = TextStyle(brush = twinGradient),
                        modifier = Modifier
                            .offset(y = letterOffsetY.dp)
                            .alpha(letterAlpha)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Subtitle: "— REMEMBER TOGETHER —" with sleek tapered lines
            Row(
                modifier = Modifier
                    .offset(y = taglineY.dp)
                    .alpha(taglineAlpha),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Left tapered line
                Box(
                    modifier = Modifier
                        .width(42.dp)
                        .height(1.5.dp)
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(Color.Transparent, Color(0xFF38BDF8))
                            )
                        )
                )

                Text(
                    text = "REMEMBER TOGETHER",
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.SansSerif,
                    color = Color(0xFF94A3B8),
                    letterSpacing = 4.sp,
                    textAlign = TextAlign.Center
                )

                // Right tapered line
                Box(
                    modifier = Modifier
                        .width(42.dp)
                        .height(1.5.dp)
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(Color(0xFF38BDF8), Color.Transparent)
                            )
                        )
                )
            }
        }
    }
}
