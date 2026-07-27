package com.franceisl.nurpismo;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public final class PurchaseVerifierPolicyTest {
    @Test
    public void rejectedPurchaseAndIntegrityResponsesAreAuthoritative() {
        assertTrue(PurchaseVerifier.isAuthoritativeRejectionStatus(400));
        assertTrue(PurchaseVerifier.isAuthoritativeRejectionStatus(403));
        assertTrue(PurchaseVerifier.isAuthoritativeRejectionStatus(404));
        assertTrue(PurchaseVerifier.isAuthoritativeRejectionStatus(410));
        assertTrue(PurchaseVerifier.isAuthoritativeRejectionStatus(422));
    }

    @Test
    public void throttlingAndServerFailuresRemainTransient() {
        assertFalse(PurchaseVerifier.isAuthoritativeRejectionStatus(401));
        assertFalse(PurchaseVerifier.isAuthoritativeRejectionStatus(429));
        assertFalse(PurchaseVerifier.isAuthoritativeRejectionStatus(500));
        assertFalse(PurchaseVerifier.isAuthoritativeRejectionStatus(503));
    }
}
