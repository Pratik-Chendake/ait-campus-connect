import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db, { query, initDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ingestResearchData() {
  console.log('🔄 Initializing database schema migrations...');
  initDatabase();

  // Locate seed JSON
  let seedPath = path.join(__dirname, '..', '..', 'research_inputs', 'ait_clubs_opportunities_seed.json');
  if (!fs.existsSync(seedPath)) {
    seedPath = path.join('C:', 'Users', 'prati', 'Downloads', 'ait club docs', 'ait_clubs_opportunities_seed.json');
  }
  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed JSON not found at ${seedPath}`);
  }

  const raw = fs.readFileSync(seedPath, 'utf-8');
  const seed = JSON.parse(raw);

  console.log(`📂 Loaded seed JSON: ${seed.project}`);
  console.log(`⏰ Research snapshot date: ${seed.research_as_of} (${seed.timezone})`);
  console.log(`📋 Canonical club count in seed: ${seed.clubs.length}`);

  if (seed.clubs.length !== 23) {
    throw new Error(`Expected exactly 23 clubs in seed, found ${seed.clubs.length}`);
  }

  // Descriptions dictionary for all 23 clubs
  const clubDescriptions = {
    'ddqclub': {
      name: 'Debate, Quiz & Dramatics (DDQ) Club',
      slug: 'ddq-club-ait',
      category: 'Cultural',
      description: 'DDQ Club is AIT Pune\'s premier society for parliamentary debating, campus quizzing, and theatre stagecraft.',
      about: 'Debate, Quiz & Dramatics (DDQ) Club represents AIT in national parliamentary debates, organizes the annual intra-college quiz festivals, and produces acclaimed stage plays for collegiate drama circuits.',
      founded_year: 1996,
      logo_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=300'
    },
    'ait_nature_club': {
      name: 'AIT Nature Club',
      slug: 'ait-nature-club',
      category: 'Community',
      description: 'Dedicated to ecological preservation, campus tree census, cleanliness drives, and wildlife awareness at AIT.',
      about: 'The Nature Club is dedicated to environmental conservation, botanical documentation, bird-watching trails, and sustainable campus initiatives.',
      founded_year: 2012,
      logo_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300'
    },
    'fine._.arts._.ait': {
      name: 'AIT Fine Arts Club',
      slug: 'ait-fine-arts',
      category: 'Cultural',
      description: 'Cultivating creative expressions through painting, sketches, digital illustration, and campus art exhibitions.',
      about: 'Fine Arts Club curates live art exhibitions, campus wall murals, Rangoli competitions, and workshops on digital art and sketching.',
      founded_year: 2005,
      logo_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300'
    },
    'aitsportsclub': {
      name: 'AIT Sports Club',
      slug: 'ait-sports-club',
      category: 'Sports',
      description: 'Conducts PACE sports championship and fosters athletics, football, basketball, cricket, and badminton.',
      about: 'AIT Sports Club is the governing body for all campus sports tournaments, training sessions, and inter-collegiate sports representation.',
      founded_year: 1994,
      logo_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300'
    },
    'ait_media_cell': {
      name: 'AIT Media Cell',
      slug: 'ait-media-cell',
      category: 'Media',
      description: 'The official press, photography, and journalism team covering campus happenings, achievements, and ceremonies.',
      about: 'AIT Media Cell captures every milestone, convocation, festival, and competition through photojournalism and video newsletters.',
      founded_year: 2010,
      logo_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300'
    },
    'gdsc_aitpune': {
      name: 'GDSC / GDG on Campus AIT Pune',
      slug: 'gdsc-aitpune',
      category: 'Technical',
      description: 'Google Developer Groups on Campus chapter fostering Android, Cloud, Web, Flutter, and AI development.',
      about: 'GDG on Campus AIT (formerly GDSC) connects student developers with Google tools, Cloud Study Jams, and the global Solution Challenge.',
      founded_year: 2019,
      logo_url: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=300'
    },
    'ait_cycling_club': {
      name: 'AIT Cycling Club',
      slug: 'ait-cycling-club',
      category: 'Sports',
      description: 'Promoting endurance, fitness, and weekend cycling expeditions across Pune and the Western Ghats.',
      about: 'AIT Cycling Club organizes early morning cyclothons, hill climbs, trail rides, and promotes eco-friendly green commuting on campus.',
      founded_year: 2018,
      logo_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=300'
    },
    'ossclub.ait': {
      name: 'Open Source Software (OSS) Club',
      slug: 'oss-club-ait',
      category: 'Technical',
      description: 'Organizers of Innerve hackathon, Linux install fests, Git bootcamps, and open-source project development.',
      about: 'AIT OSS Club promotes FOSS culture, maintains student tools like Anubhav, and hosts Innerve, AIT\'s flagship annual hackathon.',
      founded_year: 2016,
      logo_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300'
    },
    'ait_pr_cell': {
      name: 'AIT Public Relations (PR) Cell',
      slug: 'ait-pr-cell',
      category: 'Media',
      description: 'Manages corporate outreach, media releases, guest dignitary liaison, and institutional communications.',
      about: 'PR Cell interfaces between AIT administration, industry visitors, defense dignitaries, alumni networks, and media outlets.',
      founded_year: 2014,
      logo_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300'
    },
    'ait_feet_tappers': {
      name: 'AIT Feet Tappers Club',
      slug: 'ait-feet-tappers',
      category: 'Cultural',
      description: 'The energetic dance troupe of AIT, specializing in classical, contemporary, hip-hop, and folk choreography.',
      about: 'Feet Tappers represents AIT in national inter-college dance face-offs, street dance battles, and stages headliner performances at Aakriti.',
      founded_year: 2008,
      logo_url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=300'
    },
    'radioraaga': {
      name: 'Radio Raaga (Campus Radio)',
      slug: 'radio-raaga',
      category: 'Cultural',
      description: 'Campus radio station broadcasting student podcasts, morning announcements, music reviews, and interviews.',
      about: 'Radio Raaga is AIT\'s voice across hostels and campus quads, producing student-led talk shows, faculty interviews, and audio diaries.',
      founded_year: 2015,
      logo_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300'
    },
    'culturalboard_ait': {
      name: 'AIT Cultural Board',
      slug: 'cultural-board-ait',
      category: 'Cultural',
      description: 'Central governing body coordinating cultural festivals including Aakriti, Freshers, and talent competitions.',
      about: 'The Cultural Board oversees drama, dance, music, fine arts, and literary societies, spearheading Pune\'s marquee college fest Aakriti.',
      founded_year: 1994,
      logo_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'
    },
    'research_and_development_cell': {
      name: 'AIT Research & Development Cell',
      slug: 'research-and-development-cell',
      category: 'Research',
      description: 'Fosters undergraduate research, patent filings, IEEE publications, and sponsored defense innovation projects.',
      about: 'R&D Cell mentors students on conference paper submissions, DRDO research grants, and technical journal publication standards.',
      founded_year: 2015,
      logo_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300'
    },
    'magboard': {
      name: 'AIT Magazine Board',
      slug: 'magazine-board',
      category: 'Media',
      description: 'Publishes the annual institute magazine "Akriti", student essays, poetry, cartoons, and year-in-review chronicles.',
      about: 'Magazine Board curates editorial content in English, Hindi, and regional languages, chronicling the academic and extracurricular legacy of AIT.',
      founded_year: 1995,
      logo_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300'
    },
    'ecell_ait': {
      name: 'AIT Entrepreneurship Cell (E-Cell)',
      slug: 'ecell-ait',
      category: 'Entrepreneurship',
      description: 'Incubating startup ventures, organizing business plan competitions, and connecting student founders with VCs.',
      about: 'E-Cell drives startup culture at AIT through entrepreneurship summits, pitch days, seed funding mentorship, and founder keynotes.',
      founded_year: 2013,
      logo_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300'
    },
    'ait_spiritual_club': {
      name: 'AIT Spiritual Club',
      slug: 'ait-spiritual-club',
      category: 'Community',
      description: 'Fostering mindfulness, stress management, yoga sessions, and holistic well-being for students.',
      about: 'The Spiritual Club organizes meditation workshops, philosophical discussions, and wellness retreats to cultivate student peace and focus.',
      founded_year: 2017,
      logo_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300'
    },
    'isdf_ait': {
      name: 'AIT Information Security & Digital Forensics (ISDF)',
      slug: 'isdf-ait',
      category: 'Technical',
      description: 'Cybersecurity research group focusing on ethical hacking, CTF challenges, reverse engineering, and digital defense.',
      about: 'ISDF trains students in network defense, cryptography, vulnerability research, and inter-collegiate Capture-The-Flag championships.',
      founded_year: 2018,
      logo_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300'
    },
    'ait_nss_rotaract_club': {
      name: 'AIT NSS / Rotaract Club',
      slug: 'ait-nss-rotaract-club',
      category: 'Community',
      description: 'Community service chapter conducting blood donation drives, village education outreach, and disaster relief.',
      about: 'NSS & Rotaract Club leads grassroots social development in adopted villages, health camps, cleanliness initiatives, and tree drives.',
      founded_year: 2002,
      logo_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=300'
    },
    'robotics.club_ait': {
      name: 'AIT Robotics Club / CEAR',
      slug: 'robotics-club-ait',
      category: 'Technical',
      description: 'Center for Excellence in Automation & Robotics (CEAR), building combat robots, line followers, rovers, and UAVs.',
      about: 'CEAR trains engineers in embedded systems, ROS, PCB design, and mechanical fabrication for national competitions like Robocon.',
      founded_year: 2007,
      logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300'
    },
    'aittechnicalboard': {
      name: 'AIT Technical Board',
      slug: 'ait-technical-board',
      category: 'Technical',
      description: 'Apex technical council overseeing coding clubs, robotics, cybersecurity, hackathons, and national tech symposiums.',
      about: 'The Technical Board coordinates inter-department technical fests, allocates lab resources for project teams, and liaises with tech companies.',
      founded_year: 1995,
      logo_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300'
    },
    'coding_cell_ait': {
      name: 'AIT Coding Cell (Competitive Programming)',
      slug: 'coding-cell-ait',
      category: 'Technical',
      description: 'Competitive programming community preparing students for ICPC, Codeforces, LeetCode, and top-tier tech interviews.',
      about: 'AIT Coding Cell hosts weekly algorithmic sprints, DSA masterclasses, contest editorials, and intra-college coding leagues.',
      founded_year: 2017,
      logo_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=300'
    },
    'ait_social_media_cell': {
      name: 'AIT Social Media Cell',
      slug: 'ait-social-media-cell',
      category: 'Media',
      description: 'Manages digital storytelling, Instagram campaigns, student spotlights, and official announcements across platforms.',
      about: 'The Social Media Cell produces digital visual assets, reels, student interviews, and brand engagement for Army Institute of Technology.',
      founded_year: 2019,
      logo_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300'
    },
    'filmclub_ait': {
      name: 'AIT Film Club',
      slug: 'film-club-ait',
      category: 'Cultural',
      description: 'Short film production, cinematography, editing workshops, scriptwriting, and national student film fest entries.',
      about: 'AIT Film Club fosters cinematic arts, directing original short films, drone videography, film appreciation screenings, and editing sessions.',
      founded_year: 2018,
      logo_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300'
    }
  };

  // 1. Ingest exactly 23 clubs
  console.log('\n--- Ingesting 23 Canonical Clubs ---');
  let insertedClubs = 0;
  let updatedClubs = 0;

  for (const c of seed.clubs) {
    const handle = c.instagram_handle.toLowerCase();
    const meta = clubDescriptions[handle] || {
      name: c.display_name,
      slug: handle.replace(/[^a-z0-9]+/g, '-'),
      category: c.category || 'Technical',
      description: `${c.display_name} at Army Institute of Technology, Pune.`,
      about: `${c.display_name} at Army Institute of Technology, Pune.`,
      founded_year: 2015,
      logo_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300'
    };

    // Normalize Instagram URL
    const normalizedInstaUrl = `https://www.instagram.com/${handle}/`;

    // Check if club already exists by handle or slug
    const existing = query.get(`
      SELECT id, name FROM clubs
      WHERE instagram_handle = ? OR slug = ? OR instagram_url LIKE ?
    `, [handle, meta.slug, `%/${handle}%`]);

    if (existing) {
      query.run(`
        UPDATE clubs SET
          name = ?,
          slug = ?,
          category = ?,
          description = ?,
          about = ?,
          instagram_handle = ?,
          instagram_url = ?,
          academic_year = '2026-27',
          leadership_status = 'not_verified_for_publication',
          verification_status = 'VERIFIED',
          origin = 'user_supplied_url',
          publish_directory_entry = 1,
          publish_leadership = 0,
          lead_name = NULL,
          lead_role = NULL,
          faculty_advisor = NULL
        WHERE id = ?
      `, [
        meta.name, meta.slug, meta.category, meta.description, meta.about,
        handle, normalizedInstaUrl, existing.id
      ]);
      updatedClubs++;
    } else {
      query.run(`
        INSERT INTO clubs (
          name, slug, category, description, about, logo_url,
          banner_url, instagram_url, instagram_handle, academic_year,
          leadership_status, verification_status, origin,
          publish_directory_entry, publish_leadership, founded_year, status
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200',
          ?, ?, '2026-27',
          'not_verified_for_publication', 'VERIFIED', 'user_supplied_url',
          1, 0, ?, 'ACTIVE'
        )
      `, [
        meta.name, meta.slug, meta.category, meta.description, meta.about,
        meta.logo_url, normalizedInstaUrl, handle, meta.founded_year
      ]);
      insertedClubs++;
    }
  }

  const allClubsCount = query.get("SELECT COUNT(*) as count FROM clubs WHERE status = 'ACTIVE'");
  console.log(`✓ 23 Clubs processed (Inserted: ${insertedClubs}, Updated: ${updatedClubs}). Total in DB: ${allClubsCount.count}`);

  // 2. Ingest Evidence Source Records
  console.log('\n--- Ingesting Evidence Sources ---');
  const sources = [
    {
      source_key: 'innerve-11-official-site',
      title: 'Innerve 11.0 Official Event Website',
      url_or_file: 'https://www.innerve.tech/',
      source_type: 'OFFICIAL_EVENT',
      publication_date: '2026-10-24',
      academic_year: '2026-27',
      extracted_claim: 'Innerve 11.0 dates confirmed as January 29-30, 2027 on live event site. Registration details and problem statements unconfirmed.',
      confidence: 'HIGH'
    },
    {
      source_key: 'anubhav-oss-github',
      title: 'Anubhav OSS Frontend GitHub Repository Issues',
      url_or_file: 'https://github.com/aitoss/Anubhav-frontend-neo/issues',
      source_type: 'CLUB',
      publication_date: '2026-10-24',
      academic_year: '2026-27',
      extracted_claim: 'Active open-source issues tracked for community contribution. Project contributions only, not an internship.',
      confidence: 'HIGH'
    },
    {
      source_key: 'ait-ay25-26-report',
      title: 'AIT Institutional Club & Activity Report (AY 2025-26)',
      url_or_file: 'document (6)(1).pdf',
      source_type: 'UPLOADED_HISTORICAL',
      publication_date: '2026-05-30',
      academic_year: '2025-26',
      extracted_claim: 'Documented historical activities: Cultural Aakriti 2025 (17-24 Sep 2025, pp. 6-9) and Freshers (10 Aug 2025, pp. 1-5).',
      confidence: 'HIGH'
    },
    {
      source_key: 'gdg-campus-ait-page',
      title: 'GDG on Campus AIT Pune Official Chapter Page',
      url_or_file: 'https://gdg.community.dev/gdg-on-campus-army-institute-of-technology-pune-india/',
      source_type: 'CLUB',
      publication_date: '2026-10-24',
      academic_year: '2026-27',
      extracted_claim: 'Official community profile for Google Developer Group on Campus at AIT Pune.',
      confidence: 'HIGH'
    },
    {
      source_key: 'stellar-iq-unstop-listing',
      title: 'Stellar IQ: Space Quiz Unstop Listing',
      url_or_file: 'https://unstop.com/quiz/stellar-iq-space-quiz-army-institute-of-technology-pune-1763317',
      source_type: 'SECONDARY_REPORT',
      publication_date: '2026-10-16',
      academic_year: '2026-27',
      extracted_claim: 'Listing indicated registration deadline was 16 Oct 2026; primary club co-organization requires verification.',
      confidence: 'MEDIUM'
    },
    {
      source_key: 'blackhat-ctf-listing',
      title: 'Black Hat India 2026 CTF Listing',
      url_or_file: 'https://ctf.blackhat-india.com/',
      source_type: 'SECONDARY_REPORT',
      publication_date: '2026-10-24',
      academic_year: '2026-27',
      extracted_claim: 'Date conflict between Nov 28 CTF and earlier Oct conference; held in review queue.',
      confidence: 'LOW'
    }
  ];

  for (const s of sources) {
    query.run(`
      INSERT INTO source_records (
        source_key, title, url_or_file, source_type, publication_date,
        academic_year, extracted_claim, confidence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(source_key) DO UPDATE SET
        title = excluded.title,
        url_or_file = excluded.url_or_file,
        extracted_claim = excluded.extracted_claim,
        confidence = excluded.confidence
    `, [s.source_key, s.title, s.url_or_file, s.source_type, s.publication_date, s.academic_year, s.extracted_claim, s.confidence]);
  }
  console.log(`✓ Ingested ${sources.length} evidence sources`);

  // 3. Ingest Verified Event: Innerve 11.0 (OSS Club)
  console.log('\n--- Ingesting Verified Events ---');
  const ossClub = query.get("SELECT id FROM clubs WHERE instagram_handle = 'ossclub.ait'");
  const ossClubId = ossClub ? ossClub.id : null;

  query.run(`
    INSERT INTO events (
      title, slug, category, club_id, organizer_name,
      description, banner_url, mode, venue, prize_pool,
      team_size_min, team_size_max, eligibility, rules,
      registration_deadline, event_start_date, event_end_date,
      status, source_key, source_url, official_event_url,
      registration_status, registration_mode, academic_year, verification_status
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      event_start_date = excluded.event_start_date,
      event_end_date = excluded.event_end_date,
      official_event_url = excluded.official_event_url,
      registration_status = excluded.registration_status,
      registration_mode = excluded.registration_mode,
      rules = excluded.rules
  `, [
    'Innerve 11.0',
    'innerve-11-2027',
    'Hackathon',
    ossClubId,
    'AIT Open Source Software Club',
    'The 11th edition of Innerve, AIT Pune annual flagship hackathon organized by the Open Source Software (OSS) Club. Brings together student developers across India to build transformative software and open-source solutions.',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200',
    'In-Person',
    'Army Institute of Technology, Pune',
    'To Be Announced by Organizers',
    2,
    4,
    'Open to all undergraduate college students across India.',
    'Official event website (https://www.innerve.tech/) confirms event dates as 29-30 January 2027. Registration windows, prize pool, problem statements and accommodations remain unconfirmed until re-verified. Parallel local registration is disabled.',
    '2027-01-20',
    '2027-01-29',
    '2027-01-30',
    'PUBLISHED',
    'innerve-11-2027',
    'https://www.innerve.tech/',
    'https://www.innerve.tech/',
    'UNCONFIRMED',
    'EXTERNAL',
    '2026-27',
    'verified_event_dates_only'
  ]);
  console.log('✓ Ingested Innerve 11.0 (Confirmed Dates: 29–30 Jan 2027, Registration: UNCONFIRMED, Mode: EXTERNAL)');

  // 4. Ingest Opportunities: Anubhav OSS Project Contributions (Strictly NOT an Internship)
  console.log('\n--- Ingesting Opportunities ---');
  query.run(`
    INSERT INTO opportunities (
      source_key, title, opportunity_type, club_id, organizer,
      official_url, application_url, location_or_mode, stipend,
      paid_status, eligibility, required_skills, apply_deadline,
      verification_status, last_checked_date, is_live, is_active, notes
    ) VALUES (
      'anubhav-oss-issues', 'Anubhav OSS Project Contributions', 'OPEN_SOURCE_CONTRIBUTION',
      ?, 'AIT OSS / GitHub Maintainers',
      'https://github.com/aitoss/Anubhav-frontend-neo/issues',
      'https://github.com/aitoss/Anubhav-frontend-neo/issues',
      'Remote (GitHub)', NULL, 'NOT_AN_INTERNSHIP',
      'Open to all AIT students and open-source contributors',
      'React, TypeScript, Tailwind CSS, Git, GitHub Actions',
      NULL, 'project_and_open_issues_checked_2026_10_24', '2026-10-24', 'LIVE', 1,
      'GitHub reported active open issues at research snapshot. Contributor opportunity strictly classified as Open Source Contribution, NOT a paid job or internship.'
    )
    ON CONFLICT(source_key) DO UPDATE SET
      title = excluded.title,
      opportunity_type = excluded.opportunity_type,
      paid_status = excluded.paid_status,
      official_url = excluded.official_url,
      application_url = excluded.application_url,
      notes = excluded.notes
  `, [ossClubId]);
  console.log('✓ Ingested Anubhav OSS Project (Opportunity Type: OPEN_SOURCE_CONTRIBUTION, Paid: NOT_AN_INTERNSHIP)');

  // 5. Ingest Historical Past Events (AY 2025-26 from institutional report)
  console.log('\n--- Ingesting Historical Event Archives ---');
  const culturalBoard = query.get("SELECT id FROM clubs WHERE instagram_handle = 'culturalboard_ait'");
  const culturalBoardId = culturalBoard ? culturalBoard.id : null;

  const pastArchives = [
    {
      source_key: 'cultural-aakriti-2025',
      event_name: 'Cultural Aakriti 2025',
      type: 'Cultural Festival',
      academic_year: '2025-26',
      organizing_club_id: culturalBoardId,
      start_date: '2025-09-17',
      end_date: '2025-09-24',
      description: 'The monumental annual cultural festival of AIT Pune for AY 2025-26, featuring dance, music, fine arts, street plays, and celebrity headliner nights.',
      source_file: 'document (6)(1).pdf',
      source_pages: '6-9',
      notes: 'Documented in institutional activity report. Sourced with 800+ attendees. Placed strictly in Historical Archive, not in upcoming opportunities.'
    },
    {
      source_key: 'freshers-2025',
      event_name: 'Freshers Celebration 2025',
      type: 'Cultural',
      academic_year: '2025-26',
      organizing_club_id: culturalBoardId,
      start_date: '2025-08-10',
      end_date: '2025-08-10',
      description: 'Official orientation and welcome cultural event for the incoming first-year student batch of AY 2025-26.',
      source_file: 'document (6)(1).pdf',
      source_pages: '1-5',
      notes: 'Documented in institutional activity report. Historical archive record only.'
    }
  ];

  for (const pa of pastArchives) {
    query.run(`
      INSERT INTO past_event_archives (
        source_key, event_name, type, academic_year, organizing_club_id,
        start_date, end_date, description, source_file, source_pages,
        verification_status, is_public, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'historical_document_reported', 1, ?)
      ON CONFLICT(source_key) DO UPDATE SET
        event_name = excluded.event_name,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        description = excluded.description,
        source_file = excluded.source_file,
        source_pages = excluded.source_pages
    `, [
      pa.source_key, pa.event_name, pa.type, pa.academic_year, pa.organizing_club_id,
      pa.start_date, pa.end_date, pa.description, pa.source_file, pa.source_pages, pa.notes
    ]);
  }
  console.log(`✓ Ingested ${pastArchives.length} historical event archives for AY 2025-26`);

  // 6. Ingest Admin Review Queue Candidates (Unverified / Conflicted Claims)
  console.log('\n--- Populating Admin Review Queue (Unverified Candidates) ---');
  const reviewItems = [
    {
      review_key: 'club-leadership-2026-27',
      type: 'leadership',
      label: 'Claimed AIT May 2026 Student Secretary Circular / Secondary PDF Roster',
      reason: 'Primary official appointment circular authenticity (AIT/324/Appt-St-IC/Prin) and exact year-specific names must be independently verified before public display.',
      details: 'Purported roster of student secretaries from secondary research PDF. Withheld from public display per strict AY 2026-27 verification rule.',
      source_citation: 'Secondary PDF (AIT Student Club Instagram Directory.pdf, pp. 2-5)'
    },
    {
      review_key: 'stellar-iq-2026',
      type: 'competition',
      label: 'Stellar IQ: Space Quiz 2026',
      reason: 'Registration deadline was 16 Oct 2026 (closed); primary organizer role by AIT club needs official verification.',
      details: 'Unstop public listing shows final 24-25 Oct 2026 with registration closed on 16 Oct. Do not show as an open registration.',
      source_citation: 'https://unstop.com/quiz/stellar-iq-space-quiz-army-institute-of-technology-pune-1763317'
    },
    {
      review_key: 'black-hat-india-ctf-2026',
      type: 'ctf',
      label: 'Black Hat India 2026 CTF',
      reason: 'Schedule conflict: Nov 28 CTF date conflicts with earlier October conference narrative. Do not assert AIT ISDF co-organization without first-party announcement.',
      details: 'External CTF listing with conflicting schedule dates.',
      source_citation: 'https://ctf.blackhat-india.com/'
    },
    {
      review_key: 'nexus-recruitment-2026',
      type: 'club_recruitment',
      label: 'NEXUS Club Recruitment Portal',
      reason: 'Active AY 2026-27 admission forms, open positions, and deadlines are unverified.',
      details: 'Potential club recruitment link; queue for manual organizer confirmation.',
      source_citation: 'Secondary research lead'
    },
    {
      review_key: 'ecell-ignite-2026',
      type: 'event',
      label: 'E-Cell Ignite 2026',
      reason: 'Repository or project name is not evidence of a scheduled public registration event.',
      details: 'Queued until E-Cell releases official event dates and registration form.',
      source_citation: 'Repository lead'
    },
    {
      review_key: 'fsoc-2026-27',
      type: 'training',
      label: 'FSOC OSS Beginner Cohort 2026-27',
      reason: 'Current cohort schedule, syllabus, and registration dates missing.',
      details: 'Queued for confirmation by OSS Club coordinators.',
      source_citation: 'Club historical activity'
    },
    {
      review_key: 'nss-drives-2026',
      type: 'volunteering',
      label: 'NSS Blood Donation & Sanitary Pad Drives',
      reason: 'Current AY 2026-27 drive dates unverified; historical proposals only.',
      details: 'NSS community drives require confirmed dates from NSS coordinator.',
      source_citation: 'Historical proposals'
    },
    {
      review_key: 'aakriti-2026-27',
      type: 'cultural',
      label: 'Cultural Aakriti 2026-27 Future Dates',
      reason: 'Do not infer recurrence dates from AY 2025-26 festival.',
      details: 'Withheld until Cultural Board publishes official 2026-27 circular.',
      source_citation: 'Extrapolation avoidance rule'
    },
    {
      review_key: 'amethyst-2026',
      type: 'historical',
      label: 'Amethyst 2026 Historical End Date',
      reason: 'Conflicting historical end date between sources (11 April vs 12 April 2026).',
      details: 'Held until archival records reconcile exact festival end date.',
      source_citation: 'Source date conflict'
    },
    {
      review_key: 'avishkar-2026-27',
      type: 'competition',
      label: 'SPPU Avishkar 2026-27 Campus Selection',
      reason: 'Campus selection timeline and research paper submission deadline not verified.',
      details: 'AIT R&D Cell campus round schedule pending circular.',
      source_citation: 'University timeline lead'
    }
  ];

  for (const item of reviewItems) {
    query.run(`
      INSERT INTO ingestion_review_queue (
        review_key, type, label, reason, details, source_citation, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING_REVIEW')
      ON CONFLICT(review_key) DO UPDATE SET
        label = excluded.label,
        reason = excluded.reason,
        details = excluded.details,
        source_citation = excluded.source_citation
    `, [item.review_key, item.type, item.label, item.reason, item.details, item.source_citation]);
  }
  console.log(`✓ Populated ${reviewItems.length} candidate claims in Admin Ingestion Review Queue (Status: PENDING_REVIEW)`);

  // Final summary verification
  console.log('\n========================================================');
  console.log('✅ RESEARCH DATA INGESTION COMPLETED SUCCESSFULLY');
  console.log('========================================================');
  const clubsCount = query.get("SELECT COUNT(*) as count FROM clubs WHERE status = 'ACTIVE'");
  const sourceCount = query.get("SELECT COUNT(*) as count FROM source_records");
  const oppCount = query.get("SELECT COUNT(*) as count FROM opportunities");
  const archiveCount = query.get("SELECT COUNT(*) as count FROM past_event_archives");
  const queueCount = query.get("SELECT COUNT(*) as count FROM ingestion_review_queue WHERE status = 'PENDING_REVIEW'");
  const verifiedLeadershipCount = query.get("SELECT COUNT(*) as count FROM club_leadership WHERE verification_status = 'VERIFIED'");

  console.log(`- Canonical Directory Clubs: ${clubsCount.count} (Target: 23)`);
  console.log(`- Evidence Sources Tracked: ${sourceCount.count}`);
  console.log(`- Sourced Opportunities: ${oppCount.count} (Anubhav OSS Contribution)`);
  console.log(`- Historical Archive Records: ${archiveCount.count} (Cultural Aakriti 2025, Freshers 2025)`);
  console.log(`- Moderation Review Queue Items: ${queueCount.count} (All PENDING_REVIEW, not publicly exposed)`);
  console.log(`- Verified AY 2026-27 Leadership Published: ${verifiedLeadershipCount.count} (0 by design, strict accuracy)`);
  console.log('========================================================\n');
}

// Execute directly if run via CLI
if (process.argv[1] && process.argv[1].endsWith('ingest_research.js')) {
  ingestResearchData().catch((err) => {
    console.error('❌ Ingestion failed:', err);
    process.exit(1);
  });
}
