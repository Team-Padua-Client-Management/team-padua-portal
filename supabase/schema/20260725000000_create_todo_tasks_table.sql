-- =========================================================================
-- SUPABASE DATABASE SCHEMA MIGRATION: PERSONAL TO-DO TASKS (public.todo_tasks)
-- & CLIENT SERVICING TASKS (public.client_servicing_tasks)
-- =========================================================================

-- 1. Create personal todo_tasks table for To-Do Widget
CREATE TABLE IF NOT EXISTS public.todo_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled To-Do',
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist on todo_tasks table
ALTER TABLE public.todo_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.todo_tasks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.todo_tasks ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Untitled To-Do';
ALTER TABLE public.todo_tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.todo_tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.todo_tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE public.todo_tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.todo_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Indexes for fast query
CREATE INDEX IF NOT EXISTS idx_todo_tasks_user_id ON public.todo_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_created_by ON public.todo_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_created_at ON public.todo_tasks(created_at DESC);

-- RLS Policies
ALTER TABLE public.todo_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable full access to todo_tasks for authenticated users" ON public.todo_tasks;

CREATE POLICY "Enable full access to todo_tasks for authenticated users"
  ON public.todo_tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Supabase Realtime publication on public.todo_tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'todo_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.todo_tasks;
  END IF;
END $$;


-- 2. Create client_servicing_tasks table for Client Servicing Monitoring
CREATE TABLE IF NOT EXISTS public.client_servicing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Task',
  client_name TEXT,
  service_type TEXT,
  notes TEXT,
  category TEXT DEFAULT 'Others',
  status TEXT DEFAULT 'Pending',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.client_servicing_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable full access to client_servicing_tasks for authenticated users" ON public.client_servicing_tasks;

CREATE POLICY "Enable full access to client_servicing_tasks for authenticated users"
  ON public.client_servicing_tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Supabase Realtime publication on public.client_servicing_tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'client_servicing_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.client_servicing_tasks;
  END IF;
END $$;
