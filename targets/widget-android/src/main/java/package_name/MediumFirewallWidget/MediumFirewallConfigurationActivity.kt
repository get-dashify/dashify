package com.dashify.mobile

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.glance.appwidget.GlanceAppWidgetManager
import com.google.gson.Gson
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
 
class MediumFirewallConfigurationActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        try {
            setResult(RESULT_CANCELED)
            
            val appWidgetId = intent?.extras?.getInt(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID
            ) ?: AppWidgetManager.INVALID_APPWIDGET_ID
            
            if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
                Log.e("MediumFirewallConfig", "Invalid appWidgetId")
                finish()
                return
            }
            
            setContent {
            var selectedSite by remember { mutableStateOf<SiteListItem?>(null) }
            var sites by remember { mutableStateOf<List<SiteListItem>>(emptyList()) }
            var isLoading by remember { mutableStateOf(true) }
            var error by remember { mutableStateOf<String?>(null) }
            var selectedRange by remember { mutableStateOf("DAY") }
            var connections by remember { mutableStateOf<List<Connection>>(emptyList()) }
            val scope = rememberCoroutineScope()
            
            LaunchedEffect(Unit) {
                try {
                    // Use applicationContext to access SharedPreferences (same as WidgetKitModule)
                    val prefs = applicationContext.getSharedPreferences(APP_GROUP_NAME, Context.MODE_PRIVATE)
                    val rawConnections = prefs.getString(CONNECTIONS_KEY, "[]") ?: "[]"
                    Log.d("MediumFirewallConfig", "Reading from SharedPreferences: $APP_GROUP_NAME")
                    Log.d("MediumFirewallConfig", "Raw connections length: ${rawConnections.length}")
                    Log.d("MediumFirewallConfig", "Raw connections: $rawConnections")
                    
                    val parsedConnections = try {
                        if (rawConnections.isNotEmpty() && rawConnections != "[]") {
                            Gson().fromJson(rawConnections, Array<Connection>::class.java)?.filter { 
                                it.id != null && it.apiToken != null 
                            } ?: emptyList()
                        } else {
                            emptyList()
                        }
                    } catch (e: Exception) {
                        Log.e("MediumFirewallConfig", "Error parsing connections: ${e.message}", e)
                        e.printStackTrace()
                        emptyList()
                    }
                    
                    if (parsedConnections.isNotEmpty()) {
                        connections = parsedConnections
                        Log.d("MediumFirewallConfig", "Found ${connections.size} connections")
                        connections.forEach { conn ->
                            Log.d("MediumFirewallConfig", "Connection: id=${conn.id}, token=${conn.apiToken?.take(10)}...")
                        }
                    }
                } catch (e: Exception) {
                    Log.e("MediumFirewallConfig", "Error reading connections: ${e.message}", e)
                    e.printStackTrace()
                }
                
                if (connections.isEmpty()) {
                    Log.d("MediumFirewallConfig", "No connections found")
                    isLoading = false
                } else {
                    scope.launch {
                        try {
                            val allSites = mutableListOf<SiteListItem>()
                            
                            for (connection in connections) {
                            try {
                                val accounts = fetchConnectionAccounts(connection)
                                
                                for (account in accounts) {
                                    val siteList = fetchAccountSites(connection, account)
                                    
                                    allSites.addAll(siteList.map { site ->
                                        SiteListItem(
                                            id = site.id,
                                            name = site.name,
                                            connection = connection,
                                            connectionAccount = account
                                        )
                                    })
                                }
                            } catch (e: Exception) {
                                Log.e("MediumFirewallConfig", "Error fetching for connection: ${e.message}", e)
                            }
                        }
                        
                        sites = allSites
                        isLoading = false
                    } catch (e: Exception) {
                        Log.e("MediumFirewallConfig", "Error fetching sites: ${e.message}", e)
                        error = e.message
                        isLoading = false
                    }
                    }
                }
            }
            
            DashifyMaterialTheme {
                WidgetConfigurationScreen(
                    widgetTitle = "Firewall",
                    widgetDescription = "View firewall statistics for your site",
                    sites = sites,
                    isLoading = isLoading,
                    error = error,
                    isAuthorized = connections.isNotEmpty(),
                    debugConnections = connections.toList(),
                    onSiteSelected = { site ->
                        selectedSite = site
                        val prefs = applicationContext.getSharedPreferences(APP_GROUP_NAME, Context.MODE_PRIVATE)
                        val isSubscribed = prefs.getBoolean(IS_SUBSCRIBED_KEY, false)
                        val glanceId = GlanceAppWidgetManager(applicationContext).getGlanceIdBy(appWidgetId)
                        
                        scope.launch {
                            MediumFirewallWidgetReceiver().onSiteSelected(applicationContext, glanceId, site, isSubscribed, selectedRange)
                            
                            try {
                                val nowMs = System.currentTimeMillis()
                                val oneMinuteMs = 60_000L
                                val fromMs = if (selectedRange == "DAY") {
                                    nowMs - (24 * 60 * 60 * 1000L)
                                } else {
                                    nowMs - (7 * 24 * 60 * 60 * 1000L)
                                }
                                val toMs = nowMs - oneMinuteMs

                                val metrics = fetchSiteFirewallMetrics(site.connection, site.id, fromMs, toMs)
                                var totalAllowed = 0
                                var totalBlockedWaf = 0
                                var totalBlockedFirewall = 0
                                var totalBlockedRateLimit = 0
                                
                                for (point in metrics) {
                                    totalAllowed += point.values.allowed ?: 0
                                    totalBlockedWaf += point.values.blockedWaf ?: 0
                                    totalBlockedFirewall += point.values.blockedFirewallTrafficRules ?: 0
                                    totalBlockedRateLimit += point.values.blockedRateLimitingTrafficRules ?: 0
                                }
                                
                                MediumFirewallWidgetReceiver().updateFirewallData(
                                    applicationContext,
                                    glanceId,
                                    totalAllowed,
                                    totalBlockedWaf,
                                    totalBlockedFirewall,
                                    totalBlockedRateLimit
                                )
                            } catch (e: Exception) {
                                Log.e("MediumFirewallConfig", "Error fetching firewall metrics: ${e.message}", e)
                            }
                            
                            val resultValue = Intent().apply {
                                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                            }
                            setResult(RESULT_OK, resultValue)
                            finish()
                        }
                    },
                    onCancel = { finish() },
                    additionalOptions = {
                        Column {
                            // Range Selector
                            Text(
                                text = "Range",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color.White
                            )
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                val options = listOf("24H" to "DAY", "7D" to "WEEK")
                                options.forEach { (label, value) ->
                                    val isSelected = selectedRange == value
                                    val backgroundColor = if (isSelected) Color(0xFF14D8D4) else Color(0xFF1E242C)
                                    val contentColor = if (isSelected) Color.Black else Color.White
                                    
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(40.dp)
                                            .clickable { selectedRange = value }
                                            .background(
                                                color = backgroundColor,
                                                shape = RoundedCornerShape(8.dp)
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = label,
                                            color = contentColor,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                )
            }
            }
        } catch (e: Exception) {
            Log.e("MediumFirewallConfig", "Error in onCreate: ${e.message}", e)
            e.printStackTrace()
            finish()
        }
    }
}

