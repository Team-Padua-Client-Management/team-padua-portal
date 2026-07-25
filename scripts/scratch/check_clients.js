const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, count, error } = await supabase.from('cpst_clients').select('*').limit(1);
  if (error) {
    console.error("Error fetching cpst_clients:", error);
  } else {
    const { data: cols } = await supabase.rpc('get_table_columns', { table_name: 'cpst_clients' }).catch(() => ({ data: null }));
    console.log("cpst_clients sample row:", data);
    console.log("cpst_clients fields:", Object.keys(data[0] || {}));
  }
}
run();
