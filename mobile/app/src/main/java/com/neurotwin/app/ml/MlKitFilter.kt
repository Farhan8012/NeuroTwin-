package com.neurotwin.app.ml

import android.graphics.Bitmap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions

class MlKitFilter {

    private val detectorOptions = FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
        .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
        .build()

    private val faceDetector = FaceDetection.getClient(detectorOptions)
    private var lastPeriodicUpload = 0L

    fun processBitmap(
        bitmap: Bitmap,
        onGateResult: (shouldUpload: Boolean) -> Unit
    ) {
        val now = System.currentTimeMillis()
        // Periodic background upload every 5 seconds even without a front face (for object/scene context)
        val isPeriodicTime = (now - lastPeriodicUpload) > 5000L

        val inputImage = InputImage.fromBitmap(bitmap, 0)

        faceDetector.process(inputImage)
            .addOnSuccessListener { faces ->
                val hasFace = faces.isNotEmpty()
                if (hasFace || isPeriodicTime) {
                    lastPeriodicUpload = now
                    onGateResult(true)
                } else {
                    onGateResult(false)
                }
            }
            .addOnFailureListener {
                if (isPeriodicTime) {
                    lastPeriodicUpload = now
                    onGateResult(true)
                } else {
                    onGateResult(false)
                }
            }
    }
}
