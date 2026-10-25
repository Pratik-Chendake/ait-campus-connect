import express from 'express';
import { query } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { generateSearchUrls } from '../services/verification/searchVerificationService.js';

const router = express.Router();

// GET all pending submissions for Faculty / Admin Verification Center
router.get('/pending', requireAuth, requireRole('FACULTY', 'ADMIN'), (req, res) => {
  try {
    // 1. Pending achievements
    const achievements = query.all(`
      SELECT a.*, u.full_name as student_name, u.student_id, u.email as student_email,
             u.branch, u.year, u.avatar_url as student_avatar
      FROM achievements a
      JOIN users u ON u.id = a.user_id
      WHERE a.verification_status = 'PENDING'
      ORDER BY a.created_at ASC
    `);

    // 2. Pending research papers
    const research = query.all(`
      SELECT rp.*, u.full_name as student_name, u.student_id, u.branch, u.year
      FROM research_papers rp
      JOIN users u ON u.id = rp.user_id
      WHERE rp.verification_status = 'PENDING'
      ORDER BY rp.created_at ASC
    `);

    // 3. Recently verified items (for audit review)
    const recentlyReviewed = query.all(`
      SELECT a.*, u.full_name as student_name, u.student_id, u.branch,
             v.full_name as verifier_name
      FROM achievements a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN users v ON v.id = a.verified_by
      WHERE a.verification_status IN ('VERIFIED', 'REJECTED')
      ORDER BY a.verified_at DESC
      LIMIT 15
    `);

    res.json({
      pending_achievements: achievements,
      pending_research: research,
      recently_reviewed: recentlyReviewed
    });
  } catch (err) {
    console.error('Error fetching verification queue:', err);
    res.status(500).json({ error: 'Failed to fetch verification queue' });
  }
});

// POST approve/verify achievement
router.post('/achievements/:id/approve', requireAuth, requireRole('FACULTY', 'ADMIN'), (req, res) => {
  try {
    const achId = parseInt(req.params.id, 10);
    const { points_override } = req.body;

    const achievement = query.get(`
      SELECT a.*, u.id as user_id, u.full_name, u.email
      FROM achievements a
      JOIN users u ON u.id = a.user_id
      WHERE a.id = ?
    `, [achId]);

    if (!achievement) return res.status(404).json({ error: 'Achievement not found' });

    // Determine points
    let points = points_override ? parseInt(points_override, 10) : 10;
    if (!points_override) {
      if (achievement.position.includes('Winner')) points = 30;
      else if (achievement.position.includes('Runner-up')) points = 20;
      else if (achievement.position.includes('Finalist')) points = 15;
      else if (achievement.category === 'Research') points = 30;
    }

    // Update achievement
    query.run(`
      UPDATE achievements SET
        verification_status = 'VERIFIED',
        verified_by = ?,
        verified_at = CURRENT_TIMESTAMP,
        points_awarded = ?,
        rejection_reason = NULL
      WHERE id = ?
    `, [req.user.id, points, achId]);

    // Update user score
    query.run('UPDATE users SET contribution_score = contribution_score + ? WHERE id = ?', [points, achievement.user_id]);

    // Create notification
    query.run(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Achievement Verified! ✓', 'Your achievement "' || ? || '" has been verified by ' || ? || '. +' || ? || ' points awarded!', 'VERIFICATION', '/student/' || ?)
    `, [achievement.user_id, achievement.title, req.user.full_name, points, achievement.user_id]);

    // Audit log
    query.run(`
      INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
      VALUES (?, 'VERIFY_ACHIEVEMENT', 'ACHIEVEMENT', ?, 'Verified achievement: ' || ? || ' for student ' || ?)
    `, [req.user.id, achId, achievement.title, achievement.full_name]);

    res.json({ message: 'Achievement verified successfully', points_awarded: points });
  } catch (err) {
    console.error('Error approving achievement:', err);
    res.status(500).json({ error: 'Failed to approve achievement' });
  }
});

// POST reject achievement
router.post('/achievements/:id/reject', requireAuth, requireRole('FACULTY', 'ADMIN'), (req, res) => {
  try {
    const achId = parseInt(req.params.id, 10);
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'A rejection reason is required to provide constructive feedback.' });
    }

    const achievement = query.get('SELECT * FROM achievements WHERE id = ?', [achId]);
    if (!achievement) return res.status(404).json({ error: 'Achievement not found' });

    query.run(`
      UPDATE achievements SET
        verification_status = 'REJECTED',
        verified_by = ?,
        verified_at = CURRENT_TIMESTAMP,
        rejection_reason = ?
      WHERE id = ?
    `, [req.user.id, reason, achId]);

    // Notify student with reason
    query.run(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Achievement Needs Correction', 'Your submission "' || ? || '" was not approved. Feedback: "' || ? || '". You can edit and resubmit.', 'VERIFICATION', '/achievements')
    `, [achievement.user_id, achievement.title, reason]);

    // Audit log
    query.run(`
      INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
      VALUES (?, 'REJECT_ACHIEVEMENT', 'ACHIEVEMENT', ?, 'Rejected achievement: ' || ? || '. Reason: ' || ?)
    `, [req.user.id, achId, achievement.title, reason]);

    res.json({ message: 'Submission marked as rejected with feedback provided.' });
  } catch (err) {
    console.error('Error rejecting achievement:', err);
    res.status(500).json({ error: 'Failed to reject achievement' });
  }
});

// POST approve research paper
router.post('/research/:id/approve', requireAuth, requireRole('FACULTY', 'ADMIN'), (req, res) => {
  try {
    const paperId = parseInt(req.params.id, 10);
    const paper = query.get('SELECT * FROM research_papers WHERE id = ?', [paperId]);
    if (!paper) return res.status(404).json({ error: 'Research paper not found' });

    query.run('UPDATE research_papers SET verification_status = "VERIFIED" WHERE id = ?', [paperId]);
    query.run('UPDATE users SET contribution_score = contribution_score + 30 WHERE id = ?', [paper.user_id]);

    query.run(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Research Paper Verified! 📄', 'Your publication "' || ? || '" has been verified by ' || ? || '. +30 points awarded.', 'VERIFICATION', '/student/' || ?)
    `, [paper.user_id, paper.title, req.user.full_name, paper.user_id]);

    res.json({ message: 'Research paper verified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify research paper' });
  }
});

// GET pre-formulated search links and cached search evidence for an achievement
router.get('/achievements/:id/search-evidence', requireAuth, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const achId = parseInt(req.params.id, 10);
    if (isNaN(achId)) {
      return res.status(400).json({ error: 'Invalid achievement ID' });
    }

    const achievement = query.get(`
      SELECT a.*, u.id as user_id, u.full_name as student_name, u.email as student_email,
             u.student_id, u.branch, u.year
      FROM achievements a
      JOIN users u ON u.id = a.user_id
      WHERE a.id = ?
    `, [achId]);

    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    const manualLinks = generateSearchUrls(achievement, {
      full_name: achievement.student_name,
      student_name: achievement.student_name
    });

    const cachedEvidenceRows = query.all(`
      SELECT * FROM achievement_search_evidence
      WHERE achievement_id = ?
      ORDER BY searched_at DESC
      LIMIT 10
    `, [achId]) || [];

    const cachedEvidence = cachedEvidenceRows.map(row => {
      let parsedSnippets = [];
      try {
        parsedSnippets = row.evidence_snippets ? JSON.parse(row.evidence_snippets) : [];
      } catch (err) {
        parsedSnippets = [];
      }
      return {
        id: row.id,
        achievement_id: row.achievement_id,
        search_engine: row.search_engine,
        query_used: row.query_used,
        results_count: row.results_count,
        evidence_snippets: parsedSnippets,
        searched_at: row.searched_at
      };
    });

    res.json({
      achievement_id: achId,
      achievement_title: achievement.title,
      student_name: achievement.student_name,
      manual_links: manualLinks,
      cached_evidence: cachedEvidence
    });
  } catch (err) {
    console.error('Error fetching search evidence:', err);
    res.status(500).json({ error: 'Failed to fetch search evidence' });
  }
});

export default router;
