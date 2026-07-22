const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("--- Updating Tasks and Task Comments Schema ---");

  // We can try calling postgres via rpc if available, or query directly to add missing columns safely
  // Let's test if we can run raw SQL or alter table columns via RPC, or if columns can be added via supabase client / sql migration
  const { data, error } = await supabase.rpc('exec_sql', { sql: `
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Others';
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

    CREATE TABLE IF NOT EXISTS public.task_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
      user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE public.task_comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    ALTER TABLE public.task_comments ADD COLUMN IF NOT EXISTS comment TEXT;
    ALTER TABLE public.task_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  `});

  if (error) {
    console.log("RPC exec_sql not present or error:", error.message);
  } else {
    console.log("Schema update via RPC successful!");
  }
}

run();
