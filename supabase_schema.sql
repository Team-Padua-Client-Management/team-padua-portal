-- =========================================================================
-- SUPABASE DATABASE SCHEMA SETUP
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- to create all the required tables, triggers, and relationships.
-- =========================================================================

-- Enable UUID generation extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'Member',
  department TEXT DEFAULT 'General',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create a profile record when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, department)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'Member',
    'General'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync existing auth.users to profiles if any
INSERT INTO public.profiles (id, full_name, email, role, department)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'User'), 
  email, 
  'Member', 
  'General'
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- 2. ADDITIONAL TABLES FOR USER DASHBOARDS (Roles, Team Members)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  progress INTEGER DEFAULT 0,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  attendance_date DATE NOT NULL,
  time_in TEXT,
  break_out TEXT,
  break_in TEXT,
  time_out TEXT,
  total_hours NUMERIC(4, 2) DEFAULT 0.00,
  daily_record TEXT,
  admin_feedback TEXT,
  status TEXT DEFAULT 'Absent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, attendance_date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attendance records"
  ON public.attendance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance records"
  ON public.attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance records"
  ON public.attendance FOR UPDATE
  USING (auth.uid() = user_id);

-- =========================================================================
-- 7. CLIENTS TABLE (CPST - Client Prospect Servicing Tracker)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  relationship TEXT DEFAULT '',
  birthdate TEXT NOT NULL,
  status TEXT DEFAULT 'Prospect' CHECK (status IN ('Prospect', 'Serviced', 'Lead')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to clients"
  ON public.clients
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- =========================================================================
-- 8. ANNOUNCEMENTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Published',
  audience TEXT[] DEFAULT ARRAY['All Members']::TEXT[],
  content TEXT,
  author TEXT DEFAULT 'Admin',
  is_pinned BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  read_rate INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  publish_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to announcements" 
  ON public.announcements FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access to announcements" 
  ON public.announcements FOR ALL USING (auth.role() = 'authenticated');


-- =========================================================================
-- 9. FAQS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  audience TEXT DEFAULT 'All Users',
  views INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Published',
  is_pinned BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  updated_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to faqs" 
  ON public.faqs FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access to faqs" 
  ON public.faqs FOR ALL USING (auth.role() = 'authenticated');


-- =========================================================================
-- 10. NOTIFICATIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own or global notifications" 
  ON public.notifications FOR SELECT 
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Allow authenticated write access to notifications" 
  ON public.notifications FOR ALL 
  USING (auth.role() = 'authenticated');


-- =========================================================================
-- 11. ACR (Advisor Change Request) TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.acr_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#cbd5e1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.acr_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to acr_progress"
  ON public.acr_progress FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.acr_processors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#cbd5e1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.acr_processors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to acr_processors"
  ON public.acr_processors FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.acr_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_owner TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  date_processed TEXT,
  progress_id UUID REFERENCES public.acr_progress(id) ON DELETE SET NULL,
  processed_by_id UUID REFERENCES public.acr_processors(id) ON DELETE SET NULL,
  comments TEXT DEFAULT '',
  agent_confirmation TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.acr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to acr_requests"
  ON public.acr_requests FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.acr_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.acr_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.acr_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to acr_files"
  ON public.acr_files FOR ALL USING (true) WITH CHECK (true);


-- =========================================================================
-- 12. CALENDAR EVENTS TABLE (Admin Operations Calendar)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE NOT NULL,
  start_time TIME DEFAULT '00:00:00',
  location_name TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to calendar_events"
  ON public.calendar_events FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access to calendar_events"
  ON public.calendar_events FOR ALL USING (auth.role() = 'authenticated');


-- =========================================================================
-- 13. PORTAL CATEGORIES & RESOURCES TABLES (Reusable Portal Management)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.portal_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.portal_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.portal_categories(id) ON DELETE SET NULL,
  portal_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail TEXT,
  favorite BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Hidden', 'Archived')),
  display_order INTEGER DEFAULT 0,
  created_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portal_resources_portal_slug ON public.portal_resources(portal_slug);
CREATE INDEX IF NOT EXISTS idx_portal_resources_category_id ON public.portal_resources(category_id);
CREATE INDEX IF NOT EXISTS idx_portal_resources_favorite ON public.portal_resources(favorite);

ALTER TABLE public.portal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for all on portal_categories" ON public.portal_categories FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users on portal_categories" ON public.portal_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users on portal_categories" ON public.portal_categories FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users on portal_categories" ON public.portal_categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow select for all on portal_resources" ON public.portal_resources FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users on portal_resources" ON public.portal_resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users on portal_resources" ON public.portal_resources FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users on portal_resources" ON public.portal_resources FOR DELETE USING (auth.role() = 'authenticated');



