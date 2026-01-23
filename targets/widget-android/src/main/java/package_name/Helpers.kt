package com.dashify.mobile
import android.content.Context
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.abs

/**
 * Format large numbers in a compact way (e.g., 1000 -> 1K, 1000000 -> 1M)
 */
fun formatCompactCount(value: Int): String {
    val absValue = abs(value)
    val sign = if (value < 0) "-" else ""
    
    val formatter = NumberFormat.getNumberInstance(Locale.US).apply {
        minimumFractionDigits = 0
        maximumFractionDigits = 1
        isGroupingUsed = false
    }
    
    val (scaled, suffix) = when {
        absValue >= 1_000_000_000 -> Pair(absValue / 1_000_000_000.0, "B")
        absValue >= 1_000_000 -> Pair(absValue / 1_000_000.0, "M")
        absValue >= 1_000 -> Pair(absValue / 1_000.0, "K")
        else -> return value.toString()
    }
    
    val numberString = formatter.format(scaled)
    return "$sign$numberString$suffix"
}

/**
 * Generate deep link to the app
 */
fun getAppDeepLink(context: Context, connectionId: String?, path: String): String {
    if (connectionId == null) {
        return "dashify://"
    }
    
    val prefs = context.getSharedPreferences(APP_GROUP_NAME, Context.MODE_PRIVATE)
    val isSubscribed = prefs.getBoolean(IS_SUBSCRIBED_KEY, false)
    
    return if (isSubscribed) {
        val separator = if (path.contains("?")) "&" else "?"
        "dashify://$path${separator}_widgetConnectionId=$connectionId"
    } else {
        "dashify://?showPaywall=1"
    }
}

/**
 * Calculate timestamp from hours ago
 */
fun getTimestampHoursAgo(hours: Int): Long {
    return System.currentTimeMillis() - (hours * 60 * 60 * 1000L)
}
