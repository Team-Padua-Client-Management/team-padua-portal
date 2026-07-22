-- =========================================================================
-- SUPABASE DATABASE SCHEMA MIGRATION: CLIENT SERVICING MONITORING (public.tasks)
-- =========================================================================
-- Full enterprise schema, indexes, RLS policies, and Realtime publication
-- for Team Padua Client Servicing Monitoring.
-- =========================================================================

-- 1. Create or ensure tasks table exists
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Task',
  notes TEXT,
  category TEXT DEFAULT 'Others',
  status TEXT DEFAULT 'Pending',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Ensure all required columns exist on tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Untitled Task';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Others';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. Indexes for fast search, dashboard queries, and sorting
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON public.tasks(updated_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop old restrictive policies if present
DROP POLICY IF EXISTS "Users can read own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Enable full access for authenticated users to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Enable read access to tasks for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable insert access to tasks for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable update access to tasks for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable delete access to tasks for authenticated users" ON public.tasks;

-- 5. Enterprise RLS Policies supporting Admin & Bizdev task assignments
CREATE POLICY "Enable read access to tasks for authenticated users"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access to tasks for authenticated users"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access to tasks for authenticated users"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access to tasks for authenticated users"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (true);

-- 6. Enable Supabase Realtime publication on public.tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;
END $$;
