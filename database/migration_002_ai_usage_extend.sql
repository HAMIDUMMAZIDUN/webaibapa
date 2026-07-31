-- Migration 002: Extend ai_usage table for P-26 compliance
-- Date: 28 Juli 2026
-- Patch: T-08 (TINGGI) — Add model, feature, request_id, latency, status, cache_hit columns

-- Add new columns to ai_usage (idempotent)
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'gpt-4o-mini';
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS feature TEXT DEFAULT 'Umum';
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS request_id TEXT DEFAULT '';
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS latency_ms INTEGER DEFAULT 0;
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success';
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS cache_hit BOOLEAN DEFAULT false;

-- Allow user_id to be nullable (for anonymous/server-side logging)
ALTER TABLE ai_usage ALTER COLUMN user_id DROP NOT NULL;

-- Add check constraint for status values (safe idempotent approach)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_usage_status_check'
    ) THEN
        ALTER TABLE ai_usage ADD CONSTRAINT ai_usage_status_check
            CHECK (status IN ('success', 'error', 'timeout', 'cached'));
    END IF;
END $$;

-- Update RLS policy to allow inserts without user_id (server-side logging)
DROP POLICY IF EXISTS "System/Users can insert usage logs" ON ai_usage;
CREATE POLICY "Allow usage log inserts"
ON ai_usage FOR INSERT
WITH CHECK (true);

-- Keep SELECT restricted to own data
-- (existing policy "Users can view their own usage" remains unchanged)

-- Create index for performance on common queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage (user_id);
