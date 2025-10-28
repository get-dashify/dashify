package com.dashify.mobile
/**
 * Fetch connection accounts
 */
suspend fun fetchConnectionAccounts(connection: Connection): List<ConnectionAccount> {
    val params = FetchParams(
        method = HTTPMethod.GET,
        url = "/accounts",
        connection = connection,
        // baseUrl = "https://api.netlify.com/api/v1"
    )
    return httpRequest(params)
}

/**
 * Fetch account sites
 */
suspend fun fetchAccountSites(
    connection: Connection,
    connectionAccount: ConnectionAccount
): List<ConnectionSite> {
    val params = FetchParams(
        method = HTTPMethod.GET,
        url = "/${connectionAccount.slug}/sites",
        connection = connection,
        // baseUrl = "https://api.netlify.com/api/v1"
    )
    return httpRequest(params)
}

/**
 * Fetch site firewall metrics
 */
suspend fun fetchSiteFirewallMetrics(
    connection: Connection,
    siteId: String,
    from: Long? = null,
    to: Long? = null
): List<FirewallMetricsPoint> {
    // Compute effective time range in milliseconds
    val nowMs = System.currentTimeMillis()
    val oneMinuteMs = 60_000L
    val twentyFourHoursMs = 24 * 60 * 60 * 1000L
    
    val effectiveTo = to ?: (nowMs - oneMinuteMs)
    val effectiveFrom = from ?: (effectiveTo - twentyFourHoursMs)
    
    val params = FetchParams(
        method = HTTPMethod.GET,
        url = "/$siteId/blocked_web_requests?from=$effectiveFrom&to=$effectiveTo&resolution=hour",
        connection = connection,
        baseUrl = "https://app.netlify.com/access-control/analytics-api/v2",
        alternateHeader = true
    )
    
    return httpRequest(params)
}

/**
 * Fetch site functions metrics
 */
suspend fun fetchSiteFunctionsMetrics(
    connection: Connection,
    siteId: String,
    branch: String,
    from: Long? = null,
    to: Long? = null
): FunctionsRangeMetricsResponse {
    // Compute effective time range in milliseconds
    val nowMs = System.currentTimeMillis()
    val oneMinuteMs = 60_000L
    val twentyFourHoursMs = 24 * 60 * 60 * 1000L
    
    val effectiveTo = to ?: (nowMs - oneMinuteMs)
    val effectiveFrom = from ?: (effectiveTo - twentyFourHoursMs)
    
    val params = FetchParams(
        method = HTTPMethod.GET,
        url = "/sites/$siteId/site_usage_metrics/functions?from=$effectiveFrom&to=$effectiveTo&branch=$branch&resolution=range&filter=sum_duration,count,errors",
        connection = connection,
        baseUrl = "https://app.netlify.com/access-control/analytics-api/v2",
        alternateHeader = true
    )
    
    return httpRequest(params)
}

