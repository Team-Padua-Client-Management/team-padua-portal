require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: spec } = await supabase.from('roles').select('*').limit(5);
  console.log("Rows in 'roles' table:", spec);
}
run();
