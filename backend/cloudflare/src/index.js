const AI_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";
const MAX_BODY_BYTES = 24_000;
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/androidpublisher https://www.googleapis.com/auth/playintegrity";
const ENTITLEMENT_SCHEMA_VERSION = 1;
const PURCHASE_TOKEN_HASH_DOMAIN = "nurpismo/google-play/purchase-token/v1";
const localRateBuckets = new Map();
let googleTokenCache = null;

const blocked = [
  "секс", "эрот", "порн", "поцелу", "интим", "обнаж", "генитал", "оргазм", "возбужд", "мастурб", "проститу",
  "sex", "erotic", "porn", "kiss", "intimacy", "nude", "naked", "genital", "orgasm", "arous", "masturb", "prostitut",
  "sexe", "eroti", "porn", "baiser", "embrasser", "intimite", "nudite", "genital", "orgasme", "excite", "masturb", "prostitu",
  "алкогол", "наркот", "казино", "букмек", "шантаж", "угрож", "убить", "избить", "alcohol", "drug", "casino", "gambling", "blackmail", "threat", "kill", "alcool", "drogue", "casino", "parier", "chantage", "menace", "tuer"
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return corsResponse(request, env, null, 204);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "nurpismo-api", billingConfigured: billingConfigurationReady(env) });
    }
    try {
      // Await inside this try so asynchronous ApiError rejections are converted
      // to the stable public error contract instead of escaping the Worker.
      if (request.method === "POST" && url.pathname === "/api/generate") return await generateLetter(request, env);
      if (request.method === "POST" && url.pathname === "/v1/google-play/verify") return await verifyGooglePlayPurchase(request, env);
      return json({ error: "not_found" }, 404);
    } catch (error) {
      const safeCode = error instanceof ApiError ? error.code : "internal_error";
      const status = error instanceof ApiError ? error.status : 500;
      return json({ error: safeCode }, status);
    }
  }
};

class ApiError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}

async function generateLetter(request, env) {
  requireAllowedOrigin(request, env);
  enforceRateLimit(request, 8, 60_000);
  const body = await readJson(request);
  const from = cleanName(body.from);
  const to = cleanName(body.to);
  const language = ["ru", "en", "fr"].includes(body.language) ? body.language : "ru";
  const relationship = ["mother", "father", "spouse", "child", "sibling", "grandparent", "teacher", "friend", "universal"].includes(body.relationship) ? body.relationship : "universal";
  if (!from || !to || containsBlocked(`${from} ${to}`)) throw new ApiError("invalid_names", 422);

  const languageName = { ru: "Russian", en: "English", fr: "French" }[language];
  const relationRule = relationship === "universal"
    ? "The relationship is unknown. Do not invent family ties, marriage, shared memories, or romantic history. Use warm, universal appreciation."
    : `The explicit relationship category is ${relationship}. Use only details that logically follow from that category; never invent events.`;
  const system = `You edit polished personal letters for a family-safe commercial app. Write in ${languageName}. Return only one finished letter body, 90–140 words, with a direct address to the recipient, one coherent central thought, gratitude or gentle support, and a calm closing wish. Do not add a signature because the app displays it separately. ${relationRule}

Strict content policy: respectful and modest wording only. Never produce adult or sexual content, kissing, erotic or suggestive language, physical intimacy, secret relationships, alcohol, drugs, gambling, insults, coercion, violence, fabricated quotations, scripture, hadith, religious rulings, or claims that a statement is halal. Gentle love is allowed only when relationship=spouse and must remain focused on respect, care, home, patience, and companionship. For every other relationship avoid romantic language. Do not reveal reasoning, write analysis, use headings, quotes, bullet points, placeholders, or gender alternatives in parentheses. Do not invent facts. The recipient's exact display name must appear naturally in the first sentence.`;
  const prompt = `/no_think\nSender display name: ${from}\nRecipient display name: ${to}\nRelationship: ${relationship}\nCreate the final letter now.`;
  const result = await env.AI.run(AI_MODEL, { messages: [{ role: "system", content: system }, { role: "user", content: prompt }], max_tokens: 430, temperature: 0.62, top_p: 0.82 });
  let text = String(result?.response || result?.result?.response || "").replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^\s*["«]|["»]\s*$/g, "").trim();
  if (!validGeneratedText(text, to)) throw new ApiError("generation_rejected", 503);
  return corsResponse(request, env, { text, provider: "workers-ai", model: AI_MODEL }, 200);
}

async function verifyGooglePlayPurchase(request, env) {
  if (request.headers.get("X-NurPismo-Client") !== "android") throw new ApiError("invalid_client", 403);
  enforceRateLimit(request, 20, 60_000);
  const billing = requireBillingConfiguration(env);
  await requireEntitlementStore(env);
  const body = await readJson(request);
  const expectedPackage = billing.packageName;
  const expectedProduct = billing.productId;
  const packageName = String(body.packageName || "");
  const productId = String(body.productId || "");
  const purchaseToken = String(body.purchaseToken || "");
  if (packageName !== expectedPackage || productId !== expectedProduct) throw new ApiError("product_mismatch", 403);
  if (!/^[A-Za-z0-9._:\-]{20,4096}$/.test(purchaseToken)) throw new ApiError("invalid_purchase_token", 422);

  const requestHash = await sha256Base64Url(`${packageName}\n${productId}\n${purchaseToken}`);
  if (body.requestHashVersion !== "v1" || !constantTimeEqual(requestHash, String(body.requestHash || ""))) throw new ApiError("request_hash_mismatch", 403);

  const accessToken = await googleAccessToken(env);
  const integrityVerified = await verifyIntegrity(body.integrityToken, body.requestHash, packageName, accessToken, env);
  if (!integrityVerified) throw new ApiError("integrity_rejected", 403);

  // Only a keyed, domain-separated digest is persisted. The raw Play token is
  // held in memory just long enough to query/acknowledge Google and is never
  // logged, returned, or written to D1.
  const tokenHash = await hmacSha256Base64Url(
    billing.hashSecret,
    `${PURCHASE_TOKEN_HASH_DOMAIN}\n${packageName}\n${productId}\n${purchaseToken}`
  );
  const tokenKey = `${billing.hashKeyId}.${tokenHash}`;

  const purchaseUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const purchaseResponse = await fetch(purchaseUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!purchaseResponse.ok) {
    if (purchaseResponse.status === 404 || purchaseResponse.status === 410) throw new ApiError("purchase_not_found", 404);
    if (purchaseResponse.status === 429 || purchaseResponse.status >= 500) throw new ApiError("google_play_unavailable", 503);
    throw new ApiError("google_play_verification_failed", 502);
  }
  const purchase = await purchaseResponse.json();
  if (purchase.productId && purchase.productId !== productId) throw new ApiError("purchase_product_mismatch", 403);

  const purchaseState = Number(purchase.purchaseState);
  const consumptionState = Number(purchase.consumptionState);
  const acknowledgementState = Number(purchase.acknowledgementState);
  if (![0, 1, 2].includes(purchaseState)
    || ![0, 1].includes(consumptionState)
    || ![0, 1].includes(acknowledgementState)) {
    throw new ApiError("google_play_response_invalid", 502);
  }
  const orderIdHash = purchase.orderId
    ? await hmacSha256Base64Url(billing.hashSecret, `nurpismo/google-play/order-id/v1\n${purchase.orderId}`)
    : null;
  const evidence = {
    tokenKey,
    packageName,
    productId,
    purchaseState,
    consumptionState,
    acknowledgementState,
    purchaseTimeMillis: safeIntegerOrNull(purchase.purchaseTimeMillis),
    orderIdHash,
    integrityVerified
  };

  if (purchaseState !== 0) {
    await persistEntitlement(env, {
      ...evidence,
      state: purchaseState === 2 ? "pending" : "cancelled",
      acknowledged: acknowledgementState === 1
    });
    throw new ApiError(purchaseState === 2 ? "purchase_pending" : "purchase_not_active", 403);
  }
  if (consumptionState !== 0) {
    await persistEntitlement(env, { ...evidence, state: "consumed", acknowledged: acknowledgementState === 1 });
    throw new ApiError("purchase_consumed", 403);
  }

  let acknowledged = acknowledgementState === 1;
  await persistEntitlement(env, {
    ...evidence,
    state: acknowledged ? "active" : "verified_pending_ack",
    acknowledged
  });

  if (!acknowledged) {
    const ackResponse = await fetch(`${purchaseUrl}:acknowledge`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ developerPayload: "nurpismo-server-verified-v1" })
    });
    if (ackResponse.ok) {
      acknowledged = true;
    } else {
      // Two identical requests may race. If one of them acknowledged first,
      // a fresh read is authoritative and lets the second request finish
      // idempotently instead of denying a legitimate buyer.
      const refreshedResponse = await fetch(purchaseUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (refreshedResponse.ok) {
        const refreshed = await refreshedResponse.json();
        acknowledged = Number(refreshed.purchaseState) === 0
          && Number(refreshed.consumptionState) === 0
          && Number(refreshed.acknowledgementState) === 1;
      }
      if (!acknowledged) {
        await persistEntitlement(env, { ...evidence, state: "ack_failed", acknowledged: false });
        throw new ApiError("acknowledgement_failed", 502);
      }
    }
  }

  await persistEntitlement(env, { ...evidence, acknowledgementState: 1, state: "active", acknowledged: true });
  return json({ valid: true, acknowledged, integrityVerified, productId, requestHash, reason: "server_verified_play_purchase" });
}

function billingConfigurationReady(env) {
  try {
    requireBillingConfiguration(env);
    return true;
  } catch {
    return false;
  }
}

function requireBillingConfiguration(env) {
  const packageName = String(env.NURPISMO_PACKAGE_NAME || "").trim();
  const productId = String(env.NURPISMO_PRODUCT_ID || "").trim();
  const hashSecret = String(env.ENTITLEMENT_HASH_SECRET || "");
  const hashKeyId = String(env.ENTITLEMENT_HASH_KEY_ID || "").trim();
  const hasD1 = env.ENTITLEMENTS_DB && typeof env.ENTITLEMENTS_DB.prepare === "function";
  let credentialsValid = false;
  try {
    const credentials = JSON.parse(String(env.GOOGLE_SERVICE_ACCOUNT_JSON || ""));
    credentialsValid = credentials?.type === "service_account"
      && typeof credentials.client_email === "string"
      && credentials.client_email.endsWith(".gserviceaccount.com")
      && typeof credentials.private_key === "string"
      && credentials.private_key.includes("BEGIN PRIVATE KEY");
  } catch {
    credentialsValid = false;
  }

  const valid = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/.test(packageName)
    && /^[A-Za-z0-9._-]{1,128}$/.test(productId)
    && env.REQUIRE_PLAY_INTEGRITY === "true"
    && hasD1
    && credentialsValid
    && new TextEncoder().encode(hashSecret).length >= 32
    && /^[a-z0-9_-]{1,16}$/.test(hashKeyId);
  if (!valid) throw new ApiError("billing_backend_not_configured", 503);
  return { packageName, productId, hashSecret, hashKeyId };
}

async function requireEntitlementStore(env) {
  try {
    const row = await env.ENTITLEMENTS_DB
      .prepare("SELECT schema_version FROM entitlement_meta WHERE singleton = 1")
      .first();
    if (Number(row?.schema_version) !== ENTITLEMENT_SCHEMA_VERSION) throw new Error("schema_version_mismatch");
  } catch {
    throw new ApiError("entitlement_store_not_ready", 503);
  }
}

async function persistEntitlement(env, record) {
  const now = Date.now();
  const firstActiveAt = record.state === "active" ? now : null;
  const acknowledgedAt = record.acknowledged ? now : null;
  try {
    const result = await env.ENTITLEMENTS_DB.prepare(`
      INSERT INTO play_entitlements (
        token_hash, package_name, product_id, state,
        first_seen_at, first_active_at, last_verified_at, last_integrity_at, acknowledged_at,
        purchase_time_ms, order_id_hash, purchase_state_code, consumption_state_code,
        acknowledgement_state_code, record_revision
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?5, ?5, ?7, ?8, ?9, ?10, ?11, ?12, 1)
      ON CONFLICT(token_hash) DO UPDATE SET
        state = excluded.state,
        first_active_at = COALESCE(play_entitlements.first_active_at, excluded.first_active_at),
        last_verified_at = excluded.last_verified_at,
        last_integrity_at = excluded.last_integrity_at,
        acknowledged_at = COALESCE(play_entitlements.acknowledged_at, excluded.acknowledged_at),
        purchase_time_ms = COALESCE(play_entitlements.purchase_time_ms, excluded.purchase_time_ms),
        order_id_hash = COALESCE(play_entitlements.order_id_hash, excluded.order_id_hash),
        purchase_state_code = excluded.purchase_state_code,
        consumption_state_code = excluded.consumption_state_code,
        acknowledgement_state_code = excluded.acknowledgement_state_code,
        record_revision = play_entitlements.record_revision + 1
      WHERE play_entitlements.package_name = excluded.package_name
        AND play_entitlements.product_id = excluded.product_id
    `).bind(
      record.tokenKey,
      record.packageName,
      record.productId,
      record.state,
      now,
      firstActiveAt,
      acknowledgedAt,
      record.purchaseTimeMillis,
      record.orderIdHash,
      record.purchaseState,
      record.consumptionState,
      record.acknowledgementState
    ).run();
    if (!result?.success || Number(result?.meta?.changes || 0) !== 1) throw new Error("entitlement_write_failed");
  } catch {
    // Never grant access if the durable entitlement journal cannot be updated.
    throw new ApiError("entitlement_store_unavailable", 503);
  }
}

async function verifyIntegrity(integrityToken, requestHash, packageName, accessToken, env) {
  const required = String(env.REQUIRE_PLAY_INTEGRITY || "true") !== "false";
  if (!integrityToken) return !required;
  const response = await fetch(`https://playintegrity.googleapis.com/v1/${encodeURIComponent(packageName)}:decodeIntegrityToken`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ integrity_token: integrityToken })
  });
  if (!response.ok) return false;
  const decoded = await response.json();
  const payload = decoded.tokenPayloadExternal || {};
  const details = payload.requestDetails || {};
  const app = payload.appIntegrity || {};
  const account = payload.accountDetails || {};
  const device = payload.deviceIntegrity || {};
  const timestamp = Number(details.timestampMillis || 0);
  const fresh = timestamp > 0 && Math.abs(Date.now() - timestamp) < 5 * 60_000;
  return fresh
    && details.requestPackageName === packageName
    && constantTimeEqual(String(details.requestHash || ""), String(requestHash || ""))
    && app.appRecognitionVerdict === "PLAY_RECOGNIZED"
    && app.packageName === packageName
    && account.appLicensingVerdict === "LICENSED"
    && Array.isArray(device.deviceRecognitionVerdict)
    && device.deviceRecognitionVerdict.includes("MEETS_DEVICE_INTEGRITY");
}

async function googleAccessToken(env) {
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) throw new ApiError("google_credentials_missing", 503);
  let serviceAccount;
  try { serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON); } catch { throw new ApiError("google_credentials_invalid", 503); }
  if (!serviceAccount.client_email || !serviceAccount.private_key) throw new ApiError("google_credentials_invalid", 503);
  if (googleTokenCache
    && googleTokenCache.clientEmail === serviceAccount.client_email
    && googleTokenCache.expiresAt > Date.now() + 60_000) return googleTokenCache.token;
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = base64Url(new TextEncoder().encode(JSON.stringify({ iss: serviceAccount.client_email, scope: GOOGLE_SCOPES, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3500 })));
  const unsigned = `${header}.${claims}`;
  let signature;
  try {
    const key = await crypto.subtle.importKey("pkcs8", pemToBytes(serviceAccount.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  } catch {
    throw new ApiError("google_credentials_invalid", 503);
  }
  const assertion = `${unsigned}.${base64Url(new Uint8Array(signature))}`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  if (!tokenResponse.ok) throw new ApiError("google_auth_failed", 502);
  const data = await tokenResponse.json();
  if (typeof data.access_token !== "string" || !data.access_token) throw new ApiError("google_auth_failed", 502);
  googleTokenCache = { token: data.access_token, clientEmail: serviceAccount.client_email, expiresAt: Date.now() + Number(data.expires_in || 3000) * 1000 };
  return googleTokenCache.token;
}

async function readJson(request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) throw new ApiError("body_too_large", 413);
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new ApiError("body_too_large", 413);
  try { return JSON.parse(text); } catch { throw new ApiError("invalid_json", 400); }
}

function cleanName(value) { return String(value || "").normalize("NFKC").replace(/[<>\n\r{}\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 36); }
function normalize(value) { return String(value || "").normalize("NFKC").toLowerCase().replaceAll("ё", "е").normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function containsBlocked(value) { const compact = normalize(value).replace(/[^\p{L}\p{N}]/gu, ""); return blocked.some(stem => compact.includes(normalize(stem).replace(/[^\p{L}\p{N}]/gu, ""))); }
function validGeneratedText(text, recipient) { const words = text.split(/\s+/).filter(Boolean); return text.length >= 220 && text.length <= 1800 && words.length >= 55 && words.length <= 190 && normalize(text).includes(normalize(recipient)) && !containsBlocked(text) && !/<[^>]+>|^[-*#]|\b(?:analysis|reasoning)\b/i.test(text); }

function enforceRateLimit(request, limit, windowMs) {
  const key = `${request.headers.get("CF-Connecting-IP") || "unknown"}:${new URL(request.url).pathname}`;
  const now = Date.now();
  const bucket = localRateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) { localRateBuckets.set(key, { count: 1, resetAt: now + windowMs }); return; }
  bucket.count += 1;
  if (bucket.count > limit) throw new ApiError("rate_limited", 429);
  if (localRateBuckets.size > 5000) for (const [entryKey, entry] of localRateBuckets) if (entry.resetAt <= now) localRateBuckets.delete(entryKey);
}

function requireAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
  if (!allowed.includes(origin)) throw new ApiError("origin_not_allowed", 403);
}

function corsResponse(request, env, body, status) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
  const headers = { "Vary": "Origin", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" };
  if (allowed.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  if (status === 204) return new Response(null, { status, headers });
  headers["Content-Type"] = "application/json; charset=utf-8";
  return new Response(JSON.stringify(body), { status, headers });
}

function json(body, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
function base64Url(bytes) { let binary = ""; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, ""); }
function pemToBytes(pem) { const base64 = String(pem).replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, ""); const binary = atob(base64); return Uint8Array.from(binary, char => char.charCodeAt(0)); }
async function sha256Base64Url(value) { return base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))); }
async function hmacSha256Base64Url(secret, value) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}
function safeIntegerOrNull(value) { const number = Number(value); return Number.isSafeInteger(number) && number >= 0 ? number : null; }
function constantTimeEqual(left, right) { const a = String(left), b = String(right); let mismatch = a.length ^ b.length; const length = Math.max(a.length, b.length); for (let i = 0; i < length; i++) mismatch |= (a.charCodeAt(i % Math.max(1, a.length)) || 0) ^ (b.charCodeAt(i % Math.max(1, b.length)) || 0); return mismatch === 0; }
