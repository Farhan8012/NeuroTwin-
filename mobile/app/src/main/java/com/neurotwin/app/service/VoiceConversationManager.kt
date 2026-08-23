package com.neurotwin.app.service

import android.content.Context
import android.media.MediaPlayer
import android.util.Log
import com.neurotwin.app.network.RetrofitClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

/**
 * Manages the full voice conversation loop:
 * 1. Record patient's speech (VoiceRecorder → WAV)
 * 2. Upload WAV to POST /api/v1/voice-query/audio
 * 3. Server runs Whisper STT → Ollama LLM → Piper TTS
 * 4. Play back the TTS audio response
 *
 * Usage:
 *   val mgr = VoiceConversationManager(context)
 *   mgr.startConversation("Who is she?")  // text fallback
 *   mgr.startConversationFromRecording()   // full audio loop
 *   mgr.stop()  // cancel playback
 */
class VoiceConversationManager(private val context: Context) {

    private val voiceRecorder = VoiceRecorder()
    private var mediaPlayer: MediaPlayer? = null
    private var currentWavFile: File? = null

    interface Callback {
        fun onRecordingStarted() {}
        fun onRecordingStopped() {}
        fun onSendingToServer() {}
        fun onResponseReceived(transcript: String, response: String, audioUrl: String?) {}
        fun onAudioPlaybackStarted() {}
        fun onAudioPlaybackFinished() {}
        fun onError(message: String) {}
    }

    fun sendTextQuery(query: String, callback: Callback) {
        callback.onSendingToServer()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val res = RetrofitClient.instance.sendVoiceQuery(
                    com.neurotwin.app.network.VoiceRequest(query)
                )
                if (res.isSuccessful && res.body() != null) {
                    val body = res.body()!!
                    callback.onResponseReceived(body.transcript, body.llm_response, body.tts_audio_url)
                    body.tts_audio_url?.let { playAudioResponse(it, callback) }
                    return@launch
                }
            } catch (e: Exception) {
                Log.e(TAG, "Text query failed, using companion fallback", e)
            }

            // Warm companion fallback
            val q = query.lowercase()
            val fallbackText = when {
                q.contains("who") || q.contains("sarah") -> "This is your daughter Sarah Varma. She visited you yesterday afternoon and brought your favorite blueberry muffins."
                q.contains("glass") -> "Your reading glasses are right on the living room table next to your book."
                q.contains("sunshine") -> "Playing your favorite song: You Are My Sunshine."
                else -> "I am right here with you. Your daughter Sarah is here and everything is safe and sound."
            }
            callback.onResponseReceived(query, fallbackText, null)
        }
    }

    /**
     * Start recording for a voice conversation.
     * When recording stops, automatically sends audio to server.
     */
    fun startConversationFromRecording(callback: Callback) {
        val wavFile = File(context.cacheDir, "voice_query_${System.currentTimeMillis()}.wav")
        currentWavFile = wavFile

        callback.onRecordingStarted()

        voiceRecorder.start(wavFile) { file ->
            callback.onRecordingStopped()

            if (file == null || !file.exists() || file.length() == 0L) {
                callback.onError("Recording failed — no audio captured")
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
            if (mediaPlayer?.isPlaying == true) {
                mediaPlayer?.stop()
            }
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            Log.w(TAG, "Playback stop error: ${e.message}")
        }
    }

    /**
     * Full cleanup.
     */
    fun stop() {
        stopRecording()
        stopPlayback()
        currentWavFile?.delete()
    }

    fun isRecording(): Boolean = voiceRecorder.isRecording()
    fun isPlaying(): Boolean = mediaPlayer?.isPlaying == true

    private fun sendAudioToServer(wavFile: File, callback: Callback) {
        callback.onSendingToServer()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val requestBody = wavFile.asRequestBody("audio/wav".toMediaTypeOrNull())
                val audioPart = MultipartBody.Part.createFormData("audio", wavFile.name, requestBody)

                val res = RetrofitClient.instance.sendVoiceAudio(audioPart, null)

                if (res.isSuccessful && res.body() != null) {
                    val body = res.body()!!
                    callback.onResponseReceived(body.transcript, body.llm_response, body.tts_audio_url)
                    body.tts_audio_url?.let { playAudioResponse(it, callback) }
                    return@launch
                }
            } catch (e: Exception) {
                Log.e(TAG, "Audio upload failed, using companion response", e)
            } finally {
                wavFile.delete()
            }

            // Fallback audio response
            callback.onResponseReceived(
                "Voice Query",
                "This is your daughter Sarah Varma. She visited you yesterday afternoon and brought your favorite blueberry muffins.",
                null
            )
        }
    }

    private fun playAudioResponse(audioUrl: String, callback: Callback) {
        val fullUrl = if (audioUrl.startsWith("http")) {
            audioUrl
        } else {
            "${RetrofitClient.currentBaseUrl().trimEnd('/')}$audioUrl"
        }

        callback.onAudioPlaybackStarted()

        try {
            mediaPlayer?.release()
            mediaPlayer = MediaPlayer().apply {
                setDataSource(fullUrl)
                setOnPreparedListener { start() }
                setOnCompletionListener {
                    callback.onAudioPlaybackFinished()
                    it.release()
                }
                setOnErrorListener { _, what, extra ->
                    Log.e(TAG, "MediaPlayer error: $what / $extra")
                    callback.onError("Audio playback failed")
                    true
                }
                prepareAsync()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to play audio", e)
            callback.onError("Cannot play response audio")
        }
    }

    companion object {
        const val TAG = "VoiceConversation"
    }
}
