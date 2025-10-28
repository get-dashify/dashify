package com.dashify.mobile
import com.google.gson.annotations.SerializedName

// App Group Configuration
const val APP_GROUP_NAME = "group.com.dashify.mobile"
const val CONNECTIONS_KEY = "dashify::connections"
const val IS_SUBSCRIBED_KEY = "dashify::subscribed"
const val WIDGET_STATE_KEY = "dashify::widgetState"

// Connection Model - Simple data class for JSON deserialization
// Fields are nullable to match Expo Record serialization
data class Connection(
    val id: String?,
    val apiToken: String?
)

// Widget Intent States
enum class WidgetIntentState(val value: Int) {
    LOADING(0),
    API_FAILED(1),
    HAS_CONTAINERS(2),
    NO_CONTAINERS(3)
}

// API Response Models
data class ConnectionAccount(
    val id: String,
    val name: String,
    val slug: String
)

data class ConnectionSite(
    val id: String,
    val name: String
)

// Firewall Metrics Models
data class FirewallMetricsPoint(
    val time: String,
    val values: FirewallMetricValues
)

data class FirewallMetricValues(
    val allowed: Int?,
    @SerializedName("blocked_waf")
    val blockedWaf: Int?,
    @SerializedName("blocked_firewall_traffic_rules")
    val blockedFirewallTrafficRules: Int?,
    @SerializedName("blocked_ratelimiting_traffic_rules")
    val blockedRateLimitingTrafficRules: Int?
)

data class FirewallWidgetData(
    val allowed: Int?,
    val blockedWaf: Int?,
    val blockedFirewallTrafficRules: Int?,
    val blockedRateLimitingTrafficRules: Int?
)

// Functions Metrics Models
data class FunctionsRangeMetricsResponse(
    val data: List<FunctionsRangeData>
)

data class FunctionsRangeData(
    val errors: Int,
    val successes: Int
)

data class FunctionsWidgetData(
    val successCount: Int?,
    val errorCount: Int?
)

// Site List Item for Widget Configuration
data class SiteListItem(
    val id: String,
    val name: String,
    val connection: Connection,
    val connectionAccount: ConnectionAccount
)

// Range Options
enum class RangeOption(val displayName: String) {
    DAY("24H"),
    WEEK("7D");

    fun toHours(): Int = when (this) {
        DAY -> 24
        WEEK -> 168
    }
}

