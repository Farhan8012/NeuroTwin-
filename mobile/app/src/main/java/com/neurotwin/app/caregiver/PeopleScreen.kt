package com.neurotwin.app.caregiver

import android.graphics.Bitmap
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.neurotwin.app.data.ApiResult
import com.neurotwin.app.data.Person
import com.neurotwin.app.network.RetrofitClient
import com.neurotwin.app.ui.common.*
import java.io.File

/** Face-registry roster: search, register with photo, expand profile, delete. */
@Composable
fun PeopleScreen(vm: CaregiverViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val context = LocalContext.current
    LaunchedEffect(Unit) { if (vm.people == null) vm.refreshPeople() }

    var query by remember { mutableStateOf("") }
    var showAdd by remember { mutableStateOf(false) }
    var deleting by remember { mutableStateOf<Person?>(null) }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("People", style = MaterialTheme.typography.headlineSmall)
            Button(onClick = { showAdd = true }, shape = RoundedCornerShape(12.dp)) {
                Icon(Icons.Filled.PersonAdd, contentDescription = null,
                    modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Register")
            }
        }
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = query, onValueChange = { query = it },
            placeholder = { Text("Search people…") },
            singleLine = true, modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp))

        Spacer(Modifier.height(12.dp))
        when (val r = vm.people) {
            null -> LoadingBox()
            is ApiResult.Failure -> ErrorRetryBox(r.message) { vm.refreshPeople() }
            is ApiResult.Success -> {
                val list = r.data.filter {
                    it.name.contains(query, true) || it.relationship.contains(query, true)
                }
                if (list.isEmpty()) EmptyState("👥", "No people registered",
                    "Tap Register to add someone with a face photo")
                else LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(list, key = { it.id }) { person ->
                        PersonCard(person,
                            onDelete = { deleting = person })
                    }
                }
            }
        }
    }

    if (showAdd) AddPersonDialog(vm, onDismiss = { showAdd = false })
    deleting?.let { person ->
        ConfirmDeleteDialog("person ${person.name}",
            onConfirm = { vm.deletePerson(person.id) },
            onDismiss = { deleting = null })
    }
}

@OptIn(androidx.compose.animation.ExperimentalAnimationApi::class)
@Composable
private fun PersonCard(person: Person, onDelete: () -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Card(
        Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Avatar: real photo if present, else initial
                Box(
                    Modifier.size(52.dp).clip(CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    if (person.photoUrls.isNotEmpty()) {
                        AsyncImage(
                            model = RetrofitClient.currentBaseUrl().trimEnd('/') +
                                person.photoUrls.first(),
                            contentDescription = person.name,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize(),
                        )
                    } else {
                        Surface(color = MaterialTheme.colorScheme.primaryContainer,
                            shape = CircleShape, modifier = Modifier.fillMaxSize()) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(person.name.take(1), fontSize = 22.sp,
                                    fontWeight = FontWeight.Black,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer)
                            }
                        }
                    }
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(person.name, fontWeight = FontWeight.Bold)
                    Text(person.relationship, style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                VectorBadge(person.vectorStatus)
                IconButton(onClick = onDelete) {
                    Icon(Icons.Filled.Delete, contentDescription = "Delete",
                        tint = MaterialTheme.colorScheme.error)
                }
            }

            if (expanded) {
                Spacer(Modifier.height(10.dp))
                HorizontalDivider()
                Spacer(Modifier.height(10.dp))
                ProfileList("🎂 Birthday", listOfNotNull(person.birthday))
                ProfileList("💭 Memories", person.memories)
                ProfileList("⭐ Life events", person.importantLifeEvents)
                ProfileList("🎵 Songs", person.favoriteSongs)
                ProfileList("📍 Places", person.favoritePlaces)
                ProfileList("🎨 Hobbies", person.hobbies)
                ProfileList("📖 Stories", person.familyStories)
            }

            TextButton(onClick = { expanded = !expanded }) {
                Icon(if (expanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                    contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(4.dp))
                Text(if (expanded) "Hide details" else "View details")
            }
        }
    }
}

@Composable
private fun VectorBadge(status: String) {
    val ok = status == "indexed"
    AssistChip(
        onClick = {},
        label = {
            Text(status.replace("_", " "), style = MaterialTheme.typography.labelSmall)
        },
        colors = AssistChipDefaults.assistChipColors(
            containerColor = if (ok) MaterialTheme.colorScheme.secondaryContainer
                             else MaterialTheme.colorScheme.tertiaryContainer,
        ),
    )
}

@Composable
private fun ProfileList(label: String, values: List<String>) {
    if (values.isEmpty()) return
    Column(Modifier.padding(bottom = 8.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        values.forEach {
            Text("• $it", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

// ── Registration dialog with camera / gallery ──

@Composable
private fun AddPersonDialog(vm: CaregiverViewModel, onDismiss: () -> Unit) {
    val context = LocalContext.current
    var name by remember { mutableStateOf("") }
    var relationship by remember { mutableStateOf("") }
    var birthday by remember { mutableStateOf("") }
    var photo by remember { mutableStateOf<Bitmap?>(null) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val cameraLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.TakePicturePreview()
    ) { bitmap -> if (bitmap != null) photo = bitmap }

    val galleryLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        uri ?: return@rememberLauncherForActivityResult
        val src = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
        if (src != null) {
            val bmp = android.graphics.BitmapFactory.decodeByteArray(src, 0, src.size)
            if (bmp != null) photo = bmp
        }
    }

    AlertDialog(
        onDismissRequest = { if (!busy) onDismiss() },
        title = { Text("Register person") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(value = name, onValueChange = { name = it },
                    label = { Text("Full name") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = relationship, onValueChange = { relationship = it },
                    label = { Text("Relationship (e.g. Daughter)") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = birthday, onValueChange = { birthday = it },
                    label = { Text("Birthday YYYY-MM-DD (optional)") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    FilledTonalButton(onClick = { cameraLauncher.launch(null) }) {
                        Icon(Icons.Filled.AddAPhoto, contentDescription = null,
                            modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp)); Text("Camera")
                    }
                    FilledTonalButton(onClick = {
                        galleryLauncher.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                    }) { Text("Gallery") }
                }
                photo?.let {
                    Image(it.asImageBitmap(), contentDescription = "preview",
                        modifier = Modifier.fillMaxWidth().height(140.dp).clip(RoundedCornerShape(12.dp)),
                        contentScale = ContentScale.Crop)
                    Text("Face will be indexed into Qdrant for recognition",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                error?.let { Text(it, color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall) }
            }
        },
        confirmButton = {
            Button(
                enabled = name.isNotBlank() && relationship.isNotBlank() && !busy,
                onClick = {
                    busy = true; error = null
                    fun finish(err: String?) { busy = false; err?.let { error = it } ?: onDismiss() }
                    val bmp = photo
                    if (bmp == null) {
                        vm.addPerson(name.trim(), relationship.trim(),
                            birthday.trim().ifBlank { null }) { finish(it) }
                    } else {
                        // Write bitmap to cache and upload through /people/with-photo
                        val dir = File(context.cacheDir, "registrations").apply { mkdirs() }
                        val file = File(dir, "reg_${System.currentTimeMillis()}.jpg")
                        file.outputStream().use { out ->
                            bmp.compress(Bitmap.CompressFormat.JPEG, 92, out)
                        }
                        vm.addPersonWithPhoto(name.trim(), relationship.trim(),
                            birthday.trim().ifBlank { null }, file) { finish(it) }
                    }
                },
            ) { if (busy) CircularProgressIndicator(Modifier.size(18.dp),
                strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                else Text("Register") }
        },
        dismissButton = {
            TextButton(enabled = !busy, onClick = onDismiss) { Text("Cancel") }
        },
    )
}
