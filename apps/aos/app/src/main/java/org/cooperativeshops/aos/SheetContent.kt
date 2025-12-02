package org.cooperativeshops.aos

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SheetContent(
    apiResponse: ApiResponse<QRData>,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .padding(bottom = 32.dp), // 增加底部空間
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 等同於 Swift 的 .sheet drag handle
        BottomSheetDefaults.DragHandle()

        when {
            // 成功 (apiResponse.data != null)
            apiResponse.data != null -> {
                val verifiedData = apiResponse.data
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    RowComposable(title = "ID", value = verifiedData.userId)
                    RowComposable(title = "學校", value = verifiedData.schoolName)
                    RowComposable(title = "學校（縮寫）", value = verifiedData.schoolAbbreviation)

                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                    // 成功標籤
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .align(Alignment.CenterHorizontally)
                            .clip(RoundedCornerShape(50))
                            .background(Color.Green.copy(alpha = 0.8f))
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Check,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            "驗證成功",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            // API 錯誤 (apiResponse.error != null)
            apiResponse.error != null -> {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Warning,
                        contentDescription = null,
                        tint = Color.Yellow.copy(red = 0.8f, green = 0.8f),
                        modifier = Modifier.size(28.dp)
                    )
                    Text(
                        getErrorMessage(code = apiResponse.error.code),
                        color = LocalContentColor.current.copy(alpha = 0.6f),
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // 未知錯誤 (兩者皆 null)
            else -> {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "未知錯誤，請按下方按鈕以通知管理者",
                        fontWeight = FontWeight.Medium,
                        color = LocalContentColor.current.copy(alpha = 0.5f),
                        modifier = Modifier.padding(16.dp)
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        // 回報按鈕 (Dismiss)
                        TextButton(
                            onClick = onDismiss,
                            shape = RoundedCornerShape(20),
                            colors = ButtonDefaults.textButtonColors(
                                containerColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
                            )
                        ) {
                            Text(
                                "取消", // "回報" 似乎有歧義，改為 "取消"
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                            )
                        }

                        // 回報按鈕 (Instagram)
                        Button(
                            onClick = {
                                val url = "https://www.instagram.com/cooperativeshops_2026/"
                                val intent = Intent(Intent.ACTION_VIEW,   Uri.parse(url))
                                context.startActivity(intent)
                            },
                            shape = RoundedCornerShape(20),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.onSurface,
                                contentColor = MaterialTheme.colorScheme.surface
                            )
                        ) {
                            Text(
                                "回報",
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

// 等同於 Row struct
@Composable
private fun RowComposable(title: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            fontFamily = FontFamily.Monospace // .fontDesign(.monospaced)
        )
        Text(
            text = value,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.weight(1f),
            textAlign = androidx.compose.ui.text.style.TextAlign.End,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

// 等同於 getErrorMessage
private fun getErrorMessage(code: String): String {
    return when (code) {
        "BAD_REQUEST" -> "請求錯誤，請稍後再試"
        "INTERNAL_SERVER_ERROR" -> "系統錯誤，請稍後再試"
        "INVALID_QR" -> "驗證不通過"
        else -> "Unknown Error"
    }
}