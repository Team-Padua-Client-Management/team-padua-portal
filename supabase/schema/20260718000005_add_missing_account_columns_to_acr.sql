-- Adds missing account checkbox columns to the advisor_change_requests table
-- if they were omitted in the original creation.
ALTER TABLE public.advisor_change_requests
ADD COLUMN IF NOT EXISTS account_individual_life boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS account_group_life boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS account_mutual_fund boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS account_pre_need boolean DEFAULT false;

-- Forces PostgREST (Supabase Data API) to reload the schema cache
-- This fixes the PGRST204 error if the columns actually exist but the cache is stale.
NOTIFY pgrst, 'reload schema';
