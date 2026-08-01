CREATE TABLE IF NOT EXISTS public.ada_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.cpst_clients(id),
    status text DEFAULT 'Pending',
    date_submitted date DEFAULT CURRENT_DATE,
    bank_type text, -- 'BPI' or 'BDO'
    bank_account_number text,
    comments text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ada_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated on ada_requests" ON public.ada_requests FOR ALL USING (auth.role() = 'authenticated');
