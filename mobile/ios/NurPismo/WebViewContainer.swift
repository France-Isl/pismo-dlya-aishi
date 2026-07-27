import AuthenticationServices
import SwiftUI
import WebKit

struct WebViewContainer: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let controller = WKUserContentController()
        controller.add(context.coordinator, name: "nurBilling")
        controller.add(context.coordinator, name: "nurAuth")
        controller.addUserScript(WKUserScript(
            source: Coordinator.billingBootstrap,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
        controller.addUserScript(WKUserScript(
            source: Coordinator.authBootstrap,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = controller
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = [.audio]
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 23 / 255, green: 23 / 255, blue: 34 / 255, alpha: 1)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        if #available(iOS 16.4, *) {
            #if DEBUG
            webView.isInspectable = true
            #endif
        }
        context.coordinator.webView = webView

        guard let webRoot = Bundle.main.resourceURL?.appendingPathComponent("WebResources", isDirectory: true),
              let index = Bundle.main.url(
                forResource: "index",
                withExtension: "html",
                subdirectory: "WebResources"
              ) else {
            webView.loadHTMLString(
                "<meta name='viewport' content='width=device-width'><body style='background:#171722;color:#fff7e8;font-family:-apple-system;padding:32px'>WebResources/index.html не найден. Запустите sync_web_assets.py.</body>",
                baseURL: nil
            )
            return webView
        }

        webView.loadFileURL(index, allowingReadAccessTo: webRoot)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "nurBilling")
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "nurAuth")
        uiView.stopLoading()
        coordinator.cancelAuthentication()
        coordinator.webView = nil
    }

    final class Coordinator: NSObject,
                             WKNavigationDelegate,
                             WKUIDelegate,
                             WKScriptMessageHandler,
                             ASWebAuthenticationPresentationContextProviding {
        weak var webView: WKWebView?
        private var authSession: ASWebAuthenticationSession?
        private var trustedMainDocumentReady = false
        private var pendingAuthCallbackURL: URL?

        static let billingBootstrap = """
        (function () {
          const state = { entitled: false, priceLabel: '€7.99', reason: 'storekit2_not_configured', productId: 'full_access', freeLetterLimit: 10, purchaseConfigured: false, mock: false };
          window.NurBilling = Object.freeze({
            getEntitlement: function () { return JSON.stringify(state); },
            purchaseFullAccess: function () { window.webkit.messageHandlers.nurBilling.postMessage({ action: 'purchaseFullAccess' }); },
            restorePurchases: function () { window.webkit.messageHandlers.nurBilling.postMessage({ action: 'restorePurchases' }); }
          });
        })();
        """

        static let authBootstrap = """
        (function () {
          const bridge = Object.freeze({
            getRedirectUrl: function () { return '\(OAuthURLPolicy.callbackURLString)'; },
            openAuthorizeUrl: function (url) {
              window.webkit.messageHandlers.nurAuth.postMessage({ action: 'openAuthorizeUrl', url: String(url) });
            }
          });
          Object.defineProperty(window, 'NurAuth', { value: bridge, configurable: false, writable: false });
        })();
        """

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            trustedMainDocumentReady = false
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            trustedMainDocumentReady = isTrustedMainDocumentURL(webView.url)
            sendUnavailable(reason: "storekit2_not_configured")
            dispatchPendingAuthCallback()
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            if navigationAction.navigationType == .linkActivated,
               let url = navigationAction.request.url,
               let scheme = url.scheme?.lowercased(),
               scheme == "https" || scheme == "http" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.frameInfo.isMainFrame,
                  isTrustedMainDocumentURL(message.frameInfo.request.url),
                  let body = message.body as? [String: Any],
                  let action = body["action"] as? String else { return }

            switch message.name {
            case "nurBilling":
                switch action {
                case "purchaseFullAccess":
                    sendUnavailable(reason: "storekit2_purchase_not_configured")
                case "restorePurchases":
                    sendUnavailable(reason: "storekit2_restore_not_configured")
                default:
                    sendUnavailable(reason: "storekit2_unknown_action")
                }
            case "nurAuth":
                guard action == "openAuthorizeUrl",
                      let rawURL = body["url"] as? String,
                      let url = URL(string: rawURL),
                      OAuthURLPolicy.isAllowedAuthorizeURL(url) else { return }
                beginAuthentication(at: url)
            default:
                return
            }
        }

        func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
            if let window = webView?.window {
                return window
            }
            for case let scene as UIWindowScene in UIApplication.shared.connectedScenes {
                if let window = scene.windows.first(where: { $0.isKeyWindow }) {
                    return window
                }
            }
            return ASPresentationAnchor()
        }

        func cancelAuthentication() {
            authSession?.cancel()
            authSession = nil
        }

        private func beginAuthentication(at url: URL) {
            guard trustedMainDocumentReady,
                  isTrustedMainDocumentURL(webView?.url),
                  OAuthURLPolicy.isAllowedAuthorizeURL(url) else { return }

            cancelAuthentication()
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: OAuthURLPolicy.callbackScheme
            ) { [weak self] callbackURL, _ in
                DispatchQueue.main.async {
                    guard let self else { return }
                    self.authSession = nil
                    guard let callbackURL,
                          OAuthURLPolicy.isAllowedCallbackURL(callbackURL) else { return }
                    self.pendingAuthCallbackURL = callbackURL
                    self.dispatchPendingAuthCallback()
                }
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            authSession = session
            if !session.start() {
                authSession = nil
            }
        }

        private func dispatchPendingAuthCallback() {
            guard let webView,
                  let callbackURL = pendingAuthCallbackURL,
                  trustedMainDocumentReady,
                  isTrustedMainDocumentURL(webView.url),
                  OAuthURLPolicy.isAllowedCallbackURL(callbackURL) else { return }

            let callback = Self.jsonString(callbackURL.absoluteString)
            let script = """
            (function(){
              var u=\(callback);
              if(typeof window.onNativeAuthCallback==='function'){window.onNativeAuthCallback(u);}
              else{window.__nurPendingAuthCallback=u;}
              window.dispatchEvent(new CustomEvent('nur-auth-callback',{detail:{url:u}}));
            })();
            """
            pendingAuthCallbackURL = nil
            webView.evaluateJavaScript(script)
        }

        private func isTrustedMainDocumentURL(_ url: URL?) -> Bool {
            guard let url,
                  url.isFileURL,
                  url.query == nil,
                  url.fragment == nil,
                  let trusted = Bundle.main.url(
                    forResource: "index",
                    withExtension: "html",
                    subdirectory: "WebResources"
                  ) else { return false }
            return url.standardizedFileURL.path == trusted.standardizedFileURL.path
        }

        private func sendUnavailable(reason: String) {
            guard let webView else { return }
            let encodedReason = Self.jsonString(reason)
            let script = "if(typeof window.onNativeEntitlement==='function'){window.onNativeEntitlement(false,'€7.99',\(encodedReason));}"
            webView.evaluateJavaScript(script)
        }

        private static func jsonString(_ value: String) -> String {
            guard let data = try? JSONSerialization.data(withJSONObject: [value]),
                  let array = String(data: data, encoding: .utf8) else { return "\"unknown\"" }
            return String(array.dropFirst().dropLast())
        }
    }
}
