-- Add display_order and last_seen_at columns to profiles table for Member Management
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Create index for fast ordered queries
CREATE INDEX IF NOT EXISTS idx_profiles_display_order ON public.profiles(display_order);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at ON public.profiles(last_seen_at);
