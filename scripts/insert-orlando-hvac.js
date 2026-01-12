const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utpmtlzqpyewpwzgsbdu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cG10bHpxcHlld3B3emdzYmR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3ODM4NywiZXhwIjoyMDc1NDU0Mzg3fQ.HTS-L1s8NpR3dhnUSgQu-YqRMiMUMv5tMpcABK6LKA0';
const supabase = createClient(supabaseUrl, supabaseKey);

const techs = [
  {business_name: 'Ferran Services', phone: '407-422-3551', city: 'Orlando', state: 'FL', website: 'https://ferran-services.com/', email: null},
  {business_name: 'AmeriTech Air & Heat', phone: '407-743-7106', city: 'Orlando', state: 'FL', website: 'https://ameritechfl.com/', email: null},
  {business_name: 'Our Place Air', phone: '1-800-291-0949', city: 'Orlando', state: 'FL', website: 'https://callourplace.com/', email: null},
  {business_name: 'Pro-Tech AC', phone: '877-416-4727', city: 'Orlando', state: 'FL', website: 'https://www.protechac.com/', email: null},
  {business_name: 'ServiceOne AC', phone: '407-499-8333', city: 'Orlando', state: 'FL', website: 'https://www.serviceoneac.com/', email: null},
  {business_name: 'Fuse HVAC', phone: '321-421-0807', city: 'Orlando', state: 'FL', website: 'https://fuseorlando.com/', email: null},
  {business_name: 'Mills Air', phone: '407-277-1159', city: 'Orlando', state: 'FL', website: 'https://millsair.com/', email: null},
  {business_name: 'ConServ Building', phone: '407-260-5891', city: 'Altamonte Springs', state: 'FL', website: 'https://conservonline.com/', email: null},
  {business_name: 'Carrier Commercial', phone: '407-521-2218', city: 'Orlando', state: 'FL', website: 'https://www.carrier.com/', email: null},
  {business_name: 'Downtown Air', phone: '407-203-7922', city: 'Orlando', state: 'FL', website: 'https://downtown-air.com/', email: null},
  {business_name: 'Frank Gay Services', phone: '407-329-9808', city: 'Orlando', state: 'FL', website: 'https://frankgayservices.com/', email: null},
  {business_name: 'AND Services', phone: '407-477-6588', city: 'Orlando', state: 'FL', website: 'https://www.andservices.com/', email: null},
  {business_name: 'Air Titans', phone: '813-355-8352', city: 'Orlando', state: 'FL', website: 'https://airtitans.com/', email: 'support@airtitans.com'},
  {business_name: 'Bob Heinmiller', phone: '407-422-7657', city: 'Orlando', state: 'FL', website: 'https://bobheinmiller.com/', email: null},
  {business_name: 'Action Air', phone: '407-521-0400', city: 'Orlando', state: 'FL', website: 'https://www.actionairfl.com/', email: null},
  {business_name: 'E.C. Waters AC', phone: null, city: 'Orlando', state: 'FL', website: 'https://ecwaters.com/', email: null},
  {business_name: 'Vortechs Heating', phone: '407-536-6366', city: 'Orlando', state: 'FL', website: 'https://www.vortechs-hvac.com/', email: null},
  {business_name: 'Del-Air Heating', phone: '407-490-1292', city: 'Orlando', state: 'FL', website: 'https://www.delair.com/', email: null}
];

(async () => {
  console.log('🚀 Inserting', techs.length, 'Orlando HVAC technicians...\n');
  let inserted = 0, duplicates = 0, errors = 0;

  for (const tech of techs) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const { error } = await supabase.from('outreach_targets').insert({
      source_table: 'manual_web_search',
      source_id: 'orlando_hvac_' + timestamp + '_' + random,
      business_name: tech.business_name,
      address: tech.city + ', ' + tech.state,
      phone: tech.phone,
      website: tech.website,
      email: tech.email,
      city: tech.city,
      state: tech.state,
      trade_type: 'HVAC',
      status: 'pending',
      email_found: tech.email ? true : false
    });

    if (error) {
      if (error.code === '23505') {
        duplicates++;
        console.log('⚠️  Duplicate:', tech.business_name);
      } else {
        errors++;
        console.error('❌ Error:', tech.business_name, error.message);
      }
    } else {
      inserted++;
      console.log('✅', tech.business_name);
    }
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n📊 Summary:');
  console.log('  ✅ Inserted:', inserted);
  console.log('  ⚠️  Duplicates:', duplicates);
  console.log('  ❌ Errors:', errors);
  console.log('  📋 Total:', techs.length);
})();
