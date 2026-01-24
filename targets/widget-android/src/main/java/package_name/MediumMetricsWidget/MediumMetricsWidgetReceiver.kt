package com.dashify.mobile

import android.content.Context
import android.content.Intent
import androidx.datastore.preferences.core.booleanPreferencesKey
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

class MediumMetricsWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = MediumMetricsWidget()

    companion object {
        val selectedSiteKey = stringPreferencesKey("mediumMetricsSelectedSite")
        val isSubscribedValueKey = booleanPreferencesKey("mediumMetricsIsSubscribed")
        val successCountKey = stringPreferencesKey("mediumMetricsSuccessCount")
        val errorCountKey = stringPreferencesKey("mediumMetricsErrorCount")
        val rangeKey = stringPreferencesKey("mediumMetricsRange")
        val branchKey = stringPreferencesKey("mediumMetricsBranch")
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        
        if (intent.action == "android.appwidget.action.APPWIDGET_UPDATE") {
            CoroutineScope(Dispatchers.IO).launch {
                val sharedPrefs = context.getSharedPreferences(APP_GROUP_NAME, Context.MODE_PRIVATE)
                val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(MediumMetricsWidget::class.java)

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

    fun onSiteSelected(context: Context, glanceId: GlanceId, site: SiteListItem?, isSubscribed: Boolean, metricsData: FunctionsWidgetData?, range: String, branch: String) {
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
                    this[branchKey] = branch
                    metricsData?.successCount?.let { this[successCountKey] = it.toString() }
                    metricsData?.errorCount?.let { this[errorCountKey] = it.toString() }
                }
            }

            glanceAppWidget.update(context, glanceId)
        }
    }
}

