const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("--- Querying with Anon Client (Simulating Browser Client) ---");
  const { data: anonData, error: anonErr } = await anonClient
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .order("full_name");

  console.log("Anon Profiles Error:", anonErr);
  console.log("Anon Profiles Count:", anonData ? anonData.length : 0);
  console.log("Anon Sample:", anonData ? anonData.slice(0, 3) : null);

  console.log("\n--- Querying Bizdev with Anon Client ---");
  const { data: anonBizdev, error: anonBizErr } = await anonClient
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .eq("role", "Bizdev")
    .order("full_name");

  console.log("Anon Bizdev Error:", anonBizErr);
  console.log("Anon Bizdev Count:", anonBizdev ? anonBizdev.length : 0);
  console.log("Anon Bizdev Data:", anonBizdev);

  console.log("\n--- Querying with Service Role Client ---");
  const { data: svcData, error: svcErr } = await serviceClient
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .order("full_name");

  console.log("Service Profiles Count:", svcData ? svcData.length : 0);
}

run();
