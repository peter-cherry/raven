const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const tables = ['targets', 'technicians', 'contacts', 'outreach_targets'];
  
  for (const t of tables) {
    const { data, count } = await supabase.from(t).select('*', { count: 'exact' }).limit(1);
    if (data) console.log(t, ':', count || data.length, 'records');
  }
})();
