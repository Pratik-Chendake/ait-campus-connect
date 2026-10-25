/**
 * AIT Scholarship Connect — Database Schema & Migration Service
 * Initializes comprehensive tables for verified scholarships, rules, profiles,
 * saved trackers, activity logs, source citations, and admin audits.
 */

export function initScholarshipSchema(db) {
  // 1. Ensure scholarships table has all modern fields via PRAGMA migration
  db.exec(`
    CREATE TABLE IF NOT EXISTS scholarships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      title TEXT NOT NULL,
      name TEXT,
      provider TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'CENTRAL',
      subcategory TEXT DEFAULT 'GENERAL',
      academic_year TEXT NOT NULL DEFAULT '2026-27',
      description TEXT NOT NULL,
      benefits_summary TEXT,
      amount_min INTEGER DEFAULT 0,
      amount_max INTEGER DEFAULT 0,
      amount_display TEXT NOT NULL,
      education_level TEXT DEFAULT 'UG',
      eligible_branches TEXT DEFAULT 'All',
      eligible_years TEXT DEFAULT '1, 2, 3, 4',
      min_percentage REAL DEFAULT 0,
      max_income INTEGER DEFAULT 0,
      applicable_states TEXT DEFAULT 'ALL_INDIA',
      outside_state_study_allowed INTEGER DEFAULT 1,
      gender_restriction TEXT DEFAULT 'ANY',
      category_restriction TEXT DEFAULT 'ALL',
      defence_category TEXT DEFAULT 'NONE',
      application_type TEXT DEFAULT 'FRESH_AND_RENEWAL',
      application_open_at TEXT,
      application_close_at TEXT NOT NULL,
      institute_verification_deadline TEXT,
      official_application_url TEXT NOT NULL,
      apply_url TEXT,
      official_scheme_url TEXT,
      official_guideline_url TEXT,
      required_documents TEXT,
      who_can_apply TEXT,
      who_cannot_apply TEXT,
      application_procedure TEXT,
      status TEXT DEFAULT 'OPEN',
      verification_status TEXT DEFAULT 'VERIFIED',
      last_verified_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_featured INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safely check & alter existing columns if table previously existed with fewer columns
  const existingCols = db.prepare("PRAGMA table_info(scholarships)").all().map(c => c.name);

  const desiredCols = [
    { name: 'slug', def: 'TEXT' },
    { name: 'title', def: 'TEXT' },
    { name: 'category', def: "TEXT NOT NULL DEFAULT 'CENTRAL'" },
    { name: 'subcategory', def: "TEXT DEFAULT 'GENERAL'" },
    { name: 'academic_year', def: "TEXT NOT NULL DEFAULT '2026-27'" },
    { name: 'benefits_summary', def: 'TEXT' },
    { name: 'amount_min', def: 'INTEGER DEFAULT 0' },
    { name: 'amount_max', def: 'INTEGER DEFAULT 0' },
    { name: 'amount_display', def: "TEXT DEFAULT '₹40,000 / year'" },
    { name: 'education_level', def: "TEXT DEFAULT 'UG'" },
    { name: 'min_percentage', def: 'REAL DEFAULT 0' },
    { name: 'max_income', def: 'INTEGER DEFAULT 0' },
    { name: 'applicable_states', def: "TEXT DEFAULT 'ALL_INDIA'" },
    { name: 'outside_state_study_allowed', def: 'INTEGER DEFAULT 1' },
    { name: 'gender_restriction', def: "TEXT DEFAULT 'ANY'" },
    { name: 'category_restriction', def: "TEXT DEFAULT 'ALL'" },
    { name: 'defence_category', def: "TEXT DEFAULT 'NONE'" },
    { name: 'application_type', def: "TEXT DEFAULT 'FRESH_AND_RENEWAL'" },
    { name: 'application_open_at', def: 'TEXT' },
    { name: 'application_close_at', def: 'TEXT' },
    { name: 'institute_verification_deadline', def: 'TEXT' },
    { name: 'official_application_url', def: 'TEXT' },
    { name: 'official_scheme_url', def: 'TEXT' },
    { name: 'official_guideline_url', def: 'TEXT' },
    { name: 'who_can_apply', def: 'TEXT' },
    { name: 'who_cannot_apply', def: 'TEXT' },
    { name: 'application_procedure', def: 'TEXT' },
    { name: 'status', def: "TEXT DEFAULT 'OPEN'" },
    { name: 'verification_status', def: "TEXT DEFAULT 'VERIFIED'" },
    { name: 'last_verified_at', def: 'TEXT' },
    { name: 'is_featured', def: 'INTEGER DEFAULT 0' },
    { name: 'updated_at', def: 'TEXT' }
  ];

  for (const col of desiredCols) {
    if (!existingCols.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE scholarships ADD COLUMN ${col.name} ${col.def};`);
      } catch (err) {
        console.warn(`Note adding column ${col.name} to scholarships:`, err.message);
      }
    }
  }

  // Create unique index on slug
  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_scholarships_slug ON scholarships(slug);`);
  } catch (e) {}

  // 2. Create Granular Eligibility Rules Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scholarship_eligibility_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scholarship_id INTEGER NOT NULL,
      criterion_type TEXT NOT NULL,
      operator TEXT NOT NULL,
      criterion_value TEXT NOT NULL,
      is_mandatory INTEGER DEFAULT 1,
      explanation TEXT,
      source_reference TEXT,
      FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE
    );
  `);

  // 3. Create Extended Student Scholarship Profiles Table (Voluntary & Privacy-Preserving)
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_scholarship_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      domicile_state TEXT,
      annual_family_income INTEGER,
      category TEXT DEFAULT 'GENERAL',
      gender TEXT DEFAULT 'MALE',
      is_differently_abled INTEGER DEFAULT 0,
      disability_percentage INTEGER DEFAULT 0,
      twelfth_percentage REAL,
      cgpa REAL,
      admission_year INTEGER,
      entry_type TEXT DEFAULT 'FIRST_YEAR',
      service_category TEXT DEFAULT 'NONE',
      parent_service_branch TEXT,
      is_orphan INTEGER DEFAULT 0,
      single_girl_child INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. Create Saved Scholarships Tracker Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_scholarships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      scholarship_id INTEGER NOT NULL,
      application_status TEXT DEFAULT 'INTERESTED',
      student_notes TEXT,
      applied_date TEXT,
      saved_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE,
      UNIQUE(user_id, scholarship_id)
    );
  `);

  // 5. Create Outbound Application Redirection & Activity Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scholarship_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      scholarship_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      destination_url TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE
    );
  `);

  // 6. Create Verified Source Citations Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scholarship_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scholarship_id INTEGER NOT NULL,
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL,
      source_type TEXT DEFAULT 'GOVERNMENT_PORTAL',
      publication_date TEXT,
      last_checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      evidence_excerpt TEXT,
      verification_result TEXT DEFAULT 'VERIFIED',
      FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE
    );
  `);

  // 7. Create Admin Audit Trail Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scholarship_admin_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      admin_email TEXT NOT NULL,
      scholarship_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. Create Ingestion Import Jobs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scholarship_import_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'COMPLETED',
      records_received INTEGER DEFAULT 0,
      records_verified INTEGER DEFAULT 0,
      records_rejected INTEGER DEFAULT 0,
      error_details TEXT,
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
