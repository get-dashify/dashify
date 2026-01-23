import Foundation

enum Granularity {
  case fiveMinutes
  case oneHour
}

enum RoundMode {
  case up
  case down
}

func formatCompactCount(_ value: Int) -> String {
  let absValue = abs(value)
  let sign = value < 0 ? "-" : ""
  let formatter = NumberFormatter()
  formatter.numberStyle = .decimal
  formatter.usesGroupingSeparator = false
  formatter.minimumFractionDigits = 0
  formatter.maximumFractionDigits = 1
  
  var scaled: Double = Double(absValue)
  var suffix = ""
  if absValue >= 1_000_000_000 {
    scaled = Double(absValue) / 1_000_000_000.0
    suffix = "B"
  } else if absValue >= 1_000_000 {
    scaled = Double(absValue) / 1_000_000.0
    suffix = "M"
  } else if absValue >= 1_000 {
    scaled = Double(absValue) / 1_000.0
    suffix = "K"
  } else {
    return "\(value)"
  }
  let numberString = formatter.string(from: NSNumber(value: scaled)) ?? String(format: "%.1f", scaled)
  return "\(sign)\(numberString)\(suffix)"
}

func getAppDeepLink(connectionId: String?, path: String) -> String {
  guard let connectionId = connectionId else {
    return "dashify://"
  }
  
  if let sharedDefaults = UserDefaults(suiteName: appGroupName) {
    let isSubscribed = sharedDefaults.bool(forKey: isSubscribedKey)
    
    if isSubscribed {
      let separator = path.contains("?") ? "&" : "?"
      return "dashify://\(path)\(separator)_widgetConnectionId=\(connectionId)"
    }
  }

  return "dashify://?showPaywall=1"
}
