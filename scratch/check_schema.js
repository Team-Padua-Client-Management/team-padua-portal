const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const tables = ['cpc_records', 'ppu_records', 'fst_requests', 'mngt_records', 'cpst_clients', 'acr_requests'];
  for (const table of tables) {
    const { data, count, error } = await supabase.from(table).select('*', { count: 'exact' }).limit(3);
    if (error) {
      console.log(`Table ${table} error:`, error.message);
    } else {
      console.log(`Table ${table}: count = ${count}`);
      console.log('Sample rows:', data);
    }
  }
}

run();
