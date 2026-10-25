import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { initScholarshipSchema } from '../services/scholarships/scholarshipSchema.js';
import { seedScholarshipsData } from '../services/scholarships/seedScholarships.js';
import { seedInternshipsData } from '../services/internships/seedInternships.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDbDir = path.join(__dirname, '..', 'data');
const dbDir = process.env.DATA_DIR || defaultDbDir;
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'ait_campus_connect.db');

// If running in production with a separate volume (e.g., Railway /data) and the persistent database
// file does not exist yet, copy the bundled baseline database so all existing records are preserved.
const localBundledDb = path.join(defaultDbDir, 'ait_campus_connect.db');
if (path.resolve(dbPath) !== path.resolve(localBundledDb) && !fs.existsSync(dbPath) && fs.existsSync(localBundledDb)) {
  try {
    fs.copyFileSync(localBundledDb, dbPath);
    console.log(`✓ Initialized production database on persistent storage: ${dbPath}`);
  } catch (err) {
    console.warn(`Notice: Could not pre-copy database to ${dbPath}:`, err.message);
  }
}

const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      personal_email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STUDENT', -- 'STUDENT', 'ORGANIZER', 'FACULTY', 'ADMIN'
      branch TEXT,                          -- 'Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering'
      year INTEGER,                         -- 1, 2, 3, 4
      semester INTEGER,                     -- 1 to 8
      phone TEXT,
      avatar_url TEXT,
      bio TEXT,
      github_url TEXT,
      linkedin_url TEXT,
      portfolio_url TEXT,
      contribution_score INTEGER DEFAULT 0,
      profile_visibility TEXT DEFAULT 'PUBLIC', -- 'PUBLIC', 'AIT_ONLY', 'PRIVATE'
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL DEFAULT 'Technical'
    );

    CREATE TABLE IF NOT EXISTS user_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      level TEXT DEFAULT 'Intermediate', -- 'Beginner', 'Intermediate', 'Advanced', 'Expert'
      is_verified INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(user_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      about TEXT,
      logo_url TEXT,
      banner_url TEXT,
      instagram_url TEXT,
      website_url TEXT,
      contact_email TEXT,
      lead_name TEXT,
      lead_role TEXT,
      faculty_advisor TEXT,
      founded_year INTEGER,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS club_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'Follower', -- 'Head', 'Secretary', 'Lead', 'Core Member', 'Volunteer', 'Follower'
      duration TEXT,
      joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(club_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL, -- 'Hackathon', 'Coding', 'Robotics', 'Cultural', 'Sports', 'Workshop', 'Conference', 'Seminar', 'Competition'
      club_id INTEGER,
      organizer_name TEXT NOT NULL,
      organizer_id INTEGER,
      description TEXT NOT NULL,
      problem_statement TEXT,
      banner_url TEXT,
      mode TEXT NOT NULL DEFAULT 'In-Person', -- 'In-Person', 'Online', 'Hybrid'
      venue TEXT NOT NULL,
      prize_pool TEXT,
      team_size_min INTEGER DEFAULT 1,
      team_size_max INTEGER DEFAULT 1,
      eligibility TEXT,
      rules TEXT,
      evaluation_criteria TEXT,
      registration_deadline TEXT NOT NULL,
      event_start_date TEXT NOT NULL,
      event_end_date TEXT NOT NULL,
      status TEXT DEFAULT 'PUBLISHED', -- 'PENDING_APPROVAL', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'ARCHIVED'
      capacity INTEGER,
      results_published INTEGER DEFAULT 0,
      result_summary TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL,
      FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      leader_id INTEGER NOT NULL,
      description TEXT,
      required_skills TEXT,
      max_members INTEGER DEFAULT 4,
      status TEXT DEFAULT 'FORMING', -- 'FORMING', 'LOCKED', 'SUBMITTED'
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role_in_team TEXT DEFAULT 'Member',
      joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(team_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS team_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      inviter_id INTEGER NOT NULL,
      invitee_id INTEGER NOT NULL,
      role_offered TEXT,
      message TEXT,
      status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_number TEXT UNIQUE NOT NULL,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      team_id INTEGER,
      status TEXT DEFAULT 'REGISTERED', -- 'REGISTERED', 'ATTENDED', 'COMPLETED', 'CANCELLED'
      custom_answers TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER,
      title TEXT NOT NULL,
      event_name TEXT NOT NULL,
      organization TEXT NOT NULL,
      category TEXT NOT NULL, -- 'Hackathon', 'Competition', 'Sports', 'Cultural', 'Research', 'Academic', 'Leadership', 'Social'
      level TEXT NOT NULL,    -- 'Class', 'Department', 'College', 'Inter-college', 'University', 'State', 'National', 'International'
      position TEXT NOT NULL, -- 'Winner (1st)', '1st Runner-up (2nd)', '2nd Runner-up (3rd)', 'Finalist', 'Special Mention', 'Participant'
      date TEXT NOT NULL,
      description TEXT,
      certificate_url TEXT,
      proof_doc_url TEXT,
      verification_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
      verified_by INTEGER,
      verified_at TEXT,
      rejection_reason TEXT,
      is_highlight INTEGER DEFAULT 0,
      points_awarded INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
      FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      credential_id TEXT,
      file_url TEXT NOT NULL,
      category TEXT NOT NULL, -- 'Winner', 'Participation', 'Workshop', 'Course', 'Internship', 'Sports', 'Cultural'
      is_public INTEGER DEFAULT 0,
      verification_status TEXT DEFAULT 'PENDING',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      problem_statement TEXT,
      solution TEXT,
      tech_stack TEXT NOT NULL,
      github_url TEXT,
      demo_url TEXT,
      banner_url TEXT,
      team_members TEXT,
      completed_date TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS research_papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      authors TEXT NOT NULL,
      research_area TEXT NOT NULL,
      conference_or_journal TEXT NOT NULL,
      is_ieee INTEGER DEFAULT 0,
      status TEXT DEFAULT 'PUBLISHED', -- 'PUBLISHED', 'UNDER_REVIEW', 'PRESENTED'
      publication_date TEXT NOT NULL,
      doi TEXT,
      url TEXT,
      abstract TEXT,
      pdf_url TEXT,
      verification_status TEXT DEFAULT 'PENDING',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS internships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      location TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'Hybrid', -- 'Remote', 'On-site', 'Hybrid'
      stipend TEXT,
      duration TEXT,
      skills_required TEXT,
      eligibility TEXT,
      deadline TEXT NOT NULL,
      apply_url TEXT,
      description TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scholarships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      amount TEXT NOT NULL,
      eligibility TEXT NOT NULL,
      eligible_branches TEXT,
      eligible_years TEXT,
      deadline TEXT NOT NULL,
      required_documents TEXT,
      apply_url TEXT,
      description TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_internships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      location TEXT NOT NULL,
      mode TEXT DEFAULT 'On-site',
      start_date TEXT NOT NULL,
      end_date TEXT,
      description TEXT,
      skills_used TEXT,
      certificate_url TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      credential_id TEXT,
      issue_date TEXT NOT NULL,
      expiry_date TEXT,
      verification_url TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_sports_cultural (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'SPORTS', 'CULTURAL'
      activity TEXT NOT NULL,
      role_or_position TEXT,
      event_name TEXT NOT NULL,
      year INTEGER NOT NULL,
      achievement TEXT,
      certificate_url TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_leadership (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      organization TEXT NOT NULL,
      role TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      responsibilities TEXT,
      achievements TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'SYSTEM', -- 'INVITATION', 'VERIFICATION', 'EVENT', 'DEADLINE', 'ACHIEVEMENT', 'SYSTEM'
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_type TEXT NOT NULL, -- 'EVENT', 'HACKATHON', 'INTERNSHIP', 'SCHOLARSHIP', 'CLUB'
      item_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, item_type, item_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      reported_type TEXT NOT NULL,
      reported_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER,
      details TEXT,
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- =========================================================================
    -- RESEARCH INTEGRATION EXTENSIONS (AY 2026-27 & Historical Archive)
    -- =========================================================================

    -- Source & Evidence Records
    CREATE TABLE IF NOT EXISTS source_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_key TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      url_or_file TEXT NOT NULL,
      source_type TEXT NOT NULL, -- 'OFFICIAL_EVENT', 'INSTITUTIONAL', 'CLUB', 'INSTAGRAM', 'UPLOADED_HISTORICAL', 'SECONDARY_REPORT'
      publication_date TEXT,
      accessed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      academic_year TEXT,
      extracted_claim TEXT,
      notes TEXT,
      confidence TEXT DEFAULT 'HIGH',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- AY-Specific Club Leadership (Student, Faculty, Staff)
    CREATE TABLE IF NOT EXISTS club_leadership (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'STUDENT', -- 'STUDENT', 'FACULTY', 'STAFF'
      academic_year_start INTEGER NOT NULL DEFAULT 2026,
      academic_year_end INTEGER NOT NULL DEFAULT 2027,
      source_id INTEGER,
      primary_document_verified INTEGER DEFAULT 0,
      verification_status TEXT DEFAULT 'UNVERIFIED', -- 'VERIFIED', 'UNVERIFIED', 'PENDING'
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (source_id) REFERENCES source_records(id) ON DELETE SET NULL
    );

    -- Unified Opportunities (Hackathons, Open Source, Internships, Scholarships, Research, Recruitment)
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_key TEXT UNIQUE,
      title TEXT NOT NULL,
      opportunity_type TEXT NOT NULL, -- 'HACKATHON', 'COMPETITION', 'INTERNSHIP', 'JOB', 'SCHOLARSHIP', 'FELLOWSHIP', 'RESEARCH', 'OPEN_SOURCE_CONTRIBUTION', 'RECRUITMENT'
      club_id INTEGER,
      organizer TEXT NOT NULL,
      official_url TEXT,
      application_url TEXT,
      location_or_mode TEXT DEFAULT 'Online',
      stipend TEXT,
      paid_status TEXT DEFAULT 'UNSPECIFIED', -- 'PAID', 'UNPAID', 'NOT_AN_INTERNSHIP', 'UNSPECIFIED'
      eligibility TEXT,
      required_skills TEXT,
      apply_deadline TEXT,
      verification_status TEXT DEFAULT 'VERIFIED',
      last_checked_date TEXT,
      is_live TEXT DEFAULT 'LIVE',
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL
    );

    -- Historical Institutional Past Event Archive (AY 2025-26 and older)
    CREATE TABLE IF NOT EXISTS past_event_archives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_key TEXT UNIQUE NOT NULL,
      event_name TEXT NOT NULL,
      type TEXT NOT NULL,
      academic_year TEXT NOT NULL, -- e.g. '2025-26'
      organizing_club_id INTEGER,
      start_date TEXT NOT NULL,
      end_date TEXT,
      description TEXT,
      source_file TEXT,
      source_pages TEXT,
      evidence_kind TEXT,
      verification_status TEXT DEFAULT 'historical_document_reported',
      is_public INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizing_club_id) REFERENCES clubs(id) ON DELETE SET NULL
    );

    -- Admin Ingestion Review & Moderation Queue
    CREATE TABLE IF NOT EXISTS ingestion_review_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_key TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL, -- 'leadership', 'event', 'club_recruitment', 'training', 'volunteering', 'cultural', 'historical', 'competition', 'ctf'
      label TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT,
      source_citation TEXT,
      status TEXT DEFAULT 'PENDING_REVIEW', -- 'PENDING_REVIEW', 'APPROVED', 'REJECTED'
      reviewed_by INTEGER,
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Safe Column Additions for clubs table (idempotent migrations)
  const safeClubCols = [
    "ALTER TABLE clubs ADD COLUMN instagram_handle TEXT",
    "ALTER TABLE clubs ADD COLUMN academic_year TEXT DEFAULT '2026-27'",
    "ALTER TABLE clubs ADD COLUMN leadership_status TEXT DEFAULT 'not_verified_for_publication'",
    "ALTER TABLE clubs ADD COLUMN verification_status TEXT DEFAULT 'VERIFIED'",
    "ALTER TABLE clubs ADD COLUMN origin TEXT DEFAULT 'user_supplied_url'",
    "ALTER TABLE clubs ADD COLUMN publish_directory_entry INTEGER DEFAULT 1",
    "ALTER TABLE clubs ADD COLUMN publish_leadership INTEGER DEFAULT 0"
  ];
  for (const sql of safeClubCols) {
    try { db.exec(sql); } catch (e) {}
  }

  // Safe Column Additions for events table (idempotent migrations)
  const safeEventCols = [
    "ALTER TABLE events ADD COLUMN source_key TEXT",
    "ALTER TABLE events ADD COLUMN source_url TEXT",
    "ALTER TABLE events ADD COLUMN official_event_url TEXT",
    "ALTER TABLE events ADD COLUMN registration_status TEXT DEFAULT 'OPEN'",
    "ALTER TABLE events ADD COLUMN registration_mode TEXT DEFAULT 'INTERNAL'",
    "ALTER TABLE events ADD COLUMN academic_year TEXT DEFAULT '2026-27'",
    "ALTER TABLE events ADD COLUMN verification_status TEXT DEFAULT 'VERIFIED'",
    "ALTER TABLE events ADD COLUMN is_archive INTEGER DEFAULT 0"
  ];
  for (const sql of safeEventCols) {
    try { db.exec(sql); } catch (e) {}
  }

  // Safe Column Additions for opportunities table (Unstop sync extension)
  const safeOppCols = [
    "ALTER TABLE opportunities ADD COLUMN source TEXT DEFAULT 'UNSTOP'",
    "ALTER TABLE opportunities ADD COLUMN source_opportunity_id TEXT",
    "ALTER TABLE opportunities ADD COLUMN unstop_id TEXT",
    "ALTER TABLE opportunities ADD COLUMN banner_url TEXT",
    "ALTER TABLE opportunities ADD COLUMN description TEXT",
    "ALTER TABLE opportunities ADD COLUMN prize_pool TEXT",
    "ALTER TABLE opportunities ADD COLUMN prize_details TEXT",
    "ALTER TABLE opportunities ADD COLUMN eligibility_category TEXT DEFAULT 'ELIGIBLE'",
    "ALTER TABLE opportunities ADD COLUMN eligibility_reason TEXT",
    "ALTER TABLE opportunities ADD COLUMN registration_fee TEXT DEFAULT 'Free'",
    "ALTER TABLE opportunities ADD COLUMN team_min_size INTEGER DEFAULT 1",
    "ALTER TABLE opportunities ADD COLUMN team_max_size INTEGER DEFAULT 4",
    "ALTER TABLE opportunities ADD COLUMN mode TEXT DEFAULT 'Online'",
    "ALTER TABLE opportunities ADD COLUMN location TEXT",
    "ALTER TABLE opportunities ADD COLUMN domains TEXT",
    "ALTER TABLE opportunities ADD COLUMN rounds TEXT",
    "ALTER TABLE opportunities ADD COLUMN raw_data TEXT",
    "ALTER TABLE opportunities ADD COLUMN last_seen_at TEXT",
    "ALTER TABLE opportunities ADD COLUMN updated_at TEXT"
  ];
  for (const sql of safeOppCols) {
    try { db.exec(sql); } catch (e) {}
  }

  // Create opportunity_sync_runs and saved_opportunities in SQLite if not present
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS opportunity_sync_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_id TEXT UNIQUE NOT NULL,
        source TEXT NOT NULL DEFAULT 'UNSTOP',
        actor_id TEXT DEFAULT 'hipersoft/unstop-scraper',
        run_id TEXT,
        started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        finished_at TEXT,
        total_fetched INTEGER DEFAULT 0,
        inserted_records INTEGER DEFAULT 0,
        updated_records INTEGER DEFAULT 0,
        failed_records INTEGER DEFAULT 0,
        status TEXT DEFAULT 'RUNNING',
        error_summary TEXT,
        execution_metadata TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS saved_opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        opportunity_id TEXT NOT NULL,
        status TEXT DEFAULT 'SAVED',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, opportunity_id)
      );
    `);
  } catch (e) {}

  // Ensure internal campus events have registration_status = 'OPEN'
  try {
    db.exec("UPDATE events SET registration_status = 'OPEN' WHERE (registration_mode = 'INTERNAL' OR registration_mode IS NULL) AND slug != 'innerve-11-2027';");
  } catch (e) {}

  // Strict Academic Year 2026-27 Boundary Sync
  // AY 2026-27 runs from 1 July 2026 to 30 June 2027.
  // Events prior to 1 July 2026 belong strictly to Historical Archive (AY 2025-26 or earlier)
  try {
    db.exec(`
      UPDATE events
      SET academic_year = '2025-26', is_archive = 1
      WHERE event_start_date < '2026-07-01';

      UPDATE events
      SET academic_year = '2026-27', is_archive = 0
      WHERE event_start_date >= '2026-07-01' AND event_start_date <= '2027-06-30';

      UPDATE events
      SET academic_year = '2027-28', is_archive = 0
      WHERE event_start_date > '2027-06-30';
    `);
  } catch (e) {}

  db.exec(`

    -- Set default platform settings if not present
    INSERT OR IGNORE INTO platform_settings (key, value) VALUES
      ('institutional_domain', '@aitpune.edu.in'),
      ('points_verified_achievement', '10'),
      ('points_winner', '30'),
      ('points_finalist', '20'),
      ('points_research', '30'),
      ('points_leadership', '15'),
      ('points_participation', '5');
  `);

  // =========================================================================
  // FOUR-ROLE AUTHENTICATION & SUPABASE INTEGRATION EXTENSIONS
  // =========================================================================

  // Safe Column Additions for users table (status, supabase_uid, auth_provider)
  const safeUserCols = [
    "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE'",
    "ALTER TABLE users ADD COLUMN supabase_uid TEXT",
    "ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'LOCAL'"
  ];
  for (const sql of safeUserCols) {
    try { db.exec(sql); } catch (e) {}
  }

  // Create activity_logs, role_change_history, and user_roles tables
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        actor_email TEXT,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        details TEXT,
        ip_address TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS role_change_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        previous_role TEXT NOT NULL,
        new_role TEXT NOT NULL,
        changed_by INTEGER,
        changed_by_email TEXT,
        reason TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        assigned_by INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, role)
      );
    `);
  } catch (e) {}

  // Initial Super Admin Bootstrap (superadmin@gmail.com)
  try {
    const existingSuperAdmin = db.prepare("SELECT id FROM users WHERE role = 'SUPER_ADMIN' OR email = 'superadmin@gmail.com'").get();
    if (!existingSuperAdmin) {
      const hash = bcrypt.hashSync('SuperAdmin@123', 10);
      db.prepare(`
        INSERT INTO users (full_name, email, password_hash, role, status, auth_provider, avatar_url, bio, contribution_score)
        VALUES ('Campus Super Admin', 'superadmin@gmail.com', ?, 'SUPER_ADMIN', 'ACTIVE', 'LOCAL', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'Master Administrator for AIT Campus Connect Ecosystem.', 999)
      `).run(hash);
      console.log('✓ Bootstrapped initial Super Admin (superadmin@gmail.com)');
    }
  } catch (e) {}

  // Safe Column Additions for internships table
  const safeInternshipCols = [
    "ALTER TABLE internships ADD COLUMN category TEXT DEFAULT 'Software Development'",
    "ALTER TABLE internships ADD COLUMN company_logo_url TEXT",
    "ALTER TABLE internships ADD COLUMN stipend_amount INTEGER DEFAULT 0",
    "ALTER TABLE internships ADD COLUMN eligible_branches TEXT DEFAULT 'All'",
    "ALTER TABLE internships ADD COLUMN eligible_years TEXT DEFAULT 'All'",
    "ALTER TABLE internships ADD COLUMN responsibilities TEXT",
    "ALTER TABLE internships ADD COLUMN qualifications TEXT",
    "ALTER TABLE internships ADD COLUMN selection_process TEXT",
    "ALTER TABLE internships ADD COLUMN source_platform TEXT DEFAULT 'Official Portal'",
    "ALTER TABLE internships ADD COLUMN last_verified_at TEXT",
    "ALTER TABLE internships ADD COLUMN verification_status TEXT DEFAULT 'VERIFIED'"
  ];
  for (const sql of safeInternshipCols) {
    try { db.exec(sql); } catch (e) {}
  }

  // Create saved_internships table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS saved_internships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        internship_id INTEGER NOT NULL,
        status TEXT DEFAULT 'SAVED',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
        UNIQUE(user_id, internship_id)
      );
    `);
  } catch (e) {}

  // Initialize AIT Scholarship Connect schema & verified dataset
  try {
    initScholarshipSchema(db);
    seedScholarshipsData(db);
  } catch (err) {
    console.error('Error initializing scholarship schema:', err);
  }

  // Seed verified engineering internships dataset
  try {
    seedInternshipsData({
      run: (sql, params) => db.prepare(sql).run(...(params || [])),
      get: (sql, params) => db.prepare(sql).get(...(params || []))
    });
  } catch (err) {
    console.error('Error seeding internships:', err);
  }

  // =========================================================================
  // PERMANENT STUDENT ACHIEVEMENT & PARTICIPATION RECORD SYSTEM
  // =========================================================================
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS participation_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        event_id INTEGER,
        event_type TEXT NOT NULL DEFAULT 'CAMPUS_EVENT',
        title TEXT NOT NULL,
        organizer TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Technical',
        mode TEXT DEFAULT 'In-Person',
        location TEXT,
        event_date TEXT,
        event_end_date TEXT,
        registration_id TEXT,
        registration_status TEXT DEFAULT 'REGISTERED',
        participation_status TEXT DEFAULT 'REGISTERED',
        registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TEXT,
        completed_at TEXT,
        source_type TEXT DEFAULT 'PORTAL_REGISTRATION',
        verification_status TEXT DEFAULT 'OFFICIAL',
        team_id INTEGER,
        team_name TEXT,
        role_in_team TEXT DEFAULT 'Individual',
        project_title TEXT,
        project_repo_url TEXT,
        submission_url TEXT,
        notes TEXT,
        is_in_portfolio INTEGER DEFAULT 0,
        portfolio_visibility TEXT DEFAULT 'PUBLIC',
        display_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS participation_milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participation_id INTEGER NOT NULL,
        milestone_type TEXT NOT NULL,
        previous_status TEXT,
        new_status TEXT NOT NULL,
        round_name TEXT,
        occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        recorded_by INTEGER,
        recorded_by_name TEXT,
        evidence_url TEXT,
        notes TEXT,
        FOREIGN KEY (participation_id) REFERENCES participation_records(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS participation_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participation_id INTEGER NOT NULL,
        competition_id INTEGER,
        round_name TEXT DEFAULT 'Final',
        result_type TEXT NOT NULL,
        official_rank INTEGER,
        rank_category TEXT,
        score REAL,
        score_max REAL,
        feedback TEXT,
        verification_status TEXT DEFAULT 'VERIFIED',
        published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (participation_id) REFERENCES participation_records(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS participation_certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        participation_id INTEGER NOT NULL,
        issuer TEXT NOT NULL,
        certificate_type TEXT NOT NULL,
        credential_id TEXT UNIQUE,
        file_path TEXT NOT NULL,
        verification_url TEXT,
        issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        verification_status TEXT DEFAULT 'VERIFIED',
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (participation_id) REFERENCES participation_records(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS participation_audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL DEFAULT 'PARTICIPATION_RECORD',
        entity_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        performed_by INTEGER,
        performed_by_name TEXT,
        performed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reason TEXT NOT NULL,
        previous_values TEXT,
        new_values TEXT,
        FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_part_student ON participation_records(student_id);
      CREATE INDEX IF NOT EXISTS idx_part_event ON participation_records(event_id);
      CREATE INDEX IF NOT EXISTS idx_part_status ON participation_records(participation_status);
      CREATE INDEX IF NOT EXISTS idx_part_portfolio ON participation_records(student_id, is_in_portfolio);
      CREATE INDEX IF NOT EXISTS idx_milestone_part ON participation_milestones(participation_id);
      CREATE INDEX IF NOT EXISTS idx_result_part ON participation_results(participation_id);
      CREATE INDEX IF NOT EXISTS idx_cert_student ON participation_certificates(student_id);
      CREATE INDEX IF NOT EXISTS idx_cert_part ON participation_certificates(participation_id);
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON participation_audits(entity_type, entity_id);

      -- Hackathon & Achievement Evidence Search Verification Cache
      CREATE TABLE IF NOT EXISTS achievement_search_evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        achievement_id INTEGER NOT NULL,
        search_engine TEXT NOT NULL,
        query_used TEXT NOT NULL,
        results_count INTEGER DEFAULT 0,
        evidence_snippets TEXT,
        searched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_search_evidence_ach ON achievement_search_evidence(achievement_id);
    `);

    // Synchronize historical registrations into participation records seamlessly
    const unmigratedRegistrations = db.prepare(`
      SELECT er.*, e.title as event_title, e.category as event_category,
             e.organizer_name as event_organizer, e.mode as event_mode,
             e.venue as event_venue, e.event_start_date, e.event_end_date,
             t.name as team_name
      FROM event_registrations er
      JOIN events e ON e.id = er.event_id
      LEFT JOIN teams t ON t.id = er.team_id
      WHERE er.id NOT IN (
        SELECT COALESCE(registration_id, -1) FROM participation_records WHERE event_id IS NOT NULL
      )
    `).all();

    for (const reg of unmigratedRegistrations) {
      const existing = db.prepare('SELECT id FROM participation_records WHERE student_id = ? AND event_id = ?').get(reg.user_id, reg.event_id);
      if (!existing) {
        const partStatus = reg.status === 'ATTENDED' ? 'ATTENDANCE_CONFIRMED'
          : reg.status === 'COMPLETED' ? 'COMPLETED'
          : reg.status === 'CANCELLED' ? 'CANCELLED'
          : 'REGISTERED';

        const insertPart = db.prepare(`
          INSERT INTO participation_records (
            student_id, event_id, event_type, title, organizer, category,
            mode, location, event_date, event_end_date, registration_id,
            registration_status, participation_status, registered_at,
            confirmed_at, source_type, verification_status, team_id,
            team_name, role_in_team, is_in_portfolio
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PORTAL_REGISTRATION', 'OFFICIAL', ?, ?, ?, 0)
        `).run(
          reg.user_id, reg.event_id, reg.event_category || 'CAMPUS_EVENT',
          reg.event_title, reg.event_organizer || 'AIT Campus Connect',
          reg.event_category || 'Technical', reg.event_mode || 'In-Person',
          reg.event_venue || 'AIT Pune Campus', reg.event_start_date,
          reg.event_end_date, reg.registration_number, reg.status,
          partStatus, reg.created_at, reg.created_at,
          reg.team_id || null, reg.team_name || null,
          reg.team_id ? 'Member' : 'Individual'
        );

        const partId = insertPart.lastInsertRowid;

        // Log initial registration milestone
        db.prepare(`
          INSERT INTO participation_milestones (
            participation_id, milestone_type, previous_status, new_status,
            round_name, occurred_at, notes
          ) VALUES (?, 'REGISTRATION_CONFIRMED', NULL, 'REGISTERED', 'Official Portal Registration', ?, 'Initial student registration confirmed')
        `).run(partId, reg.created_at);

        // Check if there are existing achievements for this user and event
        const ach = db.prepare('SELECT * FROM achievements WHERE user_id = ? AND event_id = ?').get(reg.user_id, reg.event_id);
        if (ach) {
          const rankNum = ach.position?.includes('Winner (1st)') ? 1
            : ach.position?.includes('1st Runner-up (2nd)') ? 2
            : ach.position?.includes('2nd Runner-up (3rd)') ? 3
            : null;

          const resType = rankNum === 1 ? 'WINNER'
            : rankNum === 2 ? 'RUNNER_UP'
            : rankNum === 3 ? 'SECOND_RUNNER_UP'
            : ach.position?.includes('Finalist') ? 'FINALIST'
            : 'PARTICIPANT';

          db.prepare(`
            INSERT INTO participation_results (
              participation_id, competition_id, round_name, result_type,
              official_rank, rank_category, score, score_max, feedback, verification_status, published_at
            ) VALUES (?, ?, 'Grand Finale', ?, ?, ?, 95, 100, ?, 'VERIFIED', ?)
          `).run(partId, reg.event_id, resType, rankNum, ach.position, ach.description, ach.date || reg.created_at);

          // Update participation status
          const finalStatus = rankNum === 1 ? 'WINNER' : rankNum ? 'FINALIST' : 'COMPLETED';
          db.prepare('UPDATE participation_records SET participation_status = ?, completed_at = ?, is_in_portfolio = ? WHERE id = ?')
            .run(finalStatus, ach.date || reg.created_at, ach.is_highlight ? 1 : 0, partId);

          // Log milestone
          db.prepare(`
            INSERT INTO participation_milestones (
              participation_id, milestone_type, previous_status, new_status,
              round_name, occurred_at, notes
            ) VALUES (?, 'RESULT_PUBLISHED', 'REGISTERED', ?, 'Grand Finale Results', ?, ?)
          `).run(partId, finalStatus, ach.date || reg.created_at, `Official outcome: ${ach.position}`);

          // Certificate if present
          if (ach.certificate_url) {
            db.prepare(`
              INSERT OR IGNORE INTO participation_certificates (
                student_id, participation_id, issuer, certificate_type,
                credential_id, file_path, verification_url, issued_at, verification_status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED')
            `).run(
              reg.user_id, partId, ach.organization || 'AIT Pune',
              resType, `CERT-AIT-${partId}-${Math.floor(1000 + Math.random() * 9000)}`,
              ach.certificate_url, ach.certificate_url, ach.date || reg.created_at
            );
          }
        }
      }
    }
  } catch (err) {
    console.error('Error initializing participation records schema:', err);
  }

  console.log('Database initialized successfully at:', dbPath);
}

// Convenient helper wrappers
export const query = {
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },
  get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },
  run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },
  exec(sql) {
    return db.exec(sql);
  }
};

// Ensure database schema and migrations are initialized on module load
try {
  initDatabase();
} catch (e) {
  console.error('Error auto-initializing database:', e);
}

export default db;
