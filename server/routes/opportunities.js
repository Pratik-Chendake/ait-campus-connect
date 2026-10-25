import express from 'express';
import { query } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { executeUnstopSync } from '../services/opportunities/opportunitySyncService.js';
import { getLatestSyncRun } from '../services/opportunities/opportunityRepository.js';

const router = express.Router();

// GET /api/opportunities - Advanced Search, Filtering, Sorting & Pagination
router.get('/', (req, res) => {
  try {
    const {
      type,
      source,
      search,
      eligibility,
      mode,
      fee,
      sort = 'deadline', // 'deadline', 'recent', 'prize', 'title'
      page = 1,
      limit = 24
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));
    const offset = (pageNum - 1) * limitNum;

    let sql = `
      SELECT o.*, c.name as club_name, c.slug as club_slug, c.instagram_handle
      FROM opportunities o
      LEFT JOIN clubs c ON c.id = o.club_id
      WHERE o.is_active = 1
    `;
    const params = [];

    // Filter: Sourcing (UNSTOP, CAMPUS, OPEN_SOURCE)
    if (source && source.toUpperCase() !== 'ALL') {
      const srcUpper = source.toUpperCase();
      if (srcUpper === 'UNSTOP') {
        sql += " AND o.source = 'UNSTOP'";
      } else if (srcUpper === 'CAMPUS') {
        sql += " AND (o.source = 'CAMPUS' OR o.source IS NULL OR o.source = 'INTERNAL')";
      } else if (srcUpper === 'OPEN_SOURCE') {
        sql += " AND (o.source = 'OPEN_SOURCE' OR o.opportunity_type = 'OPEN_SOURCE_CONTRIBUTION')";
      } else {
        sql += ' AND o.source = ?';
        params.push(source);
      }
    }

    // Filter: Opportunity Type
    if (type && type !== 'All') {
      if (type.toLowerCase() === 'hackathon' || type.toLowerCase() === 'hackathons') {
        sql += " AND (o.opportunity_type LIKE '%hackathon%' OR o.opportunity_type = 'HACKATHON')";
      } else if (type === 'OPEN_SOURCE_CONTRIBUTION') {
        sql += " AND o.opportunity_type = 'OPEN_SOURCE_CONTRIBUTION'";
      } else {
        sql += ' AND o.opportunity_type LIKE ?';
        params.push(`%${type}%`);
      }
    }

    // Filter: Search query
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (o.title LIKE ? OR o.organizer LIKE ? OR o.required_skills LIKE ? OR o.description LIKE ? OR o.domains LIKE ?)';
      params.push(term, term, term, term, term);
    }

    // Filter: AIT Pune Eligibility
    if (eligibility && eligibility !== 'All') {
      sql += ' AND o.eligibility_category = ?';
      params.push(eligibility);
    }

    // Filter: Mode (Online, In-Person, Hybrid)
    if (mode && mode !== 'All') {
      sql += ' AND (o.mode = ? OR o.location_or_mode = ?)';
      params.push(mode, mode);
    }

    // Filter: Registration Fee
    if (fee && fee !== 'All') {
      if (fee.toLowerCase() === 'free') {
        sql += " AND (o.registration_fee = 'Free' OR o.registration_fee IS NULL)";
      } else if (fee.toLowerCase() === 'paid') {
        sql += " AND o.registration_fee = 'Paid Entry'";
      }
    }

    // Sorting Logic
    // Default: Earliest registration deadline first (putting verified upcoming deadlines on top)
    if (sort === 'deadline') {
      sql += `
        ORDER BY
          CASE
            WHEN o.apply_deadline IS NOT NULL AND o.apply_deadline >= date('now') THEN 1
            WHEN o.apply_deadline IS NOT NULL AND o.apply_deadline < date('now') THEN 3
            ELSE 2
          END ASC,
          o.apply_deadline ASC,
          o.id DESC
      `;
    } else if (sort === 'recent') {
      sql += ' ORDER BY o.id DESC';
    } else if (sort === 'title') {
      sql += ' ORDER BY o.title ASC';
    } else {
      sql += ' ORDER BY o.id DESC';
    }

    // Get total count matching filters
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const totalCountRow = query.get(countSql, params);
    const total = totalCountRow ? totalCountRow.total : 0;

    // Apply pagination
    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const rows = query.all(sql, params);

    // Format fields (parse JSON / strings)
    const formattedOpportunities = rows.map(r => {
      let skillsArray = [];
      try {
        skillsArray = r.required_skills ? r.required_skills.split(',').map(s => s.trim()).filter(Boolean) : [];
      } catch (e) {}

      let domainsArray = [];
      try {
        domainsArray = r.domains ? r.domains.split(',').map(d => d.trim()).filter(Boolean) : [];
      } catch (e) {}

      return {
        ...r,
        skills_required: skillsArray,
        domains: domainsArray
      };
    });

    // Counts for UI filters
    const counts = {
      all: query.get('SELECT COUNT(*) as c FROM opportunities WHERE is_active = 1')?.c || 0,
      unstop: query.get("SELECT COUNT(*) as c FROM opportunities WHERE is_active = 1 AND source = 'UNSTOP'")?.c || 0,
      campus: query.get("SELECT COUNT(*) as c FROM opportunities WHERE is_active = 1 AND (source = 'CAMPUS' OR source IS NULL)")?.c || 0,
      open_source: query.get("SELECT COUNT(*) as c FROM opportunities WHERE is_active = 1 AND (source = 'OPEN_SOURCE' OR opportunity_type = 'OPEN_SOURCE_CONTRIBUTION')")?.c || 0,
      hackathons: query.get("SELECT COUNT(*) as c FROM opportunities WHERE is_active = 1 AND (opportunity_type LIKE '%hackathon%' OR opportunity_type = 'HACKATHON')")?.c || 0,
      internships: query.get('SELECT COUNT(*) as c FROM internships WHERE is_active = 1')?.c || 0,
      scholarships: query.get('SELECT COUNT(*) as c FROM scholarships WHERE is_active = 1')?.c || 0
    };

    const latestSync = getLatestSyncRun();

    res.json({
      opportunities: formattedOpportunities,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      },
      counts,
      latest_sync: latestSync
    });
  } catch (err) {
    console.error('Error fetching opportunities:', err);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// GET /api/opportunities/sync-status - Integration Health & Telemetry
router.get('/sync-status', (req, res) => {
  try {
    const latestSync = getLatestSyncRun();
    const totalCount = query.get('SELECT COUNT(*) as c FROM opportunities WHERE is_active = 1')?.c || 0;
    const unstopCount = query.get("SELECT COUNT(*) as c FROM opportunities WHERE is_active = 1 AND source = 'UNSTOP'")?.c || 0;
    const verifiedEligible = query.get("SELECT COUNT(*) as c FROM opportunities WHERE is_active = 1 AND eligibility_category = 'ELIGIBLE'")?.c || 0;

    res.json({
      status: latestSync ? latestSync.status : 'IDLE',
      latest_sync: latestSync,
      metrics: {
        total_opportunities: totalCount,
        unstop_scraped: unstopCount,
        verified_eligible_ait: verifiedEligible
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

// POST /api/opportunities/sync - Manual or Cron Trigger (Protected)
router.post('/sync', async (req, res) => {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    const expectedSecret = process.env.CRON_SECRET || 'ait_unstop_sync_secret_2026_aitpune';

    // Allow if caller provides valid cron secret or is authenticated admin
    let isAuthorized = false;
    if (cronSecret && cronSecret === expectedSecret) {
      isAuthorized = true;
    } else if (req.headers.authorization) {
      // Check JWT token
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'ait-super-secure-jwt-key-2026');
        if (decoded && (decoded.role === 'ADMIN' || decoded.role === 'ORGANIZER')) {
          isAuthorized = true;
        }
      } catch (e) {}
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Unauthorized: Admin privileges or valid CRON_SECRET required to trigger synchronization.' });
    }

    const maxItems = req.body?.maxItems ? parseInt(req.body.maxItems, 10) : 50;
    const forceFresh = Boolean(req.body?.forceFresh);

    const result = await executeUnstopSync({
      maxItems,
      reuseRecentDataset: !forceFresh,
      triggeredBy: req.body?.triggeredBy || 'ADMIN_DASHBOARD'
    });

    res.json({
      message: 'Unstop synchronization completed successfully',
      success: true,
      itemsProcessed: (result?.insertedRecords ?? 0) + (result?.updatedRecords ?? 0) || result?.totalFetched || 50,
      result
    });
  } catch (err) {
    console.error('Opportunity sync endpoint error:', err);
    res.status(500).json({ error: err.message || 'Synchronization failed' });
  }
});

// GET /api/opportunities/my/saved - Authenticated Student Saved Opportunities
router.get('/my/saved', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const saved = query.all(`
      SELECT so.id as bookmark_id, so.status as tracking_status, so.notes, so.created_at as saved_at,
             o.*
      FROM saved_opportunities so
      JOIN opportunities o ON o.unstop_id = so.opportunity_id OR CAST(o.id AS TEXT) = so.opportunity_id
      WHERE so.user_id = ?
      ORDER BY so.created_at DESC
    `, [userId]);

    res.json({ saved });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved opportunities' });
  }
});

// POST /api/opportunities/:id/save - Bookmark or Track Opportunity (Authenticated)
router.post('/:id/save', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const opportunityId = String(req.params.id);
    const { status = 'SAVED', notes = '' } = req.body;

    const opp = query.get('SELECT id, unstop_id, title FROM opportunities WHERE id = ? OR unstop_id = ?', [opportunityId, opportunityId]);
    if (!opp) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const stableId = opp.unstop_id || String(opp.id);

    // Upsert bookmark in saved_opportunities
    query.run(`
      INSERT INTO saved_opportunities (user_id, opportunity_id, status, notes)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, opportunity_id) DO UPDATE SET
        status = excluded.status,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, stableId, status, notes]);

    // Also sync to saved_items for global /api/saved library consistency
    const existingSavedItem = query.get('SELECT id FROM saved_items WHERE user_id = ? AND item_type = ? AND item_id = ?', [userId, 'OPPORTUNITY', stableId]);
    if (!existingSavedItem) {
      query.run('INSERT INTO saved_items (user_id, item_type, item_id) VALUES (?, ?, ?)', [userId, 'OPPORTUNITY', stableId]);
    }

    res.json({
      message: 'Opportunity saved to your dashboard',
      saved: true,
      status,
      opportunity_id: stableId
    });
  } catch (err) {
    console.error('Error saving opportunity:', err);
    res.status(500).json({ error: 'Failed to save opportunity' });
  }
});

// DELETE /api/opportunities/:id/save - Remove Bookmark
router.delete('/:id/save', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const opportunityId = String(req.params.id);

    query.run(`
      DELETE FROM saved_opportunities
      WHERE user_id = ? AND (opportunity_id = ? OR opportunity_id IN (SELECT unstop_id FROM opportunities WHERE id = ?))
    `, [userId, opportunityId, opportunityId]);

    query.run(`
      DELETE FROM saved_items
      WHERE user_id = ? AND item_type = 'OPPORTUNITY' AND (item_id = ? OR item_id IN (SELECT unstop_id FROM opportunities WHERE id = ?))
    `, [userId, opportunityId, opportunityId]);

    res.json({ message: 'Opportunity removed from saved list', saved: false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove saved opportunity' });
  }
});

// GET /api/opportunities/:id - Single Opportunity Details
router.get('/:id', (req, res) => {
  try {
    const idParam = req.params.id;
    const opp = query.get(`
      SELECT o.*, c.name as club_name, c.slug as club_slug, c.instagram_handle
      FROM opportunities o
      LEFT JOIN clubs c ON c.id = o.club_id
      WHERE o.id = ? OR o.unstop_id = ? OR o.source_key = ?
    `, [idParam, idParam, idParam]);

    if (!opp) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Parse JSON fields
    let rawData = {};
    try { rawData = opp.raw_data ? JSON.parse(opp.raw_data) : {}; } catch (e) {}

    let prizeDetails = [];
    try { prizeDetails = opp.prize_details ? JSON.parse(opp.prize_details) : []; } catch (e) {}

    let rounds = [];
    try { rounds = opp.rounds ? JSON.parse(opp.rounds) : []; } catch (e) {}

    let skillsArray = opp.required_skills ? opp.required_skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    let domainsArray = opp.domains ? opp.domains.split(',').map(d => d.trim()).filter(Boolean) : [];

    // Check if current user saved this opportunity
    let isSaved = false;
    let savedStatus = null;
    if (req.user) {
      const savedRow = query.get('SELECT status FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?', [req.user.id, opp.unstop_id || String(opp.id)]);
      if (savedRow) {
        isSaved = true;
        savedStatus = savedRow.status;
      }
    }

    res.json({
      opportunity: {
        ...opp,
        skills_required: skillsArray,
        domains: domainsArray,
        prize_details: prizeDetails,
        rounds,
        raw_data: rawData,
        is_saved: isSaved,
        saved_status: savedStatus
      }
    });
  } catch (err) {
    console.error('Error fetching opportunity detail:', err);
    res.status(500).json({ error: 'Failed to fetch opportunity details' });
  }
});

export default router;
