package com.neurotwin.app.service

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile

/**
 * Records audio from the microphone and saves as WAV file.
 * Used for voice conversation: patient speaks → audio → server STT → LLM → TTS → playback.
 */
class VoiceRecorder {

    private var audioRecord: AudioRecord? = null
    private var isRecording = false
    private var recordingThread: Thread? = null

    // 16kHz mono 16-bit PCM — matches Whisper's expected input
    companion object {
        const val SAMPLE_RATE = 16000
        const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        const val TAG = "VoiceRecorder"
    }

    private val bufferSize: Int by lazy {
        val min = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        maxOf(min, SAMPLE_RATE * 2) // at least 1 second buffer
    }

    /**
     * Start recording to a temporary WAV file.
     * Returns the output File when recording stops via [onComplete].
     */
    fun start(outputFile: File, onComplete: (File?) -> Unit) {
        if (isRecording) return

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                Log.e(TAG, "AudioRecord failed to initialize")
                onComplete(null)
                return
            }

            isRecording = true
            audioRecord?.startRecording()

            recordingThread = Thread({
                writeWavData(outputFile, onComplete)
            }, "AudioRecorder Thread").also { it.start() }

        } catch (e: SecurityException) {
            Log.e(TAG, "Microphone permission not granted", e)
            onComplete(null)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start recording", e)
            onComplete(null)
        }
    }

    /**
     * Stop recording and finalize the WAV file.
     */
    fun stop() {
        isRecording = false
        try {
            audioRecord?.stop()
        } catch (e: Exception) {
            Log.w(TAG, "AudioRecord stop error: ${e.message}")
        }
        audioRecord?.release()
        audioRecord = null
    }

    fun isRecording(): Boolean = isRecording

    private fun writeWavData(outputFile: File, onComplete: (File?) -> Unit) {
        val pcmBuffer = ByteArrayOutputStream()
        val tempBuffer = ByteArray(bufferSize)

        try {
            while (isRecording) {
                val bytesRead = audioRecord?.read(tempBuffer, 0, tempBuffer.size) ?: -1
                if (bytesRead > 0) {
                    pcmBuffer.write(tempBuffer, 0, bytesRead)
                } else if (bytesRead == -1) {
                    break
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Recording error", e)
        }

        val pcmData = pcmBuffer.toByteArray()
        if (pcmData.isEmpty()) {
            onComplete(null)
            return
        }

        // Write WAV file with proper header
        try {
            writeWavFile(outputFile, pcmData)
            onComplete(outputFile)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to write WAV file", e)
            onComplete(null)
        }
    }

    private fun writeWavFile(file: File, pcmData: ByteArray) {
        val totalDataLen = pcmData.size + 36
        val channels = 1
        val bitsPerSample = 16
        val byteRate = SAMPLE_RATE * channels * bitsPerSample / 8
        val blockAlign = channels * bitsPerSample / 8

        FileOutputStream(file).use { fos ->
            // RIFF header
            fos.write("RIFF".toByteArray())
            fos.write(intToLittleEndian(totalDataLen))
            fos.write("WAVE".toByteArray())

            // fmt chunk
            fos.write("fmt ".toByteArray())
            fos.write(intToLittleEndian(16)) // chunk size
            fos.write(shortToLittleEndian(1)) // PCM format
            fos.write(shortToLittleEndian(channels))
            fos.write(intToLittleEndian(SAMPLE_RATE))
            fos.write(intToLittleEndian(byteRate))
            fos.write(shortToLittleEndian(blockAlign))
            fos.write(shortToLittleEndian(bitsPerSample))

            // data chunk
            fos.write("data".toByteArray())
            fos.write(intToLittleEndian(pcmData.size))
            fos.write(pcmData)
        }
    }

    private fun intToLittleEndian(value: Int): ByteArray {
        return byteArrayOf(
            (value and 0xFF).toByte(),
            (value shr 8 and 0xFF).toByte(),
            (value shr 16 and 0xFF).toByte(),
            (value shr 24 and 0xFF).toByte()
        )
    }

    private fun shortToLittleEndian(value: Int): ByteArray {
        return byteArrayOf(
            (value and 0xFF).toByte(),
            (value shr 8 and 0xFF).toByte()
        )
    }
}
