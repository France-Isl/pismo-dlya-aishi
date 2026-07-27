package com.franceisl.nurpismo;

/**
 * Orders asynchronous purchase reconciliation and coalesces verification of the
 * same Google Play purchase token. This class deliberately stores no durable
 * entitlement; Google Play plus the verification backend remain authoritative.
 */
final class EntitlementCoordinator {
    enum VerificationAction {
        START,
        COALESCED,
        STALE
    }

    private long generation;
    private String inFlightToken;
    private long inFlightGeneration = -1L;
    private boolean closed;

    synchronized long beginOperation() {
        if (closed) {
            return -1L;
        }
        return ++generation;
    }

    synchronized boolean isCurrent(long candidateGeneration) {
        return !closed && candidateGeneration > 0L && candidateGeneration == generation;
    }

    synchronized VerificationAction beginVerification(String purchaseToken, long candidateGeneration) {
        if (!isCurrent(candidateGeneration) || purchaseToken == null || purchaseToken.trim().isEmpty()) {
            return VerificationAction.STALE;
        }
        if (purchaseToken.equals(inFlightToken)) {
            // A newer source (for example PurchasesUpdatedListener after a
            // restore query) observed the same purchase. Reuse the network
            // request and let its result satisfy the newest generation.
            inFlightGeneration = candidateGeneration;
            return VerificationAction.COALESCED;
        }
        inFlightToken = purchaseToken;
        inFlightGeneration = candidateGeneration;
        return VerificationAction.START;
    }

    synchronized boolean completeVerification(String purchaseToken) {
        if (closed || purchaseToken == null || !purchaseToken.equals(inFlightToken)) {
            return false;
        }
        long completedGeneration = inFlightGeneration;
        inFlightToken = null;
        inFlightGeneration = -1L;
        return completedGeneration == generation;
    }

    synchronized boolean hasVerificationInFlight() {
        return !closed && inFlightToken != null;
    }

    synchronized void invalidateVerification() {
        inFlightToken = null;
        inFlightGeneration = -1L;
    }

    synchronized void close() {
        closed = true;
        generation += 1L;
        invalidateVerification();
    }
}
