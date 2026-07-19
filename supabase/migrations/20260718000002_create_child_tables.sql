-- 1. Client Policy Cards
CREATE TABLE IF NOT EXISTS public.client_policy_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  date_processed TEXT,
  digital_basic_id UUID REFERENCES public.cpc_options(id) ON DELETE SET NULL,
  digital_premium_id UUID REFERENCES public.cpc_options(id) ON DELETE SET NULL,
  hard_copy_id UUID REFERENCES public.cpc_options(id) ON DELETE SET NULL,
  processed_by_id UUID REFERENCES public.cpc_processors(id) ON DELETE SET NULL,
  comments TEXT DEFAULT '',
  signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Premium Payments
CREATE TABLE IF NOT EXISTS public.premium_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  date_processed TEXT,
  ready_send_date TEXT,
  status_id UUID REFERENCES public.ppu_options(id) ON DELETE SET NULL,
  updated_by_id UUID REFERENCES public.ppu_processors(id) ON DELETE SET NULL,
  sent_by_id UUID REFERENCES public.ppu_processors(id) ON DELETE SET NULL,
  comments TEXT DEFAULT '',
  signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Social Media Visibility
CREATE TABLE IF NOT EXISTS public.social_visibility_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  facebook_profile TEXT,
  instagram_profile TEXT,
  linkedin_profile TEXT,
  last_activity TEXT,
  visibility_status TEXT DEFAULT 'Visible' CHECK (visibility_status IN ('Visible', 'Inactive', 'Private')),
  notes TEXT DEFAULT '',
  signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Advisor Change Requests
CREATE TABLE IF NOT EXISTS public.advisor_change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  date_processed TEXT,
  progress_id UUID REFERENCES public.acr_progress(id) ON DELETE SET NULL,
  processed_by_id UUID REFERENCES public.acr_processors(id) ON DELETE SET NULL,
  comments TEXT DEFAULT '',
  agent_confirmation TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Beneficiary Change Requests
CREATE TABLE IF NOT EXISTS public.beneficiary_change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'Pending',
  date_submitted TEXT,
  comments TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Fund Switching Requests
CREATE TABLE IF NOT EXISTS public.fund_switching_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  date_processed TEXT,
  progress_id UUID REFERENCES public.fst_progress(id) ON DELETE SET NULL,
  processed_by_id UUID REFERENCES public.fst_processors(id) ON DELETE SET NULL,
  comments TEXT DEFAULT '',
  signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Fund Withdrawal Requests
CREATE TABLE IF NOT EXISTS public.fund_withdrawal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'Pending',
  date_submitted TEXT,
  amount NUMERIC(15, 2),
  comments TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Auto Change Arrangements
CREATE TABLE IF NOT EXISTS public.auto_change_arrangements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'Pending',
  date_submitted TEXT,
  comments TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Reinstatement SRO Requests
CREATE TABLE IF NOT EXISTS public.reinstatement_sro_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'Pending',
  date_submitted TEXT,
  comments TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Reinstatement PDI Requests
CREATE TABLE IF NOT EXISTS public.reinstatement_pdi_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'Pending',
  date_submitted TEXT,
  comments TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Advisor Daily Activities
CREATE TABLE IF NOT EXISTS public.advisor_daily_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  activity_date DATE NOT NULL,
  activity_type TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for all child tables
ALTER TABLE public.client_policy_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_visibility_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiary_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_switching_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_change_arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reinstatement_sro_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reinstatement_pdi_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_daily_activities ENABLE ROW LEVEL SECURITY;

-- Enable SELECT/WRITE for authenticated role on all child tables
CREATE POLICY "Allow all for authenticated on client_policy_cards" ON public.client_policy_cards FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated on premium_payments" ON public.premium_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated on social_visibility_records" ON public.social_visibility_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated on advisor_change_requests" ON public.advisor_change_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated on beneficiary_change_requests" ON public.beneficiary_change_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated on fund_switching_requests" ON public.fund_switching_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated on fund_withdrawal_requests" ON public.fund_withdrawal_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated on auto_change_arrangements" ON public.auto_change_arrangements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated on reinstatement_sro_requests" ON public.reinstatement_sro_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated on reinstatement_pdi_requests" ON public.reinstatement_pdi_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated on advisor_daily_activities" ON public.advisor_daily_activities FOR ALL USING (auth.role() = 'authenticated');
