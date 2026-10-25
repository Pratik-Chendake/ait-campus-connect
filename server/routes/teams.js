import express from 'express';
import { query } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all teams for an event or student
router.get('/', (req, res) => {
  try {
    const { event_id, user_id } = req.query;

    let sql = `
      SELECT t.*, e.title as event_title, e.category as event_category, e.event_start_date,
             u.full_name as leader_name, u.avatar_url as leader_avatar,
             (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as current_members
      FROM teams t
      JOIN events e ON e.id = t.event_id
      JOIN users u ON u.id = t.leader_id
      WHERE 1=1
    `;
    const params = [];

    if (event_id) {
      sql += ' AND t.event_id = ?';
      params.push(event_id);
    }

    if (user_id) {
      sql += ' AND t.id IN (SELECT team_id FROM team_members WHERE user_id = ?)';
      params.push(user_id);
    }

    sql += ' ORDER BY t.created_at DESC';

    const teams = query.all(sql, params);
    res.json({ teams });
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// GET single team details
router.get('/:id', (req, res) => {
  try {
    const teamId = req.params.id;
    const team = query.get(`
      SELECT t.*, e.title as event_title, e.category as event_category,
             e.team_size_max, e.event_start_date, e.registration_deadline,
             u.full_name as leader_name, u.email as leader_email, u.avatar_url as leader_avatar
      FROM teams t
      JOIN events e ON e.id = t.event_id
      JOIN users u ON u.id = t.leader_id
      WHERE t.id = ?
    `, [teamId]);

    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Members
    const members = query.all(`
      SELECT tm.id as membership_id, tm.role_in_team, tm.joined_at,
             u.id as user_id, u.full_name, u.email, u.student_id, u.branch, u.year, u.avatar_url,
             u.contribution_score
      FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = ?
      ORDER BY tm.id ASC
    `, [teamId]);

    // Attach skills to each member
    const membersWithSkills = members.map(m => {
      const skills = query.all(`
        SELECT s.name FROM user_skills us
        JOIN skills s ON s.id = us.skill_id
        WHERE us.user_id = ?
        LIMIT 4
      `, [m.user_id]);
      return { ...m, skills: skills.map(s => s.name) };
    });

    // Pending invitations sent by this team
    const invitations = query.all(`
      SELECT ti.*, u.full_name as invitee_name, u.avatar_url as invitee_avatar
      FROM team_invitations ti
      JOIN users u ON u.id = ti.invitee_id
      WHERE ti.team_id = ? AND ti.status = 'PENDING'
    `, [teamId]);

    res.json({
      team,
      members: membersWithSkills,
      invitations
    });
  } catch (err) {
    console.error('Error fetching team detail:', err);
    res.status(500).json({ error: 'Failed to fetch team details' });
  }
});

// POST create team
router.post('/', requireAuth, (req, res) => {
  try {
    const { event_id, name, description, required_skills, max_members, leader_role } = req.body;

    if (!event_id || !name) {
      return res.status(400).json({ error: 'Event ID and team name are required' });
    }

    const event = query.get('SELECT * FROM events WHERE id = ?', [event_id]);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check if user already in a team for this event
    const existingMembership = query.get(`
      SELECT tm.id FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.event_id = ? AND tm.user_id = ?
    `, [event_id, req.user.id]);

    if (existingMembership) {
      return res.status(400).json({ error: 'You are already part of a team for this event' });
    }

    const result = query.run(`
      INSERT INTO teams (event_id, name, leader_id, description, required_skills, max_members, status)
      VALUES (?, ?, ?, ?, ?, ?, 'FORMING')
    `, [
      event_id, name, req.user.id, description || null,
      required_skills || 'React, Python, Design',
      max_members || event.team_size_max || 4
    ]);

    const teamId = result.lastInsertRowid;

    // Insert leader as first team member
    query.run(`
      INSERT INTO team_members (team_id, user_id, role_in_team)
      VALUES (?, ?, ?)
    `, [teamId, req.user.id, leader_role || 'Team Leader']);

    res.status(201).json({ message: 'Team created successfully', team_id: teamId });
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// GET Team Matching Algorithm (Section 17: Calculate Compatibility Score %)
router.get('/match/candidates', requireAuth, (req, res) => {
  try {
    const { event_id, required_skills, preferred_role, branch } = req.query;

    const reqSkillsArr = required_skills
      ? required_skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      : ['python', 'react', 'machine learning'];

    // Get all students excluding current user, with optional branch filter
    let studentsSql = `
      SELECT u.id, u.full_name, u.student_id, u.branch, u.year, u.avatar_url, u.bio,
             u.contribution_score
      FROM users u
      WHERE u.role = 'STUDENT' AND u.id != ?
    `;
    const params = [req.user.id];

    if (branch && branch !== 'All' && branch !== 'ALL') {
      studentsSql += ' AND u.branch = ?';
      params.push(branch);
    }

    const students = query.all(studentsSql, params);

    const candidates = students.map(student => {
      // Get student's skills
      const studentSkills = query.all(`
        SELECT s.name, us.level
        FROM user_skills us
        JOIN skills s ON s.id = us.skill_id
        WHERE us.user_id = ?
      `, [student.id]);

      const skillNames = studentSkills.map(s => s.name.toLowerCase());

      // 1. Skill Overlap Score (up to 50 points)
      let matchedCount = 0;
      reqSkillsArr.forEach(reqSkill => {
        if (skillNames.some(sn => sn.includes(reqSkill) || reqSkill.includes(sn))) {
          matchedCount++;
        }
      });
      const skillScore = reqSkillsArr.length > 0 ? (matchedCount / reqSkillsArr.length) * 50 : 25;

      // 2. Verified achievements bonus (up to 25 points)
      const achCount = query.get("SELECT COUNT(*) as count FROM achievements WHERE user_id = ? AND verification_status = 'VERIFIED'", [student.id]);
      const achScore = Math.min(25, (achCount ? achCount.count : 0) * 8);

      // 3. Contribution / Activity score (up to 20 points)
      const activityScore = Math.min(20, Math.round((student.contribution_score || 0) / 10));

      // 4. Base compatibility
      const baseScore = 5;

      const totalScore = Math.min(98, Math.round(skillScore + achScore + activityScore + baseScore));

      // Get top achievements
      const topAch = query.get(`
        SELECT title, position, event_name
        FROM achievements
        WHERE user_id = ? AND verification_status = 'VERIFIED'
        ORDER BY is_highlight DESC, id DESC LIMIT 1
      `, [student.id]);

      return {
        ...student,
        match_score: Math.max(45, totalScore), // Realistic compatibility rating
        matched_skills: studentSkills.filter(s => reqSkillsArr.some(rs => s.name.toLowerCase().includes(rs))),
        all_skills: studentSkills,
        top_achievement: topAch || null
      };
    });

    // Sort candidates by match_score descending
    candidates.sort((a, b) => b.match_score - a.match_score);

    res.json({ candidates });
  } catch (err) {
    console.error('Error calculating candidate match:', err);
    res.status(500).json({ error: 'Failed to compute candidate matches' });
  }
});

// POST send team invitation
router.post('/:id/invite', requireAuth, (req, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const { invitee_id, role_offered, message } = req.body;

    const team = query.get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (team.leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the team leader can send invitations' });
    }

    // Check if user is already a member
    const existingMember = query.get('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, invitee_id]);
    if (existingMember) return res.status(400).json({ error: 'Student is already on this team' });

    // Insert invitation
    query.run(`
      INSERT INTO team_invitations (team_id, inviter_id, invitee_id, role_offered, message, status)
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `, [teamId, req.user.id, invitee_id, role_offered || 'Teammate', message || `Join team ${team.name}`]);

    // Send notification to invitee
    query.run(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Team Invitation Received! 🤝', ? || ' invited you to join team "' || ? || '" as ' || ? || '.', 'INVITATION', '/teams')
    `, [invitee_id, req.user.full_name, team.name, role_offered || 'Teammate']);

    res.status(201).json({ message: 'Invitation sent successfully' });
  } catch (err) {
    console.error('Error sending invitation:', err);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// POST respond to invitation (Accept or Reject)
router.post('/invitations/:invitationId/respond', requireAuth, (req, res) => {
  try {
    const invId = parseInt(req.params.invitationId, 10);
    const { action } = req.body; // 'ACCEPTED' or 'REJECTED'

    const invitation = query.get(`
      SELECT ti.*, t.name as team_name, t.leader_id, t.max_members,
             (SELECT COUNT(*) FROM team_members WHERE team_id = ti.team_id) as current_member_count
      FROM team_invitations ti
      JOIN teams t ON t.id = ti.team_id
      WHERE ti.id = ?
    `, [invId]);

    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
    if (invitation.invitee_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    if (action === 'ACCEPTED') {
      if (invitation.current_member_count >= invitation.max_members) {
        return res.status(400).json({ error: 'Team has already reached its maximum capacity' });
      }

      // Add to team_members
      query.run(`
        INSERT OR IGNORE INTO team_members (team_id, user_id, role_in_team)
        VALUES (?, ?, ?)
      `, [invitation.team_id, req.user.id, invitation.role_offered || 'Member']);

      // Update invitation status
      query.run('UPDATE team_invitations SET status = "ACCEPTED" WHERE id = ?', [invId]);

      // Notify team leader
      query.run(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Team Invitation Accepted! 🎉', ? || ' joined team "' || ? || '" as ' || ? || '.', 'INVITATION', '/teams/' || ?)
      `, [invitation.leader_id, req.user.full_name, invitation.team_name, invitation.role_offered, invitation.team_id]);

      res.json({ message: `Successfully joined ${invitation.team_name}!`, team_id: invitation.team_id });
    } else {
      query.run('UPDATE team_invitations SET status = "REJECTED" WHERE id = ?', [invId]);
      res.json({ message: 'Invitation declined' });
    }
  } catch (err) {
    console.error('Error responding to invitation:', err);
    res.status(500).json({ error: 'Failed to process invitation response' });
  }
});

// GET pending invitations for the logged in user
router.get('/my/invitations', requireAuth, (req, res) => {
  try {
    const invitations = query.all(`
      SELECT ti.*, t.name as team_name, e.title as event_title, u.full_name as inviter_name, u.avatar_url as inviter_avatar
      FROM team_invitations ti
      JOIN teams t ON t.id = ti.team_id
      JOIN events e ON e.id = t.event_id
      JOIN users u ON u.id = ti.inviter_id
      WHERE ti.invitee_id = ? AND ti.status = 'PENDING'
      ORDER BY ti.created_at DESC
    `, [req.user.id]);

    res.json({ invitations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your invitations' });
  }
});

export default router;
