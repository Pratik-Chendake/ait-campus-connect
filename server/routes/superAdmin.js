import express from 'express';
import { query } from '../db/database.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';
import { supabaseAdmin, supabasePublic, isSupabaseConfigured, SUPABASE_PROJECT_ID } from '../services/opportunities/supabaseClient.js';
import { syncUsersToSupabase } from '../scripts/sync_to_supabase.js';

const router = express.Router();

// Apply auth & Super Admin guard to all routes in this router
router.use(requireAuth, requireSuperAdmin);

// =============================================================================
// GET /api/super-admin/stats — High-Level Master Metrics
// =============================================================================
router.get('/stats', (req, res) => {
  try {
    const totalUsers = query.get('SELECT COUNT(*) as c FROM users')?.c || 0;
    const students = query.get("SELECT COUNT(*) as c FROM users WHERE role = 'STUDENT'")?.c || 0;
    const organizers = query.get("SELECT COUNT(*) as c FROM users WHERE role = 'ORGANIZER'")?.c || 0;
    const admins = query.get("SELECT COUNT(*) as c FROM users WHERE role = 'ADMIN' OR role = 'FACULTY'")?.c || 0;
    const superAdmins = query.get("SELECT COUNT(*) as c FROM users WHERE role = 'SUPER_ADMIN'")?.c || 0;
    const activeUsers = query.get("SELECT COUNT(*) as c FROM users WHERE status = 'ACTIVE' OR status IS NULL")?.c || 0;
    const suspendedUsers = query.get("SELECT COUNT(*) as c FROM users WHERE status = 'SUSPENDED'")?.c || 0;
    const totalLogs = query.get('SELECT COUNT(*) as c FROM activity_logs')?.c || 0;
    const totalEvents = query.get('SELECT COUNT(*) as c FROM events')?.c || 0;
    const totalAchievements = query.get('SELECT COUNT(*) as c FROM achievements')?.c || 0;

    res.json({
      metrics: {
        total_users: totalUsers,
        students,
        organizers,
        admins,
        super_admins: superAdmins,
        active_users: activeUsers,
        suspended_users: suspendedUsers,
        total_logs: totalLogs,
        total_events: totalEvents,
        total_achievements: totalAchievements
      }
    });
  } catch (err) {
    console.error('Super Admin stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve super admin statistics' });
  }
});

// =============================================================================
// GET /api/super-admin/users — Paginated User Management Directory
// =============================================================================
router.get('/users', (req, res) => {
  try {
    const {
      search,
      role,
      status,
      branch,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let sql = `
      SELECT id, student_id, full_name, email, role,
             COALESCE(status, 'ACTIVE') as status,
             auth_provider, branch, year, contribution_score,
             avatar_url, created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (full_name LIKE ? OR email LIKE ? OR student_id LIKE ?)';
      params.push(term, term, term);
    }

    if (role && role !== 'ALL') {
      sql += ' AND role = ?';
      params.push(role.toUpperCase());
    }

    if (status && status !== 'ALL') {
      sql += " AND COALESCE(status, 'ACTIVE') = ?";
      params.push(status.toUpperCase());
    }

    if (branch && branch !== 'ALL' && branch !== 'All') {
      sql += ' AND branch = ?';
      params.push(branch);
    }

    // Get total matching
    const countSql = `SELECT COUNT(*) as c FROM (${sql})`;
    const total = query.get(countSql, params)?.c || 0;

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const users = query.all(sql, params);

    res.json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error('Super Admin users list error:', err);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// =============================================================================
// PATCH /api/super-admin/users/:id/role — Assign / Promote / Demote Roles
// =============================================================================
router.patch('/users/:id/role', (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { role: newRole, reason = 'Super Admin designation' } = req.body;

    const allowedRoles = ['STUDENT', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN'];
    const formattedRole = (newRole || '').toUpperCase();

    if (!allowedRoles.includes(formattedRole)) {
      return res.status(400).json({ error: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}` });
    }

    const targetUser = query.get('SELECT id, full_name, email, role FROM users WHERE id = ?', [targetUserId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousRole = targetUser.role;

    // Update role
    query.run('UPDATE users SET role = ? WHERE id = ?', [formattedRole, targetUserId]);

    // Record in role_change_history
    query.run(`
      INSERT INTO role_change_history (user_id, previous_role, new_role, changed_by, changed_by_email, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [targetUserId, previousRole, formattedRole, req.user.id, req.user.email, reason]);

    // Record in activity_logs
    query.run(`
      INSERT INTO activity_logs (user_id, actor_email, action, target_type, target_id, details)
      VALUES (?, ?, 'ROLE_CHANGED', 'USER', ?, ?)
    `, [
      targetUserId,
      req.user.email,
      String(targetUserId),
      JSON.stringify({
        target_email: targetUser.email,
        from_role: previousRole,
        to_role: formattedRole,
        reason,
        timestamp: new Date().toISOString()
      })
    ]);

    const updatedUser = query.get('SELECT id, student_id, full_name, email, role, status FROM users WHERE id = ?', [targetUserId]);

    res.json({
      message: `User role successfully updated from ${previousRole} to ${formattedRole}`,
      user: updatedUser
    });
  } catch (err) {
    console.error('Super Admin role change error:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// =============================================================================
// PATCH /api/super-admin/users/:id/status — Suspend or Reactivate Account
// =============================================================================
router.patch('/users/:id/status', (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { status: newStatus } = req.body;

    const formattedStatus = (newStatus || '').toUpperCase();
    if (!['ACTIVE', 'SUSPENDED'].includes(formattedStatus)) {
      return res.status(400).json({ error: 'Status must be ACTIVE or SUSPENDED' });
    }

    if (targetUserId === req.user.id && formattedStatus === 'SUSPENDED') {
      return res.status(400).json({ error: 'Super Admin cannot suspend their own active account' });
    }

    const targetUser = query.get('SELECT id, full_name, email, status FROM users WHERE id = ?', [targetUserId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    query.run('UPDATE users SET status = ? WHERE id = ?', [formattedStatus, targetUserId]);

    query.run(`
      INSERT INTO activity_logs (user_id, actor_email, action, target_type, target_id, details)
      VALUES (?, ?, 'STATUS_CHANGED', 'USER', ?, ?)
    `, [
      targetUserId,
      req.user.email,
      String(targetUserId),
      JSON.stringify({
        target_email: targetUser.email,
        new_status: formattedStatus,
        timestamp: new Date().toISOString()
      })
    ]);

    const updatedUser = query.get('SELECT id, full_name, email, role, status FROM users WHERE id = ?', [targetUserId]);

    res.json({
      message: `Account status updated to ${formattedStatus}`,
      user: updatedUser
    });
  } catch (err) {
    console.error('Super Admin status change error:', err);
    res.status(500).json({ error: 'Failed to update user account status' });
  }
});

// =============================================================================
// PATCH /api/super-admin/users/:id/branch — Assign / Update User Branch
// =============================================================================
router.patch('/users/:id/branch', (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { branch: newBranch, reason = 'Super Admin update' } = req.body;

    const allowedBranches = [
      'Computer Engineering',
      'Information Technology',
      'Electronics & Telecommunication',
      'Mechanical Engineering',
      'Automation & Robotics'
    ];

    if (newBranch && !allowedBranches.includes(newBranch)) {
      return res.status(400).json({ error: `Invalid branch. Allowed branches: ${allowedBranches.join(', ')}` });
    }

    const targetUser = query.get('SELECT id, full_name, email, branch FROM users WHERE id = ?', [targetUserId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousBranch = targetUser.branch;

    // Update branch
    query.run('UPDATE users SET branch = ? WHERE id = ?', [newBranch || null, targetUserId]);

    // Record in activity_logs
    query.run(`
      INSERT INTO activity_logs (user_id, actor_email, action, target_type, target_id, details)
      VALUES (?, ?, 'BRANCH_CHANGED', 'USER', ?, ?)
    `, [
      targetUserId,
      req.user.email,
      String(targetUserId),
      JSON.stringify({
        target_email: targetUser.email,
        from_branch: previousBranch,
        to_branch: newBranch,
        reason,
        timestamp: new Date().toISOString()
      })
    ]);

    const updatedUser = query.get('SELECT id, student_id, full_name, email, role, status, branch FROM users WHERE id = ?', [targetUserId]);

    res.json({
      message: `User branch successfully updated to ${newBranch || 'Not Set'}`,
      user: updatedUser
    });
  } catch (err) {
    console.error('Super Admin branch change error:', err);
    res.status(500).json({ error: 'Failed to update user branch' });
  }
});

// =============================================================================
// POST /api/super-admin/users/:id/reset-password — Secure Password Recovery Trigger
// =============================================================================
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const targetUser = query.get('SELECT id, full_name, email FROM users WHERE id = ?', [targetUserId]);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Never display user password. Trigger Supabase recovery email.
    try {
      await supabasePublic.auth.resetPasswordForEmail(targetUser.email);
    } catch (e) {
      console.warn('Supabase reset password trigger warning:', e.message);
    }

    query.run(`
      INSERT INTO activity_logs (user_id, actor_email, action, target_type, target_id, details)
      VALUES (?, ?, 'PASSWORD_RESET_INITIATED', 'USER', ?, ?)
    `, [
      targetUserId,
      req.user.email,
      String(targetUserId),
      JSON.stringify({
        target_email: targetUser.email,
        initiated_by: req.user.email,
        timestamp: new Date().toISOString()
      })
    ]);

    res.json({
      message: `Password reset recovery instructions successfully dispatched to ${targetUser.email}.`,
      target_email: targetUser.email
    });
  } catch (err) {
    console.error('Super Admin password reset error:', err);
    res.status(500).json({ error: 'Failed to initiate password reset' });
  }
});

// =============================================================================
// GET /api/super-admin/activity-logs — Platform Audit Records
// =============================================================================
router.get('/activity-logs', (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    let sql = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];

    if (action && action !== 'ALL') {
      sql += ' AND action = ?';
      params.push(action);
    }

    const total = query.get(`SELECT COUNT(*) as c FROM (${sql})`, params)?.c || 0;

    sql += ' ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const logs = query.all(sql, params).map(log => {
      let parsedDetails = null;
      try {
        parsedDetails = log.details ? JSON.parse(log.details) : null;
      } catch (e) {
        parsedDetails = log.details;
      }
      return {
        ...log,
        details: parsedDetails
      };
    });

    res.json({
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error('Super Admin logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve activity logs' });
  }
});

// =============================================================================
// GET & POST /api/super-admin/settings — Platform Master Settings
// =============================================================================
router.get('/settings', (req, res) => {
  try {
    const rows = query.all('SELECT key, value FROM platform_settings');
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
});

router.post('/settings', (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object required' });
    }

    for (const [key, val] of Object.entries(settings)) {
      query.run(`
        INSERT INTO platform_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `, [key, String(val)]);
    }

    query.run(`
      INSERT INTO activity_logs (user_id, actor_email, action, details)
      VALUES (?, ?, 'SETTINGS_UPDATED', ?)
    `, [req.user.id, req.user.email, JSON.stringify(settings)]);

    res.json({ message: 'Settings saved successfully', settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update platform settings' });
  }
});

// =============================================================================
// GET /api/super-admin/supabase-status — Check cloud sync status & keys
// =============================================================================
router.get('/supabase-status', (req, res) => {
  const configured = isSupabaseConfigured();
  res.json({
    project_id: SUPABASE_PROJECT_ID,
    supabase_url: `https://${SUPABASE_PROJECT_ID}.supabase.co`,
    is_configured: configured,
    has_service_role_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    has_anon_key: Boolean(process.env.SUPABASE_ANON_KEY),
    help_url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/settings/api`
  });
});

// =============================================================================
// POST /api/super-admin/sync-supabase — Bulk Push All Local Users to Supabase Auth
// =============================================================================
router.post('/sync-supabase', async (req, res) => {
  try {
    const result = await syncUsersToSupabase();
    if (!result.success) {
      return res.status(400).json({ error: result.error, message: result.message });
    }
    res.json({
      message: 'Supabase user synchronization completed successfully',
      result
    });
  } catch (err) {
    console.error('Supabase manual sync endpoint error:', err);
    res.status(500).json({ error: err.message || 'Synchronization failed' });
  }
});

export default router;
