package com.franceisl.nurpismo;

import android.webkit.JavascriptInterface;

/** Minimal, token-free surface exposed only to the bundled trusted web app. */
public final class BillingBridge {
    private final MainActivity activity;
    private final BillingManager billingManager;

    BillingBridge(MainActivity activity, BillingManager billingManager) {
        this.activity = activity;
        this.billingManager = billingManager;
    }

    @JavascriptInterface
    public String getEntitlement() {
        return billingManager.getEntitlementJson();
    }

    @JavascriptInterface
    public void purchaseFullAccess() {
        activity.runOnUiThread(billingManager::purchaseFullAccess);
    }

    @JavascriptInterface
    public void restorePurchases() {
        activity.runOnUiThread(billingManager::restorePurchases);
    }
}

