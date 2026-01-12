const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const orlandoHVACTechs = [
  { name: 'John Martinez', lat: 28.5383, lng: -81.3792, rating: 4.9 },
  { name: 'Sarah Johnson', lat: 28.5423, lng: -81.3712, rating: 4.8 },
  { name: 'Michael Chen', lat: 28.5303, lng: -81.3682, rating: 4.7 },
  { name: 'David Rodriguez', lat: 28.5453, lng: -81.3822, rating: 4.9 },
  { name: 'Emily Williams', lat: 28.5373, lng: -81.3752, rating: 4.8 },
  { name: 'Robert Taylor', lat: 28.5413, lng: -81.3702, rating: 4.6 },
  { name: 'Jennifer Garcia', lat: 28.5343, lng: -81.3672, rating: 4.9 },
  { name: 'William Brown', lat: 28.5483, lng: -81.3852, rating: 4.7 },
  { name: 'Lisa Anderson', lat: 28.5363, lng: -81.3732, rating: 4.8 },
  { name: 'Thomas Wilson', lat: 28.5433, lng: -81.3772, rating: 4.9 }
];

async function seedTechnicians() {
  console.log('Seeding Orlando HVAC technicians...\n');

  const orgId = '550e8400-e29b-41d4-a716-446655440000';

  for (const tech of orlandoHVACTechs) {
    const { data, error } = await supabase
      .from('technicians')
      .insert({
        org_id: orgId,
        full_name: tech.name,
        trade_needed: 'HVAC',
        city: 'Orlando',
        state: 'FL',
        lat: tech.lat,
        lng: tech.lng,
        average_rating: tech.rating,
        is_available: true
      })
      .select();

    if (error) {
      console.error(`❌ Failed to create ${tech.name}:`, error.message);
    } else {
      console.log(`✅ Created ${tech.name} (Rating: ${tech.rating})`);
    }
  }

  // Verify count
  const { count } = await supabase
    .from('technicians')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Total technicians in database: ${count}`);
}

seedTechnicians();
