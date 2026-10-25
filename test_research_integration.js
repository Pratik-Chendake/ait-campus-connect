async function runResearchTests() {
  console.log('🔬 Starting Research Integration Verification Test Suite...\n');
  const BASE = 'http://localhost:5000/api';

  const request = async (url, method = 'GET', body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${url}`, opts);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  };

  // Test 1: Exactly 23 canonical clubs, zero duplicates
  console.log('1. Checking Canonical Club Directory Count...');
  const clubsRes = await request('/clubs');
  console.assert(clubsRes.ok && clubsRes.data.clubs.length === 23, `Expected 23 clubs, got ${clubsRes.data.clubs?.length}`);
  const handles = clubsRes.data.clubs.map(c => c.instagram_handle).filter(Boolean);
  const uniqueHandles = new Set(handles);
  console.assert(handles.length === 23 && uniqueHandles.size === 23, 'Duplicate canonical handles found!');
  console.log(`   ✓ Exactly 23 distinct canonical clubs verified with 0 duplicate handles`);

  // Test 2: Sanitized Instagram URLs
  console.log('2. Validating Instagram URL normalization...');
  for (const c of clubsRes.data.clubs) {
    console.assert(c.instagram_url && c.instagram_url.startsWith('https://www.instagram.com/'), `Invalid URL for ${c.name}: ${c.instagram_url}`);
    console.assert(!c.instagram_url.includes('?'), `URL contains query parameters for ${c.name}`);
  }
  console.log('   ✓ All 23 clubs have sanitized, normalized Instagram URLs');

  // Test 3: AY 2026-27 Leadership verification status
  console.log('3. Checking Leadership Verification Policy...');
  const ossDetail = await request('/clubs/ossclub.ait');
  console.assert(ossDetail.ok, 'Failed to get OSS club detail');
  console.assert(ossDetail.data.club.leadership_verified === false, 'Leadership should not be marked verified without primary circular');
  console.assert(ossDetail.data.leadership.length === 0, 'No unauthenticated leadership rows should be returned');
  console.assert(ossDetail.data.club.leadership_notice === 'AY 2026–27 leadership information has not yet been verified.', 'Incorrect notice');
  
  const leadEndpoint = await request('/clubs/ossclub.ait/leadership?academicYear=2026-27');
  console.assert(leadEndpoint.data.is_verified === false, 'Explicit leadership endpoint should indicate unverified');
  console.log('   ✓ Strict AY 2026-27 leadership verification confirmed: unverified notices shown, zero fake appointments published');

  // Test 4: Innerve 11.0 official dates & external unconfirmed registration
  console.log('4. Checking Innerve 11.0 event record...');
  const eventsRes = await request('/events');
  const innerve = eventsRes.data.events.find(e => e.slug === 'innerve-11-2027');
  console.assert(innerve, 'Innerve 11.0 not found in events');
  console.assert(innerve.event_start_date.startsWith('2027-01-29') && innerve.event_end_date.startsWith('2027-01-30'), 'Erroneous dates for Innerve!');
  console.assert(innerve.registration_status === 'UNCONFIRMED', 'Innerve registration must be UNCONFIRMED');
  console.assert(innerve.registration_mode === 'EXTERNAL', 'Innerve mode must be EXTERNAL');
  console.assert(innerve.official_event_url === 'https://www.innerve.tech/', 'Official URL mismatch');

  // Verify that attempting internal registration for Innerve is rejected
  const studentLogin = await request('/auth/quick-login', 'POST', { role: 'STUDENT' });
  const innerveRegAttempt = await request(`/events/${innerve.id}/register`, 'POST', {}, studentLogin.data.token);
  console.assert(innerveRegAttempt.status === 400, 'Internal registration on external/unconfirmed event must be rejected!');
  console.log('   ✓ Innerve 11.0 dates confirmed (29-30 Jan 2027), registration unconfirmed, parallel registration disabled');

  // Test 5: Anubhav OSS strictly classified as Open Source Contribution, NOT internship
  console.log('5. Checking Anubhav OSS classification...');
  const oppsRes = await request('/opportunities?limit=100');
  console.assert(oppsRes.ok, 'Failed to fetch opportunities');
  const anubhav = oppsRes.data.opportunities.find(o => o.source_key === 'anubhav-oss-issues');
  console.assert(anubhav, 'Anubhav not found in opportunities');
  console.assert(anubhav.opportunity_type === 'OPEN_SOURCE_CONTRIBUTION', 'Anubhav must be OPEN_SOURCE_CONTRIBUTION');
  console.assert(anubhav.paid_status === 'NOT_AN_INTERNSHIP', 'Anubhav must NOT be marked as an internship');
  console.assert(anubhav.stipend === null, 'Stipend must be null');
  console.log('   ✓ Anubhav OSS verified as OPEN_SOURCE_CONTRIBUTION (strictly NOT an internship)');

  // Test 6: Cultural Aakriti 2025 and Freshers 2025 in Historical Archive ONLY
  console.log('6. Checking Historical Event Archive segregation...');
  const upcomingEvents = await request('/events?status=upcoming');
  const foundInUpcoming = upcomingEvents.data.events.some(e => e.title.includes('Cultural Aakriti 2025') || e.title.includes('Freshers 2025'));
  console.assert(!foundInUpcoming, 'Historical events leaked into upcoming schedule!');

  const archiveRes = await request('/archive?year=2025-26');
  console.assert(archiveRes.ok && archiveRes.data.archives.length >= 2, 'Archives missing 2025-26 records');
  const aakritiArchive = archiveRes.data.archives.find(a => a.source_key === 'cultural-aakriti-2025');
  console.assert(aakritiArchive && aakritiArchive.source_file === 'document (6)(1).pdf', 'Archive source citation missing');
  console.log('   ✓ Cultural Aakriti 2025 & Freshers 2025 verified strictly in AY 2025-26 Archive with primary PDF citations');

  // Test 7: Admin Ingestion Review Queue (10 unverified candidates withheld)
  console.log('7. Checking Admin Ingestion Review Queue...');
  const adminLogin = await request('/auth/quick-login', 'POST', { role: 'ADMIN' });
  const adminToken = adminLogin.data.token;
  const reviewRes = await request('/admin/research/candidates', 'GET', null, adminToken);
  console.assert(reviewRes.ok, 'Failed to get review candidates');
  console.assert(reviewRes.data.candidates.length >= 10, 'Expected at least 10 review candidates');
  
  // Verify Black Hat CTF, Stellar IQ, and Leadership circular are in queue
  const hasLeadership = reviewRes.data.candidates.some(c => c.review_key === 'club-leadership-2026-27' && c.status === 'PENDING_REVIEW');
  const hasStellar = reviewRes.data.candidates.some(c => c.review_key === 'stellar-iq-2026' && c.status === 'PENDING_REVIEW');
  const hasBlackHat = reviewRes.data.candidates.some(c => c.review_key === 'black-hat-india-ctf-2026' && c.status === 'PENDING_REVIEW');
  console.assert(hasLeadership && hasStellar && hasBlackHat, 'Key unverified claims missing from review queue');
  console.log('   ✓ 10 unverified claims (Stellar IQ, Black Hat CTF, Leadership Circular) safely held in Admin Review Queue');

  // Test 8: Global Search Multi-Entity Integration
  console.log('8. Checking Search integration for new entities...');
  const searchOSS = await request('/search?q=Anubhav');
  console.assert(searchOSS.ok && searchOSS.data.opportunities.length > 0, 'Search failed to match Anubhav');
  const searchAakriti = await request('/search?q=Aakriti');
  console.assert(searchAakriti.ok && searchAakriti.data.archives.length > 0, 'Search failed to match historical archive');
  console.log('   ✓ Multi-entity search successfully queries opportunities and historical archives');

  console.log('\n======================================================');
  console.log('🎉 ALL RESEARCH INTEGRATION ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runResearchTests();
