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

suspend fun <T> safeApiCall(call: suspend () -> Response<T>): ApiResult<T> = withContext(Dispatchers.IO) {
    try {
        val response = call()
        if (response.isSuccessful) {
            response.body()?.let { ApiResult.Success(it) }
                ?: ApiResult.Failure("Empty response from server")
        } else {
            val detail = response.errorBody()?.string()
                ?.split("\"detail\":\"")?.getOrNull(1)?.split("\"")?.firstOrNull()
            ApiResult.Failure(detail ?: "Server error ${response.code()}")
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
    suspend fun health(): ApiResult<HealthStatus> = safeApiCall { api.health() }

    // ── People ──
    suspend fun people(): ApiResult<List<Person>> = safeApiCall { api.listPeople() }

    suspend fun createPerson(name: String, relationship: String, birthday: String?) =
        safeApiCall { api.createPerson(PersonRequest(name, relationship, birthday)) }

    suspend fun createPersonWithPhoto(
        name: String, relationship: String, birthday: String?, photo: File,
    ): ApiResult<Person> = safeApiCall {
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
        )
    }

    suspend fun deletePerson(id: String): ApiResult<Unit> = safeApiCall { api.deletePerson(id) }

    // ── Memories ──
    suspend fun memories(): ApiResult<List<Memory>> = safeApiCall { api.listMemories() }

    suspend fun createMemory(title: String, description: String?, category: String) =
        safeApiCall { api.createMemory(MemoryRequest(title, description, category)) }

    suspend fun deleteMemory(id: String): ApiResult<Unit> = safeApiCall { api.deleteMemory(id) }

    // ── Medicines ──
    suspend fun medicines(): ApiResult<List<Medicine>> = safeApiCall { api.listMedicines() }

    suspend fun saveMedicine(m: Medicine): ApiResult<Medicine> =
        if (m.id.isBlank()) safeApiCall { api.createMedicine(m) }
        else safeApiCall { api.updateMedicine(m.id, m) }

    suspend fun deleteMedicine(id: String): ApiResult<Unit> = safeApiCall { api.deleteMedicine(id) }

    // ── Emergency contacts ──
    suspend fun contacts(): ApiResult<List<EmergencyContact>> =
        safeApiCall { api.listEmergencyContacts() }

    suspend fun saveContact(c: EmergencyContact): ApiResult<EmergencyContact> =
        if (c.id.isBlank()) safeApiCall { api.createEmergencyContact(c) }
        else safeApiCall { api.updateEmergencyContact(c.id, c) }

    suspend fun deleteContact(id: String): ApiResult<Unit> =
        safeApiCall { api.deleteEmergencyContact(id) }

    // ── Companion chat ──
    suspend fun ask(query: String): ApiResult<com.neurotwin.app.network.VoiceResponse> =
        safeApiCall { api.sendVoiceQuery(com.neurotwin.app.network.VoiceRequest(query)) }
}
