package com.neurotwin.app.ml

import androidx.camera.core.ImageProxy
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

    @androidx.annotation.OptIn(androidx.camera.core.ExperimentalGetImage::class)
    fun processFrame(
        imageProxy: ImageProxy,
        onGateResult: (shouldUpload: Boolean, faceCount: Int) -> Unit
    ) {
        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            imageProxy.close()
            onGateResult(false, 0)
            return
        }

        val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        
        faceDetector.process(inputImage)
            .addOnSuccessListener { faces ->
                val hasFace = faces.isNotEmpty()
                onGateResult(hasFace, faces.size)
            }
            .addOnFailureListener {
                onGateResult(false, 0)
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    }
}
