require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    const data = await res.json();
    console.log("cpst_clients properties:");
    console.log(data.definitions.cpst_clients ? Object.keys(data.definitions.cpst_clients.properties) : "Not found");
    
    console.log("\nacr_requests properties:");
    console.log(data.definitions.acr_requests ? Object.keys(data.definitions.acr_requests.properties) : "Not found");
  } catch (err) {
    console.error("Error fetching PostgREST spec:", err.message);
  }
}
run();
