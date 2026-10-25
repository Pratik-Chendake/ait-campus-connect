import express from 'express';
import { query } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET achievements list
router.get('/', (req, res) => {
  try {
    const { user_id, category, level, status, verified_only } = req.query;

    let sql = `
      SELECT a.*, u.full_name as student_name, u.student_id, u.avatar_url as student_avatar,
             u.branch, u.year, v.full_name as verifier_name
      FROM achievements a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN users v ON v.id = a.verified_by
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      sql += ' AND a.user_id = ?';
      params.push(user_id);
    }

    if (category && category !== 'All') {
      sql += ' AND a.category = ?';
      params.push(category);
    }

    if (level && level !== 'All') {
      sql += ' AND a.level = ?';
      params.push(level);
    }

    if (status && status !== 'All') {
      sql += ' AND a.verification_status = ?';
      params.push(status);
    }

    if (verified_only === 'true' || verified_only === '1') {
      sql += " AND a.verification_status = 'VERIFIED'";
    }

    sql += ' ORDER BY a.is_highlight DESC, a.date DESC, a.id DESC';

    const achievements = query.all(sql, params);
    res.json({ achievements });
  } catch (err) {
    console.error('Error fetching achievements:', err);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// POST submit new achievement
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      title, event_name, organization, category, level, position,
      date, description, certificate_url, proof_doc_url
    } = req.body;

    if (!title || !event_name || !organization || !category || !level || !position || !date) {
      return res.status(400).json({ error: 'All major achievement fields are required' });
    }

    const result = query.run(`
      INSERT INTO achievements (
        user_id, event_id, title, event_name, organization, category,
        level, position, date, description, certificate_url, proof_doc_url,
        verification_status, points_awarded
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0)
    `, [
      req.user.id, title, event_name, organization, category, level, position,
      date, description || null, certificate_url || null, proof_doc_url || null
    ]);

    // Also mirror to permanent student participation records
    try {
      const partStatus = position.includes('Winner') ? 'WINNER' :
                         position.includes('Runner-up') ? 'RUNNER_UP' :
                         position.includes('Finalist') ? 'FINALIST' :
                         position.includes('Participant') ? 'PARTICIPATED' : 'PARTICIPATED';
      const regId = `SELF-VERIFY-${Date.now().toString().slice(-4)}`;
      query.run(`
        INSERT INTO participation_records (
          student_id, event_id, event_type, title, organizer, category,
          mode, event_date, registration_id, registration_status, participation_status,
          source_type, verification_status, project_title, is_in_portfolio
        ) VALUES (?, NULL, 'CAMPUS_EVENT', ?, ?, ?, 'In-Person', ?, ?, 'CONFIRMED', ?, 'SELF_REPORTED', 'PENDING_VERIFICATION', ?, 1)
      `, [
        req.user.id, title, organization, category,
        date, regId, partStatus, description ? description.slice(0, 100) : null
      ]);
    } catch (e) {
      // Safe fallback if participation_records table schema differs
    }

    // Notify faculty verifiers that a submission was received
    const facultyList = query.all("SELECT id FROM users WHERE role = 'FACULTY' OR role = 'ADMIN'");
    facultyList.forEach(fac => {
      query.run(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'New Achievement Submission', ? || ' submitted an achievement: "' || ? || '" for verification.', 'VERIFICATION', '/verification')
      `, [fac.id, req.user.full_name, title]);
    });

    res.status(201).json({
      message: 'Achievement submitted for verification. Faculty will review it shortly.',
      id: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error adding achievement:', err);
    res.status(500).json({ error: 'Failed to submit achievement' });
  }
});

// GET certificate vault
router.get('/vault/my', requireAuth, (req, res) => {
  try {
    const certs = query.all(`
      SELECT * FROM certificates
      WHERE user_id = ?
      ORDER BY issue_date DESC, id DESC
    `, [req.user.id]);

    res.json({ certificates: certs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch certificate vault' });
  }
});

// POST add certificate to vault
router.post('/vault', requireAuth, (req, res) => {
  try {
    const { name, issuer, issue_date, credential_id, file_url, category, is_public } = req.body;

    if (!name || !issuer || !file_url) {
      return res.status(400).json({ error: 'Certificate name, issuer, and file are required' });
    }

    const result = query.run(`
      INSERT INTO certificates (user_id, name, issuer, issue_date, credential_id, file_url, category, is_public, verification_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED')
    `, [
      req.user.id, name, issuer, issue_date || '2026-01-01',
      credential_id || null, file_url, category || 'Participation',
      is_public ? 1 : 0 // Private by default per requirement!
    ]);

    res.status(201).json({ message: 'Certificate secured in vault', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add certificate' });
  }
});

// PATCH toggle certificate visibility (Public vs Private)
router.patch('/vault/:id/visibility', requireAuth, (req, res) => {
  try {
    const certId = parseInt(req.params.id, 10);
    const cert = query.get('SELECT * FROM certificates WHERE id = ?', [certId]);
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    if (cert.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    const newVisibility = cert.is_public ? 0 : 1;
    query.run('UPDATE certificates SET is_public = ? WHERE id = ?', [newVisibility, certId]);

    res.json({
      message: newVisibility ? 'Certificate is now visible on your public portfolio' : 'Certificate is now private in your vault',
      is_public: newVisibility
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update certificate visibility' });
  }
});

export default router;
