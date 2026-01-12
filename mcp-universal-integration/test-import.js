#!/usr/bin/env node

/**
 * Test script to call MCP tools directly
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

import { analyzeIntegration } from './dist/tools/analyze.js';
import { importVendors } from './dist/tools/import-vendors.js';

const USER_ID = '585ce2b2-f4d2-4f0a-a5e8-4f1cc5b56051';
const PLATFORM_NAME = 'maintainx';

async function main() {
  console.log('🔍 Step 1: Analyzing MaintainX vendor data...\n');

  try {
    const analysisResult = await analyzeIntegration({
      user_id: USER_ID,
      platform_name: PLATFORM_NAME
    });

    console.log('Analysis Result:');
    console.log(analysisResult.content[0].text);
    console.log('\n' + '='.repeat(80) + '\n');

    // Parse the analysis to check if we should proceed
    const analysis = JSON.parse(analysisResult.content[0].text);

    if (analysis.ready_to_import || analysis.vendors_with_addresses > 0) {
      console.log('✅ Data quality looks good! Proceeding with import...\n');
      console.log('🚀 Step 2: Importing vendors with geocoding...\n');

      const importResult = await importVendors({
        user_id: USER_ID,
        platform_name: PLATFORM_NAME,
        geocode_addresses: true,
        mark_as_warm: true
      });

      console.log('Import Result:');
      console.log(importResult.content[0].text);
      console.log('\n' + '='.repeat(80) + '\n');

      console.log('✅ TEST COMPLETE!');
      console.log('\nNext steps:');
      console.log('1. Check imported vendors in database');
      console.log('2. Verify lat/lng coordinates are populated');
      console.log('3. Test work order creation and matching');

    } else {
      console.log('⚠️ No vendors with addresses found.');
      console.log('Recommendations:', analysis.recommendations);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }

  process.exit(0);
}

main();
