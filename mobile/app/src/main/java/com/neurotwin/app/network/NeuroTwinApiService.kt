package com.neurotwin.app.network

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

data class FrameResponse(
    val matched: Boolean,
    val confidence: Float,
    val person: Map<String, Any>?,
    val detected_objects: List<Map<String, Any>>,
    val processing_time_ms: Float
)

data class VoiceRequest(
    val patient_query: String,
    val visual_context: Map<String, Any>? = null
)

data class VoiceResponse(
    val transcript: String,
    val llm_response: String,
    val persona: String,
    val tts_audio_url: String?,
    val processing_time_ms: Float
)

interface NeuroTwinApi {
    @Multipart
    @POST("api/v1/frame")
    suspend fun uploadFrame(
        @Part frame: MultipartBody.Part
    ): Response<FrameResponse>

    /** Send a text-based voice query (JSON body). */
    @POST("api/v1/voice-query")
    suspend fun sendVoiceQuery(
        @Body request: VoiceRequest
    ): Response<VoiceResponse>

    /** Send a raw audio file for server-side Whisper STT → LLM → TTS. */
    @Multipart
    @POST("api/v1/voice-query/audio")
    suspend fun sendVoiceAudio(
        @Part audio: MultipartBody.Part,
        @Part("visual_context") visualContext: okhttp3.RequestBody? = null
    ): Response<VoiceResponse>
}

object RetrofitClient {
    // 10.0.2.2 maps to Mac localhost when running in Android Emulator
    private const val BASE_URL = "http://10.0.2.2:8000/"

    /** Optional API key for caregiver endpoints. Set to null/empty to disable. */
    var apiKey: String? = null

    val instance: NeuroTwinApi by lazy {
        val client = okhttp3.OkHttpClient.Builder().addInterceptor { chain ->
            val original = chain.request()
            val builder = original.newBuilder()
            if (!apiKey.isNullOrBlank()) {
                builder.header("X-API-Key", apiKey!!)
            }
            chain.proceed(builder.build())
        }.build()

        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(NeuroTwinApi::class.java)
    }
}
