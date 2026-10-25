import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

// GET Leaderboard
router.get('/', (req, res) => {
  try {
    const { branch, year, category } = req.query;

    let sql = `
      SELECT u.id, u.full_name, u.student_id, u.avatar_url, u.branch, u.year,
             u.contribution_score,
             (SELECT COUNT(*) FROM achievements WHERE user_id = u.id AND verification_status = 'VERIFIED') as verified_achievements_count,
             (SELECT COUNT(*) FROM achievements WHERE user_id = u.id AND verification_status = 'VERIFIED' AND position LIKE '%Winner%') as wins_count,
             (SELECT COUNT(*) FROM research_papers WHERE user_id = u.id) as research_count
      FROM users u
      WHERE u.role = 'STUDENT'
    `;
    const params = [];

    if (branch && branch !== 'All') {
      sql += ' AND u.branch = ?';
      params.push(branch);
    }

    if (year && year !== 'All') {
      sql += ' AND u.year = ?';
      params.push(parseInt(year, 10));
    }

    sql += ' ORDER BY u.contribution_score DESC, verified_achievements_count DESC LIMIT 50';

    const rankedStudents = query.all(sql, params);

    // Attach rank
    const leaderboard = rankedStudents.map((student, idx) => ({
      rank: idx + 1,
      ...student
    }));

    res.json({ leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET Hall of Fame
router.get('/hall-of-fame', (req, res) => {
  try {
    const { category } = req.query;

    let sql = `
      SELECT a.*, u.full_name as student_name, u.avatar_url as student_avatar,
             u.student_id, u.branch, u.year
      FROM achievements a
      JOIN users u ON u.id = a.user_id
      WHERE a.verification_status = 'VERIFIED'
        AND (a.level IN ('National', 'International', 'University') OR a.position LIKE '%Winner%')
    `;
    const params = [];

    if (category && category !== 'All') {
      sql += ' AND a.category = ?';
      params.push(category);
    }

    sql += ' ORDER BY a.is_highlight DESC, a.date DESC LIMIT 30';

    const honorees = query.all(sql, params);
    res.json({ hall_of_fame: honorees });
  } catch (err) {
    console.error('Hall of Fame error:', err);
    res.status(500).json({ error: 'Failed to fetch Hall of Fame' });
  }
});

export default router;
