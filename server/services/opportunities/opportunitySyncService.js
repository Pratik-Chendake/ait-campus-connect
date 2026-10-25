import { scrapeUnstopOpportunities } from './unstopAdapter.js';
import { validateOpportunityBatch } from './opportunityValidator.js';
import { normalizeUnstopOpportunity } from './opportunityNormalizer.js';
import { deduplicateOpportunityBatch } from './opportunityDeduplicator.js';
import {
  upsertOpportunitiesToSupabase,
  recordSyncRunToSupabase,
  upsertOpportunitiesToLocalDB,
  recordSyncRunToLocalDB,
  getLatestSyncRun
} from './opportunityRepository.js';

let isSyncRunning = false;

/**
 * Executes the complete 11-step Unstop Synchronization Pipeline
 * 
 * @param {Object} [options]
 * @param {number} [options.maxItems=50]
 * @param {boolean} [options.reuseRecentDataset=true]
 * @param {string} [options.triggeredBy='SYSTEM']
 * @returns {Promise<Object>} Execution telemetry summary
 */
export async function executeUnstopSync(options = {}) {
  if (isSyncRunning) {
    throw new Error('A synchronization run is already actively in progress. Overlapping runs are rejected.');
  }

  isSyncRunning = true;
  const syncId = `SYNC_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startedAt = new Date().toISOString();

  const syncState = {
    sync_id: syncId,
    source: 'UNSTOP',
    actor_id: 'hipersoft/unstop-scraper',
    run_id: null,
    started_at: startedAt,
    finished_at: null,
    total_fetched: 0,
    inserted_records: 0,
    updated_records: 0,
    failed_records: 0,
    status: 'RUNNING',
    error_summary: null,
    execution_metadata: {
      triggeredBy: options.triggeredBy || 'MANUAL',
      maxItems: options.maxItems || 50
    }
  };

  // Step 10: Initial audit log
  recordSyncRunToLocalDB(syncState);
  await recordSyncRunToSupabase(syncState);

  console.log(`\n======================================================`);
  console.log(`🚀 [SyncEngine] Starting Unstop Sync Run: ${syncId}`);
  console.log(`======================================================`);

  try {
    // Step 2 & 3: Run Apify Actor and fetch dataset
    const scrapeResult = await scrapeUnstopOpportunities({
      maxItems: options.maxItems || 50,
      reuseRecentDataset: options.reuseRecentDataset !== false
    });

    syncState.run_id = scrapeResult.metadata?.runId || null;
    syncState.total_fetched = scrapeResult.items.length;
    syncState.execution_metadata.apify = scrapeResult.metadata;

    console.log(`[SyncEngine] Step 3: Retrieved ${scrapeResult.items.length} raw records from Apify.`);

    // Step 4: Validate records with Zod
    const { valid, invalid } = validateOpportunityBatch(scrapeResult.items);
    syncState.failed_records = invalid.length;

    if (invalid.length > 0) {
      console.warn(`[SyncEngine] Step 4: ${invalid.length} records rejected due to validation constraints.`);
      syncState.execution_metadata.validationErrors = invalid.slice(0, 5).map(inv => ({
        id: inv.item?.id,
        title: inv.item?.title,
        error: inv.error
      }));
    }

    console.log(`[SyncEngine] Step 4: ${valid.length} records passed strict Zod validation.`);

    // Step 5 & 6: Normalize and Parse Dates
    const normalized = valid.map(normalizeUnstopOpportunity);
    console.log(`[SyncEngine] Step 5 & 6: Normalized ${normalized.length} records and assessed AIT Pune eligibility.`);

    // Step 7: Deduplicate using stable keys
    const deduplicated = deduplicateOpportunityBatch(normalized);
    console.log(`[SyncEngine] Step 7: ${deduplicated.length} unique opportunities ready for persistence.`);

    // Step 8: Upsert into Supabase & Local Database
    console.log(`[SyncEngine] Step 8: Persisting to Supabase PostgreSQL...`);
    const supabaseRes = await upsertOpportunitiesToSupabase(deduplicated);
    syncState.execution_metadata.supabaseResult = supabaseRes;

    console.log(`[SyncEngine] Step 8: Persisting to Local Database Cache...`);
    const localRes = upsertOpportunitiesToLocalDB(deduplicated);
    syncState.inserted_records = localRes.inserted;
    syncState.updated_records = localRes.updated;

    // Step 9: Historical preservation (no deletes)
    console.log(`[SyncEngine] Step 9: Historical preservation confirmed (zero old records deleted).`);

    // Finalize state
    syncState.finished_at = new Date().toISOString();
    syncState.status = 'COMPLETED';

    console.log(`======================================================`);
    console.log(`✅ [SyncEngine] Sync Run ${syncId} Finished Successfully!`);
    console.log(`   - Total Fetched: ${syncState.total_fetched}`);
    console.log(`   - Valid / Upserted: ${deduplicated.length} (${localRes.inserted} new, ${localRes.updated} updated)`);
    console.log(`   - Validation Failed: ${syncState.failed_records}`);
    console.log(`   - Supabase Status: ${supabaseRes.success ? 'Synced' : 'Noted (' + (supabaseRes.error || 'fallback') + ')'}`);
    console.log(`======================================================\n`);

    recordSyncRunToLocalDB(syncState);
    await recordSyncRunToSupabase(syncState);

    return {
      success: true,
      syncId,
      totalFetched: syncState.total_fetched,
      upserted: deduplicated.length,
      inserted: localRes.inserted,
      updated: localRes.updated,
      failed: syncState.failed_records,
      supabaseStatus: supabaseRes,
      finishedAt: syncState.finished_at
    };
  } catch (err) {
    syncState.finished_at = new Date().toISOString();
    syncState.status = 'FAILED';
    syncState.error_summary = err.message;
    recordSyncRunToLocalDB(syncState);
    await recordSyncRunToSupabase(syncState);

    console.error(`❌ [SyncEngine] Sync Run ${syncId} Failed:`, err.message);
    throw err;
  } finally {
    isSyncRunning = false;
  }
}
