package com.dashify.mobile

import android.appwidget.AppWidgetManager
import android.util.Log
import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.gson.Gson
import kotlinx.coroutines.launch

abstract class BaseWidgetConfigurationActivity : ComponentActivity() {
    
    protected abstract val widgetClass: Class<*>
    protected abstract val widgetTitle: String
    protected abstract val widgetDescription: String
    
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setResult(RESULT_CANCELED)
        
        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID
        
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }
        
        setContent {
            DashifyMaterialTheme {
                WidgetConfigurationScreen(
                    widgetTitle = widgetTitle,
                    widgetDescription = widgetDescription,
                    onSiteSelected = { site -> configureSiteForWidget(site) },
                    onCancel = { finish() }
                )
            }
        }
    }
    
    private fun configureSiteForWidget(site: SiteListItem) {
        val widgetPrefs = getSharedPreferences("widget_$appWidgetId", Context.MODE_PRIVATE)
        widgetPrefs.edit().apply {
            putString("site", Gson().toJson(site))
            putString("range", "DAY")
            putString("branch", "main")
            putBoolean("showAllowed", true)
            putBoolean("showWAF", true)
            putBoolean("showFirewall", true)
            putBoolean("showRateLimit", true)
            apply()
        }
        
        val resultValue = Intent().apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        setResult(RESULT_OK, resultValue)
        
        val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(appWidgetId))
        }
        sendBroadcast(intent)
        
        finish()
    }
}

@Composable
fun WidgetConfigurationScreen(
    widgetTitle: String,
    widgetDescription: String,
    sites: List<SiteListItem> = emptyList(),
    isLoading: Boolean = true,
    error: String? = null,
    isAuthorized: Boolean = false,
    debugConnections: List<Connection> = emptyList(),
    onSiteSelected: (SiteListItem) -> Unit,
    onCancel: () -> Unit,
    additionalOptions: @Composable (() -> Unit)? = null
) {
    
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            Text(
                text = "Configure $widgetTitle",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = widgetDescription,
                fontSize = 14.sp,
                color = Color(0xFFE6ECF2)
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            when {
                !isAuthorized -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "Unauthorized",
                                color = Color(0xFFFE4E5C),
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Open the app to connect your account",
                                color = Color(0xFFABB5BF),
                                fontSize = 12.sp
                            )
                        }
                    }
                }
                isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = Color(0xFF14D8D4))
                    }
                }
                error != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "Error loading sites",
                                color = Color(0xFFFE4E5C),
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = error ?: "Unknown error",
                                color = Color(0xFFABB5BF),
                                fontSize = 12.sp
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = onCancel) {
                                Text("Cancel")
                            }
                        }
                    }
                }
                sites.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "No sites found",
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Please add a connection in the app first",
                                color = Color(0xFFABB5BF),
                                fontSize = 12.sp
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = onCancel) {
                                Text("Cancel")
                            }
                            if (debugConnections.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = "Debug: ${debugConnections.size} connection(s) found",
                                    color = Color(0xFFABB5BF),
                                    fontSize = 12.sp
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Column(
                                    horizontalAlignment = Alignment.Start,
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                ) {
                                    debugConnections.forEach { c ->
                                        val id = c.id ?: "<null>"
                                        val token = c.apiToken ?: "<null>"
                                        Text(
                                            text = "id: $id",
                                            color = Color(0xFFABB5BF),
                                            fontSize = 12.sp
                                        )
                                        Text(
                                            text = "token: $token",
                                            color = Color(0xFFABB5BF),
                                            fontSize = 12.sp
                                        )
                                        Spacer(modifier = Modifier.height(6.dp))
                                    }
                                }
                            }
                        }
                    }
                }
                else -> {
                    if (additionalOptions != null) {
                        additionalOptions()
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                    
                    Text(
                        text = "Select a site:",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(sites) { site ->
                            SiteListItemView(
                                site = site,
                                onClick = { onSiteSelected(site) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SiteListItemView(site: SiteListItem, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        color = Color(0xFF1E242C),
        shape = MaterialTheme.shapes.medium
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = site.name,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = site.connectionAccount.name,
                    fontSize = 12.sp,
                    color = Color(0xFFABB5BF)
                )
            }
        }
    }
}

