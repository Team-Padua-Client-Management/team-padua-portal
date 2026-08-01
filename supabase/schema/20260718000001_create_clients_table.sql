-- Drop old clients table if it exists
DROP TABLE IF EXISTS public.clients CASCADE;

-- Create unified clients table
CREATE TABLE public.clients (
  id TEXT PRIMARY KEY,
  client_code TEXT,
  client_name TEXT NOT NULL,
  relationship TEXT DEFAULT '',
  policy_number TEXT UNIQUE,
  product TEXT,
  advisor TEXT,
  approval_date TEXT,
  annual_premium NUMERIC(15, 2) DEFAULT 0.00,
  mobile_number TEXT,
  email TEXT,
  address TEXT,
  beneficiary TEXT,
  fund_allocation TEXT,
  mode_of_payment TEXT,
  status TEXT DEFAULT 'Prospect',
  birthday TEXT,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Select/Read policy for authenticated users
CREATE POLICY "Allow select for authenticated on clients" 
  ON public.clients FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Write/Modify policies for authenticated users
CREATE POLICY "Allow insert for authenticated on clients" 
  ON public.clients FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated on clients" 
  ON public.clients FOR UPDATE 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated on clients" 
  ON public.clients FOR DELETE 
  USING (auth.role() = 'authenticated');
