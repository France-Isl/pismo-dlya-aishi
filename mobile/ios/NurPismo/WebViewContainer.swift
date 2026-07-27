import SwiftUI
import WebKit

struct WebViewContainer: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let controller = WKUserContentController()
        controller.add(context.coordinator, name: "nurBilling")
        controller.addUserScript(WKUserScript(
            source: Coordinator.billingBootstrap,
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
        uiView.stopLoading()
        coordinator.webView = nil
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        weak var webView: WKWebView?

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

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            sendUnavailable(reason: "storekit2_not_configured")
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
            guard message.name == "nurBilling",
                  let body = message.body as? [String: Any],
                  let action = body["action"] as? String else { return }
            switch action {
            case "purchaseFullAccess":
                sendUnavailable(reason: "storekit2_purchase_not_configured")
            case "restorePurchases":
                sendUnavailable(reason: "storekit2_restore_not_configured")
            default:
                sendUnavailable(reason: "storekit2_unknown_action")
            }
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
