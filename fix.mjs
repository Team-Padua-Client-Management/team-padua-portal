import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// load .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function run() {
  const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }
  
  const adminUser = usersData.users.find(u => u.email === 'admin@teampadua.com');
  if (!adminUser) {
    console.error('Admin user not found');
    return;
  }
  
  console.log('Found admin user:', adminUser.id);
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ status: 'Active' })
    .eq('id', adminUser.id);
    
  if (updateError) {
    console.error('Error updating profile:', updateError);
  } else {
    console.log('Successfully updated account_status to active');
  }
}
run();
