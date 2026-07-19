-- 1. Create the trigger function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Client Policy Card
CREATE TABLE IF NOT EXISTS policy_cards (
    id uuid primary key default gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES cpst_clients(id) ON DELETE CASCADE,
    date_processed date,
    digital_basic_status text,
    digital_premium_status text,
    hard_copy_status text,
    processed_by_id uuid,
    comments text,
    signature_data text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Premium Payment
CREATE TABLE IF NOT EXISTS premium_payments (
    id uuid primary key default gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES cpst_clients(id) ON DELETE CASCADE,
    payment_date date,
    amount numeric,
    mode_of_payment text,
    status text default 'Pending' CHECK (status IN ('Draft', 'Pending', 'Processing', 'Completed', 'Cancelled')),
    processed_by_id uuid,
    comments text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Client Social Media Visibility
CREATE TABLE IF NOT EXISTS social_media_visibility (
    id uuid primary key default gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES cpst_clients(id) ON DELETE CASCADE,
    platform text,
    visibility_status text default 'Pending' CHECK (visibility_status IN ('Draft', 'Pending', 'Processing', 'Completed', 'Cancelled')),
    date_checked date,
    processed_by_id uuid,
    comments text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Advisor Change Request
CREATE TABLE IF NOT EXISTS advisor_change_requests (
    id uuid primary key default gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES cpst_clients(id) ON DELETE CASCADE,
    request_date date,
    new_advisor_name text,
    status text default 'Draft' CHECK (status IN ('Draft', 'Pending', 'Processing', 'Completed', 'Cancelled')),
    processed_by_id uuid,
    comments text,
    signature_data text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Beneficiary Change Request
CREATE TABLE IF NOT EXISTS beneficiary_change_requests (
    id uuid primary key default gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES cpst_clients(id) ON DELETE CASCADE,
    request_date date,
    new_beneficiary text,
    relationship text,
    status text default 'Draft' CHECK (status IN ('Draft', 'Pending', 'Processing', 'Completed', 'Cancelled')),
    processed_by_id uuid,
    comments text,
    signature_data text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Fund Switching
CREATE TABLE IF NOT EXISTS fund_switching_requests (
    id uuid primary key default gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES cpst_clients(id) ON DELETE CASCADE,
    request_date date,
    from_fund text,
    to_fund text,
    amount numeric,
    status text default 'Draft' CHECK (status IN ('Draft', 'Pending', 'Processing', 'Completed', 'Cancelled')),
    processed_by_id uuid,
    comments text,
    signature_data text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Fund Withdrawal
CREATE TABLE IF NOT EXISTS fund_withdrawal_requests (
    id uuid primary key default gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES cpst_clients(id) ON DELETE CASCADE,
    request_date date,
    fund_name text,
    amount numeric,
    status text default 'Draft' CHECK (status IN ('Draft', 'Pending', 'Processing', 'Completed', 'Cancelled')),
    processed_by_id uuid,
    comments text,
    signature_data text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Auto Change Arrangement
CREATE TABLE IF NOT EXISTS auto_change_arrangements (
    id uuid primary key default gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES cpst_clients(id) ON DELETE CASCADE,
    request_date date,
    arrangement_details text,
    status text default 'Draft' CHECK (status IN ('Draft', 'Pending', 'Processing', 'Completed', 'Cancelled')),
    processed_by_id uuid,
    comments text,
    signature_data text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Reinstatement SRO
CREATE TABLE IF NOT EXISTS reinstatement_sro (
    id uuid primary key default gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES cpst_clients(id) ON DELETE CASCADE,
    request_date date,
    amount_due numeric,
    status text default 'Draft' CHECK (status IN ('Draft', 'Pending', 'Processing', 'Completed', 'Cancelled')),
    processed_by_id uuid,
    comments text,
    signature_data text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Reinstatement PDI
CREATE TABLE IF NOT EXISTS reinstatement_pdi (
    id uuid primary key default gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES cpst_clients(id) ON DELETE CASCADE,
    request_date date,
    amount_due numeric,
    status text default 'Draft' CHECK (status IN ('Draft', 'Pending', 'Processing', 'Completed', 'Cancelled')),
    processed_by_id uuid,
    comments text,
    signature_data text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Advisor Daily Activity
CREATE TABLE IF NOT EXISTS advisor_daily_activity (
    id uuid primary key default gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES cpst_clients(id) ON DELETE CASCADE,
    activity_date date,
    activity_type text,
    status text default 'Completed' CHECK (status IN ('Draft', 'Pending', 'Processing', 'Completed', 'Cancelled')),
    processed_by_id uuid,
    comments text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Add Triggers for updated_at
CREATE TRIGGER update_policy_cards_updated_at BEFORE UPDATE ON policy_cards FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_premium_payments_updated_at BEFORE UPDATE ON premium_payments FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_social_media_visibility_updated_at BEFORE UPDATE ON social_media_visibility FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_advisor_change_requests_updated_at BEFORE UPDATE ON advisor_change_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_beneficiary_change_requests_updated_at BEFORE UPDATE ON beneficiary_change_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_fund_switching_requests_updated_at BEFORE UPDATE ON fund_switching_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_fund_withdrawal_requests_updated_at BEFORE UPDATE ON fund_withdrawal_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_auto_change_arrangements_updated_at BEFORE UPDATE ON auto_change_arrangements FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_reinstatement_sro_updated_at BEFORE UPDATE ON reinstatement_sro FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_reinstatement_pdi_updated_at BEFORE UPDATE ON reinstatement_pdi FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_advisor_daily_activity_updated_at BEFORE UPDATE ON advisor_daily_activity FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 3. Add Indexes for client_id, status, created_at
-- policy_cards (has custom status columns instead of one status)
CREATE INDEX idx_policy_cards_client_id ON policy_cards(client_id);
CREATE INDEX idx_policy_cards_created_at ON policy_cards(created_at);

-- premium_payments
CREATE INDEX idx_premium_payments_client_id ON premium_payments(client_id);
CREATE INDEX idx_premium_payments_status ON premium_payments(status);
CREATE INDEX idx_premium_payments_created_at ON premium_payments(created_at);

-- social_media_visibility
CREATE INDEX idx_social_media_visibility_client_id ON social_media_visibility(client_id);
CREATE INDEX idx_social_media_visibility_status ON social_media_visibility(visibility_status);
CREATE INDEX idx_social_media_visibility_created_at ON social_media_visibility(created_at);

-- advisor_change_requests
CREATE INDEX idx_advisor_change_requests_client_id ON advisor_change_requests(client_id);
CREATE INDEX idx_advisor_change_requests_status ON advisor_change_requests(status);
CREATE INDEX idx_advisor_change_requests_created_at ON advisor_change_requests(created_at);

-- beneficiary_change_requests
CREATE INDEX idx_beneficiary_change_requests_client_id ON beneficiary_change_requests(client_id);
CREATE INDEX idx_beneficiary_change_requests_status ON beneficiary_change_requests(status);
CREATE INDEX idx_beneficiary_change_requests_created_at ON beneficiary_change_requests(created_at);

-- fund_switching_requests
CREATE INDEX idx_fund_switching_requests_client_id ON fund_switching_requests(client_id);
CREATE INDEX idx_fund_switching_requests_status ON fund_switching_requests(status);
CREATE INDEX idx_fund_switching_requests_created_at ON fund_switching_requests(created_at);

-- fund_withdrawal_requests
CREATE INDEX idx_fund_withdrawal_requests_client_id ON fund_withdrawal_requests(client_id);
CREATE INDEX idx_fund_withdrawal_requests_status ON fund_withdrawal_requests(status);
CREATE INDEX idx_fund_withdrawal_requests_created_at ON fund_withdrawal_requests(created_at);

-- auto_change_arrangements
CREATE INDEX idx_auto_change_arrangements_client_id ON auto_change_arrangements(client_id);
CREATE INDEX idx_auto_change_arrangements_status ON auto_change_arrangements(status);
CREATE INDEX idx_auto_change_arrangements_created_at ON auto_change_arrangements(created_at);

-- reinstatement_sro
CREATE INDEX idx_reinstatement_sro_client_id ON reinstatement_sro(client_id);
CREATE INDEX idx_reinstatement_sro_status ON reinstatement_sro(status);
CREATE INDEX idx_reinstatement_sro_created_at ON reinstatement_sro(created_at);

-- reinstatement_pdi
CREATE INDEX idx_reinstatement_pdi_client_id ON reinstatement_pdi(client_id);
CREATE INDEX idx_reinstatement_pdi_status ON reinstatement_pdi(status);
CREATE INDEX idx_reinstatement_pdi_created_at ON reinstatement_pdi(created_at);

-- advisor_daily_activity
CREATE INDEX idx_advisor_daily_activity_client_id ON advisor_daily_activity(client_id);
CREATE INDEX idx_advisor_daily_activity_status ON advisor_daily_activity(status);
CREATE INDEX idx_advisor_daily_activity_created_at ON advisor_daily_activity(created_at);
