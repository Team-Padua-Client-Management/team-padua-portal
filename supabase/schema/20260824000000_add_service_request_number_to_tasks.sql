-- =========================================================================
-- SUPABASE DATABASE SCHEMA MIGRATION: ADD SERVICE REQUEST NUMBER
-- =========================================================================
-- Adds service_request_number column and index to public.client_servicing_tasks
-- and public.tasks tables.
-- =========================================================================

ALTER TABLE public.client_servicing_tasks ADD COLUMN IF NOT EXISTS service_request_number TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS service_request_number TEXT;

CREATE INDEX IF NOT EXISTS idx_client_servicing_tasks_sr_num ON public.client_servicing_tasks(service_request_number);
CREATE INDEX IF NOT EXISTS idx_tasks_sr_num ON public.tasks(service_request_number);
