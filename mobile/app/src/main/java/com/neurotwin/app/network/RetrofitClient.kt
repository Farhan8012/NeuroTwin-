package com.neurotwin.app.network

import android.content.Context
import com.google.gson.Gson
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/** Patient-pipeline response DTOs. */
data class FrameResponse(
    val matched: Boolean,
    val confidence: Float,
    val person: Map<String, Any>?,
    val detected_objects: List<Map<String, Any>>,
    val processing_time_ms: Float,
)

data class VoiceRequest(
    val patient_query: String,
    val visual_context: Map<String, Any>? = null,
)

data class VoiceResponse(
    val transcript: String,
    val llm_response: String,
    val persona: String,
    val tts_audio_url: String?,
    val processing_time_ms: Float,
)

/**
 * Retrofit singleton with a runtime-configurable base URL (Settings screen),
 * X-API-Key injection, and generous read timeouts — voice queries can take
 * 30s+ when Ollama reasons over long context.
 */
object RetrofitClient {

    const val EMULATOR_BASE_URL = "http://10.0.2.2:8000/"
    const val DEVICE_BASE_URL = "http://127.0.0.1:8000/"
    val DEFAULT_BASE_URL get() = defaultBaseUrl()

    private const val PREFS = "neurotwin_settings"
    private const val KEY_BASE_URL = "base_url"
    private const val KEY_API_KEY = "api_key"

    @Volatile private var baseUrl: String? = null
    @Volatile private var appContext: Context? = null
    @Volatile var apiKey: String? = null
        private set

    @Volatile private var cachedApi: NeuroTwinApi? = null

    private fun isEmulator(): Boolean {
        return (android.os.Build.FINGERPRINT.startsWith("generic")
                || android.os.Build.FINGERPRINT.startsWith("unknown")
                || android.os.Build.MODEL.contains("google_sdk")
                || android.os.Build.MODEL.contains("Emulator")
                || android.os.Build.MODEL.contains("Android SDK built for x86")
                || android.os.Build.MANUFACTURER.contains("Genymotion")
                || (android.os.Build.BRAND.startsWith("generic") && android.os.Build.DEVICE.startsWith("generic"))
                || "google_sdk" == android.os.Build.PRODUCT)
    }

    fun defaultBaseUrl(): String = if (isEmulator()) EMULATOR_BASE_URL else DEVICE_BASE_URL

    /** Resolve stored configuration once per process; call from Application. */
    fun init(context: Context) {
        appContext = context.applicationContext
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val defaultUrl = defaultBaseUrl()
        var savedUrl = prefs.getString(KEY_BASE_URL, null)
        if (savedUrl == null || (!isEmulator() && savedUrl.contains("10.0.2.2"))) {
            savedUrl = defaultUrl
            prefs.edit().putString(KEY_BASE_URL, savedUrl).apply()
        }
        baseUrl = savedUrl
        apiKey = prefs.getString(KEY_API_KEY, null)
    }

    /** Shared instance for services/managers initialized after [init]. */
    val instance: NeuroTwinApi
        get() = cachedApi ?: synchronized(this) {
            val ctx = requireNotNull(appContext) {
                "RetrofitClient.init(context) must be called before use"
            }
            cachedApi ?: build(ctx).also { cachedApi = it }
        }

    fun currentBaseUrl(): String = baseUrl ?: DEFAULT_BASE_URL

    /** Persist and apply a new backend URL (e.g. http://192.168.x.x:8000/). */
    fun setBaseUrl(context: Context, url: String) {
        val normalized = if (url.endsWith("/")) url else "$url/"
        baseUrl = normalized
        cachedApi = null
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_BASE_URL, normalized).apply()
    }

    fun setApiKey(context: Context, key: String?) {
        apiKey = key?.takeIf { it.isNotBlank() }
        cachedApi = null
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_API_KEY, apiKey).apply()
    }

    val gson = Gson()

    fun api(context: Context): NeuroTwinApi {
        return cachedApi ?: synchronized(this) {
            cachedApi ?: build(context).also { cachedApi = it }
        }
    }

    private fun authInterceptor() = Interceptor { chain ->
        val builder = chain.request().newBuilder()
        apiKey?.let { builder.header("X-API-Key", it) }
        chain.proceed(builder.build())
    }

    private fun build(context: Context): NeuroTwinApi {
        val client = OkHttpClient.Builder()
            .addInterceptor(authInterceptor())
            .connectTimeout(3, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build()
        return Retrofit.Builder()
            .baseUrl(currentBaseUrl())
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(Gson()))
            .build()
            .create(NeuroTwinApi::class.java)
    }
}
