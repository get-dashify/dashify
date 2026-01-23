import WidgetKit
import SwiftUI
import AppIntents

struct SmallShortcutAppIntentConfiguration: WidgetConfigurationIntent {
  static var title: LocalizedStringResource { "Site" }
  static var description: IntentDescription { "Select your site." }
  
  @Parameter(title: "Site")
  var site: SiteListItem?
}

struct SmallShortcutProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> SmallShortcutEntry {
    SmallShortcutEntry(date: Date(), configuration: SmallShortcutAppIntentConfiguration(), isSubscribed: true)
  }
  
  func snapshot(for configuration: SmallShortcutAppIntentConfiguration, in context: Context) async -> SmallShortcutEntry {
    SmallShortcutEntry(date: Date(), configuration: configuration, isSubscribed: true)
  }
  
  func timeline(for configuration: SmallShortcutAppIntentConfiguration, in context: Context) async -> Timeline<SmallShortcutEntry> {
    var entries: [SmallShortcutEntry] = []
    var isSubscribed: Bool = false
    
    if let sharedDefaults = UserDefaults(suiteName: appGroupName) {
      let isSubscribedValue = sharedDefaults.bool(forKey: isSubscribedKey)
      
      isSubscribed = isSubscribedValue
    }
    
    // Generate a timeline consisting of five entries an hour apart, starting from the current date.
    let currentDate = Date()
    for hourOffset in 0 ..< 5 {
      let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
      let entry = SmallShortcutEntry(date: entryDate, configuration: configuration, isSubscribed: isSubscribed)
      entries.append(entry)
    }
    
    return Timeline(entries: entries, policy: .atEnd)
  }
}

struct SmallShortcutEntry: TimelineEntry {
  let date: Date
  let configuration: SmallShortcutAppIntentConfiguration
  let isSubscribed: Bool
}

struct SmallShortcutEntryView: View {
  var entry: SmallShortcutProvider.Entry
  
  private var widgetURL: URL? {
    if let site = entry.configuration.site {
      return URL(string: getAppDeepLink(connectionId: site.connection.id, path: "sites/\(site.id)/home"))
    }
    return URL(string: getAppDeepLink(connectionId: nil, path: ""))
  }
  
  var body: some View {
    if (!entry.isSubscribed) {
      SubscriptionRequiredView()
        .widgetURL(widgetURL)
    } else {
      VStack(alignment: .center, spacing: 10.0) {
        Image("AppIconImage")
          .resizable()
          .aspectRatio(contentMode: .fit)
          .frame(width: 75.0, height: 75.0)
          .clipShape(Circle())
        
        if let site = entry.configuration.site {
          Text("\(site.name)")
            .font(.system(size: 16, weight: .bold))
            .foregroundStyle(Color("neutral000"))
            .multilineTextAlignment(.center)
            .lineLimit(2)
            .truncationMode(.tail)
        } else {
          VStack() {
            RoundedRectangle(cornerRadius: 8.0)
              .fill(Color("bgDark"))
              .frame(height: 10.0)
            RoundedRectangle(cornerRadius: 8.0)
              .fill(Color("bgDark"))
              .frame(width: 50.0, height: 10.0)
          }
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .widgetURL(widgetURL)
    }
  }
}

struct SmallShortcutWidget: Widget {
  let kind: String = "SmallShortcutWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: SmallShortcutAppIntentConfiguration.self, provider: SmallShortcutProvider()) { entry in
      SmallShortcutEntryView(entry: entry)
        .containerBackground(for: .widget) {
          Color("bgApp")
        }
    }
    .configurationDisplayName("Project Shortcut").description("Quickly open your project.")
    .supportedFamilies([.systemSmall])
  }
}

extension SmallShortcutAppIntentConfiguration {
  fileprivate static var project: SmallShortcutAppIntentConfiguration {
    let intent = SmallShortcutAppIntentConfiguration()
    intent.site = .init(id: "1", name: "Dashify", connection: .init(id: "1", apiToken: "2"), connectionAccount: .init(id: "1", name: "2", slug: "3"))
    return intent
  }
}

#Preview(as: .systemSmall) {
  SmallShortcutWidget()
} timeline: {
  SmallShortcutEntry(date: .now, configuration: .project, isSubscribed: true)
}
