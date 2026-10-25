import express from 'express';
import { query } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Canonical category mappings to handle both UI slugs/constants and display strings
const CATEGORY_MAP = {
  'SOFTWARE_ENGINEERING': 'Software Development',
  'SOFTWARE_DEVELOPMENT': 'Software Development',
  'ARTIFICIAL_INTELLIGENCE_ML': 'Artificial Intelligence',
  'AI_ML': 'Artificial Intelligence',
  'ARTIFICIAL_INTELLIGENCE': 'Artificial Intelligence',
  'MACHINE_LEARNING': 'Machine Learning',
  'DATA_SCIENCE_ANALYTICS': 'Data Science',
  'DATA_SCIENCE': 'Data Science',
  'CYBERSECURITY': 'Cybersecurity',
  'CLOUD_DEVOPS': 'Cloud Computing',
  'CLOUD_COMPUTING': 'Cloud Computing',
  'EMBEDDED_SYSTEMS_IOT': 'Electronics and Embedded Systems',
  'ELECTRONICS_AND_EMBEDDED_SYSTEMS': 'Electronics and Embedded Systems',
  'CORE_ELECTRONICS_VLSI': 'Electronics and Embedded Systems',
  'MECHANICAL_AUTOMOTIVE': 'Mechanical Engineering',
  'MECHANICAL_ENGINEERING': 'Mechanical Engineering',
  'ELECTRICAL_ENGINEERING': 'Electrical Engineering',
  'DEFENCE_RESEARCH': 'Research Internships',
  'RESEARCH_INTERNSHIPS': 'Research Internships',
  'RESEARCH_FELLOWSHIP': 'Research Internships',
  'GOVT_PSU': 'Government Internships',
  'GOVERNMENT_INTERNSHIPS': 'Government Internships',
  'STARTUP_INTERNSHIPS': 'Startup Internships',
  'CORPORATE_INTERNSHIPS': 'Corporate Internships',
  'OTHER_ENGINEERING_INTERNSHIPS': 'Other Engineering Internships',
  'OTHER_ENGINEERING': 'Other Engineering Internships'
};

// Branch abbreviations to keywords
const BRANCH_MAP = {
  'COMP': ['computer', 'comp'],
  'IT': ['information technology', ' it '],
  'ENTC': ['electronics', 'telecommunication', 'entc', 'e&tc'],
  'MECH': ['mechanical', 'mech'],
  'AS': ['robotics', 'automation', ' as ']
};

function normalizeInternship(intern) {
  if (!intern) return null;
  const skillsArray = intern.skills_required
    ? (Array.isArray(intern.skills_required) ? intern.skills_required : intern.skills_required.split(/[,;]+/).map(s => s.trim()).filter(Boolean))
    : [];

  const branchesArray = intern.eligible_branches
    ? (Array.isArray(intern.eligible_branches) ? intern.eligible_branches : intern.eligible_branches.split(/[,;]+/).map(s => s.trim()).filter(Boolean))
    : ['All'];

  return {
    ...intern,
    company_name: intern.company || intern.company_name || 'Organization',
    company: intern.company || intern.company_name || 'Organization',
    application_link: intern.apply_url || intern.application_link || '#',
    apply_url: intern.apply_url || intern.application_link || '#',
    skills_required: skillsArray,
    skills_required_raw: typeof intern.skills_required === 'string' ? intern.skills_required : skillsArray.join(', '),
    eligible_branches: branchesArray,
    eligible_branches_raw: typeof intern.eligible_branches === 'string' ? intern.eligible_branches : branchesArray.join(', ')
  };
}

/**
 * Deterministic Internship Fit Evaluation
 */
export function evaluateInternshipFit(intern, student = {}, studentSkills = []) {
  if (!student.branch && !student.year) {
    return {
      status: 'UNKNOWN',
      badge: 'Profile Incomplete',
      score: 50,
      reason: 'Additional academic information (Branch and Year) needed in profile.'
    };
  }

  const sBranch = (student.branch || '').toLowerCase();
  const sYear = student.year ? parseInt(student.year, 10) : null;
  const eligibleBranches = (intern.eligible_branches_raw || intern.eligible_branches || 'All').toString().toLowerCase();
  const eligibleYears = (intern.eligible_years || 'All').toString().toLowerCase();

  // Branch check
  let branchPass = eligibleBranches === 'all';
  if (!branchPass && sBranch) {
    const branchKeywords = BRANCH_MAP[student.branch?.toUpperCase()] || [sBranch];
    branchPass = branchKeywords.some(kw => eligibleBranches.includes(kw));
  }
  
  // Year check
  let yearPass = true;
  if (eligibleYears !== 'all' && sYear) {
    yearPass = eligibleYears.includes(String(sYear));
  }

  // Skills check
  const rawSkills = (intern.skills_required_raw || (Array.isArray(intern.skills_required) ? intern.skills_required.join(', ') : intern.skills_required) || '').toLowerCase();
  const internSkills = rawSkills.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  const matchedSkills = [];
  if (studentSkills.length > 0) {
    for (const sk of studentSkills) {
      const skName = sk.toLowerCase();
      if (internSkills.some(req => req.includes(skName) || skName.includes(req))) {
        matchedSkills.push(sk);
      }
    }
  }

  if (!branchPass) {
    return {
      status: 'NOT_ELIGIBLE',
      badge: 'Branch Restricted',
      score: 20,
      reason: `Internship is restricted to ${intern.eligible_branches_raw || intern.eligible_branches}, but your branch is ${student.branch}.`
    };
  }

  if (!yearPass) {
    return {
      status: 'NOT_ELIGIBLE',
      badge: 'Year Restricted',
      score: 25,
      reason: `Internship requires Year ${intern.eligible_years}, but your current academic standing is Year ${student.year || 'unspecified'}.`
    };
  }

  if (matchedSkills.length > 0) {
    return {
      status: 'ELIGIBLE',
      badge: 'High Match',
      score: 90,
      reason: `Matches your ${student.branch} branch, Year ${student.year}, and verified skill(s): ${matchedSkills.slice(0, 3).join(', ')}.`,
      matched_skills: matchedSkills
    };
  }

  return {
    status: 'POTENTIALLY_ELIGIBLE',
    badge: 'Potentially Eligible',
    score: 75,
    reason: `Academic branch and year qualify. Update profile with relevant skills (${internSkills.slice(0, 3).join(', ')}) to confirm fit.`,
    matched_skills: []
  };
}

// =============================================================================
// GET /api/internships/stats — Live Summary Statistics
// =============================================================================
router.get('/stats', (req, res) => {
  try {
    const total = query.get('SELECT count(*) as count FROM internships WHERE is_active = 1')?.count || 0;
    const now = '2026-10-24';
    const closingSoon = query.get(`
      SELECT count(*) as count FROM internships
      WHERE is_active = 1 AND deadline >= ? AND deadline <= date(?, '+14 days')
    `, [now, now])?.count || 0;
    const avgStipend = query.get('SELECT avg(stipend_amount) as avg_val FROM internships WHERE is_active = 1 AND stipend_amount > 0')?.avg_val || 0;

    const statsObj = {
      total_verified: total,
      currently_open: total,
      closing_soon: closingSoon,
      avg_stipend: Math.round(avgStipend),
      average_stipend: Math.round(avgStipend),
      reference_date: now
    };

    res.json({
      stats: statsObj,
      ...statsObj
    });
  } catch (err) {
    console.error('Error computing internship stats:', err);
    res.status(500).json({ error: 'Failed to compute internship stats' });
  }
});

// =============================================================================
// GET /api/internships/my/saved — Authenticated Student Saved Internships
// =============================================================================
router.get('/my/saved', requireAuth, (req, res) => {
  try {
    const rows = query.all(`
      SELECT si.id as save_id, si.internship_id, si.status, si.notes, si.created_at as saved_at,
             i.*
      FROM saved_internships si
      JOIN internships i ON i.id = si.internship_id
      WHERE si.user_id = ?
      ORDER BY si.created_at DESC
    `, [req.user.id]);

    const normalized = rows.map(r => normalizeInternship(r));

    res.json({
      saved: normalized,
      internships: normalized,
      total: normalized.length
    });
  } catch (err) {
    console.error('Error fetching saved internships:', err);
    res.status(500).json({ error: 'Failed to load saved internships' });
  }
});

// =============================================================================
// POST /api/internships/:id/save — Toggle / Save Internship
// =============================================================================
router.post('/:id/save', requireAuth, (req, res) => {
  try {
    const internId = parseInt(req.params.id, 10);
    const intern = query.get('SELECT id FROM internships WHERE id = ?', [internId]);
    if (!intern) return res.status(404).json({ error: 'Internship not found' });

    query.run(`
      INSERT INTO saved_internships (user_id, internship_id, status, created_at, updated_at)
      VALUES (?, ?, 'SAVED', datetime('now'), datetime('now'))
      ON CONFLICT(user_id, internship_id) DO UPDATE SET updated_at = datetime('now')
    `, [req.user.id, internId]);

    res.json({
      saved: true,
      message: 'Internship saved to your personal library'
    });
  } catch (err) {
    console.error('Error saving internship:', err);
    res.status(500).json({ error: 'Failed to save internship' });
  }
});

// =============================================================================
// DELETE /api/internships/:id/save — Remove Saved Internship
// =============================================================================
router.delete('/:id/save', requireAuth, (req, res) => {
  try {
    const internId = parseInt(req.params.id, 10);
    query.run('DELETE FROM saved_internships WHERE user_id = ? AND internship_id = ?', [req.user.id, internId]);
    res.json({
      saved: false,
      message: 'Internship removed from saved library'
    });
  } catch (err) {
    console.error('Error removing saved internship:', err);
    res.status(500).json({ error: 'Failed to remove saved internship' });
  }
});

// =============================================================================
// GET /api/internships/my/matches — Personalized Recommendations Engine
// =============================================================================
router.get('/my/matches', requireAuth, (req, res) => {
  try {
    const user = query.get('SELECT id, full_name, email, branch, year FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch user's registered skills
    const userSkills = query.all(`
      SELECT s.name
      FROM user_skills us
      JOIN skills s ON s.id = us.skill_id
      WHERE us.user_id = ?
    `, [req.user.id]).map(s => s.name);

    const rawInternships = query.all('SELECT * FROM internships WHERE is_active = 1 ORDER BY deadline ASC');
    const internships = rawInternships.map(i => normalizeInternship(i));

    const eligible = [];
    const potentiallyEligible = [];
    const notEligible = [];

    for (const intern of internships) {
      const fit = evaluateInternshipFit(intern, user, userSkills);
      const payload = {
        ...intern,
        match_score: fit.score,
        evaluation: fit
      };

      if (fit.status === 'ELIGIBLE') {
        eligible.push(payload);
      } else if (fit.status === 'POTENTIALLY_ELIGIBLE' || fit.status === 'UNKNOWN') {
        potentiallyEligible.push(payload);
      } else {
        notEligible.push(payload);
      }
    }

    const allMatches = [...eligible, ...potentiallyEligible].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

    res.json({
      student_profile: {
        name: user.full_name,
        branch: user.branch,
        year: user.year,
        skills: userSkills
      },
      matches: allMatches,
      eligible,
      potentially_eligible: potentiallyEligible,
      not_eligible: notEligible,
      total_matches: allMatches.length
    });
  } catch (err) {
    console.error('Error computing internship matches:', err);
    res.status(500).json({ error: 'Failed to calculate personalized matches' });
  }
});

// =============================================================================
// GET /api/internships — Master Filtered Catalog
// =============================================================================
router.get('/', (req, res) => {
  try {
    const {
      category,
      mode,
      branch,
      year,
      stipend,
      duration,
      deadline,
      search,
      sort
    } = req.query;

    let sql = 'SELECT * FROM internships WHERE is_active = 1';
    const params = [];

    // Filter: Category (handles canonical slug/constant or plain text)
    if (category && category !== 'ALL' && category !== 'All') {
      const mappedCat = CATEGORY_MAP[category.toUpperCase()] || category;
      sql += ' AND (category = ? OR category LIKE ?)';
      params.push(mappedCat, `%${mappedCat}%`);
    }

    // Filter: Mode (Remote, Hybrid, On-site, case-insensitive)
    if (mode && mode !== 'ALL' && mode !== 'All') {
      sql += ' AND UPPER(mode) = UPPER(?)';
      params.push(mode);
    }

    // Filter: Branch (handles COMP, IT, ENTC, MECH, AS or full name)
    if (branch && branch !== 'ALL' && branch !== 'All') {
      const bUpper = branch.toUpperCase();
      const keywords = BRANCH_MAP[bUpper] || [branch];
      const branchConditions = keywords.map(() => 'eligible_branches LIKE ?').join(' OR ');
      sql += ` AND (eligible_branches = 'All' OR eligible_branches LIKE '%All%' OR ${branchConditions})`;
      keywords.forEach(kw => params.push(`%${kw}%`));
    }

    // Filter: Year
    if (year && year !== 'ALL' && year !== 'All') {
      sql += ` AND (eligible_years = 'All' OR eligible_years LIKE '%All%' OR eligible_years LIKE ?)`;
      params.push(`%${year}%`);
    }

    // Filter: Stipend
    if (stipend === 'PAID') {
      sql += ' AND stipend_amount > 0';
    } else if (stipend === 'UNPAID') {
      sql += ' AND (stipend_amount = 0 OR stipend LIKE "%Unpaid%")';
    }

    // Filter: Duration
    if (duration && duration !== 'ALL') {
      sql += ' AND duration LIKE ?';
      params.push(`%${duration}%`);
    }

    // Filter: Deadline urgency
    if (deadline === 'CLOSING_SOON') {
      const now = '2026-10-24';
      sql += ' AND deadline >= ? AND deadline <= date(?, "+14 days")';
      params.push(now, now);
    }

    // Filter: Search text
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (title LIKE ? OR company LIKE ? OR role LIKE ? OR skills_required LIKE ? OR location LIKE ? OR description LIKE ?)';
      params.push(term, term, term, term, term, term);
    }

    // Sort
    if (sort === 'stipend_high') {
      sql += ' ORDER BY stipend_amount DESC, deadline ASC';
    } else if (sort === 'newest') {
      sql += ' ORDER BY id DESC';
    } else {
      // Default: earliest deadline first
      sql += ' ORDER BY deadline ASC';
    }

    const rawInternships = query.all(sql, params);

    // Compute days remaining relative to reference date (24 Oct 2026)
    const refDate = new Date('2026-10-24T00:00:00Z');
    const enriched = rawInternships.map(i => {
      const d = i.deadline ? new Date(`${i.deadline}T00:00:00Z`) : null;
      const daysRemaining = d ? Math.ceil((d - refDate) / (1000 * 60 * 60 * 24)) : null;
      return {
        ...normalizeInternship(i),
        days_remaining: daysRemaining
      };
    });

    res.json({ internships: enriched, total: enriched.length });
  } catch (err) {
    console.error('Error fetching internships:', err);
    res.status(500).json({ error: 'Failed to fetch internships' });
  }
});

// =============================================================================
// GET /api/internships/:id — Single Internship Detail View
// =============================================================================
router.get('/:id', (req, res) => {
  try {
    const rawIntern = query.get('SELECT * FROM internships WHERE id = ?', [req.params.id]);
    if (!rawIntern) return res.status(404).json({ error: 'Internship not found' });

    const intern = normalizeInternship(rawIntern);
    let userEvaluation = null;
    let isSaved = false;

    // Check optional user evaluation if token is provided
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload?.id) {
          const user = query.get('SELECT id, full_name, email, branch, year FROM users WHERE id = ?', [payload.id]);
          const userSkills = query.all(`
            SELECT s.name FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.user_id = ?
          `, [payload.id]).map(s => s.name);

          if (user) {
            userEvaluation = evaluateInternshipFit(intern, user, userSkills);
          }

          const savedRecord = query.get('SELECT id FROM saved_internships WHERE user_id = ? AND internship_id = ?', [payload.id, intern.id]);
          isSaved = !!savedRecord;
        }
      } catch (e) {
        // Ignore token decode failure on public read
      }
    }

    const refDate = new Date('2026-10-24T00:00:00Z');
    const d = intern.deadline ? new Date(`${intern.deadline}T00:00:00Z`) : null;
    const daysRemaining = d ? Math.ceil((d - refDate) / (1000 * 60 * 60 * 24)) : null;

    res.json({
      internship: {
        ...intern,
        days_remaining: daysRemaining,
        is_saved: isSaved,
        user_evaluation: userEvaluation
      }
    });
  } catch (err) {
    console.error('Error fetching internship details:', err);
    res.status(500).json({ error: 'Failed to load internship details' });
  }
});

export default router;
