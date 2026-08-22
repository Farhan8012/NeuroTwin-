package com.neurotwin.app.caregiver

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.neurotwin.app.data.ApiResult
import com.neurotwin.app.data.MemoryCategories
import com.neurotwin.app.ui.common.*

/** Memory library — category chips, search, add/delete. Mirrors MemoryLibraryView. */
@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
fun MemoriesScreen(vm: CaregiverViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    LaunchedEffect(Unit) { if (vm.memories == null) vm.refreshMemories() }

    var query by remember { mutableStateOf("") }
    var category by remember { mutableStateOf<String?>(null) } // web label or null = all
    var showAdd by remember { mutableStateOf(false) }
    var deletingId by remember { mutableStateOf<String?>(null) }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Memories", style = MaterialTheme.typography.headlineSmall)
            Button(onClick = { showAdd = true }, shape = RoundedCornerShape(12.dp)) {
                Icon(Icons.Filled.Add, contentDescription = null,
                    modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Add")
            }
        }

        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = query, onValueChange = { query = it },
            placeholder = { Text("Search memories…") },
            singleLine = true, modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp))

        Spacer(Modifier.height(10.dp))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = category == null, onClick = { category = null },
                label = { Text("All") })
            MemoryCategories.WEB_TO_API.keys.forEach { web ->
                FilterChip(
                    selected = category == web,
                    onClick = { category = if (category == web) null else web },
                    label = { Text(web) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primary,
                        selectedLabelColor = MaterialTheme.colorScheme.onPrimary),
                )
            }
        }

        Spacer(Modifier.height(12.dp))
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
                if (list.isEmpty()) EmptyState("🖼️", "No memories found",
                    "Try another filter or add a new memory anchor")
                else LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(list, key = { it.id }) { memory ->
                        Card(
                            Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surface),
                        ) {
                            Row(Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(MemoryCategories.API_TO_WEB[memory.category]
                                            ?: memory.category,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary)
                                    }
                                    Spacer(Modifier.height(2.dp))
                                    Text(memory.title, fontWeight = FontWeight.SemiBold)
                                    memory.description?.let {
                                        Spacer(Modifier.height(4.dp))
                                        Text(it, style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            maxLines = 3)
                                    }
                                }
                                IconButton(onClick = { deletingId = memory.id }) {
                                    Icon(Icons.Filled.Delete, contentDescription = "Delete",
                                        tint = MaterialTheme.colorScheme.error)
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
        ConfirmDeleteDialog("memory",
            onConfirm = { vm.deleteMemory(id) },
            onDismiss = { deletingId = null })
    }
}

@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
private fun AddMemoryDialog(vm: CaregiverViewModel, onDismiss: () -> Unit) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var webCategory by remember { mutableStateOf("Family") }
    var error by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("New memory anchor") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(value = title, onValueChange = { title = it },
                    label = { Text("Title") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = description, onValueChange = { description = it },
                    label = { Text("Description / story") },
                    modifier = Modifier.fillMaxWidth(), minLines = 3)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    MemoryCategories.WEB_TO_API.keys.forEach { web ->
                        FilterChip(
                            selected = webCategory == web,
                            onClick = { webCategory = web },
                            label = { Text(web) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.primary,
                                selectedLabelColor = MaterialTheme.colorScheme.onPrimary),
                        )
                    }
                }
                error?.let { Text(it, color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall) }
            }
        },
        confirmButton = {
            Button(enabled = title.isNotBlank(), onClick = {
                vm.addMemory(title.trim(), description.trim().ifBlank { null },
                    MemoryCategories.WEB_TO_API[webCategory] ?: "story") {
                    it?.let { e -> error = e } ?: onDismiss()
                }
            }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
