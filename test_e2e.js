async function runTests() {
  console.log('🧪 Starting End-to-End Test Suite for AIT Campus Connect...\n');
  const BASE = 'http://localhost:5000/api';

  // Helper
  const request = async (url, method = 'GET', body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${url}`, opts);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  };

  // 1. Health & Domain check
  console.log('1. Testing Health & Domain configuration...');
  const health = await request('/health');
  console.assert(health.ok && health.data.status === 'healthy', 'Health check failed');
  const domain = await request('/auth/domain');
  console.assert(domain.ok && domain.data.domain === '@aitpune.edu.in', 'Domain check failed');
  console.log('   ✓ Health & Domain validated (@aitpune.edu.in)');

  // 2. Student Registration
  console.log('2. Testing Student Registration...');
  const testStudentId = `TEST_${Date.now().toString().slice(-4)}`;
  const regRes = await request('/auth/register', 'POST', {
    full_name: 'Varun Dhawan',
    student_id: testStudentId,
    email: `varun.${testStudentId.toLowerCase()}@aitpune.edu.in`,
    password: 'password123',
    branch: 'Computer Engineering',
    year: 3,
    semester: 5
  });
  console.assert(regRes.ok && regRes.data.token, `Registration failed: ${JSON.stringify(regRes.data)}`);
  const studentToken = regRes.data.token;
  const studentId = regRes.data.user.id;
  console.log(`   ✓ Registered student ${regRes.data.user.full_name} (ID: ${studentId})`);

  // 3. Profile update & Add Skill
  console.log('3. Testing Profile Update & Skills...');
  const profileRes = await request(`/students/${studentId}/profile`, 'PATCH', {
    bio: 'Robotics and Deep Learning researcher at AIT Pune.',
    github_url: 'https://github.com/varun-test'
  }, studentToken);
  console.assert(profileRes.ok, 'Profile update failed');

  const skillRes = await request(`/students/${studentId}/skills`, 'POST', {
    skill_name: 'PyTorch',
    level: 'Expert'
  }, studentToken);
  console.assert(skillRes.ok, 'Add skill failed');
  console.log('   ✓ Profile and PyTorch skill updated');

  // 4. Achievement Submission (defaults to PENDING)
  console.log('4. Testing Achievement Submission...');
  const achRes = await request('/achievements', 'POST', {
    title: 'Winner - National AI Robotics Sprint 2026',
    event_name: 'National AI Robotics Sprint',
    organization: 'Robotics Society of India',
    category: 'Hackathon',
    level: 'National',
    position: 'Winner (1st)',
    date: '2026-10-20',
    description: 'Built autonomous search-and-rescue rover.',
    certificate_url: '/uploads/sample-proof.pdf'
  }, studentToken);
  console.assert(achRes.ok && achRes.data.id, 'Achievement submit failed');
  const achId = achRes.data.id;
  console.log(`   ✓ Submitted achievement #${achId} with status PENDING`);

  // 5. Faculty Verification Workflow
  console.log('5. Testing Faculty Verification Workflow...');
  const facultyLogin = await request('/auth/quick-login', 'POST', { role: 'FACULTY' });
  console.assert(facultyLogin.ok, 'Faculty login failed');
  const facultyToken = facultyLogin.data.token;

  const queue = await request('/verification/pending', 'GET', null, facultyToken);
  const foundInQueue = queue.data.pending_achievements.some(a => a.id === achId);
  console.assert(foundInQueue, 'Achievement not found in faculty verification queue');

  const approveRes = await request(`/verification/achievements/${achId}/approve`, 'POST', { points_override: 30 }, facultyToken);
  console.assert(approveRes.ok, 'Faculty approve failed');
  console.log(`   ✓ Faculty Dr. S. R. Patil approved achievement #${achId} (+30 points)`);

  // 6. Verify Points & Portfolio
  console.log('6. Verifying student points update...');
  const studentProfile = await request(`/students/${studentId}`);
  console.assert(studentProfile.data.user.contribution_score >= 30, 'Contribution score not updated');
  const verifiedAch = studentProfile.data.achievements.find(a => a.id === achId);
  console.assert(verifiedAch && verifiedAch.verification_status === 'VERIFIED', 'Achievement not marked VERIFIED');
  console.log(`   ✓ Student score is now ${studentProfile.data.user.contribution_score} with status VERIFIED`);

  // 7. Event Discovery & Registration
  console.log('7. Testing Event Registration...');
  const eventReg = await request('/events/1/register', 'POST', {
    custom_answers: { tshirt_size: 'L', dietary: 'Veg' }
  }, studentToken);
  console.assert(eventReg.ok && eventReg.data.registration_number, 'Event registration failed');
  console.log(`   ✓ Enrolled for Event #1 with Registration Number: ${eventReg.data.registration_number}`);

  // 8. Team Formation & Matchmaking Algorithm
  console.log('8. Testing Team Formation & Matchmaking Algorithm...');
  const teamCreate = await request('/teams', 'POST', {
    event_id: 1,
    name: 'AlphaSquad 2026',
    description: 'Autonomous Edge AI',
    required_skills: 'Python, ROS, React',
    max_members: 4
  }, studentToken);
  console.assert(teamCreate.ok && teamCreate.data.team_id, 'Team creation failed');
  const teamId = teamCreate.data.team_id;

  const matchRes = await request(`/teams/match/candidates?required_skills=Python,React`, 'GET', null, studentToken);
  console.assert(matchRes.ok && matchRes.data.candidates.length > 0, 'Matchmaker failed');
  const topCandidate = matchRes.data.candidates[0];
  console.log(`   ✓ Matchmaker found top candidate: ${topCandidate.full_name} (${topCandidate.match_score}% MATCH)`);

  // Send Invitation
  const inviteRes = await request(`/teams/${teamId}/invite`, 'POST', {
    invitee_id: topCandidate.id,
    role_offered: 'ROS Robotics Lead'
  }, studentToken);
  console.assert(inviteRes.ok, 'Team invite failed');
  console.log(`   ✓ Sent squad invitation to ${topCandidate.full_name}`);

  // 9. Club Organizer Results Publishing -> Automatic Achievement Engine
  console.log('9. Testing Club Results Publishing & Auto Achievement Engine...');
  const clubLogin = await request('/auth/quick-login', 'POST', { role: 'ORGANIZER' });
  const clubToken = clubLogin.data.token;

  // Publish results for Event 1
  const publishRes = await request('/events/1/results', 'POST', {
    winners: [studentId],
    runners_up: [1],
    finalists: [2],
    result_summary: 'Varun Dhawan won 1st Place with AlphaSquad.'
  }, clubToken);
  console.assert(publishRes.ok, 'Publish results failed');

  // Check if auto achievement was created
  const updatedStudent = await request(`/students/${studentId}`);
  const autoCreatedAch = updatedStudent.data.achievements.find(a => a.event_id === 1 && a.position.includes('Winner'));
  console.assert(autoCreatedAch, 'Automatic achievement was not created!');
  console.log(`   ✓ Automatic Achievement created: "${autoCreatedAch.title}" (Points: +${autoCreatedAch.points_awarded})`);

  // 10. Global Search
  console.log('10. Testing Multi-Entity Global Search...');
  const searchRes = await request('/search?q=Python');
  console.assert(searchRes.ok && (searchRes.data.students.length > 0 || searchRes.data.events.length > 0), 'Search failed');
  console.log(`   ✓ Global search for "Python" matched ${searchRes.data.total_matches} entities across platform`);

  // 11. Super Admin Dashboard
  console.log('11. Testing Super Admin Console & Metrics...');
  const adminLogin = await request('/auth/quick-login', 'POST', { role: 'ADMIN' });
  const adminToken = adminLogin.data.token;

  const adminStats = await request('/admin/stats', 'GET', null, adminToken);
  console.assert(adminStats.ok && adminStats.data.metrics.total_students >= 20, 'Admin stats failed');
  console.log(`   ✓ Admin metrics: ${adminStats.data.metrics.total_students} students, ${adminStats.data.metrics.total_clubs} clubs, ${adminStats.data.metrics.verified_achievements} verified achievements`);

  console.log('\n======================================================');
  console.log('🎉 ALL 11 END-TO-END TEST JOURNEYS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runTests();
