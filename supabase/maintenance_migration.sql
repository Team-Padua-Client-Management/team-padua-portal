-- =========================================================================
-- MAINTENANCE SETTINGS TABLE
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- to create the maintenance_settings table and seed module keys.
-- =========================================================================

-- Create the maintenance_settings table
CREATE TABLE IF NOT EXISTS public.maintenance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for proxy/middleware to check maintenance status)
CREATE POLICY "Allow public read access to maintenance_settings"
  ON public.maintenance_settings FOR SELECT USING (true);

-- Allow authenticated users (admins) to update maintenance settings
CREATE POLICY "Allow authenticated full access to maintenance_settings"
  ON public.maintenance_settings FOR ALL USING (auth.role() = 'authenticated');

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_settings;

-- Seed all module keys
INSERT INTO public.maintenance_settings (module_key, enabled) VALUES
  ('full_system', false),
  ('dashboard', false),
  ('calendar', false),
  ('attendance', false),
  ('messages', false),
  ('faq', false),
  ('teams', false),
  ('members', false),
  ('profile', false),
  ('client_servicing', false),
  ('acr', false),
  ('bcr', false),
  ('aca', false),
  ('fund_switching', false),
  ('fund_withdrawal', false),
  ('reinstatement', false),
  ('sro', false),
  ('pdi', false),
  ('cpst', false)
ON CONFLICT (module_key) DO NOTHING;
