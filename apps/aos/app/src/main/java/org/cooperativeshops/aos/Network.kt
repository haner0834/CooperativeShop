package org.cooperativeshops.aos

import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.InternalSerializationApi
import kotlinx.serialization.json.Json

// 等同於 ApiError
@OptIn(InternalSerializationApi::class)
@Serializable
data class ApiError(
    val code: String,
    val message: String
)

// 等同於 ApiResponse
@OptIn(InternalSerializationApi::class)
@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiError? = null
)

// 等同於 QRData
@OptIn(InternalSerializationApi::class)
@Serializable
data class QRData(
    val userId: String,
    val schoolName: String,
    val schoolAbbreviation: String
)

// 網路請求的封裝
object ApiService {

    // 建立一個可重複使用的 Ktor client
    private val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                prettyPrint = true
            })
        }
    }

    // 等同於 verifyQrCode
    @OptIn(InternalSerializationApi::class)
    suspend fun verifyQrCode(qrData: String): ApiResponse<QRData>? {
        return try {
            val url = "https://cooperativeshops.org/api/qr/verify"

            @Serializable
            data class RequestBody(val data: String)

            val response: HttpResponse = client.post(url) {
                contentType(ContentType.Application.Json)
                setBody(RequestBody(data = qrData))
            }

            println("Status: ${response.status}")

            // Ktor < 3.0 需要 .body() 呼叫
            // val decoded = response.body<ApiResponse<QRData>>()

            // Ktor 3.0+ (或為安全起見) 使用 .bodyAsText() 和 Json.decodeFromString
            val responseBodyText = response.bodyAsText()
            println(responseBodyText)
            val format = Json { ignoreUnknownKeys = true }
            val decoded = format.decodeFromString<ApiResponse<QRData>>(responseBodyText)

            decoded
        } catch (e: Exception) {
            println(e)
            null
        }
    }
}