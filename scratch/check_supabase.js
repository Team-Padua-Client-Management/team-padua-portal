const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocalPath = '.env';
let url = '', key = '';

if (fs.existsSync(envLocalPath)) {
  const env = fs.readFileSync(envLocalPath, 'utf-8').split('\n');
  env.forEach(line => {
    if(line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if(line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
  });
}

const supabase = createClient(url, key);

async function check() {
  const { data, count, error } = await supabase.from('policy_cards').select('*', { count: 'exact' });
  console.log('Error:', error);
  console.log('policy_cards row count:', count, data?.length);
  if(data && data.length > 0) console.log('Sample data:', JSON.stringify(data[0]));
}
check();
