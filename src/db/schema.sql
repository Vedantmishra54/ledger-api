-- Run this ONCE in Supabase -> SQL Editor

CREATE TABLE IF NOT EXISTS accounts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
  balance    NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES accounts(id),
  type         VARCHAR(6) NOT NULL CHECK (type IN ('credit', 'debit')),
  amount       NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  description  TEXT,
  reference_id VARCHAR(100) NOT NULL CHECK (length(trim(reference_id)) > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- same reference_id allowed for different accounts, never twice for one account
  CONSTRAINT uq_account_reference UNIQUE (account_id, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_tx_account_created
  ON transactions (account_id, created_at DESC, id DESC);

-- Immutability: block UPDATE / DELETE on transactions at DB level
CREATE OR REPLACE FUNCTION prevent_transaction_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'transactions are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transactions_immutable ON transactions;
CREATE TRIGGER trg_transactions_immutable
  BEFORE UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION prevent_transaction_mutation();

-- Supabase: keep tables closed to the public Data API (our backend connects as
-- the postgres role directly, which bypasses RLS)
ALTER TABLE accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
