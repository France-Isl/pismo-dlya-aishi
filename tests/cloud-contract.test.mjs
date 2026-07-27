import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const index = read("index.html");
const app = read("app.js");
const config = read("config.js");
const worker = read("sw.js");
const privacy = read("privacy.html");
const migration = read("supabase/migrations/20260727180056_glowletter_baseline.sql");
const vendorMetadata = JSON.parse(read("vendor/supabase-js.version.json"));
const vendorBuffer = fs.readFileSync(path.join(root, "vendor", vendorMetadata.vendoredFile));

assert.match(config, /supabaseUrl:\s*"https:\/\/xzzngrquomyiglktroqi\.supabase\.co"/);
assert.match(config, /supabasePublishableKey:\s*"sb_publishable_/);
assert.doesNotMatch(config, /service_role|sb_secret_/i);

const csp = index.match(/Content-Security-Policy" content="([^"]+)"/)?.[1] || "";
assert.match(csp, /connect-src[^;]*https:\/\/xzzngrquomyiglktroqi\.supabase\.co/);
assert.doesNotMatch(csp, /https:\/\/\*\.supabase\.co/);
assert.ok(index.indexOf("vendor/supabase-2.110.9.js?v=9") < index.indexOf("app.js?v=9"));
assert.match(index, /id="facebookSignIn"[^>]*hidden[^>]*disabled/);

assert.match(app, /flowType:\s*"pkce"/);
assert.match(app, /detectSessionInUrl:\s*false/);
assert.match(app, /skipBrowserRedirect:\s*true/);
assert.match(app, /if \(!url \|\| url\.hash\) return false/);
assert.match(app, /settings\?\.external\?\.facebook === true/);
assert.match(app, /AUTH_CALLBACK_PARAMETERS\.forEach\(key => url\.searchParams\.delete\(key\)\)/);
assert.match(app, /let linkNamesActive = namesCameFromUrl/);
assert.match(app, /linkNamesActive \? \{ sender: "", recipient: "" \}/);
assert.match(app, /if \(persist && explicit\) linkNamesActive = false/);
assert.match(app, /scheduleCloudSync\(\{includeNames:true,immediate:true\}\)/);
assert.match(app, /CLOUD_USER_ENVELOPE_PREFIX/);
assert.match(app, /\.update\(payload\)[\s\S]*\.eq\("revision", envelope\.baseRevision\)/);
assert.match(app, /\.insert\(payload\)/);
assert.match(app, /CLOUD_MAX_WRITE_ATTEMPTS/);
assert.doesNotMatch(app, /\.upsert\(/);

const stateBody = app.match(/function cloudProgressState\(\) \{([\s\S]+?)\n  \}\n\n  function cloudProgressSignature/)?.[1] || "";
for (const allowed of ["sender_name", "recipient_name", "language", "current_letter_id", "favorite_ids", "rain_enabled", "weather_enabled", "built_in_track", "nature_enabled", "fullscreen_enabled", "volume"]) {
  assert.match(stateBody, new RegExp(`\\b${allowed}\\b`));
}
for (const forbidden of ["betaAccess", "backgroundUrl", "customAudioBlob", "generatedMessage", "generatedReply", "latitude", "longitude", "replyIncoming"]) {
  assert.doesNotMatch(stateBody, new RegExp(`\\b${forbidden}\\b`));
}

assert.match(worker, /glow-letter-v9/);
for (const sensitive of ["code", "state", "error_description", "refresh_token", "provider_token"]) assert.match(worker, new RegExp(`"${sensitive}"`));
assert.match(privacy, /Supabase Auth/);
assert.match(privacy, /ключ закрытого тестового доступа в облако не отправляются/);

assert.match(migration, /enable row level security/i);
assert.match(migration, /to authenticated[\s\S]*auth\.uid\(\)[\s\S]*user_id/i);
assert.match(migration, /with check \(\(select auth\.uid\(\)\) = user_id\)/i);

assert.equal(vendorMetadata.version, "2.110.9");
assert.equal(crypto.createHash("sha256").update(vendorBuffer).digest("hex"), vendorMetadata.vendoredSha256);

console.log(JSON.stringify({ ok: true, sdk: vendorMetadata.version, cache: "v9", rls: true }));
