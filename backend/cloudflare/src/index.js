const AI_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";
const MAX_BODY_BYTES = 24_000;
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/androidpublisher https://www.googleapis.com/auth/playintegrity";
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
    if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, service: "nurpismo-api" });
    try {
      if (request.method === "POST" && url.pathname === "/api/generate") return generateLetter(request, env);
      if (request.method === "POST" && url.pathname === "/v1/google-play/verify") return verifyGooglePlayPurchase(request, env);
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
  const body = await readJson(request);
  const expectedPackage = env.NURPISMO_PACKAGE_NAME || "com.franceisl.nurpismo";
  const expectedProduct = env.NURPISMO_PRODUCT_ID || "full_access";
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

  const purchaseUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const purchaseResponse = await fetch(purchaseUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!purchaseResponse.ok) throw new ApiError("purchase_not_found", purchaseResponse.status === 404 ? 404 : 502);
  const purchase = await purchaseResponse.json();
  if (Number(purchase.purchaseState) !== 0 || Number(purchase.consumptionState) !== 0) throw new ApiError("purchase_not_active", 403);

  let acknowledged = Number(purchase.acknowledgementState) === 1;
  if (!acknowledged) {
    const ackResponse = await fetch(`${purchaseUrl}:acknowledge`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ developerPayload: "nurpismo-server-verified-v1" })
    });
    if (!ackResponse.ok) throw new ApiError("acknowledgement_failed", 502);
    acknowledged = true;
  }

  return json({ valid: true, acknowledged, integrityVerified, productId, requestHash, reason: "server_verified_play_purchase" });
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
  if (googleTokenCache && googleTokenCache.expiresAt > Date.now() + 60_000) return googleTokenCache.token;
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) throw new ApiError("google_credentials_missing", 503);
  let serviceAccount;
  try { serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON); } catch { throw new ApiError("google_credentials_invalid", 503); }
  if (!serviceAccount.client_email || !serviceAccount.private_key) throw new ApiError("google_credentials_invalid", 503);
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = base64Url(new TextEncoder().encode(JSON.stringify({ iss: serviceAccount.client_email, scope: GOOGLE_SCOPES, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3500 })));
  const unsigned = `${header}.${claims}`;
  const key = await crypto.subtle.importKey("pkcs8", pemToBytes(serviceAccount.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${base64Url(new Uint8Array(signature))}`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  if (!tokenResponse.ok) throw new ApiError("google_auth_failed", 502);
  const data = await tokenResponse.json();
  googleTokenCache = { token: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3000) * 1000 };
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
function constantTimeEqual(left, right) { const a = String(left), b = String(right); let mismatch = a.length ^ b.length; const length = Math.max(a.length, b.length); for (let i = 0; i < length; i++) mismatch |= (a.charCodeAt(i % Math.max(1, a.length)) || 0) ^ (b.charCodeAt(i % Math.max(1, b.length)) || 0); return mismatch === 0; }
