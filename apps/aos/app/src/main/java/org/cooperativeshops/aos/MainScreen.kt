package org.cooperativeshops.aos

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FlashlightOff
import androidx.compose.material.icons.filled.FlashlightOn
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.cooperativeshops.aos.R.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    var isScanning by remember { mutableStateOf(true) }
    var showSheet by remember { mutableStateOf(false) }
    var torchActive by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var apiResponse by remember { mutableStateOf<ApiResponse<QRData>?>(null) }

    // 用於在協程中啟動網路請求
    val coroutineScope = rememberCoroutineScope()

    // 用於控制 BottomSheet 狀態
    val sheetState = rememberModalBottomSheetState()

    // 等同於 handleVerify
    fun handleVerify(qrData: String) {
        coroutineScope.launch {
            isLoading = true
            apiResponse = ApiService.verifyQrCode(qrData = qrData)
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp)
                    .statusBarsPadding(), // 處理狀態列
                verticalAlignment = Alignment.CenterVertically
            ) {
                Image(
                    painter = painterResource(id = drawable.logo_light),
                    contentDescription = "Logo",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.height(40.dp)
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
        ) {
            // QR 掃描器視圖
            QRScannerView(
                isScanning = isScanning,
                torchActive = torchActive,
                onSuccess = { qrData ->
                    isScanning = false
                    showSheet = true
                    handleVerify(qrData = qrData)
                },
                onFailure = { error ->
                    println(error)
                }
            )

            // 當相機關閉時的覆蓋層
            if (!isScanning) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.VideocamOff,
                        contentDescription = "相機已關閉",
                        modifier = Modifier.size(28.dp),
                        tint = LocalContentColor.current.copy(alpha = 0.7f)
                    )
                    Text(
                        text = "相機已關閉",
                        fontWeight = FontWeight.Medium,
                        color = LocalContentColor.current.copy(alpha = 0.5f)
                    )
                }
            }

            // 底部控制列
            BottomControls(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding(), // 處理導航列
                torchActive = torchActive,
                onScanToggle = {
                    isScanning = !isScanning
                    isLoading = false
                },
                onTorchToggle = {
                    torchActive = !torchActive
                }
            )
        }
    }

    // Bottom Sheet
    if (showSheet) {
        ModalBottomSheet(
            onDismissRequest = {
                showSheet = false
                apiResponse = null // 重置
            },
            sheetState = sheetState,
            containerColor = MaterialTheme.colorScheme.surface,
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    // 等同於 .presentationDetents([.fraction(0.27)])
                    .heightIn(min = 200.dp), // 根據您的內容調整
                contentAlignment = Alignment.Center
            ) {
                when {
                    isLoading -> {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            LoadingCircleView(
                                modifier = Modifier.size(30.dp),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                "Verifying QR data...",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                color = LocalContentColor.current.copy(alpha = 0.6f)
                            )
                        }
                    }
                    apiResponse != null -> {
                        SheetContent(
                            apiResponse = apiResponse!!,
                            onDismiss = {
                                coroutineScope.launch {
                                    sheetState.hide()
                                    showSheet = false
                                    apiResponse = null
                                }
                            }
                        )
                    }
                    else -> {
                        Text(
                            "Unknown Result",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = LocalContentColor.current.copy(alpha = 0.6f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun BottomControls(
    modifier: Modifier = Modifier,
    torchActive: Boolean,
    onScanToggle: () -> Unit,
    onTorchToggle: () -> Unit
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(Color.Black.copy(alpha = 0.4f))
            .padding(vertical = 24.dp, horizontal = 16.dp)
            .padding(bottom = 26.dp)
    ) {
        // 掃描按鈕
        Box(
            modifier = Modifier
                .size(70.dp)
                .align(Alignment.Center)
                .clickable(onClick = onScanToggle)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
                    .background(Color.White)
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(5.dp)
                    .clip(CircleShape)
                    .background(Color.Black)
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(7.5.dp)
                    .clip(CircleShape)
                    .background(Color.White)
            )
        }

        // 手電筒按鈕
        IconButton(
            onClick = onTorchToggle,
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .size(50.dp)
                .clip(RoundedCornerShape(50))
                .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)),
            colors = IconButtonDefaults.iconButtonColors(
                // 切換圖示顏色以匹配 Swift 的 .environment
                contentColor = if (torchActive) Color.Black else Color.White
            )
        ) {
            Icon(
                // 邏輯：圖示顯示 *可執行的動作*
                // torch on -> show "off" icon
                // torch off -> show "on" icon
                imageVector = if (torchActive) Icons.Filled.FlashlightOff else Icons.Filled.FlashlightOn,
                contentDescription = "Toggle Flashlight"
            )
        }
    }
}

// 等同於 LoadingCircleView
@Composable
fun LoadingCircleView(
    modifier: Modifier = Modifier,
    color: Color = MaterialTheme.colorScheme.primary,
    lineWidth: Dp = 4.dp,
    trimAmount: Float = 0.3f // 0.3 = 1/3
) {
    val infiniteTransition = rememberInfiniteTransition(label = "loading_transition")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "loading_rotation"
    )

    Canvas(
        modifier = modifier
            .size(30.dp) // 預設大小
            .rotate(rotation)
    ) {
        val radius = (size.minDimension - lineWidth.toPx()) / 2
        drawArc(
            color = color,
            startAngle = 0f,
            sweepAngle = 360 * trimAmount,
            useCenter = false,
            style = Stroke(width = lineWidth.toPx(), cap = StrokeCap.Round),
            topLeft = Offset((size.width - radius * 2) / 2, (size.height - radius * 2) / 2),
            size = androidx.compose.ui.geometry.Size(radius * 2, radius * 2)
        )
    }
}