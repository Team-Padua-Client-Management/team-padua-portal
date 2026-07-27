-- Reinstatement SRO Requests
CREATE TABLE IF NOT EXISTS public.reinstatement_sro_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.cpst_clients(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Pending',
  date_submitted TEXT,
  comments TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reinstatement PDI Requests
CREATE TABLE IF NOT EXISTS public.reinstatement_pdi_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.cpst_clients(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Pending',
  date_submitted TEXT,
  comments TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for the tables
ALTER TABLE public.reinstatement_sro_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reinstatement_pdi_requests ENABLE ROW LEVEL SECURITY;

-- Enable SELECT/WRITE for authenticated role
CREATE POLICY "Allow all for authenticated on reinstatement_sro_requests" 
ON public.reinstatement_sro_requests 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated on reinstatement_pdi_requests" 
ON public.reinstatement_pdi_requests 
FOR ALL USING (auth.role() = 'authenticated');
