package com.franceisl.nurpismo;

import android.content.Context;

import com.google.android.play.core.integrity.IntegrityManagerFactory;
import com.google.android.play.core.integrity.StandardIntegrityManager;

import java.util.ArrayList;
import java.util.List;

/** Provides request-bound Standard Play Integrity tokens without exposing them to WebView. */
final class PlayIntegrityProvider {
    interface TokenCallback {
        void onResult(String token, String errorReason);
    }

    private static final class PendingRequest {
        final String requestHash;
        final TokenCallback callback;

        PendingRequest(String requestHash, TokenCallback callback) {
            this.requestHash = requestHash;
            this.callback = callback;
        }
    }

    private final StandardIntegrityManager manager;
    private final long cloudProjectNumber;
    private final List<PendingRequest> pendingRequests = new ArrayList<>();

    private StandardIntegrityManager.StandardIntegrityTokenProvider tokenProvider;
    private boolean preparing;

    PlayIntegrityProvider(Context context, long cloudProjectNumber) {
        this.manager = IntegrityManagerFactory.createStandard(context.getApplicationContext());
        this.cloudProjectNumber = cloudProjectNumber;
    }

    void warmUp() {
        if (cloudProjectNumber > 0) {
            prepareIfNeeded();
        }
    }

    void requestToken(String requestHash, TokenCallback callback) {
        if (cloudProjectNumber <= 0) {
            callback.onResult(null, "play_integrity_cloud_project_not_configured");
            return;
        }

        StandardIntegrityManager.StandardIntegrityTokenProvider readyProvider;
        synchronized (this) {
            readyProvider = tokenProvider;
            if (readyProvider == null) {
                pendingRequests.add(new PendingRequest(requestHash, callback));
            }
        }
        if (readyProvider != null) {
            requestWithProvider(readyProvider, requestHash, callback);
        } else {
            prepareIfNeeded();
        }
    }

    private void prepareIfNeeded() {
        synchronized (this) {
            if (preparing || tokenProvider != null || cloudProjectNumber <= 0) {
                return;
            }
            preparing = true;
        }

        StandardIntegrityManager.PrepareIntegrityTokenRequest request =
                StandardIntegrityManager.PrepareIntegrityTokenRequest.builder()
                        .setCloudProjectNumber(cloudProjectNumber)
                        .build();
        manager.prepareIntegrityToken(request)
                .addOnSuccessListener(provider -> {
                    List<PendingRequest> pending;
                    synchronized (this) {
                        tokenProvider = provider;
                        preparing = false;
                        pending = new ArrayList<>(pendingRequests);
                        pendingRequests.clear();
                    }
                    for (PendingRequest item : pending) {
                        requestWithProvider(provider, item.requestHash, item.callback);
                    }
                })
                .addOnFailureListener(exception -> {
                    List<PendingRequest> pending;
                    synchronized (this) {
                        preparing = false;
                        tokenProvider = null;
                        pending = new ArrayList<>(pendingRequests);
                        pendingRequests.clear();
                    }
                    for (PendingRequest item : pending) {
                        item.callback.onResult(null, "play_integrity_prepare_failed");
                    }
                });
    }

    private void requestWithProvider(
            StandardIntegrityManager.StandardIntegrityTokenProvider provider,
            String requestHash,
            TokenCallback callback
    ) {
        StandardIntegrityManager.StandardIntegrityTokenRequest request =
                StandardIntegrityManager.StandardIntegrityTokenRequest.builder()
                        .setRequestHash(requestHash)
                        .build();
        provider.request(request)
                .addOnSuccessListener(response -> callback.onResult(response.token(), null))
                .addOnFailureListener(exception -> {
                    // A provider can expire or become invalid. Re-warm on the next attempt.
                    synchronized (this) {
                        if (tokenProvider == provider) {
                            tokenProvider = null;
                        }
                    }
                    callback.onResult(null, "play_integrity_token_failed");
                });
    }
}
