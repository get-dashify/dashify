import Foundation

// fetchConnectionTeams
func fetchConnectionAccounts(connection: Connection) async throws -> ConnectionAccountsResponse {
  let params = FetchParams<NoBody>(
    method: HTTPMethod.GET,
    url: "/accounts",
    connection: connection
  )
  
  return try await httpRequest(params: params)
}

// fetchTeamProjects
func fetchAccountSites(connection: Connection, connectionAccount: ConnectionAccount) async throws -> [ConnectionSite] {
  let params = FetchParams<NoBody>(
    method: HTTPMethod.GET,
    url: "/\(connectionAccount.slug)/sites",
    connection: connection
  )
  
  return try await httpRequest(params: params)
}

// fetchProjectFirewallMetrics (old name)
func fetchSiteFirewallMetrics(connection: Connection, siteId: String, from: Int?, to: Int?) async throws -> FirewallMetricsResponse {
  // Compute effective time range in milliseconds (JS format).
  // If both are nil: use last 24 hours ending 1 minute ago as a buffer.
  // If one is provided: infer the other relative to a 24-hour window.
  let nowMs = Int(Date().timeIntervalSince1970 * 1000)
  let oneMinuteMs = 60_000
  let twentyFourHoursMs = 24 * 60 * 60 * 1_000
  
  let effectiveTo: Int = to ?? (nowMs - oneMinuteMs)
  let effectiveFrom: Int = from ?? (effectiveTo - twentyFourHoursMs)
  
  let params = FetchParams<NoBody>(
    method: HTTPMethod.GET,
    url: "/\(siteId)/blocked_web_requests?from=\(effectiveFrom)&to=\(effectiveTo)&resolution=hour",
    connection: connection,
    baseUrl: "https://app.netlify.com/access-control/analytics-api/v2",
    alternateHeader: true
  )
  
  return try await httpRequest(params: params)
}


func fetchSiteFunctionsMetrics(connection: Connection, siteId: String, branch: String, from: Int?, to: Int?) async throws -> FunctionsRangeMetricsResponse {
  // Compute effective time range in milliseconds (JS format).
  // If both are nil: use last 24 hours ending 1 minute ago as a buffer.
  // If one is provided: infer the other relative to a 24-hour window.
  let nowMs = Int(Date().timeIntervalSince1970 * 1000)
  let oneMinuteMs = 60_000
  let twentyFourHoursMs = 24 * 60 * 60 * 1_000
  
  let effectiveTo: Int = to ?? (nowMs - oneMinuteMs)
  let effectiveFrom: Int = from ?? (effectiveTo - twentyFourHoursMs)
  
  let params = FetchParams<NoBody>(
    method: HTTPMethod.GET,
    url: "/sites/\(siteId)/site_usage_metrics/functions?from=\(effectiveFrom)&to=\(effectiveTo)&branch=\(branch)&resolution=range&filter=sum_duration,count,errors",
    connection: connection,
    baseUrl: "https://app.netlify.com/access-control/analytics-api/v2",
    alternateHeader: true
  )
  
  return try await httpRequest(params: params)
}
