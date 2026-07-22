const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("--- Checking Tasks Table Schema ---");
  const { data: taskData, error: taskErr } = await supabase.from('tasks').select('*').limit(1);
  if (taskErr) {
    console.error("Tasks table error:", taskErr);
  } else {
    console.log("Tasks sample keys:", taskData.length > 0 ? Object.keys(taskData[0]) : "No rows");
  }

  console.log("--- Checking Task Comments Table Schema ---");
  const { data: commentData, error: commentErr } = await supabase.from('task_comments').select('*').limit(1);
  if (commentErr) {
    console.error("Task comments error:", commentErr);
  } else {
    console.log("Task comments sample keys:", commentData.length > 0 ? Object.keys(commentData[0]) : "No rows or table exists");
  }

  console.log("--- Checking Profiles Table Role values ---");
  const { data: profilesData, error: profilesErr } = await supabase.from('profiles').select('id, full_name, email, role, avatar_url');
  if (profilesErr) {
    console.error("Profiles error:", profilesErr);
  } else {
    console.log("Profiles count:", profilesData.length);
    console.log("BizDev profiles:", profilesData.filter(p => p.role === 'BizDev' || (p.role && p.role.toLowerCase().includes('bizdev'))));
    console.log("All distinct roles:", Array.from(new Set(profilesData.map(p => p.role))));
  }
}

run();
