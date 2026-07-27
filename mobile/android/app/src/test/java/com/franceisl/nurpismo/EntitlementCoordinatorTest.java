package com.franceisl.nurpismo;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public final class EntitlementCoordinatorTest {
    @Test
    public void sameTokenIsCoalescedAndPromotedToNewestGeneration() {
        EntitlementCoordinator coordinator = new EntitlementCoordinator();
        long first = coordinator.beginOperation();
        assertEquals(
                EntitlementCoordinator.VerificationAction.START,
                coordinator.beginVerification("purchase-token", first)
        );

        long second = coordinator.beginOperation();
        assertEquals(
                EntitlementCoordinator.VerificationAction.COALESCED,
                coordinator.beginVerification("purchase-token", second)
        );
        assertTrue(coordinator.completeVerification("purchase-token"));
    }

    @Test
    public void differentTokenMakesOlderCallbackStale() {
        EntitlementCoordinator coordinator = new EntitlementCoordinator();
        long first = coordinator.beginOperation();
        coordinator.beginVerification("old-token", first);

        long second = coordinator.beginOperation();
        assertEquals(
                EntitlementCoordinator.VerificationAction.START,
                coordinator.beginVerification("new-token", second)
        );
        assertFalse(coordinator.completeVerification("old-token"));
        assertTrue(coordinator.completeVerification("new-token"));
    }

    @Test
    public void authoritativeReconciliationCanInvalidateInFlightVerification() {
        EntitlementCoordinator coordinator = new EntitlementCoordinator();
        long generation = coordinator.beginOperation();
        coordinator.beginVerification("purchase-token", generation);
        coordinator.invalidateVerification();
        assertFalse(coordinator.completeVerification("purchase-token"));
    }

    @Test
    public void closeRejectsEveryLateCallback() {
        EntitlementCoordinator coordinator = new EntitlementCoordinator();
        long generation = coordinator.beginOperation();
        coordinator.beginVerification("purchase-token", generation);
        coordinator.close();
        assertFalse(coordinator.isCurrent(generation));
        assertFalse(coordinator.completeVerification("purchase-token"));
        assertEquals(-1L, coordinator.beginOperation());
    }
}
