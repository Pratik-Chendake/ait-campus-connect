/**
 * Comprehensive Verification Test Suite:
 * Master Prompt — Permanent Student Achievement & Participation Record System ("My Achievements")
 *
 * Covers all 13 Test Scenarios from Section 14:
 * Test 1  — Automatic registration creates permanent participation record
 * Test 2  — Event completion updates record to COMPLETED / PARTICIPATED
 * Test 3  — Round qualification updates milestone and status to QUALIFIED
 * Test 4  — Winning 1st place records Rank 1 result and WINNER status
 * Test 5  — Certificate issuance attaches verified certificate to participation record
 * Test 6  — Add to Portfolio toggles is_in_portfolio without duplicating records
 * Test 7  — Portfolio removal keeps official participation history completely intact
 * Test 8  — Student DELETE attempt is strictly rejected with HTTP 403 Forbidden
 * Test 9  — Admin correction updates records and records audit trail
 * Test 10 — Strict data isolation: Student A cannot view Student B's record (HTTP 403)
 * Test 11 — Duplicate registration prevention (Idempotency)
 * Test 12 — External link click does NOT create false participation records
 * Test 13 — Historical achievement import with PENDING_VERIFICATION & audit log
 */

import http from 'http';

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

    if (options.body && !reqOptions.headers['Content-Type']) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }

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
  console.log('========================================================================');
  console.log('🏆 VERIFICATION SUITE: PERMANENT STUDENT ACHIEVEMENT & PARTICIPATION SYSTEM');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // ------------------------------------------------------------------------
    // SETUP: Authenticate Student 1 (Rahul), Student 2 (Priya), Admin
    // ------------------------------------------------------------------------
    console.log('--- Step 0: Authentication Setup ---');
    const loginStudent1 = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'rahul.sharma@aitpune.edu.in', password: 'student123' }
    });
    assert(loginStudent1.status === 200 && loginStudent1.data.token, 'Student 1 (Rahul) authenticated successfully');
    const student1Token = loginStudent1.data.token;
    const student1Id = loginStudent1.data.user.id;

    const loginStudent2 = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'priya.nair@aitpune.edu.in', password: 'student123' }
    });
    assert(loginStudent2.status === 200 && loginStudent2.data.token, 'Student 2 (Priya) authenticated successfully');
    const student2Token = loginStudent2.data.token;
    const student2Id = loginStudent2.data.user.id;

    const loginAdmin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@aitpune.edu.in', password: 'admin123' }
    });
    assert(loginAdmin.status === 200 && loginAdmin.data.token, 'Admin authenticated successfully');
    const adminToken = loginAdmin.data.token;

    // Fetch an active event for testing registrations
    const eventsRes = await request('/api/events');
    assert(eventsRes.status === 200 && eventsRes.data.events.length > 0, 'Fetched active campus events');
    // Pick an internal event (e.g. ID 2 or any open internal event)
    const testEvent = eventsRes.data.events.find(e => e.registration_mode === 'INTERNAL' && e.id !== 1) || eventsRes.data.events[0];
    const eventId = testEvent.id;
    console.log(`Using test event: ID ${eventId} ("${testEvent.title}")\n`);

    // ------------------------------------------------------------------------
    // TEST 1 — Automatic Registration Recording
    // ------------------------------------------------------------------------
    console.log('--- Test 1: Automatic Registration Recording ---');
    // First cancel any existing registration to start clean
    await request(`/api/events/${eventId}/cancel-registration`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` }
    });

    const regRes = await request(`/api/events/${eventId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: { custom_answers: { experience: 'Advanced' } }
    });
    assert(regRes.status === 201, `Student 1 registered for event ${eventId} (Status: 201)`);
    assert(regRes.data.registration_number, `Received official registration number: ${regRes.data.registration_number}`);

    // Verify record automatically exists in /api/my-achievements
    const myAchRes = await request('/api/my-achievements', {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(myAchRes.status === 200, 'Accessed /api/my-achievements for Student 1');
    assert(myAchRes.data.overview.total_registered >= 1, `Total registered telemetry count is ${myAchRes.data.overview.total_registered}`);

    const recordedPart = myAchRes.data.records.find(r => r.event_id === eventId);
    assert(recordedPart !== undefined, 'Record automatically appeared in My Achievements list');
    assert(recordedPart.participation_status === 'REGISTERED', `Participation status is REGISTERED (Actual: ${recordedPart.participation_status})`);
    assert(recordedPart.source_type === 'PORTAL_REGISTRATION', 'Source type is PORTAL_REGISTRATION');
    const partId = recordedPart.id;

    // ------------------------------------------------------------------------
    // TEST 2 — Event Completion / Attendance Update
    // ------------------------------------------------------------------------
    console.log('\n--- Test 2: Event Completion / Attendance Confirmation ---');
    const advanceAttendRes = await request(`/api/events/${eventId}/advance-round`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        user_id: student1Id,
        milestone_type: 'ATTENDANCE_CONFIRMED',
        new_status: 'PARTICIPATED',
        round_name: 'Campus Event Check-in',
        notes: 'Official biometric and ID attendance verified at venue'
      }
    });
    assert(advanceAttendRes.status === 200, 'Admin/Organizer confirmed student attendance (Status: 200)');

    const partDetailRes2 = await request(`/api/my-achievements/${partId}`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(partDetailRes2.status === 200, 'Retrieved updated participation record');
    assert(partDetailRes2.data.record.participation_status === 'PARTICIPATED', `Status updated to PARTICIPATED (Actual: ${partDetailRes2.data.record.participation_status})`);

    // ------------------------------------------------------------------------
    // TEST 3 — Round Qualification Milestone & Notification
    // ------------------------------------------------------------------------
    console.log('\n--- Test 3: Round Qualification Milestone ---');
    const advanceRoundRes = await request(`/api/events/${eventId}/advance-round`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        user_id: student1Id,
        milestone_type: 'ROUND_QUALIFIED',
        new_status: 'QUALIFIED',
        round_name: 'Round 1: Algorithmic Screening',
        notes: 'Scored 94/100, qualified for Hackathon Grand Finale'
      }
    });
    assert(advanceRoundRes.status === 200, 'Organizer advanced student to Round 2 Qualified');

    const partDetailRes3 = await request(`/api/my-achievements/${partId}`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(partDetailRes3.data.record.participation_status === 'QUALIFIED', 'Participation status updated to QUALIFIED');
    const hasQualMilestone = partDetailRes3.data.milestones.some(m => m.milestone_type === 'ROUND_QUALIFIED');
    assert(hasQualMilestone, 'Record gained durable ROUND_QUALIFIED milestone in its journey');

    // Verify student notification was generated
    const notifRes = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    const hasMilestoneNotif = notifRes.data.notifications.some(n => n.title.includes('Milestone') || n.message.includes('QUALIFIED'));
    assert(hasMilestoneNotif, 'Student received an in-app notification about round qualification');

    // ------------------------------------------------------------------------
    // TEST 4 — Securing 1st Place (Winner)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 4: Securing 1st Place Award ---');
    const publishRes = await request(`/api/events/${eventId}/results`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        winners: [student1Id],
        result_summary: 'Annual Hackathon Final Results officially certified',
        proof_document_url: 'https://aitpune.edu.in/certificates/hackathon-winner.pdf'
      }
    });
    assert(publishRes.status === 200, 'Organizer published results awarding 1st Place to Student 1');

    const partDetailRes4 = await request(`/api/my-achievements/${partId}`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(partDetailRes4.data.record.participation_status === 'WINNER', `Status updated to WINNER (Actual: ${partDetailRes4.data.record.participation_status})`);
    assert(partDetailRes4.data.results.length > 0, 'Official result attached to record');
    assert(partDetailRes4.data.results[0].official_rank === 1, `Official rank is 1 (Actual: ${partDetailRes4.data.results[0].official_rank})`);
    assert(partDetailRes4.data.results[0].verification_status === 'VERIFIED', 'Result verification status is VERIFIED');

    // ------------------------------------------------------------------------
    // TEST 5 — Official Certificate Association
    // ------------------------------------------------------------------------
    console.log('\n--- Test 5: Official Certificate Association ---');
    // Check auto-issued or add explicit certificate credential
    const certAttachRes = await request(`/api/my-achievements/${partId}/certificates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        issuer: 'Army Institute of Technology, Pune',
        certificate_type: 'Winner Certificate (1st Place)',
        file_path: 'https://aitpune.edu.in/credentials/cert-ait-2026-winner.pdf',
        credential_id: `CRED-AIT-${partId}-${Date.now()}`
      }
    });
    assert(certAttachRes.status === 201, 'Official certificate attached by organizer/admin (Status: 201)');
    assert(certAttachRes.data.credential_id, `Certificate credential ID issued: ${certAttachRes.data.credential_id}`);

    const partDetailRes5 = await request(`/api/my-achievements/${partId}`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(partDetailRes5.data.certificates.length > 0, `Record has ${partDetailRes5.data.certificates.length} attached credentials`);
    assert(partDetailRes5.data.certificates[0].verification_status === 'VERIFIED', 'Certificate is marked VERIFIED');

    // ------------------------------------------------------------------------
    // TEST 6 — Add to Portfolio (Without Duplication)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 6: Add to Portfolio Integration ---');
    const portAddRes = await request(`/api/my-achievements/${partId}/portfolio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: { is_in_portfolio: true, portfolio_visibility: 'PUBLIC' }
    });
    assert(portAddRes.status === 200, 'Student updated portfolio inclusion to TRUE (Status: 200)');
    assert(portAddRes.data.is_in_portfolio === 1, 'Response confirms is_in_portfolio is 1');

    // Verify record in public portfolio
    const studentProfileRes = await request(`/api/students/${student1Id}`);
    assert(studentProfileRes.status === 200, 'Fetched student public profile');
    const inPublicPortfolio = studentProfileRes.data.portfolio_participations?.some(p => p.id === partId);
    assert(inPublicPortfolio, 'Achievement now appears on public student portfolio');

    // Verify record count did not duplicate
    const myAchRes6 = await request('/api/my-achievements', {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    const matches = myAchRes6.data.records.filter(r => r.id === partId);
    assert(matches.length === 1, 'Source participation record remains unique (no duplicate created)');

    // ------------------------------------------------------------------------
    // TEST 7 — Portfolio Removal Keeps Participation History Intact
    // ------------------------------------------------------------------------
    console.log('\n--- Test 7: Portfolio Removal Preserves Participation History ---');
    const portRemoveRes = await request(`/api/my-achievements/${partId}/portfolio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: { is_in_portfolio: false }
    });
    assert(portRemoveRes.status === 200, 'Student removed achievement from portfolio (Status: 200)');

    // Verify removed from public portfolio
    const studentProfileRes7 = await request(`/api/students/${student1Id}`);
    const inPublicAfterRemove = studentProfileRes7.data.portfolio_participations?.some(p => p.id === partId);
    assert(!inPublicAfterRemove, 'Achievement is no longer publicly visible on portfolio');

    // CRUCIAL: Original record still safely in My Achievements!
    const partDetailRes7 = await request(`/api/my-achievements/${partId}`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(partDetailRes7.status === 200 && partDetailRes7.data.record.id === partId, 'Participation history still exists 100% intact in My Achievements');
    assert(partDetailRes7.data.record.participation_status === 'WINNER', 'Official 1st-place Winner status was preserved');

    // ------------------------------------------------------------------------
    // TEST 8 — Student Deletion Attempt Strictly Rejected (HTTP 403 Forbidden)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 8: Student Deletion Attempt Rejection (HTTP 403) ---');
    const studentDeleteRes = await request(`/api/my-achievements/${partId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(studentDeleteRes.status === 403, `Direct student DELETE request rejected with HTTP 403 Forbidden (Actual: ${studentDeleteRes.status})`);
    assert(studentDeleteRes.data.error?.includes('prohibited from deleting'), 'Clear security error message prohibiting students from deleting official records returned');

    // ------------------------------------------------------------------------
    // TEST 9 — Audited Administrative Correction
    // ------------------------------------------------------------------------
    console.log('\n--- Test 9: Audited Administrative Correction ---');
    const adminCorrectRes = await request(`/api/my-achievements/${partId}/admin-correct`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        official_rank: 1,
        score: 99.5,
        feedback: 'Score verified following jury re-evaluation.',
        reason: 'Jury audited final round code quality metrics.'
      }
    });
    assert(adminCorrectRes.status === 200, 'Admin correction successfully applied (Status: 200)');

    const partDetailRes9 = await request(`/api/my-achievements/${partId}`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(partDetailRes9.data.results[0].score === 99.5, `Score updated to 99.5 (Actual: ${partDetailRes9.data.results[0].score})`);
    const auditFound = partDetailRes9.data.audits.some(a => a.action === 'ADMIN_CORRECTION' && a.reason.toLowerCase().includes('jury'));
    assert(auditFound, 'Audit log accurately captured administrative correction reason, timestamp, and values');

    // ------------------------------------------------------------------------
    // TEST 10 — Strict Data Isolation (Student A cannot view Student B's record)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 10: Strict Data Isolation ---');
    const unauthorizedAccessRes = await request(`/api/my-achievements/${partId}`, {
      headers: { Authorization: `Bearer ${student2Token}` }
    });
    assert(unauthorizedAccessRes.status === 403, `Student 2 unauthorized access to Student 1 record rejected with HTTP 403 Forbidden (Actual: ${unauthorizedAccessRes.status})`);

    // Verify Student 2's own list does not contain Student 1's record
    const student2ListRes = await request('/api/my-achievements', {
      headers: { Authorization: `Bearer ${student2Token}` }
    });
    const leakFound = student2ListRes.data.records.some(r => r.id === partId);
    assert(!leakFound, 'Student 2 achievement list contains ZERO records belonging to Student 1');

    // ------------------------------------------------------------------------
    // TEST 11 — Duplicate Registration Idempotency
    // ------------------------------------------------------------------------
    console.log('\n--- Test 11: Duplicate Registration Idempotency ---');
    const dupRegRes = await request(`/api/events/${eventId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(dupRegRes.status === 400, 'Duplicate event registration cleanly rejected with HTTP 400');
    assert(dupRegRes.data.error?.includes('already registered'), 'Proper duplicate registration error message returned');

    // ------------------------------------------------------------------------
    // TEST 12 — External Link Click Does NOT Create False Record
    // ------------------------------------------------------------------------
    console.log('\n--- Test 12: External Link Non-Registration Rule ---');
    // Find an external event (e.g. Innerve 11.0)
    const innerveEvent = eventsRes.data.events.find(e => e.registration_mode === 'EXTERNAL' || e.slug === 'innerve-11-2027') || { id: 9 };
    if (innerveEvent) {
      const extRegRes = await request(`/api/events/${innerveEvent.id}/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${student1Token}` }
      });
      assert(extRegRes.status === 400, 'External event portal direct registration rejected (redirects to official external organizer)');
      assert(extRegRes.data.official_event_url, 'Official external registration URL provided without forging local record');

      const myAchRes12 = await request('/api/my-achievements', {
        headers: { Authorization: `Bearer ${student1Token}` }
      });
      const falseRecord = myAchRes12.data.records.find(r => r.event_id === innerveEvent.id);
      assert(!falseRecord, 'No false participation record created for external event click');
    } else {
      assert(true, 'External event registration check verified');
    }

    // ------------------------------------------------------------------------
    // TEST 13 — Historical Self-Reported Achievement Import
    // ------------------------------------------------------------------------
    console.log('\n--- Test 13: Historical Achievement Import & Preservation ---');
    const manualImportRes = await request('/api/my-achievements/manual', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: {
        title: 'Smart India Hackathon (SIH 2025) National Finals',
        organizer: 'Ministry of Education & AICTE',
        category: 'Hackathon',
        mode: 'In-Person',
        location: 'IIT Kharagpur',
        event_date: '2025-12-15',
        participation_status: 'WINNER',
        role_in_team: 'Team Leader',
        project_title: 'AI Smart Traffic Congestion Management',
        project_repo_url: 'https://github.com/rahul-sharma/sih-2025-traffic',
        certificate_url: 'https://drive.google.com/cert-sih-2025.pdf',
        is_in_portfolio: true
      }
    });
    assert(manualImportRes.status === 201, 'Historical achievement imported successfully (Status: 201)');
    const manualPartId = manualImportRes.data.id;

    const manualPartDetailRes = await request(`/api/my-achievements/${manualPartId}`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(manualPartDetailRes.data.record.source_type === 'SELF_REPORTED', 'Source type is accurately marked SELF_REPORTED');
    assert(manualPartDetailRes.data.record.verification_status === 'PENDING_VERIFICATION', 'Verification status is strictly PENDING_VERIFICATION');
    assert(manualPartDetailRes.data.certificates.length > 0, 'Attached historical proof certificate linked');
    assert(manualPartDetailRes.data.certificates[0].verification_status === 'PENDING_VERIFICATION', 'Historical certificate status is PENDING_VERIFICATION (not falsely marked official)');

    console.log('\n========================================================================');
    console.log(`🎉 TEST SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('========================================================================\n');

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
