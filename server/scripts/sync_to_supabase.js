import dotenv from 'dotenv';
import { query } from '../db/database.js';
import { supabaseAdmin, isSupabaseConfigured, SUPABASE_PROJECT_ID } from '../services/opportunities/supabaseClient.js';

dotenv.config();

export async function syncUsersToSupabase() {
  console.log('===============================================================');
  console.log('🔄 AIT CAMPUS CONNECT -> SUPABASE USER SYNCHRONIZATION');
  console.log('===============================================================');
  console.log(`Target Supabase Project: ${SUPABASE_PROJECT_ID}`);
  console.log(`Supabase URL: https://${SUPABASE_PROJECT_ID}.supabase.co`);

  if (!isSupabaseConfigured()) {
    console.error('\n❌ ERROR: Supabase is not fully configured in your .env file.');
    console.error('Missing credentials:');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('  - SUPABASE_SERVICE_ROLE_KEY is empty in .env');
    }
    if (!process.env.SUPABASE_ANON_KEY) {
      console.error('  - SUPABASE_ANON_KEY is empty in .env');
    }
    console.error('\n👉 How to fix:');
    console.error('1. Go to https://supabase.com/dashboard/project/igekrdkefsrpzxwncwce/settings/api');
    console.error('2. Copy your "anon public" and "service_role secret" keys.');
    console.error('3. Add them to .env and re-run this sync script.');
    return {
      success: false,
      error: 'SUPABASE_KEYS_MISSING',
      message: 'SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY are required in .env'
    };
  }

  try {
    // 1. Fetch all local users from SQLite
    const localUsers = query.all('SELECT * FROM users');
    console.log(`\nFound ${localUsers.length} local user records in SQLite to synchronize.`);

    // 2. Fetch existing Supabase auth users to avoid duplicate calls
    let existingSupaUsers = [];
    try {
      const { data: supaUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });
      if (listErr) throw listErr;
      existingSupaUsers = supaUsers?.users || [];
      console.log(`Found ${existingSupaUsers.length} existing users currently in Supabase auth.users.`);
    } catch (err) {
      console.warn('Notice while listing Supabase users:', err.message);
    }

    const emailMap = new Map();
    existingSupaUsers.forEach(u => emailMap.set(u.email?.toLowerCase(), u));

    let createdCount = 0;
    let existingCount = 0;
    let failedCount = 0;

    // Default passwords for standard seeded roles
    const ROLE_PASSWORDS = {
      'STUDENT': 'student123',
      'ORGANIZER': 'club123',
      'ADMIN': 'admin123',
      'SUPER_ADMIN': 'superadmin123',
      'FACULTY': 'faculty123'
    };

    for (const user of localUsers) {
      const cleanEmail = (user.email || '').trim().toLowerCase();
      if (!cleanEmail) continue;

      try {
        let supaUser = emailMap.get(cleanEmail);

        if (!supaUser) {
          // Determine initial password
          const initialPassword = ROLE_PASSWORDS[user.role] || 'AitConnect2026!';

          const { data: createdData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: initialPassword,
            email_confirm: true, // Auto-confirm to avoid transactional bounce issues
            user_metadata: {
              full_name: user.full_name,
              role: user.role,
              branch: user.branch || 'Computer Engineering',
              student_id: user.student_id || null,
              migrated_from: 'sqlite_local'
            }
          });

          if (createErr) {
            console.error(`  ❌ Failed to create ${cleanEmail}:`, createErr.message);
            failedCount++;
            continue;
          }

          supaUser = createdData?.user;
          createdCount++;
          console.log(`  ✅ Created in Supabase Auth: ${cleanEmail} (${user.role}) [UID: ${supaUser.id}]`);
        } else {
          existingCount++;
          console.log(`  ℹ️ Already in Supabase Auth: ${cleanEmail} [UID: ${supaUser.id}]`);
        }

        // 3. Update local user record with Supabase UID
        if (supaUser?.id) {
          query.run('UPDATE users SET supabase_uid = ? WHERE id = ?', [supaUser.id, user.id]);

          // 4. Sync to Supabase profiles & user_roles tables if tables exist
          try {
            await supabaseAdmin.from('profiles').upsert({
              id: supaUser.id,
              email: cleanEmail,
              full_name: user.full_name || 'AIT Student',
              branch: user.branch || 'Computer Engineering',
              year: user.year || 1,
              semester: user.semester || 1,
              student_id: user.student_id || null,
              avatar_url: user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
              bio: user.bio || 'Student at Army Institute of Technology, Pune.',
              contribution_score: user.contribution_score || 0,
              profile_visibility: user.profile_visibility || 'PUBLIC',
              account_status: user.status || 'ACTIVE'
            });

            await supabaseAdmin.from('user_roles').upsert({
              user_id: supaUser.id,
              role: (user.role || 'student').toLowerCase()
            });
          } catch (profileErr) {
            // Non-blocking: table might not have migration applied yet
          }
        }
      } catch (err) {
        console.error(`  ❌ Error processing user ${cleanEmail}:`, err.message);
        failedCount++;
      }
    }

    console.log('\n===============================================================');
    console.log('📊 SYNCHRONIZATION RESULTS');
    console.log('===============================================================');
    console.log(`Total Local Users Processed: ${localUsers.length}`);
    console.log(`Created in Supabase Auth:   ${createdCount}`);
    console.log(`Already in Supabase Auth:   ${existingCount}`);
    console.log(`Failed:                     ${failedCount}`);
    console.log('===============================================================\n');

    return {
      success: true,
      total: localUsers.length,
      created: createdCount,
      existing: existingCount,
      failed: failedCount
    };
  } catch (err) {
    console.error('Fatal synchronization failure:', err);
    return { success: false, error: err.message };
  }
}

// Direct execution from CLI
if (process.argv[1] && process.argv[1].endsWith('sync_to_supabase.js')) {
  syncUsersToSupabase()
    .then((res) => {
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
