-- 1. Create ACR Progress Status Config table
CREATE TABLE IF NOT EXISTS public.acr_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#cbd5e1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create ACR Processors Config table
CREATE TABLE IF NOT EXISTS public.acr_processors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#cbd5e1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create ACR Requests tracker table
CREATE TABLE IF NOT EXISTS public.acr_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_owner TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  date_processed TEXT,
  progress_id UUID REFERENCES public.acr_progress(id) ON DELETE SET NULL,
  processed_by_id UUID REFERENCES public.acr_processors(id) ON DELETE SET NULL,
  comments TEXT DEFAULT '',
  agent_confirmation TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create ACR Files table for uploaded documents
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

-- Create Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_acr_requests_policy_owner ON public.acr_requests(policy_owner);
CREATE INDEX IF NOT EXISTS idx_acr_requests_policy_number ON public.acr_requests(policy_number);
CREATE INDEX IF NOT EXISTS idx_acr_requests_progress_id ON public.acr_requests(progress_id);
CREATE INDEX IF NOT EXISTS idx_acr_requests_processed_by_id ON public.acr_requests(processed_by_id);
CREATE INDEX IF NOT EXISTS idx_acr_files_request_id ON public.acr_files(request_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.acr_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acr_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acr_files ENABLE ROW LEVEL SECURITY;

-- Generate SELECT, INSERT, UPDATE, DELETE policies for ACR Progress
CREATE POLICY "Allow select for all on acr_progress" ON public.acr_progress FOR SELECT USING (true);
CREATE POLICY "Allow insert for all on acr_progress" ON public.acr_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all on acr_progress" ON public.acr_progress FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for all on acr_progress" ON public.acr_progress FOR DELETE USING (true);

-- Generate SELECT, INSERT, UPDATE, DELETE policies for ACR Processors
CREATE POLICY "Allow select for all on acr_processors" ON public.acr_processors FOR SELECT USING (true);
CREATE POLICY "Allow insert for all on acr_processors" ON public.acr_processors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all on acr_processors" ON public.acr_processors FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for all on acr_processors" ON public.acr_processors FOR DELETE USING (true);

-- Generate SELECT, INSERT, UPDATE, DELETE policies for ACR Requests
CREATE POLICY "Allow select for all on acr_requests" ON public.acr_requests FOR SELECT USING (true);
CREATE POLICY "Allow insert for all on acr_requests" ON public.acr_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all on acr_requests" ON public.acr_requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for all on acr_requests" ON public.acr_requests FOR DELETE USING (true);

-- Generate SELECT, INSERT, UPDATE, DELETE policies for ACR Files
CREATE POLICY "Allow select for all on acr_files" ON public.acr_files FOR SELECT USING (true);
CREATE POLICY "Allow insert for all on acr_files" ON public.acr_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all on acr_files" ON public.acr_files FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for all on acr_files" ON public.acr_files FOR DELETE USING (true);
