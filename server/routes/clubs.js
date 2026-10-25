import express from 'express';
import { query } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { AY_2026_27_START, AY_2026_27_DATE_ONLY_END } from '../utils/academicYear.js';

const router = express.Router();

// GET all clubs
router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;

    let sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM club_members WHERE club_id = c.id) as member_count,
             (SELECT COUNT(*) FROM events WHERE club_id = c.id AND event_end_date >= date('now') AND event_start_date >= '${AY_2026_27_START}' AND event_start_date <= '${AY_2026_27_DATE_ONLY_END}' AND (is_archive = 0 OR is_archive IS NULL)) as upcoming_event_count
      FROM clubs c
      WHERE c.status = 'ACTIVE'
    `;
    const params = [];

    if (category && category !== 'All') {
      sql += ' AND c.category LIKE ?';
      params.push(`%${category}%`);
    }

    if (search) {
      sql += ' AND (c.name LIKE ? OR c.description LIKE ? OR c.lead_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY c.name ASC';

    const clubs = query.all(sql, params);
    res.json({ clubs });
  } catch (err) {
    console.error('Error fetching clubs:', err);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

// GET single club detail
router.get('/:idOrSlug', (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let club;

    if (!isNaN(idOrSlug)) {
      club = query.get('SELECT * FROM clubs WHERE id = ?', [idOrSlug]);
    } else {
      club = query.get('SELECT * FROM clubs WHERE slug = ? OR instagram_handle = ?', [idOrSlug, idOrSlug]);
    }

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Follower / membership count
    const memberStats = query.get(`
      SELECT COUNT(*) as total_followers
      FROM club_members WHERE club_id = ?
    `, [club.id]);

    // Check if requesting user follows this club
    let isFollowing = false;
    let userRoleInClub = null;
    if (req.user) {
      const membership = query.get('SELECT role FROM club_members WHERE club_id = ? AND user_id = ?', [club.id, req.user.id]);
      if (membership) {
        isFollowing = true;
        userRoleInClub = membership.role;
      }
    }

    // Club events: strictly restricted to Academic Year 2026-27 for active upcoming & completed
    const upcomingEvents = query.all(`
      SELECT * FROM events
      WHERE club_id = ?
        AND event_end_date >= date('now')
        AND event_start_date >= ?
        AND event_start_date <= ?
        AND status = 'PUBLISHED'
        AND (is_archive = 0 OR is_archive IS NULL)
      ORDER BY event_start_date ASC
    `, [club.id, AY_2026_27_START, AY_2026_27_DATE_ONLY_END]);

    const pastEvents = query.all(`
      SELECT * FROM events
      WHERE club_id = ?
        AND (event_end_date < date('now') OR status = 'COMPLETED')
        AND event_start_date >= ?
        AND event_start_date <= ?
        AND (is_archive = 0 OR is_archive IS NULL)
      ORDER BY event_start_date DESC
    `, [club.id, AY_2026_27_START, AY_2026_27_DATE_ONLY_END]);

    // Historical archive records: institutional report archives PLUS any segregated past-year events (< 2026-07-01)
    const reportArchives = query.all(`
      SELECT id, source_key, event_name, type, academic_year, organizing_club_id, start_date, end_date,
             description, source_file, source_pages, verification_status, is_public, notes, 'INSTITUTIONAL_REPORT' as record_origin
      FROM past_event_archives
      WHERE organizing_club_id = ? AND is_public = 1
      ORDER BY start_date DESC
    `, [club.id]);

    const pastYearEvents = query.all(`
      SELECT id, slug as source_key, title as event_name, category as type, academic_year, club_id as organizing_club_id,
             event_start_date as start_date, event_end_date as end_date, description,
             'Past Campus Archive' as source_file, 'N/A' as source_pages,
             'COMPLETED_ARCHIVE' as verification_status, 1 as is_public, result_summary as notes, 'PAST_CAMPUS_EVENT' as record_origin
      FROM events
      WHERE club_id = ? AND (is_archive = 1 OR event_start_date < ?)
      ORDER BY event_start_date DESC
    `, [club.id, AY_2026_27_START]);

    const pastArchives = [...reportArchives, ...pastYearEvents];

    // Verified AY 2026-27 leadership records (published only)
    const verifiedLeadership = query.all(`
      SELECT cl.*, sr.title as source_title, sr.url_or_file as source_url
      FROM club_leadership cl
      LEFT JOIN source_records sr ON sr.id = cl.source_id
      WHERE cl.club_id = ? AND cl.published_at IS NOT NULL AND cl.verification_status = 'VERIFIED'
      ORDER BY cl.kind DESC, cl.id ASC
    `, [club.id]);

    // Club leadership & core team members
    const members = query.all(`
      SELECT cm.role, cm.duration, cm.joined_at, u.id as user_id, u.full_name, u.avatar_url, u.branch, u.year
      FROM club_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.club_id = ? AND cm.role != 'Follower'
      ORDER BY cm.id ASC
    `, [club.id]);

    res.json({
      club: {
        ...club,
        total_followers: memberStats ? memberStats.total_followers : 0,
        is_following: isFollowing,
        user_role: userRoleInClub,
        leadership_verified: verifiedLeadership.length > 0,
        leadership_notice: verifiedLeadership.length === 0 ? 'AY 2026–27 leadership information has not yet been verified.' : null
      },
      upcoming_events: upcomingEvents,
      past_events: pastEvents,
      past_archives: pastArchives,
      leadership: verifiedLeadership,
      members
    });
  } catch (err) {
    console.error('Error fetching club detail:', err);
    res.status(500).json({ error: 'Failed to fetch club detail' });
  }
});

// GET /api/clubs/:idOrSlug/leadership (Explicit AY Leadership endpoint)
router.get('/:idOrSlug/leadership', (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const academicYear = req.query.academicYear || '2026-27';

    let club;
    if (!isNaN(idOrSlug)) {
      club = query.get('SELECT id, name, slug, instagram_handle, leadership_status FROM clubs WHERE id = ?', [idOrSlug]);
    } else {
      club = query.get('SELECT id, name, slug, instagram_handle, leadership_status FROM clubs WHERE slug = ? OR instagram_handle = ?', [idOrSlug, idOrSlug]);
    }

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Only return explicitly verified and published leadership for the given academic year
    const leadership = query.all(`
      SELECT cl.*, sr.title as source_title, sr.url_or_file as source_url
      FROM club_leadership cl
      LEFT JOIN source_records sr ON sr.id = cl.source_id
      WHERE cl.club_id = ?
        AND cl.verification_status = 'VERIFIED'
        AND cl.published_at IS NOT NULL
        AND (cl.academic_year_start || '-' || SUBSTR(cl.academic_year_end, 3, 2)) = ?
      ORDER BY cl.kind DESC
    `, [club.id, academicYear]);

    res.json({
      club_id: club.id,
      club_name: club.name,
      academic_year: academicYear,
      is_verified: leadership.length > 0,
      status: leadership.length > 0 ? 'VERIFIED' : 'NOT_VERIFIED',
      message: leadership.length > 0 ? 'Verified AY 2026-27 appointments' : 'AY 2026–27 leadership information has not yet been verified.',
      leadership
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch club leadership' });
  }
});

// POST follow club
router.post('/:id/follow', requireAuth, (req, res) => {
  try {
    const clubId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    query.run(`
      INSERT OR IGNORE INTO club_members (club_id, user_id, role, duration)
      VALUES (?, ?, 'Follower', '2026')
    `, [clubId, userId]);

    res.json({ message: 'You are now following this club', is_following: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to follow club' });
  }
});

// POST unfollow club
router.post('/:id/unfollow', requireAuth, (req, res) => {
  try {
    const clubId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    query.run("DELETE FROM club_members WHERE club_id = ? AND user_id = ? AND role = 'Follower'", [clubId, userId]);

    res.json({ message: 'Unfollowed club', is_following: false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unfollow club' });
  }
});

// PATCH edit club (Admin or Club Organizer)
router.patch('/:id', requireAuth, requireRole('ADMIN', 'ORGANIZER'), (req, res) => {
  try {
    const clubId = parseInt(req.params.id, 10);
    const {
      name, description, about, logo_url, banner_url,
      instagram_url, website_url, contact_email, lead_name,
      lead_role, faculty_advisor
    } = req.body;

    query.run(`
      UPDATE clubs SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        about = COALESCE(?, about),
        logo_url = COALESCE(?, logo_url),
        banner_url = COALESCE(?, banner_url),
        instagram_url = COALESCE(?, instagram_url),
        website_url = COALESCE(?, website_url),
        contact_email = COALESCE(?, contact_email),
        lead_name = COALESCE(?, lead_name),
        lead_role = COALESCE(?, lead_role),
        faculty_advisor = COALESCE(?, faculty_advisor)
      WHERE id = ?
    `, [
      name, description, about, logo_url, banner_url,
      instagram_url, website_url, contact_email, lead_name,
      lead_role, faculty_advisor, clubId
    ]);

    const updated = query.get('SELECT * FROM clubs WHERE id = ?', [clubId]);
    res.json({ message: 'Club profile updated successfully', club: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update club profile' });
  }
});

export default router;
