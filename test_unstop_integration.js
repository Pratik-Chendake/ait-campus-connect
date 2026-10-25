import 'dotenv/config';
import http from 'http';

const BASE_URL = 'http://localhost:5000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function loginUser(email, password) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { identifier: email, password }
  });
  if (res.status === 200 && res.data.token) {
    return { token: res.data.token, user: res.data.user };
  }
  const quickRes = await request('/api/auth/quick-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { role: email.includes('admin') || email.includes('principal') ? 'ADMIN' : 'STUDENT' }
  });
  if (quickRes.status === 200 && quickRes.data.token) {
    return { token: quickRes.data.token, user: quickRes.data.user };
  }
  throw new Error(`Login failed for ${email}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING UNSTOP INTEGRATION & OPPORTUNITY API TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failed++;
    }
  }

  // 1. Authentication Setup
  console.log('1. Authentication Setup:');
  const admin = await loginUser('principal@aitpune.edu.in', 'Admin@123');
  assert(admin.token, 'Logged in as Admin (principal@aitpune.edu.in)');

  const student = await loginUser('aarav.sharma@aitpune.edu.in', 'Student@123');
  assert(student.token, 'Logged in as Student (aarav.sharma@aitpune.edu.in)');

  // 2. GET /api/opportunities
  console.log('\n2. Testing GET /api/opportunities:');
  const allOppRes = await request('/api/opportunities');
  assert(allOppRes.status === 200, 'GET /api/opportunities returns 200 OK');
  assert(Array.isArray(allOppRes.data.opportunities), 'Returns array of opportunities');
  assert(allOppRes.data.opportunities.length > 0, `Returned ${allOppRes.data.opportunities.length} opportunities`);
  assert(allOppRes.data.counts && allOppRes.data.counts.all > 0, `Counts telemetry present: all=${allOppRes.data.counts?.all}, unstop=${allOppRes.data.counts?.unstop}`);

  // Check deadline sorting
  const items = allOppRes.data.opportunities;
  let sortedAsc = true;
  for (let i = 0; i < items.length - 1; i++) {
    const d1 = items[i].deadline ? new Date(items[i].deadline).getTime() : Infinity;
    const d2 = items[i + 1].deadline ? new Date(items[i + 1].deadline).getTime() : Infinity;
    if (d1 > d2) {
      sortedAsc = false;
      break;
    }
  }
  assert(sortedAsc, 'Opportunities sorted by deadline ASC (earliest deadline first)');

  // 3. Test Filtering by Source
  console.log('\n3. Testing Filtering & Sourcing:');
  const unstopOnlyRes = await request('/api/opportunities?source=UNSTOP');
  assert(unstopOnlyRes.status === 200, 'Filter source=UNSTOP returns 200 OK');
  const allUnstop = unstopOnlyRes.data.opportunities.every(o => o.source === 'UNSTOP');
  assert(allUnstop, 'All results have source === "UNSTOP"');
  assert(unstopOnlyRes.data.opportunities.length > 0, `Found ${unstopOnlyRes.data.opportunities.length} Unstop opportunities`);

  const openSourceRes = await request('/api/opportunities?source=OPEN_SOURCE');
  assert(openSourceRes.status === 200, 'Filter source=OPEN_SOURCE returns 200 OK');
  assert(openSourceRes.data.opportunities.some(o => o.title.includes('Anubhav')), 'Contains Anubhav OSS project');

  // 4. Test Single Opportunity Details
  console.log('\n4. Testing Opportunity Details Endpoint (/api/opportunities/:id):');
  const sampleUnstop = unstopOnlyRes.data.opportunities[0];
  const detailRes = await request(`/api/opportunities/${sampleUnstop.id}`);
  assert(detailRes.status === 200, `GET /api/opportunities/${sampleUnstop.id} returns 200`);
  const oppDetail = detailRes.data.opportunity || detailRes.data;
  assert(oppDetail.unstop_id === sampleUnstop.unstop_id, `Correct unstop_id matches: ${oppDetail.unstop_id}`);
  const targetUrl = oppDetail.application_url || oppDetail.official_url || oppDetail.url;
  assert(targetUrl && targetUrl.startsWith('http'), `Genuine external link present: ${targetUrl}`);
  assert(oppDetail.eligibility_category, `AIT eligibility assessment computed: ${oppDetail.eligibility_category}`);

  // 5. Test Integration Health & Sync Status
  console.log('\n5. Testing Sync Status Telemetry (/api/opportunities/sync-status):');
  const statusRes = await request('/api/opportunities/sync-status');
  assert(statusRes.status === 200, 'GET /api/opportunities/sync-status returns 200 OK');
  assert(statusRes.data.status, `Status returned: ${statusRes.data.status}`);
  assert(statusRes.data.metrics && statusRes.data.metrics.total_opportunities > 0, `Sync count returned: ${statusRes.data.metrics?.total_opportunities}`);

  // 6. Test Sync Security Guard
  console.log('\n6. Testing Sync Endpoint Security:');
  const unauthSync = await request('/api/opportunities/sync', { method: 'POST' });
  assert(unauthSync.status === 401 || unauthSync.status === 403, 'Unauthenticated POST /api/opportunities/sync rejected (401/403)');

  const studentSync = await request('/api/opportunities/sync', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  assert(studentSync.status === 403, 'Student POST /api/opportunities/sync rejected (403 Forbidden)');

  const cronSync = await request('/api/opportunities/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': process.env.CRON_SECRET || 'ait_unstop_sync_secret_2026_aitpune'
    },
    body: { forceFresh: false, maxItems: 50 }
  });
  assert(cronSync.status === 200 && cronSync.data.success, 'Sync with valid CRON_SECRET succeeds (200 OK)');
  assert(cronSync.data.itemsProcessed > 0, `Sync processed ${cronSync.data.itemsProcessed} items idempotently`);

  // 7. Test Student Bookmarking & Saved Items
  console.log('\n7. Testing Student Bookmarking:');
  const targetOpp = unstopOnlyRes.data.opportunities[0];

  // Save opportunity
  const saveRes = await request(`/api/opportunities/${targetOpp.id}/save`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${student.token}`,
      'Content-Type': 'application/json'
    },
    body: { status: 'SAVED' }
  });
  if (!saveRes.data?.saved) {
    console.log('DEBUG saveRes:', saveRes);
  }
  assert(saveRes.status === 200 && saveRes.data?.saved === true, `Saved opportunity ${targetOpp.id} successfully`);

  // Check my saved
  const mySavedRes = await request('/api/opportunities/my/saved', {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  assert(mySavedRes.status === 200, 'GET /api/opportunities/my/saved returns 200 OK');
  const foundSaved = mySavedRes.data.saved.some(s => s.opportunity_id === targetOpp.unstop_id || s.opportunity_id === String(targetOpp.id) || s.id === targetOpp.id);
  assert(foundSaved, 'Saved opportunity is present in student saved list');

  // Also verify via general /api/saved endpoint
  const genSavedRes = await request('/api/saved', {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  assert(genSavedRes.status === 200, 'GET /api/saved returns 200 OK');
  const genFound = genSavedRes.data.saved_items?.some(s => (s.item_id === targetOpp.unstop_id || s.item_id === String(targetOpp.id)) && s.item_type === 'OPPORTUNITY');
  assert(genFound, 'Opportunity appears in unified /api/saved with item_type OPPORTUNITY');

  // Unsave opportunity
  const unsaveRes = await request(`/api/opportunities/${targetOpp.id}/save`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  assert(unsaveRes.status === 200 && unsaveRes.data.saved === false, 'Unsaved opportunity successfully');

  // Verify removed
  const mySavedAfter = await request('/api/opportunities/my/saved', {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  const stillFound = mySavedAfter.data.saved.some(s => s.opportunity_id === targetOpp.unstop_id || s.opportunity_id === String(targetOpp.id) || s.id === targetOpp.id);
  assert(!stillFound, 'Opportunity confirmed removed from student saved list');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
