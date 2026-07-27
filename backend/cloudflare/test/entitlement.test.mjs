import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, createHash } from "node:crypto";
import worker from "../src/index.js";

class FakeD1 {
  constructor(schemaVersion = 1) {
    this.schemaVersion = schemaVersion;
    this.writes = [];
  }

  prepare(sql) {
    if (sql.includes("SELECT schema_version")) {
      return { first: async () => ({ schema_version: this.schemaVersion }) };
    }
    return {
      bind: (...values) => ({
        run: async () => {
          this.writes.push(values);
          return { success: true, meta: { changes: 1 } };
        }
      })
    };
  }
}

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" }
});

const baseEnv = {
  NURPISMO_PACKAGE_NAME: "com.franceisl.nurpismo",
  NURPISMO_PRODUCT_ID: "full_access",
  REQUIRE_PLAY_INTEGRITY: "true",
  ENTITLEMENT_HASH_KEY_ID: "v1",
  ENTITLEMENT_HASH_SECRET: "test-only-secret-with-more-than-32-bytes",
  GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({
    type: "service_account",
    client_email: "nurpismo-test@example.iam.gserviceaccount.com",
    private_key: privateKey
  })
};

function requestHash(token) {
  return createHash("sha256")
    .update(`com.franceisl.nurpismo\nfull_access\n${token}`)
    .digest("base64url");
}

function makeRequest(token) {
  const hash = requestHash(token);
  return new Request("https://api.example/v1/google-play/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-NurPismo-Client": "android",
      "CF-Connecting-IP": "203.0.113.10"
    },
    body: JSON.stringify({
      packageName: "com.franceisl.nurpismo",
      productId: "full_access",
      purchaseToken: token,
      requestHashVersion: "v1",
      requestHash: hash,
      integrityToken: "integrity-test-token"
    })
  });
}

test("one-time purchase is verified, journaled without raw secrets, and restored idempotently", async () => {
  let acknowledged = false;
  let purchaseState = 0;
  let activeHash = "";
  let acknowledgeCalls = 0;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, init = {}) => {
    const href = String(url);
    if (href === "https://oauth2.googleapis.com/token") {
      return Response.json({ access_token: "test-access-token", expires_in: 3600 });
    }
    if (href.includes("playintegrity.googleapis.com")) {
      return Response.json({
        tokenPayloadExternal: {
          requestDetails: {
            requestPackageName: "com.franceisl.nurpismo",
            requestHash: activeHash,
            timestampMillis: String(Date.now())
          },
          appIntegrity: { appRecognitionVerdict: "PLAY_RECOGNIZED", packageName: "com.franceisl.nurpismo" },
          accountDetails: { appLicensingVerdict: "LICENSED" },
          deviceIntegrity: { deviceRecognitionVerdict: ["MEETS_DEVICE_INTEGRITY"] }
        }
      });
    }
    if (href.includes("androidpublisher.googleapis.com") && String(init.method || "GET") === "POST") {
      acknowledgeCalls += 1;
      acknowledged = true;
      return new Response(null, { status: 200 });
    }
    if (href.includes("androidpublisher.googleapis.com")) {
      return Response.json({
        productId: "full_access",
        orderId: "GPA.0000-1111-2222-33333",
        purchaseTimeMillis: "1720000000000",
        purchaseState,
        consumptionState: 0,
        acknowledgementState: acknowledged ? 1 : 0
      });
    }
    throw new Error(`Unexpected fetch: ${href}`);
  };

  try {
    const token = "token.for.valid.purchase.1234567890";
    const db = new FakeD1();
    activeHash = requestHash(token);
    let response = await worker.fetch(makeRequest(token), { ...baseEnv, ENTITLEMENTS_DB: db });
    let body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.valid, true);
    assert.equal(body.acknowledged, true);
    assert.equal(body.integrityVerified, true);
    assert.equal(acknowledgeCalls, 1);
    assert.equal(db.writes.length, 2);
    assert.equal(db.writes[0][0], db.writes[1][0]);
    assert.match(db.writes[0][0], /^v1\.[A-Za-z0-9_-]{43}$/);
    assert.ok(!JSON.stringify(db.writes).includes(token));
    assert.ok(!JSON.stringify(db.writes).includes("GPA.0000-1111-2222-33333"));

    response = await worker.fetch(makeRequest(token), { ...baseEnv, ENTITLEMENTS_DB: db });
    body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.valid, true);
    assert.equal(acknowledgeCalls, 1);
    assert.equal(db.writes.at(-1)[0], db.writes[0][0]);

    const missingDbResponse = await worker.fetch(makeRequest(token), baseEnv);
    assert.equal(missingDbResponse.status, 503);
    assert.equal((await missingDbResponse.json()).error, "billing_backend_not_configured");

    const cancelledToken = "token.for.cancelled.purchase.12345678";
    activeHash = requestHash(cancelledToken);
    purchaseState = 1;
    acknowledged = true;
    const cancelledDb = new FakeD1();
    const cancelledResponse = await worker.fetch(makeRequest(cancelledToken), { ...baseEnv, ENTITLEMENTS_DB: cancelledDb });
    assert.equal(cancelledResponse.status, 403);
    assert.equal((await cancelledResponse.json()).error, "purchase_not_active");
    assert.equal(cancelledDb.writes[0][3], "cancelled");

    const badSchemaResponse = await worker.fetch(makeRequest(cancelledToken), { ...baseEnv, ENTITLEMENTS_DB: new FakeD1(99) });
    assert.equal(badSchemaResponse.status, 503);
    assert.equal((await badSchemaResponse.json()).error, "entitlement_store_not_ready");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
