package com.neurotwin.app.caregiver

import android.graphics.Bitmap
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
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
import com.neurotwin.app.ui.theme.AppColors
import com.neurotwin.app.ui.theme.ThemeState
import java.io.File

/** Face-registry roster: search, register with photo, expand profile, delete. */
@Composable
fun PeopleScreen(vm: CaregiverViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    val context = LocalContext.current
    LaunchedEffect(Unit) { if (vm.people == null) vm.refreshPeople() }

    var query by remember { mutableStateOf("") }
    var showAdd by remember { mutableStateOf(false) }
    var deleting by remember { mutableStateOf<Person?>(null) }

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
            Text(
                text = "People",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.textPrimary
            )
            IconButton(
                onClick = { showAdd = true },
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(AppColors.pillButtonBg)
            ) {
                Icon(
                    Icons.Filled.Add,
                    contentDescription = "Add Person",
                    tint = AppColors.pillButtonText,
                    modifier = Modifier.size(22.dp)
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // Search Bar (Stitch design)
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            placeholder = { Text("Search family and friends...", color = AppColors.textSecondary, fontSize = 14.sp) },
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

        Spacer(Modifier.height(14.dp))

        when (val r = vm.people) {
            null -> LoadingBox()
            is ApiResult.Failure -> ErrorRetryBox(r.message) { vm.refreshPeople() }
            is ApiResult.Success -> {
                val list = r.data.filter {
                    it.name.contains(query, true) || it.relationship.contains(query, true)
                }
                if (list.isEmpty()) {
                    EmptyState(
                        "👥",
                        "No people registered",
                        "Tap + to register someone to the family & friends roster"
                    )
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(list, key = { it.id }) { person ->
                            PersonCard(person, onDelete = { deleting = person })
                        }
                    }
                }
            }
        }
    }

    if (showAdd) AddPersonDialog(vm, onDismiss = { showAdd = false })
    deleting?.let { person ->
        ConfirmDeleteDialog(
            "person ${person.name}",
            onConfirm = { vm.deletePerson(person.id) },
            onDismiss = { deleting = null }
        )
    }
}

@Composable
private fun PersonCard(person: Person, onDelete: () -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val isDark = ThemeState.isDarkMode

    Card(
        Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = AppColors.card),
        border = androidx.compose.foundation.BorderStroke(1.dp, AppColors.cardBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Avatar: real photo if present, else initials/avatar placeholder
                Box(
                    Modifier
                        .size(54.dp)
                        .clip(CircleShape)
                        .background(AppColors.cardAlt)
                        .border(1.dp, AppColors.cardBorder, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    if (person.photoUrls.isNotEmpty()) {
                        AsyncImage(
                            model = RetrofitClient.currentBaseUrl().trimEnd('/') + person.photoUrls.first(),
                            contentDescription = person.name,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize(),
                        )
                    } else {
                        Text(
                            text = person.name.take(1).uppercase(),
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = AppColors.textPrimary
                        )
                    }
                }

                Spacer(Modifier.width(14.dp))

                Column(Modifier.weight(1f)) {
                    Text(
                        text = person.name,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.textPrimary
                    )
                    Text(
                        text = person.relationship,
                        fontSize = 13.sp,
                        color = AppColors.textSecondary
                    )
                }

                // Status Badge (Verified vs Pending)
                val isVerified = person.vectorStatus.lowercase() in listOf("ready", "indexed", "active", "verified")
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = if (isVerified) (if (isDark) Color(0xFF064E3B) else Color(0xFFF1F5F9)) else (if (isDark) Color(0xFF451A03) else Color(0xFFFFFBEB)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (isVerified) (if (isDark) Color(0xFF047857) else Color(0xFFE2E8F0)) else (if (isDark) Color(0xFF78350F) else Color(0xFFFDE68A)))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            if (isVerified) Icons.Filled.CheckCircle else Icons.Filled.Schedule,
                            contentDescription = null,
                            tint = if (isVerified) (if (isDark) Color(0xFFA7F3D0) else Color(0xFF334155)) else (if (isDark) Color(0xFFFDE68A) else Color(0xFFD97706)),
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = if (isVerified) "Verified" else "Pending",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isVerified) (if (isDark) Color(0xFFA7F3D0) else Color(0xFF334155)) else (if (isDark) Color(0xFFFDE68A) else Color(0xFF92400E))
                        )
                    }
                }

                Spacer(Modifier.width(4.dp))

                IconButton(onClick = onDelete) {
                    Icon(
                        Icons.Filled.DeleteOutline,
                        contentDescription = "Delete",
                        tint = Color(0xFFEF4444),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            // View Details Row (Stitch design)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded }
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (expanded) "Hide details" else "View details",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = AppColors.textPrimary
                )
                Spacer(Modifier.width(4.dp))
                Icon(
                    if (expanded) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowRight,
                    contentDescription = null,
                    tint = AppColors.textPrimary,
                    modifier = Modifier.size(16.dp)
                )
            }

            if (expanded) {
                Spacer(Modifier.height(6.dp))
                HorizontalDivider(color = AppColors.divider)
                Spacer(Modifier.height(10.dp))
                ProfileList("🎂 Birthday", listOfNotNull(person.birthday?.takeIf { it.isNotBlank() }))
                ProfileList("💭 Memories", person.memories)
                ProfileList("⭐ Life events", person.importantLifeEvents)
                ProfileList("🎵 Songs", person.favoriteSongs)
                ProfileList("📍 Places", person.favoritePlaces)
                ProfileList("🎨 Hobbies", person.hobbies)
                ProfileList("📖 Stories", person.familyStories)
            }
        }
    }
}

@Composable
private fun ProfileList(title: String, items: List<String>) {
    if (items.isEmpty()) return
    Column(Modifier.padding(vertical = 3.dp)) {
        Text(title, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = AppColors.textSecondary)
        items.forEach { item ->
            Text("• $item", fontSize = 13.sp, color = AppColors.textPrimary, modifier = Modifier.padding(start = 6.dp, top = 2.dp))
        }
    }
}

@Composable
private fun AddPersonDialog(vm: CaregiverViewModel, onDismiss: () -> Unit) {
    var name by remember { mutableStateOf("") }
    var rel by remember { mutableStateOf("") }
    var photoBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var photoFile by remember { mutableStateOf<File?>(null) }
    val context = LocalContext.current
    var isSaving by remember { mutableStateOf(false) }

    val photoPicker = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        uri?.let {
            val bmp = android.provider.MediaStore.Images.Media.getBitmap(context.contentResolver, it)
            photoBitmap = bmp
            val file = File(context.cacheDir, "face_${System.currentTimeMillis()}.jpg")
            file.outputStream().use { out -> bmp.compress(Bitmap.CompressFormat.JPEG, 90, out) }
            photoFile = file
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Register Face & Details", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    name,
                    { name = it },
                    label = { Text("Full Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    rel,
                    { rel = it },
                    label = { Text("Relationship (e.g. Daughter, Friend)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(Modifier.height(4.dp))
                Button(
                    onClick = { photoPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B))
                ) {
                    Icon(Icons.Filled.AddAPhoto, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(if (photoFile != null) "Change Face Photo" else "Upload Face Photo")
                }

                photoBitmap?.let {
                    Image(
                        bitmap = it.asImageBitmap(),
                        contentDescription = "Preview",
                        modifier = Modifier
                            .size(90.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .align(Alignment.CenterHorizontally),
                        contentScale = ContentScale.Crop,
                    )
                }
            }
        },
        confirmButton = {
            Button(
                enabled = name.isNotBlank() && rel.isNotBlank() && !isSaving,
                onClick = {
                    isSaving = true
                    val file = photoFile
                    if (file != null) {
                        vm.addPersonWithPhoto(name, rel, null, file) { err ->
                            isSaving = false
                            if (err == null) onDismiss()
                        }
                    } else {
                        vm.addPerson(name, rel, null) { err ->
                            isSaving = false
                            if (err == null) onDismiss()
                        }
                    }
                },
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(if (isSaving) "Saving..." else "Register")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
