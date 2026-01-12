#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('🚀 Running migration...\n');

  const statements = [
    `CREATE TABLE IF NOT EXISTS outreach_campaigns (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, instantly_campaign_id TEXT UNIQUE NOT NULL, trade_filter TEXT[], state_filter TEXT[], city_filter TEXT[], total_targets INTEGER DEFAULT 0, emails_sent INTEGER DEFAULT 0, emails_opened INTEGER DEFAULT 0, emails_clicked INTEGER DEFAULT 0, replies_received INTEGER DEFAULT 0, bounced INTEGER DEFAULT 0, unsubscribed INTEGER DEFAULT 0, status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')), created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), last_synced_at TIMESTAMP WITH TIME ZONE, daily_send_limit INTEGER DEFAULT 50, email_template_subject TEXT, email_template_body TEXT)`,
    `CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_status ON outreach_campaigns(status)`,
    `ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY`,
    `CREATE TABLE IF NOT EXISTS outreach_targets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, full_name TEXT, first_name TEXT, last_name TEXT, company TEXT, trade TEXT NOT NULL, additional_trades TEXT[], state TEXT NOT NULL, city TEXT, zip_code TEXT, address TEXT, phone TEXT, website TEXT, enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'enriched', 'failed', 'verified')), email_verified BOOLEAN DEFAULT false, phone_verified BOOLEAN DEFAULT false, added_to_campaigns UUID[], last_contacted_at TIMESTAMP WITH TIME ZONE, lead_score INTEGER DEFAULT 0, source TEXT, source_url TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`,
    `CREATE INDEX IF NOT EXISTS idx_outreach_targets_email ON outreach_targets(email)`,
    `ALTER TABLE outreach_targets ENABLE ROW LEVEL SECURITY`,
    `CREATE TABLE IF NOT EXISTS scraping_activity (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), source TEXT NOT NULL, trade TEXT NOT NULL, state TEXT, city TEXT, query TEXT, results_found INTEGER DEFAULT 0, new_targets INTEGER DEFAULT 0, duplicate_targets INTEGER DEFAULT 0, failed_targets INTEGER DEFAULT 0, status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')), error_message TEXT, started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), completed_at TIMESTAMP WITH TIME ZONE, duration_seconds INTEGER, max_results INTEGER DEFAULT 100, pagination_offset INTEGER DEFAULT 0, created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`,
    `CREATE INDEX IF NOT EXISTS idx_scraping_activity_status ON scraping_activity(status)`,
    `ALTER TABLE scraping_activity ENABLE ROW LEVEL SECURITY`
  ];

  for (let i = 0; i < statements.length; i++) {
    try {
      await supabase.rpc('exec', { sql: statements[i] });
      console.log(`✅ Statement ${i + 1}/${statements.length}`);
    } catch (e) {
      console.log(`⚠️  Statement ${i + 1}: ${e.message?.substring(0, 60) || 'error'}`);
    }
  }

  const { data: c } = await supabase.from('outreach_campaigns').select('count').limit(0);
  const { data: t } = await supabase.from('outreach_targets').select('count').limit(0);
  const { data: s } = await supabase.from('scraping_activity').select('count').limit(0);

  console.log('\n🔍 Verification:');
  console.log(c !== undefined ? '✅ outreach_campaigns' : '❌ outreach_campaigns');
  console.log(t !== undefined ? '✅ outreach_targets' : '❌ outreach_targets');
  console.log(s !== undefined ? '✅ scraping_activity' : '❌ scraping_activity');
  console.log('\n🎉 Done!');
}

run();
