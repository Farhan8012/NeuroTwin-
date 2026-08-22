package com.neurotwin.app.data

import com.google.gson.annotations.SerializedName

// ── People ──
data class Person(
    val id: String,
    val name: String,
    val relationship: String,
    val birthday: String? = null,
    @SerializedName("photo_urls") val photoUrls: List<String> = emptyList(),
    @SerializedName("vector_status") val vectorStatus: String = "pending",
    val memories: List<String> = emptyList(),
    @SerializedName("important_life_events") val importantLifeEvents: List<String> = emptyList(),
    @SerializedName("favorite_songs") val favoriteSongs: List<String> = emptyList(),
    @SerializedName("favorite_places") val favoritePlaces: List<String> = emptyList(),
    val hobbies: List<String> = emptyList(),
    @SerializedName("family_stories") val familyStories: List<String> = emptyList(),
    @SerializedName("created_at") val createdAt: String? = null,
)

data class PersonRequest(
    val name: String,
    val relationship: String,
    val birthday: String? = null,
)

// ── Memories ──
data class Memory(
    val id: String,
    val title: String,
    val description: String? = null,
    val category: String = "story",
    @SerializedName("person_binding") val personBinding: String? = null,
    @SerializedName("created_at") val createdAt: String? = null,
)

data class MemoryRequest(
    val title: String,
    val description: String? = null,
    val category: String = "story",
    @SerializedName("person_binding") val personBinding: String? = null,
)

/** Web categories ↔ backend categories. */
object MemoryCategories {
    val WEB_TO_API = mapOf(
        "Family" to "story", "Travel" to "place", "Music" to "song",
        "Milestones" to "life_event", "Recipes" to "hobby", "Anecdotes" to "anecdote",
    )
    val API_TO_WEB = mapOf(
        "story" to "Family", "place" to "Travel", "song" to "Music",
        "life_event" to "Milestones", "hobby" to "Recipes", "anecdote" to "Anecdotes",
    )
}

// ── Medicines ──
data class Medicine(
    val id: String = "",
    val name: String,
    val dosage: String,
    @SerializedName("schedule_time") val scheduleTime: String,
    val instructions: String,
)

// ── Emergency contacts ──
data class EmergencyContact(
    val id: String = "",
    val name: String,
    val relationship: String,
    val phone: String,
    @SerializedName("is_primary") val isPrimary: Boolean = false,
)

// ── Health ──
data class HealthStatus(
    val status: String,
    val version: String? = null,
    val components: Map<String, String> = emptyMap(),
    @SerializedName("uptime_seconds") val uptimeSeconds: Double? = null,
)
