package com.franceisl.nurpismo;

import android.os.Handler;
import android.os.Looper;
import android.util.Base64;

import com.android.billingclient.api.Purchase;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.net.ssl.HttpsURLConnection;

/**
 * Production verification hook. The app never embeds Play Console credentials.
 * A trusted backend must validate the purchase token with Google Play and
 * acknowledge the non-consumable before returning an entitlement.
 */
final class PurchaseVerifier {
    interface Callback {
        void onResult(Result result);
    }

    static final class Result {
        final boolean verified;
        final boolean acknowledged;
        final boolean integrityVerified;
        final boolean authoritativeRejection;
        final String reason;

        Result(
                boolean verified,
                boolean acknowledged,
                boolean integrityVerified,
                boolean authoritativeRejection,
                String reason
        ) {
            this.verified = verified;
            this.acknowledged = acknowledged;
            this.integrityVerified = integrityVerified;
            this.authoritativeRejection = authoritativeRejection;
            this.reason = reason;
        }

        static Result failure(String reason) {
            return new Result(false, false, false, false, reason);
        }

        static Result rejection(String reason) {
            return new Result(false, false, false, true, reason);
        }
    }

    private final String endpoint;
    private final PlayIntegrityProvider integrityProvider;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final AtomicBoolean closed = new AtomicBoolean(false);

    PurchaseVerifier(String endpoint, PlayIntegrityProvider integrityProvider) {
        this.endpoint = endpoint == null ? "" : endpoint.trim();
        this.integrityProvider = integrityProvider;
    }

    boolean isConfigured() {
        try {
            URL url = new URL(endpoint);
            return "https".equalsIgnoreCase(url.getProtocol())
                    && url.getHost() != null
                    && !url.getHost().trim().isEmpty();
        } catch (Exception ignored) {
            return false;
        }
    }

    void verify(Purchase purchase, Callback callback) {
        if (closed.get()) {
            return;
        }
        if (!isConfigured()) {
            callback.onResult(Result.failure("verification_backend_not_configured"));
            return;
        }

        final String requestHash;
        try {
            requestHash = requestHashFor(purchase);
        } catch (Exception ignored) {
            callback.onResult(Result.failure("request_hash_failed"));
            return;
        }

        integrityProvider.requestToken(requestHash, (integrityToken, integrityError) -> {
            if (closed.get()) {
                return;
            }
            if (integrityToken == null || integrityToken.trim().isEmpty()) {
                callback.onResult(Result.failure(
                        integrityError == null ? "play_integrity_token_missing" : integrityError
                ));
                return;
            }
            try {
                executor.execute(() -> {
                    if (closed.get()) {
                        return;
                    }
                    Result result;
                    try {
                        result = verifyBlocking(purchase, requestHash, integrityToken);
                    } catch (Exception ignored) {
                        // Never log or expose purchaseToken or Integrity token in an exception.
                        result = Result.failure("verification_network_error");
                    }
                    Result finalResult = result;
                    if (!closed.get()) {
                        mainHandler.post(() -> {
                            if (!closed.get()) {
                                callback.onResult(finalResult);
                            }
                        });
                    }
                });
            } catch (RejectedExecutionException ignored) {
                // Activity teardown won the race; no UI callback is valid now.
            }
        });
    }

    private Result verifyBlocking(
            Purchase purchase,
            String requestHash,
            String integrityToken
    ) throws Exception {
        JSONObject request = new JSONObject()
                .put("packageName", releasePackageName())
                .put("productId", BuildConfig.FULL_ACCESS_PRODUCT_ID)
                .put("purchaseToken", purchase.getPurchaseToken())
                .put("purchaseState", purchase.getPurchaseState())
                .put("acknowledgedOnDevice", purchase.isAcknowledged())
                .put("appVersion", BuildConfig.VERSION_NAME)
                .put("requestHashVersion", "v1")
                .put("requestHash", requestHash)
                .put("integrityToken", integrityToken);

        HttpsURLConnection connection = (HttpsURLConnection) new URL(endpoint).openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(10_000);
        connection.setReadTimeout(15_000);
        connection.setDoOutput(true);
        connection.setInstanceFollowRedirects(false);
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty("X-NurPismo-Client", "android");

        byte[] body = request.toString().getBytes(StandardCharsets.UTF_8);
        connection.setFixedLengthStreamingMode(body.length);
        try (OutputStream output = connection.getOutputStream()) {
            output.write(body);
        }

        int status = connection.getResponseCode();
        if (status < 200 || status >= 300) {
            connection.disconnect();
            String reason = "verification_rejected_" + status;
            return isAuthoritativeRejectionStatus(status)
                    ? Result.rejection(reason)
                    : Result.failure(reason);
        }

        String responseText;
        try (InputStream input = connection.getInputStream()) {
            responseText = readLimited(input, 64 * 1024);
        } finally {
            connection.disconnect();
        }

        JSONObject response = new JSONObject(responseText);
        boolean valid = response.optBoolean("valid", false);
        boolean acknowledged = response.optBoolean("acknowledged", false);
        boolean integrityVerified = response.optBoolean("integrityVerified", false);
        String responseProduct = response.optString("productId", "");
        String responseRequestHash = response.optString("requestHash", "");
        String reason = response.optString("reason", valid ? "server_verified" : "server_rejected");

        if (!BuildConfig.FULL_ACCESS_PRODUCT_ID.equals(responseProduct)) {
            return Result.rejection("verification_product_mismatch");
        }
        if (!requestHash.equals(responseRequestHash)) {
            return Result.rejection("verification_request_hash_mismatch");
        }
        return new Result(valid, acknowledged, integrityVerified, !valid, reason);
    }

    static boolean isAuthoritativeRejectionStatus(int status) {
        return status == 400
                || status == 403
                || status == 404
                || status == 410
                || status == 422;
    }

    /**
     * Version v1 canonical string, also recomputed by the backend:
     * packageName + "\n" + productId + "\n" + purchaseToken.
     */
    private static String requestHashFor(Purchase purchase) throws Exception {
        String canonical = releasePackageName()
                + "\n" + BuildConfig.FULL_ACCESS_PRODUCT_ID
                + "\n" + purchase.getPurchaseToken();
        byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(canonical.getBytes(StandardCharsets.UTF_8));
        return Base64.encodeToString(digest, Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
    }

    private static String releasePackageName() {
        return BuildConfig.APPLICATION_ID.replaceFirst("\\.debug$", "");
    }

    private static String readLimited(InputStream input, int maxChars) throws Exception {
        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            char[] buffer = new char[2048];
            int read;
            while ((read = reader.read(buffer)) != -1) {
                if (builder.length() + read > maxChars) {
                    throw new IllegalStateException("verification_response_too_large");
                }
                builder.append(buffer, 0, read);
            }
        }
        return builder.toString();
    }

    void close() {
        if (closed.compareAndSet(false, true)) {
            integrityProvider.close();
            mainHandler.removeCallbacksAndMessages(null);
            executor.shutdownNow();
        }
    }
}
