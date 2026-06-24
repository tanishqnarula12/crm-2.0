-- Migration: add moms table for meeting minutes tracking
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
-- It is safe to re-run.

CREATE TABLE IF NOT EXISTS public.moms (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    meeting_number TEXT,
    meeting_date TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.moms ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (similar to clients/goals)
CREATE POLICY "Allow anonymous read access on moms" ON public.moms
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access on moms" ON public.moms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access on moms" ON public.moms
    FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete access on moms" ON public.moms
    FOR DELETE USING (true);
