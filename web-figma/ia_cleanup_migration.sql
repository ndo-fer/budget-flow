-- =======================================================
-- Budget Flow - Information Architecture Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =======================================================

-- 1. USER FINANCE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_finance_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  payday_day_of_month INT NOT NULL DEFAULT 25 CHECK (payday_day_of_month BETWEEN 1 AND 31),
  currency_code TEXT NOT NULL DEFAULT 'IDR',
  locale TEXT NOT NULL DEFAULT 'id-ID',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_finance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own finance settings"
  ON public.user_finance_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own finance settings"
  ON public.user_finance_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own finance settings"
  ON public.user_finance_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Apply updated_at trigger
CREATE TRIGGER trg_user_finance_settings_updated_at 
  BEFORE UPDATE ON public.user_finance_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 2. USER GUIDANCE STATE TABLE
CREATE TABLE IF NOT EXISTS public.user_guidance_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_seen_home_guide BOOLEAN NOT NULL DEFAULT false,
  has_seen_record_guide BOOLEAN NOT NULL DEFAULT false,
  has_seen_wallet_guide BOOLEAN NOT NULL DEFAULT false,
  has_seen_plan_guide BOOLEAN NOT NULL DEFAULT false,
  has_seen_income_guide BOOLEAN NOT NULL DEFAULT false,
  has_seen_history_guide BOOLEAN NOT NULL DEFAULT false,
  has_seen_recurring_guide BOOLEAN NOT NULL DEFAULT false,
  starter_checklist_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_guidance_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own guidance state"
  ON public.user_guidance_state FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own guidance state"
  ON public.user_guidance_state FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own guidance state"
  ON public.user_guidance_state FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Apply updated_at trigger
CREATE TRIGGER trg_user_guidance_state_updated_at 
  BEFORE UPDATE ON public.user_guidance_state 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3. FUNCTION: get_user_setup_status
CREATE OR REPLACE FUNCTION public.get_user_setup_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT jsonb_build_object(
    'has_wallet', EXISTS(SELECT 1 FROM public.wallets WHERE user_id = v_user_id AND is_active = true),
    'has_income_source', EXISTS(SELECT 1 FROM public.income_sources WHERE user_id = v_user_id AND is_active = true),
    'has_budget_category', EXISTS(SELECT 1 FROM public.budget_categories WHERE user_id = v_user_id AND is_active = true),
    'has_any_transaction', EXISTS(SELECT 1 FROM public.wallet_transactions WHERE user_id = v_user_id AND is_duplicate = false),
    'has_expense_transaction', EXISTS(SELECT 1 FROM public.wallet_transactions WHERE user_id = v_user_id AND type = 'expense' AND is_duplicate = false),
    'has_income_transaction', EXISTS(SELECT 1 FROM public.wallet_transactions WHERE user_id = v_user_id AND type = 'income' AND is_duplicate = false),
    'has_recurring_expense', EXISTS(SELECT 1 FROM public.recurring_expenses WHERE user_id = v_user_id AND is_active = true),
    'has_balance_adjustment', EXISTS(SELECT 1 FROM public.balance_adjustments WHERE user_id = v_user_id),
    'has_csv_import', EXISTS(SELECT 1 FROM public.wallet_transactions WHERE user_id = v_user_id AND source = 'csv'),
    'has_receipt_scan', EXISTS(SELECT 1 FROM public.wallet_transactions WHERE user_id = v_user_id AND source = 'receipt'),
    'starter_checklist_hidden', COALESCE((SELECT starter_checklist_hidden FROM public.user_guidance_state WHERE user_id = v_user_id), false)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_setup_status() FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_setup_status() TO authenticated;


-- 4. FUNCTION: mark_guide_seen
CREATE OR REPLACE FUNCTION public.mark_guide_seen(p_guide_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_guidance_state (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF p_guide_key = 'home' THEN
    UPDATE public.user_guidance_state SET has_seen_home_guide = true, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_guide_key = 'record' THEN
    UPDATE public.user_guidance_state SET has_seen_record_guide = true, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_guide_key = 'wallet' THEN
    UPDATE public.user_guidance_state SET has_seen_wallet_guide = true, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_guide_key = 'plan' THEN
    UPDATE public.user_guidance_state SET has_seen_plan_guide = true, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_guide_key = 'income' THEN
    UPDATE public.user_guidance_state SET has_seen_income_guide = true, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_guide_key = 'history' THEN
    UPDATE public.user_guidance_state SET has_seen_history_guide = true, updated_at = now() WHERE user_id = v_user_id;
  ELSIF p_guide_key = 'recurring' THEN
    UPDATE public.user_guidance_state SET has_seen_recurring_guide = true, updated_at = now() WHERE user_id = v_user_id;
  ELSE
    RAISE EXCEPTION 'Unknown guide key';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_guide_seen(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_guide_seen(TEXT) TO authenticated;
