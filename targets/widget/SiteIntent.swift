import AppIntents
import OSLog

struct SiteListItem: AppEntity, Decodable {
  static var defaultQuery = SiteQuery()
  static var typeDisplayRepresentation: TypeDisplayRepresentation = "Select Site"
  
  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)") // same "name" from below
  }
  
  let id: String
  let name: String
  let connection: Connection
  let connectionAccount: ConnectionAccount
}

private let intentLogger = Logger(subsystem: "dashify.widget", category: "IntentSettings")

struct SiteQuery: EntityQuery {
  func getSharedOptions() async throws -> [SiteListItem] {
    var options: [SiteListItem] = []
    
    intentLogger.debug("getSharedOptions invoked")
    print("[Intent] getSharedOptions invoked")
    setWidgetState(state: .loading)
    
    guard let sharedDefaults = UserDefaults(suiteName: appGroupName),
          let rawConnections = sharedDefaults.data(forKey: connectionsKey) else {
      intentLogger.error("Missing shared defaults or connections data appGroup=\(appGroupName) key=\(connectionsKey)")
      print("[Intent][Error] Missing shared defaults or connections data appGroup=\(appGroupName) key=\(connectionsKey)")
      setWidgetState(state: .apiFailed)
      
      return options
    }
    
    let connections = (try? JSONDecoder().decode([Connection].self, from: rawConnections)) ?? []
    intentLogger.debug("Decoded connections count=\(connections.count)")
    print("[Intent] Decoded connections count=\(connections.count)")
    
    for connection in connections {
      intentLogger.debug("Fetching accounts for connection id=\(connection.id)")
      print("[Intent] Fetching accounts for connection id=\(connection.id)")
      do {
        let connectionAccounts = try await fetchConnectionAccounts(connection: connection)
        intentLogger.debug("Fetched connectionAccounts count=\(connectionAccounts.count) for connection id=\(connection.id)")
        print("[Intent] Fetched connectionAccounts count=\(connectionAccounts.count) for connection id=\(connection.id)")
        
        for connectionAccount in connectionAccounts {
          intentLogger.debug("Fetching sites for connectionAccount id=\(connectionAccount.id) displayName=\(connectionAccount.name)")
          print("[Intent] Fetching sites for connectionAccount id=\(connectionAccount.id) displayName=\(connectionAccount.name)")
          let accountSites = try await fetchAccountSites(connection: connection, connectionAccount: connectionAccount)
          intentLogger.debug("Fetched sites count=\(accountSites.count) for connectionAccount id=\(connectionAccount.id)")
          print("[Intent] Fetched sites count=\(accountSites.count) for connectionAccount id=\(connectionAccount.id)")
          
          options.append(contentsOf: accountSites.map { site in
            SiteListItem(
              id: site.id,
              name: site.name,
              connection: connection,
              connectionAccount: connectionAccount
            )
          })
          intentLogger.debug("Aggregated options so far count=\(options.count)")
          print("[Intent] Aggregated options so far count=\(options.count)")
        }
      } catch {
        intentLogger.error("Error during fetching accounts/sites for connection id=\(connection.id) error=\(String(describing: error))")
        print("[Intent][Error] Error during fetching accounts/sites for connection id=\(connection.id) error=\(String(describing: error))")
        setWidgetState(state: .apiFailed)
        
        return options
      }
    }
    setWidgetState(state: options.isEmpty ? .noContainers : .hasContainers)
//    intentLogger.debug("getSharedOptions finished with options count=\(options.count) state=\(options.isEmpty ? \"noContainers\" : \"hasContainers\")")
//    print("[Intent] getSharedOptions finished with options count=\(options.count) state=\(options.isEmpty ? \"noContainers\" : \"hasContainers\")")
    
    return options
  }
  
  func entities(for identifiers: [SiteListItem.ID]) async throws -> [SiteListItem] {
    intentLogger.debug("entities(for:) called identifiers count=\(identifiers.count)")
    print("[Intent] entities(for:) called identifiers count=\(identifiers.count)")
    return try await getSharedOptions().filter { identifiers.contains($0.id) }
  }
  
  func suggestedEntities() async throws -> [SiteListItem] {
    intentLogger.debug("suggestedEntities requested")
    print("[Intent] suggestedEntities requested")
    return try await getSharedOptions()
  }
  
  func defaultResult() async -> SiteListItem? {
    intentLogger.debug("defaultResult requested")
    print("[Intent] defaultResult requested")
    return try? await suggestedEntities().first
  }
  
  private func setWidgetState(state: WidgetIntentState) {
    guard let sharedDefaults = UserDefaults(suiteName: appGroupName) else {
      intentLogger.error("Failed to access shared defaults for app group \(appGroupName)")
      print("[Intent][Error] Failed to access shared defaults for app group \(appGroupName)")
      return
    }
    
    sharedDefaults.set(state.rawValue, forKey: widgetStateKey)
    intentLogger.debug("Widget state set to \(state.rawValue) for key=\(widgetStateKey)")
    print("[Intent] Widget state set to \(state.rawValue) for key=\(widgetStateKey)")
  }
}
