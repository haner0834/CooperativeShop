package org.cooperativeshops.aos

import android.Manifest
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.accompanist.permissions.shouldShowRationale
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import java.util.concurrent.Executors

@OptIn(ExperimentalPermissionsApi::class) // 處理權限 API 的 OptIn
@androidx.annotation.OptIn(androidx.camera.core.ExperimentalGetImage::class) // 處理 CameraX 的 OptIn
@Composable
fun QRScannerView(
    isScanning: Boolean,
    torchActive: Boolean,
    onSuccess: (String) -> Unit,
    onFailure: (Exception) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    // 1. 取得權限狀態
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)

    // 2. 如果還沒請求過，或是需要的時候，發起請求
    LaunchedEffect(Unit) {
        if (!cameraPermissionState.status.isGranted && !cameraPermissionState.status.shouldShowRationale) {
            cameraPermissionState.launchPermissionRequest()
        }
    }

    // CameraX 變數
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }
    var camera by remember { mutableStateOf<androidx.camera.core.Camera?>(null) }
    val executor = remember { Executors.newSingleThreadExecutor() }
    val previewView = remember { PreviewView(context) }

    // 3. 手電筒控制
    LaunchedEffect(camera, torchActive) {
        try {
            if (camera?.cameraInfo?.hasFlashUnit() == true) {
                camera?.cameraControl?.enableTorch(torchActive)
            }
        } catch (e: Exception) {
            Log.e("QRScanner", "Torch error", e)
        }
    }

    // 4. 根據權限狀態顯示不同內容 (取代 PermissionRequired)
    if (cameraPermissionState.status.isGranted) {
        // === 權限已允許：顯示相機 ===

        // 核心相機邏輯
        LaunchedEffect(isScanning, cameraProviderFuture) {
            val cameraProvider = cameraProviderFuture.get()
            cameraProvider.unbindAll() // 重置

            if (isScanning) {
                try {
                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val cameraSelector = CameraSelector.Builder()
                        .requireLensFacing(CameraSelector.LENS_FACING_BACK)
                        .build()

                    val options = BarcodeScannerOptions.Builder()
                        .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                        .build()
                    val barcodeScanner = BarcodeScanning.getClient(options)

                    val imageAnalyzer = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also { analyzer ->
                            analyzer.setAnalyzer(executor) { imageProxy ->
                                val mediaImage = imageProxy.image
                                if (mediaImage != null) {
                                    val image = InputImage.fromMediaImage(
                                        mediaImage,
                                        imageProxy.imageInfo.rotationDegrees
                                    )

                                    barcodeScanner.process(image)
                                        .addOnSuccessListener { barcodes ->
                                            barcodes.firstOrNull()?.rawValue?.let { qrData ->
                                                MainScope().launch {
                                                    onSuccess(qrData)
                                                }
                                            }
                                        }
                                        .addOnFailureListener { e ->
                                            MainScope().launch { onFailure(e) }
                                        }
                                        .addOnCompleteListener {
                                            imageProxy.close()
                                        }
                                } else {
                                    imageProxy.close()
                                }
                            }
                        }

                    camera = cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        cameraSelector,
                        preview,
                        imageAnalyzer
                    )

                } catch (e: Exception) {
                    Log.e("QRScannerView", "Camera binding failed", e)
                    onFailure(e)
                }
            }
        }

        // 顯示 PreviewView
        if (isScanning) {
            AndroidView(
                factory = { previewView },
                modifier = Modifier.fillMaxSize()
            )
        }

    } else {
        // === 權限未允許：顯示提示 UI ===
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                val textToShow = if (cameraPermissionState.status.shouldShowRationale) {
                    "我們需要相機權限來掃描 QR Code"
                } else {
                    "請在設定中開啟相機權限"
                }

                Text(textToShow)
                Button(onClick = { cameraPermissionState.launchPermissionRequest() }) {
                    Text("請求權限")
                }
            }
        }
    }
}