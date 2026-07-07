-- =========================================================================
-- ENTERPRISE ANNOUNCEMENT SYSTEM SCHEMA MIGRATION
-- Run this script in your Supabase SQL Editor
-- =========================================================================

-- 1. Update public.announcements table with location, event, and settings fields
ALTER TABLE public.announcements 
  ADD COLUMN IF NOT EXISTS location_name TEXT,
  ADD COLUMN IF NOT EXISTS location_address TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS google_place_id TEXT,
  ADD COLUMN IF NOT EXISTS event_date DATE,
  ADD COLUMN IF NOT EXISTS start_time TEXT,
  ADD COLUMN IF NOT EXISTS end_time TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS visibility_type TEXT DEFAULT 'Public',
  ADD COLUMN IF NOT EXISTS send_push_notification BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS send_dashboard_notification BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_acknowledgement BOOLEAN DEFAULT false;

-- 2. Create announcement_attachments table
CREATE TABLE IF NOT EXISTS public.announcement_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on attachments
ALTER TABLE public.announcement_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to attachments" 
  ON public.announcement_attachments FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access to attachments" 
  ON public.announcement_attachments FOR ALL USING (auth.role() = 'authenticated');

-- 3. Create announcement_acknowledgements table
CREATE TABLE IF NOT EXISTS public.announcement_acknowledgements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(announcement_id, user_id)
);

-- Enable RLS on acknowledgements
ALTER TABLE public.announcement_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read acknowledgements" 
  ON public.announcement_acknowledgements FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert to acknowledgements" 
  ON public.announcement_acknowledgements FOR INSERT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete their own acknowledgements" 
  ON public.announcement_acknowledgements FOR DELETE USING (auth.uid() = user_id);

-- 4. Enable Supabase Realtime for these tables
-- Clean up old publication if exists to prevent duplicates
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.announcements;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.announcement_attachments;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.announcement_acknowledgements;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.notifications;

-- Re-add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_acknowledgements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 5. Configure Supabase Storage Bucket for announcements
INSERT INTO storage.buckets (id, name, public) 
VALUES ('announcements', 'announcements', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Allow public read access to announcements storage" 
  ON storage.objects FOR SELECT USING (bucket_id = 'announcements');

CREATE POLICY "Allow authenticated full access to announcements storage" 
  ON storage.objects FOR ALL USING (auth.role() = 'authenticated');
