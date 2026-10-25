/**
 * Comprehensive Branch Feature Verification Test Suite
 * Tests end-to-end functionality for the AIT Engineering Branch feature:
 * - Registration with Branch dropdown selection
 * - Database persistence in users table
 * - Login returning saved branch
 * - Profile editing / updating branch
 * - Student Directory filtering by branch
 * - Teammate Matcher filtering by branch
 * - Super Admin user directory filtering by branch
 * - Super Admin PATCH user branch endpoint
 * - Graceful fallback handling for users with branch = null
 * - Leaderboard filtering by branch
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
  console.log('========================================================');
  console.log('🧪 RUNNING BRANCH FEATURE VERIFICATION TEST SUITE');
  console.log('========================================================\n');

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
    // TEST 1: Register new student account with "Automation & Robotics" branch
    // -------------------------------------------------------------------------
    console.log('--- Test 1: Sign Up With Branch Selection ---');
    const testEmail = `ait.branch.test.${Date.now()}@gmail.com`;
    const signupRes = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
        branch: 'Automation & Robotics'
      })
    });

    assert(signupRes.ok, `Sign-up returned HTTP ${signupRes.status}`);
    assert(signupRes.data?.user?.branch === 'Automation & Robotics', `User branch set to "Automation & Robotics" (Got: ${signupRes.data?.user?.branch})`);
    assert(signupRes.data?.user?.role === 'STUDENT', `Role is STUDENT`);
    const studentToken = signupRes.data?.token;
    const studentId = signupRes.data?.user?.id;

    // -------------------------------------------------------------------------
    // TEST 2: Login and verify branch persistence
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Login & Verify Branch Persistence ---');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!'
      })
    });

    assert(loginRes.ok, `Login returned HTTP ${loginRes.status}`);
    assert(loginRes.data?.user?.branch === 'Automation & Robotics', `Login payload preserved branch: ${loginRes.data?.user?.branch}`);

    // -------------------------------------------------------------------------
    // TEST 3: Student Profile Edit - Update branch to Mechanical Engineering
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Student Updates Branch via Profile Settings ---');
    const updateRes = await request(`/students/${studentId}/profile`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        branch: 'Mechanical Engineering',
        year: 2,
        semester: 4,
        bio: 'Aspiring Mechanical and Mechatronics Engineer at AIT Pune.'
      })
    });

    assert(updateRes.ok, `Profile update returned HTTP ${updateRes.status}`);
    assert(updateRes.data?.user?.branch === 'Mechanical Engineering', `Branch successfully changed to Mechanical Engineering`);

    // Verify GET profile
    const profileRes = await request(`/students/${studentId}`);
    assert(profileRes.ok, `Profile fetch returned HTTP ${profileRes.status}`);
    assert(profileRes.data?.user?.branch === 'Mechanical Engineering', `Persisted profile returns Mechanical Engineering`);

    // -------------------------------------------------------------------------
    // TEST 4: Student Directory - Filter by Mechanical Engineering
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Student Directory Branch Filtering ---');
    const directoryRes = await request('/students?branch=Mechanical Engineering');
    assert(directoryRes.ok, `Directory query returned HTTP ${directoryRes.status}`);
    const foundInDirectory = directoryRes.data?.students?.some(s => s.id === studentId);
    assert(foundInDirectory, `Student found when filtering directory by Mechanical Engineering`);

    // Ensure they don't appear under a different branch filter
    const compDirRes = await request('/students?branch=Computer Engineering');
    const notInComp = !compDirRes.data?.students?.some(s => s.id === studentId);
    assert(notInComp, `Student does NOT appear when filtering directory by Computer Engineering`);

    // -------------------------------------------------------------------------
    // TEST 5: Teammate Matcher - Filter candidates by branch
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Teammate Matcher Branch Filtering ---');
    // Quick login as demo student
    const demoStudentRes = await request('/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ role: 'student' })
    });
    const demoToken = demoStudentRes.data?.token;

    const teamMatchRes = await request('/teams/match/candidates?branch=Mechanical Engineering', {
      headers: { Authorization: `Bearer ${demoToken}` }
    });
    assert(teamMatchRes.ok, `Teammate candidates query returned HTTP ${teamMatchRes.status}`);
    const foundInCandidates = teamMatchRes.data?.candidates?.some(c => c.id === studentId);
    assert(foundInCandidates, `Student candidate found when filtering teammate matcher by Mechanical Engineering`);

    // -------------------------------------------------------------------------
    // TEST 6: Super Admin - User List filtering by branch
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Super Admin Directory Branch Filtering ---');
    const superAdminRes = await request('/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ role: 'super_admin' })
    });
    const superAdminToken = superAdminRes.data?.token;

    const saUsersRes = await request('/super-admin/users?branch=Mechanical Engineering', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert(saUsersRes.ok, `Super Admin users query returned HTTP ${saUsersRes.status}`);
    const foundInSa = saUsersRes.data?.users?.some(u => u.id === studentId);
    assert(foundInSa, `Student found in Super Admin dashboard filtered by Mechanical Engineering`);

    // -------------------------------------------------------------------------
    // TEST 7: Super Admin - Update user's branch via PATCH endpoint
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: Super Admin Reassigns User Branch ---');
    const patchBranchRes = await request(`/super-admin/users/${studentId}/branch`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        branch: 'Electronics & Telecommunication',
        reason: 'Super Admin official departmental transfer'
      })
    });

    assert(patchBranchRes.ok, `Super Admin branch update returned HTTP ${patchBranchRes.status}`);
    assert(patchBranchRes.data?.user?.branch === 'Electronics & Telecommunication', `Super Admin re-assigned branch to Electronics & Telecommunication`);

    // Verify in activity logs
    const logsRes = await request('/super-admin/activity-logs?limit=5', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const branchLog = logsRes.data?.logs?.find(l => l.action === 'BRANCH_CHANGED' && String(l.target_id) === String(studentId));
    assert(Boolean(branchLog), `Super Admin action logged in activity_logs (Action: BRANCH_CHANGED)`);

    // -------------------------------------------------------------------------
    // TEST 8: Handling null/unassigned branch gracefully
    // -------------------------------------------------------------------------
    console.log('\n--- Test 8: Graceful Handling of NULL Branch Users ---');
    const nullBranchRes = await request(`/super-admin/users/${studentId}/branch`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        branch: null,
        reason: 'Reset branch to null for fallback test'
      })
    });
    assert(nullBranchRes.ok, `Branch cleared to NULL returned HTTP ${nullBranchRes.status}`);

    // Verify GET profile with null branch returns 200 without crashing
    const nullProfileRes = await request(`/students/${studentId}`);
    assert(nullProfileRes.ok, `Profile with NULL branch loads safely without crashing (branch: ${nullProfileRes.data?.user?.branch})`);

    // -------------------------------------------------------------------------
    // TEST 9: Leaderboard Branch Filter
    // -------------------------------------------------------------------------
    console.log('\n--- Test 9: Leaderboard Branch Filter ---');
    const lbRes = await request('/leaderboard?branch=Computer Engineering');
    assert(lbRes.ok, `Leaderboard with branch filter returned HTTP ${lbRes.status}`);
    assert(Array.isArray(lbRes.data?.leaderboard), `Leaderboard returns array of ranked students`);

    console.log('\n========================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unexpected error during test execution:', err);
    process.exit(1);
  }
}

runTests();
