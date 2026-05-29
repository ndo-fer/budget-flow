-- =======================================================
-- Budget Flow - Spotlight Guided Onboarding Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =======================================================

-- 1. ADD COLUMNS FOR SPOTLIGHT TOUR TO USER GUIDANCE STATE
ALTER TABLE public.user_guidance_state 
  ADD COLUMN IF NOT EXISTS has_completed_spotlight_tour BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_skipped_spotlight_tour BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spotlight_tour_step TEXT NULL,
  ADD COLUMN IF NOT EXISTS spotlight_tour_completed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS spotlight_tour_skipped_at TIMESTAMPTZ NULL;

-- 2. CREATE FUNCTION: mark_spotlight_tour_completed
CREATE OR REPLACE FUNCTION public.mark_spotlight_tour_completed()
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

  INSERT INTO public.user_guidance_state (
    user_id,
    has_completed_spotlight_tour,
    has_skipped_spotlight_tour,
    spotlight_tour_step,
    spotlight_tour_completed_at
  )
  VALUES (
    v_user_id,
    true,
    false,
    null,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    has_completed_spotlight_tour = true,
    has_skipped_spotlight_tour = false,
    spotlight_tour_step = null,
    spotlight_tour_completed_at = now(),
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.mark_spotlight_tour_completed() FROM public;
GRANT EXECUTE ON FUNCTION public.mark_spotlight_tour_completed() TO authenticated;


-- 3. CREATE FUNCTION: mark_spotlight_tour_skipped
CREATE OR REPLACE FUNCTION public.mark_spotlight_tour_skipped(p_step TEXT DEFAULT NULL)
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

  INSERT INTO public.user_guidance_state (
    user_id,
    has_completed_spotlight_tour,
    has_skipped_spotlight_tour,
    spotlight_tour_step,
    spotlight_tour_skipped_at
  )
  VALUES (
    v_user_id,
    false,
    true,
    p_step,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    has_skipped_spotlight_tour = true,
    spotlight_tour_step = p_step,
    spotlight_tour_skipped_at = now(),
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.mark_spotlight_tour_skipped(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_spotlight_tour_skipped(TEXT) TO authenticated;


-- 4. CREATE FUNCTION: save_spotlight_tour_step
CREATE OR REPLACE FUNCTION public.save_spotlight_tour_step(p_step TEXT)
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

  INSERT INTO public.user_guidance_state (
    user_id,
    spotlight_tour_step
  )
  VALUES (
    v_user_id,
    p_step
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    spotlight_tour_step = p_step,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.save_spotlight_tour_step(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.save_spotlight_tour_step(TEXT) TO authenticated;


-- 5. CREATE FUNCTION: reset_spotlight_tour
CREATE OR REPLACE FUNCTION public.reset_spotlight_tour()
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

  INSERT INTO public.user_guidance_state (
    user_id,
    has_completed_spotlight_tour,
    has_skipped_spotlight_tour,
    spotlight_tour_step,
    spotlight_tour_completed_at,
    spotlight_tour_skipped_at
  )
  VALUES (
    v_user_id,
    false,
    false,
    null,
    null,
    null
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    has_completed_spotlight_tour = false,
    has_skipped_spotlight_tour = false,
    spotlight_tour_step = null,
    spotlight_tour_completed_at = null,
    spotlight_tour_skipped_at = null,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.reset_spotlight_tour() FROM public;
GRANT EXECUTE ON FUNCTION public.reset_spotlight_tour() TO authenticated;
