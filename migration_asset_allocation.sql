-- Migration: add per-client asset allocation (net worth) tracking
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
-- It is safe to re-run: the column is only added if it does not already exist.
--
-- Stores a single allocation object per client, e.g.
--   {
--     "values": {
--       "financial":   { "Equity Mutual Funds": 200000, "Fixed Deposits (FDs)": 500000 },
--       "physical":    { "Residential Real Estate": 15000000 },
--       "liabilities": { "Home Loan": 4000000 }
--     },
--     "custom": {
--       "financial":   [{ "id": "id_abc", "label": "Foreign Brokerage", "amount": 120000 }],
--       "physical":    [],
--       "liabilities": []
--     },
--     "remark": "Rebalance equity in Q3",
--     "history": [{ "at": "2026-06-16T10:00:00.000Z", "changes": [ ... ] }],
--     "updatedAt": "2026-06-16T10:00:00.000Z"
--   }

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS asset_allocation JSONB NOT NULL DEFAULT '{}'::jsonb;
