-- user_pass: one row per one-time pass purchase.
-- Append-only; do not upsert on (user_id) — each transaction is a separate row.
-- Applied to Neon production manually on 2026-08-04.

CREATE TABLE user_pass (
  id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid         NOT NULL REFERENCES app_user(id),
  paddle_transaction_id text        NOT NULL UNIQUE,
  price_id             text         NOT NULL,
  pass_type            text         NOT NULL,     -- 'pass30' | 'passyear'
  access_start         timestamptz  NOT NULL,
  access_end           timestamptz  NOT NULL,
  status               text         NOT NULL DEFAULT 'active',  -- 'active' | 'refunded'
  raw                  jsonb,
  created_at           timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX user_pass_user_access_idx ON user_pass (user_id, access_end);
