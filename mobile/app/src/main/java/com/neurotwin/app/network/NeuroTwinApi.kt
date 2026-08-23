package com.neurotwin.app.network

import com.neurotwin.app.data.EmergencyContact
import com.neurotwin.app.data.HealthStatus
import com.neurotwin.app.data.Medicine
import com.neurotwin.app.data.Memory
import com.neurotwin.app.data.MemoryRequest
import com.neurotwin.app.data.Person
import com.neurotwin.app.data.PersonRequest
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

/**
 * Full NeuroTwin backend API. Caregiver endpoints mirror the web dashboard's
 * calls; patient endpoints (frame/voice/ble) serve the companion mode.
 */
interface NeuroTwinApi {

    // ── System ──
    @GET("api/v1/health")
    suspend fun health(): Response<HealthStatus>

    // ── People ──
    @GET("api/v1/people")
    suspend fun listPeople(): Response<List<Person>>

    @POST("api/v1/people")
    suspend fun createPerson(@Body body: PersonRequest): Response<Person>

    /** Multipart registration: photo(s) get face-indexed into Qdrant. */
    @Multipart
    @POST("api/v1/people/with-photo")
    suspend fun createPersonWithPhoto(
        @Part("name") name: okhttp3.RequestBody,
        @Part("relationship") relationship: okhttp3.RequestBody,
        @Part("birthday") birthday: okhttp3.RequestBody? = null,
        @Part photos: List<MultipartBody.Part>,
    ): Response<Person>

    @GET("api/v1/people/{id}")
    suspend fun getPerson(@Path("id") id: String): Response<Person>

    @PUT("api/v1/people/{id}")
    suspend fun updatePerson(@Path("id") id: String, @Body body: PersonRequest): Response<Person>

    @DELETE("api/v1/people/{id}")
    suspend fun deletePerson(@Path("id") id: String): Response<Unit>

    // ── Memories ──
    @GET("api/v1/memories")
    suspend fun listMemories(): Response<List<Memory>>

    @POST("api/v1/memories")
    suspend fun createMemory(@Body body: MemoryRequest): Response<Map<String, Any>>

    @DELETE("api/v1/memories/{id}")
    suspend fun deleteMemory(@Path("id") id: String): Response<Unit>

    // ── Medicines ──
    @GET("api/v1/medicines")
    suspend fun listMedicines(): Response<List<Medicine>>

    @POST("api/v1/medicines")
    suspend fun createMedicine(@Body body: Medicine): Response<Medicine>

    @PUT("api/v1/medicines/{id}")
    suspend fun updateMedicine(@Path("id") id: String, @Body body: Medicine): Response<Medicine>

    @DELETE("api/v1/medicines/{id}")
    suspend fun deleteMedicine(@Path("id") id: String): Response<Unit>

    // ── Emergency contacts ──
    @GET("api/v1/emergency-contacts")
    suspend fun listEmergencyContacts(): Response<List<EmergencyContact>>

    @POST("api/v1/emergency-contacts")
    suspend fun createEmergencyContact(@Body body: EmergencyContact): Response<EmergencyContact>

    @PUT("api/v1/emergency-contacts/{id}")
    suspend fun updateEmergencyContact(
        @Path("id") id: String, @Body body: EmergencyContact,
    ): Response<EmergencyContact>

    @DELETE("api/v1/emergency-contacts/{id}")
    suspend fun deleteEmergencyContact(@Path("id") id: String): Response<Unit>

    // ── Patient pipeline ──
    @Multipart
    @POST("api/v1/frame")
    suspend fun uploadFrame(@Part frame: MultipartBody.Part): Response<FrameResponse>

    @POST("api/v1/voice-query")
    suspend fun sendVoiceQuery(@Body request: VoiceRequest): Response<VoiceResponse>

    /** Raw audio → server-side Whisper STT → LLM → TTS. */
    @Multipart
    @POST("api/v1/voice-query/audio")
    suspend fun sendVoiceAudio(
        @Part audio: MultipartBody.Part,
        @Part("visual_context") visualContext: okhttp3.RequestBody? = null,
    ): Response<VoiceResponse>

    @POST("api/v1/ble/rssi")
    suspend fun reportBLE(@Body data: Map<String, Any>): Response<Map<String, Any>>

    // ── Authentication & Real OTP ──
    @POST("api/v1/auth/send-otp")
    suspend fun sendOtp(@Body body: SendOtpRequest): Response<AuthResponse>

    @POST("api/v1/auth/verify-otp")
    suspend fun verifyOtp(@Body body: VerifyOtpRequest): Response<AuthResponse>
}

data class SendOtpRequest(
    val phone: String,
    val user_name: String? = null,
    val mode: String? = "PATIENT",
    val channel: String = "sms"
)

data class VerifyOtpRequest(
    val phone: String,
    val otp: String,
    val user_name: String? = null,
    val mode: String? = "PATIENT"
)

data class AuthResponse(
    val success: Boolean,
    val message: String,
    val phone: String,
    val user_name: String? = null,
    val mode: String? = null,
    val token: String? = null,
    val otp_debug: String? = null
)
