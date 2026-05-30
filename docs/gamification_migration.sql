-- SQL MIGRATION: SYSTEM GAMIFIKASI (STREAK, KOIN, EXCLUSIONS)
-- Jalankan query ini di SQL Editor dashboard Supabase kamu.

-- 1. Buat tabel user_gamification
CREATE TABLE IF NOT EXISTS public.user_gamification (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 0 NOT NULL,
    longest_streak INT DEFAULT 0 NOT NULL,
    coins INT DEFAULT 0 NOT NULL,
    streak_freezes INT DEFAULT 0 NOT NULL,
    last_streak_date DATE,
    last_coin_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

-- Buat Policy Keamanan RLS
CREATE POLICY "Users can view their own gamification data"
    ON public.user_gamification
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamification data"
    ON public.user_gamification
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification data"
    ON public.user_gamification
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Tambah kolom exclude_from_daily_streak di tabel budget_categories jika belum ada
ALTER TABLE public.budget_categories
ADD COLUMN IF NOT EXISTS exclude_from_daily_streak BOOLEAN DEFAULT false NOT NULL;

-- 3. Otomatis set True untuk kategori wajib/darurat/investasi yang umum
UPDATE public.budget_categories
SET exclude_from_daily_streak = true
WHERE name ILIKE ANY (ARRAY['%tagihan%', '%bill%', '%darurat%', '%emergency%', '%asuransi%', '%insurance%', '%cicilan%', '%investasi%', '%investment%']);
