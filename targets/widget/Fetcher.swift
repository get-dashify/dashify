import Foundation
import OSLog

struct NoBody: Encodable {}

enum HTTPMethod: String {
  case GET = "GET"
  case POST = "POST"
  case PUT = "PUT"
  case PATCH = "PATCH"
  case DELETE = "DELETE"
}

struct FetchParams<T: Encodable> {
  let method: HTTPMethod
  let url: String
  let baseUrl: String?
  let connection: Connection
  let body: T?
  let alternateHeader: Bool?
  
  // if body is needed to be sent, overload init
//  init(method: HTTPMethod, url: String, connection: Connection, body: T, baseUrl: String? = nil) {
//    self.method = method
//    self.url = url
//    self.connection = connection
//    self.body = body
//    self.baseUrl = baseUrl
//    self.apiToken = apiToken
//  }
  
  init(method: HTTPMethod, url: String, connection: Connection, baseUrl: String? = nil, alternateHeader: Bool? = nil) {
    self.method = method
    self.url = url
    self.connection = connection
    self.body = nil
    self.baseUrl = baseUrl
    self.alternateHeader = alternateHeader
  }
}

private let fetcherLogger = Logger(subsystem: "dashify.widget", category: "Fetcher")

private func fetch<T: Encodable>(params: FetchParams<T>, completion: @escaping (Result<Data, Error>) -> Void) {
//  fetcherLogger.debug("fetch called method=\(params.method.rawValue) url=\(params.url) baseUrl=\(params.baseUrl ?? \"nil\") altHeader=\((params.alternateHeader ?? false) ? \"true\" : \"false\")")
//  print("[Fetcher] fetch called method=\(params.method.rawValue) url=\(params.url) baseUrl=\(params.baseUrl ?? \"nil\") altHeader=\((params.alternateHeader ?? false) ? \"true\" : \"false\")")
  if (!params.url.starts(with: "/")) {
    fetcherLogger.error("InvalidUrl: URL should start with / — provided=\(params.url)")
    print("[Fetcher][Error] InvalidUrl: URL should start with / — provided=\(params.url)")
    return completion(.failure(NSError(domain: "InvalidUrl", code: 0, userInfo: [NSLocalizedDescriptionKey: "URL should start with /"])))
  }
  
  let fullUrlString = params.baseUrl != nil ? "\(params.baseUrl ?? "")\(params.url)" : "https://app.netlify.com/access-control/bb-api/api/v1\(params.url)"
  fetcherLogger.debug("Constructed full URL: \(fullUrlString)")
  print("[Fetcher] Constructed full URL: \(fullUrlString)")
  
  guard let fullUrl = URL(string: fullUrlString) else {
    fetcherLogger.error("InvalidURL: Could not create URL from string: \(fullUrlString)")
    print("[Fetcher][Error] InvalidURL: Could not create URL from string: \(fullUrlString)")
    return completion(.failure(NSError(domain: "InvalidURL", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
  }
  
  var request = URLRequest(url: fullUrl)
  
  request.httpMethod = params.method.rawValue
  request.addValue("application/json", forHTTPHeaderField: "Accept")
  
  if (params.alternateHeader ?? false) {
    fetcherLogger.debug("Using cookie header for auth (_nf-auth)")
  print("Adding cookie header")
    request.addValue("_nf-auth=\(params.connection.apiToken);", forHTTPHeaderField: "cookie")
  } else {
    fetcherLogger.debug("Using Authorization Bearer header")
  print("Adding Authorization header")
    request.addValue("Bearer \(params.connection.apiToken)", forHTTPHeaderField: "Authorization")
  }
  
  
  if let data = params.body {
    let jsondata = try? JSONEncoder().encode(data)
    request.httpBody = jsondata
    fetcherLogger.debug("Attached HTTP body bytes=\(jsondata?.count ?? 0)")
    print("[Fetcher] Attached HTTP body bytes=\(jsondata?.count ?? 0)")
  }
  
  let session = URLSession(configuration: .default)
  fetcherLogger.debug("URLSession created with default configuration")
  print("[Fetcher] URLSession created with default configuration")
  
  let task = session.dataTask(with: request) { data, response, error in
    fetcherLogger.debug("dataTask completed error=\(String(describing: error))")
    print("[Fetcher] dataTask completed error=\(String(describing: error))")
    if let error = error {
      fetcherLogger.error("Request failed with error: \(String(describing: error))")
      print("[Fetcher][Error] Request failed with error: \(String(describing: error))")
      completion(.failure(error))
      return
    }
    
    guard let httpResponse = response as? HTTPURLResponse else {
      fetcherLogger.error("InvalidResponse: Response was not HTTPURLResponse")
      print("[Fetcher][Error] InvalidResponse: Response was not HTTPURLResponse")
      return completion(.failure(NSError(domain: "InvalidResponse", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])))
    }
    
    fetcherLogger.debug("HTTP status=\(httpResponse.statusCode) headers=\(String(describing: httpResponse.allHeaderFields))")
    print("[Fetcher] HTTP status=\(httpResponse.statusCode) headers=\(String(describing: httpResponse.allHeaderFields))")
    if !(200...299).contains(httpResponse.statusCode) {
      let error = NSError(domain: "HTTPError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "HTTP Error: \(httpResponse.statusCode)"])
      
      if let data = data, let errorString = String(data: data, encoding: .utf8) {
        print("Error Response Body: \(errorString)")
        fetcherLogger.error("HTTP error body: \(errorString)")
        print("[Fetcher][Error] HTTP error body: \(errorString)")
      }
      
      fetcherLogger.error("Request failed with HTTP status \(httpResponse.statusCode)")
      print("[Fetcher][Error] Request failed with HTTP status \(httpResponse.statusCode)")
      return completion(.failure(error))
    }
    
    guard let data = data else {
      fetcherLogger.error("NoData: HTTP 2xx but data was nil")
      print("[Fetcher][Error] NoData: HTTP 2xx but data was nil")
      return completion(.failure(NSError(domain: "NoData", code: 0, userInfo: [NSLocalizedDescriptionKey: "No data received"])))
    }
    
    fetcherLogger.debug("Success response bytes=\(data.count)")
    print("[Fetcher] Success response bytes=\(data.count)")
    completion(.success(data))
  }
  
  fetcherLogger.debug("Starting dataTask for \(fullUrlString)")
  print("[Fetcher] Starting dataTask for \(fullUrlString)")
  task.resume()
}

func httpRequest<T: Decodable, K: Encodable>(params: FetchParams<K>) async throws -> T {
  try await withCheckedThrowingContinuation { continuation in
    fetch(params: params) { result in
      switch result {
      case .success(let data):
        do {
          let decoder = JSONDecoder()
          fetcherLogger.debug("Decoding response into \(String(describing: T.self))")
          print("[Fetcher] Decoding response into \(String(describing: T.self))")
          let decodedResult = try decoder.decode(T.self, from: data)
          
          fetcherLogger.debug("Decoded successfully into \(String(describing: T.self))")
          print("[Fetcher] Decoded successfully into \(String(describing: T.self))")
          continuation.resume(returning: decodedResult)
        } catch {
          let preview = String(data: data, encoding: .utf8) ?? "<non-utf8>"
          fetcherLogger.error("Decoding failed for \(String(describing: T.self)) error=\(String(describing: error)) preview=\(preview)")
          print("[Fetcher][Error] Decoding failed for \(String(describing: T.self)) error=\(String(describing: error)) preview=\(preview)")
          continuation.resume(throwing: error)
        }
      case .failure(let error):
        fetcherLogger.error("fetch failed error=\(String(describing: error))")
        print("[Fetcher][Error] fetch failed error=\(String(describing: error))")
        continuation.resume(throwing: error)
      }
    }
  }
}

func downloadAndSaveImage(from url: URL, name: String) async throws -> String? {
  try await withCheckedThrowingContinuation { continuation in
    fetcherLogger.debug("downloadAndSaveImage starting url=\(url.absoluteString) name=\(name)")
    print("[Fetcher] downloadAndSaveImage starting url=\(url.absoluteString) name=\(name)")
    let session = URLSession(configuration: .default)
    let task = session.dataTask(with: url) { data, response, error in
      guard let data = data, error == nil else {
        fetcherLogger.error("Image download failed error=\(String(describing: error))")
        print("[Fetcher][Error] Image download failed error=\(String(describing: error))")
        return continuation.resume(returning: nil)
      }
      
      guard let httpResponse = response as? HTTPURLResponse else {
        fetcherLogger.error("Image download invalid response")
        print("[Fetcher][Error] Image download invalid response")
        return continuation.resume(returning: nil)
      }
      
      if !(200...299).contains(httpResponse.statusCode) {
        fetcherLogger.error("Image download HTTP status=\(httpResponse.statusCode)")
        print("[Fetcher][Error] Image download HTTP status=\(httpResponse.statusCode)")
        return continuation.resume(returning: nil)
      }
      
      if let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupName) {
        let imageURL = containerURL.appendingPathComponent(name)
        do {
          try data.write(to: imageURL)
          fetcherLogger.debug("Saved image bytes=\(data.count) path=\(imageURL.path)")
          print("[Fetcher] Saved image bytes=\(data.count) path=\(imageURL.path)")
          continuation.resume(returning: imageURL.path)
        } catch {
          fetcherLogger.error("Failed to save image error=\(String(describing: error))")
          print("[Fetcher][Error] Failed to save image error=\(String(describing: error))")
          continuation.resume(returning: nil)
        }
      } else {
        fetcherLogger.error("FileManager.containerURL returned nil for app group \(appGroupName)")
        print("[Fetcher][Error] FileManager.containerURL returned nil for app group \(appGroupName)")
        continuation.resume(returning: nil)
      }
    }
    fetcherLogger.debug("Starting image download task")
    print("[Fetcher] Starting image download task")
    task.resume()
  }
}
