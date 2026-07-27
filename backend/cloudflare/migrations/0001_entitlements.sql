PRAGMA foreign_keys = ON;

CREATE TABLE entitlement_meta (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  schema_version INTEGER NOT NULL CHECK (schema_version > 0),
  migrated_at INTEGER NOT NULL
);

INSERT INTO entitlement_meta (singleton, schema_version, migrated_at)
VALUES (1, 1, unixepoch() * 1000);

CREATE TABLE play_entitlements (
  token_hash TEXT PRIMARY KEY CHECK (length(token_hash) BETWEEN 45 AND 64),
  package_name TEXT NOT NULL CHECK (length(package_name) BETWEEN 3 AND 255),
  product_id TEXT NOT NULL CHECK (length(product_id) BETWEEN 1 AND 128),
  state TEXT NOT NULL CHECK (state IN (
    'verified_pending_ack',
    'active',
    'pending',
    'cancelled',
    'consumed',
    'ack_failed'
  )),
  first_seen_at INTEGER NOT NULL,
  first_active_at INTEGER,
  last_verified_at INTEGER NOT NULL,
  last_integrity_at INTEGER NOT NULL,
  acknowledged_at INTEGER,
  purchase_time_ms INTEGER,
  order_id_hash TEXT CHECK (order_id_hash IS NULL OR length(order_id_hash) = 43),
  purchase_state_code INTEGER NOT NULL CHECK (purchase_state_code IN (0, 1, 2)),
  consumption_state_code INTEGER NOT NULL CHECK (consumption_state_code IN (0, 1)),
  acknowledgement_state_code INTEGER NOT NULL CHECK (acknowledgement_state_code IN (0, 1)),
  record_revision INTEGER NOT NULL DEFAULT 1 CHECK (record_revision > 0)
);

CREATE INDEX play_entitlements_state_verified_idx
  ON play_entitlements (state, last_verified_at);

CREATE INDEX play_entitlements_product_idx
  ON play_entitlements (package_name, product_id);
