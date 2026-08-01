-- Add JSONB column for client servicing permissions to the profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS client_servicing_permissions JSONB DEFAULT '{
  "cpst": { "view": false, "create": false, "edit": false, "delete": false, "export": false },
  "acr": { "view": false, "create": false, "edit": false, "delete": false, "export": false },
  "fst": { "view": false, "create": false, "edit": false, "delete": false, "export": false },
  "cpc": { "view": false, "create": false, "edit": false, "delete": false, "export": false },
  "ppu": { "view": false, "create": false, "edit": false, "delete": false, "export": false },
  "mngt": { "view": false, "create": false, "edit": false, "delete": false, "export": false }
}'::jsonb;
