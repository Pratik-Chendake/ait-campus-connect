import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/database.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { supabaseAdmin, supabasePublic, isSupabaseConfigured } from '../services/opportunities/supabaseClient.js';

const router = express.Router();

// In-memory rate-limiter map to prevent transactional email spam & bounce warnings
const passwordResetCooldowns = new Map();

// Helper to compute dynamic profile completion percentage
export function calculateProfileCompletion(user) {
  let score = 0;
  const checks = [
    Boolean(user.full_name),
    Boolean(user.student_id),
    Boolean(user.email),
    Boolean(user.branch),
    Boolean(user.year),
    Boolean(user.avatar_url),
    Boolean(user.bio && user.bio.length > 20),
    Boolean(user.github_url || user.linkedin_url || user.portfolio_url),
  ];

  checks.forEach(passed => {
    if (passed) score += 8; // 64% base
  });

  // Check skills
  const skills = query.all('SELECT id FROM user_skills WHERE user_id = ?', [user.id]);
  if (skills.length > 0) score += 12;

  // Check projects or achievements
  const projects = query.all('SELECT id FROM projects WHERE user_id = ?', [user.id]);
  if (projects.length > 0) score += 12;

  const achievements = query.all('SELECT id FROM achievements WHERE user_id = ?', [user.id]);
  if (achievements.length > 0) score += 12;

  return Math.min(100, score);
}

// GET institutional domain setting
router.get('/domain', (req, res) => {
  const setting = query.get("SELECT value FROM platform_settings WHERE key = 'institutional_domain'");
  res.json({ domain: setting ? setting.value : '@aitpune.edu.in' });
});

// =============================================================================
// Canonical AIT Engineering Branches
const CANONICAL_BRANCHES = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Automation & Robotics'
];

// POST /signup — Primary Gmail + Website Password Student Registration
// =============================================================================
router.post('/signup', async (req, res) => {
  try {
    const { email, password, branch } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your email and password.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 2. Validate Gmail format specifically
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid Gmail address (e.g. student@gmail.com).' });
    }

    // 3. Validate password requirements
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // 4. Validate or fallback branch
    const selectedBranch = CANONICAL_BRANCHES.includes(branch) ? branch : 'Computer Engineering';

    // 5. Prevent duplicate registration
    const existing = query.get('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this Gmail address already exists. Please log in.' });
    }

    // 6. Call Supabase Auth to register identity in Supabase (if configured)
    let supabaseUid = null;
    if (isSupabaseConfigured()) {
      try {
        const { data: supaData, error: supaErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true, // Prevents email bounce warnings on unconfirmed test addresses
          user_metadata: {
            role: 'student',
            branch: selectedBranch,
            registered_at: new Date().toISOString()
          }
        });
        if (supaData?.user) {
          supabaseUid = supaData.user.id;
        } else if (supaErr) {
          console.warn('Supabase Auth registration note:', supaErr.message);
        }
      } catch (err) {
        console.warn('Supabase Auth connection fallback:', err.message);
      }
    }

    // 7. Automatically assign the Student role (Never public admin)
    const assignedRole = 'STUDENT';
    const passwordHash = bcrypt.hashSync(password, 10);
    const usernamePart = cleanEmail.split('@')[0];
    const formattedName = usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1);

    const result = query.run(`
      INSERT INTO users (
        full_name, email, password_hash, role, status, auth_provider, supabase_uid,
        branch, avatar_url, bio, contribution_score, profile_visibility
      ) VALUES (?, ?, ?, ?, 'ACTIVE', 'SUPABASE_AUTH', ?, ?, ?, ?, 0, 'PUBLIC')
    `, [
      formattedName,
      cleanEmail,
      passwordHash,
      assignedRole,
      supabaseUid,
      selectedBranch,
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
      'Student at Army Institute of Technology, Pune.'
    ]);

    const newUserId = result.lastInsertRowid;

    // 7. Track role assignment
    try {
      query.run(`
        INSERT INTO user_roles (user_id, role)
        VALUES (?, ?)
        ON CONFLICT(user_id, role) DO NOTHING
      `, [newUserId, assignedRole]);
    } catch (e) {}

    // 8. Record Activity Log
    try {
      query.run(`
        INSERT INTO activity_logs (user_id, actor_email, action, target_type, target_id, details)
        VALUES (?, ?, 'ACCOUNT_CREATED', 'USER', ?, ?)
      `, [
        newUserId,
        cleanEmail,
        String(newUserId),
        JSON.stringify({
          provider: 'SUPABASE_AUTH',
          supabase_uid: supabaseUid,
          assigned_role: assignedRole,
          timestamp: new Date().toISOString()
        })
      ]);
    } catch (e) {}

    // 9. Send welcome notification
    try {
      query.run(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Welcome to AIT Campus Connect!', 'Your student account is active. Explore hackathons, join clubs, and showcase your achievements.', 'SYSTEM', '/student/dashboard')
      `, [newUserId]);
    } catch (e) {}

    const newUser = query.get('SELECT id, student_id, full_name, email, role, status, branch, year, semester, avatar_url, bio, contribution_score, profile_visibility FROM users WHERE id = ?', [newUserId]);
    const token = signToken(newUser);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        ...newUser,
        profile_completion: calculateProfileCompletion(newUser)
      }
    });
  } catch (err) {
    console.error('Sign-up error:', err);
    res.status(500).json({ error: 'Internal server error during account creation.' });
  }
});

// =============================================================================
// POST /register — Extended Multi-Field Registration (Preserved for compatibility)
// =============================================================================
router.post('/register', async (req, res) => {
  try {
    const {
      full_name, student_id, email, personal_email, password,
      branch, year, semester, phone
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check existing email or student_id
    const existing = query.get('SELECT id FROM users WHERE LOWER(email) = ? OR (student_id IS NOT NULL AND student_id = ?)', [cleanEmail, student_id || '']);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email or Student ID already exists' });
    }

    // Call Supabase Auth to register identity in Supabase (if configured)
    let supabaseUid = null;
    if (isSupabaseConfigured()) {
      try {
        const { data: supaData } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            full_name,
            role: 'student',
            branch: branch || 'Computer Engineering',
            student_id: student_id || null,
            registered_at: new Date().toISOString()
          }
        });
        if (supaData?.user) {
          supabaseUid = supaData.user.id;
          try {
            await supabaseAdmin.from('profiles').upsert({
              id: supaData.user.id,
              email: cleanEmail,
              full_name,
              branch: branch || 'Computer Engineering',
              student_id: student_id || null,
              account_status: 'ACTIVE'
            });
            await supabaseAdmin.from('user_roles').upsert({
              user_id: supaData.user.id,
              role: 'student'
            });
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Supabase Auth connection fallback (/register):', err.message);
      }
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = query.run(`
      INSERT INTO users (
        student_id, full_name, email, personal_email, password_hash, role, status, auth_provider, supabase_uid,
        branch, year, semester, phone, avatar_url, bio, contribution_score, profile_visibility
      ) VALUES (?, ?, ?, ?, ?, 'STUDENT', 'ACTIVE', 'SUPABASE_AUTH', ?, ?, ?, ?, ?, ?, ?, 0, 'PUBLIC')
    `, [
      student_id || null, full_name, cleanEmail, personal_email || null, password_hash, supabaseUid,
      branch || 'Computer Engineering', year || 1, semester || 1, phone || null,
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
      'Student at Army Institute of Technology, Pune.'
    ]);

    const newUser = query.get('SELECT id, student_id, full_name, email, role, status, branch, year, semester, avatar_url, bio, contribution_score, profile_visibility FROM users WHERE id = ?', [result.lastInsertRowid]);
    const token = signToken(newUser);

    // Create welcome notification
    query.run(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Welcome to AIT Campus Connect!', 'Start building your professional AIT identity. Complete your profile and discover upcoming hackathons.', 'SYSTEM', '/student/dashboard')
    `, [newUser.id]);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        ...newUser,
        profile_completion: calculateProfileCompletion(newUser)
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// =============================================================================
// POST /login — Universal Four-Role Login
// =============================================================================
router.post('/login', (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const inputIdentifier = (email || identifier || '').trim();

    if (!inputIdentifier || !password) {
      return res.status(400).json({ error: 'Please enter your email and password.' });
    }

    const user = query.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR student_id = ?', [inputIdentifier, inputIdentifier]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Your account is currently unavailable. Contact the administrator.' });
    }

    // Verify password
    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Record login activity
    try {
      query.run(`
        INSERT INTO activity_logs (user_id, actor_email, action, target_type, target_id, details)
        VALUES (?, ?, 'LOGIN_SUCCESS', 'USER', ?, ?)
      `, [
        user.id,
        user.email,
        String(user.id),
        JSON.stringify({ role: user.role, timestamp: new Date().toISOString() })
      ]);
    } catch (e) {}

    const safeUser = {
      id: user.id,
      student_id: user.student_id,
      full_name: user.full_name,
      email: user.email,
      personal_email: user.personal_email,
      role: user.role,
      status: user.status || 'ACTIVE',
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
      profile_visibility: user.profile_visibility
    };

    const token = signToken(safeUser);
    res.json({
      message: 'Login successful',
      token,
      user: {
        ...safeUser,
        profile_completion: calculateProfileCompletion(safeUser)
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// =============================================================================
// POST /quick-login — Instant Evaluation Role Switcher
// =============================================================================
router.post('/quick-login', (req, res) => {
  try {
    const { role } = req.body;
    const normalizedRole = (role || '').toUpperCase();
    let user;
    if (normalizedRole === 'STUDENT') {
      user = query.get('SELECT * FROM users WHERE email = ?', ['rahul.sharma@aitpune.edu.in']) ||
             query.get("SELECT * FROM users WHERE role = 'STUDENT' LIMIT 1");
    } else if (normalizedRole === 'ORGANIZER') {
      user = query.get('SELECT * FROM users WHERE email = ?', ['gdsc@aitpune.edu.in']) ||
             query.get("SELECT * FROM users WHERE role = 'ORGANIZER' LIMIT 1");
    } else if (normalizedRole === 'FACULTY') {
      user = query.get('SELECT * FROM users WHERE email = ?', ['dr.patil@aitpune.edu.in']);
    } else if (normalizedRole === 'ADMIN') {
      user = query.get('SELECT * FROM users WHERE email = ?', ['admin@aitpune.edu.in']) ||
             query.get("SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1");
    } else if (normalizedRole === 'SUPER_ADMIN') {
      user = query.get('SELECT * FROM users WHERE role = ? OR email = ?', ['SUPER_ADMIN', 'superadmin@gmail.com']);
    } else {
      user = query.get('SELECT * FROM users WHERE id = ?', [req.body.id || 1]);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found for quick login' });
    }

    const safeUser = {
      id: user.id,
      student_id: user.student_id,
      full_name: user.full_name,
      email: user.email,
      personal_email: user.personal_email,
      role: user.role,
      status: user.status || 'ACTIVE',
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
      profile_visibility: user.profile_visibility
    };

    const token = signToken(safeUser);
    res.json({
      message: `Switched to ${safeUser.full_name} (${safeUser.role})`,
      token,
      user: {
        ...safeUser,
        profile_completion: calculateProfileCompletion(safeUser)
      }
    });
  } catch (err) {
    console.error('Quick login error:', err);
    res.status(500).json({ error: 'Quick login failed' });
  }
});

// =============================================================================
// POST /forgot-password — Supabase Email Recovery with Rate Limiting Safeguards
// =============================================================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please enter your registered Gmail address.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check rate-limiting cooldown (60s) to prevent transactional email bounce spam
    const lastSent = passwordResetCooldowns.get(cleanEmail);
    const now = Date.now();
    if (lastSent && now - lastSent < 60000) {
      // Return safe message without re-triggering outbound mailer
      return res.json({
        message: 'If an account exists with this Gmail address, password recovery instructions have been sent.'
      });
    }

    // Check if user exists in local database
    const user = query.get('SELECT id, email FROM users WHERE LOWER(email) = ?', [cleanEmail]);

    if (user) {
      // Record cooldown
      passwordResetCooldowns.set(cleanEmail, now);

      // Record activity
      try {
        query.run(`
          INSERT INTO activity_logs (user_id, actor_email, action, details)
          VALUES (?, ?, 'PASSWORD_RESET_REQUESTED', ?)
        `, [user.id, cleanEmail, JSON.stringify({ requested_at: new Date().toISOString() })]);
      } catch (e) {}

      // Trigger Supabase password recovery email only if live project is configured
      if (isSupabaseConfigured()) {
        try {
          await supabasePublic.auth.resetPasswordForEmail(cleanEmail);
        } catch (e) {
          console.warn('Supabase reset password email warning:', e.message);
        }
      }
    }

    // Always return safe confirmation message to avoid email enumeration
    res.json({
      message: 'If an account exists with this Gmail address, password recovery instructions have been sent.'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password recovery request.' });
  }
});

// =============================================================================
// GET /me — Current Authenticated Profile & Notifications
// =============================================================================
router.get('/me', requireAuth, (req, res) => {
  const user = query.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const unreadNotifs = query.get('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [user.id]);

  const safeUser = {
    id: user.id,
    student_id: user.student_id,
    full_name: user.full_name,
    email: user.email,
    personal_email: user.personal_email,
    role: user.role,
    status: user.status || 'ACTIVE',
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
    unread_notifications: unreadNotifs ? unreadNotifs.count : 0,
    profile_completion: calculateProfileCompletion(user)
  };

  res.json({ user: safeUser });
});

export default router;
