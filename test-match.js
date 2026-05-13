const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
const env = {};
for (const line of lines) {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
    env[key] = val;
  }
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, user_a_id, user_b_id,
      user_a:profiles!matches_user_a_id_fkey (id, name, avatar_url),
      user_b:profiles!matches_user_b_id_fkey (id, name, avatar_url)
    `)
    .limit(2);
  console.log('Error:', JSON.stringify(error));
  console.log('Data:', JSON.stringify(data, null, 2));
  if (data && data[0]) {
    console.log('\nuser_a type:', Array.isArray(data[0].user_a) ? 'ARRAY' : typeof data[0].user_a);
    console.log('user_a value:', JSON.stringify(data[0].user_a));
  }
}
test();
