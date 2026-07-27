package com.franceisl.nurpismo;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryProductDetailsResult;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

final class BillingManager implements PurchasesUpdatedListener {
    interface Listener {
        void onEntitlementChanged(EntitlementState state);
    }

    static final class EntitlementState {
        final boolean entitled;
        final String priceLabel;
        final String reason;
        final boolean mock;

        EntitlementState(boolean entitled, String priceLabel, String reason, boolean mock) {
            this.entitled = entitled;
            this.priceLabel = priceLabel;
            this.reason = reason;
            this.mock = mock;
        }
    }

    private interface ProductCallback {
        void onResult(ProductDetails details, ProductDetails.OneTimePurchaseOfferDetails offer, String error);
    }

    private static final String DEFAULT_PRICE = "€7.99";
    private static final String DEBUG_PREFS = "nur_billing_debug_only";
    private static final String DEBUG_MOCK_KEY = "mock_full_access";

    private final Activity activity;
    private final Listener listener;
    private final BillingClient billingClient;
    private final PurchaseVerifier verifier;
    private final PlayIntegrityProvider integrityProvider;
    private final SharedPreferences debugPreferences;
    private final EntitlementCoordinator entitlementCoordinator = new EntitlementCoordinator();
    private final List<Runnable> readyActions = new ArrayList<>();

    private volatile EntitlementState state = new EntitlementState(false, DEFAULT_PRICE, "initializing", false);
    private boolean connecting;
    private boolean firstResume = true;
    private boolean purchaseFlowInProgress;
    private boolean closed;

    BillingManager(Activity activity, Listener listener) {
        this.activity = activity;
        this.listener = listener;
        this.debugPreferences = activity.getSharedPreferences(DEBUG_PREFS, Context.MODE_PRIVATE);
        this.integrityProvider = new PlayIntegrityProvider(
                activity,
                BuildConfig.PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER
        );
        this.verifier = new PurchaseVerifier(BuildConfig.PURCHASE_VERIFICATION_URL, integrityProvider);
        this.billingClient = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases(
                        PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
                )
                .enableAutoServiceReconnection()
                .build();
    }

    void start() {
        if (BuildConfig.DEBUG && BuildConfig.ALLOW_DEBUG_MOCK_ENTITLEMENT) {
            boolean mockOwned = debugPreferences.getBoolean(DEBUG_MOCK_KEY, false);
            emit(mockOwned, DEFAULT_PRICE,
                    mockOwned ? "debug_mock_restored_no_payment" : "debug_mock_available_no_payment",
                    mockOwned);
            return;
        }
        if (!isPurchaseSecurityConfigured()) {
            emit(false, DEFAULT_PRICE, "billing_security_not_configured", false);
            return;
        }
        integrityProvider.warmUp();
        ensureReady(() -> {
            queryProduct((details, offer, error) -> {
                if (details != null && offer != null) {
                    emit(state.entitled, offer.getFormattedPrice(), state.reason, state.mock);
                }
            });
            queryOwnedPurchases("startup_restore");
        });
    }

    void onResume() {
        // onCreate/start is immediately followed by the Activity's first
        // onResume. Avoid issuing the same catalog/purchase verification twice.
        if (firstResume) {
            firstResume = false;
            return;
        }
        if (!(BuildConfig.DEBUG && BuildConfig.ALLOW_DEBUG_MOCK_ENTITLEMENT)
                && isPurchaseSecurityConfigured()
                && !purchaseFlowInProgress
                && !entitlementCoordinator.hasVerificationInFlight()) {
            ensureReady(() -> queryOwnedPurchases("resume_restore"));
        }
    }

    void purchaseFullAccess() {
        if (BuildConfig.DEBUG && BuildConfig.ALLOW_DEBUG_MOCK_ENTITLEMENT) {
            debugPreferences.edit().putBoolean(DEBUG_MOCK_KEY, true).apply();
            emit(true, DEFAULT_PRICE, "debug_mock_only_no_payment", true);
            return;
        }
        if (!isPurchaseSecurityConfigured()) {
            emitTransient("billing_security_not_configured");
            return;
        }

        emitTransient("opening_google_play");
        ensureReady(() -> queryProduct((details, offer, error) -> {
            if (details == null || offer == null) {
                emitTransient(error == null ? "product_unavailable" : error);
                return;
            }

            BillingFlowParams.ProductDetailsParams.Builder productParams =
                    BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details);
            String offerToken = offer.getOfferToken();
            if (offerToken != null && !offerToken.trim().isEmpty()) {
                productParams.setOfferToken(offerToken);
            }

            BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(productParams.build()))
                    .build();
            purchaseFlowInProgress = true;
            BillingResult result = billingClient.launchBillingFlow(activity, flowParams);
            int responseCode = result.getResponseCode();
            if (responseCode == BillingClient.BillingResponseCode.OK) {
                return;
            }
            purchaseFlowInProgress = false;
            if (responseCode == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
                queryOwnedPurchases("launch_already_owned_restore");
            } else {
                emitTransient(offer.getFormattedPrice(), "billing_launch_" + responseCode);
            }
        }));
    }

    void restorePurchases() {
        if (BuildConfig.DEBUG && BuildConfig.ALLOW_DEBUG_MOCK_ENTITLEMENT) {
            boolean mockOwned = debugPreferences.getBoolean(DEBUG_MOCK_KEY, false);
            emit(mockOwned, DEFAULT_PRICE,
                    mockOwned ? "debug_mock_restored_no_payment" : "debug_mock_not_owned",
                    mockOwned);
            return;
        }
        if (!isPurchaseSecurityConfigured()) {
            emitTransient("billing_security_not_configured");
            return;
        }
        purchaseFlowInProgress = false;
        emitTransient("restoring_purchases");
        ensureReady(() -> queryOwnedPurchases("manual_restore"));
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (closed) {
            return;
        }
        purchaseFlowInProgress = false;
        int code = billingResult.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null) {
            long generation = entitlementCoordinator.beginOperation();
            processPurchases(purchases, "purchase_update", generation);
        } else if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            queryOwnedPurchases("callback_already_owned_restore");
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            emitTransient("purchase_canceled");
        } else {
            emitTransient("purchase_update_" + code);
        }
    }

    private void ensureReady(Runnable action) {
        if (closed) {
            return;
        }
        if (billingClient.isReady()) {
            action.run();
            return;
        }
        readyActions.add(action);
        if (connecting) {
            return;
        }
        connecting = true;
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (closed) {
                    return;
                }
                connecting = false;
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    readyActions.clear();
                    emitTransient("billing_unavailable_" + billingResult.getResponseCode());
                    return;
                }
                List<Runnable> pending = new ArrayList<>(readyActions);
                readyActions.clear();
                for (Runnable runnable : pending) {
                    runnable.run();
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                if (closed) {
                    return;
                }
                connecting = false;
                emitTransient("billing_disconnected");
            }
        });
    }

    private void queryProduct(ProductCallback callback) {
        QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
                .setProductId(BuildConfig.FULL_ACCESS_PRODUCT_ID)
                .setProductType(BillingClient.ProductType.INAPP)
                .build();
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(product))
                .build();

        billingClient.queryProductDetailsAsync(params,
                (BillingResult billingResult, QueryProductDetailsResult result) -> {
                    if (closed) {
                        return;
                    }
                    if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                        callback.onResult(null, null,
                                "product_query_" + billingResult.getResponseCode());
                        return;
                    }
                    ProductDetails details = null;
                    for (ProductDetails candidate : result.getProductDetailsList()) {
                        if (BuildConfig.FULL_ACCESS_PRODUCT_ID.equals(candidate.getProductId())) {
                            details = candidate;
                            break;
                        }
                    }
                    if (details == null) {
                        callback.onResult(null, null, "product_not_configured_in_play_console");
                        return;
                    }

                    ProductDetails.OneTimePurchaseOfferDetails offer = null;
                    List<ProductDetails.OneTimePurchaseOfferDetails> offers =
                            details.getOneTimePurchaseOfferDetailsList();
                    if (offers != null && !offers.isEmpty()) {
                        // A permanent entitlement must never fall back to a
                        // rental offer, even if the Play catalog is misconfigured.
                        for (ProductDetails.OneTimePurchaseOfferDetails candidate : offers) {
                            if (candidate.getRentalDetails() == null) {
                                offer = candidate;
                                break;
                            }
                        }
                    }
                    if (offer == null) {
                        ProductDetails.OneTimePurchaseOfferDetails legacyOffer =
                                details.getOneTimePurchaseOfferDetails();
                        if (legacyOffer != null && legacyOffer.getRentalDetails() == null) {
                            offer = legacyOffer;
                        }
                    }
                    callback.onResult(details, offer,
                            offer == null ? "no_eligible_full_access_offer" : null);
                });
    }

    private void queryOwnedPurchases(String source) {
        if (closed) {
            return;
        }
        if (!isPurchaseSecurityConfigured()) {
            emitTransient("billing_security_not_configured");
            return;
        }
        if (purchaseFlowInProgress || entitlementCoordinator.hasVerificationInFlight()) {
            return;
        }
        long generation = entitlementCoordinator.beginOperation();
        if (generation < 0L) {
            return;
        }
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build();
        billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
            if (closed || !entitlementCoordinator.isCurrent(generation)) {
                return;
            }
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                processPurchases(purchases, source, generation);
            } else {
                emitTransient("restore_failed_" + billingResult.getResponseCode());
            }
        });
    }

    private void processPurchases(List<Purchase> purchases, String source, long generation) {
        if (closed || !entitlementCoordinator.isCurrent(generation)) {
            return;
        }
        Purchase fullAccessPurchase = null;
        for (Purchase purchase : purchases) {
            if (purchase.getProducts().contains(BuildConfig.FULL_ACCESS_PRODUCT_ID)) {
                fullAccessPurchase = purchase;
                break;
            }
        }
        if (fullAccessPurchase == null) {
            entitlementCoordinator.invalidateVerification();
            emit(false, state.priceLabel, source + "_not_owned", false);
            return;
        }
        if (fullAccessPurchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            emitTransient("purchase_pending");
            return;
        }
        if (fullAccessPurchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) {
            entitlementCoordinator.invalidateVerification();
            emit(false, state.priceLabel, "purchase_not_completed", false);
            return;
        }

        String purchaseToken = fullAccessPurchase.getPurchaseToken();
        EntitlementCoordinator.VerificationAction verificationAction =
                entitlementCoordinator.beginVerification(purchaseToken, generation);
        if (verificationAction == EntitlementCoordinator.VerificationAction.STALE) {
            return;
        }
        emitTransient("verifying_purchase");
        if (verificationAction == EntitlementCoordinator.VerificationAction.COALESCED) {
            return;
        }
        verifier.verify(fullAccessPurchase, result -> {
            if (closed || !entitlementCoordinator.completeVerification(purchaseToken)) {
                return;
            }
            // Fail closed: both server verification and acknowledgement are required.
            if (result.verified && result.acknowledged && result.integrityVerified) {
                emit(true, state.priceLabel, result.reason, false);
            } else if (result.authoritativeRejection) {
                emit(false, state.priceLabel, result.reason, false);
            } else if (result.verified && result.acknowledged) {
                emitTransient("server_did_not_verify_integrity");
            } else if (result.verified) {
                emitTransient("server_did_not_acknowledge");
            } else {
                emitTransient(result.reason);
            }
        });
    }

    private void emitTransient(String reason) {
        emit(state.entitled, state.priceLabel, reason, state.mock);
    }

    private void emitTransient(String priceLabel, String reason) {
        emit(state.entitled, priceLabel, reason, state.mock);
    }

    private void emit(boolean entitled, String priceLabel, String reason, boolean mock) {
        if (closed) {
            return;
        }
        EntitlementState next = new EntitlementState(
                entitled,
                priceLabel == null || priceLabel.trim().isEmpty() ? DEFAULT_PRICE : priceLabel,
                reason == null ? "unknown" : reason,
                mock
        );
        state = next;
        activity.runOnUiThread(() -> {
            if (!closed && state == next) {
                listener.onEntitlementChanged(next);
            }
        });
    }

    String getEntitlementJson() {
        try {
            return new JSONObject()
                    .put("entitled", state.entitled)
                    .put("priceLabel", state.priceLabel)
                    .put("reason", state.reason)
                    .put("productId", BuildConfig.FULL_ACCESS_PRODUCT_ID)
                    .put("freeLetterLimit", BuildConfig.FREE_LETTER_LIMIT)
                    .put("purchaseConfigured", isPurchaseSecurityConfigured())
                    .put("mock", state.mock)
                    .toString();
        } catch (Exception ignored) {
            return "{\"entitled\":false,\"priceLabel\":\"€7.99\",\"reason\":\"serialization_error\"}";
        }
    }

    EntitlementState getState() {
        return state;
    }

    void notifyWebState() {
        if (!closed) {
            listener.onEntitlementChanged(state);
        }
    }

    void close() {
        if (closed) {
            return;
        }
        closed = true;
        purchaseFlowInProgress = false;
        entitlementCoordinator.close();
        readyActions.clear();
        verifier.close();
        if (billingClient.isReady()) {
            billingClient.endConnection();
        }
    }

    boolean isPurchaseSecurityConfigured() {
        if (BuildConfig.DEBUG && BuildConfig.ALLOW_DEBUG_MOCK_ENTITLEMENT) {
            return true;
        }
        return verifier.isConfigured() && integrityProvider.isConfigured();
    }
}
