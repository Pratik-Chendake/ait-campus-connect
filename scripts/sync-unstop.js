#!/usr/bin/env node
/**
 * Unstop Hackathon & Opportunity Sync CLI Script
 * 
 * Invokes the Apify -> Validation -> Deduplication -> Supabase/Local sync pipeline.
 */

import dotenv from 'dotenv';
dotenv.config();

import { executeUnstopSync } from '../server/services/opportunities/opportunitySyncService.js';

async function main() {
  console.log('--- AIT Campus Connect: Manual Unstop Sync Trigger ---');

  const maxItemsArg = process.argv.find(arg => arg.startsWith('--max='));
  const maxItems = maxItemsArg ? parseInt(maxItemsArg.split('=')[1], 10) : 50;

  const forceFresh = process.argv.includes('--fresh');

  try {
    const result = await executeUnstopSync({
      maxItems,
      reuseRecentDataset: !forceFresh,
      triggeredBy: 'CLI'
    });

    console.log('Sync Summary Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Fatal Sync Error:', err.message);
    process.exit(1);
  }
}

main();
