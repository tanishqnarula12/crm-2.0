-- Migration: add kid name + edit history to goals
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
-- It is safe to re-run: each column is only added if it does not already exist.

ALTER TABLE public.goals
    ADD COLUMN IF NOT EXISTS kid_name TEXT;

ALTER TABLE public.goals
    ADD COLUMN IF NOT EXISTS history JSONB NOT NULL DEFAULT '[]'::jsonb;
