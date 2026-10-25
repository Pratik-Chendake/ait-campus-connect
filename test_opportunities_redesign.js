/**
 * Comprehensive Verification Test Suite:
 * Opportunities Portal Redesign & Mandatory Role-Based Authentication
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';

function request(pathStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathStr, BASE_URL);
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

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING OPPORTUNITIES REDESIGN & MANDATORY AUTH TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: MANDATORY AUTHENTICATION & ROLE TAMPER PREVENTION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Mandatory Authentication & Tamper Prevention ---');

    // 1.1 Unauthenticated access to protected endpoints must fail with 401
    const unauthSaved = await request('/api/internships/my/saved');
    assert(unauthSaved.status === 401, `GET /api/internships/my/saved without token returns 401 (got ${unauthSaved.status})`);

    const unauthMatches = await request('/api/internships/my/matches');
    assert(unauthMatches.status === 401, `GET /api/internships/my/matches without token returns 401 (got ${unauthMatches.status})`);

    // 1.2 Registration with privilege escalation attempt (passing role: 'SUPER_ADMIN')
    const testEmail = `test_cadet_${Date.now()}@aitpune.edu.in`;
    const regPayload = {
      email: testEmail,
      password: 'SecurePassword123!',
      full_name: 'Test Cadet Student',
      branch: 'COMP',
      academic_year: 'TE',
      admission_year: 2023,
      role: 'SUPER_ADMIN' // Malicious attempt to escalate role
    };

    const regRes = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: regPayload
    });

    assert(regRes.status === 201 || regRes.status === 200, `Registration returns HTTP 201/200 (got ${regRes.status})`);
    assert(regRes.data?.user?.role === 'STUDENT', `Tamper-proof role assignment: escalated role ignored, user is assigned STUDENT role (got '${regRes.data?.user?.role}')`);

    const studentToken = regRes.data?.token;
    assert(!!studentToken, 'Received valid JWT bearer token upon student registration');

    // 1.3 Verify authenticated session /me endpoint returns STUDENT role
    const meRes = await request('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(meRes.status === 200 && meRes.data?.user?.role === 'STUDENT', `GET /api/auth/me returns authenticated STUDENT role (got ${meRes.data?.user?.role})`);

    // -------------------------------------------------------------------------
    // TEST SECTION 2: FRONTEND ROUTE PROTECTION & CODE INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Frontend Route Protection & Architecture ---');

    const appJsx = fs.readFileSync(path.resolve('./client/src/App.jsx'), 'utf-8');
    assert(appJsx.includes('<ProtectedRoute>'), 'App.jsx utilizes ProtectedRoute for sensitive platform views');
    assert(appJsx.includes('path="/opportunities"'), 'App.jsx defines /opportunities route');
    assert(appJsx.includes('path="/competitions"'), 'App.jsx defines /competitions route for migrated competitions');
    assert(appJsx.includes('path="/forgot-password"'), 'App.jsx provides public /forgot-password route');

    const protectedRouteJsx = fs.readFileSync(path.resolve('./client/src/components/ProtectedRoute.jsx'), 'utf-8');
    assert(protectedRouteJsx.includes('<Navigate to=') && protectedRouteJsx.includes('/login?redirect='), 'ProtectedRoute component redirects unauthenticated visits to /login with redirect param');

    const navbarJsx = fs.readFileSync(path.resolve('./client/src/components/Navbar.jsx'), 'utf-8');
    assert(navbarJsx.includes('{user && (') && navbarJsx.includes('{user ? ('), 'Navbar conditionally hides protected links when user is not logged in');
    assert(navbarJsx.includes('user.role'), 'Navbar displays authentic user role from server session');

    // -------------------------------------------------------------------------
    // TEST SECTION 3: INTERNSHIPS DATASET & CANONICAL CATEGORIES
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Internships Dataset & Canonical Categories ---');

    const listRes = await request('/api/internships');
    assert(listRes.status === 200, `GET /api/internships returns HTTP 200 (got ${listRes.status})`);
    assert(Array.isArray(listRes.data?.internships), 'Internships response includes internships array');
    assert(listRes.data?.internships?.length >= 15, `Contains at least 15 verified internships (found ${listRes.data?.internships?.length})`);

    // Verify key fields on internship items
    const sample = listRes.data.internships[0];
    assert(!!sample.company_name, `Internship item contains company_name (${sample.company_name})`);
    assert(!!sample.title, `Internship item contains title (${sample.title})`);
    assert(sample.stipend_amount !== undefined, `Internship item contains stipend_amount (${sample.stipend_amount})`);
    assert(!!sample.mode, `Internship item contains mode (${sample.mode})`);
    assert(Array.isArray(sample.skills_required), 'Internship item contains skills_required array');
    assert(Array.isArray(sample.eligible_branches), 'Internship item contains eligible_branches array');
    assert(!!sample.application_link, `Internship item contains application_link (${sample.application_link})`);

    // Verify diverse engineering categories across dataset
    const foundCategories = new Set(listRes.data?.internships.map(i => i.category));
    assert(foundCategories.size >= 10, `Diverse engineering fields represented (found ${foundCategories.size} distinct categories: ${Array.from(foundCategories).join(', ')})`);

    // -------------------------------------------------------------------------
    // TEST SECTION 4: INTERNSHIPS MULTI-FILTERING & STATS
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Internships Filtering & Stats ---');

    // 4.1 Filter by Mode = REMOTE
    const remoteRes = await request('/api/internships?mode=REMOTE');
    assert(remoteRes.status === 200, 'GET /api/internships?mode=REMOTE returns HTTP 200');
    assert(remoteRes.data.internships.length > 0, `Remote filter found ${remoteRes.data.internships.length} internships`);
    const allRemote = remoteRes.data.internships.every(i => i.mode.toUpperCase() === 'REMOTE');
    assert(allRemote, 'All returned items in remote query match REMOTE mode');

    // 4.2 Filter by Category (via canonical mapping DEFENCE_RESEARCH -> Research Internships)
    const defRes = await request('/api/internships?category=DEFENCE_RESEARCH');
    assert(defRes.status === 200, 'GET /api/internships?category=DEFENCE_RESEARCH returns HTTP 200');
    assert(defRes.data.internships.length >= 1, `Category mapping filter found ${defRes.data.internships.length} items`);

    // 4.3 Filter by Branch = MECH
    const mechRes = await request('/api/internships?branch=MECH');
    assert(mechRes.status === 200, 'GET /api/internships?branch=MECH returns HTTP 200');
    const mechInternships = mechRes.data.internships;
    assert(mechInternships.length > 0, `Found ${mechInternships.length} internships open to MECH students`);

    // 4.4 Filter by Branch = COMP
    const compRes = await request('/api/internships?branch=COMP');
    assert(compRes.status === 200, 'GET /api/internships?branch=COMP returns HTTP 200');
    assert(compRes.data.internships.length >= 5, `Found ${compRes.data.internships.length} internships open to COMP students`);

    // 4.5 Filter by Stipend = PAID
    const paidRes = await request('/api/internships?stipend=PAID');
    assert(paidRes.status === 200, 'GET /api/internships?stipend=PAID returns HTTP 200');
    const allPaid = paidRes.data.internships.every(i => i.stipend_amount > 0);
    assert(allPaid && paidRes.data.internships.length > 0, `All ${paidRes.data.internships.length} returned internships have positive stipend_amount`);

    // 4.6 Stats endpoint
    const statsRes = await request('/api/internships/stats');
    assert(statsRes.status === 200, 'GET /api/internships/stats returns HTTP 200');
    const stats = statsRes.data?.stats || statsRes.data;
    assert(stats.total_verified >= 15, `Total verified stat is >= 15 (${stats.total_verified})`);
    assert(stats.avg_stipend > 0, `Average stipend calculated (₹${stats.avg_stipend.toLocaleString()})`);

    // -------------------------------------------------------------------------
    // TEST SECTION 5: RECOMMENDATION MATCHING & SAVING INTERNSHIPS
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Student Recommendation Matching & Bookmarking ---');

    const authHeaders = {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    };

    // 5.1 Recommendations for COMP TE student
    const matchesRes = await request('/api/internships/my/matches', { headers: authHeaders });
    assert(matchesRes.status === 200, 'GET /api/internships/my/matches returns HTTP 200');
    assert(Array.isArray(matchesRes.data?.matches), 'Returns matches array');
    assert(matchesRes.data?.matches?.length > 0, `Found ${matchesRes.data?.matches?.length} recommended internships for COMP TE student`);
    const topMatch = matchesRes.data.matches[0];
    assert(topMatch.match_score >= 0 && topMatch.match_score <= 100, `Match score is a percentage (${topMatch.match_score}%)`);

    // 5.2 Bookmark an internship
    const internshipToSave = listRes.data.internships[0];
    const saveRes = await request(`/api/internships/${internshipToSave.id}/save`, {
      method: 'POST',
      headers: authHeaders
    });
    assert(saveRes.status === 200 && saveRes.data?.saved === true, `Saved internship ID ${internshipToSave.id} successfully`);

    // 5.3 Verify saved list contains it
    const mySavedRes = await request('/api/internships/my/saved', { headers: authHeaders });
    assert(mySavedRes.status === 200, 'GET /api/internships/my/saved returns HTTP 200');
    const isSaved = mySavedRes.data?.internships?.some(i => i.id === internshipToSave.id);
    assert(isSaved, `Saved internships contains ID ${internshipToSave.id}`);

    // 5.4 Remove bookmark
    const deleteRes = await request(`/api/internships/${internshipToSave.id}/save`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert(deleteRes.status === 200 && deleteRes.data?.saved === false, `Removed bookmark for internship ID ${internshipToSave.id}`);

    // -------------------------------------------------------------------------
    // TEST SECTION 6: STRICT CONTENT SEPARATION (NO HACKATHONS/EVENTS ON OPPORTUNITIES)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Content Separation & Zero Contamination ---');

    // 6.1 Check Opportunities page code to confirm it only handles Internships & Scholarships
    const oppJsx = fs.readFileSync(path.resolve('./client/src/pages/Opportunities.jsx'), 'utf-8');
    assert(oppJsx.includes("currentTab === 'INTERNSHIPS'"), 'Opportunities page contains dedicated Internships view');
    assert(oppJsx.includes("currentTab === 'SCHOLARSHIPS'"), 'Opportunities page contains dedicated Scholarships view');
    assert(!oppJsx.includes('<HackathonList'), 'Opportunities page does NOT embed hackathon list components');

    // 6.2 Check that Competitions is distinct at /competitions
    const compJsx = fs.readFileSync(path.resolve('./client/src/pages/Competitions.jsx'), 'utf-8');
    assert(compJsx.includes('export default function Competitions') && compJsx.includes('campusCompetitions'), 'Competitions.jsx provides dedicated competitions portal');

    // 6.3 Verify Scholarships API still serves 30+ verified scholarships
    const schList = await request('/api/scholarships?limit=50');
    assert(schList.status === 200, 'Scholarships API is accessible and operational');
    assert(schList.data?.scholarships?.length >= 26, `Scholarships database has ${schList.data?.scholarships?.length} verified schemes`);

    console.log('\n================================================================');
    console.log(`🎉 TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test run failed with error:', err);
    process.exit(1);
  }
}

runTests();
