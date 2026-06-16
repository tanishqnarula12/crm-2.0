-- Migration: add "Create Log" actuals tracking to goals
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
-- It is safe to re-run: the column is only added if it does not already exist.
--
-- Stores an array of logged actual portfolio values, e.g.
--   [{ "id": "id_abc123", "date": "2030-06-15", "amount": 1250000 }]

ALTER TABLE public.goals
    ADD COLUMN IF NOT EXISTS actuals JSONB NOT NULL DEFAULT '[]'::jsonb;
