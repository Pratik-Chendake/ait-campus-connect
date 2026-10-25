import express from 'express';
import { query } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getAcademicYear, AY_2026_27_START, AY_2026_27_DATE_ONLY_END } from '../utils/academicYear.js';

const router = express.Router();

// GET all events
// RESTRICTION: Active dashboard events are restricted strictly to Academic Year 2026-27 (1 July 2026 to 30 June 2027).
// Events prior to 1 July 2026 (AY 2025-26 or earlier) are segregated strictly into the archive view.
router.get('/', (req, res) => {
  try {
    const { category, mode, status, search, club_id, academic_year } = req.query;

    let sql = `
      SELECT e.*, c.name as club_name, c.logo_url as club_logo,
             (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id AND status != 'CANCELLED') as registration_count
      FROM events e
      LEFT JOIN clubs c ON c.id = e.club_id
      WHERE 1=1
    `;
    const params = [];

    // Historical Archive View vs Active Dashboard
    if (status === 'archive') {
      // Historical Archive: Past academic years (<= 2025-26) or explicitly archived events
      sql += ` AND (e.is_archive = 1 OR e.event_start_date < ? OR (e.academic_year != '2026-27' AND e.academic_year IS NOT NULL))`;
      params.push(AY_2026_27_START);
    } else {
      // Active Dashboard: Academic Year 2026-27 strict boundary (1 July 2026 to 30 June 2027)
      const targetAY = academic_year || '2026-27';
      if (targetAY === '2026-27') {
        sql += ` AND e.event_start_date >= ? AND e.event_start_date <= ? AND (e.is_archive = 0 OR e.is_archive IS NULL)`;
        params.push(AY_2026_27_START, AY_2026_27_DATE_ONLY_END);
      } else if (targetAY !== 'all') {
        sql += ` AND e.academic_year = ?`;
        params.push(targetAY);
      }

      // Status filters within the active dashboard
      if (status === 'upcoming') {
        sql += " AND e.status = 'PUBLISHED' AND e.event_end_date >= date('now')";
      } else if (status === 'completed') {
        sql += " AND (e.status = 'COMPLETED' OR e.results_published = 1 OR e.event_end_date < date('now'))";
      } else if (status && status !== 'All') {
        sql += ' AND e.status = ?';
        params.push(status);
      }
    }

    if (category && category !== 'All') {
      sql += ' AND e.category = ?';
      params.push(category);
    }

    if (mode && mode !== 'All') {
      sql += ' AND e.mode = ?';
      params.push(mode);
    }

    if (club_id) {
      sql += ' AND e.club_id = ?';
      params.push(club_id);
    }

    if (search) {
      sql += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ? OR e.organizer_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += status === 'archive' ? ' ORDER BY e.event_start_date DESC' : ' ORDER BY e.event_start_date ASC';

    const events = query.all(sql, params);

    // Also include institutional past archives if archive requested
    let pastArchives = [];
    if (status === 'archive') {
      pastArchives = query.all(`
        SELECT pea.*, c.name as club_name, c.logo_url as club_logo
        FROM past_event_archives pea
        LEFT JOIN clubs c ON c.id = pea.organizing_club_id
        WHERE pea.is_public = 1
        ORDER BY pea.start_date DESC
      `);
    }

    res.json({
      events,
      past_archives: pastArchives,
      academic_year: status === 'archive' ? 'historical_archives' : (academic_year || '2026-27'),
      total_count: events.length
    });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET user's applications / registrations
router.get('/applications/my', requireAuth, (req, res) => {
  try {
    const registrations = query.all(`
      SELECT er.id as registration_id, er.registration_number, er.status as registration_status,
             er.created_at as registered_at, er.custom_answers,
             e.id as event_id, e.title, e.category, e.event_start_date, e.event_end_date,
             e.mode, e.venue, e.banner_url, e.organizer_name,
             t.id as team_id, t.name as team_name
      FROM event_registrations er
      JOIN events e ON e.id = er.event_id
      LEFT JOIN teams t ON t.id = er.team_id
      WHERE er.user_id = ?
      ORDER BY er.created_at DESC
    `, [req.user.id]);

    res.json({ applications: registrations });
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET single event detail
router.get('/:id', (req, res) => {
  try {
    const eventId = req.params.id;
    const event = query.get(`
      SELECT e.*, c.name as club_name, c.logo_url as club_logo, c.slug as club_slug,
             (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id AND status != 'CANCELLED') as registration_count
      FROM events e
      LEFT JOIN clubs c ON c.id = e.club_id
      WHERE e.id = ?
    `, [eventId]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if the requesting user is registered
    let userRegistration = null;
    let userTeam = null;

    if (req.user) {
      userRegistration = query.get(`
        SELECT * FROM event_registrations
        WHERE event_id = ? AND user_id = ? AND status != 'CANCELLED'
      `, [eventId, req.user.id]);

      if (userRegistration && userRegistration.team_id) {
        userTeam = query.get('SELECT * FROM teams WHERE id = ?', [userRegistration.team_id]);
      }
    }

    // Get teams formed for this event
    const teams = query.all(`
      SELECT t.*, u.full_name as leader_name, u.avatar_url as leader_avatar,
             (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as current_member_count
      FROM teams t
      JOIN users u ON u.id = t.leader_id
      WHERE t.event_id = ?
      ORDER BY t.created_at DESC
    `, [eventId]);

    res.json({
      event,
      user_registration: userRegistration,
      user_team: userTeam,
      teams
    });
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ error: 'Failed to fetch event detail' });
  }
});

// POST create event (Organizer / Admin)
router.post('/', requireAuth, requireRole('ORGANIZER', 'ADMIN', 'FACULTY'), (req, res) => {
  try {
    const {
      title, category, club_id, description, problem_statement,
      banner_url, mode, venue, prize_pool, team_size_min, team_size_max,
      eligibility, rules, evaluation_criteria, registration_deadline,
      event_start_date, event_end_date, capacity
    } = req.body;

    if (!title || !category || !registration_deadline || !event_start_date) {
      return res.status(400).json({ error: 'Title, category, registration deadline, and start date are required' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const club = club_id ? query.get('SELECT name FROM clubs WHERE id = ?', [club_id]) : null;
    const organizerName = club ? club.name : (req.user.full_name || 'AIT Campus Connect');

    const calculatedAY = getAcademicYear(event_start_date);
    const isArchive = event_start_date < AY_2026_27_START ? 1 : 0;

    const result = query.run(`
      INSERT INTO events (
        title, slug, category, club_id, organizer_name, organizer_id,
        description, problem_statement, banner_url, mode, venue, prize_pool,
        team_size_min, team_size_max, eligibility, rules, evaluation_criteria,
        registration_deadline, event_start_date, event_end_date, status,
        capacity, results_published, academic_year, is_archive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, 0, ?, ?)
    `, [
      title, slug, category, club_id || null, organizerName, req.user.id,
      description || 'Campus event at Army Institute of Technology, Pune.',
      problem_statement || null,
      banner_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      mode || 'In-Person', venue || 'AIT Pune Campus', prize_pool || null,
      team_size_min || 1, team_size_max || 1, eligibility || 'Open to all AIT students',
      rules || 'Standard institute competition rules apply.', evaluation_criteria || null,
      registration_deadline, event_start_date, event_end_date || event_start_date,
      capacity || 200, calculatedAY, isArchive
    ]);

    // Send broadcast notification to students interested
    const students = query.all("SELECT id FROM users WHERE role = 'STUDENT' LIMIT 20");
    students.forEach(student => {
      query.run(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'New Opportunity: ' || ?, 'New ' || ? || ' published by ' || ? || '. Registration is now open!', 'EVENT', '/event/' || ?)
      `, [student.id, title, category, organizerName, result.lastInsertRowid]);
    });

    res.status(201).json({ message: 'Event published successfully', id: result.lastInsertRowid });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// POST register for event
router.post('/:id/register', requireAuth, (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { team_id, custom_answers } = req.body || {};

    const event = query.get('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check if event registration is hosted externally or unconfirmed
    if (event.registration_mode === 'EXTERNAL') {
      return res.status(400).json({
        error: 'Official registration is managed directly by the organizers on their external portal. Please register via the official event link.',
        official_event_url: event.official_event_url || event.source_url
      });
    }

    if (event.registration_status === 'UNCONFIRMED') {
      return res.status(400).json({
        error: 'Official registration details have not yet been announced or verified by the organizers.',
        official_event_url: event.official_event_url || event.source_url
      });
    }

    // Check if registration deadline has passed
    if (new Date(event.registration_deadline) < new Date()) {
      return res.status(400).json({ error: 'Registration deadline has passed for this event.' });
    }

    // Check if already registered or previously cancelled
    const existing = query.get("SELECT id, status FROM event_registrations WHERE event_id = ? AND user_id = ?", [eventId, userId]);
    if (existing && existing.status !== 'CANCELLED') {
      return res.status(400).json({ error: 'You are already registered for this event.' });
    }

    // Generate unique Registration ID
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const registrationNumber = `AIT-2026-${randomNum}`;

    if (existing && existing.status === 'CANCELLED') {
      query.run(`
        UPDATE event_registrations
        SET registration_number = ?, team_id = ?, status = 'REGISTERED',
            custom_answers = ?, created_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        registrationNumber, team_id || null,
        custom_answers ? JSON.stringify(custom_answers) : null,
        existing.id
      ]);
    } else {
      query.run(`
        INSERT INTO event_registrations (registration_number, event_id, user_id, team_id, status, custom_answers)
        VALUES (?, ?, ?, ?, 'REGISTERED', ?)
      `, [
        registrationNumber, eventId, userId, team_id || null,
        custom_answers ? JSON.stringify(custom_answers) : null
      ]);
    }

    // Check if team details exist
    let teamName = null;
    let roleInTeam = 'Individual';
    if (team_id) {
      const t = query.get('SELECT name, leader_id FROM teams WHERE id = ?', [team_id]);
      if (t) {
        teamName = t.name;
        roleInTeam = t.leader_id === userId ? 'Team Leader' : 'Team Member';
      }
    }

    // AUTOMATIC PARTICIPATION RECORDING — MOST IMPORTANT FEATURE
    // Check idempotency: If record already exists for this student and event, update it instead of duplicating
    let partRecord = query.get('SELECT id FROM participation_records WHERE student_id = ? AND event_id = ?', [userId, eventId]);
    let partId = null;

    if (partRecord) {
      partId = partRecord.id;
      query.run(`
        UPDATE participation_records
        SET registration_id = ?, registration_status = 'REGISTERED',
            participation_status = 'REGISTERED', team_id = ?, team_name = ?,
            role_in_team = ?, registered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [registrationNumber, team_id || null, teamName, roleInTeam, partId]);
    } else {
      const insertPart = query.run(`
        INSERT INTO participation_records (
          student_id, event_id, event_type, title, organizer, category,
          mode, location, event_date, event_end_date, registration_id,
          registration_status, participation_status, registered_at,
          confirmed_at, source_type, verification_status, team_id,
          team_name, role_in_team, is_in_portfolio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REGISTERED', 'REGISTERED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'PORTAL_REGISTRATION', 'OFFICIAL', ?, ?, ?, 0)
      `, [
        userId, eventId, event.category || 'CAMPUS_EVENT',
        event.title, event.organizer_name || 'AIT Pune Campus Connect',
        event.category || 'Technical', event.mode || 'In-Person',
        event.venue || 'AIT Pune Campus', event.event_start_date,
        event.event_end_date, registrationNumber,
        team_id || null, teamName, roleInTeam
      ]);
      partId = insertPart.lastInsertRowid;
    }

    // Create permanent registration milestone
    query.run(`
      INSERT INTO participation_milestones (
        participation_id, milestone_type, previous_status, new_status,
        round_name, occurred_at, notes
      ) VALUES (?, 'REGISTRATION_CONFIRMED', NULL, 'REGISTERED', 'Official Portal Registration', CURRENT_TIMESTAMP, 'Automatic permanent registration confirmed through AIT Pune portal.')
    `, [partId]);

    // Send high-priority notification linking directly to My Achievements
    query.run(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Registration Confirmed! 🎉', 'You have registered for \"' || ? || '\". Registration ID: ' || ? || '. Your permanent record is now active in My Achievements.', 'EVENT', '/my-achievements')
    `, [userId, event.title, registrationNumber]);

    res.status(201).json({
      message: 'Registration successful and recorded permanently in My Achievements',
      registration_number: registrationNumber,
      participation_id: partId,
      event_id: eventId
    });
  } catch (err) {
    console.error('Error registering for event:', err);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

// POST cancel registration
router.post('/:id/cancel-registration', requireAuth, (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    query.run(`
      UPDATE event_registrations
      SET status = 'CANCELLED'
      WHERE event_id = ? AND user_id = ?
    `, [eventId, userId]);

    // Update participation record with audit preservation (No Deletion!)
    const part = query.get('SELECT id FROM participation_records WHERE event_id = ? AND student_id = ?', [eventId, userId]);
    if (part) {
      query.run(`
        UPDATE participation_records
        SET registration_status = 'CANCELLED', participation_status = 'WITHDRAWN', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [part.id]);

      query.run(`
        INSERT INTO participation_milestones (
          participation_id, milestone_type, previous_status, new_status,
          occurred_at, notes
        ) VALUES (?, 'WITHDRAWAL', 'REGISTERED', 'WITHDRAWN', CURRENT_TIMESTAMP, 'Student cancelled registration.')
      `, [part.id]);

      query.run(`
        INSERT INTO participation_audits (
          entity_type, entity_id, action, performed_by, performed_by_name,
          reason, previous_values, new_values
        ) VALUES ('PARTICIPATION_RECORD', ?, 'WITHDRAWAL_REQUESTED', ?, ?, 'Student cancelled registration via event page', '{"registration_status":"REGISTERED"}', '{"registration_status":"CANCELLED","participation_status":"WITHDRAWN"}')
      `, [part.id, userId, req.user.full_name || 'Student']);
    }

    res.json({ message: 'Registration cancelled successfully. Official audit trail preserved.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
});

// POST publish results & automatic achievement creation (Crucial Workflow!)
router.post('/:id/results', requireAuth, requireRole('ORGANIZER', 'ADMIN', 'FACULTY'), (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const {
      winners = [],        // array of user_ids
      runners_up = [],     // array of user_ids
      second_runners_up = [], // array of user_ids
      finalists = [],      // array of user_ids
      participants = [],   // array of user_ids
      result_summary,
      proof_document_url
    } = req.body;

    const event = query.get('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Mark event as completed and results published
    query.run(`
      UPDATE events SET
        status = 'COMPLETED',
        results_published = 1,
        result_summary = ?
      WHERE id = ?
    `, [result_summary || 'Official results published by organizer.', eventId]);

    const eventDate = event.event_end_date ? event.event_end_date.slice(0, 10) : '2026-10-24';

    // Helper to process placement
    const processGroup = (userIds, position, points, isHighlight) => {
      userIds.forEach(uid => {
        const u = query.get('SELECT id, full_name, email FROM users WHERE id = ?', [uid]);
        if (!u) return;

        const title = `${position} - ${event.title}`;
        const desc = `Awarded ${position} at ${event.title} conducted by ${event.organizer_name}. Verified directly by event organizer.`;

        query.run(`
          INSERT INTO achievements (
            user_id, event_id, title, event_name, organization, category,
            level, position, date, description, certificate_url,
            verification_status, verified_by, verified_at, is_highlight, points_awarded
          ) VALUES (?, ?, ?, ?, ?, ?, 'College', ?, ?, ?, ?, 'VERIFIED', ?, CURRENT_TIMESTAMP, ?, ?)
        `, [
          u.id, eventId, title, event.title, event.organizer_name, event.category,
          position, eventDate, desc, proof_document_url || null, req.user.id,
          isHighlight ? 1 : 0, points
        ]);

        // Increment user contribution score
        query.run('UPDATE users SET contribution_score = contribution_score + ? WHERE id = ?', [points, u.id]);

        // --- Permanent Student Achievement & Participation Record System Hook ---
        let part = query.get('SELECT id FROM participation_records WHERE event_id = ? AND student_id = ?', [eventId, u.id]);
        let partId = null;

        const rankNum = position.includes('(1st)') ? 1
          : position.includes('(2nd)') ? 2
          : position.includes('(3rd)') ? 3
          : null;

        const statusLabel = rankNum === 1 ? 'WINNER'
          : rankNum === 2 ? 'RUNNER_UP'
          : rankNum === 3 ? 'SECOND_RUNNER_UP'
          : position.includes('Finalist') ? 'FINALIST'
          : 'COMPLETED';

        const resultType = rankNum === 1 ? 'WINNER'
          : rankNum === 2 ? 'RUNNER_UP'
          : rankNum === 3 ? 'SECOND_RUNNER_UP'
          : position.includes('Finalist') ? 'FINALIST'
          : 'PARTICIPANT';

        if (!part) {
          // If student was on organizer roster without pre-registering on portal, create the official record now
          const regNum = `AIT-${eventId}-${u.id}`;
          const insertPart = query.run(`
            INSERT INTO participation_records (
              student_id, event_id, event_type, title, organizer, category,
              mode, location, event_date, event_end_date, registration_id,
              registration_status, participation_status, registered_at, confirmed_at,
              completed_at, source_type, verification_status, role_in_team, is_in_portfolio
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ORGANIZER_ROSTER', 'OFFICIAL', 'Participant', ?)
          `, [
            u.id, eventId, event.category, event.title, event.organizer_name,
            event.category, event.mode, event.venue, event.event_start_date,
            event.event_end_date, regNum, statusLabel, isHighlight ? 1 : 0
          ]);
          partId = insertPart.lastInsertRowid;
        } else {
          partId = part.id;
          query.run(`
            UPDATE participation_records
            SET participation_status = ?, completed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP,
                is_in_portfolio = CASE WHEN ? = 1 THEN 1 ELSE is_in_portfolio END
            WHERE id = ?
          `, [statusLabel, isHighlight ? 1 : 0, partId]);
        }

        // Insert / Update Participation Result
        query.run(`
          INSERT INTO participation_results (
            participation_id, competition_id, round_name, result_type,
            official_rank, rank_category, score, score_max, feedback, verification_status
          ) VALUES (?, ?, 'Grand Finale', ?, ?, ?, ?, 100, ?, 'VERIFIED')
        `, [
          partId, eventId, resultType, rankNum, position,
          rankNum === 1 ? 98.5 : rankNum === 2 ? 94.0 : rankNum === 3 ? 90.0 : 85.0,
          desc
        ]);

        // Insert Result Milestone
        query.run(`
          INSERT INTO participation_milestones (
            participation_id, milestone_type, previous_status, new_status,
            round_name, occurred_at, recorded_by, recorded_by_name, notes
          ) VALUES (?, 'RESULT_PUBLISHED', 'REGISTERED', ?, 'Grand Finale', CURRENT_TIMESTAMP, ?, ?, ?)
        `, [
          partId, statusLabel, req.user.id,
          req.user.full_name || 'Event Organizer',
          `Official result announced: ${position}`
        ]);

        // Auto-associate official credential/certificate
        const credId = `AIT-CERT-${partId}-${Math.floor(1000 + Math.random() * 9000)}`;
        query.run(`
          INSERT OR IGNORE INTO participation_certificates (
            student_id, participation_id, issuer, certificate_type,
            credential_id, file_path, verification_url, issued_at, verification_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'VERIFIED')
        `, [
          u.id, partId, event.organizer_name, position, credId,
          proof_document_url || 'https://aitpune.edu.in/certificates/verified-award.pdf',
          proof_document_url || 'https://aitpune.edu.in/certificates/verified-award.pdf'
        ]);

        // Send notification
        query.run(`
          INSERT INTO notifications (user_id, title, message, type, link)
          VALUES (?, 'Achievement Added to My Achievements! 🏆', 'Congratulations! You were awarded \"' || ? || '\" in ' || ? || '. +' || ? || ' points added. Permanent record updated.', 'ACHIEVEMENT', '/my-achievements')
        `, [u.id, position, event.title, points]);
      });
    };

    processGroup(winners, 'Winner (1st)', 30, true);
    processGroup(runners_up, '1st Runner-up (2nd)', 20, true);
    processGroup(second_runners_up, '2nd Runner-up (3rd)', 15, true);
    processGroup(finalists, 'Finalist', 10, false);
    processGroup(participants, 'Participant', 5, false);

    // Audit log
    query.run(`
      INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
      VALUES (?, 'PUBLISH_RESULTS', 'EVENT', ?, 'Published results and generated verified achievements for participants')
    `, [req.user.id, eventId]);

    res.json({
      message: 'Results published successfully! Achievements automatically created for all winners and participants.',
      event_id: eventId
    });
  } catch (err) {
    console.error('Error publishing event results:', err);
    res.status(500).json({ error: 'Failed to publish event results' });
  }
});

// POST /events/:id/advance-round — Milestone progression for multi-round competitions (Organizer/Admin)
router.post('/:id/advance-round', requireAuth, requireRole('ORGANIZER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const { user_id, milestone_type, new_status, round_name, notes } = req.body;

    if (!user_id || !new_status) {
      return res.status(400).json({ error: 'User ID and new status are required' });
    }

    const event = query.get('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    let part = query.get('SELECT * FROM participation_records WHERE event_id = ? AND student_id = ?', [eventId, user_id]);
    if (!part) {
      return res.status(404).json({ error: 'Student is not registered for this event' });
    }

    const prevStatus = part.participation_status;
    query.run(`
      UPDATE participation_records
      SET participation_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [new_status, part.id]);

    const mRes = query.run(`
      INSERT INTO participation_milestones (
        participation_id, milestone_type, previous_status, new_status,
        round_name, occurred_at, recorded_by, recorded_by_name, notes
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
    `, [
      part.id, milestone_type || 'ROUND_QUALIFIED', prevStatus, new_status,
      round_name || 'Round Advancement',
      req.user.id, req.user.full_name || 'Event Coordinator',
      notes || `Advanced to ${new_status}`
    ]);

    // Send student notification
    query.run(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Milestone Achieved in ' || ?, 'You have been advanced to ' || ? || ' for \"' || ? || '\". Check your achievements timeline!', 'EVENT', '/my-achievements')
    `, [user_id, event.title, new_status, event.title]);

    res.json({
      message: 'Student milestone updated successfully',
      milestone_id: mRes.lastInsertRowid,
      new_status
    });
  } catch (err) {
    console.error('Error advancing student round:', err);
    res.status(500).json({ error: 'Failed to advance student round' });
  }
});

export default router;
