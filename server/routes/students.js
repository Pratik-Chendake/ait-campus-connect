import express from 'express';
import { query } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateProfileCompletion } from './auth.js';

const router = express.Router();

// GET students directory
router.get('/', (req, res) => {
  try {
    const { branch, year, skill, search } = req.query;

    let sql = `
      SELECT DISTINCT u.id, u.student_id, u.full_name, u.email, u.role, u.branch, u.year,
             u.avatar_url, u.bio, u.contribution_score, u.profile_visibility
      FROM users u
      LEFT JOIN user_skills us ON us.user_id = u.id
      LEFT JOIN skills s ON s.id = us.skill_id
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

    if (skill) {
      sql += ' AND s.name LIKE ?';
      params.push(`%${skill}%`);
    }

    if (search) {
      sql += ' AND (u.full_name LIKE ? OR u.bio LIKE ? OR u.student_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY u.contribution_score DESC, u.full_name ASC';

    const students = query.all(sql, params);

    // Attach top skills and top achievement to each student card
    const enhancedStudents = students.map(student => {
      const studentSkills = query.all(`
        SELECT s.name, us.level, us.is_verified
        FROM user_skills us
        JOIN skills s ON s.id = us.skill_id
        WHERE us.user_id = ?
        LIMIT 4
      `, [student.id]);

      const topAchievement = query.get(`
        SELECT title, position, event_name, verification_status
        FROM achievements
        WHERE user_id = ? AND verification_status = 'VERIFIED'
        ORDER BY is_highlight DESC, id DESC
        LIMIT 1
      `, [student.id]);

      return {
        ...student,
        skills: studentSkills,
        top_achievement: topAchievement || null
      };
    });

    res.json({ students: enhancedStudents });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students directory' });
  }
});

// GET full student profile by ID or username
router.get('/:idOrUsername', (req, res) => {
  try {
    const { idOrUsername } = req.params;
    let user;

    if (!isNaN(idOrUsername)) {
      user = query.get('SELECT * FROM users WHERE id = ?', [idOrUsername]);
    } else {
      // Find by username (e.g. 'rahul.sharma' matches email 'rahul.sharma@aitpune.edu.in' or student_id)
      user = query.get(`
        SELECT * FROM users
        WHERE email LIKE ? OR student_id = ?
      `, [`${idOrUsername}@%`, idOrUsername]);
    }

    if (!user) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Skills
    const skills = query.all(`
      SELECT us.id as user_skill_id, s.id as skill_id, s.name, s.category, us.level, us.is_verified
      FROM user_skills us
      JOIN skills s ON s.id = us.skill_id
      WHERE us.user_id = ?
      ORDER BY s.category, s.name
    `, [user.id]);

    // Achievements
    const achievements = query.all(`
      SELECT * FROM achievements
      WHERE user_id = ?
      ORDER BY is_highlight DESC, date DESC, id DESC
    `, [user.id]);

    // Public or private certificates
    const isOwner = req.user && req.user.id === user.id;
    const certSql = isOwner
      ? 'SELECT * FROM certificates WHERE user_id = ? ORDER BY issue_date DESC'
      : 'SELECT * FROM certificates WHERE user_id = ? AND is_public = 1 ORDER BY issue_date DESC';
    const certificates = query.all(certSql, [user.id]);

    // Permanent System: Verified records selected for public portfolio
    const portfolioParticipations = query.all(`
      SELECT p.*,
             pr.result_type, pr.official_rank, pr.rank_category, pr.score,
             (SELECT file_path FROM participation_certificates WHERE participation_id = p.id LIMIT 1) as certificate_url
      FROM participation_records p
      LEFT JOIN participation_results pr ON pr.participation_id = p.id
      WHERE p.student_id = ? AND p.is_in_portfolio = 1
      ORDER BY p.event_date DESC, p.id DESC
    `, [user.id]);

    // Projects
    const projects = query.all('SELECT * FROM projects WHERE user_id = ? ORDER BY id DESC', [user.id]);

    // Research Papers
    const researchPapers = query.all('SELECT * FROM research_papers WHERE user_id = ? ORDER BY publication_date DESC', [user.id]);

    // Internships
    const internships = query.all('SELECT * FROM student_internships WHERE user_id = ? ORDER BY start_date DESC', [user.id]);

    // Leadership
    const leadership = query.all('SELECT * FROM student_leadership WHERE user_id = ? ORDER BY start_date DESC', [user.id]);

    // Sports & Cultural
    const sportsCultural = query.all('SELECT * FROM student_sports_cultural WHERE user_id = ? ORDER BY year DESC', [user.id]);

    // Certifications
    const certifications = query.all('SELECT * FROM student_certifications WHERE user_id = ? ORDER BY issue_date DESC', [user.id]);

    // Clubs followed or member
    const clubMemberships = query.all(`
      SELECT c.id, c.name, c.slug, c.logo_url, c.category, cm.role, cm.duration, cm.joined_at
      FROM club_members cm
      JOIN clubs c ON c.id = cm.club_id
      WHERE cm.user_id = ?
    `, [user.id]);

    // Generate "My AIT Journey" timeline
    const timeline = [];
    if (user.created_at) {
      timeline.push({
        year: user.year ? `${2026 - (user.year - 1)}` : '2024',
        title: 'Joined Army Institute of Technology, Pune',
        description: `Enrolled in ${user.branch || 'Engineering'}. Started the journey of discipline and excellence.`,
        type: 'ENROLLMENT'
      });
    }

    clubMemberships.forEach(cm => {
      timeline.push({
        year: cm.joined_at ? cm.joined_at.slice(0, 4) : '2025',
        title: `Joined ${cm.name}`,
        description: `Active role as ${cm.role}.`,
        type: 'CLUB'
      });
    });

    projects.forEach(p => {
      timeline.push({
        year: p.completed_date ? p.completed_date.slice(0, 4) : '2025',
        title: `Built Project: ${p.title}`,
        description: p.description.slice(0, 100) + '...',
        type: 'PROJECT'
      });
    });

    achievements.forEach(a => {
      timeline.push({
        year: a.date ? a.date.slice(0, 4) : '2025',
        title: `${a.position}: ${a.title}`,
        description: `${a.event_name} organized by ${a.organization}. Level: ${a.level}.`,
        type: 'ACHIEVEMENT',
        verified: a.verification_status === 'VERIFIED'
      });
    });

    portfolioParticipations.forEach(pp => {
      timeline.push({
        year: pp.event_date ? pp.event_date.slice(0, 4) : '2026',
        title: `${pp.rank_category || pp.participation_status}: ${pp.title}`,
        description: `Organized by ${pp.organizer} (${pp.category}). Permanent Verified Record ID: ${pp.registration_id || pp.id}`,
        type: 'ACHIEVEMENT',
        verified: pp.verification_status === 'OFFICIAL' || pp.verification_status === 'VERIFIED'
      });
    });

    researchPapers.forEach(rp => {
      timeline.push({
        year: rp.publication_date ? rp.publication_date.slice(0, 4) : '2025',
        title: `Research Publication: ${rp.title}`,
        description: `${rp.conference_or_journal} ${rp.is_ieee ? '(IEEE)' : ''}`,
        type: 'RESEARCH'
      });
    });

    // Sort timeline chronologically
    timeline.sort((a, b) => a.year.localeCompare(b.year));

    const profileData = {
      user: {
        id: user.id,
        student_id: user.student_id,
        full_name: user.full_name,
        email: user.email,
        personal_email: user.personal_email,
        role: user.role,
        branch: user.branch,
        year: user.year,
        semester: user.semester,
        phone: user.phone,
        avatar_url: user.avatar_url,
        bio: user.bio,
        github_url: user.github_url,
        linkedin_url: user.linkedin_url,
        portfolio_url: user.portfolio_url,
        contribution_score: user.contribution_score,
        profile_visibility: user.profile_visibility,
        profile_completion: calculateProfileCompletion(user)
      },
      skills,
      achievements,
      portfolio_participations: portfolioParticipations,
      certificates,
      projects,
      research_papers: researchPapers,
      internships,
      leadership,
      sports_cultural: sportsCultural,
      certifications,
      clubs: clubMemberships,
      timeline
    };

    res.json(profileData);
  } catch (err) {
    console.error('Error fetching student profile:', err);
    res.status(500).json({ error: 'Failed to fetch student profile' });
  }
});

// PATCH update profile
router.patch('/:id/profile', requireAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.user.id !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to edit this profile' });
    }

    const {
      full_name, bio, branch, year, semester, phone,
      github_url, linkedin_url, portfolio_url, avatar_url, profile_visibility
    } = req.body;

    query.run(`
      UPDATE users SET
        full_name = COALESCE(?, full_name),
        bio = COALESCE(?, bio),
        branch = COALESCE(?, branch),
        year = COALESCE(?, year),
        semester = COALESCE(?, semester),
        phone = COALESCE(?, phone),
        github_url = COALESCE(?, github_url),
        linkedin_url = COALESCE(?, linkedin_url),
        portfolio_url = COALESCE(?, portfolio_url),
        avatar_url = COALESCE(?, avatar_url),
        profile_visibility = COALESCE(?, profile_visibility),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      full_name ?? null, bio ?? null, branch ?? null, year ?? null, semester ?? null, phone ?? null,
      github_url ?? null, linkedin_url ?? null, portfolio_url ?? null, avatar_url ?? null, profile_visibility ?? null,
      userId
    ]);

    const updated = query.get('SELECT * FROM users WHERE id = ?', [userId]);
    res.json({
      message: 'Profile updated successfully',
      user: {
        ...updated,
        profile_completion: calculateProfileCompletion(updated)
      }
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST add skill
router.post('/:id/skills', requireAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.user.id !== userId) return res.status(403).json({ error: 'Unauthorized' });

    const { skill_name, level, category } = req.body;
    if (!skill_name) return res.status(400).json({ error: 'Skill name required' });

    // Insert skill into skills directory if doesn't exist
    query.run('INSERT OR IGNORE INTO skills (name, category) VALUES (?, ?)', [skill_name.trim(), category || 'Technical']);
    const skill = query.get('SELECT id FROM skills WHERE name = ?', [skill_name.trim()]);

    query.run(`
      INSERT OR REPLACE INTO user_skills (user_id, skill_id, level, is_verified)
      VALUES (?, ?, ?, 0)
    `, [userId, skill.id, level || 'Intermediate']);

    res.json({ message: 'Skill added successfully' });
  } catch (err) {
    console.error('Error adding skill:', err);
    res.status(500).json({ error: 'Failed to add skill' });
  }
});

// DELETE remove skill
router.delete('/:id/skills/:userSkillId', requireAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.user.id !== userId) return res.status(403).json({ error: 'Unauthorized' });

    query.run('DELETE FROM user_skills WHERE id = ? AND user_id = ?', [req.params.userSkillId, userId]);
    res.json({ message: 'Skill removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove skill' });
  }
});

// POST add project
router.post('/:id/projects', requireAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.user.id !== userId) return res.status(403).json({ error: 'Unauthorized' });

    const { title, description, problem_statement, solution, tech_stack, github_url, demo_url, banner_url, team_members, completed_date } = req.body;
    if (!title || !description || !tech_stack) {
      return res.status(400).json({ error: 'Title, description, and tech stack are required' });
    }

    const result = query.run(`
      INSERT INTO projects (user_id, title, description, problem_statement, solution, tech_stack, github_url, demo_url, banner_url, team_members, completed_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, title, description, problem_statement || null, solution || null, tech_stack, github_url || null, demo_url || null, banner_url || null, team_members || null, completed_date || null]);

    res.status(201).json({ message: 'Project added successfully', id: result.lastInsertRowid });
  } catch (err) {
    console.error('Error adding project:', err);
    res.status(500).json({ error: 'Failed to add project' });
  }
});

// POST add leadership
router.post('/:id/leadership', requireAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.user.id !== userId) return res.status(403).json({ error: 'Unauthorized' });

    const { organization, role, start_date, end_date, responsibilities, achievements } = req.body;
    if (!organization || !role) {
      return res.status(400).json({ error: 'Organization and role are required' });
    }

    query.run(`
      INSERT INTO student_leadership (user_id, organization, role, start_date, end_date, responsibilities, achievements)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, organization, role, start_date || '2025', end_date || 'Present', responsibilities || null, achievements || null]);

    res.status(201).json({ message: 'Leadership role added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add leadership role' });
  }
});

// GET structured resume data
router.get('/:id/resume', (req, res) => {
  try {
    const user = query.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Student not found' });

    const skills = query.all(`
      SELECT s.name, s.category, us.level
      FROM user_skills us
      JOIN skills s ON s.id = us.skill_id
      WHERE us.user_id = ?
    `, [user.id]);

    const projects = query.all('SELECT * FROM projects WHERE user_id = ?', [user.id]);
    const achievements = query.all('SELECT * FROM achievements WHERE user_id = ? AND verification_status = "VERIFIED"', [user.id]);
    const research = query.all('SELECT * FROM research_papers WHERE user_id = ?', [user.id]);
    const internships = query.all('SELECT * FROM student_internships WHERE user_id = ?', [user.id]);
    const leadership = query.all('SELECT * FROM student_leadership WHERE user_id = ?', [user.id]);

    res.json({
      education: {
        institution: 'Army Institute of Technology (AIT), Pune',
        degree: 'Bachelor of Engineering (B.E.)',
        branch: user.branch,
        year: user.year,
        duration: `${2026 - (user.year - 1)} - ${2026 + (4 - user.year)}`
      },
      personal: {
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        github: user.github_url,
        linkedin: user.linkedin_url,
        portfolio: user.portfolio_url,
        bio: user.bio
      },
      skills,
      projects,
      achievements,
      research,
      internships,
      leadership
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate resume data' });
  }
});

export default router;
