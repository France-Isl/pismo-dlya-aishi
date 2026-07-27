import Foundation

enum OAuthURLPolicy {
    static let supabaseHost = "xzzngrquomyiglktroqi.supabase.co"
    static let authorizePath = "/auth/v1/authorize"
    static let callbackScheme = "com.franceisl.nurpismo"
    static let callbackHost = "auth"
    static let callbackPath = "/callback"
    static let callbackURLString = "\(callbackScheme)://\(callbackHost)\(callbackPath)"
    private static let callbackSingletonParameters: Set<String> = [
        "code",
        "error",
        "error_code",
        "error_description",
        "state",
        "access_token",
        "refresh_token",
        "provider_token",
        "provider_refresh_token"
    ]

    static func isAllowedAuthorizeURL(_ url: URL) -> Bool {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return false
        }
        guard components.scheme?.lowercased() == "https"
            && hasExactAuthority(components, host: supabaseHost)
            && components.percentEncodedPath == authorizePath
            && components.fragment == nil,
              let items = safeQueryItems(components),
              let provider = singleValue(named: "provider", in: items),
              let redirect = singleValue(named: "redirect_to", in: items),
              let challenge = singleValue(named: "code_challenge", in: items),
              let method = singleValue(named: "code_challenge_method", in: items) else {
            return false
        }
        return (provider == "google" || provider == "facebook")
            && redirect == callbackURLString
            && isValidPKCEChallenge(challenge)
            && method.lowercased() == "s256"
    }

    static func isAllowedCallbackURL(_ url: URL) -> Bool {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return false
        }
        guard components.scheme?.lowercased() == callbackScheme
            && hasExactAuthority(components, host: callbackHost)
            && components.percentEncodedPath == callbackPath
            && components.fragment == nil,
              let items = safeQueryItems(components) else {
            return false
        }
        let counts = Dictionary(grouping: items, by: { $0.name }).mapValues { $0.count }
        return callbackSingletonParameters.allSatisfy { (counts[$0] ?? 0) <= 1 }
    }

    private static func hasExactAuthority(_ components: URLComponents, host: String) -> Bool {
        components.host?.lowercased() == host
            && components.user == nil
            && components.password == nil
            && components.port == nil
    }

    private static func safeQueryItems(_ components: URLComponents) -> [URLQueryItem]? {
        guard components.percentEncodedQuery != nil else { return [] }
        guard let items = components.queryItems else { return nil }
        for item in items {
            guard !item.name.isEmpty,
                  !containsControlCharacter(item.name),
                  !containsControlCharacter(item.value ?? "") else {
                return nil
            }
        }
        return items
    }

    private static func singleValue(named name: String, in items: [URLQueryItem]) -> String? {
        let matches = items.filter { $0.name == name }
        guard matches.count == 1, let value = matches[0].value else { return nil }
        return value
    }

    private static func isValidPKCEChallenge(_ value: String) -> Bool {
        guard (43...128).contains(value.count) else { return false }
        return value.unicodeScalars.allSatisfy { scalar in
            switch scalar.value {
            case 45, 48...57, 65...90, 95, 97...122:
                return true
            default:
                return false
            }
        }
    }

    private static func containsControlCharacter(_ value: String) -> Bool {
        value.unicodeScalars.contains { $0.value < 0x20 || $0.value == 0x7f }
    }
}
