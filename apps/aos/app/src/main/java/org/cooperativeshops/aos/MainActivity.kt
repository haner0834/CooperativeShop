package org.cooperativeshops.aos

import android.os.Bundle
import androidx.activity.*
import androidx.activity.compose.*
//import androidx.activity.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.foundation.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.*
import androidx.compose.ui.unit.*
import org.cooperativeshops.aos.ui.theme.*
//import androidx.compose.runtime.*
import androidx.compose.ui.draw.*
import androidx.compose.ui.layout.*
import androidx.compose.ui.res.painterResource

data class QRData(val userId: String, val schoolId: String, val schoolName: String)
data class ApiError(val code: String, val message: String)
data class ApiResponse<T>(val success: Boolean, val data: T?, val error: ApiError?)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CooperativeShopsTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Greeting(
                        name = "Android",
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    var count by remember { mutableIntStateOf(0) }
    Row(modifier = Modifier.padding(30.dp)) {
        Image(
            painter = painterResource(id = R.drawable.logo_light),
            contentDescription = "描述文字",
            modifier = Modifier.height(60.dp),
            contentScale = ContentScale.Fit
        )

        Button(
            onClick = { count ++},
            modifier = Modifier.padding(),
            shape = RoundedCornerShape(5.dp)
        ) {
            Text("$count")
        }
    }
}

@Preview(
    name = "Pixel 4",
    showBackground = true,
    device = Devices.PIXEL_4
)
@Composable
fun GreetingPreview() {
    CooperativeShopsTheme {
        Greeting("genius")
    }
}