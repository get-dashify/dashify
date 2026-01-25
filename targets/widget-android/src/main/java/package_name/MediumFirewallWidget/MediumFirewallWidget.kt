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
import androidx.glance.LocalContext
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.currentState
import androidx.datastore.preferences.core.Preferences
import androidx.glance.unit.ColorProvider
import androidx.compose.ui.graphics.Color
import com.dashify.mobile.MediumFirewallConfigurationActivity
import com.google.gson.Gson

class MediumFirewallWidget : GlanceAppWidget() {
    
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            DashifyGlanceTheme {
                MediumFirewallContent()
            }
        }
    }
}

@Composable
fun MediumFirewallContent() {
    val state = currentState<Preferences>()
    val rawSite = state[MediumFirewallWidgetReceiver.selectedSiteKey]
    val isSubscribed = state[MediumFirewallWidgetReceiver.isSubscribedValueKey] ?: false
    val range = state[MediumFirewallWidgetReceiver.rangeKey] ?: "DAY"
    val site = try {
        rawSite?.let { Gson().fromJson(it, SiteListItem::class.java) }
    } catch (e: Exception) {
        null
    }
    
    val allowed = state[MediumFirewallWidgetReceiver.allowedKey]
    val blockedWaf = state[MediumFirewallWidgetReceiver.blockedWafKey]
    val blockedFirewall = state[MediumFirewallWidgetReceiver.blockedFirewallKey]
    val blockedRateLimit = state[MediumFirewallWidgetReceiver.blockedRateLimitKey]
    
    val context = LocalContext.current
    val deepLink = if (site != null) {
        getAppDeepLink(context, site.connection.id, "sites/${site.id}/home")
    } else {
        getAppDeepLink(context, null, "")
    }
    
    Box(
        contentAlignment = Alignment.TopStart,
        modifier = GlanceModifier
            .background(GlanceTheme.colors.background)
            .cornerRadius(8.dp)
            .padding(14.dp)
            .clickable {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink))
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
            }
    ) {
        if (site == null || !isSubscribed) {
            SubscriptionRequiredView()
        } else {
            Column {
                
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                   Text(
                        text = site.name,
                        style = TextStyle(
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = GlanceTheme.colors.onSurface
                        ),
                        maxLines = 1,
                        modifier = GlanceModifier.defaultWeight()
                    )

                    Text(
                        text = if (range == "DAY") "DAY" else "WEEK",
                        style = TextStyle(
                            fontSize = 14.sp,
                            color = ColorProvider(Color(0x99FFFFFF))
                        )
                    )
                }
                
                Spacer(modifier = GlanceModifier.height(4.dp))
                
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = allowed?.toString() ?: "-",
                            style = TextStyle(
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = GlanceTheme.colors.onSurface
                            )
                        )
                        
                        Spacer(modifier = GlanceModifier.height(2.dp))
                        
                        Text(
                            text = "Allowed",
                            style = TextStyle(
                                fontSize = 13.sp,
                                color = ColorProvider(Color(0xFF21C171))
                            )
                        )
                    }
                    Spacer(modifier = GlanceModifier.width(36.dp))
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = blockedWaf?.toString() ?: "-",
                            style = TextStyle(
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = GlanceTheme.colors.onSurface
                            )
                        )
                        
                        Spacer(modifier = GlanceModifier.height(2.dp))
                        
                        Text(
                            text = "WAF",
                            style = TextStyle(
                                fontSize = 13.sp,
                                color = ColorProvider(Color(0xFFF2994A))
                            )
                        )
                    }
                    Spacer(modifier = GlanceModifier.width(36.dp))
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = blockedFirewall?.toString() ?: "-",
                            style = TextStyle(
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = GlanceTheme.colors.onSurface
                            )
                        )
                        
                        Spacer(modifier = GlanceModifier.height(2.dp))
                        
                        Text(
                            text = "Firewall",
                            style = TextStyle(
                                fontSize = 13.sp,
                                color = ColorProvider(Color(0xFFEB5757))
                            )
                        )
                    }
                    Spacer(modifier = GlanceModifier.width(36.dp))
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = blockedRateLimit?.toString() ?: "-",
                            style = TextStyle(
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = GlanceTheme.colors.onSurface
                            )
                        )
                        
                        Spacer(modifier = GlanceModifier.height(2.dp))
                        
                        Text(
                            text = "Rate Limit",
                            style = TextStyle(
                                fontSize = 13.sp,
                                color = ColorProvider(Color(0xFFEB5757))
                            )
                        )
                    }
                }
            }
        }
    }
}

