import express from 'express';
import { query } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { AY_2026_27_START, AY_2026_27_DATE_ONLY_END } from '../utils/academicYear.js';

const router = express.Router();

// GET Admin Dashboard Overview Stats & Analytics
router.get('/stats', requireAuth, requireRole('ADMIN', 'FACULTY'), (req, res) => {
  try {
    const totalStudents = query.get("SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'");
    const totalClubs = query.get("SELECT COUNT(*) as count FROM clubs WHERE status = 'ACTIVE'");
    const upcomingEvents = query.get(`
      SELECT COUNT(*) as count FROM events
      WHERE event_end_date >= date('now')
        AND event_start_date >= '${AY_2026_27_START}'
        AND event_start_date <= '${AY_2026_27_DATE_ONLY_END}'
        AND (is_archive = 0 OR is_archive IS NULL)
    `);
    const totalRegistrations = query.get("SELECT COUNT(*) as count FROM event_registrations WHERE status != 'CANCELLED'");
    const totalAchievements = query.get("SELECT COUNT(*) as count FROM achievements");
    const verifiedAchievements = query.get("SELECT COUNT(*) as count FROM achievements WHERE verification_status = 'VERIFIED'");
    const pendingVerification = query.get("SELECT COUNT(*) as count FROM achievements WHERE verification_status = 'PENDING'");
    const internshipsCount = query.get("SELECT COUNT(*) as count FROM internships WHERE is_active = 1");
    const scholarshipsCount = query.get("SELECT COUNT(*) as count FROM scholarships WHERE is_active = 1");
    const researchCount = query.get("SELECT COUNT(*) as count FROM research_papers");

    // Branch-wise student distribution
    const branchDistribution = query.all(`
      SELECT branch, COUNT(*) as student_count,
             SUM(contribution_score) as total_points
      FROM users
      WHERE role = 'STUDENT' AND branch IS NOT NULL
      GROUP BY branch
    `);

    // Year-wise student participation
    const yearDistribution = query.all(`
      SELECT year, COUNT(*) as count
      FROM users
      WHERE role = 'STUDENT' AND year IS NOT NULL
      GROUP BY year
      ORDER BY year ASC
    `);

    // Event category distribution (restricted strictly to AY 2026-27 records)
    const categoryDistribution = query.all(`
      SELECT category, COUNT(*) as event_count
      FROM events
      WHERE event_start_date >= '${AY_2026_27_START}'
        AND event_start_date <= '${AY_2026_27_DATE_ONLY_END}'
        AND (is_archive = 0 OR is_archive IS NULL)
      GROUP BY category
      ORDER BY event_count DESC
    `);

    // Club event activity (restricted strictly to AY 2026-27 records)
    const clubActivity = query.all(`
      SELECT c.name, COUNT(e.id) as event_count
      FROM clubs c
      LEFT JOIN events e ON e.club_id = c.id
        AND e.event_start_date >= '${AY_2026_27_START}'
        AND e.event_start_date <= '${AY_2026_27_DATE_ONLY_END}'
        AND (e.is_archive = 0 OR e.is_archive IS NULL)
      GROUP BY c.id
      ORDER BY event_count DESC
      LIMIT 6
    `);

    res.json({
      metrics: {
        total_students: totalStudents ? totalStudents.count : 0,
        total_clubs: totalClubs ? totalClubs.count : 0,
        upcoming_events: upcomingEvents ? upcomingEvents.count : 0,
        total_registrations: totalRegistrations ? totalRegistrations.count : 0,
        total_achievements: totalAchievements ? totalAchievements.count : 0,
        verified_achievements: verifiedAchievements ? verifiedAchievements.count : 0,
        pending_verification: pendingVerification ? pendingVerification.count : 0,
        total_internships: internshipsCount ? internshipsCount.count : 0,
        total_scholarships: scholarshipsCount ? scholarshipsCount.count : 0,
        research_publications: researchCount ? researchCount.count : 0
      },
      charts: {
        branch_distribution: branchDistribution,
        year_distribution: yearDistribution,
        category_distribution: categoryDistribution,
        club_activity: clubActivity
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET users list for admin management
router.get('/users', requireAuth, requireRole('ADMIN'), (req, res) => {
  try {
    const users = query.all(`
      SELECT id, student_id, full_name, email, role, branch, year, contribution_score, created_at
      FROM users
      ORDER BY id ASC
    `);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH change user role
router.patch('/users/:id/role', requireAuth, requireRole('ADMIN'), (req, res) => {
  try {
    const { role } = req.body;
    if (!['STUDENT', 'ORGANIZER', 'FACULTY', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    query.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);

    // Audit log
    query.run(`
      INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
      VALUES (?, 'CHANGE_ROLE', 'USER', ?, 'Changed role to ' || ?)
    `, [req.user.id, req.params.id, role]);

    res.json({ message: 'User role updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET audit logs
router.get('/audit-logs', requireAuth, requireRole('ADMIN'), (req, res) => {
  try {
    const logs = query.all(`
      SELECT al.*, u.full_name as actor_name, u.role as actor_role
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.actor_id
      ORDER BY al.timestamp DESC
      LIMIT 100
    `);
    res.json({ audit_logs: logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GET platform settings
router.get('/settings', requireAuth, requireRole('ADMIN'), (req, res) => {
  try {
    const settings = query.all('SELECT * FROM platform_settings');
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json({ settings: settingsMap });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
});

// POST update platform settings
router.post('/settings', requireAuth, requireRole('ADMIN'), (req, res) => {
  try {
    const { institutional_domain, points_winner, points_finalist, points_verified_achievement } = req.body;

    if (institutional_domain) {
      query.run("INSERT OR REPLACE INTO platform_settings (key, value) VALUES ('institutional_domain', ?)", [institutional_domain]);
    }
    if (points_winner) {
      query.run("INSERT OR REPLACE INTO platform_settings (key, value) VALUES ('points_winner', ?)", [points_winner.toString()]);
    }
    if (points_finalist) {
      query.run("INSERT OR REPLACE INTO platform_settings (key, value) VALUES ('points_finalist', ?)", [points_finalist.toString()]);
    }
    if (points_verified_achievement) {
      query.run("INSERT OR REPLACE INTO platform_settings (key, value) VALUES ('points_verified_achievement', ?)", [points_verified_achievement.toString()]);
    }

    query.run(`
      INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
      VALUES (?, 'UPDATE_SETTINGS', 'SETTINGS', 0, 'Updated platform configuration')
    `, [req.user.id]);

    res.json({ message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// =========================================================================
// RESEARCH MODERATION & REVIEW QUEUE ENDPOINTS
// =========================================================================

// GET /api/admin/research/candidates
router.get('/research/candidates', requireAuth, requireRole('ADMIN', 'FACULTY'), (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM ingestion_review_queue';
    const params = [];

    if (status && status !== 'ALL') {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY id ASC';

    const candidates = query.all(sql, params);

    const counts = {
      total: query.get('SELECT COUNT(*) as c FROM ingestion_review_queue')?.c || 0,
      pending: query.get("SELECT COUNT(*) as c FROM ingestion_review_queue WHERE status = 'PENDING_REVIEW'")?.c || 0,
      approved: query.get("SELECT COUNT(*) as c FROM ingestion_review_queue WHERE status = 'APPROVED'")?.c || 0,
      rejected: query.get("SELECT COUNT(*) as c FROM ingestion_review_queue WHERE status = 'REJECTED'")?.c || 0
    };

    res.json({
      candidates,
      counts
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch review candidates' });
  }
});

// POST /api/admin/research/candidates/:id/approve
router.post('/research/candidates/:id/approve', requireAuth, requireRole('ADMIN'), (req, res) => {
  try {
    const candidateId = parseInt(req.params.id, 10);
    query.run(`
      UPDATE ingestion_review_queue SET
        status = 'APPROVED',
        reviewed_by = ?,
        reviewed_at = datetime('now')
      WHERE id = ?
    `, [req.user.id, candidateId]);

    query.run(`
      INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
      VALUES (?, 'APPROVE_RESEARCH_CLAIM', 'RESEARCH_QUEUE', ?, 'Approved candidate claim for publication')
    `, [req.user.id, candidateId]);

    res.json({ message: 'Candidate approved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve candidate' });
  }
});

// POST /api/admin/research/candidates/:id/reject
router.post('/research/candidates/:id/reject', requireAuth, requireRole('ADMIN'), (req, res) => {
  try {
    const candidateId = parseInt(req.params.id, 10);
    const { rejection_reason } = req.body;

    query.run(`
      UPDATE ingestion_review_queue SET
        status = 'REJECTED',
        reason = COALESCE(?, reason),
        reviewed_by = ?,
        reviewed_at = datetime('now')
      WHERE id = ?
    `, [rejection_reason, req.user.id, candidateId]);

    query.run(`
      INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
      VALUES (?, 'REJECT_RESEARCH_CLAIM', 'RESEARCH_QUEUE', ?, ?)
    `, [req.user.id, candidateId, rejection_reason || 'Rejected during administrative review']);

    res.json({ message: 'Candidate rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject candidate' });
  }
});

// GET /api/admin/research/summary
router.get('/research/summary', requireAuth, requireRole('ADMIN', 'FACULTY'), (req, res) => {
  try {
    const clubsCount = query.get("SELECT COUNT(*) as count FROM clubs WHERE status = 'ACTIVE'")?.count || 0;
    const sourcesCount = query.get("SELECT COUNT(*) as count FROM source_records")?.count || 0;
    const opportunitiesCount = query.get("SELECT COUNT(*) as count FROM opportunities")?.count || 0;
    const archivesCount = query.get("SELECT COUNT(*) as count FROM past_event_archives")?.count || 0;
    const pendingQueueCount = query.get("SELECT COUNT(*) as count FROM ingestion_review_queue WHERE status = 'PENDING_REVIEW'")?.count || 0;
    const verifiedLeadershipCount = query.get("SELECT COUNT(*) as count FROM club_leadership WHERE verification_status = 'VERIFIED'")?.count || 0;

    res.json({
      summary: {
        canonical_clubs: clubsCount,
        sources_tracked: sourcesCount,
        opportunities: opportunitiesCount,
        historical_archives: archivesCount,
        pending_review_candidates: pendingQueueCount,
        verified_leadership_published: verifiedLeadershipCount,
        snapshot_date: '2026-10-24',
        timezone: 'Asia/Kolkata'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch research summary' });
  }
});

export default router;
