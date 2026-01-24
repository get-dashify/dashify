package com.dashify.mobile

import android.content.Context
import android.content.Intent
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition
import com.google.gson.Gson
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MediumFirewallWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = MediumFirewallWidget()

    companion object {
        val selectedSiteKey = stringPreferencesKey("selectedSite")
        val isSubscribedValueKey = booleanPreferencesKey("isSubscribed")
        val allowedKey = intPreferencesKey("allowed")
        val blockedWafKey = intPreferencesKey("blockedWaf")
        val blockedFirewallKey = intPreferencesKey("blockedFirewall")
        val blockedRateLimitKey = intPreferencesKey("blockedRateLimit")
        val rangeKey = stringPreferencesKey("range")
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        
        if (intent.action == "android.appwidget.action.APPWIDGET_UPDATE") {
            CoroutineScope(Dispatchers.IO).launch {
                val sharedPrefs = context.getSharedPreferences(APP_GROUP_NAME, Context.MODE_PRIVATE)
                val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(MediumFirewallWidget::class.java)

                glanceIds.forEach { glanceId ->
                    updateAppWidgetState(
                        context = context,
                        definition = PreferencesGlanceStateDefinition,
                        glanceId = glanceId
                    ) { prefs ->
                        prefs.toMutablePreferences().apply {
                            this[isSubscribedValueKey] = sharedPrefs.getBoolean(IS_SUBSCRIBED_KEY, false)
                        }
                    }

                    glanceAppWidget.update(context, glanceId)
                }
            }
        }
    }

    fun onSiteSelected(context: Context, glanceId: GlanceId, site: SiteListItem?, isSubscribed: Boolean, range: String) {
        if (site == null) {
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            updateAppWidgetState(
                context = context,
                definition = PreferencesGlanceStateDefinition,
                glanceId = glanceId
            ) { prefs ->
                prefs.toMutablePreferences().apply {
                    this[selectedSiteKey] = Gson().toJson(site)
                    this[isSubscribedValueKey] = isSubscribed
                    this[rangeKey] = range
                }
            }

            glanceAppWidget.update(context, glanceId)
        }
    }

    fun updateFirewallData(
        context: Context,
        glanceId: GlanceId,
        allowed: Int?,
        blockedWaf: Int?,
        blockedFirewall: Int?,
        blockedRateLimit: Int?
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            updateAppWidgetState(
                context = context,
                definition = PreferencesGlanceStateDefinition,
                glanceId = glanceId
            ) { prefs ->
                prefs.toMutablePreferences().apply {
                    allowed?.let { this[allowedKey] = it }
                    blockedWaf?.let { this[blockedWafKey] = it }
                    blockedFirewall?.let { this[blockedFirewallKey] = it }
                    blockedRateLimit?.let { this[blockedRateLimitKey] = it }
                }
            }

            glanceAppWidget.update(context, glanceId)
        }
    }
}

