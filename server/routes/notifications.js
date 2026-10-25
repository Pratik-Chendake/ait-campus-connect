import express from 'express';
import { query } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET notifications for current user
router.get('/', requireAuth, (req, res) => {
  try {
    const notifs = query.all(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [req.user.id]);

    const unreadCount = query.get('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);

    res.json({
      notifications: notifs,
      unread_count: unreadCount ? unreadCount.count : 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH mark single notification as read
router.patch('/:id/read', requireAuth, (req, res) => {
  try {
    query.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST mark all as read
router.post('/read-all', requireAuth, (req, res) => {
  try {
    query.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
});

export default router;
