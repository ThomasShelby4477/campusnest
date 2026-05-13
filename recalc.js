const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function haversine(lat, lng, campusLat = 23.2156, campusLng = 72.6369) {
  const R = 6371;
  const dLat = ((lat - campusLat) * Math.PI) / 180;
  const dLng = ((lng - campusLng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((campusLat * Math.PI) / 180) *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function run() {
  const { data: listings } = await supabase.from('listings').select('id, latitude, longitude').not('latitude', 'is', null);
  for (const listing of listings) {
    const distance = haversine(listing.latitude, listing.longitude);
    await supabase.from('listings').update({ distance_from_college: distance }).eq('id', listing.id);
  }
  console.log('Recalculated distances for', listings.length, 'listings.');
}
run();
