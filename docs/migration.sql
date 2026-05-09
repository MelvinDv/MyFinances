-- Migration: soft delete, sort_order, and profile preferences
-- Run in Supabase → SQL Editor

-- ============================================================
-- 1. accounts — soft delete + sort order
-- ============================================================
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS is_active  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer;

-- Back-fill sort_order for existing rows (per user, oldest first = 0)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 AS rn
  FROM accounts
)
UPDATE accounts
SET    sort_order = ranked.rn
FROM   ranked
WHERE  accounts.id = ranked.id
  AND  accounts.sort_order IS NULL;

-- ============================================================
-- 2. categories — soft delete + sort order + default flag
-- ============================================================
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_active  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- Back-fill sort_order for existing rows (per user, oldest first = 0)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 AS rn
  FROM categories
)
UPDATE categories
SET    sort_order = ranked.rn
FROM   ranked
WHERE  categories.id = ranked.id
  AND  categories.sort_order IS NULL;

-- ============================================================
-- 3. profiles — user preferences
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name         text,
  ADD COLUMN IF NOT EXISTS currency          text    NOT NULL DEFAULT 'MXN',
  ADD COLUMN IF NOT EXISTS language          text    NOT NULL DEFAULT 'es',
  ADD COLUMN IF NOT EXISTS dark_mode         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_decimals     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS budget_alerts     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS monthly_summary   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_reminders boolean NOT NULL DEFAULT true;

-- ============================================================
-- 4. transactions — category_id FK (if not already present)
-- ============================================================
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL;

-- ============================================================
-- 5. recurring_transactions — category_id FK (if not already present)
-- ============================================================
ALTER TABLE recurring_transactions
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
