import express from 'express';
import { query } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all saved items for current user
router.get('/', requireAuth, (req, res) => {
  try {
    const saved = query.all(`
      SELECT * FROM saved_items
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);

    // Enhance saved items with actual entities
    const enhanced = saved.map(item => {
      let entity = null;
      if (item.item_type === 'EVENT' || item.item_type === 'HACKATHON') {
        entity = query.get('SELECT id, title, category, event_start_date, registration_deadline, banner_url, venue, mode FROM events WHERE id = ?', [item.item_id]);
      } else if (item.item_type === 'OPPORTUNITY') {
        entity = query.get('SELECT id, unstop_id, title, organizer, mode, prize_pool, apply_deadline as deadline, banner_url, official_url FROM opportunities WHERE id = ? OR unstop_id = ?', [item.item_id, item.item_id]);
      } else if (item.item_type === 'INTERNSHIP') {
        entity = query.get('SELECT id, title, company, role, stipend, mode, deadline FROM internships WHERE id = ?', [item.item_id]);
      } else if (item.item_type === 'SCHOLARSHIP') {
        entity = query.get('SELECT id, name, provider, amount, deadline FROM scholarships WHERE id = ?', [item.item_id]);
      } else if (item.item_type === 'CLUB') {
        entity = query.get('SELECT id, name, slug, category, logo_url FROM clubs WHERE id = ?', [item.item_id]);
      }
      return {
        ...item,
        data: entity
      };
    }).filter(i => i.data !== null);

    res.json({ saved_items: enhanced });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved items' });
  }
});

// POST toggle saved item
router.post('/toggle', requireAuth, (req, res) => {
  try {
    const { item_type, item_id } = req.body;
    if (!item_type || !item_id) {
      return res.status(400).json({ error: 'item_type and item_id are required' });
    }

    const existing = query.get('SELECT id FROM saved_items WHERE user_id = ? AND item_type = ? AND item_id = ?', [req.user.id, item_type, item_id]);
    if (existing) {
      query.run('DELETE FROM saved_items WHERE id = ?', [existing.id]);
      return res.json({ saved: false, message: 'Item removed from saved' });
    } else {
      query.run('INSERT INTO saved_items (user_id, item_type, item_id) VALUES (?, ?, ?)', [req.user.id, item_type, item_id]);
      return res.json({ saved: true, message: 'Item saved to your library' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle saved item' });
  }
});

export default router;
