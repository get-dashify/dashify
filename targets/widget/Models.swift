import Foundation

let appGroupName: String = "group.com.dashify.mobile"
let connectionsKey: String = "dashify::connections"
let isSubscribedKey: String = "dashify::subscribed"
let widgetStateKey: String = "dashify::widgetState"

struct Connection: Decodable, Encodable {
  let id: String
  let apiToken: String
}

enum WidgetIntentState: Int {
  case loading = 0
  case apiFailed = 1
  case hasContainers = 2
  case noContainers = 3
}

typealias ConnectionAccountsResponse = [ConnectionAccount]

struct ConnectionAccount: Decodable {
  let id: String
  let name: String
  let slug: String
}

struct ConnectionSite: Decodable {
  let id: String
  let name: String
}

typealias FirewallMetricsResponse = [FirewallMetricsPoint]

struct FirewallMetricsPoint: Decodable {
  let time: String
  let values: FirewallMetricValues
}

struct FirewallMetricValues: Decodable {
  let allowed: Int?
  let blocked_waf: Int?
  let blocked_firewall_traffic_rules: Int?
  let blocked_ratelimiting_traffic_rules: Int?
}

struct FirewallWidgetData {
  let allowed: Int?
  let blocked_waf: Int?
  let blocked_firewall_traffic_rules: Int?
  let blocked_ratelimiting_traffic_rules: Int?
}


struct FunctionsRangeMetricsResponse: Decodable {
  let data: [FunctionsRangeData]
}

struct FunctionsRangeData: Decodable {
  let errors: Int
  let successes: Int
}
