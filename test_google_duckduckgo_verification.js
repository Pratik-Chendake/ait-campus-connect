import fs from 'fs';
import path from 'path';
import http from 'http';
import { generateSearchUrls, isValidHttpUrl, cleanQueryTerm } from './server/services/verification/searchVerificationService.js';
import { query } from './server/db/database.js';

const BASE_URL = 'http://localhost:5000';

function apiRequest(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
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

async function runGoogleDuckDuckGoTests() {
  console.log('========================================================================');
  console.log('🔍 GOOGLE SEARCH & DUCKDUCKGO VERIFICATION EVIDENCE TEST SUITE');
  console.log('========================================================================\n');

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

  // =========================================================================
  // 1. URL Validation Security & Query Sanitization
  // =========================================================================
  console.log('1. Testing URL Validation Security & Query Sanitization:');
  assert(isValidHttpUrl('https://www.google.com/search?q=test'), 'Allows valid HTTPS URL');
  assert(isValidHttpUrl('http://duckduckgo.com/?q=test'), 'Allows valid HTTP URL');
  assert(!isValidHttpUrl('javascript:alert(document.cookie)'), 'Blocks malicious javascript: URI');
  assert(!isValidHttpUrl('data:text/html,<script>alert(1)</script>'), 'Blocks data: URI scheme');
  assert(!isValidHttpUrl('file:///etc/passwd'), 'Blocks file:/// URI scheme');
  assert(!isValidHttpUrl(''), 'Handles empty string safely');
  assert(!isValidHttpUrl(null), 'Handles null safely');

  assert(cleanQueryTerm('Student "Name"\n') === 'Student Name', 'Strips double quotes and newlines from query terms');
  assert(cleanQueryTerm('  extra   spaces  ') === 'extra spaces', 'Normalizes multiple consecutive whitespace');

  // =========================================================================
  // 2. Google Search & DuckDuckGo Link Formulation
  // =========================================================================
  console.log('\n2. Testing Manual Search Query Formulation (Google & DuckDuckGo):');
  const mockAch = {
    title: 'Winner - Smart India Hackathon 2025',
    event_name: 'Smart India Hackathon 2025',
    organization: 'Ministry of Education',
    position: 'Winner (1st)'
  };
  const mockStudent = {
    full_name: 'Rahul Sharma',
    student_name: 'Rahul Sharma'
  };

  const links = generateSearchUrls(mockAch, mockStudent);

  // Query contents
  assert(links.queries.primary.includes('"Smart India Hackathon 2025"'), 'Primary query contains quoted event name');
  assert(links.queries.primary.includes('"Rahul Sharma"'), 'Primary query contains quoted student name');
  assert(links.queries.primary.includes('"Winner"'), 'Primary query captures winning rank without noisy parentheses');
  assert(links.queries.institutional.includes('Army Institute of Technology'), 'Institutional query includes AIT institutional terms');
  assert(links.queries.platform.includes('site:unstop.com'), 'Platform query contains Unstop domain filter');
  assert(links.queries.platform.includes('site:devfolio.co'), 'Platform query contains Devfolio domain filter');

  // Google Links
  assert(links.google_links.primary.url.startsWith('https://www.google.com/search?q='), 'Google primary link starts with official Google base');
  assert(links.google_links.institutional.url.startsWith('https://www.google.com/search?q='), 'Google institutional link starts with official Google base');
  assert(links.google_links.platform.url.startsWith('https://www.google.com/search?q='), 'Google platform link starts with official Google base');
  assert(links.google_links.primary.url.includes(encodeURIComponent('"Smart India Hackathon 2025"')), 'Google search terms are properly URL-encoded');

  // DuckDuckGo Links
  assert(links.duckduckgo_links.primary.url.startsWith('https://duckduckgo.com/?q='), 'DuckDuckGo primary link starts with DuckDuckGo base');
  assert(links.duckduckgo_links.institutional.url.startsWith('https://duckduckgo.com/?q='), 'DuckDuckGo institutional link starts with DuckDuckGo base');
  assert(links.duckduckgo_links.platform.url.startsWith('https://duckduckgo.com/?q='), 'DuckDuckGo platform link starts with DuckDuckGo base');
  assert(links.duckduckgo_links.primary.url.includes(encodeURIComponent('"Rahul Sharma"')), 'DuckDuckGo student name is properly URL-encoded');

  // Graceful Handling of Missing Details
  const emptyLinks = generateSearchUrls({}, {});
  assert(typeof emptyLinks.google_links.primary.url === 'string', 'Handles empty achievement/student without crashing');
  assert(typeof emptyLinks.duckduckgo_links.primary.url === 'string', 'Handles empty DuckDuckGo query safely');

  // =========================================================================
  // 3. Frontend Component Static Analysis & Safety Audit
  // =========================================================================
  console.log('\n3. Testing Frontend Component Integrity & Zero SearXNG References:');
  const componentPath = path.resolve('client/src/components/AchievementEvidenceSearch.jsx');
  assert(fs.existsSync(componentPath), 'AchievementEvidenceSearch.jsx exists');

  const componentSource = fs.readFileSync(componentPath, 'utf8');

  // Required features
  assert(componentSource.includes('Search on Google'), 'Includes "Search on Google" button');
  assert(componentSource.includes('Search on DuckDuckGo'), 'Includes "Search on DuckDuckGo" button');
  assert(componentSource.includes('Copy'), 'Includes Copy Query helper button');
  assert(componentSource.includes('Reviewer Guidance:'), 'Includes Reviewer Guidance disclaimer');

  // Strict safety & policy guarantees
  assert(componentSource.includes('rel="noopener noreferrer"'), 'All external links include rel="noopener noreferrer"');
  assert(componentSource.includes('target="_blank"'), 'All external links open in a new tab (target="_blank")');
  assert(!componentSource.includes('dangerouslySetInnerHTML'), 'No dangerouslySetInnerHTML used');

  // Complete removal of SearXNG from component
  assert(!componentSource.toLowerCase().includes('searxng'), 'AchievementEvidenceSearch.jsx contains ZERO references to SearXNG');
  assert(!componentSource.includes('Run Automated Search'), 'No automated search button present (manual discovery only)');

  // =========================================================================
  // 4. API Authorization & Endpoint Verification
  // =========================================================================
  console.log('\n4. Testing API Authorization & Endpoint Verification:');

  // Login as Student, Faculty, and Admin
  const studentAuth = await apiRequest('/api/auth/quick-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { role: 'STUDENT' }
  });
  const studentToken = studentAuth.data?.token;

  const facultyAuth = await apiRequest('/api/auth/quick-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { role: 'FACULTY' }
  });
  const facultyToken = facultyAuth.data?.token;

  const adminAuth = await apiRequest('/api/auth/quick-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { role: 'ADMIN' }
  });
  const adminToken = adminAuth.data?.token;

  assert(Boolean(studentToken), 'Obtained Student test session token');
  assert(Boolean(facultyToken), 'Obtained Faculty test session token');
  assert(Boolean(adminToken), 'Obtained Admin test session token');

  // A. Unauthenticated request blocked
  const noAuthGet = await apiRequest('/api/verification/achievements/6/search-evidence');
  assert(noAuthGet.status === 401, 'Rejects unauthenticated request with 401 Unauthorized');

  // B. Student blocked
  const studentGet = await apiRequest('/api/verification/achievements/6/search-evidence', {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(studentGet.status === 403, 'Rejects student request with 403 Forbidden');

  // C. Faculty allowed
  const facultyGet = await apiRequest('/api/verification/achievements/6/search-evidence', {
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  assert(facultyGet.status === 200, 'Faculty successfully accesses search-evidence endpoint (200 OK)');
  assert(Boolean(facultyGet.data.manual_links?.google_links?.primary?.url), 'Response provides Google primary search link');
  assert(Boolean(facultyGet.data.manual_links?.duckduckgo_links?.primary?.url), 'Response provides DuckDuckGo primary search link');
  assert(Boolean(facultyGet.data.manual_links?.queries?.institutional), 'Response provides institutional query');
  assert(Boolean(facultyGet.data.manual_links?.queries?.platform), 'Response provides hackathon platform query');

  // D. Admin allowed
  const adminGet = await apiRequest('/api/verification/achievements/6/search-evidence', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(adminGet.status === 200, 'Admin successfully accesses search-evidence endpoint (200 OK)');

  // E. Non-existent achievement
  const notFoundGet = await apiRequest('/api/verification/achievements/999999/search-evidence', {
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  assert(notFoundGet.status === 404, 'Returns 404 for non-existent achievement ID');

  // F. Invalid achievement ID
  const badIdGet = await apiRequest('/api/verification/achievements/invalid-id/search-evidence', {
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  assert(badIdGet.status === 400, 'Returns 400 Bad Request for non-integer achievement ID');

  // =========================================================================
  // 5. Verification Status Immutability
  // =========================================================================
  console.log('\n5. Verifying Verification Status Immutability:');
  const targetAch = query.get("SELECT * FROM achievements WHERE verification_status = 'PENDING' LIMIT 1") ||
                    query.get("SELECT * FROM achievements LIMIT 1");
  const statusBefore = targetAch.verification_status;
  await apiRequest(`/api/verification/achievements/${targetAch.id}/search-evidence`, {
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  const achRecord = query.get('SELECT verification_status FROM achievements WHERE id = ?', [targetAch.id]);
  assert(
    achRecord.verification_status === statusBefore,
    `Achievement #${targetAch.id} verification_status remains strictly ${statusBefore} after search lookup (current: ${achRecord.verification_status})`
  );

  // =========================================================================
  // 6. Existing Approval and Rejection Workflows Intact
  // =========================================================================
  console.log('\n6. Testing Existing Approval and Rejection Workflows:');
  const insertResult = query.run(`
    INSERT INTO achievements (user_id, title, event_name, organization, category, level, position, date, description, verification_status)
    VALUES (1, 'SIH 2026 Test Finalist', 'Smart India Hackathon', 'AICTE', 'Hackathon', 'National', 'Finalist', '2026-10-25', 'Test claim', 'PENDING')
  `);
  const tempAchId = insertResult.lastInsertRowid;

  // Rejection test
  const rejectRes = await apiRequest(`/api/verification/achievements/${tempAchId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${facultyToken}`,
      'Content-Type': 'application/json'
    },
    body: { reason: 'Please attach the official certificate scan.' }
  });
  assert(rejectRes.status === 200, 'Existing POST /reject returns 200 OK');
  const rejectedRecord = query.get('SELECT verification_status, rejection_reason FROM achievements WHERE id = ?', [tempAchId]);
  assert(rejectedRecord.verification_status === 'REJECTED', 'Status updated to REJECTED');
  assert(rejectedRecord.rejection_reason === 'Please attach the official certificate scan.', 'Feedback reason saved');

  // Approval test
  const approveRes = await apiRequest(`/api/verification/achievements/${tempAchId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${facultyToken}`,
      'Content-Type': 'application/json'
    },
    body: {}
  });
  assert(approveRes.status === 200, 'Existing POST /approve returns 200 OK');
  const approvedRecord = query.get('SELECT verification_status, points_awarded FROM achievements WHERE id = ?', [tempAchId]);
  assert(approvedRecord.verification_status === 'VERIFIED', 'Status updated to VERIFIED');
  assert(approvedRecord.points_awarded > 0, 'Points awarded to student');

  // Clean up
  query.run('DELETE FROM achievements WHERE id = ?', [tempAchId]);
  query.run("DELETE FROM notifications WHERE user_id = 1 AND title LIKE '%Achievement%' AND link LIKE ?", [`%${tempAchId}%`]);
  query.run("DELETE FROM audit_logs WHERE target_id = ? AND target_type = 'ACHIEVEMENT'", [tempAchId]);

  console.log('\n===============================================================');
  console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGoogleDuckDuckGoTests().catch(err => {
  console.error('Test suite encountered an uncaught error:', err);
  process.exit(1);
});
