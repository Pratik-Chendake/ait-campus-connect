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

async function runAuthTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING FOUR-ROLE AUTHENTICATION & SUPABASE PROTOTYPE TESTS');
  console.log('===============================================================\n');

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

  const uniqueSuffix = Date.now().toString().slice(-6);
  const testGmail = `ait.student.${uniqueSuffix}@gmail.com`;
  const testPassword = 'Password123!';

  // =========================================================================
  // 1. Sign-Up Validation & Creation
  // =========================================================================
  console.log('1. Testing Sign-Up Validation & Public Registration:');

  // Non-Gmail rejection
  const nonGmailRes = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'student@yahoo.com', password: testPassword }
  });
  assert(nonGmailRes.status === 400, 'Rejects non-Gmail addresses (400 Bad Request)');
  assert(nonGmailRes.data.error?.includes('Gmail'), 'Displays clear Gmail address requirement message');

  // Short password rejection
  const shortPassRes = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: testGmail, password: '123' }
  });
  assert(shortPassRes.status === 400, 'Rejects passwords shorter than 6 characters');

  // Successful Student Sign-up
  const signupRes = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: testGmail, password: testPassword }
  });
  assert(signupRes.status === 201, `Sign-up returns 201 Created for ${testGmail}`);
  assert(signupRes.data.token, 'Returns authenticated JWT session token');
  assert(signupRes.data.user?.role === 'STUDENT', 'Automatically assigned Student role (role = STUDENT)');
  assert(signupRes.data.user?.status === 'ACTIVE', 'Account status is ACTIVE');

  const studentToken = signupRes.data.token;
  const newStudentId = signupRes.data.user.id;

  // Duplicate Sign-up prevention
  const dupRes = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: testGmail, password: testPassword }
  });
  assert(dupRes.status === 400, 'Rejects duplicate registration with existing Gmail (400 Bad Request)');
  assert(dupRes.data.error?.includes('already exists'), 'Displays duplicate account notice guiding to Log In');

  // =========================================================================
  // 2. Returning User Login
  // =========================================================================
  console.log('\n2. Testing Returning User Login Workflow:');

  // Missing fields
  const emptyRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: '', password: '' }
  });
  assert(emptyRes.status === 400, 'Rejects empty credentials');

  // Wrong password
  const badPassRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: testGmail, password: 'WrongPassword999' }
  });
  assert(badPassRes.status === 401, 'Rejects incorrect password (401 Unauthorized)');
  assert(badPassRes.data.error === 'Invalid email or password.', 'Returns safe error message');

  // Correct credentials login
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: testGmail, password: testPassword }
  });
  assert(loginRes.status === 200, 'Successful login returns 200 OK');
  assert(loginRes.data.user?.email === testGmail, 'Recognized existing account');
  assert(loginRes.data.user?.role === 'STUDENT', 'Preserved user role and records');

  // =========================================================================
  // 3. Four Role Identity & Access Verification
  // =========================================================================
  console.log('\n3. Testing Four Roles Identity & Access:');

  // A. Student Access
  const studentMe = await request('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(studentMe.status === 200 && studentMe.data.user.role === 'STUDENT', 'Student profile authenticated');

  // Student trying to access Super Admin API
  const studentForbidden = await request('/api/super-admin/stats', {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(studentForbidden.status === 403, 'Student blocked from Super Admin API (403 Forbidden)');

  // B. Organizer Login
  const orgLogin = await request('/api/auth/quick-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { role: 'ORGANIZER' }
  });
  assert(orgLogin.status === 200 && orgLogin.data.user.role === 'ORGANIZER', 'Organizer authenticated (role = ORGANIZER)');

  // C. Admin Login
  const adminLogin = await request('/api/auth/quick-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { role: 'ADMIN' }
  });
  assert(adminLogin.status === 200 && adminLogin.data.user.role === 'ADMIN', 'Admin authenticated (role = ADMIN)');

  // D. Super Admin Login
  const superAdminLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'superadmin@gmail.com', password: 'SuperAdmin@123' }
  });
  assert(superAdminLogin.status === 200 && superAdminLogin.data.user.role === 'SUPER_ADMIN', 'Super Admin authenticated via superadmin@gmail.com');
  const superAdminToken = superAdminLogin.data.token;

  // =========================================================================
  // 4. Super Admin Master Console Endpoints
  // =========================================================================
  console.log('\n4. Testing Super Admin Master Authority & Governance:');

  // Get Super Admin Stats
  const saStats = await request('/api/super-admin/stats', {
    headers: { 'Authorization': `Bearer ${superAdminToken}` }
  });
  assert(saStats.status === 200, 'GET /api/super-admin/stats returns 200 OK');
  assert(saStats.data.metrics.total_users > 0, `Total users count: ${saStats.data.metrics.total_users}`);
  assert(saStats.data.metrics.students > 0, `Students count: ${saStats.data.metrics.students}`);
  assert(saStats.data.metrics.super_admins >= 1, `Super Admins count: ${saStats.data.metrics.super_admins}`);

  // Get Super Admin Users Directory
  const saUsers = await request('/api/super-admin/users?limit=10', {
    headers: { 'Authorization': `Bearer ${superAdminToken}` }
  });
  assert(saUsers.status === 200, 'GET /api/super-admin/users returns 200 OK');
  assert(Array.isArray(saUsers.data.users) && saUsers.data.users.length > 0, 'Returns array of registered users');

  // Promote Student to Organizer
  const promoteRes = await request(`/api/super-admin/users/${newStudentId}/role`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json'
    },
    body: { role: 'ORGANIZER', reason: 'Approved club technical lead' }
  });
  assert(promoteRes.status === 200 && promoteRes.data.user.role === 'ORGANIZER', `Promoted user ${newStudentId} from STUDENT to ORGANIZER`);

  // Verify role changed on subsequent /me call
  const promotedMe = await request('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(promotedMe.data.user.role === 'ORGANIZER', 'User reflects updated ORGANIZER role on next API call');

  // Suspend User Account
  const suspendRes = await request(`/api/super-admin/users/${newStudentId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json'
    },
    body: { status: 'SUSPENDED' }
  });
  assert(suspendRes.status === 200 && suspendRes.data.user.status === 'SUSPENDED', `Suspended user account ${newStudentId}`);

  // Verify suspended user is blocked on login
  const suspendedLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: testGmail, password: testPassword }
  });
  assert(suspendedLogin.status === 403, 'Suspended account rejected on login (403 Forbidden)');
  assert(suspendedLogin.data.error.includes('unavailable'), 'Returns account unavailable message');

  // Reactivate User Account
  const reactivateRes = await request(`/api/super-admin/users/${newStudentId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json'
    },
    body: { status: 'ACTIVE' }
  });
  assert(reactivateRes.status === 200 && reactivateRes.data.user.status === 'ACTIVE', `Reactivated user account ${newStudentId}`);

  // =========================================================================
  // 5. Password Management & Recovery
  // =========================================================================
  console.log('\n5. Testing Secure Password Recovery Workflows:');

  // Super Admin Password Reset Dispatch
  const saReset = await request(`/api/super-admin/users/${newStudentId}/reset-password`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${superAdminToken}` }
  });
  assert(saReset.status === 200, 'Super Admin password recovery dispatch returns 200 OK');
  assert(saReset.data.target_email === testGmail, `Recovery dispatched to target email: ${testGmail}`);

  // Public Forgot Password endpoint
  const forgotRes = await request('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: testGmail }
  });
  assert(forgotRes.status === 200, 'Public forgot-password returns 200 OK');
  assert(forgotRes.data.message.includes('instructions'), 'Returns safe recovery dispatch confirmation');

  // Check Activity Audit Logs
  const logsRes = await request('/api/super-admin/activity-logs?limit=10', {
    headers: { 'Authorization': `Bearer ${superAdminToken}` }
  });
  assert(logsRes.status === 200, 'GET /api/super-admin/activity-logs returns 200 OK');
  assert(logsRes.data.logs.some(l => l.action === 'ACCOUNT_CREATED'), 'Activity log captured ACCOUNT_CREATED');
  assert(logsRes.data.logs.some(l => l.action === 'ROLE_CHANGED'), 'Activity log captured ROLE_CHANGED');
  assert(logsRes.data.logs.some(l => l.action === 'STATUS_CHANGED'), 'Activity log captured STATUS_CHANGED');
  assert(logsRes.data.logs.some(l => l.action === 'PASSWORD_RESET_INITIATED'), 'Activity log captured PASSWORD_RESET_INITIATED');

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
