-- Migration: Add client_details JSONB column to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_details JSONB NOT NULL DEFAULT '{}'::jsonb;
