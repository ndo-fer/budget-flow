-- =======================================================
-- Budget Flow - Supabase Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =======================================================

-- 1. WALLETS TABLE
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('bank', 'ewallet', 'cash', 'other')),
  provider TEXT,
  confirmed_balance NUMERIC NOT NULL DEFAULT 0,
  estimated_balance NUMERIC NOT NULL DEFAULT 0,
  last_confirmed_at TIMESTAMPTZ,
  confidence NUMERIC NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own wallets"
  ON wallets FOR ALL USING (auth.uid() = user_id);

-- 2. WALLET TRANSACTIONS TABLE (source-aware transactions)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'transfer_out', 'transfer_in', 'adjustment')),
  category TEXT,
  merchant TEXT,
  note TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('notification', 'screenshot', 'csv', 'receipt', 'manual', 'adjustment')),
  raw_text TEXT,
  confidence NUMERIC NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  matched_transaction_id UUID REFERENCES wallet_transactions(id) ON DELETE SET NULL
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own wallet transactions"
  ON wallet_transactions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_occurred_at ON wallet_transactions(occurred_at DESC);

-- 3. BALANCE ADJUSTMENTS TABLE (audit trail for manual corrections)
CREATE TABLE IF NOT EXISTS balance_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  previous_estimated_balance NUMERIC NOT NULL,
  new_confirmed_balance NUMERIC NOT NULL,
  difference NUMERIC NOT NULL,
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'screenshot', 'csv')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE balance_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own balance adjustments"
  ON balance_adjustments FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_balance_adjustments_wallet_id ON balance_adjustments(wallet_id);

-- 4. NOTIFICATION ALLOWLIST TABLE (per-app toggle)
CREATE TABLE IF NOT EXISTS notification_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  app_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, package_name)
);

ALTER TABLE notification_allowlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notification allowlist"
  ON notification_allowlist FOR ALL USING (auth.uid() = user_id);

-- 5. FUNCTION: auto-update wallet estimated_balance after transaction insert/delete/update
CREATE OR REPLACE FUNCTION recalculate_wallet_estimated_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE wallets
  SET
    estimated_balance = confirmed_balance + COALESCE((
      SELECT
        SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END)
      FROM wallet_transactions
      WHERE wallet_id = COALESCE(NEW.wallet_id, OLD.wallet_id)
        AND user_id = COALESCE(NEW.user_id, OLD.user_id)
        AND is_duplicate = false
        AND (last_confirmed_at IS NULL OR occurred_at >= last_confirmed_at)
    ), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.wallet_id, OLD.wallet_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_recalc_balance_after_tx
AFTER INSERT OR UPDATE OR DELETE ON wallet_transactions
FOR EACH ROW EXECUTE FUNCTION recalculate_wallet_estimated_balance();

-- 6. FUNCTION: auto-update updated_at on wallets
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. FUNCTION: delete current user (for account self-deletion)
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- 8. FUNCTION: adjust wallet balance atomically
CREATE OR REPLACE FUNCTION adjust_wallet_balance(
  p_wallet_id UUID,
  p_new_balance NUMERIC,
  p_reason TEXT,
  p_source TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_balance NUMERIC;
BEGIN
  -- Fetch the current balance of the wallet
  SELECT estimated_balance INTO v_old_balance FROM wallets WHERE id = p_wallet_id AND user_id = auth.uid() FOR UPDATE;
  
  IF v_old_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found or access denied';
  END IF;

  -- Log the balance adjustment
  INSERT INTO balance_adjustments (
    user_id,
    wallet_id,
    previous_estimated_balance,
    new_confirmed_balance,
    difference,
    reason,
    source
  ) VALUES (
    auth.uid(),
    p_wallet_id,
    v_old_balance,
    p_new_balance,
    p_new_balance - v_old_balance,
    p_reason,
    p_source
  );

  -- Update confirmed_balance and estimated_balance on the wallet
  UPDATE wallets
  SET 
    confirmed_balance = p_new_balance,
    estimated_balance = p_new_balance,
    last_confirmed_at = now(),
    confidence = 1.0
  WHERE id = p_wallet_id AND user_id = auth.uid();
END;
$$;

-- 9. SECURITY HARDENING: REVOKE AND GRANT EXECUTE PRIVILEGES ON SECURITY DEFINER FUNCTIONS
REVOKE EXECUTE ON FUNCTION delete_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION adjust_wallet_balance(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_wallet_balance(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
