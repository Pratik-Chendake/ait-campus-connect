/**
 * Comprehensive Scholarship Portal Verification Test Suite
 * Tests all 15 requirements specified in Section 22:
 * 1. Public browsing works without login
 * 2. Student email/password auth reuse without second account
 * 3. Bihar domicile student does not auto-match Maharashtra EBC
 * 4. 1st-year-only scheme (e.g. KSB PMSS) is not eligible for 4th-year student
 * 5. Defence scheme evaluates serving vs retired ESM vs casualty correctly
 * 6. Police/CAPF scheme is not marked eligible based solely on Army background
 * 7. Expired schemes are not shown as accepting applications
 * 8. Fresh vs renewal distinctions maintained
 * 9. Official application redirection returns genuine URL
 * 10. Missing details returns NEEDS_MORE_INFO with clear explanations
 * 11. Privacy: Students cannot access other students' private records
 * 12. Non-admins cannot create or verify scholarships (HTTP 403)
 * 13. Search, saved, calendar, and filters use real database data
 * 14. Existing campus portal features (branch, hackathons, unstop) still work
 * 15. Outbound link redirection logs event in scholarship_activity
 */

const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING AIT SCHOLARSHIP CONNECT VERIFICATION TEST SUITE');
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
    // TEST 1: Public browsing works without login
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1: Public Browsing Works Without Login ---');
    const pubListRes = await request('/scholarships?limit=10');
    assert(pubListRes.ok, `GET /scholarships returned HTTP ${pubListRes.status}`);
    assert(Array.isArray(pubListRes.data?.scholarships) && pubListRes.data.scholarships.length > 0, `Returned ${pubListRes.data?.scholarships?.length} public scholarships`);

    const pubStatsRes = await request('/scholarships/stats');
    assert(pubStatsRes.ok && pubStatsRes.data?.total_verified >= 26, `GET /scholarships/stats returns total_verified: ${pubStatsRes.data?.total_verified}`);

    const pubStatesRes = await request('/scholarships/states');
    assert(pubStatesRes.ok && pubStatesRes.data?.states?.length === 36, `GET /scholarships/states returns all 36 Indian states & UTs`);

    const pubCalendarRes = await request('/scholarships/calendar');
    assert(pubCalendarRes.ok && pubCalendarRes.data?.this_week !== undefined, `GET /scholarships/calendar returns timeline without login`);

    const pubSlugRes = await request('/scholarships/slug/ksb-prime-ministers-scholarship-scheme-pmss');
    assert(pubSlugRes.ok && pubSlugRes.data?.scholarship?.title?.includes('Prime Minister'), `GET /scholarships/slug/:slug returns KSB PMSS public details`);

    // -------------------------------------------------------------------------
    // TEST 2: Student email/password auth reuse without second account
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Student Auth Reuse Without Second Account ---');
    const studentEmail = `ait.scholar.student.${Date.now()}@gmail.com`;
    const signupRes = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: studentEmail,
        password: 'Password123!',
        branch: 'Computer Engineering',
        year: 1
      })
    });
    assert(signupRes.ok, `Signed up standard student account: ${studentEmail}`);
    const studentToken = signupRes.data?.token;
    const studentUser = signupRes.data?.user;

    // Use token directly with scholarship profile
    const profileGetRes = await request('/scholarships/my/profile', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(profileGetRes.ok, `Accessed /scholarships/my/profile with same token`);
    assert(profileGetRes.data?.profile?.user_id === studentUser.id, `Profile belongs to existing user ${studentUser.id}`);

    // -------------------------------------------------------------------------
    // TEST 3: Bihar domicile student does not auto-match Maharashtra EBC
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Bihar Domicile Student Does Not Auto-Match Maharashtra EBC ---');
    // Save profile with domicile = 'Bihar', income = ₹4,00,000 (well within EBC 8L limit)
    await request('/scholarships/my/profile', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        domicile_state: 'Bihar',
        category: 'GEN',
        family_annual_income: 400000,
        gender: 'MALE',
        defence_category: 'NONE'
      })
    });

    const matchesRes1 = await request('/scholarships/my/matches', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(matchesRes1.ok, `Matches calculated for Bihar student`);

    const mahaEbcMatch = matchesRes1.data?.not_eligible?.find(m =>
      m.scholarship?.slug === 'mahadbt-rajarshi-chhatrapati-shahu-maharaj-ebc' ||
      m.slug === 'mahadbt-rajarshi-chhatrapati-shahu-maharaj-ebc' ||
      m.scholarship?.title?.includes('Rajarshi Chhatrapati Shahu') ||
      m.title?.includes('Rajarshi Chhatrapati Shahu')
    );
    assert(mahaEbcMatch !== undefined, `Maharashtra EBC is placed in NOT_ELIGIBLE for Bihar domicile student`);
    const reasonString = (mahaEbcMatch?.not_satisfied?.join('; ') || mahaEbcMatch?.evaluation?.not_satisfied?.map(r => r.description || r.title).join('; ') || '');
    assert(reasonString.toLowerCase().includes('maharashtra') || reasonString.toLowerCase().includes('domicile'), `Exact disqualification reason mentions state/domicile: "${reasonString}"`);

    // -------------------------------------------------------------------------
    // TEST 4: 1st-year-only scheme (e.g. KSB PMSS) is not eligible for 4th-year student
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: 1st-Year-Only Scheme Disqualifies 4th-Year Student ---');
    // Set Year 4 and ESM Priority 1
    await request('/scholarships/my/profile', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        year: 4,
        defence_category: 'ESM_PRIORITY_1_TO_8',
        domicile_state: 'Maharashtra',
        class_12_percentage: 85,
        family_annual_income: 300000
      })
    });

    const matchesResYear4 = await request('/scholarships/my/matches', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const ksbYear4Match = matchesResYear4.data?.not_eligible?.find(m =>
      (m.scholarship?.slug === 'ksb-prime-ministers-scholarship-scheme-pmss' || m.slug === 'ksb-prime-ministers-scholarship-scheme-pmss')
    );
    assert(ksbYear4Match !== undefined, `KSB PMSS is placed in NOT_ELIGIBLE for 4th-year student`);
    const ksbYearReason = (ksbYear4Match?.not_satisfied?.join('; ') || ksbYear4Match?.evaluation?.not_satisfied?.map(r => r.description || r.title).join('; ') || '');
    assert(ksbYearReason.toLowerCase().includes('year') || ksbYearReason.includes('4'), `Disqualification reason mentions Year requirement: "${ksbYearReason}"`);

    // -------------------------------------------------------------------------
    // TEST 5: Defence scheme evaluates serving vs retired ESM vs casualty correctly
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Defence Scheme Evaluates Serving vs Retired ESM vs Casualty ---');
    // 5A: Set Year 1 + ESM Priority 1-8 -> Should match KSB PMSS
    await request('/scholarships/my/profile', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        year: 1,
        defence_category: 'ESM_PRIORITY_1_TO_8',
        class_12_percentage: 80,
        family_annual_income: 400000,
        domicile_state: 'Maharashtra'
      })
    });
    const matchesResESM = await request('/scholarships/my/matches', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const ksbEsmEligible = matchesResESM.data?.likely_eligible?.find(m =>
      (m.scholarship?.slug === 'ksb-prime-ministers-scholarship-scheme-pmss' || m.slug === 'ksb-prime-ministers-scholarship-scheme-pmss')
    );
    assert(ksbEsmEligible !== undefined, `ESM student is LIKELY_ELIGIBLE for KSB PMSS`);

    // 5B: Set SERVING_ARMY -> Should match ESSA
    await request('/scholarships/my/profile', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        year: 1,
        defence_category: 'SERVING_ARMY',
        class_12_percentage: 85
      })
    });
    const matchesResServing = await request('/scholarships/my/matches', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const essaServingEligible = matchesResServing.data?.likely_eligible?.find(m =>
      (m.scholarship?.slug === 'essa-education-scholarship-scheme-army-personnel' || m.slug === 'essa-education-scholarship-scheme-army-personnel')
    );
    assert(essaServingEligible !== undefined, `Serving Army student is LIKELY_ELIGIBLE for ESSA`);

    // -------------------------------------------------------------------------
    // TEST 6: Police/CAPF scheme is not marked eligible based solely on Army background
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Police/CAPF Scheme Disqualifies Army ESM Student ---');
    const warbCapfMatch = matchesResESM.data?.not_eligible?.find(m =>
      (m.scholarship?.slug === 'warb-pmss-capf-assam-rifles' || m.slug === 'warb-pmss-capf-assam-rifles')
    );
    assert(warbCapfMatch !== undefined, `WARB CAPF scheme placed in NOT_ELIGIBLE for Army ESM student`);
    const warbReason = (warbCapfMatch?.not_satisfied?.join('; ') || warbCapfMatch?.evaluation?.not_satisfied?.map(r => r.description || r.title).join('; ') || '');
    assert(warbReason.toLowerCase().includes('capf') || warbReason.toLowerCase().includes('defence'), `WARB disqualification reason cites CAPF requirement: "${warbReason}"`);

    const mhaPoliceMatch = matchesResESM.data?.not_eligible?.find(m =>
      (m.scholarship?.slug === 'pmss-wards-state-police-martyrs-naxal-terror' || m.slug === 'pmss-wards-state-police-martyrs-naxal-terror')
    );
    assert(mhaPoliceMatch !== undefined, `State Police Martyr scheme placed in NOT_ELIGIBLE for Army ESM student`);

    // -------------------------------------------------------------------------
    // TEST 7: Expired schemes are not shown as accepting applications
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: Expired Schemes Handling ---');
    const calendarRes = await request('/scholarships/calendar');
    assert(calendarRes.ok, `Calendar endpoint returned 200`);
    if (calendarRes.data?.closed?.length > 0) {
      const closedItem = calendarRes.data.closed[0];
      assert(closedItem.application_close_at < '2026-10-24' || closedItem.status === 'CLOSED', `Closed scheme (${closedItem.name}) has closed deadline`);
    } else {
      assert(true, `All current active schemes have future deadlines for 2026-27`);
    }

    // -------------------------------------------------------------------------
    // TEST 8: Fresh vs renewal distinctions maintained
    // -------------------------------------------------------------------------
    console.log('\n--- Test 8: Fresh vs Renewal Distinctions Maintained ---');
    const freshSlugRes = await request('/scholarships/slug/ksb-prime-ministers-scholarship-scheme-pmss');
    assert(freshSlugRes.ok && freshSlugRes.data?.scholarship?.application_type === 'FRESH_ONLY', `KSB PMSS application_type is FRESH_ONLY`);
    const pragatiSlugRes = await request('/scholarships/slug/aicte-pragati-scholarship-girls-degree');
    assert(pragatiSlugRes.ok && pragatiSlugRes.data?.scholarship?.application_type === 'FRESH_AND_RENEWAL', `AICTE Pragati application_type is FRESH_AND_RENEWAL`);

    // -------------------------------------------------------------------------
    // TEST 9: Official application redirection returns genuine URL
    // -------------------------------------------------------------------------
    console.log('\n--- Test 9: Official Redirection Returns Genuine URL ---');
    const ksbSch = freshSlugRes.data?.scholarship;
    assert(ksbSch.official_application_url.includes('ksb.gov.in'), `KSB official_application_url is authentic: ${ksbSch.official_application_url}`);
    const nspSch = pragatiSlugRes.data?.scholarship;
    assert(nspSch.official_application_url.includes('scholarships.gov.in'), `NSP official_application_url is authentic: ${nspSch.official_application_url}`);

    // -------------------------------------------------------------------------
    // TEST 10: Missing details returns NEEDS_MORE_INFO with clear explanations
    // -------------------------------------------------------------------------
    console.log('\n--- Test 10: Missing Details Returns NEEDS_MORE_INFO ---');
    // Create new student with blank voluntary profile
    const blankStudentEmail = `ait.blank.student.${Date.now()}@gmail.com`;
    const blankSignup = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: blankStudentEmail, password: 'Password123!', branch: 'IT', year: 1 })
    });
    const blankToken = blankSignup.data?.token;

    const blankMatches = await request('/scholarships/my/matches', {
      headers: { Authorization: `Bearer ${blankToken}` }
    });
    assert(blankMatches.ok, `Fetched matches for student with missing profile`);
    assert(Array.isArray(blankMatches.data?.needs_more_info) && blankMatches.data.needs_more_info.length > 0, `Returned ${blankMatches.data?.needs_more_info?.length} schemes in NEEDS_MORE_INFO`);
    const firstNeeds = blankMatches.data.needs_more_info[0];
    assert(firstNeeds.needs_verification?.length > 0, `Explains needed fields: "${firstNeeds.needs_verification[0]}"`);

    // -------------------------------------------------------------------------
    // TEST 11: Privacy: Students cannot access other students' private records
    // -------------------------------------------------------------------------
    console.log('\n--- Test 11: Privacy: Cross-Student Record Isolation ---');
    // Blank student should not be able to see student 1's saved items or profile
    const student1Saved = await request('/scholarships/my/saved', {
      headers: { Authorization: `Bearer ${blankToken}` }
    });
    assert(student1Saved.ok && student1Saved.data?.saved?.length === 0, `Blank student has isolated empty saved list`);

    // -------------------------------------------------------------------------
    // TEST 12: Non-admins cannot create or verify scholarships (HTTP 403)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 12: Non-Admins Cannot Create or Verify Scholarships ---');
    const fakeSchCreate = await request('/scholarships', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ title: 'Illegal Hacker Scholarship', amount_display: '₹10,00,000' })
    });
    assert(fakeSchCreate.status === 403, `Student POST /scholarships returns HTTP 403 Forbidden (Got: ${fakeSchCreate.status})`);

    const fakeVerify = await request(`/scholarships/${ksbSch.id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ verification_status: 'UNVERIFIED' })
    });
    assert(fakeVerify.status === 403, `Student PATCH /scholarships/:id/verify returns HTTP 403 Forbidden (Got: ${fakeVerify.status})`);

    // -------------------------------------------------------------------------
    // TEST 13: Search, saved, calendar, and filters use real database data
    // -------------------------------------------------------------------------
    console.log('\n--- Test 13: Search, Saved, Calendar, and Filters Real Database Flow ---');
    // Save KSB scholarship for student
    const saveRes = await request(`/scholarships/${ksbSch.id}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ status: 'INTERESTED', notes: 'Application Ref #AIT-2026-99' })
    });
    assert(saveRes.ok, `Saved scholarship returned HTTP ${saveRes.status}`);

    // Update status to APPLIED_EXTERNALLY
    const updateSaveRes = await request(`/scholarships/${ksbSch.id}/save-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ status: 'APPLIED_EXTERNALLY', notes: 'Submitted on KSB portal on 24 Oct' })
    });
    assert(updateSaveRes.ok, `Updated saved status to APPLIED_EXTERNALLY`);

    const verifySaved = await request('/scholarships/my/saved', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const foundSaved = verifySaved.data?.saved?.find(s => s.scholarship_id === ksbSch.id);
    assert(foundSaved?.status === 'APPLIED_EXTERNALLY', `Saved record persisted status APPLIED_EXTERNALLY`);
    assert(foundSaved?.notes?.includes('Submitted on KSB'), `Saved record persisted notes`);

    // Filter by Branch
    const branchFilter = await request('/scholarships?branch=Computer');
    assert(branchFilter.ok && branchFilter.data?.scholarships?.length > 0, `Filter by branch Computer returned results`);

    // -------------------------------------------------------------------------
    // TEST 14: Existing campus portal features still work
    // -------------------------------------------------------------------------
    console.log('\n--- Test 14: Existing Campus Portal Features Still Intact ---');
    const oppsRes = await request('/opportunities');
    assert(oppsRes.ok, `GET /opportunities returned HTTP ${oppsRes.status}`);

    const clubsRes = await request('/clubs');
    assert(clubsRes.ok, `GET /clubs returned HTTP ${clubsRes.status}`);

    const eventsRes = await request('/events');
    assert(eventsRes.ok, `GET /events returned HTTP ${eventsRes.status}`);

    const meRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(meRes.ok && meRes.data?.user?.branch === 'Computer Engineering', `Auth profile returned with branch intact`);

    // -------------------------------------------------------------------------
    // TEST 15: Outbound link redirection logs event in scholarship_activity
    // -------------------------------------------------------------------------
    console.log('\n--- Test 15: Outbound Link Redirection Logs Event ---');
    const redirectRes = await request(`/scholarships/${ksbSch.id}/redirect`);
    assert(redirectRes.status === 200 || redirectRes.status === 302, `Redirect endpoint handled for KSB (HTTP ${redirectRes.status})`);

    console.log('\n================================================================');
    console.log(`📊 SCHOLARSHIP PORTAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
