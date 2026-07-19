CREATE TABLE IF NOT EXISTS advisor_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES cpst_clients(id) ON DELETE CASCADE,
  -- Section A
  company_name text,
  designation text,
  -- Section B
  request_type text, -- 'specific_policy' | 'all_accounts'
  policy_numbers text,
  account_individual_life boolean DEFAULT false,
  account_group_life boolean DEFAULT false,
  account_mutual_fund boolean DEFAULT false,
  account_pre_need boolean DEFAULT false,
  reference_policy_number text,
  -- Section C
  reason_type text, -- 'no_advisor' | 'prefer_another'
  reason_details text,
  -- Section D
  new_advisor_last_name text,
  new_advisor_first_name text,
  new_advisor_middle_name text,
  -- Section E
  place_of_signing text,
  date_of_signing date,
  policy_owner_signature text,
  new_advisor_signature text,
  code_number text,
  nbo_iso text,
  -- Section F.2
  wants_communication boolean,
  -- Section G (office use)
  received_by_staff text,
  receiving_department text,
  date_received date,
  time_received text,
  status text DEFAULT 'Pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acr_client_id ON advisor_change_requests(client_id);
