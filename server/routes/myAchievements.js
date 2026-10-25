import express from 'express';
import { query } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ============================================================================
// 1. GET /api/my-achievements — Current student's participation & achievements
// ============================================================================
router.get('/', requireAuth, (req, res) => {
  try {
    const studentId = req.user.id;
    const { tab, category, search, year, semester } = req.query;

    // --- Dynamic Statistics Telemetry ---
    const totalReg = query.get(`
      SELECT COUNT(*) as count FROM participation_records
      WHERE student_id = ? AND registration_status != 'CANCELLED'
    `, [studentId])?.count || 0;

    const confirmedParts = query.get(`
      SELECT COUNT(*) as count FROM participation_records
      WHERE student_id = ? AND participation_status IN (
        'ATTENDANCE_CONFIRMED', 'PARTICIPATED', 'SUBMISSION_COMPLETED',
        'QUALIFIED', 'SHORTLISTED', 'FINALIST', 'WINNER', 'COMPLETED'
      )
    `, [studentId])?.count || 0;

    const hackathons = query.get(`
      SELECT COUNT(*) as count FROM participation_records
      WHERE student_id = ? AND (
        UPPER(event_type) LIKE '%HACKATHON%' OR
        UPPER(category) LIKE '%HACKATHON%' OR
        UPPER(title) LIKE '%HACKATHON%'
      )
    `, [studentId])?.count || 0;

    const competitions = query.get(`
      SELECT COUNT(*) as count FROM participation_records
      WHERE student_id = ? AND (
        UPPER(event_type) IN ('COMPETITION', 'CODING', 'TECHNICAL', 'ROBOTICS') OR
        UPPER(category) IN ('COMPETITION', 'CODING', 'ROBOTICS')
      )
    `, [studentId])?.count || 0;

    const firstPlaces = query.get(`
      SELECT COUNT(*) as count FROM participation_results pr
      JOIN participation_records p ON p.id = pr.participation_id
      WHERE p.student_id = ? AND (pr.official_rank = 1 OR pr.result_type = 'WINNER')
    `, [studentId])?.count || 0;

    const secondPlaces = query.get(`
      SELECT COUNT(*) as count FROM participation_results pr
      JOIN participation_records p ON p.id = pr.participation_id
      WHERE p.student_id = ? AND (pr.official_rank = 2 OR pr.result_type = 'RUNNER_UP')
    `, [studentId])?.count || 0;

    const thirdPlaces = query.get(`
      SELECT COUNT(*) as count FROM participation_results pr
      JOIN participation_records p ON p.id = pr.participation_id
      WHERE p.student_id = ? AND (pr.official_rank = 3 OR pr.result_type = 'SECOND_RUNNER_UP')
    `, [studentId])?.count || 0;

    const finalists = query.get(`
      SELECT COUNT(DISTINCT p.id) as count FROM participation_records p
      LEFT JOIN participation_results pr ON pr.participation_id = p.id
      WHERE p.student_id = ? AND (
        p.participation_status = 'FINALIST' OR
        pr.result_type = 'FINALIST'
      )
    `, [studentId])?.count || 0;

    const qualifiedRounds = query.get(`
      SELECT COUNT(*) as count FROM participation_milestones pm
      JOIN participation_records p ON p.id = pm.participation_id
      WHERE p.student_id = ? AND pm.milestone_type = 'ROUND_QUALIFIED'
    `, [studentId])?.count || 0;

    const verifiedCerts = query.get(`
      SELECT COUNT(*) as count FROM participation_certificates
      WHERE student_id = ? AND verification_status = 'VERIFIED'
    `, [studentId])?.count || 0;

    const inPortfolio = query.get(`
      SELECT COUNT(*) as count FROM participation_records
      WHERE student_id = ? AND is_in_portfolio = 1
    `, [studentId])?.count || 0;

    const overview = {
      total_registered: totalReg,
      confirmed_participations: confirmedParts,
      hackathons_count: hackathons,
      competitions_count: competitions,
      first_place_wins: firstPlaces,
      second_place_finishes: secondPlaces,
      third_place_finishes: thirdPlaces,
      podium_finishes: firstPlaces + secondPlaces + thirdPlaces,
      finalist_count: finalists,
      rounds_qualified: qualifiedRounds,
      verified_certificates: verifiedCerts,
      portfolio_achievements: inPortfolio
    };

    // --- Query Participation Records with Filters ---
    let sql = `
      SELECT p.*,
             e.banner_url as event_banner,
             c.logo_url as event_logo,
             e.problem_statement,
             e.slug as event_slug,
             t.name as resolved_team_name,
             (SELECT COUNT(*) FROM participation_certificates WHERE participation_id = p.id) as certificate_count,
             (SELECT COUNT(*) FROM participation_milestones WHERE participation_id = p.id) as milestone_count
      FROM participation_records p
      LEFT JOIN events e ON e.id = p.event_id
      LEFT JOIN clubs c ON c.id = e.club_id
      LEFT JOIN teams t ON t.id = p.team_id
      WHERE p.student_id = ?
    `;
    const params = [studentId];

    // Tab Filters
    if (tab === 'ongoing') {
      sql += ` AND p.participation_status IN ('REGISTERED', 'ATTENDANCE_CONFIRMED', 'QUALIFIED', 'SHORTLISTED', 'FINALIST')
               AND (p.event_end_date IS NULL OR p.event_end_date >= date('now'))`;
    } else if (tab === 'completed') {
      sql += ` AND (p.participation_status IN ('COMPLETED', 'WINNER', 'PARTICIPATED', 'SUBMISSION_COMPLETED')
               OR (p.event_end_date IS NOT NULL AND p.event_end_date < date('now')))`;
    } else if (tab === 'winners') {
      sql += ` AND (
        p.participation_status = 'WINNER' OR
        p.id IN (SELECT participation_id FROM participation_results WHERE official_rank <= 3 OR result_type IN ('WINNER', 'RUNNER_UP', 'SECOND_RUNNER_UP'))
      )`;
    } else if (tab === 'qualified') {
      sql += ` AND (
        p.participation_status IN ('QUALIFIED', 'SHORTLISTED', 'FINALIST') OR
        p.id IN (SELECT participation_id FROM participation_milestones WHERE milestone_type = 'ROUND_QUALIFIED')
      )`;
    } else if (tab === 'certificates') {
      sql += ` AND p.id IN (SELECT participation_id FROM participation_certificates)`;
    } else if (tab === 'portfolio') {
      sql += ` AND p.is_in_portfolio = 1`;
    }

    // Category Filter
    if (category && category !== 'All') {
      sql += ` AND (p.category = ? OR p.event_type = ?)`;
      params.push(category, category);
    }

    // Search Filter
    if (search) {
      sql += ` AND (p.title LIKE ? OR p.organizer LIKE ? OR p.registration_id LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Year Filter
    if (year && year !== 'All') {
      sql += ` AND (p.event_date LIKE ? OR p.registered_at LIKE ?)`;
      params.push(`${year}%`, `${year}%`);
    }

    sql += ` ORDER BY p.is_in_portfolio DESC, p.event_date DESC, p.id DESC`;

    const rawRecords = query.all(sql, params);

    // Enrich each record with latest results and certificates preview
    const enrichedRecords = rawRecords.map((rec) => {
      const results = query.all(`
        SELECT * FROM participation_results
        WHERE participation_id = ?
        ORDER BY official_rank ASC, id DESC
      `, [rec.id]);

      const certificates = query.all(`
        SELECT * FROM participation_certificates
        WHERE participation_id = ?
        ORDER BY id DESC
      `, [rec.id]);

      const milestones = query.all(`
        SELECT * FROM participation_milestones
        WHERE participation_id = ?
        ORDER BY occurred_at ASC, id ASC
      `, [rec.id]);

      return {
        ...rec,
        results,
        certificates,
        milestones,
        latest_result: results[0] || null
      };
    });

    // --- Generate Unified Chronological Timeline ---
    const timelineMilestones = query.all(`
      SELECT pm.*, p.title as event_title, p.category as event_category,
             p.organizer as event_organizer, p.event_date
      FROM participation_milestones pm
      JOIN participation_records p ON p.id = pm.participation_id
      WHERE p.student_id = ?
      ORDER BY pm.occurred_at DESC
    `, [studentId]);

    res.json({
      overview,
      records: enrichedRecords,
      timeline: timelineMilestones,
      student: {
        id: req.user.id,
        full_name: req.user.full_name,
        student_id: req.user.student_id,
        branch: req.user.branch,
        year: req.user.year
      }
    });
  } catch (err) {
    console.error('Error fetching student achievements:', err);
    res.status(500).json({ error: 'Failed to retrieve participation records' });
  }
});

// ============================================================================
// 2. GET /api/my-achievements/:id — Detailed Participation Page / Modal
// ============================================================================
router.get('/:id', requireAuth, (req, res) => {
  try {
    const partId = parseInt(req.params.id, 10);
    const studentId = req.user.id;
    const userRole = req.user.role;

    const record = query.get('SELECT * FROM participation_records WHERE id = ?', [partId]);
    if (!record) {
      return res.status(404).json({ error: 'Participation record not found' });
    }

    // STRICT DATA ISOLATION: A student may only access their own private record.
    if (userRole === 'STUDENT' && record.student_id !== studentId) {
      return res.status(403).json({
        error: 'Forbidden: Access to another student participation record is strictly denied.'
      });
    }

    // Fetch related event details if available
    let event = null;
    if (record.event_id) {
      event = query.get(`
        SELECT e.*, c.name as club_name, c.logo_url as club_logo
        FROM events e
        LEFT JOIN clubs c ON c.id = e.club_id
        WHERE e.id = ?
      `, [record.event_id]);
    }

    // Fetch student info
    const student = query.get(`
      SELECT id, student_id, full_name, email, branch, year, semester, avatar_url
      FROM users WHERE id = ?
    `, [record.student_id]);

    // Fetch team info if applicable
    let team = null;
    let teamMembers = [];
    if (record.team_id) {
      team = query.get('SELECT * FROM teams WHERE id = ?', [record.team_id]);
      teamMembers = query.all(`
        SELECT tm.*, u.full_name, u.avatar_url, u.student_id, u.branch
        FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        WHERE tm.team_id = ?
      `, [record.team_id]);
    }

    // Milestones progression
    const milestones = query.all(`
      SELECT * FROM participation_milestones
      WHERE participation_id = ?
      ORDER BY occurred_at ASC, id ASC
    `, [partId]);

    // Results
    const results = query.all(`
      SELECT * FROM participation_results
      WHERE participation_id = ?
      ORDER BY official_rank ASC, id DESC
    `, [partId]);

    // Certificates
    const certificates = query.all(`
      SELECT * FROM participation_certificates
      WHERE participation_id = ?
      ORDER BY id DESC
    `, [partId]);

    // Audits
    const audits = query.all(`
      SELECT * FROM participation_audits
      WHERE entity_type = 'PARTICIPATION_RECORD' AND entity_id = ?
      ORDER BY performed_at DESC
    `, [partId]);

    res.json({
      record,
      event,
      student,
      team: team ? { ...team, members: teamMembers } : null,
      milestones,
      results,
      certificates,
      audits
    });
  } catch (err) {
    console.error('Error fetching participation record details:', err);
    res.status(500).json({ error: 'Failed to retrieve participation details' });
  }
});

// ============================================================================
// 3. POST /api/my-achievements/manual — Add Previous External Achievement
// ============================================================================
router.post('/manual', requireAuth, (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      title, organizer, category, mode, location, event_date,
      participation_status, role_in_team, project_title,
      project_repo_url, submission_url, notes, certificate_url,
      certificate_name, credential_id, is_in_portfolio
    } = req.body;

    if (!title || !organizer || !event_date) {
      return res.status(400).json({ error: 'Title, organizer, and event date are required.' });
    }

    const regNumber = `SELF-${Date.now().toString().slice(-6)}`;
    const effectiveStatus = participation_status || 'PARTICIPATED';

    const insertResult = query.run(`
      INSERT INTO participation_records (
        student_id, event_id, event_type, title, organizer, category,
        mode, location, event_date, registration_id, registration_status,
        participation_status, registered_at, confirmed_at, completed_at,
        source_type, verification_status, role_in_team, project_title,
        project_repo_url, submission_url, notes, is_in_portfolio
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SELF_REPORTED', 'PENDING_VERIFICATION', ?, ?, ?, ?, ?, ?)
    `, [
      studentId, category || 'Technical', title, organizer,
      category || 'Technical', mode || 'In-Person', location || 'Off-Campus',
      event_date, regNumber, effectiveStatus, role_in_team || 'Individual',
      project_title || null, project_repo_url || null, submission_url || null,
      notes || null, is_in_portfolio ? 1 : 0
    ]);

    const partId = insertResult.lastInsertRowid;

    // Log initial milestone
    query.run(`
      INSERT INTO participation_milestones (
        participation_id, milestone_type, previous_status, new_status,
        round_name, occurred_at, notes
      ) VALUES (?, 'SELF_REPORTED_SUBMISSION', NULL, ?, 'Self-Reported Historical Entry', ?, 'Student submitted historical participation record pending verification')
    `, [partId, effectiveStatus, event_date]);

    // Attach certificate if evidence was provided
    if (certificate_url) {
      const credId = credential_id || `CRED-SELF-${partId}-${Math.floor(1000 + Math.random() * 9000)}`;
      query.run(`
        INSERT INTO participation_certificates (
          student_id, participation_id, issuer, certificate_type,
          credential_id, file_path, verification_url, issued_at, verification_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_VERIFICATION')
      `, [
        studentId, partId, organizer, certificate_name || 'Participation Certificate',
        credId, certificate_url, certificate_url, event_date
      ]);
    }

    // Log audit trail
    query.run(`
      INSERT INTO participation_audits (
        entity_type, entity_id, action, performed_by, performed_by_name,
        reason, new_values
      ) VALUES ('PARTICIPATION_RECORD', ?, 'SELF_REPORTED_ACHIEVEMENT_ADDED', ?, ?, 'Student imported historical achievement record', ?)
    `, [
      partId, studentId, req.user.full_name || 'Student',
      JSON.stringify({ title, organizer, category, event_date, status: effectiveStatus })
    ]);

    // Also create entry in achievements table for Faculty Verification Center queue
    try {
      const positionLabel = effectiveStatus === 'WINNER' ? 'Winner (1st)' :
                            effectiveStatus === 'RUNNER_UP' ? '1st Runner-up (2nd)' :
                            effectiveStatus === 'SECOND_RUNNER_UP' ? '2nd Runner-up (3rd)' :
                            effectiveStatus === 'FINALIST' ? 'Selected Finalist' :
                            effectiveStatus === 'QUALIFIED' ? 'Qualified for Next Round' : 'Participant';
      query.run(`
        INSERT INTO achievements (
          user_id, event_id, title, event_name, organization, category,
          level, position, date, description, certificate_url,
          verification_status, points_awarded
        ) VALUES (?, NULL, ?, ?, ?, ?, 'College', ?, ?, ?, ?, 'PENDING', 0)
      `, [
        studentId, title, title, organizer, category || 'Hackathon',
        positionLabel, event_date, notes || project_title || null, certificate_url || null
      ]);
    } catch (e) {
      console.error('Error syncing manual achievement to verification queue:', e);
    }

    // Send notification to faculty verifiers
    const faculty = query.all("SELECT id FROM users WHERE role IN ('FACULTY', 'ADMIN', 'SUPER_ADMIN')");
    faculty.forEach((fac) => {
      query.run(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'New Historical Achievement Verification Request', ? || ' submitted an achievement: "' || ? || '" for review.', 'VERIFICATION', '/verification')
      `, [fac.id, req.user.full_name, title]);
    });

    res.status(201).json({
      message: 'Previous achievement record saved successfully with Pending Verification status.',
      id: partId,
      registration_id: regNumber
    });
  } catch (err) {
    console.error('Error adding self-reported achievement:', err);
    res.status(500).json({ error: 'Failed to record previous achievement' });
  }
});

// ============================================================================
// 4. POST /api/my-achievements/:id/portfolio — Toggle Inclusion in Public Portfolio
// ============================================================================
router.post('/:id/portfolio', requireAuth, (req, res) => {
  try {
    const partId = parseInt(req.params.id, 10);
    const studentId = req.user.id;
    const { is_in_portfolio, portfolio_visibility } = req.body;

    const record = query.get('SELECT * FROM participation_records WHERE id = ?', [partId]);
    if (!record) {
      return res.status(404).json({ error: 'Participation record not found' });
    }

    if (record.student_id !== studentId && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to modify portfolio settings for this record.' });
    }

    const newInPortfolio = is_in_portfolio ? 1 : 0;
    const visibility = portfolio_visibility || record.portfolio_visibility || 'PUBLIC';

    query.run(`
      UPDATE participation_records
      SET is_in_portfolio = ?, portfolio_visibility = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newInPortfolio, visibility, partId]);

    // Mandatory rule: Audit portfolio inclusion change while preserving participation record
    query.run(`
      INSERT INTO participation_audits (
        entity_type, entity_id, action, performed_by, performed_by_name,
        reason, previous_values, new_values
      ) VALUES ('PARTICIPATION_RECORD', ?, 'PORTFOLIO_TOGGLED', ?, ?, 'Student updated portfolio showcase preference', ?, ?)
    `, [
      partId, studentId, req.user.full_name || 'Student',
      JSON.stringify({ is_in_portfolio: record.is_in_portfolio }),
      JSON.stringify({ is_in_portfolio: newInPortfolio, visibility })
    ]);

    res.json({
      message: newInPortfolio
        ? 'Achievement added to your public portfolio showcase! 🎉'
        : 'Achievement removed from your public portfolio. (Your official participation history remains securely saved in My Achievements)',
      is_in_portfolio: newInPortfolio,
      portfolio_visibility: visibility
    });
  } catch (err) {
    console.error('Error toggling portfolio inclusion:', err);
    res.status(500).json({ error: 'Failed to update portfolio settings' });
  }
});

// ============================================================================
// 5. PATCH /api/my-achievements/:id/withdraw — Student Withdrawal / Cancel
// ============================================================================
router.patch('/:id/withdraw', requireAuth, (req, res) => {
  try {
    const partId = parseInt(req.params.id, 10);
    const studentId = req.user.id;
    const { reason } = req.body;

    const record = query.get('SELECT * FROM participation_records WHERE id = ?', [partId]);
    if (!record) return res.status(404).json({ error: 'Participation record not found' });

    if (record.student_id !== studentId) {
      return res.status(403).json({ error: 'Unauthorized: You can only withdraw from your own participations.' });
    }

    const previousStatus = record.participation_status;
    query.run(`
      UPDATE participation_records
      SET participation_status = 'WITHDRAWN', registration_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [partId]);

    // Also update event_registrations if linked
    if (record.event_id) {
      query.run(`
        UPDATE event_registrations
        SET status = 'CANCELLED'
        WHERE event_id = ? AND user_id = ?
      `, [record.event_id, studentId]);
    }

    // Log withdrawal milestone
    query.run(`
      INSERT INTO participation_milestones (
        participation_id, milestone_type, previous_status, new_status,
        occurred_at, notes
      ) VALUES (?, 'WITHDRAWAL', ?, 'WITHDRAWN', CURRENT_TIMESTAMP, ?)
    `, [partId, previousStatus, reason || 'Student requested withdrawal from activity.']);

    // Log audit trail
    query.run(`
      INSERT INTO participation_audits (
        entity_type, entity_id, action, performed_by, performed_by_name,
        reason, previous_values, new_values
      ) VALUES ('PARTICIPATION_RECORD', ?, 'WITHDRAWAL_REQUESTED', ?, ?, ?, ?, ?)
    `, [
      partId, studentId, req.user.full_name || 'Student',
      reason || 'Student withdrawal request',
      JSON.stringify({ participation_status: previousStatus }),
      JSON.stringify({ participation_status: 'WITHDRAWN' })
    ]);

    res.json({
      message: 'Participation status successfully updated to Withdrawn. Audit record preserved.',
      participation_status: 'WITHDRAWN'
    });
  } catch (err) {
    console.error('Error withdrawing participation:', err);
    res.status(500).json({ error: 'Failed to record withdrawal' });
  }
});

// ============================================================================
// 6. DELETE /api/my-achievements/:id — Strictly Prohibited for Students (403)
// ============================================================================
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const userRole = req.user.role;
    const partId = parseInt(req.params.id, 10);

    // MANDATORY REQUIREMENT: Students are strictly prohibited from deleting official history!
    if (userRole === 'STUDENT') {
      return res.status(403).json({
        error: 'Forbidden: Students are prohibited from deleting official participation records. You may mark your participation as Withdrawn or request an administrative correction.'
      });
    }

    // If an Admin or Super Admin initiates compliance removal:
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Administrative data action requires a mandatory documented reason.' });
    }

    const record = query.get('SELECT * FROM participation_records WHERE id = ?', [partId]);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    // Write audit trail before removal
    query.run(`
      INSERT INTO participation_audits (
        entity_type, entity_id, action, performed_by, performed_by_name,
        reason, previous_values
      ) VALUES ('PARTICIPATION_RECORD', ?, 'ADMIN_COMPLIANCE_ERASURE', ?, ?, ?, ?)
    `, [
      partId, req.user.id, req.user.full_name || 'Admin',
      reason, JSON.stringify(record)
    ]);

    query.run('DELETE FROM participation_records WHERE id = ?', [partId]);

    res.json({ message: 'Compliance removal executed with documented audit log.', partId });
  } catch (err) {
    console.error('Error handling delete:', err);
    res.status(500).json({ error: 'Data action failed' });
  }
});

// ============================================================================
// 7. PATCH /api/my-achievements/:id/admin-correct — Audited Administrative Correction
// ============================================================================
router.patch('/:id/admin-correct', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN', 'FACULTY'), (req, res) => {
  try {
    const partId = parseInt(req.params.id, 10);
    const { official_rank, participation_status, score, feedback, reason } = req.body || {};

    if (!reason) {
      return res.status(400).json({ error: 'A mandatory documented reason is required for administrative corrections.' });
    }

    const record = query.get('SELECT * FROM participation_records WHERE id = ?', [partId]);
    if (!record) return res.status(404).json({ error: 'Participation record not found' });

    const previousValues = {
      participation_status: record.participation_status
    };

    // Update status if provided
    if (participation_status) {
      query.run(`
        UPDATE participation_records
        SET participation_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [participation_status, partId]);
    }

    // If result update
    if (official_rank !== undefined || score !== undefined) {
      let existingResult = query.get('SELECT * FROM participation_results WHERE participation_id = ?', [partId]);
      if (existingResult) {
        previousValues.official_rank = existingResult.official_rank;
        previousValues.score = existingResult.score;

        query.run(`
          UPDATE participation_results
          SET official_rank = COALESCE(?, official_rank),
              score = COALESCE(?, score),
              feedback = COALESCE(?, feedback)
          WHERE participation_id = ?
        `, [
          official_rank !== undefined ? official_rank : null,
          score !== undefined ? score : null,
          feedback !== undefined ? feedback : null,
          partId
        ]);
      } else {
        const resType = official_rank === 1 ? 'WINNER'
          : official_rank === 2 ? 'RUNNER_UP'
          : official_rank === 3 ? 'SECOND_RUNNER_UP'
          : official_rank ? 'FINALIST'
          : 'PARTICIPANT';

        query.run(`
          INSERT INTO participation_results (
            participation_id, competition_id, round_name, result_type,
            official_rank, rank_category, score, score_max, feedback, verification_status
          ) VALUES (?, ?, 'Official Correction', ?, ?, ?, ?, 100, ?, 'VERIFIED')
        `, [
          partId, record.event_id || null, resType, official_rank,
          `Rank ${official_rank}`, score || null, feedback || 'Admin updated'
        ]);
      }
    }

    // Record Milestone
    query.run(`
      INSERT INTO participation_milestones (
        participation_id, milestone_type, previous_status, new_status,
        round_name, occurred_at, recorded_by, recorded_by_name, notes
      ) VALUES (?, 'ADMIN_CORRECTION', ?, ?, 'Administrative Correction', CURRENT_TIMESTAMP, ?, ?, ?)
    `, [
      partId, record.participation_status,
      participation_status || record.participation_status,
      req.user.id, req.user.full_name || 'Admin',
      `Administrative correction: ${reason}`
    ]);

    // Record Audit
    query.run(`
      INSERT INTO participation_audits (
        entity_type, entity_id, action, performed_by, performed_by_name,
        reason, previous_values, new_values
      ) VALUES ('PARTICIPATION_RECORD', ?, 'ADMIN_CORRECTION', ?, ?, ?, ?, ?)
    `, [
      partId, req.user.id, req.user.full_name || 'Admin',
      reason,
      JSON.stringify(previousValues),
      JSON.stringify({
        official_rank: official_rank !== undefined ? official_rank : null,
        participation_status: participation_status || null,
        score: score !== undefined ? score : null,
        feedback: feedback || null
      })
    ]);

    // Send notification to student
    query.run(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Participation Record Updated', 'An official correction was applied to your record for "' || ? || '". Reason: ' || ?, 'ACHIEVEMENT', '/my-achievements')
    `, [record.student_id, record.title, reason]);

    res.json({
      message: 'Administrative correction saved successfully with audit log.',
      record_id: partId
    });
  } catch (err) {
    console.error('Error applying admin correction:', err);
    res.status(500).json({ error: 'Failed to record administrative correction' });
  }
});

// ============================================================================
// 8. POST /api/my-achievements/:id/milestones — Organizer/Admin Progress Update
// ============================================================================
router.post('/:id/milestones', requireAuth, requireRole('ORGANIZER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    const partId = parseInt(req.params.id, 10);
    const { milestone_type, new_status, round_name, notes, evidence_url } = req.body;

    if (!milestone_type || !new_status) {
      return res.status(400).json({ error: 'Milestone type and new status are required' });
    }

    const record = query.get('SELECT * FROM participation_records WHERE id = ?', [partId]);
    if (!record) return res.status(404).json({ error: 'Participation record not found' });

    const prevStatus = record.participation_status;

    // Update participation status
    query.run(`
      UPDATE participation_records
      SET participation_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [new_status, partId]);

    // Insert milestone
    const mRes = query.run(`
      INSERT INTO participation_milestones (
        participation_id, milestone_type, previous_status, new_status,
        round_name, occurred_at, recorded_by, recorded_by_name, evidence_url, notes
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
    `, [
      partId, milestone_type, prevStatus, new_status,
      round_name || 'Competition Progress',
      req.user.id, req.user.full_name || 'Event Coordinator',
      evidence_url || null, notes || `Status advanced to ${new_status}`
    ]);

    // Send student notification
    query.run(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Milestone Achieved: ' || ?, 'You advanced to ' || ? || ' in \"' || ? || '\". Keep up the great work!', 'EVENT', '/my-achievements')
    `, [record.student_id, milestone_type, new_status, record.title]);

    res.status(201).json({
      message: 'Milestone added successfully',
      milestone_id: mRes.lastInsertRowid,
      new_status
    });
  } catch (err) {
    console.error('Error adding milestone:', err);
    res.status(500).json({ error: 'Failed to record milestone' });
  }
});

// ============================================================================
// 9. POST /api/my-achievements/:id/certificates — Associate Official Certificate
// ============================================================================
router.post('/:id/certificates', requireAuth, requireRole('ORGANIZER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    const partId = parseInt(req.params.id, 10);
    const { issuer, certificate_type, file_path, verification_url, credential_id } = req.body;

    if (!file_path || !certificate_type) {
      return res.status(400).json({ error: 'Certificate type and file path are required' });
    }

    const record = query.get('SELECT * FROM participation_records WHERE id = ?', [partId]);
    if (!record) return res.status(404).json({ error: 'Participation record not found' });

    const credId = credential_id || `AIT-CERT-${partId}-${Date.now().toString().slice(-5)}`;

    const cRes = query.run(`
      INSERT INTO participation_certificates (
        student_id, participation_id, issuer, certificate_type,
        credential_id, file_path, verification_url, issued_at, verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'VERIFIED')
    `, [
      record.student_id, partId, issuer || record.organizer,
      certificate_type, credId, file_path, verification_url || file_path
    ]);

    // Record milestone
    query.run(`
      INSERT INTO participation_milestones (
        participation_id, milestone_type, previous_status, new_status,
        round_name, occurred_at, recorded_by, recorded_by_name, notes
      ) VALUES (?, 'CERTIFICATE_ISSUED', ?, ?, 'Credentials Issuance', CURRENT_TIMESTAMP, ?, ?, ?)
    `, [
      partId, record.participation_status, record.participation_status,
      req.user.id, req.user.full_name || 'Organizer',
      `Official ${certificate_type} certificate issued (Credential ID: ${credId})`
    ]);

    // Send student notification
    query.run(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Official Certificate Issued! 📜', 'Your official certificate for \"' || ? || '\" is now available in My Achievements.', 'ACHIEVEMENT', '/my-achievements')
    `, [record.student_id, record.title]);

    res.status(201).json({
      message: 'Certificate issued and linked to participation record successfully',
      certificate_id: cRes.lastInsertRowid,
      credential_id: credId
    });
  } catch (err) {
    console.error('Error linking certificate:', err);
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
});

export default router;
