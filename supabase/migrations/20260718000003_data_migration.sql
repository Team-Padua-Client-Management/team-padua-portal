-- 1. Backfill clients from existing client_management
INSERT INTO public.clients (
  id, client_name, relationship, policy_number, product, approval_date,
  annual_premium, mobile_number, email, address, beneficiary, fund_allocation,
  mode_of_payment, status, created_at
)
SELECT 
  id, "clientName", relationship, "policyNumber", product, "approvalDate",
  "annualPremium", "mobileNumber", email, address, beneficiary, "fundAllocation",
  "modeOfPayment", 'Prospect', COALESCE(created_at, now())
FROM public.client_management
ON CONFLICT (policy_number) DO NOTHING;

-- 2. Backfill clients from child tables that aren't already present
-- (e.g. cpc_records, ppu_records, acr_requests, fst_requests)
INSERT INTO public.clients (
  id, client_name, policy_number, status
)
SELECT 
  'CAMS-' || floor(random() * 900000 + 100000)::text,
  policy_owner,
  policy_number,
  'Prospect'
FROM (
  SELECT policy_owner, policy_number FROM public.cpc_records
  UNION
  SELECT policy_owner, policy_number FROM public.ppu_records
  UNION
  SELECT policy_owner, policy_number FROM public.acr_requests
  UNION
  SELECT policy_owner, policy_number FROM public.fst_requests
) sub
ON CONFLICT (policy_number) DO NOTHING;

-- 3. Load active data into the new tables mapping policy_owner/policy_number to client_id
INSERT INTO public.client_policy_cards (
  id, client_id, date_processed, digital_basic_id, digital_premium_id, hard_copy_id, processed_by_id, comments, signature_data, created_at
)
SELECT 
  r.id, c.id, r.date_processed, r.digital_basic_id, r.digital_premium_id, r.hard_copy_id, r.processed_by_id, r.comments, r."signatureData", r.created_at
FROM public.cpc_records r
JOIN public.clients c ON c.policy_number = r.policy_number
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.premium_payments (
  id, client_id, date_processed, ready_send_date, status_id, updated_by_id, sent_by_id, comments, signature_data, created_at
)
SELECT 
  r.id, c.id, r.date_processed, r.ready_send_date, r.status_id, r.updated_by_id, r.sent_by_id, r.comments, r."signatureData", r.created_at
FROM public.ppu_records r
JOIN public.clients c ON c.policy_number = r.policy_number
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.advisor_change_requests (
  id, client_id, date_processed, progress_id, processed_by_id, comments, agent_confirmation, created_at
)
SELECT 
  r.id, c.id, r.date_processed, r.progress_id, r.processed_by_id, r.comments, r.agent_confirmation, r.created_at
FROM public.acr_requests r
JOIN public.clients c ON c.policy_number = r.policy_number
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.fund_switching_requests (
  id, client_id, date_processed, progress_id, processed_by_id, comments, signature_data, created_at
)
SELECT 
  r.id, c.id, r.date_processed, r.progress_id, r.processed_by_id, r.comments, r."signatureData", r.created_at
FROM public.fst_requests r
JOIN public.clients c ON c.policy_number = r.policy_number
ON CONFLICT (id) DO NOTHING;
