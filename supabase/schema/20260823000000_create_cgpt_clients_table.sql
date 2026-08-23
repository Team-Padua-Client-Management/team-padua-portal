-- Create CGPT clients table for Client Greetings & Presentation Tracker (CGPT)
CREATE TABLE IF NOT EXISTS public.cgpt_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID REFERENCES public.advisors(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  relationship TEXT DEFAULT '',
  policy_number TEXT,
  product TEXT,
  approval_date TEXT,
  annual_premium NUMERIC(15, 2) DEFAULT 0.00,
  mobile_number TEXT,
  email TEXT,
  address TEXT,
  beneficiary TEXT,
  fund_allocation TEXT,
  mode_of_payment TEXT DEFAULT 'Annual',
  birthdate TEXT,
  signature_data TEXT,
  id_type TEXT,
  id_number TEXT,
  id_expiration_date TEXT,
  id_attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for fast filtering and searching
CREATE INDEX IF NOT EXISTS idx_cgpt_clients_advisor_id ON public.cgpt_clients(advisor_id);
CREATE INDEX IF NOT EXISTS idx_cgpt_clients_client_name ON public.cgpt_clients(client_name);
CREATE INDEX IF NOT EXISTS idx_cgpt_clients_policy_number ON public.cgpt_clients(policy_number);
CREATE INDEX IF NOT EXISTS idx_cgpt_clients_birthdate ON public.cgpt_clients(birthdate);
CREATE INDEX IF NOT EXISTS idx_cgpt_clients_created_at ON public.cgpt_clients(created_at);

-- Trigger for auto-updating updated_at if function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_modified_column') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cgpt_clients_modtime') THEN
      CREATE TRIGGER update_cgpt_clients_modtime
        BEFORE UPDATE ON public.cgpt_clients
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
  END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.cgpt_clients ENABLE ROW LEVEL SECURITY;

-- Policies for public and authenticated access
DROP POLICY IF EXISTS "Allow select on cgpt_clients" ON public.cgpt_clients;
CREATE POLICY "Allow select on cgpt_clients"
  ON public.cgpt_clients FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert on cgpt_clients" ON public.cgpt_clients;
CREATE POLICY "Allow insert on cgpt_clients"
  ON public.cgpt_clients FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on cgpt_clients" ON public.cgpt_clients;
CREATE POLICY "Allow update on cgpt_clients"
  ON public.cgpt_clients FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete on cgpt_clients" ON public.cgpt_clients;
CREATE POLICY "Allow delete on cgpt_clients"
  ON public.cgpt_clients FOR DELETE
  USING (true);
