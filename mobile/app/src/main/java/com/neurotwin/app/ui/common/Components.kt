package com.neurotwin.app.ui.common

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neurotwin.app.ui.theme.NtDanger
import com.neurotwin.app.ui.theme.NtSuccess

/** Big-number stat card (Recall Confidence, Mood Stability, …). */
@Composable
fun StatCard(title: String, value: String, delta: String?,
             positive: Boolean = true,
             modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.height(120.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(title, style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
            Spacer(Modifier.weight(1f))
            Text(value, fontSize = 28.sp, fontWeight = FontWeight.Black,
                color = MaterialTheme.colorScheme.onSurface)
            if (delta != null) {
                Text(delta, fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                    color = if (positive) NtSuccess else NtDanger)
            }
        }
    }
}

/** Titled card section used across screens. */
@Composable
fun SectionCard(
    title: String,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(title, style = MaterialTheme.typography.titleMedium)
                action?.invoke()
            }
            Spacer(Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
fun LoadingBox(message: String = "Loading…") {
    Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator()
            Spacer(Modifier.height(12.dp))
            Text(message, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun ErrorRetryBox(message: String, onRetry: () -> Unit) {
    Card(
        Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer),
    ) {
        Column(
            Modifier.padding(20.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text("⚠", fontSize = 28.sp)
            Spacer(Modifier.height(8.dp))
            Text(message, textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurface)
            Spacer(Modifier.height(12.dp))
            FilledTonalButton(onClick = onRetry) { Text("Retry") }
        }
    }
}

@Composable
fun EmptyState(icon: String, message: String, hint: String? = null) {
    Box(Modifier.fillMaxWidth().padding(vertical = 40.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(icon, fontSize = 40.sp)
            Spacer(Modifier.height(10.dp))
            Text(
                text = message,
                fontWeight = FontWeight.Bold,
                fontSize = 17.sp,
                color = MaterialTheme.colorScheme.onSurface,
                textAlign = TextAlign.Center
            )
            if (hint != null) {
                Spacer(Modifier.height(6.dp))
                Text(
                    text = hint,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 28.dp),
                    lineHeight = 18.sp
                )
            }
        }
    }
}

@Composable
fun ConfirmDeleteDialog(
    what: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Delete $what?") },
        text = { Text("This permanently removes it from the backend and cloud mirror.") },
        confirmButton = {
            TextButton(onClick = { onConfirm(); onDismiss() }) {
                Text("Delete", color = MaterialTheme.colorScheme.error)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

/**
 * Lightweight sparkline for the Cognitive Trend card — same idea as the web's
 * CognitiveTrendChart but drawn with Canvas instead of recharts.
 */
@Composable
fun TrendChart(values: List<Float>, modifier: Modifier = Modifier) {
    val lineColor = MaterialTheme.colorScheme.primary
    val fillColor = lineColor.copy(alpha = 0.12f)
    val gridColor = MaterialTheme.colorScheme.outlineVariant
    Canvas(modifier = modifier.fillMaxWidth().height(120.dp)) {
        if (values.size < 2) return@Canvas
        val minV = values.min()
        val maxV = values.max()
        val range = (maxV - minV).takeIf { it > 0f } ?: 1f
        fun x(i: Int) = size.width * i / (values.size - 1)
        fun y(v: Float) = size.height * 0.92f -
            ((v - minV) / range) * size.height * 0.78f

        // grid lines
        for (frac in listOf(0.25f, 0.55f, 0.85f)) {
            drawLine(gridColor, Offset(0f, size.height * frac),
                Offset(size.width, size.height * frac), strokeWidth = 2f)
        }

        val path = Path()
        values.forEachIndexed { i, v ->
            if (i == 0) path.moveTo(x(i), y(v)) else path.lineTo(x(i), y(v))
        }
        val fill = Path().apply {
            addPath(path)
            lineTo(x(values.size - 1), size.height)
            lineTo(0f, size.height)
            close()
        }
        drawPath(fill, fillColor)
        drawPath(path, lineColor, style = Stroke(width = 6f))
        // end dot
        drawCircle(lineColor, radius = 10f,
            center = Offset(x(values.size - 1), y(values.last())))
    }
}

/** Small colored pill for health component chips. */
@Composable
fun StatusChip(label: String, ok: Boolean, detail: String) {
    AssistChip(
        onClick = {},
        label = { Text("$label · $detail") },
        leadingIcon = {
            Box(
                Modifier
                    .size(8.dp)
                    .background(if (ok) NtSuccess else NtDanger, CircleShape)
            )
        },
    )
}
