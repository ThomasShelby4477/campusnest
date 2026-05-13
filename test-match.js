const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
  return acc;
}, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('matches').select('id, user_a:profiles!matches_user_a_id_fkey(id, name, avatar_url), user_b:profiles!matches_user_b_id_fkey(id, name, avatar_url)');
  console.log(JSON.stringify(data, null, 2));
}
test();
