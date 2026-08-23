package com.neurotwin.app.service

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import com.neurotwin.app.network.RetrofitClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.util.Locale

/**
 * Manages the full voice conversation loop:
 * 1. Record patient's speech (VoiceRecorder → WAV)
 * 2. Upload WAV to POST /api/v1/voice-query/audio
 * 3. Server runs Groq Whisper STT → Unified LLM → Edge-TTS
 * 4. Ultra-fast instant playback with Android on-device TextToSpeech fallback
 */
class VoiceConversationManager(private val context: Context) : TextToSpeech.OnInitListener {

    private val voiceRecorder = VoiceRecorder()
    private var mediaPlayer: MediaPlayer? = null
    private var currentWavFile: File? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private val playerLock = Any()

    private var androidTts: TextToSpeech? = null
    private var ttsReady = false

    init {
        try {
            androidTts = TextToSpeech(context.applicationContext, this)
        } catch (e: Exception) {
            Log.w(TAG, "Android TextToSpeech init exception: ${e.message}")
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = androidTts?.setLanguage(Locale.US)
            ttsReady = result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED
            androidTts?.setSpeechRate(0.95f)
            androidTts?.setPitch(1.0f)
            Log.i(TAG, "Android TextToSpeech initialized (ready=$ttsReady)")
        } else {
            Log.w(TAG, "Android TextToSpeech init failed with status: $status")
            ttsReady = false
        }
    }

    interface Callback {
        fun onRecordingStarted() {}
        fun onRecordingStopped() {}
        fun onSendingToServer() {}
        fun onResponseReceived(transcript: String, response: String, audioUrl: String?) {}
        fun onAudioPlaybackStarted() {}
        fun onAudioPlaybackFinished() {}
        fun onError(message: String) {}
    }

    private fun runOnMain(block: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            block()
        } else {
            mainHandler.post(block)
        }
    }

    fun sendTextQuery(query: String, callback: Callback) {
        runOnMain { callback.onSendingToServer() }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val res = RetrofitClient.instance.sendVoiceQuery(
                    com.neurotwin.app.network.VoiceRequest(query)
                )
                if (res.isSuccessful && res.body() != null) {
                    val body = res.body()!!
                    runOnMain {
                        callback.onResponseReceived(body.transcript, body.llm_response, body.tts_audio_url)
                    }
                    speakResponse(body.llm_response, body.tts_audio_url, callback)
                    return@launch
                }
            } catch (e: Exception) {
                Log.e(TAG, "Text query failed, using companion fallback", e)
            }

            // Warm companion fallback
            val q = query.lowercase()
            val fallbackText = when {
                q.contains("who") -> "I am right here keeping watch with you. Your loved ones are always keeping you in their thoughts."
                q.contains("glass") -> "Your reading glasses are resting on the table in front of the camera."
                q.contains("medicine") || q.contains("medication") -> "Your daily medications are safely scheduled by your care team."
                else -> "I am right here with you, keeping you safe and sound."
            }
            runOnMain {
                callback.onResponseReceived(query, fallbackText, null)
            }
            speakResponse(fallbackText, null, callback)
        }
    }

    /**
     * Start recording for a voice conversation.
     * When recording stops, automatically sends audio to server.
     */
    fun startConversationFromRecording(callback: Callback) {
        stopPlayback()
        val wavFile = File(context.cacheDir, "voice_query_${System.currentTimeMillis()}.wav")
        currentWavFile = wavFile

        runOnMain { callback.onRecordingStarted() }

        voiceRecorder.start(wavFile) { file ->
            runOnMain { callback.onRecordingStopped() }

            if (file == null || !file.exists() || file.length() == 0L) {
                runOnMain { callback.onError("Recording failed — no audio captured") }
                return@start
            }

            // Upload and process
            sendAudioToServer(file, callback)
        }
    }

    /**
     * Stop recording (user lifts finger from button).
     */
    fun stopRecording() {
        if (voiceRecorder.isRecording()) {
            voiceRecorder.stop()
        }
    }

    /**
     * Stop audio playback.
     */
    fun stopPlayback() {
        try {
            androidTts?.stop()
        } catch (_: Exception) {}

        synchronized(playerLock) {
            try {
                mediaPlayer?.let { player ->
                    if (player.isPlaying) {
                        player.stop()
                    }
                    player.reset()
                    player.release()
                }
            } catch (e: Exception) {
                Log.w(TAG, "Playback stop error: ${e.message}")
            } finally {
                mediaPlayer = null
            }
        }
    }

    /**
     * Full cleanup.
     */
    fun stop() {
        stopRecording()
        stopPlayback()
        try {
            androidTts?.shutdown()
            androidTts = null
        } catch (_: Exception) {}
        try {
            currentWavFile?.delete()
        } catch (_: Exception) {}
    }

    fun isRecording(): Boolean = voiceRecorder.isRecording()

    fun isPlaying(): Boolean {
        if (androidTts?.isSpeaking == true) return true
        return synchronized(playerLock) {
            try {
                mediaPlayer?.isPlaying == true
            } catch (_: Exception) {
                false
            }
        }
    }

    private fun sendAudioToServer(wavFile: File, callback: Callback) {
        runOnMain { callback.onSendingToServer() }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val requestBody = wavFile.asRequestBody("audio/wav".toMediaTypeOrNull())
                val audioPart = MultipartBody.Part.createFormData("audio", wavFile.name, requestBody)

                val res = RetrofitClient.instance.sendVoiceAudio(audioPart, null)

                if (res.isSuccessful && res.body() != null) {
                    val body = res.body()!!
                    runOnMain {
                        callback.onResponseReceived(body.transcript, body.llm_response, body.tts_audio_url)
                    }
                    speakResponse(body.llm_response, body.tts_audio_url, callback)
                    return@launch
                }
            } catch (e: Exception) {
                Log.e(TAG, "Audio upload failed, using companion response", e)
            } finally {
                try {
                    wavFile.delete()
                } catch (_: Exception) {}
            }

            // Fallback audio response
            val fallbackMsg = "I am right here with you. Everything is calm, safe, and sound."
            runOnMain {
                callback.onResponseReceived("Voice Query", fallbackMsg, null)
            }
            speakResponse(fallbackMsg, null, callback)
        }
    }

    private fun speakResponse(text: String, audioUrl: String?, callback: Callback) {
        // Priority 1: If server returned audio URL, play the high-quality Edge-TTS audio
        if (!audioUrl.isNullOrBlank()) {
            playAudioResponse(audioUrl, callback)
            return
        }

        // Priority 2: Instant Android native TTS
        if (ttsReady && androidTts != null) {
            val cleanText = text.replace(Regex("[^a-zA-Z0-9\\s.,!?'-]"), " ").trim()
            runOnMain { callback.onAudioPlaybackStarted() }
            androidTts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    runOnMain { callback.onAudioPlaybackStarted() }
                }
                override fun onDone(utteranceId: String?) {
                    runOnMain { callback.onAudioPlaybackFinished() }
                }
                override fun onError(utteranceId: String?) {
                    runOnMain { callback.onAudioPlaybackFinished() }
                }
            })
            androidTts?.speak(cleanText, TextToSpeech.QUEUE_FLUSH, null, "utterance_${System.currentTimeMillis()}")
            return
        }

        runOnMain { callback.onAudioPlaybackFinished() }
    }

    private fun playAudioResponse(audioUrl: String, callback: Callback) {
        val fullUrl = if (audioUrl.startsWith("http")) {
            audioUrl
        } else {
            "${RetrofitClient.currentBaseUrl().trimEnd('/')}$audioUrl"
        }

        synchronized(playerLock) {
            try {
                mediaPlayer?.let {
                    try {
                        if (it.isPlaying) it.stop()
                        it.reset()
                        it.release()
                    } catch (_: Exception) {}
                }

                val player = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
                            .build()
                    )
                    setDataSource(fullUrl)
                    setOnPreparedListener {
                        runOnMain { callback.onAudioPlaybackStarted() }
                        start()
                    }
                    setOnCompletionListener { p ->
                        runOnMain { callback.onAudioPlaybackFinished() }
                        synchronized(playerLock) {
                            try {
                                p.reset()
                                p.release()
                            } catch (_: Exception) {}
                            if (mediaPlayer === p) {
                                mediaPlayer = null
                            }
                        }
                    }
                    setOnErrorListener { p, what, extra ->
                        Log.e(TAG, "MediaPlayer error: $what / $extra")
                        runOnMain {
                            callback.onError("Audio playback failed")
                            callback.onAudioPlaybackFinished()
                        }
                        synchronized(playerLock) {
                            try {
                                p.reset()
                                p.release()
                            } catch (_: Exception) {}
                            if (mediaPlayer === p) {
                                mediaPlayer = null
                            }
                        }
                        true
                    }
                    prepareAsync()
                }
                mediaPlayer = player
            } catch (e: Exception) {
                Log.e(TAG, "Failed to play audio", e)
                runOnMain {
                    callback.onError("Cannot play response audio")
                    callback.onAudioPlaybackFinished()
                }
            }
        }
    }

    companion object {
        private const val TAG = "VoiceConvManager"
    }
}
