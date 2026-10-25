import express from 'express';
import { query } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { evaluateScholarshipEligibility } from '../services/scholarships/scholarshipEligibility.js';
import { INDIAN_STATES_AND_UTS } from '../services/scholarships/indianStatesData.js';

const router = express.Router();

// Helper to determine status based on application_close_at
function computeStatus(closeAt, declaredStatus) {
  if (!closeAt) return declaredStatus || 'OPEN';
  const now = new Date('2026-10-24T00:00:00Z'); // Current local anchor date
  const deadline = new Date(`${closeAt}T00:00:00Z`);
  const diffDays = Math.round((deadline - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'CLOSED';
  if (diffDays <= 7) return 'CLOSING_SOON';
  return 'OPEN';
}

// =============================================================================
// GET /api/scholarships/stats — Dynamic High-Level Scholarship Telemetry
// =============================================================================
router.get('/stats', (req, res) => {
  try {
    const totalVerified = query.get("SELECT COUNT(*) as c FROM scholarships WHERE is_active = 1 AND verification_status = 'VERIFIED'")?.c || 0;
    const currentlyOpen = query.get("SELECT COUNT(*) as c FROM scholarships WHERE is_active = 1 AND (application_close_at >= '2026-10-24' OR application_close_at IS NULL)")?.c || 0;
    const closingSoon = query.get("SELECT COUNT(*) as c FROM scholarships WHERE is_active = 1 AND application_close_at >= '2026-10-24' AND application_close_at <= '2026-10-31'")?.c || 0;
    const centralCount = query.get("SELECT COUNT(*) as c FROM scholarships WHERE is_active = 1 AND category = 'CENTRAL'")?.c || 0;
    const defenceCount = query.get("SELECT COUNT(*) as c FROM scholarships WHERE is_active = 1 AND (category = 'DEFENCE' OR category = 'POLICE_CAPF')")?.c || 0;
    const stateCount = query.get("SELECT COUNT(*) as c FROM scholarships WHERE is_active = 1 AND category = 'STATE'")?.c || 0;
    const corporateCount = query.get("SELECT COUNT(*) as c FROM scholarships WHERE is_active = 1 AND category = 'PRIVATE_CORPORATE'")?.c || 0;
    const aitCount = query.get("SELECT COUNT(*) as c FROM scholarships WHERE is_active = 1 AND category = 'AIT_EXCLUSIVE'")?.c || 0;

    const statsObj = {
      total_verified: totalVerified,
      currently_open: currentlyOpen,
      closing_soon: closingSoon,
      central_count: centralCount,
      defence_count: defenceCount,
      state_count: stateCount,
      corporate_count: corporateCount,
      ait_count: aitCount
    };

    res.json({
      ...statsObj,
      stats: statsObj
    });
  } catch (err) {
    console.error('Error fetching scholarship stats:', err);
    res.status(500).json({ error: 'Failed to retrieve scholarship statistics' });
  }
});

// =============================================================================
// GET /api/scholarships/states — 28 States & 8 UTs Directory & Compatibility
// =============================================================================
router.get('/states', (req, res) => {
  try {
    const stateCounts = query.all(`
      SELECT applicable_states, COUNT(*) as count
      FROM scholarships
      WHERE is_active = 1 AND category = 'STATE'
      GROUP BY applicable_states
    `);

    const countMap = {};
    for (const row of stateCounts) {
      if (row.applicable_states) {
        const parts = row.applicable_states.split(',').map(s => s.trim().toUpperCase());
        for (const p of parts) {
          countMap[p] = (countMap[p] || 0) + row.count;
        }
      }
    }

    const enhancedStates = INDIAN_STATES_AND_UTS.map(st => ({
      ...st,
      verified_scholarships_count: countMap[st.code] || 0,
      central_eligible_count: 8 // Central sector NSP schemes valid in all states
    }));

    res.json({ states: enhancedStates });
  } catch (err) {
    console.error('Error fetching states explorer:', err);
    res.status(500).json({ error: 'Failed to retrieve state scholarship data' });
  }
});

// =============================================================================
// GET /api/scholarships/calendar — Urgency & Deadline Matrix
// =============================================================================
router.get('/calendar', (req, res) => {
  try {
    const scholarships = query.all(`
      SELECT id, slug, COALESCE(title, name) as title, provider, category, amount_display,
             application_close_at, institute_verification_deadline, official_application_url,
             status, verification_status
      FROM scholarships
      WHERE is_active = 1
      ORDER BY application_close_at ASC
    `);

    const now = new Date('2026-10-24T00:00:00Z');
    const thisWeek = [];
    const thisMonth = [];
    const upcoming = [];
    const closed = [];

    for (const s of scholarships) {
      const closeDate = s.application_close_at ? new Date(`${s.application_close_at}T00:00:00Z`) : null;
      if (!closeDate) {
        upcoming.push({ ...s, days_remaining: null, computed_status: 'OPEN' });
        continue;
      }

      const diffDays = Math.round((closeDate - now) / (1000 * 60 * 60 * 24));
      const computedStatus = diffDays < 0 ? 'CLOSED' : diffDays <= 7 ? 'CLOSING_SOON' : 'OPEN';
      const item = { ...s, days_remaining: diffDays, computed_status: computedStatus };

      if (diffDays < 0) {
        closed.push(item);
      } else if (diffDays <= 7) {
        thisWeek.push(item);
      } else if (diffDays <= 30) {
        thisMonth.push(item);
      } else {
        upcoming.push(item);
      }
    }

    res.json({
      this_week: thisWeek,
      this_month: thisMonth,
      upcoming: upcoming,
      closed: closed,
      calendar: {
        this_week: thisWeek,
        this_month: thisMonth,
        upcoming: upcoming,
        closed: closed
      }
    });
  } catch (err) {
    console.error('Error fetching scholarship calendar:', err);
    res.status(500).json({ error: 'Failed to retrieve scholarship calendar' });
  }
});

// =============================================================================
// GET /api/scholarships — Searchable & Filterable Scholarship Catalog
// =============================================================================
router.get('/', (req, res) => {
  try {
    const {
      search,
      category,
      state,
      branch,
      year,
      gender,
      income,
      social_category,
      defence_category,
      urgency,
      status: reqStatus,
      sort = 'closing_soon'
    } = req.query;

    let sql = `
      SELECT id, slug, COALESCE(title, name) as title, provider, category, subcategory, academic_year,
             description, benefits_summary, amount_min, amount_max, amount_display,
             education_level, eligible_branches, eligible_years, min_percentage, max_income,
             applicable_states, outside_state_study_allowed, gender_restriction,
             category_restriction, defence_category, application_type,
             application_open_at, application_close_at, institute_verification_deadline,
             official_application_url, COALESCE(official_guideline_url, apply_url) as guideline_url,
             who_can_apply, status, verification_status, last_verified_at, is_featured
      FROM scholarships
      WHERE is_active = 1
    `;
    const params = [];

    // Category Filter
    if (category && category !== 'ALL') {
      if (category === 'DEFENCE_ALL') {
        sql += " AND (category = 'DEFENCE' OR category = 'POLICE_CAPF')";
      } else {
        sql += ' AND category = ?';
        params.push(category);
      }
    }

    // State Domicile Filter
    if (state && state !== 'ALL' && state !== 'ALL_INDIA') {
      sql += " AND (applicable_states = 'ALL_INDIA' OR applicable_states LIKE ?)";
      params.push(`%${state}%`);
    }

    // Branch Filter
    if (branch && branch !== 'All') {
      sql += " AND (eligible_branches LIKE '%All%' OR eligible_branches LIKE ?)";
      params.push(`%${branch}%`);
    }

    // Year Filter
    if (year && year !== 'All') {
      sql += " AND (eligible_years LIKE '%All%' OR eligible_years LIKE ?)";
      params.push(`%${year}%`);
    }

    // Gender Filter
    if (gender && gender !== 'ALL') {
      sql += ' AND (gender_restriction = "ANY" OR gender_restriction = ?)';
      params.push(gender.toUpperCase());
    }

    // Maximum Income Filter
    if (income) {
      const incVal = parseInt(income, 10);
      if (!isNaN(incVal) && incVal > 0) {
        sql += ' AND (max_income = 0 OR max_income >= ?)';
        params.push(incVal);
      }
    }

    // Social Category Filter
    if (social_category && social_category !== 'ALL') {
      sql += ' AND (category_restriction = "ALL" OR category_restriction LIKE ?)';
      params.push(`%${social_category.toUpperCase()}%`);
    }

    // Defence Category Filter
    if (defence_category && defence_category !== 'ALL') {
      sql += ' AND (defence_category = "NONE" OR defence_category LIKE ?)';
      params.push(`%${defence_category.toUpperCase()}%`);
    }

    // Text Search
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (title LIKE ? OR provider LIKE ? OR description LIKE ? OR who_can_apply LIKE ?)';
      params.push(term, term, term, term);
    }

    // Sort order
    if (sort === 'benefit_high') {
      sql += ' ORDER BY amount_max DESC, id ASC';
    } else if (sort === 'newest') {
      sql += ' ORDER BY id DESC';
    } else if (sort === 'alpha') {
      sql += ' ORDER BY title ASC';
    } else {
      // Default: closing soon (earliest deadline first, nulls last)
      sql += ' ORDER BY is_featured DESC, application_close_at ASC, id ASC';
    }

    let scholarships = query.all(sql, params);

    // Compute dynamic status and urgency
    const now = new Date('2026-10-24T00:00:00Z');
    scholarships = scholarships.map(s => {
      const computed = computeStatus(s.application_close_at, s.status);
      const closeDate = s.application_close_at ? new Date(`${s.application_close_at}T00:00:00Z`) : null;
      const diffDays = closeDate ? Math.round((closeDate - now) / (1000 * 60 * 60 * 24)) : null;

      return {
        ...s,
        status: computed,
        days_remaining: diffDays
      };
    });

    // Urgency filtering if requested
    if (urgency === 'CLOSING_SOON') {
      scholarships = scholarships.filter(s => s.days_remaining !== null && s.days_remaining >= 0 && s.days_remaining <= 7);
    } else if (urgency === 'OPEN') {
      scholarships = scholarships.filter(s => s.status !== 'CLOSED');
    } else if (urgency === 'CLOSED') {
      scholarships = scholarships.filter(s => s.status === 'CLOSED');
    }

    res.json({
      scholarships,
      total: scholarships.length
    });
  } catch (err) {
    console.error('Error fetching scholarships:', err);
    res.status(500).json({ error: 'Failed to retrieve scholarships catalog' });
  }
});

// =============================================================================
// GET /api/scholarships/my/profile — Student Extended Scholarship Profile
// =============================================================================
router.get('/my/profile', requireAuth, (req, res) => {
  try {
    const user = query.get('SELECT id, full_name, email, branch, year FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profile = query.get('SELECT * FROM student_scholarship_profiles WHERE user_id = ?', [req.user.id]);
    if (!profile) {
      profile = {
        user_id: user.id,
        domicile_state: null,
        annual_family_income: null,
        category: 'GENERAL',
        gender: 'MALE',
        is_differently_abled: 0,
        disability_percentage: 0,
        twelfth_percentage: null,
        cgpa: null,
        admission_year: 2026 - ((user.year || 1) - 1),
        entry_type: 'FIRST_YEAR',
        service_category: 'RETIRED_ARMY_ESM', // Sensible default for AIT Pune
        is_orphan: 0,
        single_girl_child: 0
      };
    }

    res.json({
      user,
      profile,
      scholarship_profile: profile
    });
  } catch (err) {
    console.error('Error loading student scholarship profile:', err);
    res.status(500).json({ error: 'Failed to load scholarship profile' });
  }
});

// =============================================================================
// POST /api/scholarships/my/profile — Update Extended Scholarship Profile
// =============================================================================
router.post('/my/profile', requireAuth, (req, res) => {
  try {
    const domicile_state = req.body.domicile_state ?? null;
    const annual_family_income = req.body.annual_family_income ?? req.body.family_annual_income ?? null;
    const category = req.body.category ?? 'GENERAL';
    const gender = req.body.gender ?? 'MALE';
    const is_differently_abled = req.body.is_differently_abled ?? req.body.is_pwd ?? false;
    const disability_percentage = req.body.disability_percentage ?? 0;
    const twelfth_percentage = req.body.twelfth_percentage ?? req.body.class_12_percentage ?? null;
    const cgpa = req.body.cgpa ?? null;
    const admission_year = req.body.admission_year ?? (req.body.year ? (2026 - (parseInt(req.body.year, 10) - 1)) : null);
    const entry_type = req.body.entry_type ?? 'FIRST_YEAR';
    const service_category = req.body.service_category ?? req.body.defence_category ?? 'NONE';
    const is_orphan = req.body.is_orphan ?? false;
    const single_girl_child = req.body.single_girl_child ?? req.body.is_single_girl_child ?? false;

    // If year is provided, update user record directly
    if (req.body.year != null || req.body.academic_year != null) {
      const yr = parseInt(req.body.year ?? req.body.academic_year, 10);
      if (!isNaN(yr) && yr >= 1 && yr <= 4) {
        query.run('UPDATE users SET year = ? WHERE id = ?', [yr, req.user.id]);
      }
    }

    query.run(`
      INSERT INTO student_scholarship_profiles (
        user_id, domicile_state, annual_family_income, category, gender,
        is_differently_abled, disability_percentage, twelfth_percentage,
        cgpa, admission_year, entry_type, service_category, is_orphan, single_girl_child, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        domicile_state = excluded.domicile_state,
        annual_family_income = excluded.annual_family_income,
        category = excluded.category,
        gender = excluded.gender,
        is_differently_abled = excluded.is_differently_abled,
        disability_percentage = excluded.disability_percentage,
        twelfth_percentage = excluded.twelfth_percentage,
        cgpa = excluded.cgpa,
        admission_year = excluded.admission_year,
        entry_type = excluded.entry_type,
        service_category = excluded.service_category,
        is_orphan = excluded.is_orphan,
        single_girl_child = excluded.single_girl_child,
        updated_at = datetime('now')
    `, [
      req.user.id,
      domicile_state || null,
      annual_family_income != null ? parseInt(annual_family_income, 10) : null,
      category || 'GENERAL',
      gender || 'MALE',
      is_differently_abled ? 1 : 0,
      disability_percentage ? parseInt(disability_percentage, 10) : 0,
      twelfth_percentage != null ? parseFloat(twelfth_percentage) : null,
      cgpa != null ? parseFloat(cgpa) : null,
      admission_year != null ? parseInt(admission_year, 10) : null,
      entry_type || 'FIRST_YEAR',
      service_category || 'NONE',
      is_orphan ? 1 : 0,
      single_girl_child ? 1 : 0
    ]);

    const updated = query.get('SELECT * FROM student_scholarship_profiles WHERE user_id = ?', [req.user.id]);
    res.json({
      message: 'Scholarship eligibility profile updated successfully',
      profile: updated,
      scholarship_profile: updated
    });
  } catch (err) {
    console.error('Error updating scholarship profile:', err);
    res.status(500).json({ error: 'Failed to update scholarship profile' });
  }
});

// =============================================================================
// GET /api/scholarships/my/matches — Smart Rule-Based Eligibility Matches
// =============================================================================
router.get('/my/matches', requireAuth, (req, res) => {
  try {
    const user = query.get('SELECT id, full_name, email, branch, year FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profile = query.get('SELECT * FROM student_scholarship_profiles WHERE user_id = ?', [req.user.id]);
    const studentData = {
      ...user,
      year: user.year || (profile?.admission_year ? (2026 - profile.admission_year + 1) : 1),
      ...(profile || {})
    };

    const scholarships = query.all(`
      SELECT * FROM scholarships
      WHERE is_active = 1
      ORDER BY is_featured DESC, application_close_at ASC
    `);

    const likelyEligible = [];
    const needsMoreInfo = [];
    const notEligible = [];

    for (const sch of scholarships) {
      const rules = query.all('SELECT * FROM scholarship_eligibility_rules WHERE scholarship_id = ?', [sch.id]);
      const evaluation = evaluateScholarshipEligibility(sch, studentData, rules);

      const payload = {
        scholarship: sch,
        ...sch,
        evaluation,
        score: evaluation.score,
        requirements_met: evaluation.requirements_met.map(r => r.description || r.title || String(r)),
        needs_verification: evaluation.needs_verification.map(r => r.description || r.title || String(r)),
        not_satisfied: evaluation.not_satisfied.map(r => r.description || r.title || String(r)),
        raw_evaluation: evaluation
      };

      if (evaluation.result === 'LIKELY_ELIGIBLE') {
        likelyEligible.push(payload);
      } else if (evaluation.result === 'NEEDS_MORE_INFO') {
        needsMoreInfo.push(payload);
      } else {
        notEligible.push(payload);
      }
    }

    res.json({
      student_profile: studentData,
      likely_eligible: likelyEligible,
      needs_more_info: needsMoreInfo,
      not_eligible: notEligible,
      matches: {
        likely_eligible: likelyEligible,
        needs_more_info: needsMoreInfo,
        not_eligible: notEligible,
        counts: {
          likely_eligible: likelyEligible.length,
          needs_more_info: needsMoreInfo.length,
          not_eligible: notEligible.length
        }
      }
    });
  } catch (err) {
    console.error('Error calculating scholarship matches:', err);
    res.status(500).json({ error: 'Failed to compute scholarship eligibility' });
  }
});

// =============================================================================
// GET /api/scholarships/my/saved — Student Saved Scholarships & Status Tracker
// =============================================================================
router.get('/my/saved', requireAuth, (req, res) => {
  try {
    const saved = query.all(`
      SELECT ss.id as save_id, ss.scholarship_id,
             ss.application_status, ss.application_status as status,
             ss.student_notes, ss.student_notes as notes,
             ss.applied_date, ss.saved_at,
             s.id, s.slug, COALESCE(s.title, s.name) as title, s.provider, s.category, s.amount_display,
             s.application_close_at, s.official_application_url, s.status as scholarship_lifecycle_status, s.verification_status
      FROM saved_scholarships ss
      JOIN scholarships s ON s.id = ss.scholarship_id
      WHERE ss.user_id = ?
      ORDER BY ss.saved_at DESC
    `, [req.user.id]);

    res.json({ saved });
  } catch (err) {
    console.error('Error fetching saved scholarships:', err);
    res.status(500).json({ error: 'Failed to load saved scholarships' });
  }
});

// POST save scholarship
router.post('/:id/save', requireAuth, (req, res) => {
  try {
    const scholarshipId = parseInt(req.params.id, 10);
    const scholarship = query.get('SELECT id FROM scholarships WHERE id = ?', [scholarshipId]);
    if (!scholarship) return res.status(404).json({ error: 'Scholarship not found' });

    query.run(`
      INSERT INTO saved_scholarships (user_id, scholarship_id, application_status, saved_at)
      VALUES (?, ?, 'INTERESTED', datetime('now'))
      ON CONFLICT(user_id, scholarship_id) DO UPDATE SET saved_at = datetime('now')
    `, [req.user.id, scholarshipId]);

    // Track activity
    try {
      query.run(`
        INSERT INTO scholarship_activity (user_id, scholarship_id, action_type)
        VALUES (?, ?, 'SAVE')
      `, [req.user.id, scholarshipId]);
    } catch (e) {}

    res.json({ message: 'Scholarship saved to your personal library' });
  } catch (err) {
    console.error('Error saving scholarship:', err);
    res.status(500).json({ error: 'Failed to save scholarship' });
  }
});

// DELETE remove saved scholarship
router.delete('/:id/save', requireAuth, (req, res) => {
  try {
    const scholarshipId = parseInt(req.params.id, 10);
    query.run('DELETE FROM saved_scholarships WHERE user_id = ? AND scholarship_id = ?', [req.user.id, scholarshipId]);
    res.json({ message: 'Scholarship removed from saved library' });
  } catch (err) {
    console.error('Error unsaving scholarship:', err);
    res.status(500).json({ error: 'Failed to remove saved scholarship' });
  }
});

// PATCH update personal application tracking status
router.patch('/:id/save-status', requireAuth, (req, res) => {
  try {
    const scholarshipId = parseInt(req.params.id, 10);
    const { status: appStatus, notes, applied_date } = req.body;

    const allowedStatuses = ['INTERESTED', 'PREPARING_DOCS', 'APPLIED_EXTERNALLY', 'AWAITING_RESULTS', 'AWARDED', 'REJECTED', 'NO_LONGER_INTERESTED'];
    if (!allowedStatuses.includes(appStatus)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    query.run(`
      UPDATE saved_scholarships SET
        application_status = ?,
        student_notes = COALESCE(?, student_notes),
        applied_date = COALESCE(?, applied_date)
      WHERE user_id = ? AND scholarship_id = ?
    `, [appStatus, notes ?? null, applied_date ?? null, req.user.id, scholarshipId]);

    res.json({ message: 'Personal application status updated' });
  } catch (err) {
    console.error('Error updating saved status:', err);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// =============================================================================
// GET /api/scholarships/slug/:slug — Comprehensive Scholarship Detail View
// =============================================================================
router.get('/slug/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    let scholarship = query.get('SELECT * FROM scholarships WHERE slug = ?', [slug]);
    if (!scholarship) {
      // Fallback by numeric ID
      scholarship = query.get('SELECT * FROM scholarships WHERE id = ?', [parseInt(slug, 10) || 0]);
    }
    if (!scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }

    const rules = query.all('SELECT * FROM scholarship_eligibility_rules WHERE scholarship_id = ?', [scholarship.id]);
    const sources = query.all('SELECT * FROM scholarship_sources WHERE scholarship_id = ?', [scholarship.id]);

    // If request contains an authorization header, evaluate eligibility for current user
    let userEvaluation = null;
    let isSaved = false;
    let savedRecord = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        // Decode token user ID safely
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload?.id) {
          const user = query.get('SELECT id, full_name, email, branch, year FROM users WHERE id = ?', [payload.id]);
          const profile = query.get('SELECT * FROM student_scholarship_profiles WHERE user_id = ?', [payload.id]);
          if (user) {
            userEvaluation = evaluateScholarshipEligibility(scholarship, { ...user, ...(profile || {}) }, rules);
          }
          savedRecord = query.get('SELECT * FROM saved_scholarships WHERE user_id = ? AND scholarship_id = ?', [payload.id, scholarship.id]);
          isSaved = Boolean(savedRecord);
        }
      } catch (e) {}
    }

    res.json({
      scholarship: {
        ...scholarship,
        status: computeStatus(scholarship.application_close_at, scholarship.status)
      },
      rules,
      sources,
      user_evaluation: userEvaluation,
      is_saved: isSaved,
      saved_record: savedRecord
    });
  } catch (err) {
    console.error('Error fetching scholarship detail:', err);
    res.status(500).json({ error: 'Failed to retrieve scholarship detail' });
  }
});

// Single scholarship by numeric ID (alias)
router.get('/:id', (req, res) => {
  const schol = query.get('SELECT * FROM scholarships WHERE id = ?', [req.params.id]);
  if (!schol) return res.status(404).json({ error: 'Scholarship not found' });

  const rules = query.all('SELECT * FROM scholarship_eligibility_rules WHERE scholarship_id = ?', [schol.id]);
  const sources = query.all('SELECT * FROM scholarship_sources WHERE scholarship_id = ?', [schol.id]);

  res.json({
    scholarship: {
      ...schol,
      status: computeStatus(schol.application_close_at, schol.status)
    },
    rules,
    sources
  });
});

// =============================================================================
// GET /api/scholarships/:id/redirect — Safe Official Outbound Redirection
// =============================================================================
router.get('/:id/redirect', (req, res) => {
  try {
    const scholarshipId = parseInt(req.params.id, 10);
    const scholarship = query.get('SELECT id, title, name, provider, official_application_url, apply_url, status, verification_status FROM scholarships WHERE id = ?', [scholarshipId]);

    if (!scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }

    const targetUrl = scholarship.official_application_url || scholarship.apply_url;
    if (!targetUrl) {
      return res.status(400).json({ error: 'No official application link configured for this scholarship' });
    }

    // Safety validation against open redirects
    try {
      const parsed = new URL(targetUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).json({ error: 'Invalid destination protocol' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Malformed official application URL' });
    }

    // Log outbound redirection event
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload?.id || null;
      } catch (e) {}
    }

    try {
      query.run(`
        INSERT INTO scholarship_activity (user_id, scholarship_id, action_type, destination_url)
        VALUES (?, ?, 'CLICK_APPLY_OFFICIAL', ?)
      `, [userId, scholarshipId, targetUrl]);
    } catch (e) {}

    res.json({
      target_url: targetUrl,
      scholarship_title: scholarship.title || scholarship.name,
      provider: scholarship.provider,
      status: scholarship.status
    });
  } catch (err) {
    console.error('Redirection error:', err);
    res.status(500).json({ error: 'Redirection failed' });
  }
});

// =============================================================================
// ADMIN ENDPOINTS — Protected Management & Verification Console
// =============================================================================

// POST create scholarship
router.post('/', requireAuth, requireRole('ADMIN', 'FACULTY', 'SUPER_ADMIN'), (req, res) => {
  try {
    const {
      title, name, provider, category = 'CENTRAL', subcategory = 'GENERAL',
      academic_year = '2026-27', description, benefits_summary,
      amount_min = 0, amount_max = 0, amount_display,
      eligible_branches = 'All', eligible_years = '1, 2, 3, 4',
      max_income = 0, min_percentage = 0, applicable_states = 'ALL_INDIA',
      outside_state_study_allowed = 1, gender_restriction = 'ANY',
      category_restriction = 'ALL', defence_category = 'NONE',
      application_type = 'FRESH_AND_RENEWAL', application_close_at,
      official_application_url, who_can_apply, required_documents, application_procedure
    } = req.body;

    const displayTitle = title || name;
    if (!displayTitle || !provider || !application_close_at || !official_application_url) {
      return res.status(400).json({ error: 'Title, provider, application close date, and official application URL are mandatory.' });
    }

    const slug = (displayTitle || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const result = query.run(`
      INSERT INTO scholarships (
        slug, title, name, provider, category, subcategory, academic_year,
        description, benefits_summary, amount_min, amount_max, amount_display,
        eligible_branches, eligible_years, max_income, min_percentage, applicable_states,
        outside_state_study_allowed, gender_restriction, category_restriction, defence_category,
        application_type, application_close_at, official_application_url, apply_url,
        who_can_apply, required_documents, application_procedure,
        status, verification_status, is_active
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        'OPEN', 'VERIFIED', 1
      )
    `, [
      slug, displayTitle, displayTitle, provider, category, subcategory, academic_year,
      description || `${displayTitle} offered by ${provider}.`, benefits_summary || amount_display || 'Educational grant',
      amount_min, amount_max, amount_display || 'As per scheme guidelines',
      eligible_branches, eligible_years, max_income, min_percentage, applicable_states,
      outside_state_study_allowed ? 1 : 0, gender_restriction, category_restriction, defence_category,
      application_type, application_close_at, official_application_url, official_application_url,
      who_can_apply || 'As per official notification', required_documents || 'Marksheet, Bonafide, Income proof', application_procedure || 'Apply on official website'
    ]);

    // Audit log
    query.run(`
      INSERT INTO scholarship_admin_audit_logs (admin_id, admin_email, scholarship_id, action, details)
      VALUES (?, ?, ?, 'CREATE', ?)
    `, [req.user.id, req.user.email, result.lastInsertRowid, `Created scholarship: ${displayTitle}`]);

    res.status(201).json({
      message: 'Scholarship created and published successfully',
      id: result.lastInsertRowid,
      slug
    });
  } catch (err) {
    console.error('Error creating scholarship:', err);
    res.status(500).json({ error: 'Failed to create scholarship record' });
  }
});

// PATCH update verification status
router.patch('/:id/verify', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    const scholarshipId = parseInt(req.params.id, 10);
    const { verification_status } = req.body;

    const allowed = ['VERIFIED', 'NOT_YET_VERIFIED', 'UNDER_REVIEW'];
    if (!allowed.includes(verification_status)) {
      return res.status(400).json({ error: `Invalid verification status. Allowed: ${allowed.join(', ')}` });
    }

    query.run(`
      UPDATE scholarships SET
        verification_status = ?,
        last_verified_at = datetime('now')
      WHERE id = ?
    `, [verification_status, scholarshipId]);

    // Audit log
    query.run(`
      INSERT INTO scholarship_admin_audit_logs (admin_id, admin_email, scholarship_id, action, details)
      VALUES (?, ?, ?, 'VERIFY', ?)
    `, [req.user.id, req.user.email, scholarshipId, `Set verification status to ${verification_status}`]);

    res.json({ message: `Verification status updated to ${verification_status}` });
  } catch (err) {
    console.error('Error verifying scholarship:', err);
    res.status(500).json({ error: 'Failed to update verification status' });
  }
});

export default router;
