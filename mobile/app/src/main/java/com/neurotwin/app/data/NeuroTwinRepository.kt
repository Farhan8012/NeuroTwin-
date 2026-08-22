package com.neurotwin.app.data

import android.content.Context
import com.neurotwin.app.network.RetrofitClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.Response
import java.io.File
import java.io.IOException

/** Live-API-only result: either data or a human-readable error. */
sealed interface ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>
    data class Failure(val message: String) : ApiResult<Nothing>
}

suspend fun <T> Response<T>.unwrap(): ApiResult<T> = withContext(Dispatchers.IO) {
    try {
        if (isSuccessful) {
            body()?.let { ApiResult.Success(it) }
                ?: ApiResult.Failure("Empty response from server")
        } else {
            val detail = errorBody()?.string()
                ?.split("\"detail\":\"")?.getOrNull(1)?.split("\"")?.firstOrNull()
            ApiResult.Failure(detail ?: "Server error ${code()}")
        }
    } catch (e: IOException) {
        ApiResult.Failure(
            "Can't reach the backend at ${RetrofitClient.currentBaseUrl()}\n" +
                "Check it's running and the address in Settings."
        )
    } catch (e: Exception) {
        ApiResult.Failure(e.message ?: "Unexpected error")
    }
}

/** Single entry point for all caregiver + patient API calls. */
class NeuroTwinRepository(private val context: Context) {

    private val api get() = RetrofitClient.api(context)

    // ── System ──
    suspend fun health(): ApiResult<HealthStatus> = api.health().unwrap()

    // ── People ──
    suspend fun people(): ApiResult<List<Person>> = api.listPeople().unwrap()

    suspend fun createPerson(name: String, relationship: String, birthday: String?) =
        api.createPerson(PersonRequest(name, relationship, birthday)).unwrap()

    suspend fun createPersonWithPhoto(
        name: String, relationship: String, birthday: String?, photo: File,
    ): ApiResult<Person> = withContext(Dispatchers.IO) {
        try {
            val part = MultipartBody.Part.createFormData(
                "photos", photo.name,
                photo.asRequestBody("image/jpeg".toMediaType()),
            )
            api.createPersonWithPhoto(
                name.toRequestBody("text/plain".toMediaType()),
                relationship.toRequestBody("text/plain".toMediaType()),
                birthday?.takeIf { it.isNotBlank() }
                    ?.toRequestBody("text/plain".toMediaType()),
                listOf(part),
            ).unwrap()
        } catch (e: Exception) {
            ApiResult.Failure(e.message ?: "Upload failed")
        }
    }

    suspend fun deletePerson(id: String): ApiResult<Unit> = api.deletePerson(id).unwrap()

    // ── Memories ──
    suspend fun memories(): ApiResult<List<Memory>> = api.listMemories().unwrap()

    suspend fun createMemory(title: String, description: String?, category: String) =
        api.createMemory(MemoryRequest(title, description, category)).unwrap()

    suspend fun deleteMemory(id: String): ApiResult<Unit> = api.deleteMemory(id).unwrap()

    // ── Medicines ──
    suspend fun medicines(): ApiResult<List<Medicine>> = api.listMedicines().unwrap()

    suspend fun saveMedicine(m: Medicine): ApiResult<Medicine> =
        if (m.id.isBlank()) api.createMedicine(m).unwrap()
        else api.updateMedicine(m.id, m).unwrap()

    suspend fun deleteMedicine(id: String): ApiResult<Unit> = api.deleteMedicine(id).unwrap()

    // ── Emergency contacts ──
    suspend fun contacts(): ApiResult<List<EmergencyContact>> =
        api.listEmergencyContacts().unwrap()

    suspend fun saveContact(c: EmergencyContact): ApiResult<EmergencyContact> =
        if (c.id.isBlank()) api.createEmergencyContact(c).unwrap()
        else api.updateEmergencyContact(c.id, c).unwrap()

    suspend fun deleteContact(id: String): ApiResult<Unit> =
        api.deleteEmergencyContact(id).unwrap()

    // ── Companion chat ──
    suspend fun ask(query: String): ApiResult<com.neurotwin.app.network.VoiceResponse> =
        api.sendVoiceQuery(com.neurotwin.app.network.VoiceRequest(query)).unwrap()
}
