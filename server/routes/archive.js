import express from 'express';
import { query } from '../db/database.js';
import { AY_2026_27_START } from '../utils/academicYear.js';

const router = express.Router();

// GET /api/archive - Dedicated Historical Archive for AY 2025-26 and older
router.get('/', (req, res) => {
  try {
    const { year, category, search } = req.query;

    let sql = `
      SELECT pea.*, c.name as club_name, c.slug as club_slug, c.instagram_handle, 'INSTITUTIONAL_REPORT' as record_origin
      FROM past_event_archives pea
      LEFT JOIN clubs c ON c.id = pea.organizing_club_id
      WHERE pea.is_public = 1
    `;
    const params = [];

    if (year && year !== 'All') {
      sql += ' AND pea.academic_year = ?';
      params.push(year);
    }

    if (category && category !== 'All') {
      sql += ' AND pea.type LIKE ?';
      params.push(`%${category}%`);
    }

    if (search) {
      sql += ' AND (pea.event_name LIKE ? OR pea.description LIKE ? OR pea.source_file LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY pea.start_date DESC';

    const reportArchives = query.all(sql, params);

    // Also include past-year events from events table (AY 2025-26 or earlier)
    let pastEventSql = `
      SELECT e.id, e.slug as source_key, e.title as event_name, e.category as type,
             e.academic_year, e.club_id as organizing_club_id, e.event_start_date as start_date,
             e.event_end_date as end_date, e.description,
             'Past Campus Archive' as source_file, 'N/A' as source_pages,
             null as evidence_kind, 'historical_campus_event' as verification_status,
             1 as is_public, e.result_summary as notes, e.created_at,
             c.name as club_name, c.slug as club_slug, c.instagram_handle,
             'PAST_CAMPUS_EVENT' as record_origin
      FROM events e
      LEFT JOIN clubs c ON c.id = e.club_id
      WHERE (e.is_archive = 1 OR e.event_start_date < ?)
    `;
    const pastParams = [AY_2026_27_START];

    if (year && year !== 'All') {
      pastEventSql += ' AND e.academic_year = ?';
      pastParams.push(year);
    }
    if (category && category !== 'All') {
      pastEventSql += ' AND e.category LIKE ?';
      pastParams.push(`%${category}%`);
    }
    if (search) {
      pastEventSql += ' AND (e.title LIKE ? OR e.description LIKE ?)';
      pastParams.push(`%${search}%`, `%${search}%`);
    }

    pastEventSql += ' ORDER BY e.event_start_date DESC';
    const pastEvents = query.all(pastEventSql, pastParams);

    const archives = [...reportArchives, ...pastEvents];

    // Distinct academic years available in archive
    const years = ['2025-26'];

    res.json({
      archives,
      years,
      total: archives.length
    });
  } catch (err) {
    console.error('Error fetching historical archives:', err);
    res.status(500).json({ error: 'Failed to fetch historical archives' });
  }
});

// GET /api/archive/:id
router.get('/:id', (req, res) => {
  try {
    const record = query.get(`
      SELECT pea.*, c.name as club_name, c.slug as club_slug, c.instagram_handle
      FROM past_event_archives pea
      LEFT JOIN clubs c ON c.id = pea.organizing_club_id
      WHERE pea.id = ?
    `, [req.params.id]);

    if (!record) {
      return res.status(404).json({ error: 'Archive record not found' });
    }

    res.json({ archive: record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch archive record' });
  }
});

export default router;
