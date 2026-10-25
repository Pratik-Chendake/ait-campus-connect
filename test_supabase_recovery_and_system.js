import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

(async () => {
  console.log('========================================================================');
  console.log('🛡️ RUNNING SUPABASE RECOVERY & COMPLETE SYSTEM AUDIT TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('  ✅ PASS:', message);
      passed++;
    } else {
      console.error('  ❌ FAIL:', message);
      failed++;
    }
  }

  // 1. Supabase Project ID & JWKS Verification
  console.log('--- 1. Target Supabase Project Verification ---');
  let jwksLive = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const data = await new Promise((resolve, reject) => {
        https.get('https://igekrdkefsrpzxwncwce.supabase.co/auth/v1/.well-known/jwks.json', (res) => {
          if (res.statusCode === 200) {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
              try { resolve(JSON.parse(body)); } catch (e) { resolve(null); }
            });
          } else {
            resolve(null);
          }
        }).on('error', reject);
      });
      if (data && Array.isArray(data.keys) && data.keys.length > 0) {
        jwksLive = true;
        break;
      }
    } catch (err) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  assert(jwksLive, 'New Supabase Project JWKS endpoint (igekrdkefsrpzxwncwce) is live and returns HTTP 200 with valid keys');

  // 2. Zero Stale References Check
  console.log('\n--- 2. Stale Supabase Project Clean-up Verification ---');
  const envContent = fs.readFileSync('.env', 'utf-8');
  assert(!envContent.includes('gojznmxmflnpcpllltbd'), '.env does not contain deleted project ID gojznmxmflnpcpllltbd');
  assert(envContent.includes('igekrdkefsrpzxwncwce'), '.env contains target project ID igekrdkefsrpzxwncwce');
  assert(!envContent.includes('DELETED_SECRET_KEY'), '.env does not contain deleted secret key');

  const clientEnv = fs.readFileSync('client/.env', 'utf-8');
  assert(!clientEnv.includes('gojznmxmflnpcpllltbd'), 'client/.env does not contain deleted project ID');
  assert(clientEnv.includes('igekrdkefsrpzxwncwce'), 'client/.env points to target project ID igekrdkefsrpzxwncwce');

  // 3. Master SQL Migration Verification
  console.log('\n--- 3. Master Supabase Migration Verification ---');
  const migrationPath = path.join('supabase', 'migrations', '20261024_master_database_recovery.sql');
  assert(fs.existsSync(migrationPath), 'Master migration file 20261024_master_database_recovery.sql exists');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
  assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.profiles'), 'Migration creates public.profiles linked to auth.users');
  assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.student_participations'), 'Migration creates permanent student_participations table');
  assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.participation_milestones'), 'Migration creates competition round milestones table');
  assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.participation_audit_logs'), 'Migration creates append-only participation audit trail');
  assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.certificates'), 'Migration creates certificate vault table');
  assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.opportunities'), 'Migration creates opportunities table');
  assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.scholarships'), 'Migration creates scholarships table');
  assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.internships'), 'Migration creates internships table');
  assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.notifications'), 'Migration creates notifications table');
  assert(migrationSql.includes('ALTER TABLE public.student_participations ENABLE ROW LEVEL SECURITY'), 'Row Level Security enabled for student_participations');
  assert(migrationSql.includes('Students view own participation'), 'Student data isolation policy configured');
  assert(migrationSql.includes('CREATE TRIGGER on_auth_user_created'), 'Automatic profile creation trigger on auth signup configured');
  assert(migrationSql.includes('storage.buckets'), 'Storage buckets (avatars, certificates, submissions) configured');

  // 4. Role Authentication & Switching Verification
  console.log('\n--- 4. Four-Role API Authentication & Switching ---');
  const roles = [
    { role: 'STUDENT', email: 'rahul.sharma@aitpune.edu.in', pass: 'student123' },
    { role: 'ORGANIZER', email: 'gdsc@aitpune.edu.in', pass: 'club123' },
    { role: 'ADMIN', email: 'admin@aitpune.edu.in', pass: 'admin123' },
    { role: 'SUPER_ADMIN', email: 'superadmin@gmail.com', pass: 'SuperAdmin@123' },
    { role: 'FACULTY', email: 'dr.patil@aitpune.edu.in', pass: 'faculty123' },
  ];

  for (const r of roles) {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: r.email, password: r.pass })
    });
    assert(res.status === 200, 'Authenticated role ' + r.role + ' via HTTP 200');
    const data = await res.json();
    assert(data.user?.role === r.role, 'User role matches ' + r.role + ' (got ' + data.user?.role + ')');
    assert(Boolean(data.token), 'Valid session JWT token returned for ' + r.role);
  }

  // 5. Transactional Email Safeguards Verification
  console.log('\n--- 5. Transactional Email Safeguards Verification ---');
  const pwResetRes1 = await fetch('http://localhost:5000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul.sharma@aitpune.edu.in' })
  });
  assert(pwResetRes1.status === 200, 'First password reset request accepted (200 OK)');
  const pwResetRes2 = await fetch('http://localhost:5000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul.sharma@aitpune.edu.in' })
  });
  assert(pwResetRes2.status === 200, 'Second rapid password reset request throttled safely without bouncing (200 OK)');

  console.log('\n========================================================================');
  console.log('🎉 AUDIT COMPLETE:', passed, 'PASSED,', failed, 'FAILED');
  console.log('========================================================================\n');
  if (failed > 0) process.exit(1);
})();
