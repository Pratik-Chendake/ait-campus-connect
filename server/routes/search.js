import express from 'express';
import { query } from '../db/database.js';
import { AY_2026_27_START, AY_2026_27_DATE_ONLY_END } from '../utils/academicYear.js';

const router = express.Router();

// GET global multi-entity search
router.get('/', (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    if (!q || q.length < 2) {
      return res.json({
        students: [],
        events: [],
        clubs: [],
        internships: [],
        scholarships: [],
        research: [],
        achievements: []
      });
    }

    const term = `%${q}%`;

    // 1. Students
    const students = query.all(`
      SELECT DISTINCT u.id, u.full_name, u.student_id, u.branch, u.year, u.avatar_url, u.bio, u.contribution_score
      FROM users u
      LEFT JOIN user_skills us ON us.user_id = u.id
      LEFT JOIN skills s ON s.id = us.skill_id
      WHERE u.role = 'STUDENT' AND (u.full_name LIKE ? OR u.bio LIKE ? OR s.name LIKE ?)
      LIMIT 8
    `, [term, term, term]);

    // 2. Events & Hackathons (Strictly Academic Year 2026-27 Only)
    const events = query.all(`
      SELECT id, title, slug, category, mode, venue, event_start_date, registration_deadline, banner_url, prize_pool, academic_year
      FROM events
      WHERE (title LIKE ? OR description LIKE ? OR category LIKE ?)
        AND event_start_date >= ? AND event_start_date <= ?
        AND (is_archive = 0 OR is_archive IS NULL)
      LIMIT 8
    `, [term, term, term, AY_2026_27_START, AY_2026_27_DATE_ONLY_END]);

    // 3. Clubs
    const clubs = query.all(`
      SELECT id, name, slug, category, description, logo_url
      FROM clubs
      WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
      LIMIT 8
    `, [term, term, term]);

    // 4. Internships
    const internships = query.all(`
      SELECT id, title, company, role, mode, stipend, deadline
      FROM internships
      WHERE title LIKE ? OR company LIKE ? OR skills_required LIKE ?
      LIMIT 8
    `, [term, term, term]);

    // 5. Scholarships
    const scholarships = query.all(`
      SELECT id, name, provider, amount, deadline
      FROM scholarships
      WHERE name LIKE ? OR provider LIKE ?
      LIMIT 8
    `, [term, term]);

    // 6. Research
    const research = query.all(`
      SELECT rp.id, rp.title, rp.authors, rp.research_area, rp.is_ieee, u.full_name as student_name
      FROM research_papers rp
      JOIN users u ON u.id = rp.user_id
      WHERE rp.title LIKE ? OR rp.abstract LIKE ? OR rp.research_area LIKE ?
      LIMIT 8
    `, [term, term, term]);

    // 7. Verified Achievements
    const achievements = query.all(`
      SELECT a.id, a.title, a.event_name, a.level, a.position, u.full_name as student_name
      FROM achievements a
      JOIN users u ON u.id = a.user_id
      WHERE a.verification_status = 'VERIFIED' AND (a.title LIKE ? OR a.event_name LIKE ? OR a.organization LIKE ?)
      LIMIT 8
    `, [term, term, term]);

    // 8. Open Source & Unified Opportunities
    const opportunities = query.all(`
      SELECT o.id, o.title, o.opportunity_type, o.organizer, o.location_or_mode, o.official_url
      FROM opportunities o
      WHERE o.is_active = 1 AND (o.title LIKE ? OR o.organizer LIKE ? OR o.required_skills LIKE ?)
      LIMIT 8
    `, [term, term, term]);

    // 9. Historical Archives (Institutional Reports + Past Year Events)
    const reportArchives = query.all(`
      SELECT pea.id, pea.event_name, pea.type, pea.academic_year, pea.source_file, pea.source_pages, 'INSTITUTIONAL_REPORT' as origin
      FROM past_event_archives pea
      WHERE pea.is_public = 1 AND (pea.event_name LIKE ? OR pea.description LIKE ?)
      LIMIT 8
    `, [term, term]);

    const pastYearEvents = query.all(`
      SELECT e.id, e.title as event_name, e.category as type, e.academic_year, 'Past Campus Archive' as source_file, 'N/A' as source_pages, 'PAST_CAMPUS_EVENT' as origin
      FROM events e
      WHERE (e.is_archive = 1 OR e.event_start_date < ?)
        AND (e.title LIKE ? OR e.description LIKE ? OR e.category LIKE ?)
      LIMIT 8
    `, [AY_2026_27_START, term, term, term]);

    const archives = [...reportArchives, ...pastYearEvents].slice(0, 8);

    res.json({
      query: q,
      total_matches: students.length + events.length + clubs.length + internships.length + scholarships.length + research.length + achievements.length + opportunities.length + archives.length,
      students,
      events,
      clubs,
      internships,
      scholarships,
      research,
      achievements,
      opportunities,
      archives
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
