import { makeApifyRequest } from './apifyClient.js';

export const ACTOR_ID = 'hipersoft~unstop-scraper';

/**
 * Executes or fetches data from the Unstop Scraper Actor
 * 
 * @param {Object} options
 * @param {number} [options.maxItems=50] - Maximum opportunities to scrape (default: 50, target: ~100)
 * @param {Array<string>} [options.opportunityTypes=['hackathons', 'competitions']]
 * @param {boolean} [options.reuseRecentDataset=true] - If a run succeeded recently (< 6 hours), reuse its dataset to conserve Apify usage costs
 * @returns {Promise<{ items: Array<Object>, metadata: Object }>}
 */
export async function scrapeUnstopOpportunities(options = {}) {
  const maxItems = options.maxItems || 50;
  const opportunityTypes = options.opportunityTypes || ['hackathons', 'competitions'];
  const reuseRecentDataset = options.reuseRecentDataset !== false;

  console.log(`[UnstopAdapter] Initiating Unstop scraping via actor: ${ACTOR_ID}...`);

  // 1. Check if a recent successful run already exists (smart cost-control optimization)
  if (reuseRecentDataset) {
    try {
      const recentRuns = await makeApifyRequest(`/v2/acts/${ACTOR_ID}/runs?limit=3&desc=1`);
      const items = recentRuns.data?.items || [];
      const latestSuccess = items.find(r => r.status === 'SUCCEEDED' && r.defaultDatasetId);
      
      if (latestSuccess) {
        const runAgeMs = Date.now() - new Date(latestSuccess.finishedAt).getTime();
        const sixHoursMs = 6 * 60 * 60 * 1000;
        
        if (runAgeMs < sixHoursMs) {
          console.log(`[UnstopAdapter] Found recent successful run ${latestSuccess.id} from ${new Date(latestSuccess.finishedAt).toLocaleTimeString()} (${Math.round(runAgeMs/60000)} mins ago). Fetching dataset ${latestSuccess.defaultDatasetId}...`);
          
          const datasetItems = await makeApifyRequest(`/v2/datasets/${latestSuccess.defaultDatasetId}/items?limit=${maxItems}`);
          const rawItems = Array.isArray(datasetItems) ? datasetItems : [];
          
          if (rawItems.length > 0) {
            console.log(`[UnstopAdapter] Retrieved ${rawItems.length} fresh opportunities from existing dataset.`);
            return {
              items: rawItems,
              metadata: {
                runId: latestSuccess.id,
                datasetId: latestSuccess.defaultDatasetId,
                status: 'SUCCEEDED',
                cached: true,
                startedAt: latestSuccess.startedAt,
                finishedAt: latestSuccess.finishedAt,
                totalFetched: rawItems.length
              }
            };
          }
        }
      }
    } catch (e) {
      console.warn(`[UnstopAdapter] Could not check recent runs: ${e.message}. Proceeding with fresh run.`);
    }
  }

  // 2. Start a fresh Actor Run
  console.log(`[UnstopAdapter] Triggering fresh scraping run for up to ${maxItems} items...`);
  const input = {
    includeDescription: true,
    maxItems,
    onlyOpen: true,
    opportunityTypes,
    proxyConfiguration: { useApifyProxy: false }
  };

  const runStart = await makeApifyRequest(`/v2/acts/${ACTOR_ID}/runs`, 'POST', input);
  const runId = runStart.data?.id;
  const datasetId = runStart.data?.defaultDatasetId;

  if (!runId) {
    throw new Error('Failed to initiate Apify actor run: No run ID returned.');
  }

  console.log(`[UnstopAdapter] Actor run started. Run ID: ${runId}. Waiting for completion...`);

  // 3. Poll for run completion (bounded with max 3 minutes timeout)
  const startTime = Date.now();
  const maxWaitMs = 180000; // 3 minutes
  let runStatus = 'RUNNING';
  let runData = null;

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(r => setTimeout(r, 4000)); // wait 4 seconds between polls
    const check = await makeApifyRequest(`/v2/actor-runs/${runId}`);
    runData = check.data;
    runStatus = runData?.status;

    console.log(`[UnstopAdapter] Run ${runId} status: ${runStatus} (${Math.round((Date.now() - startTime) / 1000)}s elapsed)...`);

    if (runStatus === 'SUCCEEDED' || runStatus === 'FAILED' || runStatus === 'TIMED-OUT' || runStatus === 'ABORTED') {
      break;
    }
  }

  if (runStatus !== 'SUCCEEDED') {
    throw new Error(`Apify Actor run did not succeed. Final status: ${runStatus}`);
  }

  // 4. Fetch the dataset records
  const targetDatasetId = runData.defaultDatasetId || datasetId;
  const datasetRes = await makeApifyRequest(`/v2/datasets/${targetDatasetId}/items?limit=${maxItems}`);
  const items = Array.isArray(datasetRes) ? datasetRes : [];

  console.log(`[UnstopAdapter] Ingestion complete. Retrieved ${items.length} opportunity records.`);

  return {
    items,
    metadata: {
      runId,
      datasetId: targetDatasetId,
      status: runStatus,
      cached: false,
      startedAt: runData.startedAt,
      finishedAt: runData.finishedAt,
      usageUsd: runData.usageTotalUsd,
      totalFetched: items.length
    }
  };
}
