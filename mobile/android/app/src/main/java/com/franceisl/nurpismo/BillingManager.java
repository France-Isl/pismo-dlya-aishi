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

    private static final String DEFAULT_PRICE = "€4.99";
    private static final String DEBUG_PREFS = "nur_billing_debug_only";
    private static final String DEBUG_MOCK_KEY = "mock_full_access";

    private final Activity activity;
    private final Listener listener;
    private final BillingClient billingClient;
    private final PurchaseVerifier verifier;
    private final PlayIntegrityProvider integrityProvider;
    private final SharedPreferences debugPreferences;
    private final List<Runnable> readyActions = new ArrayList<>();

    private volatile EntitlementState state = new EntitlementState(false, DEFAULT_PRICE, "initializing", false);
    private boolean connecting;
    private boolean firstResume = true;

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
        if (!(BuildConfig.DEBUG && BuildConfig.ALLOW_DEBUG_MOCK_ENTITLEMENT)) {
            ensureReady(() -> queryOwnedPurchases("resume_restore"));
        }
    }

    void purchaseFullAccess() {
        if (BuildConfig.DEBUG && BuildConfig.ALLOW_DEBUG_MOCK_ENTITLEMENT) {
            debugPreferences.edit().putBoolean(DEBUG_MOCK_KEY, true).apply();
            emit(true, DEFAULT_PRICE, "debug_mock_only_no_payment", true);
            return;
        }

        emit(false, state.priceLabel, "opening_google_play", false);
        ensureReady(() -> queryProduct((details, offer, error) -> {
            if (details == null || offer == null) {
                emit(false, state.priceLabel, error == null ? "product_unavailable" : error, false);
                return;
            }

            BillingFlowParams.ProductDetailsParams.Builder productParams =
                    BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details);
            String offerToken = offer.getOfferToken();
            if (offerToken != null && !offerToken.isBlank()) {
                productParams.setOfferToken(offerToken);
            }

            BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(productParams.build()))
                    .build();
            BillingResult result = billingClient.launchBillingFlow(activity, flowParams);
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                emit(false, offer.getFormattedPrice(), "billing_launch_" + result.getResponseCode(), false);
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
        emit(false, state.priceLabel, "restoring_purchases", false);
        ensureReady(() -> queryOwnedPurchases("manual_restore"));
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        int code = billingResult.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null) {
            processPurchases(purchases, "purchase_update");
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            emit(state.entitled, state.priceLabel, "purchase_canceled", state.mock);
        } else {
            emit(false, state.priceLabel, "purchase_update_" + code, false);
        }
    }

    private void ensureReady(Runnable action) {
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
                connecting = false;
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    readyActions.clear();
                    emit(false, state.priceLabel,
                            "billing_unavailable_" + billingResult.getResponseCode(), false);
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
                connecting = false;
                emit(false, state.priceLabel, "billing_disconnected", false);
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
                        // Prefer a permanent buy option, never a rental.
                        for (ProductDetails.OneTimePurchaseOfferDetails candidate : offers) {
                            if (candidate.getRentalDetails() == null) {
                                offer = candidate;
                                break;
                            }
                        }
                        if (offer == null) {
                            offer = offers.get(0);
                        }
                    }
                    if (offer == null) {
                        offer = details.getOneTimePurchaseOfferDetails();
                    }
                    callback.onResult(details, offer,
                            offer == null ? "no_eligible_full_access_offer" : null);
                });
    }

    private void queryOwnedPurchases(String source) {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build();
        billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                processPurchases(purchases, source);
            } else {
                emit(false, state.priceLabel,
                        "restore_failed_" + billingResult.getResponseCode(), false);
            }
        });
    }

    private void processPurchases(List<Purchase> purchases, String source) {
        Purchase fullAccessPurchase = null;
        for (Purchase purchase : purchases) {
            if (purchase.getProducts().contains(BuildConfig.FULL_ACCESS_PRODUCT_ID)) {
                fullAccessPurchase = purchase;
                break;
            }
        }
        if (fullAccessPurchase == null) {
            emit(false, state.priceLabel, source + "_not_owned", false);
            return;
        }
        if (fullAccessPurchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            emit(false, state.priceLabel, "purchase_pending", false);
            return;
        }
        if (fullAccessPurchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) {
            emit(false, state.priceLabel, "purchase_not_completed", false);
            return;
        }

        emit(false, state.priceLabel, "verifying_purchase", false);
        verifier.verify(fullAccessPurchase, result -> {
            // Fail closed: both server verification and acknowledgement are required.
            if (result.verified && result.acknowledged && result.integrityVerified) {
                emit(true, state.priceLabel, result.reason, false);
            } else if (result.verified && result.acknowledged) {
                emit(false, state.priceLabel, "server_did_not_verify_integrity", false);
            } else if (result.verified) {
                emit(false, state.priceLabel, "server_did_not_acknowledge", false);
            } else {
                emit(false, state.priceLabel, result.reason, false);
            }
        });
    }

    private void emit(boolean entitled, String priceLabel, String reason, boolean mock) {
        EntitlementState next = new EntitlementState(
                entitled,
                priceLabel == null || priceLabel.isBlank() ? DEFAULT_PRICE : priceLabel,
                reason == null ? "unknown" : reason,
                mock
        );
        state = next;
        activity.runOnUiThread(() -> listener.onEntitlementChanged(next));
    }

    String getEntitlementJson() {
        try {
            return new JSONObject()
                    .put("entitled", state.entitled)
                    .put("priceLabel", state.priceLabel)
                    .put("reason", state.reason)
                    .put("productId", BuildConfig.FULL_ACCESS_PRODUCT_ID)
                    .put("freeLetterLimit", BuildConfig.FREE_LETTER_LIMIT)
                    .put("mock", state.mock)
                    .toString();
        } catch (Exception ignored) {
            return "{\"entitled\":false,\"priceLabel\":\"€4.99\",\"reason\":\"serialization_error\"}";
        }
    }

    EntitlementState getState() {
        return state;
    }

    void notifyWebState() {
        listener.onEntitlementChanged(state);
    }

    void close() {
        readyActions.clear();
        verifier.close();
        if (billingClient.isReady()) {
            billingClient.endConnection();
        }
    }
}
