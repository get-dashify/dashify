import WidgetKit
import SwiftUI
import AppIntents


fileprivate struct FunctionsWidgetData {
  let successCount: Int?
  let errorCount: Int?
}

fileprivate enum RangeOption: String, AppEnum {
  case day = "24H"
  case week = "7D"
  
  static var typeDisplayRepresentation: TypeDisplayRepresentation = "Range"
  static var caseDisplayRepresentations: [RangeOption: DisplayRepresentation] = [
    .day: "24H",
    .week: "7D"
  ]
}

struct MediumFunctionsAppIntentConfiguration: WidgetConfigurationIntent {
  static var title: LocalizedStringResource { "Site" }
  static var description: IntentDescription { "Select your site." }
  
  @Parameter(title: "Site")
  var site: SiteListItem?
  
  @Parameter(title: "Range", default: .day)
  fileprivate var range: RangeOption

  @Parameter(title: "Branch", default: "main")
  var branch: String
}

struct MediumFunctionsProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> MediumFunctionsEntry {
    MediumFunctionsEntry(date: Date(), configuration: MediumFunctionsAppIntentConfiguration(), isSubscribed: true, metrics: .init(successCount: nil, errorCount: nil))
  }
  
  func snapshot(for configuration: MediumFunctionsAppIntentConfiguration, in context: Context) async -> MediumFunctionsEntry {
    MediumFunctionsEntry(date: Date(), configuration: configuration, isSubscribed: true, metrics: .init(successCount: nil, errorCount: nil))
  }
  
  func timeline(for configuration: MediumFunctionsAppIntentConfiguration, in context: Context) async -> Timeline<MediumFunctionsEntry> {
    var entries: [MediumFunctionsEntry] = []
    var isSubscribed: Bool = false
    var metricsData: FunctionsWidgetData = .init(successCount: nil, errorCount: nil)
    
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
      
      if let functionsMetricsResponse = try? await fetchSiteFunctionsMetrics(connection: site.connection, siteId: site.id, branch: configuration.branch, from: fromTimestamp, to: nil) {
        
        // Get data from first array item
        if let firstData = functionsMetricsResponse.data.first {
          metricsData = .init(
            successCount: firstData.successes,
            errorCount: firstData.errors
          )
        }
      }
    }
    
    // Generate a timeline consisting of five entries an hour apart, starting from the current date.
    let currentDate = Date()
    for hourOffset in 0 ..< 5 {
      let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
      let entry = MediumFunctionsEntry(date: entryDate, configuration: configuration, isSubscribed: isSubscribed, metrics: metricsData)
      entries.append(entry)
    }
    
    return Timeline(entries: entries, policy: .atEnd)
  }
}

struct MediumFunctionsEntry: TimelineEntry {
  let date: Date
  let configuration: MediumFunctionsAppIntentConfiguration
  let isSubscribed: Bool
  fileprivate let metrics: FunctionsWidgetData
}

struct MediumFunctionsInfoItemView: View {
  var color: String
  var label: String
  var value: Int?
  
  var body: some View {
    VStack(alignment: .center, spacing: 10.0) {
      Text(value.map(formatCompactCount) ?? "—")
        .font(.system(size: 36, weight: .bold))
        .foregroundStyle(Color("neutral000"))
      Text(label)
        .font(.system(size: 16, weight: .bold))
        .foregroundStyle(Color(color))
    }
  }
}

struct MediumFunctionsEntryView: View {
  var entry: MediumFunctionsProvider.Entry
  
  var body: some View {
    if (!entry.isSubscribed) {
      SubscriptionRequiredView()
        .widgetURL(URL(string: getAppDeepLink(siteId: entry.configuration.site?.id)))
    } else {
      let config = entry.configuration
      
      VStack(alignment: .leading, spacing: 20.0) {
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
                .multilineTextAlignment(.center)
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
          MediumFunctionsInfoItemView(color: "green500", label: "Succeeded", value: entry.metrics.successCount)
            Spacer()
          MediumFunctionsInfoItemView(color: "red500", label: "Failed", value: entry.metrics.errorCount)
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .center)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .widgetURL(URL(string: getAppDeepLink(siteId: entry.configuration.site?.id)))
    }
  }
}

struct MediumFunctionsWidget: Widget {
  let kind: String = "MediumFunctionsWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: MediumFunctionsAppIntentConfiguration.self, provider: MediumFunctionsProvider()) { entry in
      MediumFunctionsEntryView(entry: entry)
        .containerBackground(for: .widget) {
          Color("bgApp")
        }
    }
    .configurationDisplayName("Functions").description("Peek the Functions metrics for your site.")
    .supportedFamilies([.systemMedium])
  }
}

extension MediumFunctionsAppIntentConfiguration {
  fileprivate static var project: MediumFunctionsAppIntentConfiguration {
    let intent = MediumFunctionsAppIntentConfiguration()
    intent.site = .init(id: "1", name: "Dashify", connection: .init(id: "1", apiToken: "2"), connectionAccount: .init(id: "1", name: "2", slug: "3"))
    return intent
  }
}

#Preview(as: .systemSmall) {
  MediumFunctionsWidget()
} timeline: {
  MediumFunctionsEntry(date: .now, configuration: .project, isSubscribed: true, metrics: .init(successCount: nil, errorCount: nil))
}
