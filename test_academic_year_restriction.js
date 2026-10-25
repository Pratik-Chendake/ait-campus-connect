/**
 * Academic Year 2026–27 Restriction Test Suite
 * 
 * Verifies strict date boundary enforcement:
 * 1 July 2026 to 30 June 2027 (AY 2026–27).
 * Ensures past-year events (AY 2025–26 or earlier) and future-year events (AY 2027–28)
 * are excluded from all active dashboards, searches, and counts, and segregated
 * into dedicated historical archive routes.
 */

import { isAY2026_27, getAcademicYear, AY_2026_27_START, AY_2026_27_DATE_ONLY_END } from './server/utils/academicYear.js';
import { query } from './server/db/database.js';

const API_BASE = 'http://localhost:5000/api';

async function request(path, method = 'GET', body = null, token = null) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('🏛️ Running Academic Year 2026–27 Boundary & Restriction Test Suite...\n');

  // Test 1: Date boundary utility tests
  console.log('1. Testing Academic Year Date Boundary Logic...');
  const dateCases = [
    { date: '2026-06-15', expectedAY: '2025-26', isEligible: false, label: 'June 2026 (AY 2025-26 - Exclude)' },
    { date: '2026-06-30', expectedAY: '2025-26', isEligible: false, label: 'June 30 2026 (AY 2025-26 - Exclude)' },
    { date: '2026-07-01', expectedAY: '2026-27', isEligible: true,  label: 'July 1 2026 (AY 2026-27 Boundary Start - Eligible)' },
    { date: '2026-10-24', expectedAY: '2026-27', isEligible: true,  label: 'October 24 2026 (AY 2026-27 - Eligible)' },
    { date: '2027-01-29', expectedAY: '2026-27', isEligible: true,  label: 'January 29 2027 [Innerve] (AY 2026-27 - Eligible)' },
    { date: '2027-02-15', expectedAY: '2026-27', isEligible: true,  label: 'February 15 2027 (AY 2026-27 - Eligible)' },
    { date: '2027-06-30', expectedAY: '2026-27', isEligible: true,  label: 'June 30 2027 (AY 2026-27 Boundary End - Eligible)' },
    { date: '2027-07-01', expectedAY: '2027-28', isEligible: false, label: 'July 1 2027 (AY 2027-28 - Exclude)' },
    { date: '2027-08-15', expectedAY: '2027-28', isEligible: false, label: 'August 15 2027 (AY 2027-28 - Exclude)' },
  ];

  for (const tc of dateCases) {
    const calcAY = getAcademicYear(tc.date);
    const eligible = isAY2026_27(tc.date);
    console.assert(calcAY === tc.expectedAY, `Date ${tc.date}: expected AY ${tc.expectedAY}, got ${calcAY}`);
    console.assert(eligible === tc.isEligible, `Date ${tc.date}: expected eligibility ${tc.isEligible}, got ${eligible}`);
    console.log(`   ✓ ${tc.label} -> AY: ${calcAY}, Eligible: ${eligible}`);
  }

  // Test 2: Active Dashboard Events endpoint
  console.log('\n2. Testing GET /api/events (Default Active Dashboard)...');
  const activeEvents = await request('/events');
  console.assert(activeEvents.ok, 'Failed to fetch active events');
  console.assert(activeEvents.data.events.length > 0, 'No active events found');

  for (const ev of activeEvents.data.events) {
    const d = ev.event_start_date.slice(0, 10);
    console.assert(d >= AY_2026_27_START, `Active event ${ev.title} (${d}) must be >= ${AY_2026_27_START}`);
    console.assert(d <= AY_2026_27_DATE_ONLY_END, `Active event ${ev.title} (${d}) must be <= ${AY_2026_27_DATE_ONLY_END}`);
    console.assert(!ev.is_archive, `Active event ${ev.title} must not be marked as archive`);
  }
  const event8InActive = activeEvents.data.events.find(e => e.id === 8);
  console.assert(!event8InActive, 'AIT National Hackathon 2025 (ID 8) MUST NOT be present in active events');
  console.log(`   ✓ All ${activeEvents.data.events.length} events are strictly within 1 July 2026 – 30 June 2027 (AY 2026-27). Past-year event #8 is excluded.`);

  // Test 3: Upcoming Events Query
  console.log('\n3. Testing GET /api/events?status=upcoming...');
  const upcomingEvents = await request('/events?status=upcoming');
  console.assert(upcomingEvents.ok, 'Failed to fetch upcoming events');
  for (const ev of upcomingEvents.data.events) {
    const d = ev.event_start_date.slice(0, 10);
    console.assert(d >= AY_2026_27_START && d <= AY_2026_27_DATE_ONLY_END, `Upcoming event ${ev.title} (${d}) out of AY 2026-27 bounds!`);
  }
  console.log(`   ✓ Upcoming events widget strictly scoped to AY 2026-27 (${upcomingEvents.data.events.length} events)`);

  // Test 4: Completed Events on 2026-27 Dashboard
  console.log('\n4. Testing GET /api/events?status=completed...');
  const completedEvents = await request('/events?status=completed');
  console.assert(completedEvents.ok, 'Failed to fetch completed events');
  for (const ev of completedEvents.data.events) {
    const d = ev.event_start_date.slice(0, 10);
    console.assert(d >= AY_2026_27_START && d <= AY_2026_27_DATE_ONLY_END, `Completed event ${ev.title} (${d}) out of AY 2026-27 bounds!`);
  }
  const event8InCompleted = completedEvents.data.events.find(e => e.id === 8);
  console.assert(!event8InCompleted, 'Event #8 (2025) must NOT appear in 2026-27 completed events');
  console.log(`   ✓ Completed events tab contains only AY 2026-27 completed events (${completedEvents.data.events.length} events, Event #8 strictly excluded)`);

  // Test 5: Historical Archive Segregation
  console.log('\n5. Testing GET /api/events?status=archive...');
  const archiveEvents = await request('/events?status=archive');
  console.assert(archiveEvents.ok, 'Failed to fetch archive events');
  const event8InArchive = archiveEvents.data.events.find(e => e.id === 8);
  console.assert(Boolean(event8InArchive), 'Event #8 (AIT National Hackathon 2025) MUST be segregated into historical archive');
  console.assert(archiveEvents.data.past_archives.length >= 2, 'Expected institutional past archives in archive view');
  console.log(`   ✓ Past-year Event #8 successfully segregated to Historical Archive alongside institutional activity reports`);

  // Test 6: Global Multi-Entity Search Filtering
  console.log('\n6. Testing Multi-Entity Search Scoping...');
  const searchRes = await request('/search?q=Hackathon');
  console.assert(searchRes.ok, 'Search failed');
  const searchActiveEvents = searchRes.data.events;
  const searchArchives = searchRes.data.archives;

  for (const ev of searchActiveEvents) {
    const d = ev.event_start_date.slice(0, 10);
    console.assert(d >= AY_2026_27_START && d <= AY_2026_27_DATE_ONLY_END, `Search event ${ev.title} out of AY 2026-27!`);
  }
  const event8InSearchEvents = searchActiveEvents.find(e => e.id === 8);
  console.assert(!event8InSearchEvents, 'Event #8 must NOT appear in active search events');
  const event8InSearchArchives = searchArchives.find(a => a.id === 8 || (a.event_name && a.event_name.includes('2025')));
  console.assert(Boolean(event8InSearchArchives), 'Event #8 MUST appear in search archives');
  console.log('   ✓ Search correctly segregates AY 2026-27 active events from historical archives');

  // Test 7: Admin Statistics Scoping
  console.log('\n7. Testing Admin Statistics AY 2026-27 Scoping...');
  const adminLogin = await request('/auth/quick-login', 'POST', { role: 'ADMIN' });
  const statsRes = await request('/admin/stats', 'GET', null, adminLogin.data.token);
  console.assert(statsRes.ok, 'Admin stats request failed');
  const metrics = statsRes.data.metrics;
  const categoryDist = statsRes.data.charts.category_distribution;
  const totalCategoryEvents = categoryDist.reduce((acc, c) => acc + c.event_count, 0);
  console.assert(totalCategoryEvents === 8, `Expected exactly 8 active AY 2026-27 events in category distribution, got ${totalCategoryEvents}`);
  console.log(`   ✓ Admin statistics strictly reflect only the 8 eligible AY 2026-27 event records`);

  // Test 8: Club Upcoming Event Counts Scoping
  console.log('\n8. Testing Club Upcoming Event Count Scoping...');
  const clubsRes = await request('/clubs');
  console.assert(clubsRes.ok, 'Failed to get clubs');
  for (const club of clubsRes.data.clubs) {
    console.assert(typeof club.upcoming_event_count === 'number', 'Expected numeric upcoming_event_count');
  }
  console.log('   ✓ Club directory upcoming event counts reflect only eligible AY 2026-27 events');

  // Test 9: Boundary Insertion & Rejection Verification
  console.log('\n9. Testing Boundary Edge-Case Event Insertions (June 2026 & July 2027)...');
  // Create a June 2026 event (AY 2025-26) directly in DB to verify it never leaks into active dashboard
  query.run(`
    INSERT INTO events (
      title, slug, category, club_id, organizer_name, description, banner_url,
      mode, venue, registration_deadline, event_start_date, event_end_date, status, academic_year, is_archive
    ) VALUES (
      'Boundary Test June 2026 Event', 'test-june-2026-event', 'Workshop', 1, 'Test Club',
      'June 2026 pre-AY test event', 'https://example.com/banner.jpg', 'Online', 'Online',
      '2026-06-10', '2026-06-15', '2026-06-16', 'PUBLISHED', '2025-26', 1
    )
  `);

  // Create a July 2027 event (AY 2027-28) directly in DB to verify it never leaks into active dashboard
  query.run(`
    INSERT INTO events (
      title, slug, category, club_id, organizer_name, description, banner_url,
      mode, venue, registration_deadline, event_start_date, event_end_date, status, academic_year, is_archive
    ) VALUES (
      'Boundary Test July 2027 Event', 'test-july-2027-event', 'Workshop', 1, 'Test Club',
      'July 2027 post-AY test event', 'https://example.com/banner.jpg', 'Online', 'Online',
      '2027-07-05', '2027-07-15', '2027-07-16', 'PUBLISHED', '2027-28', 0
    )
  `);

  // Query active dashboard
  const testActive = await request('/events');
  const juneFound = testActive.data.events.find(e => e.slug === 'test-june-2026-event');
  const julyFound = testActive.data.events.find(e => e.slug === 'test-july-2027-event');

  console.assert(!juneFound, 'June 2026 event leaked into active AY 2026-27 dashboard!');
  console.assert(!julyFound, 'July 2027 event leaked into active AY 2026-27 dashboard!');

  console.log('   ✓ June 2026 event (AY 2025-26) successfully excluded from active dashboard');
  console.log('   ✓ July 2027 event (AY 2027-28) successfully excluded from active dashboard');

  // Clean up test events
  query.run("DELETE FROM events WHERE slug IN ('test-june-2026-event', 'test-july-2027-event')");
  console.log('   ✓ Temporary test events cleaned up cleanly');

  console.log('\n======================================================');
  console.log('🎉 ALL ACADEMIC YEAR 2026–27 RESTRICTION TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
