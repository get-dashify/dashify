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

class SmallShortcutConfigurationActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setResult(RESULT_CANCELED)
        
        val appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID
        
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }
        
        val prefs = getSharedPreferences(APP_GROUP_NAME, Context.MODE_PRIVATE)
        val rawConnections = prefs.getString(CONNECTIONS_KEY, "[]")
        val connections = Gson().fromJson(rawConnections, Array<Connection>::class.java)?.filter { 
            it.id != null && it.apiToken != null 
        } ?: emptyList()
        
        Log.d("SmallShortcutConfig", "Found ${connections.size} connections")
        
        setContent {
            var selectedSite by remember { mutableStateOf<SiteListItem?>(null) }
            var sites by remember { mutableStateOf<List<SiteListItem>>(emptyList()) }
            var isLoading by remember { mutableStateOf(true) }
            var error by remember { mutableStateOf<String?>(null) }
            val scope = rememberCoroutineScope()
            
            LaunchedEffect(Unit) {
                scope.launch {
                    try {
                        sites = fetchSitesFromConnections(connections)
                        isLoading = false
                    } catch (e: Exception) {
                        Log.e("SmallShortcutConfig", "Error fetching sites: ${e.message}", e)
                        error = e.message
                        isLoading = false
                    }
                }
            }
            
            DashifyMaterialTheme {
                WidgetConfigurationScreen(
                    widgetTitle = "Project Shortcut",
                    widgetDescription = "Quickly open your project",
                    sites = sites,
                    isLoading = isLoading,
                    error = error,
                    isAuthorized = connections.isNotEmpty(),
                    debugConnections = connections.toList(),
                    onSiteSelected = { site ->
                        selectedSite = site
                        val isSubscribed = prefs.getBoolean(IS_SUBSCRIBED_KEY, false)
                        val glanceId = GlanceAppWidgetManager(applicationContext).getGlanceIdBy(appWidgetId)
                        
                        SmallShortcutWidgetReceiver().onSiteSelected(applicationContext, glanceId, site, isSubscribed)
                        
                        val resultValue = Intent().apply {
                            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                        }
                        setResult(RESULT_OK, resultValue)
                        finish()
                    },
                    onCancel = { finish() }
                )
            }
        }
    }
}

private suspend fun fetchSitesFromConnections(connections: List<Connection>): List<SiteListItem> {
    val allSites = mutableListOf<SiteListItem>()
    
    for (connection in connections) {
        try {
            val accounts = fetchConnectionAccounts(connection)
            Log.d("SmallShortcutConfig", "Found ${accounts.size} accounts for connection")
            
            for (account in accounts) {
                val sites = fetchAccountSites(connection, account)
                Log.d("SmallShortcutConfig", "Found ${sites.size} sites for account ${account.name}")
                
                allSites.addAll(sites.map { site ->
                    SiteListItem(
                        id = site.id,
                        name = site.name,
                        connection = connection,
                        connectionAccount = account
                    )
                })
            }
        } catch (e: Exception) {
            Log.e("SmallShortcutConfig", "Error fetching for connection: ${e.message}", e)
        }
    }
    
    return allSites
}
