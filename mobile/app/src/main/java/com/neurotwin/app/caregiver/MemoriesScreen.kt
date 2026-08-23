package com.neurotwin.app.caregiver

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.neurotwin.app.data.ApiResult
import com.neurotwin.app.data.MemoryCategories
import com.neurotwin.app.ui.common.*
import com.neurotwin.app.ui.theme.AppColors
import com.neurotwin.app.ui.theme.ThemeState

/** Memory library — OLED Dark & Stitch Light UI with category chips, search, add/delete. */
@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
fun MemoriesScreen(vm: CaregiverViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val isDark = ThemeState.isDarkMode
    LaunchedEffect(Unit) { if (vm.memories == null) vm.refreshMemories() }

    var query by remember { mutableStateOf("") }
    var category by remember { mutableStateOf<String?>(null) } // web label or null = all
    var showAdd by remember { mutableStateOf(false) }
    var deletingId by remember { mutableStateOf<String?>(null) }

    Column(
        Modifier
            .fillMaxSize()
            .background(AppColors.background)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        // Top Header
        Row(
            Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    text = "Memories",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.textPrimary
                )
                Text(
                    text = "Manage core recollections",
                    fontSize = 13.sp,
                    color = AppColors.textSecondary
                )
            }
            Button(
                onClick = { showAdd = true },
                shape = RoundedCornerShape(20.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColors.pillButtonBg),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
            ) {
                Icon(Icons.Filled.Add, contentDescription = null, tint = AppColors.pillButtonText, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(4.dp))
                Text("Add", fontWeight = FontWeight.Bold, color = AppColors.pillButtonText, fontSize = 13.sp)
            }
        }

        Spacer(Modifier.height(12.dp))

        // Search Bar (Stitch design)
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            placeholder = { Text("Search memories...", color = AppColors.textSecondary, fontSize = 14.sp) },
            leadingIcon = {
                Icon(Icons.Filled.Search, contentDescription = null, tint = AppColors.textSecondary, modifier = Modifier.size(20.dp))
            },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = AppColors.card,
                unfocusedContainerColor = AppColors.card,
                focusedTextColor = AppColors.textPrimary,
                unfocusedTextColor = AppColors.textPrimary,
                focusedBorderColor = Color(0xFF3B82F6),
                unfocusedBorderColor = AppColors.cardBorder
            )
        )

        Spacer(Modifier.height(10.dp))

        // Filter Chips (Stitch design)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
                selected = category == null,
                onClick = { category = null },
                label = { Text("All") },
                shape = RoundedCornerShape(18.dp),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = if (isDark) Color.White else Color(0xFF1E293B),
                    selectedLabelColor = if (isDark) Color.Black else Color.White,
                    containerColor = AppColors.card,
                    labelColor = AppColors.textSecondary
                ),
                border = FilterChipDefaults.filterChipBorder(
                    borderColor = AppColors.cardBorder,
                    selectedBorderColor = if (isDark) Color.White else Color(0xFF1E293B),
                    enabled = true,
                    selected = category == null
                )
            )
            MemoryCategories.WEB_TO_API.keys.forEach { web ->
                val isSel = category == web
                FilterChip(
                    selected = isSel,
                    onClick = { category = if (isSel) null else web },
                    label = { Text(web) },
                    shape = RoundedCornerShape(18.dp),
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = if (isDark) Color.White else Color(0xFF1E293B),
                        selectedLabelColor = if (isDark) Color.Black else Color.White,
                        containerColor = AppColors.card,
                        labelColor = AppColors.textSecondary
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        borderColor = AppColors.cardBorder,
                        selectedBorderColor = if (isDark) Color.White else Color(0xFF1E293B),
                        enabled = true,
                        selected = isSel
                    )
                )
            }
        }

        Spacer(Modifier.height(14.dp))

        when (val r = vm.memories) {
            null -> LoadingBox()
            is ApiResult.Failure -> ErrorRetryBox(r.message) { vm.refreshMemories() }
            is ApiResult.Success -> {
                val apiCat = category?.let { MemoryCategories.WEB_TO_API[it] }
                val list = r.data.filter { m ->
                    (apiCat == null || m.category == apiCat) &&
                        (query.isBlank() ||
                            m.title.contains(query, true) ||
                            m.description?.contains(query, true) == true)
                }
                if (list.isEmpty()) {
                    EmptyState(
                        "🖼️",
                        "No memories found",
                        "Try another filter or tap + Add to anchor a memory"
                    )
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        items(list, key = { it.id }) { memory ->
                            Card(
                                Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = AppColors.card),
                                border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Column(Modifier.padding(16.dp)) {
                                    // Row 1: Category Tag + Delete Icon
                                    Row(
                                        Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        val catLabel = MemoryCategories.API_TO_WEB[memory.category] ?: memory.category.uppercase()
                                        Surface(
                                            shape = RoundedCornerShape(8.dp),
                                            color = AppColors.cardAlt
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Icon(
                                                    Icons.Filled.Bookmark,
                                                    contentDescription = null,
                                                    tint = AppColors.textSecondary,
                                                    modifier = Modifier.size(13.dp)
                                                )
                                                Text(
                                                    text = catLabel.uppercase(),
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = AppColors.textPrimary
                                                )
                                            }
                                        }

                                        IconButton(
                                            onClick = { deletingId = memory.id },
                                            modifier = Modifier.size(32.dp)
                                        ) {
                                            Icon(
                                                Icons.Filled.DeleteOutline,
                                                contentDescription = "Delete",
                                                tint = Color(0xFFEF4444),
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }

                                    Spacer(Modifier.height(10.dp))

                                    // Title
                                    Text(
                                        text = memory.title,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = AppColors.textPrimary
                                    )

                                    // Description
                                    memory.description?.let { desc ->
                                        if (desc.isNotBlank()) {
                                            Spacer(Modifier.height(6.dp))
                                            Text(
                                                text = desc,
                                                fontSize = 13.sp,
                                                color = AppColors.textSecondary,
                                                lineHeight = 19.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAdd) AddMemoryDialog(vm) { showAdd = false }
    deletingId?.let { id ->
        ConfirmDeleteDialog(
            "memory",
            onConfirm = { vm.deleteMemory(id) },
            onDismiss = { deletingId = null }
        )
    }
}

@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
private fun AddMemoryDialog(vm: CaregiverViewModel, onDismiss: () -> Unit) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var webCategory by remember { mutableStateOf("Family") }
    var isSaving by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Anchor New Memory", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Memory Title") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Details & Recollection") },
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Text("Category:", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    MemoryCategories.WEB_TO_API.keys.forEach { cat ->
                        FilterChip(
                            selected = webCategory == cat,
                            onClick = { webCategory = cat },
                            label = { Text(cat, fontSize = 12.sp) },
                            shape = RoundedCornerShape(16.dp)
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                enabled = title.isNotBlank() && !isSaving,
                onClick = {
                    isSaving = true
                    val apiCat = MemoryCategories.WEB_TO_API[webCategory] ?: "story"
                    vm.addMemory(
                        title = title,
                        description = description.takeIf { it.isNotBlank() },
                        category = apiCat
                    ) { err ->
                        isSaving = false
                        if (err == null) onDismiss()
                    }
                },
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(if (isSaving) "Saving..." else "Save Anchor")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
