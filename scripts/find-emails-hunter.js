const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utpmtlzqpyewpwzgsbdu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cG10bHpxcHlld3B3emdzYmR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3ODM4NywiZXhwIjoyMDc1NDU0Mzg3fQ.HTS-L1s8NpR3dhnUSgQu-YqRMiMUMv5tMpcABK6LKA0';
const hunterApiKey = '88aea7b7dee43a662c3fb8de580ca552e3c5dd88';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Extract domain from website URL
 */
function extractDomain(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return null;
  }
}

/**
 * Find emails for a domain using Hunter.io Domain Search API
 */
async function findEmails(domain) {
  if (!domain) return { emails: [], meta: {} };

  try {
    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey}&limit=5`
    );

    if (!response.ok) {
      console.error(`Hunter.io API error for ${domain}: ${response.status} ${response.statusText}`);
      return { emails: [], meta: {} };
    }

    const data = await response.json();

    if (data.data && data.data.emails) {
      return {
        emails: data.data.emails.map(e => ({
          email: e.value,
          first_name: e.first_name,
          last_name: e.last_name,
          position: e.position,
          confidence: e.confidence
        })),
        meta: {
          organization: data.data.organization,
          total_emails: data.data.emails.length
        }
      };
    }

    return { emails: [], meta: {} };
  } catch (error) {
    console.error(`Error finding emails for ${domain}:`, error.message);
    return { emails: [], meta: {} };
  }
}

(async () => {
  console.log('🔍 Finding emails for Orlando HVAC technicians using Hunter.io...\n');

  // Get all Orlando HVAC targets without emails
  const { data: targets, error } = await supabase
    .from('outreach_targets')
    .select('*')
    .eq('trade_type', 'HVAC')
    .eq('city', 'Orlando')
    .or('email.is.null,email.eq.');

  if (error) {
    console.error('❌ Error fetching targets:', error.message);
    return;
  }

  console.log(`Found ${targets.length} HVAC businesses in Orlando without emails\n`);

  let found = 0, notFound = 0, errors = 0;

  for (const target of targets) {
    const domain = extractDomain(target.website);

    if (!domain) {
      console.log(`⚠️  ${target.business_name} - No website domain`);
      notFound++;
      continue;
    }

    console.log(`🔎 Searching ${domain} (${target.business_name})...`);

    const { emails, meta } = await findEmails(domain);

    if (emails.length > 0) {
      // Get the best email (highest confidence)
      const bestEmail = emails.reduce((prev, current) =>
        (current.confidence > prev.confidence) ? current : prev
      );

      console.log(`   ✅ Found: ${bestEmail.email} (confidence: ${bestEmail.confidence}%)`);

      // Update database
      const { error: updateError } = await supabase
        .from('outreach_targets')
        .update({
          email: bestEmail.email,
          email_found: true
        })
        .eq('id', target.id);

      if (updateError) {
        console.log(`   ❌ Error updating database: ${updateError.message}`);
        errors++;
      } else {
        found++;
      }
    } else {
      console.log(`   ⚠️  No emails found`);
      notFound++;
    }

    // Rate limiting - wait 1 second between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Emails found: ${found}`);
  console.log(`  ⚠️  Not found: ${notFound}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log(`  📋 Total: ${targets.length}`);
})();
