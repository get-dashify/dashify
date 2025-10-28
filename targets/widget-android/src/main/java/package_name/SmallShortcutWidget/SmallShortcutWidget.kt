package com.dashify.mobile

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.layout.size
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.currentState
import androidx.datastore.preferences.core.Preferences
import com.google.gson.Gson

class SmallShortcutWidget : GlanceAppWidget() {
    
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            DashifyGlanceTheme {
                SmallShortcutContent()
            }
        }
    }
}

@Composable
fun SmallShortcutContent() {
    val state = currentState<Preferences>()
    val rawSite = state[SmallShortcutWidgetReceiver.selectedSiteKey]
    val isSubscribed = state[SmallShortcutWidgetReceiver.isSubscribedValueKey] ?: false
    val site = Gson().fromJson(rawSite, SiteListItem::class.java)
    
    val context = LocalContext.current
    val deepLink = getAppDeepLink(context, site?.id)
    
    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceTheme.colors.background)
            .padding(16.dp)
            .clickable {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink))
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
            },
        contentAlignment = Alignment.Center
    ) {
        if (!isSubscribed) {
            SubscriptionRequiredView()
        } else {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = GlanceModifier.fillMaxSize()
            ) {
                Spacer(modifier = GlanceModifier.height(8.dp))
                
                // App Icon
                Image(
                    provider = ImageProvider(com.dashify.mobile.R.drawable.default_project_icon),
                    contentDescription = "App Icon",
                    modifier = GlanceModifier.size(75.dp)
                )
                
                Spacer(modifier = GlanceModifier.height(10.dp))
                
                // Site Name or Placeholder
                if (site != null) {
                    Text(
                        text = site.name,
                        style = TextStyle(
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = GlanceTheme.colors.onSurface,
                            textAlign = TextAlign.Center
                        ),
                        maxLines = 2
                    )
                } else {
                    // Placeholder loading state
                    Box(
                        modifier = GlanceModifier
                            .size(120.dp, 10.dp)
                            .background(androidx.glance.unit.ColorProvider(android.graphics.Color.parseColor("#1E242C")))
                    ) { }
                }
            }
        }
    }
}
