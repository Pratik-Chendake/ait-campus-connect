import bcrypt from 'bcryptjs';
import db, { initDatabase, query } from './database.js';

export function seedData() {
  initDatabase();

  const userCount = query.get('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count > 0) {
    console.log('Database already seeded. Skipping initial seed.');
    return;
  }

  console.log('Seeding initial data for AIT Campus Connect...');

  const passwordStudent = bcrypt.hashSync('student123', 10);
  const passwordClub = bcrypt.hashSync('club123', 10);
  const passwordFaculty = bcrypt.hashSync('faculty123', 10);
  const passwordAdmin = bcrypt.hashSync('admin123', 10);

  // 1. Insert Skills
  const skillsList = [
    { name: 'Python', category: 'Programming' },
    { name: 'JavaScript', category: 'Programming' },
    { name: 'TypeScript', category: 'Programming' },
    { name: 'C++', category: 'Programming' },
    { name: 'Java', category: 'Programming' },
    { name: 'React', category: 'Web' },
    { name: 'Node.js', category: 'Web' },
    { name: 'Next.js', category: 'Web' },
    { name: 'Tailwind CSS', category: 'Web' },
    { name: 'Machine Learning', category: 'AI/ML' },
    { name: 'Deep Learning', category: 'AI/ML' },
    { name: 'Computer Vision', category: 'AI/ML' },
    { name: 'NLP', category: 'AI/ML' },
    { name: 'PyTorch', category: 'AI/ML' },
    { name: 'TensorFlow', category: 'AI/ML' },
    { name: 'ROS / Robotics', category: 'Hardware' },
    { name: 'Embedded C / Arduino', category: 'Hardware' },
    { name: 'IoT', category: 'Hardware' },
    { name: 'SolidWorks / CAD', category: 'Hardware' },
    { name: 'Cybersecurity', category: 'Security' },
    { name: 'Docker / Kubernetes', category: 'Cloud' },
    { name: 'AWS / Cloud', category: 'Cloud' },
    { name: 'UI/UX Design / Figma', category: 'Design' },
    { name: 'Public Speaking', category: 'Soft Skills' },
    { name: 'Event Management', category: 'Soft Skills' },
    { name: 'Technical Writing', category: 'Soft Skills' },
    { name: 'Competitive Programming', category: 'Programming' },
    { name: 'SQL / Databases', category: 'Databases' },
    { name: 'Video Editing / Film', category: 'Media' },
    { name: 'Classical Music / Dance', category: 'Cultural' }
  ];

  for (const s of skillsList) {
    query.run('INSERT OR IGNORE INTO skills (name, category) VALUES (?, ?)', [s.name, s.category]);
  }

  // 2. Insert Users (20+ students, 1 organizer, 1 faculty, 1 admin)
  const users = [
    {
      student_id: '21BCS045',
      full_name: 'Rahul Sharma',
      email: 'rahul.sharma@aitpune.edu.in',
      personal_email: 'rahul.dev@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Computer Engineering',
      year: 3,
      semester: 6,
      phone: '+91 98765 43210',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'Pre-final year Computer Engineering student at AIT Pune. Passionate about Fullstack Systems, AI/ML, and Open Source. Winner at Smart India Hackathon 2025.',
      github_url: 'https://github.com/rahul-ait',
      linkedin_url: 'https://linkedin.com/in/rahulsharma-ait',
      portfolio_url: 'https://rahulsharma.dev',
      contribution_score: 135,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '21BIT018',
      full_name: 'Priya Nair',
      email: 'priya.nair@aitpune.edu.in',
      personal_email: 'priya.nair@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Information Technology',
      year: 4,
      semester: 8,
      phone: '+91 98765 43211',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      bio: 'Final Year IT student. Research focus on Explainable AI and Computer Vision in Healthcare. Author of IEEE Conference paper.',
      github_url: 'https://github.com/priyanair',
      linkedin_url: 'https://linkedin.com/in/priyanair-ait',
      portfolio_url: 'https://priyanair.tech',
      contribution_score: 180,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '22ETC034',
      full_name: 'Ananya Singh',
      email: 'ananya.singh@aitpune.edu.in',
      personal_email: 'ananya.singh@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Electronics & Telecommunication',
      year: 3,
      semester: 5,
      phone: '+91 98765 43212',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      bio: 'Robotics enthusiast, Hardware Lead at Robotics Club AIT. Passionate about Autonomous Mobile Robots, SLAM, and Edge AI.',
      github_url: 'https://github.com/ananya-robotics',
      linkedin_url: 'https://linkedin.com/in/ananya-singh-ait',
      portfolio_url: 'https://ananya.engineer',
      contribution_score: 95,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '21BME062',
      full_name: 'Vikram Malhotra',
      email: 'vikram.m@aitpune.edu.in',
      personal_email: 'vikram.malhotra@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Mechanical Engineering',
      year: 4,
      semester: 7,
      phone: '+91 98765 43213',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      bio: 'Aerodynamics lead for Formula Student team. SolidWorks & ANSYS enthusiast. National level CAD modeling finalist.',
      github_url: 'https://github.com/vikram-cad',
      linkedin_url: 'https://linkedin.com/in/vikram-malhotra',
      portfolio_url: '',
      contribution_score: 110,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '23BCS012',
      full_name: 'Sneha Kulkarni',
      email: 'sneha.k@aitpune.edu.in',
      personal_email: 'sneha.kulkarni@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Computer Engineering',
      year: 2,
      semester: 4,
      phone: '+91 98765 43214',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      bio: 'Cybersecurity researcher and CTF player. Member of ISDF AIT. Interested in Reverse Engineering and Cryptography.',
      github_url: 'https://github.com/sneha-security',
      linkedin_url: 'https://linkedin.com/in/sneha-kulkarni',
      portfolio_url: '',
      contribution_score: 60,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '21BCS088',
      full_name: 'Amit Patel',
      email: 'amit.patel@aitpune.edu.in',
      personal_email: 'amit.patel@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Computer Engineering',
      year: 4,
      semester: 8,
      phone: '+91 98765 43215',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      bio: 'GSoC contributor and Cloud Native developer. Core member of OSS Club AIT. Passionate about Kubernetes and Go.',
      github_url: 'https://github.com/amit-cloud',
      linkedin_url: 'https://linkedin.com/in/amitpatel-ait',
      portfolio_url: 'https://amitpatel.dev',
      contribution_score: 165,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '22ETC078',
      full_name: 'Tanya Joshi',
      email: 'tanya.j@aitpune.edu.in',
      personal_email: 'tanya.joshi@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Electronics & Telecommunication',
      year: 2,
      semester: 4,
      phone: '+91 98765 43216',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'Embedded Systems developer. Exploring Satellite communications and IoT sensor networks for environmental monitoring.',
      github_url: 'https://github.com/tanya-embedded',
      linkedin_url: 'https://linkedin.com/in/tanyajoshi',
      portfolio_url: '',
      contribution_score: 55,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '22BME045',
      full_name: 'Neeraj Chopra Jr.',
      email: 'neeraj.c@aitpune.edu.in',
      personal_email: 'neeraj.sports@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Mechanical Engineering',
      year: 3,
      semester: 6,
      phone: '+91 98765 43217',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      bio: 'AIT Sports Club Captain. University Gold Medalist in Javelin and Inter-college Basketball Champion. Passionate about fitness.',
      github_url: '',
      linkedin_url: 'https://linkedin.com/in/neeraj-ait-sports',
      portfolio_url: '',
      contribution_score: 140,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '22BIT041',
      full_name: 'Divya Menon',
      email: 'divya.m@aitpune.edu.in',
      personal_email: 'divya.menon@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Information Technology',
      year: 3,
      semester: 5,
      phone: '+91 98765 43218',
      avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
      bio: 'UI/UX Designer and Frontend Specialist. Creating accessible, human-first digital experiences. Figma community contributor.',
      github_url: 'https://github.com/divya-designs',
      linkedin_url: 'https://linkedin.com/in/divyamenon-design',
      portfolio_url: 'https://divyamenon.design',
      contribution_score: 115,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '23BCS054',
      full_name: 'Karan Mehra',
      email: 'karan.m@aitpune.edu.in',
      personal_email: 'karan.mehra@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Computer Engineering',
      year: 2,
      semester: 3,
      phone: '+91 98765 43219',
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
      bio: 'Competitive Programmer (Candidate Master on Codeforces, 5★ on CodeChef). Active participant in Coding Cell AIT.',
      github_url: 'https://github.com/karan-cp',
      linkedin_url: 'https://linkedin.com/in/karanmehra-cp',
      portfolio_url: '',
      contribution_score: 90,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '22BCS099',
      full_name: 'Ritu Roy',
      email: 'ritu.roy@aitpune.edu.in',
      personal_email: 'ritu.roy@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Computer Engineering',
      year: 3,
      semester: 6,
      phone: '+91 98765 43220',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'President at Cultural Board AIT. Choreographer with Feet Tappers and theater enthusiast with Fine Arts.',
      github_url: 'https://github.com/ritu-arts',
      linkedin_url: 'https://linkedin.com/in/rituroy',
      portfolio_url: '',
      contribution_score: 125,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '23BME019',
      full_name: 'Siddharth Rao',
      email: 'siddharth.r@aitpune.edu.in',
      personal_email: 'siddharth.rao@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Mechanical Engineering',
      year: 2,
      semester: 3,
      phone: '+91 98765 43221',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      bio: 'Drone designer and UAV enthusiast. Working on long-endurance quadcopters with the Nature Club for terrain mapping.',
      github_url: 'https://github.com/siddharth-drones',
      linkedin_url: 'https://linkedin.com/in/siddharth-rao',
      portfolio_url: '',
      contribution_score: 45,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '21ETC005',
      full_name: 'Pooja Hegde',
      email: 'pooja.h@aitpune.edu.in',
      personal_email: 'pooja.hegde@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Electronics & Telecommunication',
      year: 4,
      semester: 7,
      phone: '+91 98765 43222',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      bio: 'Chairperson of IEEE Student Branch AIT. Active in VLSI design, DSP, and 5G wireless testbeds.',
      github_url: 'https://github.com/pooja-ieee',
      linkedin_url: 'https://linkedin.com/in/pooja-hegde',
      portfolio_url: '',
      contribution_score: 155,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '22BIT082',
      full_name: 'Aditya Pandey',
      email: 'aditya.p@aitpune.edu.in',
      personal_email: 'aditya.pandey@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Information Technology',
      year: 3,
      semester: 5,
      phone: '+91 98765 43223',
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      bio: 'Distributed Systems & Blockchain developer. E-Cell AIT Technical Lead. Builder of decentralized escrow smart contracts.',
      github_url: 'https://github.com/aditya-web3',
      linkedin_url: 'https://linkedin.com/in/adityapandey',
      portfolio_url: '',
      contribution_score: 85,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '22BIT033',
      full_name: 'Megha Iyer',
      email: 'megha.i@aitpune.edu.in',
      personal_email: 'megha.iyer@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Information Technology',
      year: 3,
      semester: 6,
      phone: '+91 98765 43224',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'Data Analyst & Machine Learning Practitioner. Magazine Board Chief Editor. Bridging tech insights with clear storytelling.',
      github_url: 'https://github.com/megha-data',
      linkedin_url: 'https://linkedin.com/in/meghaiyer',
      portfolio_url: '',
      contribution_score: 95,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '22BME071',
      full_name: 'Kunal Goswami',
      email: 'kunal.g@aitpune.edu.in',
      personal_email: 'kunal.goswami@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Mechanical Engineering',
      year: 3,
      semester: 5,
      phone: '+91 98765 43225',
      avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
      bio: 'Robotics Fabricator & Rapid Prototyping expert. 3D printing and CNC machining lead at Innovation Lab.',
      github_url: 'https://github.com/kunal-fab',
      linkedin_url: 'https://linkedin.com/in/kunal-goswami',
      portfolio_url: '',
      contribution_score: 65,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '23ETC060',
      full_name: 'Simran Kaur',
      email: 'simran.k@aitpune.edu.in',
      personal_email: 'simran.kaur@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Electronics & Telecommunication',
      year: 2,
      semester: 3,
      phone: '+91 98765 43226',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      bio: 'Radio Raaga host and audio engineer. Passionate about signal processing and student media broadcast.',
      github_url: '',
      linkedin_url: 'https://linkedin.com/in/simran-kaur',
      portfolio_url: '',
      contribution_score: 70,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '21BCS003',
      full_name: 'Harsh Vardhan',
      email: 'harsh.v@aitpune.edu.in',
      personal_email: 'harsh.v@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Computer Engineering',
      year: 4,
      semester: 8,
      phone: '+91 98765 43227',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      bio: 'Winner of 6 National Hackathons. Technical Board Secretary. Full-stack architect specializing in high-throughput APIs.',
      github_url: 'https://github.com/harsh-v',
      linkedin_url: 'https://linkedin.com/in/harshvardhan',
      portfolio_url: 'https://harshvardhan.co',
      contribution_score: 210,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '22BIT011',
      full_name: 'Ishita Sen',
      email: 'ishita.s@aitpune.edu.in',
      personal_email: 'ishita.sen@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Information Technology',
      year: 3,
      semester: 6,
      phone: '+91 98765 43228',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      bio: 'Head of AIT Media Cell. Documentary filmmaker and photographer. Showcasing the pulse and victories of AIT Pune.',
      github_url: '',
      linkedin_url: 'https://linkedin.com/in/ishita-sen',
      portfolio_url: 'https://ishitasen.me',
      contribution_score: 130,
      profile_visibility: 'PUBLIC'
    },
    {
      student_id: '23BCS102',
      full_name: 'Tanmay Bhatia',
      email: 'tanmay.b@aitpune.edu.in',
      personal_email: 'tanmay.bhatia@gmail.com',
      password_hash: passwordStudent,
      role: 'STUDENT',
      branch: 'Computer Engineering',
      year: 2,
      semester: 4,
      phone: '+91 98765 43229',
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
      bio: 'Nature enthusiast & trek leader in AIT Nature Club. Developing wildlife monitoring sensors using Raspberry Pi and LoRa.',
      github_url: 'https://github.com/tanmay-b',
      linkedin_url: 'https://linkedin.com/in/tanmay-bhatia',
      portfolio_url: '',
      contribution_score: 50,
      profile_visibility: 'PUBLIC'
    },

    // 3. Organizer Demo User (Lead of GDSC AIT Pune)
    {
      student_id: '21BCS021',
      full_name: 'Aarav Deshmukh (GDSC Lead)',
      email: 'gdsc@aitpune.edu.in',
      personal_email: 'aarav.deshmukh@gmail.com',
      password_hash: passwordClub,
      role: 'ORGANIZER',
      branch: 'Computer Engineering',
      year: 4,
      semester: 7,
      phone: '+91 98765 11111',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      bio: 'Lead Organizer at Google Developer Student Clubs (GDSC) AIT Pune. Fostering developer communities, hackathons, and Google Cloud study jams.',
      github_url: 'https://github.com/gdsc-aitpune',
      linkedin_url: 'https://linkedin.com/in/aarav-deshmukh',
      portfolio_url: 'https://gdsc.aitpune.edu.in',
      contribution_score: 195,
      profile_visibility: 'PUBLIC'
    },

    // 4. Faculty Verifier Demo User
    {
      student_id: null,
      full_name: 'Dr. S. R. Patil',
      email: 'dr.patil@aitpune.edu.in',
      personal_email: 'srpatil.research@gmail.com',
      password_hash: passwordFaculty,
      role: 'FACULTY',
      branch: 'Computer Engineering',
      year: null,
      semester: null,
      phone: '+91 98765 22222',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      bio: 'Faculty Coordinator - Student Achievements & Research Verification. Associate Professor, Department of Computer Engineering, AIT Pune.',
      github_url: '',
      linkedin_url: 'https://linkedin.com/in/dr-sr-patil',
      portfolio_url: '',
      contribution_score: 500,
      profile_visibility: 'PUBLIC'
    },

    // 5. Super Admin Demo User
    {
      student_id: null,
      full_name: 'Col. A. K. Joshi (Retd) - Admin',
      email: 'admin@aitpune.edu.in',
      personal_email: 'admin.director@aitpune.edu.in',
      password_hash: passwordAdmin,
      role: 'ADMIN',
      branch: 'Administration',
      year: null,
      semester: null,
      phone: '+91 98765 33333',
      avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      bio: 'Super Administrator, AIT Campus Connect Portal. Directorial Board & Institutional Coordinator, Army Institute of Technology, Pune.',
      github_url: '',
      linkedin_url: 'https://linkedin.com/school/army-institute-of-technology-ait-pune',
      portfolio_url: 'https://aitpune.com',
      contribution_score: 1000,
      profile_visibility: 'PUBLIC'
    }
  ];

  const userStmt = db.prepare(`
    INSERT INTO users (
      student_id, full_name, email, personal_email, password_hash, role,
      branch, year, semester, phone, avatar_url, bio, github_url,
      linkedin_url, portfolio_url, contribution_score, profile_visibility
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    userStmt.run(
      u.student_id, u.full_name, u.email, u.personal_email, u.password_hash, u.role,
      u.branch, u.year, u.semester, u.phone, u.avatar_url, u.bio, u.github_url,
      u.linkedin_url, u.portfolio_url, u.contribution_score, u.profile_visibility
    );
  }

  // 3. Associate Skills to Students
  const userSkillStmt = db.prepare(`
    INSERT OR IGNORE INTO user_skills (user_id, skill_id, level, is_verified)
    VALUES (?, ?, ?, ?)
  `);

  // Rahul Sharma (id: 1): Fullstack + ML
  userSkillStmt.run(1, 1, 'Expert', 1); // Python
  userSkillStmt.run(1, 3, 'Advanced', 1); // TypeScript
  userSkillStmt.run(1, 6, 'Expert', 1); // React
  userSkillStmt.run(1, 7, 'Advanced', 1); // Node.js
  userSkillStmt.run(1, 10, 'Intermediate', 1); // Machine Learning
  userSkillStmt.run(1, 28, 'Advanced', 1); // SQL

  // Priya Nair (id: 2): AI/ML Researcher
  userSkillStmt.run(2, 1, 'Expert', 1); // Python
  userSkillStmt.run(2, 10, 'Expert', 1); // ML
  userSkillStmt.run(2, 11, 'Advanced', 1); // Deep Learning
  userSkillStmt.run(2, 12, 'Advanced', 1); // Computer Vision
  userSkillStmt.run(2, 14, 'Advanced', 1); // PyTorch
  userSkillStmt.run(2, 26, 'Expert', 1); // Tech Writing

  // Ananya Singh (id: 3): Robotics & Hardware
  userSkillStmt.run(3, 4, 'Advanced', 1); // C++
  userSkillStmt.run(3, 16, 'Expert', 1); // ROS / Robotics
  userSkillStmt.run(3, 17, 'Expert', 1); // Embedded C
  userSkillStmt.run(3, 18, 'Advanced', 1); // IoT

  // Divya Menon (id: 9): UI/UX
  userSkillStmt.run(9, 23, 'Expert', 1); // Figma UI/UX
  userSkillStmt.run(9, 6, 'Advanced', 1); // React
  userSkillStmt.run(9, 9, 'Expert', 1); // Tailwind

  // Amit Patel (id: 6): Cloud/DevOps
  userSkillStmt.run(6, 21, 'Expert', 1); // Docker / K8s
  userSkillStmt.run(6, 22, 'Advanced', 1); // AWS
  userSkillStmt.run(6, 7, 'Advanced', 1); // Node.js

  // 4. Insert 22 Official AIT Clubs (With accurate references, official IG handles, descriptions, themes)
  const clubs = [
    {
      name: 'AIT Nature Club',
      slug: 'ait-nature-club',
      category: 'Social & Environment',
      description: 'Promoting ecological consciousness, trekking expeditions, flora-fauna preservation, and green campus initiatives.',
      about: 'The AIT Nature Club is one of the most active outdoor societies on campus. From Sahyadri treks to tree plantation drives and bird-watching sessions, we connect military-heritage campus life with biodiversity.',
      logo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/ait_nature_club',
      website_url: 'https://aitpune.com/nature-club',
      contact_email: 'natureclub@aitpune.edu.in',
      lead_name: 'Tanmay Bhatia',
      lead_role: 'Student Secretary',
      faculty_advisor: 'Prof. V. S. Rathod',
      founded_year: 2012
    },
    {
      name: 'Fine Arts AIT',
      slug: 'fine-arts-ait',
      category: 'Cultural',
      description: 'The creative haven for sketch artists, painters, calligraphers, sculptors, and digital illustrators at AIT.',
      about: 'Fine Arts AIT is the visual heartbeat of our cultural festivals. We handle campus murals, stage backdrop art, annual art exhibitions, and digital graphics workshops.',
      logo_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/fine._.arts._.ait',
      website_url: '',
      contact_email: 'finearts@aitpune.edu.in',
      lead_name: 'Anushka Deshmukh',
      lead_role: 'Club Secretary',
      faculty_advisor: 'Dr. G. M. Karve',
      founded_year: 2008
    },
    {
      name: 'AIT Sports Club',
      slug: 'ait-sports-club',
      category: 'Sports',
      description: 'Home of martial discipline, athletics, football, basketball, squash, and the prestigious PACE Inter-collegiate Fest.',
      about: 'With top-tier military-grade sports infrastructure, AIT Sports Club nurtures state and university champions across 14 sporting disciplines.',
      logo_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/aitsportsclub',
      website_url: '',
      contact_email: 'sports@aitpune.edu.in',
      lead_name: 'Neeraj Chopra Jr.',
      lead_role: 'Sports Secretary',
      faculty_advisor: 'Major Gen (Retd) K. P. Singh / Director Sports',
      founded_year: 1995
    },
    {
      name: 'AIT Media Cell',
      slug: 'ait-media-cell',
      category: 'Media',
      description: 'The official digital chroniclers of Army Institute of Technology, capturing milestones, after-movies, and stories.',
      about: 'Equipped with cinematic cameras, lighting rigs, and professional editing suites, Media Cell covers every fest, dignitary visit, and campus glory.',
      logo_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/ait_media_cell',
      website_url: '',
      contact_email: 'mediacell@aitpune.edu.in',
      lead_name: 'Ishita Sen',
      lead_role: 'Head of Media',
      faculty_advisor: 'Prof. Sangita Jadhav',
      founded_year: 2014
    },
    {
      name: 'GDSC AIT Pune',
      slug: 'gdsc-aitpune',
      category: 'Technical',
      description: 'Google Developer Student Clubs chapter fostering Android, Cloud, AI/ML, Flutter, and Web technologies.',
      about: 'GDSC AIT is part of Google’s global university community program. We host Solution Challenges, Google Cloud Study Jams, and flagship hackathons.',
      logo_url: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/gdsc_aitpune',
      website_url: 'https://gdsc.aitpune.edu.in',
      contact_email: 'gdsc@aitpune.edu.in',
      lead_name: 'Aarav Deshmukh',
      lead_role: 'GDSC Lead',
      faculty_advisor: 'Dr. S. R. Patil',
      founded_year: 2019
    },
    {
      name: 'AIT Cycling Club',
      slug: 'ait-cycling-club',
      category: 'Sports & Fitness',
      description: 'Weekend endurance rides, Pune ghat expeditions, brevet training, and eco-friendly urban mobility.',
      about: 'AIT Cycling Club organizes weekend rides across Sinhagad, Lavasa, and Khadakwasla, promoting cardiovascular stamina and camaraderie.',
      logo_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/ait_cycling_club',
      website_url: '',
      contact_email: 'cycling@aitpune.edu.in',
      lead_name: 'Rohan Naik',
      lead_role: 'Ride Captain',
      faculty_advisor: 'Prof. M. B. Nigam',
      founded_year: 2018
    },
    {
      name: 'OSS Club AIT',
      slug: 'oss-club-ait',
      category: 'Technical',
      description: 'Open Source Software Club championing FOSS, Linux, Git, Hacktoberfest, and Google Summer of Code (GSoC).',
      about: 'OSS Club drives student contributions to high-impact open source repositories worldwide. We host Git sprints and contribute to the Linux kernel and major tools.',
      logo_url: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/ossclub.ait',
      website_url: 'https://ossclub.aitpune.edu.in',
      contact_email: 'oss@aitpune.edu.in',
      lead_name: 'Amit Patel',
      lead_role: 'Core Lead',
      faculty_advisor: 'Prof. Preeti Patil',
      founded_year: 2015
    },
    {
      name: 'AIT PR Cell',
      slug: 'ait-pr-cell',
      category: 'Outreach & Corporate',
      description: 'Public Relations Cell bridging AIT Pune with industry leaders, dignitaries, academic partners, and alumni.',
      about: 'PR Cell manages media communiqués, press releases, dignitary guest handling, and corporate relations for institutional conclaves.',
      logo_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/ait_pr_cell',
      website_url: '',
      contact_email: 'prcell@aitpune.edu.in',
      lead_name: 'Shreya Kulkarni',
      lead_role: 'PR Head',
      faculty_advisor: 'Dr. P. B. Karandikar',
      founded_year: 2011
    },
    {
      name: 'AIT Feet Tappers',
      slug: 'ait-feet-tappers',
      category: 'Cultural',
      description: 'The award-winning premier dance crew of AIT Pune specializing in Western Hip-hop, Contemporary, and Folk fusion.',
      about: 'Winners of prestigious national inter-college dance trophies at IIT Bombay Mood Indigo and COEP Zest. We bring rhythm, passion, and high-energy synchronization.',
      logo_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/ait_feet_tappers',
      website_url: '',
      contact_email: 'feettappers@aitpune.edu.in',
      lead_name: 'Ritu Roy',
      lead_role: 'Choreography Lead',
      faculty_advisor: 'Prof. Shilpa Pawar',
      founded_year: 2004
    },
    {
      name: 'Radio Raaga',
      slug: 'radio-raaga',
      category: 'Media & Cultural',
      description: 'The official campus broadcasting station and podcasting channel of AIT Pune.',
      about: 'Radio Raaga produces weekly student podcasts, campus music shows, interviews with faculty and alumni, and live commentary during fests.',
      logo_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/radioraaga',
      website_url: '',
      contact_email: 'radioraaga@aitpune.edu.in',
      lead_name: 'Simran Kaur',
      lead_role: 'Station Head',
      faculty_advisor: 'Dr. S. M. Gaikwad',
      founded_year: 2016
    },
    {
      name: 'Cultural Board AIT',
      slug: 'cultural-board-ait',
      category: 'Cultural Apex',
      description: 'The apex student body orchestrating AAKRITI — AIT’s flagship annual national cultural extravaganza.',
      about: 'Cultural Board synchronizes music, dance, theater, literature, and visual arts clubs. We ensure a vibrant campus lifestyle and student holistic development.',
      logo_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/culturalboard_ait',
      website_url: 'https://aitpune.com/cultural',
      contact_email: 'culturalboard@aitpune.edu.in',
      lead_name: 'Devansh Tiwari',
      lead_role: 'Cultural Secretary',
      faculty_advisor: 'Dr. J. B. Sankpal',
      founded_year: 1996
    },
    {
      name: 'Research and Development Cell',
      slug: 'research-and-development-cell',
      category: 'Academic & Research',
      description: 'Propelling undergraduate research, IEEE and Scopus indexed publications, patents, and faculty mentorship.',
      about: 'The R&D Cell provides funding grants, research laboratories, and paper writing mentorship to AIT students aiming for international conferences and master’s admissions.',
      logo_url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/research_and_development_cell',
      website_url: 'https://aitpune.com/research',
      contact_email: 'rdcell@aitpune.edu.in',
      lead_name: 'Priya Nair',
      lead_role: 'Student Research Lead',
      faculty_advisor: 'Dr. S. R. Patil / Dean R&D',
      founded_year: 2013
    },
    {
      name: 'Magazine Board AIT',
      slug: 'magazine-board',
      category: 'Literature & Media',
      description: 'Curators of "Reflections" — the official annual institute magazine, literary compilations, and student op-eds.',
      about: 'Magazine Board celebrates prose, poetry, investigative essays, military heritage memoirs, and campus humor across English, Hindi, and regional languages.',
      logo_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/magboard',
      website_url: '',
      contact_email: 'magboard@aitpune.edu.in',
      lead_name: 'Megha Iyer',
      lead_role: 'Chief Student Editor',
      faculty_advisor: 'Dr. Swati Kulkarni',
      founded_year: 1996
    },
    {
      name: 'E-Cell AIT',
      slug: 'ecell-ait',
      category: 'Entrepreneurship',
      description: 'The Entrepreneurship Cell powering student startups, venture pitching, angel investor networks, and E-Summit.',
      about: 'E-Cell transforms technical innovations into viable commercial ventures. We provide incubation office space, legal advice, seed funding access, and mentorship.',
      logo_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/ecell_ait',
      website_url: 'https://ecell.aitpune.edu.in',
      contact_email: 'ecell@aitpune.edu.in',
      lead_name: 'Aditya Pandey',
      lead_role: 'Convenor',
      faculty_advisor: 'Prof. R. S. Verma',
      founded_year: 2014
    },
    {
      name: 'AIT Spiritual Club',
      slug: 'ait-spiritual-club',
      category: 'Wellness & Mindfulness',
      description: 'Promoting yoga, mindfulness meditation, mental wellness, philosophical dialogues, and stress management.',
      about: 'Balancing rigorous engineering academics with calm mental clarity, meditation workshops, and value-based self-development sessions.',
      logo_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/ait_spiritual_club',
      website_url: '',
      contact_email: 'spiritualclub@aitpune.edu.in',
      lead_name: 'Gaurav Joshi',
      lead_role: 'Lead Coordinator',
      faculty_advisor: 'Prof. Y. D. Kale',
      founded_year: 2020
    },
    {
      name: 'ISDF AIT',
      slug: 'isdf-ait',
      category: 'Technical & Security',
      description: 'Information Security and Digital Forensics Club — ethical hacking, CTF challenges, cryptography, and defense cyber security.',
      about: 'ISDF trains students in penetration testing, binary exploitation, malware analysis, and network defense. Regular hosts of the AIT Intra-CTF.',
      logo_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/isdf_ait',
      website_url: 'https://isdf.aitpune.edu.in',
      contact_email: 'isdf@aitpune.edu.in',
      lead_name: 'Sneha Kulkarni',
      lead_role: 'Cyber Lead',
      faculty_advisor: 'Prof. Jayashree Shinde',
      founded_year: 2017
    },
    {
      name: 'AIT NSS / Rotaract Club',
      slug: 'ait-nss-rotaract-club',
      category: 'Social Service',
      description: 'National Service Scheme & Rotaract Club driving blood donation camps, rural teaching, cleanliness drives, and relief work.',
      about: 'Rooted in the motto "Not Me, But You", AIT NSS conducts village adoption drives, health checkup camps, and educational mentorship for underprivileged kids.',
      logo_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/ait_nss_rotaract_club',
      website_url: '',
      contact_email: 'nss@aitpune.edu.in',
      lead_name: 'Karan Rathore',
      lead_role: 'NSS President',
      faculty_advisor: 'Dr. B. P. Patil',
      founded_year: 2005
    },
    {
      name: 'Robotics Club AIT',
      slug: 'robotics-club-ait',
      category: 'Technical & Hardware',
      description: 'Pioneering battle bots, autonomous rovers, drones, robotic manipulators, and Robocon national competitors.',
      about: 'AIT Robotics Club features a dedicated mechanical fabrication lab and electronics workstation. Regular podium finishers at IIT Bombay Techfest and DD Robocon.',
      logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/robotics.club_ait',
      website_url: 'https://robotics.aitpune.edu.in',
      contact_email: 'robotics@aitpune.edu.in',
      lead_name: 'Ananya Singh',
      lead_role: 'Technical Head',
      faculty_advisor: 'Dr. Nilesh Kawache',
      founded_year: 2002
    },
    {
      name: 'AIT Technical Board',
      slug: 'ait-technical-board',
      category: 'Technical Apex',
      description: 'The supreme governing body for all technical societies, research teams, and the annual national tech fest SOLUTIONS.',
      about: 'Technical Board oversees Coding Cell, OSS, Robotics, ISDF, and student branch societies. We liaise directly with college leadership to procure technical grants.',
      logo_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/aittechnicalboard',
      website_url: 'https://aitpune.com/techboard',
      contact_email: 'techboard@aitpune.edu.in',
      lead_name: 'Harsh Vardhan',
      lead_role: 'General Secretary (Tech)',
      faculty_advisor: 'Dean Academics & Student Welfare',
      founded_year: 1998
    },
    {
      name: 'Coding Cell AIT',
      slug: 'coding-cell-ait',
      category: 'Technical',
      description: 'The competitive coding crucible of AIT — hosting ICPC qualifiers, weekly LeetCode ladders, and AlgoSprint.',
      about: 'Coding Cell conducts rigorous algorithmic workshops on Data Structures, Dynamic Programming, Graph Theory, and Competitive Math.',
      logo_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/coding_cell_ait',
      website_url: 'https://codingcell.aitpune.edu.in',
      contact_email: 'codingcell@aitpune.edu.in',
      lead_name: 'Karan Mehra',
      lead_role: 'Lead Problem Setter',
      faculty_advisor: 'Prof. S. R. Dhore',
      founded_year: 2010
    },
    {
      name: 'AIT Social Media Cell',
      slug: 'ait-social-media-cell',
      category: 'Media & Branding',
      description: 'Brand architects managing AIT Pune’s official digital footprint across LinkedIn, Instagram, X, and YouTube.',
      about: 'Social Media Cell curates campus trends, achievement highlights, admissions guidance, and live coverage of all campus boards.',
      logo_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/ait_social_media_cell',
      website_url: '',
      contact_email: 'smc@aitpune.edu.in',
      lead_name: 'Akshat Sahu',
      lead_role: 'Digital Strategist',
      faculty_advisor: 'Prof. Asha Sathe',
      founded_year: 2021
    },
    {
      name: 'Film Club AIT',
      slug: 'film-club-ait',
      category: 'Cultural & Cinema',
      description: 'Screening international cinema classics, student short film production, screenplay writing, and cinephile discussions.',
      about: 'Film Club AIT hosts weekend indie movie screenings, filmmaking masterclasses, screenwriting workshops, and produces short films for national competitions.',
      logo_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80',
      instagram_url: 'https://www.instagram.com/filmclub_ait',
      website_url: '',
      contact_email: 'filmclub@aitpune.edu.in',
      lead_name: 'Kabir Thapa',
      lead_role: 'Director & Lead',
      faculty_advisor: 'Prof. Sujata Kulkarni',
      founded_year: 2017
    }
  ];

  const clubStmt = db.prepare(`
    INSERT INTO clubs (
      name, slug, category, description, about, logo_url, banner_url,
      instagram_url, website_url, contact_email, lead_name, lead_role,
      faculty_advisor, founded_year, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of clubs) {
    clubStmt.run(
      c.name, c.slug, c.category, c.description, c.about, c.logo_url, c.banner_url,
      c.instagram_url, c.website_url, c.contact_email, c.lead_name, c.lead_role,
      c.faculty_advisor, c.founded_year, 'ACTIVE'
    );
  }

  // 5. Insert Events (Hackathons, Competitions, Workshops, Conferences, Cultural, Sports)
  const events = [
    {
      title: 'AIT Innovation Hackathon 2026',
      slug: 'ait-innovation-hackathon-2026',
      category: 'Hackathon',
      club_id: 5, // GDSC
      organizer_name: 'GDSC AIT Pune',
      organizer_id: 21,
      description: 'A 36-hour flagship national level hackathon addressing challenges in Defense Tech, Smart Campus, Sustainable AI, and Healthcare.',
      problem_statement: 'Develop practical, production-ready software/hardware solutions addressing: 1) Secure border communications using decentralized mesh, 2) Predictive maintenance of campus renewable energy, 3) AI-driven triage for emergency response.',
      banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
      mode: 'In-Person',
      venue: 'Ramanujan Computing Complex, AIT Pune',
      prize_pool: '₹1,50,000 + Incubation Support',
      team_size_min: 2,
      team_size_max: 4,
      eligibility: 'Open to all engineering students. Multi-disciplinary teams encouraged.',
      rules: 'All code must be written during the 36-hour hackathon window. Open source libraries allowed. Pre-existing projects are strictly disqualified.',
      evaluation_criteria: 'Innovation (30%), Technical Execution (30%), Real-world Viability (20%), Final Pitch (20%)',
      registration_deadline: '2026-11-15T23:59:59',
      event_start_date: '2026-11-20T09:00:00',
      event_end_date: '2026-11-21T21:00:00',
      status: 'PUBLISHED',
      capacity: 250,
      results_published: 0
    },
    {
      title: 'RoboWars & Drone Sprint 2026',
      slug: 'robowars-drone-sprint-2026',
      category: 'Robotics',
      club_id: 18, // Robotics Club
      organizer_name: 'Robotics Club AIT',
      organizer_id: 3,
      description: 'The clash of combat steel and aerial agility! 15kg / 30kg combat bot arena battles plus high-speed FPV drone obstacle courses.',
      problem_statement: 'Design combat robots capable of offensive and defensive maneuvers in an armored enclosed arena with active hazards.',
      banner_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
      mode: 'In-Person',
      venue: 'Mechanical Quadrangle & Open Ground, AIT Pune',
      prize_pool: '₹80,000 + Toolkits',
      team_size_min: 2,
      team_size_max: 5,
      eligibility: 'Open to all colleges and autonomous robotics teams.',
      rules: 'Bots must strictly adhere to weight limits and fail-safe RF cutoffs.',
      evaluation_criteria: 'Arena survival, damage inflicted, driver agility, mechanical robustness.',
      registration_deadline: '2026-11-10T23:59:59',
      event_start_date: '2026-11-16T10:00:00',
      event_end_date: '2026-11-17T18:00:00',
      status: 'PUBLISHED',
      capacity: 100,
      results_published: 0
    },
    {
      title: 'AlgoSprint: Annual Inter-College Competitive Coding',
      slug: 'algosprint-2026',
      category: 'Coding',
      club_id: 20, // Coding Cell
      organizer_name: 'Coding Cell AIT',
      organizer_id: 10,
      description: 'Speed, accuracy, and algorithmic ingenuity. 6 intense problems ranging from dynamic programming to number theory.',
      problem_statement: 'Solve algorithmic challenges within 3 hours under strict runtime and memory limits on our custom judge.',
      banner_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
      mode: 'Online',
      venue: 'Online Judge (Codeforces / HackerEarth)',
      prize_pool: '₹35,000 + Cash Vouchers',
      team_size_min: 1,
      team_size_max: 1,
      eligibility: 'Individual participation only.',
      rules: 'Strict plagiarism check. Standard IO formats. Languages: C++, Java, Python.',
      evaluation_criteria: 'Test cases solved, submission penalty time.',
      registration_deadline: '2026-11-05T18:00:00',
      event_start_date: '2026-11-06T19:00:00',
      event_end_date: '2026-11-06T22:00:00',
      status: 'PUBLISHED',
      capacity: 500,
      results_published: 0
    },
    {
      title: 'PACE 2026: Inter-Collegiate Sports Championship',
      slug: 'pace-sports-fest-2026',
      category: 'Sports',
      club_id: 3, // Sports Club
      organizer_name: 'AIT Sports Club',
      organizer_id: 8,
      description: 'One of Western India’s premier collegiate sports tournaments featuring Basketball, Football, Cricket, Badminton, and Athletics.',
      problem_statement: 'Represent your college contingent across 8 sporting tracks under Olympic standards and state referees.',
      banner_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80',
      mode: 'In-Person',
      venue: 'AIT Main Sports Complex & Shivaji Ground',
      prize_pool: '₹2,00,000 Trophies & Medals',
      team_size_min: 5,
      team_size_max: 15,
      eligibility: 'Valid college ID required. Medical clearance mandatory.',
      rules: 'Follow respective federation rules (FIFA, FIBA, BWF).',
      evaluation_criteria: 'Tournament knockout and round-robin points.',
      registration_deadline: '2026-12-01T23:59:59',
      event_start_date: '2026-12-10T08:00:00',
      event_end_date: '2026-12-14T20:00:00',
      status: 'PUBLISHED',
      capacity: 800,
      results_published: 0
    },
    {
      title: 'Aakriti 2026: Battle of the Bands & Street Dance',
      slug: 'aakriti-battle-of-bands-2026',
      category: 'Cultural',
      club_id: 11, // Cultural Board
      organizer_name: 'Cultural Board & Feet Tappers',
      organizer_id: 11,
      description: 'The monumental stage of Western India colleges. Live rock & fusion band showdown and mega crew street dance.',
      problem_statement: 'Original composition performance for rock bands; 8-12 min thematic choreography for dance crews.',
      banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
      mode: 'In-Person',
      venue: 'Manekshaw Open Air Amphitheatre, AIT Pune',
      prize_pool: '₹1,20,000 + Studio Recording Deal',
      team_size_min: 4,
      team_size_max: 12,
      eligibility: 'College student bands and official crew members.',
      rules: 'No pre-recorded vocals for bands. Live instrumentation judged.',
      evaluation_criteria: 'Originality, stage presence, synchronization, crowd engagement.',
      registration_deadline: '2026-12-15T23:59:59',
      event_start_date: '2027-01-08T16:00:00',
      event_end_date: '2027-01-10T23:00:00',
      status: 'PUBLISHED',
      capacity: 1200,
      results_published: 0
    },
    {
      title: 'AIT Intra-CTF 2026: Capture The Flag',
      slug: 'ait-intra-ctf-2026',
      category: 'Competition',
      club_id: 16, // ISDF
      organizer_name: 'ISDF AIT',
      organizer_id: 5,
      description: 'Hands-on jeopardy-style hacking challenge testing Web exploitation, Cryptography, Forensics, and Reverse Engineering.',
      problem_statement: 'Uncover hidden flags embedded in vulnerable servers, obfuscated binaries, and packet captures.',
      banner_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80',
      mode: 'Online',
      venue: 'CTFd Platform (Internal AIT Network)',
      prize_pool: '₹25,000 + Certified Badges',
      team_size_min: 1,
      team_size_max: 3,
      eligibility: 'AIT Students only.',
      rules: 'No attacking the scoring platform infrastructure. Flag sharing results in disqualification.',
      evaluation_criteria: 'Dynamic flag points + solve timestamp.',
      registration_deadline: '2026-10-30T23:59:59',
      event_start_date: '2026-11-01T10:00:00',
      event_end_date: '2026-11-02T10:00:00',
      status: 'PUBLISHED',
      capacity: 200,
      results_published: 0
    },
    {
      title: 'IEEE Conference on Smart Systems & Edge AI (ICSSEA 2026)',
      slug: 'ieee-icssea-2026',
      category: 'Conference',
      club_id: 12, // R&D Cell
      organizer_name: 'R&D Cell & IEEE Student Branch',
      organizer_id: 2,
      description: 'Peer-reviewed international research paper presentations with proceedings submitted for inclusion into IEEE Xplore.',
      problem_statement: 'Original research contributions in Edge AI, IoT architectures, Intelligent Signal Processing, and Green Computing.',
      banner_url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80',
      mode: 'Hybrid',
      venue: 'Auditorium & Virtual Track, AIT Pune',
      prize_pool: 'Best Paper Awards (₹30,000)',
      team_size_min: 1,
      team_size_max: 4,
      eligibility: 'Undergraduate and postgraduate researchers with novel paper submissions.',
      rules: 'Double-blind peer review. IEEE manuscript format strictly required.',
      evaluation_criteria: 'Methodological rigor, novelty, experimental validation, oral presentation.',
      registration_deadline: '2026-11-25T23:59:59',
      event_start_date: '2026-12-18T09:00:00',
      event_end_date: '2026-12-19T17:30:00',
      status: 'PUBLISHED',
      capacity: 150,
      results_published: 0
    },
    // Past Event with Published Results for Demoing the Automatic Achievement Workflow!
    {
      title: 'AIT National Hackathon 2025 (Completed Archive)',
      slug: 'ait-national-hackathon-2025',
      category: 'Hackathon',
      club_id: 19, // Technical Board
      organizer_name: 'AIT Technical Board',
      organizer_id: 18,
      description: 'The celebrated 2025 edition with 60 finalist teams battling over smart military logistics, cyber security, and autonomous drones.',
      problem_statement: 'Build autonomous logistics monitoring solutions using edge vision and encrypted telemetry.',
      banner_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      mode: 'In-Person',
      venue: 'AIT Campus, Pune',
      prize_pool: '₹1,00,000',
      team_size_min: 3,
      team_size_max: 4,
      eligibility: 'All Engineering Students',
      rules: 'Code sprint completed.',
      evaluation_criteria: 'Completed.',
      registration_deadline: '2025-09-10T23:59:59',
      event_start_date: '2025-09-20T09:00:00',
      event_end_date: '2025-09-21T18:00:00',
      status: 'COMPLETED',
      capacity: 300,
      results_published: 1,
      result_summary: 'Winner: Team CyberSentinels (Lead: Rahul Sharma). 1st Runner-Up: Team NeuroPulse (Lead: Priya Nair). 2nd Runner-Up: Team AeroBot (Lead: Ananya Singh).'
    }
  ];

  const eventStmt = db.prepare(`
    INSERT INTO events (
      title, slug, category, club_id, organizer_name, organizer_id,
      description, problem_statement, banner_url, mode, venue, prize_pool,
      team_size_min, team_size_max, eligibility, rules, evaluation_criteria,
      registration_deadline, event_start_date, event_end_date, status,
      capacity, results_published, result_summary, academic_year, is_archive
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const e of events) {
    const isPastYear = e.event_start_date < '2026-07-01';
    const ay = isPastYear ? '2025-26' : '2026-27';
    const isArch = isPastYear ? 1 : 0;
    eventStmt.run(
      e.title, e.slug, e.category, e.club_id, e.organizer_name, e.organizer_id,
      e.description, e.problem_statement, e.banner_url, e.mode, e.venue, e.prize_pool,
      e.team_size_min, e.team_size_max, e.eligibility, e.rules, e.evaluation_criteria,
      e.registration_deadline, e.event_start_date, e.event_end_date, e.status,
      e.capacity, e.results_published, e.result_summary || null, ay, isArch
    );
  }

  // 6. Insert Teams and Registrations for Events
  // Team 1: CyberSentinels (Registered for Event 1: AIT Innovation Hackathon 2026)
  const teamStmt = db.prepare(`
    INSERT INTO teams (event_id, name, leader_id, description, required_skills, max_members, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  teamStmt.run(1, 'CyberSentinels', 1, 'Building decentralized defense telemetry system', 'React, Python, Edge AI, UI/UX', 4, 'FORMING');
  teamStmt.run(1, 'AeroVisionaries', 3, 'Autonomous drone inspection for solar grids', 'ROS, Python, Computer Vision, Hardware', 4, 'FORMING');
  teamStmt.run(2, 'Titanium Crusher', 4, '30kg Pneumatic Flipper BattleBot', 'SolidWorks, Welding, Arduino, RF Control', 4, 'FORMING');

  // Insert Team Members
  const memberStmt = db.prepare(`
    INSERT INTO team_members (team_id, user_id, role_in_team)
    VALUES (?, ?, ?)
  `);
  memberStmt.run(1, 1, 'Team Leader & Fullstack');
  memberStmt.run(1, 9, 'UI/UX & Frontend Designer');
  memberStmt.run(2, 3, 'Team Leader & Hardware Lead');
  memberStmt.run(2, 12, 'Drone Flight Engineer');
  memberStmt.run(3, 4, 'Team Leader & CAD Designer');

  // Insert Event Registrations
  const regStmt = db.prepare(`
    INSERT INTO event_registrations (registration_number, event_id, user_id, team_id, status, custom_answers)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  regStmt.run('AIT-2026-0045', 1, 1, 1, 'REGISTERED', '{"tshirt_size":"L","dietary":"Veg","github":"https://github.com/rahul-ait"}');
  regStmt.run('AIT-2026-0092', 1, 9, 1, 'REGISTERED', '{"tshirt_size":"M","dietary":"Veg"}');
  regStmt.run('AIT-2026-0134', 1, 3, 2, 'REGISTERED', '{"tshirt_size":"M","dietary":"Non-Veg"}');
  regStmt.run('AIT-2026-0211', 3, 10, null, 'REGISTERED', '{"codeforces_handle":"karan_m"}');
  regStmt.run('AIT-2026-0305', 4, 8, null, 'REGISTERED', '{"sport":"Basketball","tshirt_size":"XL"}');

  // 7. Insert Achievements (With Verified badges, Pending for Faculty demo, and Historical)
  const achStmt = db.prepare(`
    INSERT INTO achievements (
      user_id, event_id, title, event_name, organization, category,
      level, position, date, description, certificate_url,
      verification_status, verified_by, verified_at, is_highlight, points_awarded
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Rahul Sharma (Verified Achievements)
  achStmt.run(
    1, 8, 'Winner - Smart India Hackathon 2025',
    'Smart India Hackathon (SIH)', 'Ministry of Education & AICTE', 'Hackathon',
    'National', 'Winner (1st)', '2025-10-18',
    'Secured 1st place among 150 teams nationwide for developing an offline-first mesh communications network for border patrol units.',
    '/uploads/sample-cert-sih.pdf', 'VERIFIED', 22, '2025-10-25 14:30:00', 1, 30
  );

  achStmt.run(
    1, null, '1st Runner Up - AIT CodeCraft 2025',
    'AIT CodeCraft', 'Coding Cell AIT', 'Competition',
    'College', '1st Runner-up (2nd)', '2025-04-12',
    'Solved 5 out of 6 advanced algorithmic challenges in 2 hours with zero penalty submissions.',
    '/uploads/sample-cert-codecraft.pdf', 'VERIFIED', 22, '2025-04-15 11:20:00', 0, 20
  );

  // Priya Nair (Verified Research Achievement)
  achStmt.run(
    2, null, 'Best Paper Award - IEEE ICETET 2025',
    'International Conference on Emerging Trends in Eng & Tech', 'IEEE Pune Section', 'Research',
    'International', 'Winner (1st)', '2025-08-22',
    'Awarded Best Paper for research on "Attention-Guided Feature Maps in Retinal Disease Detection".',
    '/uploads/sample-cert-ieee.pdf', 'VERIFIED', 22, '2025-08-30 09:15:00', 1, 30
  );

  // Ananya Singh (Verified Robotics Achievement)
  achStmt.run(
    3, null, 'National Finalist - DD Robocon India 2025',
    'DD Robocon India', 'Doordarshan & IIT Delhi', 'Competition',
    'National', 'Finalist', '2025-06-18',
    'Led mechanics and autonomous navigation for the four-wheeled omnidirectional robot representing AIT.',
    '/uploads/sample-cert-robocon.pdf', 'VERIFIED', 22, '2025-06-25 16:45:00', 1, 20
  );

  // Neeraj Chopra Jr (Verified Sports Achievement)
  achStmt.run(
    8, null, 'Gold Medal - Inter-University Athletics Championship',
    'SPPU Annual Inter-Collegiate Meet', 'Savitribai Phule Pune University', 'Sports',
    'University', 'Winner (1st)', '2025-11-14',
    'Set university meet record in Javelin Throw with a throw distance of 68.4 meters.',
    '/uploads/sample-cert-sports.pdf', 'VERIFIED', 22, '2025-11-20 10:00:00', 1, 30
  );

  // Pending Submissions for the Faculty Verifier Queue to Review & Approve live!
  achStmt.run(
    1, null, 'Google Cloud Certified Professional Cloud Architect',
    'Google Cloud Certification', 'Google Cloud', 'Academic',
    'International', 'Participant', '2026-03-15',
    'Passed professional examination demonstrating enterprise cloud security and scalable infrastructure architecture.',
    '/uploads/pending-gcp-cert.pdf', 'PENDING', null, null, 0, 0
  );

  achStmt.run(
    4, null, 'National Design Champion - SAE Supra 2025',
    'SAE Supra India', 'Society of Automotive Engineers', 'Competition',
    'National', 'Winner (1st)', '2025-12-05',
    'Designed carbon-fiber aerodynamic rear wing and diffuser evaluated by Formula 1 technical judges.',
    '/uploads/pending-sae-cert.pdf', 'PENDING', null, null, 0, 0
  );

  achStmt.run(
    5, null, 'Top 10 Finalist - InCTF National Cyber Challenge',
    'InCTF National 2025', 'Amrita Cyber Security Center', 'Competition',
    'National', 'Finalist', '2026-01-20',
    'Reverse engineered 4 proprietary ARM binary firmware challenges during 24-hour CTF round.',
    '/uploads/pending-inctf.pdf', 'PENDING', null, null, 0, 0
  );

  // 8. Insert Certificates in Vault
  const certStmt = db.prepare(`
    INSERT INTO certificates (user_id, name, issuer, issue_date, credential_id, file_url, category, is_public, verification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  certStmt.run(1, 'Smart India Hackathon Winner Certificate', 'Ministry of Education & AICTE', '2025-10-18', 'SIH-2025-9921', '/uploads/cert-sih-rahul.pdf', 'Winner', 1, 'VERIFIED');
  certStmt.run(1, 'AWS Certified Solutions Architect Associate', 'Amazon Web Services', '2025-06-10', 'AWS-ARCH-883921', '/uploads/cert-aws-rahul.pdf', 'Course', 1, 'VERIFIED');
  certStmt.run(1, 'Confidential Military Internship Clearance Certificate', 'Army HQ Training Command', '2025-07-28', 'MIL-TC-092', '/uploads/cert-private-rahul.pdf', 'Internship', 0, 'VERIFIED'); // Private vault item!

  // 9. Insert Projects
  const projStmt = db.prepare(`
    INSERT INTO projects (user_id, title, description, problem_statement, solution, tech_stack, github_url, demo_url, banner_url, team_members, completed_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  projStmt.run(
    1, 'AeroGuard: AI-Powered Autonomous Border Surveillance Mesh',
    'Decentralized drone surveillance network that runs real-time edge computer vision to detect intrusions and transmit encrypted coordinates without internet.',
    'Border terrain lacks cellular networks and requires resilient low-bandwidth encrypted communication.',
    'Built a lightweight YOLOv8 quantized model running on Jetson Nano, communicating over LoRa 868MHz mesh protocols.',
    'Python, PyTorch, YOLOv8, React, WebSockets, LoRa, Docker',
    'https://github.com/rahul-ait/aeroguard-mesh', 'https://aeroguard.aitpune.dev',
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80',
    'Rahul Sharma, Ananya Singh, Divya Menon', '2025-11-20'
  );

  projStmt.run(
    1, 'CampusFlow: Smart Resource Booking for AIT Labs & Arenas',
    'Centralized scheduling portal for AIT Pune computer laboratories, 3D printing suites, and badminton courts with student ID authentication.',
    'Manual paper registers created double-bookings and lack of usage audit logs.',
    'Built a real-time reservation engine with automated QR check-in and faculty approval notifications.',
    'TypeScript, React, Node.js, SQLite, Tailwind CSS',
    'https://github.com/rahul-ait/campusflow', '',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    'Rahul Sharma', '2025-08-15'
  );

  projStmt.run(
    2, 'RetinaSense: Explainable Deep Learning for Diabetic Retinopathy',
    'Diagnostic web system that generates visual Grad-CAM heatmap explanations for ophthalmologists to identify microaneurysms.',
    'Black-box neural networks face hesitation from clinical practitioners.',
    'Integrated guided backpropagation and attention maps alongside DenseNet-121 classification.',
    'Python, PyTorch, Flask, OpenCV, React, Tailwind CSS',
    'https://github.com/priyanair/retinasense-xai', 'https://retinasense.org',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
    'Priya Nair, Dr. S. R. Patil', '2025-09-10'
  );

  // 10. Insert Research Papers
  const paperStmt = db.prepare(`
    INSERT INTO research_papers (user_id, title, authors, research_area, conference_or_journal, is_ieee, status, publication_date, doi, url, abstract, pdf_url, verification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  paperStmt.run(
    2, 'Explainable Deep Convolutional Networks for Multi-Class Diabetic Retinopathy Screening',
    'Priya Nair, Dr. S. R. Patil, Rahul Sharma',
    'Artificial Intelligence & Healthcare', 'IEEE International Conference on Advanced Computing (IACC 2025)',
    1, 'PUBLISHED', '2025-09-15', '10.1109/IACC58291.2025.1029381',
    'https://ieeexplore.ieee.org/document/1029381',
    'Early detection of diabetic retinopathy is critical to preventing permanent vision impairment. This paper presents an end-to-end explainable vision architecture with 96.4% sensitivity and visual saliency maps for clinical validation.',
    '/uploads/research-retinopathy.pdf', 'VERIFIED'
  );

  paperStmt.run(
    1, 'Resilient Low-Power Mesh Telemetry over LoRa for Wilderness and Border Reconnaissance',
    'Rahul Sharma, Ananya Singh, Dr. Nilesh Kawache',
    'Edge Networks & Embedded Systems', 'Springer Lecture Notes in Networks and Systems',
    0, 'PUBLISHED', '2025-11-04', '10.1007/978-981-99-8812-3_45',
    'https://link.springer.com/chapter/10.1007/978-981-99-8812-3_45',
    'Presents a multihop routing protocol specifically optimized for low-bandwidth telemetry across mountainous terrain where satellite latency and cellular outages occur.',
    '/uploads/research-lora.pdf', 'VERIFIED'
  );

  // 11. Insert Internships
  const internStmt = db.prepare(`
    INSERT INTO internships (title, company, role, location, mode, stipend, duration, skills_required, eligibility, deadline, apply_url, description, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  internStmt.run(
    'Software Engineering Intern - Cloud Systems', 'Microsoft India', 'Software Engineer Intern',
    'Hyderabad / Bengaluru', 'Hybrid', '₹1,25,000 / month', '2 Months (Summer 2027)',
    'C++, C#, Distributed Systems, Data Structures, Algorithms',
    'B.Tech pre-final year students (Comp, IT, EnTC) with CGPA >= 7.5',
    '2026-11-30', 'https://careers.microsoft.com',
    'Work alongside world-class Azure engineering teams on high-scale distributed systems, reliability architectures, and modern cloud primitives.', 1
  );

  internStmt.run(
    'Autonomous Systems Research Intern', 'DRDO - Defense Research & Development Lab', 'Research Intern',
    'Pune / Hyderabad', 'On-site', '₹25,000 / month + Accommodation', '3 Months',
    'ROS, Python, Computer Vision, Embedded Systems, C++',
    'Open to Indian nationals enrolled in AIT Engineering branches (Year 3/4)',
    '2026-11-20', 'https://drdo.gov.in/internships',
    'Hands-on research on guidance algorithms, autonomous unmanned vehicles, and telemetry decryption.', 1
  );

  internStmt.run(
    'AI / Deep Learning Engineering Intern', 'NVIDIA India', 'Deep Learning Intern',
    'Pune', 'Hybrid', '₹90,000 / month', '6 Months',
    'PyTorch, CUDA, Python, TensorRT, C++',
    'Pre-final or Final Year students with demonstrated ML projects or publications',
    '2026-12-05', 'https://nvidia.com/careers',
    'Accelerate next-generation generative AI and computer vision models utilizing CUDA and TensorRT acceleration.', 1
  );

  internStmt.run(
    'Electric Vehicle Powertrain Intern', 'Tata Motors Passenger Vehicles', 'EV Design Intern',
    'Pune (Pimpri Facility)', 'On-site', '₹35,000 / month', '6 Months',
    'SolidWorks, MATLAB Simulink, Battery Management Systems, Thermal Modeling',
    'Mechanical & EnTC engineering 3rd/4th year students',
    '2026-11-18', 'https://tatamotors.com/careers',
    'Analyze thermal dissipation and structural crash-worthiness of high-voltage battery enclosures.', 1
  );

  // 12. Insert Scholarships
  const scholStmt = db.prepare(`
    INSERT INTO scholarships (name, provider, amount, eligibility, eligible_branches, eligible_years, deadline, required_documents, apply_url, description, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  scholStmt.run(
    'AWES Merit Scholarship Scheme for AIT Students',
    'Army Welfare Education Society (AWES)', '₹40,000 / year',
    'Wards of serving/retired Army personnel with minimum 75% marks or CGPA 7.5 in previous academic year.',
    'All Branches', '1, 2, 3, 4', '2026-11-30',
    'Army discharge book / Serving certificate, Previous semester marksheets, Bonafide certificate',
    'https://awesindia.com/scholarships',
    'Prestigious institutional scholarship rewarding academic excellence among Army Institute of Technology undergraduates.', 1
  );

  scholStmt.run(
    'Prime Minister’s Scholarship Scheme (PMSS)',
    'Welfare and Rehabilitation Board (WARB), Ministry of Home Affairs', '₹36,000 / year for boys, ₹42,000 / year for girls',
    'Dependent wards & widows of Ex-Coast Guard / Ex-Servicemen personnel pursuing technical degree courses.',
    'Computer, IT, EnTC, Mechanical', '1, 2, 3, 4', '2026-12-15',
    'PPO / ESM Identity card, Annexure-1 bonafide, Bank passbook',
    'https://desw.gov.in/pmss',
    'Central Government scholarship providing financial aid for higher professional and technical education.', 1
  );

  scholStmt.run(
    'Tata Trust Higher Education Financial Grant',
    'Tata Trusts Mumbai', 'Up to ₹1,00,000 tuition waiver',
    'Engineering students demonstrating high academic potential with family income < ₹6 LPA.',
    'All Branches', '2, 3, 4', '2026-12-10',
    'Income certificate, Fee receipt, Marksheets, Faculty recommendation letter',
    'https://tatatrusts.org/education',
    'Need-cum-merit educational grant assisting talented undergraduates facing economic hardship.', 1
  );

  scholStmt.run(
    'IEEE Women in Engineering (WIE) Travel & Project Grant',
    'IEEE Pune Section', '₹50,000 per accepted paper',
    'Female undergraduate IEEE student members with accepted research papers at IEEE sponsored conferences.',
    'Computer, IT, EnTC', '3, 4', '2026-11-25',
    'Conference acceptance email, IEEE membership card, Full manuscript draft',
    'https://ieeepunesection.org/wie-grants',
    'Grant funding conference travel, registration, and laboratory prototype expenses for female researchers.', 1
  );

  // 13. Insert Notifications
  const notifStmt = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  notifStmt.run(
    1, 'Achievement Verified! ✓',
    'Your Smart India Hackathon 2025 Winner achievement has been verified by Dr. S. R. Patil. +30 contribution points awarded.',
    'ACHIEVEMENT', '/student/rahul.sharma', 0, '2026-10-23 18:30:00'
  );
  notifStmt.run(
    1, 'New Team Invitation Received',
    'Ananya Singh invited you to join team "AeroVisionaries" as Fullstack & Telemetry Lead.',
    'INVITATION', '/teams', 0, '2026-10-23 20:15:00'
  );
  notifStmt.run(
    1, '🔴 Deadline Closing Soon: AIT Innovation Hackathon',
    'Registration for AIT Innovation Hackathon 2026 closes in 18 hours. Complete your team submission.',
    'DEADLINE', '/event/1', 0, '2026-10-24 00:00:00'
  );

  // 14. Insert Student Internships & Leadership for Rahul Sharma's Portfolio
  query.run(`
    INSERT INTO student_internships (user_id, company, role, location, mode, start_date, end_date, description, skills_used, certificate_url)
    VALUES (1, 'Cisco Systems India', 'Network Software Intern', 'Bengaluru', 'Hybrid', 'June 2025', 'August 2025',
      'Developed telemetry microservices for enterprise routers using Golang and Kafka. Reduced log latency by 35%.',
      'Go, Docker, Kafka, Linux, Kubernetes', '/uploads/cisco-intern-cert.pdf')
  `);

  query.run(`
    INSERT INTO student_leadership (user_id, organization, role, start_date, end_date, responsibilities, achievements)
    VALUES (1, 'GDSC AIT Pune', 'Technical Lead - Cloud & Systems', 'July 2024', 'Present',
      'Mentored 150+ students in cloud architectures and orchestrated Solution Challenge bootcamps.',
      'Organized 4 workshops with 400+ attendees and led 2 teams to national finals.')
  `);

  query.run(`
    INSERT INTO student_certifications (user_id, name, issuer, credential_id, issue_date, expiry_date, verification_url)
    VALUES (1, 'AWS Certified Solutions Architect – Associate', 'Amazon Web Services', 'AWS-0938481', 'June 2025', 'June 2028', 'https://aws.amazon.com/verification')
  `);

  console.log('Seed completed successfully with 23 users, 22 clubs, 8 events, 3 teams, 8 achievements, 3 projects, 2 research papers, 4 internships, 4 scholarships.');
}

// If run directly via node seed.js
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedData();
}
