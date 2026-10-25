import express from 'express';
import { query } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all research papers (public or filtered)
router.get('/', (req, res) => {
  try {
    const { is_ieee, area, search } = req.query;
    let sql = `
      SELECT rp.*, u.full_name as student_name, u.student_id, u.branch, u.year, u.avatar_url as student_avatar
      FROM research_papers rp
      JOIN users u ON u.id = rp.user_id
      WHERE 1=1
    `;
    const params = [];

    if (is_ieee === 'true' || is_ieee === '1') {
      sql += ' AND rp.is_ieee = 1';
    }

    if (area && area !== 'All') {
      sql += ' AND rp.research_area LIKE ?';
      params.push(`%${area}%`);
    }

    if (search) {
      sql += ' AND (rp.title LIKE ? OR rp.authors LIKE ? OR rp.conference_or_journal LIKE ? OR rp.abstract LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY rp.publication_date DESC';
    const papers = query.all(sql, params);
    res.json({ papers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch research papers' });
  }
});

// POST submit research paper
router.post('/', requireAuth, (req, res) => {
  try {
    const { title, authors, research_area, conference_or_journal, is_ieee, status, publication_date, doi, url, abstract, pdf_url } = req.body;
    if (!title || !authors || !conference_or_journal) {
      return res.status(400).json({ error: 'Title, authors, and conference/journal name are required' });
    }

    const result = query.run(`
      INSERT INTO research_papers (user_id, title, authors, research_area, conference_or_journal, is_ieee, status, publication_date, doi, url, abstract, pdf_url, verification_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `, [
      req.user.id, title, authors, research_area || 'Computer Science & Engineering',
      conference_or_journal, is_ieee ? 1 : 0, status || 'PUBLISHED',
      publication_date || '2026-01-01', doi || null, url || null,
      abstract || null, pdf_url || null
    ]);

    // Notify faculty verifiers
    const faculty = query.all("SELECT id FROM users WHERE role = 'FACULTY'");
    faculty.forEach(f => {
      query.run(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'New Research Paper Submitted', ? || ' submitted a research publication: "' || ? || '" for verification.', 'VERIFICATION', '/verification')
      `, [f.id, req.user.full_name, title]);
    });

    res.status(201).json({ message: 'Research paper submitted for review', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit research paper' });
  }
});

export default router;
