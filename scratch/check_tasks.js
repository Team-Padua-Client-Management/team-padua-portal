const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, count, error } = await supabase.from('tasks').select('*').limit(5);
  if (error) {
    console.error("Error fetching tasks:", error);
  } else {
    console.log("Tasks count:", count);
    console.log("Tasks columns:", Object.keys(data[0] || {}));
    console.log("Sample tasks:", data);
  }
}
run();
