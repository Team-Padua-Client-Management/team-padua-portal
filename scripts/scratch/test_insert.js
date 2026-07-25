const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, error } = await supabase.from('tasks').insert({
    title: 'Test Task New Schema',
    description: 'Testing columns',
    category: 'ACR',
    priority: 'Medium',
    status: 'Pending',
    assigned_to: null,
    processed_by: null,
    created_by: null,
    due_date: new Date().toISOString()
  }).select();

  if (error) {
    console.error("Insert test error:", error);
  } else {
    console.log("Insert test success:", data);
  }
}

run();
