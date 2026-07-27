package com.franceisl.nurpismo;

import android.webkit.JavascriptInterface;

/**
 * Token-free OAuth surface. URL validation and trusted-main-document checks stay in the Activity.
 */
public final class AuthBridge {
    private final MainActivity activity;

    AuthBridge(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public String getRedirectUrl() {
        return AuthUrlPolicy.CALLBACK_URL;
    }

    @JavascriptInterface
    public void openAuthorizeUrl(String url) {
        activity.runOnUiThread(() -> activity.openAuthorizeUrlFromWeb(url));
    }
}
