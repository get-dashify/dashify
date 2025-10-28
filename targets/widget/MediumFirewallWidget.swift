import WidgetKit
import SwiftUI
import AppIntents

fileprivate enum RangeOption: String, AppEnum {
  case day = "24H"
  case week = "7D"
  
  static var typeDisplayRepresentation: TypeDisplayRepresentation = "Range"
  static var caseDisplayRepresentations: [RangeOption: DisplayRepresentation] = [
    .day: "24H",
    .week: "7D"
  ]
}

struct MediumFirewallAppIntentConfiguration: WidgetConfigurationIntent {
  static var title: LocalizedStringResource { "Site" }
  static var description: IntentDescription { "Select your site." }
  
  @Parameter(title: "Site")
  var site: SiteListItem?
  
  @Parameter(title: "Range", default: .day)
  fileprivate var range: RangeOption

  @Parameter(title: "Show Allowed", default: true)
  var showAllowed: Bool
  
  @Parameter(title: "Show WAF", default: true)
  var showWAF: Bool
  
  @Parameter(title: "Show Firewall", default: true)
  var showFirewall: Bool
  
  @Parameter(title: "Show Rate Limit", default: true)
  var showRateLimit: Bool
}

struct MediumFirewallProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> MediumFirewallEntry {
    MediumFirewallEntry(date: Date(), configuration: MediumFirewallAppIntentConfiguration(), isSubscribed: true,  firewallData: .init(allowed: nil, blocked_waf: nil, blocked_firewall_traffic_rules: nil, blocked_ratelimiting_traffic_rules: nil))
  }
  
  func snapshot(for configuration: MediumFirewallAppIntentConfiguration, in context: Context) async -> MediumFirewallEntry {
    MediumFirewallEntry(date: Date(), configuration: configuration, isSubscribed: true, firewallData: .init(allowed: nil, blocked_waf: nil, blocked_firewall_traffic_rules: nil, blocked_ratelimiting_traffic_rules: nil))
  }
  
  func timeline(for configuration: MediumFirewallAppIntentConfiguration, in context: Context) async -> Timeline<MediumFirewallEntry> {
    var entries: [MediumFirewallEntry] = []
    var isSubscribed: Bool = false
    var firewallData: FirewallWidgetData = .init(allowed: nil, blocked_waf: nil, blocked_firewall_traffic_rules: nil, blocked_ratelimiting_traffic_rules: nil)
    
    if let sharedDefaults = UserDefaults(suiteName: appGroupName) {
      let isSubscribedValue = sharedDefaults.bool(forKey: isSubscribedKey)
      
      isSubscribed = isSubscribedValue
    }
    
    if let site = configuration.site {
      // Calculate from date based on selected range
      let currentDate = Date()
      let fromDate: Date
      switch configuration.range {
      case .day:
        fromDate = Calendar.current.date(byAdding: .hour, value: -24, to: currentDate) ?? currentDate
      case .week:
        fromDate = Calendar.current.date(byAdding: .day, value: -7, to: currentDate) ?? currentDate
      }
      
      // Convert to Unix timestamp in milliseconds
      let fromTimestamp = Int(fromDate.timeIntervalSince1970 * 1000)
      
      if let firewallMetricsResponse = try? await fetchSiteFirewallMetrics(connection: site.connection, siteId: site.id, from: fromTimestamp, to: nil) {
        var totalAllowed = 0
        var totalBlockedWaf = 0
        var totalBlockedFirewallTrafficRules = 0
        var totalBlockedRateLimitingTrafficRules = 0
        var hasAllowed = false
        var hasBlockedWaf = false
        var hasBlockedFirewallTrafficRules = false
        var hasBlockedRateLimitingTrafficRules = false
        
        for point in firewallMetricsResponse {
          let values = point.values
          if let value = values.allowed {
            totalAllowed += value
            hasAllowed = true
          }
          if let value = values.blocked_waf {
            totalBlockedWaf += value
            hasBlockedWaf = true
          }
          if let value = values.blocked_firewall_traffic_rules {
            totalBlockedFirewallTrafficRules += value
            hasBlockedFirewallTrafficRules = true
          }
          if let value = values.blocked_ratelimiting_traffic_rules {
            totalBlockedRateLimitingTrafficRules += value
            hasBlockedRateLimitingTrafficRules = true
          }
        }
        
        firewallData = .init(
          allowed: hasAllowed ? totalAllowed : nil,
          blocked_waf: hasBlockedWaf ? totalBlockedWaf : nil,
          blocked_firewall_traffic_rules: hasBlockedFirewallTrafficRules ? totalBlockedFirewallTrafficRules : nil,
          blocked_ratelimiting_traffic_rules: hasBlockedRateLimitingTrafficRules ? totalBlockedRateLimitingTrafficRules : nil
        )
      }
    }
    
    // Generate a timeline consisting of five entries an hour apart, starting from the current date.
    let currentDate = Date()
    for hourOffset in 0 ..< 5 {
      let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
      let entry = MediumFirewallEntry(date: entryDate, configuration: configuration, isSubscribed: isSubscribed, firewallData: firewallData)
      entries.append(entry)
    }
    
    return Timeline(entries: entries, policy: .atEnd)
  }
}

struct MediumFirewallEntry: TimelineEntry {
  let date: Date
  let configuration: MediumFirewallAppIntentConfiguration
  let isSubscribed: Bool
  let firewallData: FirewallWidgetData
}

struct MediumFirewallInfoItemView: View {
  var color: String
  var label: String
  var value: Int?
  
  var body: some View {
    VStack(alignment: .center, spacing: 10.0) {
      Text(value.map(formatCompactCount) ?? "—")
        .font(.system(size: 24, weight: .bold))
        .foregroundStyle(Color("neutral000"))
      Text(label)
        .font(.system(size: 14, weight: .bold))
        .foregroundStyle(Color(color))
    }
  }
}

struct MediumFirewallEntryView: View {
  var entry: MediumFirewallProvider.Entry
  
  var body: some View {
    if (!entry.isSubscribed) {
      SubscriptionRequiredView()
        .widgetURL(URL(string: getAppDeepLink(siteId: entry.configuration.site?.id)))
    } else {
      let config = entry.configuration
      
      VStack(alignment: .leading, spacing: 36.0) {
        HStack(alignment: .center, spacing: 10.0) {
          Image("AppIconImage")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 30.0, height: 30.0)
            .clipShape(Circle())
          
          if let site = config.site {
            HStack(spacing: 0) {
              Text("\(site.name)")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(Color("neutral000"))
                .lineLimit(1)
                .truncationMode(.tail)
              
              Spacer()
              
              // Show selected range
              Text(config.range == .day ? "DAY" : "WEEK")
                .font(.system(size: 14, weight: .regular))
                .foregroundStyle(Color("neutral000").opacity(0.6))
            }
          } else {
            VStack {
              RoundedRectangle(cornerRadius: 8.0)
                .fill(Color("bgDark"))
                .frame(height: 10.0)
            }
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        
        HStack(alignment: .center, spacing: 0) {
          // Conditionally show metrics based on configuration
          Spacer()
          if config.showAllowed {
            MediumFirewallInfoItemView(color: "green500", label: "Allowed", value: entry.firewallData.allowed)
            Spacer()
          }
          if config.showWAF {
            MediumFirewallInfoItemView(color: "gold500", label: "WAF", value: entry.firewallData.blocked_waf)
            Spacer()
          }
          if config.showFirewall {
            MediumFirewallInfoItemView(color: "red500", label: "Firewall", value: entry.firewallData.blocked_firewall_traffic_rules)
            Spacer()
          }
          if config.showRateLimit {
            MediumFirewallInfoItemView(color: "red500", label: "Rate Limit", value: entry.firewallData.blocked_ratelimiting_traffic_rules)
            Spacer()
          }
        }
        .frame(maxWidth: .infinity, alignment: .center)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .widgetURL(URL(string: getAppDeepLink(siteId: entry.configuration.site?.id)))
    }
  }
}

struct MediumFirewallWidget: Widget {
  let kind: String = "MediumFirewallWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: MediumFirewallAppIntentConfiguration.self, provider: MediumFirewallProvider()) { entry in
      MediumFirewallEntryView(entry: entry)
        .containerBackground(for: .widget) {
          Color("bgApp")
        }
    }
    .configurationDisplayName("Firewall").description("Peek the firewall metrics for your site.")
    .supportedFamilies([.systemMedium])
  }
}

extension MediumFirewallAppIntentConfiguration {
  fileprivate static var project: MediumFirewallAppIntentConfiguration {
    let intent = MediumFirewallAppIntentConfiguration()
    intent.site = .init(id: "1", name: "Dashify", connection: .init(id: "1", apiToken: "2"), connectionAccount: .init(id: "1", name: "2", slug: "3"))
    return intent
  }
}

#Preview(as: .systemSmall) {
  MediumFirewallWidget()
} timeline: {
  MediumFirewallEntry(date: .now, configuration: .project, isSubscribed: true, firewallData: .init(allowed: nil, blocked_waf: nil, blocked_firewall_traffic_rules: nil, blocked_ratelimiting_traffic_rules: nil))
}
