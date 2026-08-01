CREATE TABLE IF NOT EXISTS advisors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_code TEXT UNIQUE NOT NULL,
    advisor_name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cpst_clients' AND column_name = 'advisor_id'
    ) THEN
        ALTER TABLE cpst_clients ADD COLUMN advisor_id UUID;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_cpst_advisor'
    ) THEN
        ALTER TABLE cpst_clients
        ADD CONSTRAINT fk_cpst_advisor
        FOREIGN KEY (advisor_id)
        REFERENCES advisors(id)
        ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cpst_clients_advisor_id ON cpst_clients(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisors_advisor_code ON advisors(advisor_code);
CREATE INDEX IF NOT EXISTS idx_advisors_advisor_name ON advisors(advisor_name);

INSERT INTO advisors (id, advisor_code, advisor_name, email)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'ADV-001', 'Triwynn Evasco Branzuela', 'triwynn@teampadua.ph')
ON CONFLICT (advisor_code) DO NOTHING;

UPDATE cpst_clients
SET advisor_id = 'a0000000-0000-0000-0000-000000000001'
WHERE advisor_id IS NULL;
