-- =========================================================================
-- DATABASE CONSOLIDATION MIGRATION - BUDGET FLOW
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
--
-- This script:
-- 1. Adds category_id, income_source_id, and recurring_expense_id to wallet_transactions
-- 2. Migrates existing daily_expenses and income_transactions to wallet_transactions
-- 3. Drops the old tables daily_expenses and income_transactions
-- =========================================================================

-- 1. Add new columns to wallet_transactions if they don't exist
DO $$
DECLARE
  v_cat_type text;
  v_inc_type text;
  v_rec_type text;
BEGIN
  -- Get the actual database types of the primary keys we are referencing
  SELECT data_type INTO v_cat_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'budget_categories' AND column_name = 'id';

  SELECT data_type INTO v_inc_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'income_sources' AND column_name = 'id';

  SELECT data_type INTO v_rec_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'recurring_expenses' AND column_name = 'id';

  -- Fallbacks to standard types if tables are not found
  v_cat_type := COALESCE(v_cat_type, 'bigint');
  v_inc_type := COALESCE(v_inc_type, 'uuid');
  v_rec_type := COALESCE(v_rec_type, 'bigint');

  -- First drop columns if they were created with incorrect types in a previous failed run
  EXECUTE 'ALTER TABLE wallet_transactions DROP COLUMN IF EXISTS category_id CASCADE';
  EXECUTE 'ALTER TABLE wallet_transactions DROP COLUMN IF EXISTS income_source_id CASCADE';
  EXECUTE 'ALTER TABLE wallet_transactions DROP COLUMN IF EXISTS recurring_expense_id CASCADE';

  -- Dynamic ALTER TABLE statements to match referenced PK data types exactly
  EXECUTE 'ALTER TABLE wallet_transactions ADD COLUMN category_id ' || v_cat_type || ' REFERENCES budget_categories(id) ON DELETE SET NULL';
  EXECUTE 'ALTER TABLE wallet_transactions ADD COLUMN income_source_id ' || v_inc_type || ' REFERENCES income_sources(id) ON DELETE SET NULL';
  EXECUTE 'ALTER TABLE wallet_transactions ADD COLUMN recurring_expense_id ' || v_rec_type || ' REFERENCES recurring_expenses(id) ON DELETE SET NULL';
END $$;

-- 2. Migrate existing daily_expenses to wallet_transactions (as type='expense', direction='out')
DO $$
DECLARE
  v_has_rec_col boolean;
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_expenses') THEN
    -- Check if daily_expenses has recurring_expense_id column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'daily_expenses' AND column_name = 'recurring_expense_id'
    ) INTO v_has_rec_col;

    IF v_has_rec_col THEN
      EXECUTE $migrate$
      INSERT INTO wallet_transactions (
        user_id,
        amount,
        direction,
        type,
        category_id,
        note,
        source,
        confidence,
        occurred_at,
        created_at,
        recurring_expense_id
      )
      SELECT
        user_id,
        amount,
        'out'::text,
        'expense'::text,
        category_id,
        note,
        'manual'::text,
        1.0,
        -- Convert YYYY-MM-DD to timestamptz at noon to avoid timezone shift errors
        (date || ' 12:00:00Z')::timestamptz,
        created_at,
        recurring_expense_id
      FROM daily_expenses
      $migrate$;
    ELSE
      EXECUTE $migrate$
      INSERT INTO wallet_transactions (
        user_id,
        amount,
        direction,
        type,
        category_id,
        note,
        source,
        confidence,
        occurred_at,
        created_at,
        recurring_expense_id
      )
      SELECT
        user_id,
        amount,
        'out'::text,
        'expense'::text,
        category_id,
        note,
        'manual'::text,
        1.0,
        -- Convert YYYY-MM-DD to timestamptz at noon to avoid timezone shift errors
        (date || ' 12:00:00Z')::timestamptz,
        created_at,
        NULL
      FROM daily_expenses
      $migrate$;
    END IF;
  END IF;
END $$;

-- 3. Migrate existing income_transactions to wallet_transactions (as type='income', direction='in')
DO $$
DECLARE
  v_note_col text;
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'income_transactions') THEN
    -- Check if income_transactions has notes or note column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'income_transactions' AND column_name = 'notes'
    ) THEN
      v_note_col := 'notes';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'income_transactions' AND column_name = 'note'
    ) THEN
      v_note_col := 'note';
    ELSE
      v_note_col := 'NULL::text';
    END IF;

    EXECUTE '
      INSERT INTO wallet_transactions (
        user_id,
        amount,
        direction,
        type,
        income_source_id,
        note,
        source,
        confidence,
        occurred_at,
        created_at
      )
      SELECT
        user_id,
        amount,
        ''in''::text,
        ''income''::text,
        income_source_id,
        ' || v_note_col || ',
        ''manual''::text,
        1.0,
        (date || '' 12:00:00Z'')::timestamptz,
        created_at
      FROM income_transactions
    ';
  END IF;
END $$;

-- 4. Drop the old disconnected tables
DROP TABLE IF EXISTS daily_expenses CASCADE;
DROP TABLE IF EXISTS income_transactions CASCADE;

-- 5. Recreate/verify recalculate Trigger logic (which is already bound to wallet_transactions)
-- This ensures wallets are automatically updated for ALL transaction mutations.
