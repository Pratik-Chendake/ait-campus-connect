import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GlobalSearchModal from './components/GlobalSearchModal';
import RoleGuard from './components/RoleGuard';
import ProtectedRoute from './components/ProtectedRoute';
import BackgroundVideo from './components/BackgroundVideo';
import RoleSwitcher from './components/RoleSwitcher';

// Public Authentication Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Logout from './pages/Logout';

// Protected Campus Content Pages
import Home from './pages/Home';
import Opportunities from './pages/Opportunities';
import OpportunityDetail from './pages/OpportunityDetail';
import Competitions from './pages/Competitions';
import Hackathons from './pages/Hackathons';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Clubs from './pages/Clubs';
import ClubDetail from './pages/ClubDetail';
import StudentDirectory from './pages/StudentDirectory';
import StudentPortfolio from './pages/StudentPortfolio';
import HallOfFame from './pages/HallOfFame';
import Leaderboard from './pages/Leaderboard';
import Internships from './pages/Internships';
import Scholarships from './pages/Scholarships';
import ScholarshipDetail from './pages/ScholarshipDetail';
import Research from './pages/Research';

// Authenticated Student Pages
import Dashboard from './pages/Dashboard';
import ProfileEdit from './pages/ProfileEdit';
import Achievements from './pages/Achievements';
import MyAchievements from './pages/MyAchievements';
import ParticipationDetail from './pages/ParticipationDetail';
import CertificatesVault from './pages/CertificatesVault';
import MyApplications from './pages/MyApplications';
import Teams from './pages/Teams';
import FindTeammates from './pages/FindTeammates';
import SavedItems from './pages/SavedItems';
import NotificationsPage from './pages/NotificationsPage';

// Four Primary Role Dashboards
import ClubDashboard from './pages/ClubDashboard';
import VerificationCenter from './pages/VerificationCenter';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  // Global hotkey Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 selection:bg-rose-500 selection:text-white relative overflow-x-hidden">
          {/* Global Dark Effect Video Background & Liquid Glass Ambience */}
          <BackgroundVideo />

          <Navbar onOpenSearch={() => setSearchOpen(true)} />

          <main className="flex-1 relative z-10">
            <Routes>
              {/* ===================== PUBLIC AUTHENTICATION ROUTES ===================== */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/logout" element={<Logout />} />

              {/* ===================== CORE PLATFORM ROUTES ===================== */}
              <Route path="/" element={<Home />} />

              {/* Redesigned Opportunities (Internships & Scholarships exclusively) */}
              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/opportunity/:id" element={<OpportunityDetail />} />

              {/* Dedicated Competitions Portal */}
              <Route path="/competitions" element={<Competitions />} />

              {/* Dedicated Hackathons Portal */}
              <Route path="/hackathons" element={<Hackathons />} />

              {/* Events & Clubs */}
              <Route path="/events" element={<Events />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/clubs" element={<Clubs />} />
              <Route path="/club/:id" element={<ClubDetail />} />

              {/* Student Directory & Portfolios */}
              <Route path="/students" element={<StudentDirectory />} />
              <Route path="/student/:username" element={<StudentPortfolio />} />

              {/* Leaderboard & Hall of Fame */}
              <Route path="/hall-of-fame" element={<HallOfFame />} />
              <Route path="/leaderboard" element={<Leaderboard />} />

              {/* Dedicated Internships View */}
              <Route path="/internships" element={<Internships />} />

              {/* Dedicated Scholarships Master Portal */}
              <Route path="/scholarships" element={<Scholarships />} />
              <Route path="/scholarships/:slug" element={<ScholarshipDetail />} />

              {/* Research & Publications */}
              <Route
                path="/research"
                element={
                  <ProtectedRoute>
                    <Research />
                  </ProtectedRoute>
                }
              />

              {/* ===================== ROLE-GUARDED DASHBOARDS ===================== */}
              <Route
                path="/student/dashboard"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <Dashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/organizer/dashboard"
                element={
                  <RoleGuard allowedRoles={['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <ClubDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                    <AdminDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/super-admin/dashboard"
                element={
                  <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                    <SuperAdminDashboard />
                  </RoleGuard>
                }
              />

              {/* Backward-Compatible Route Aliases */}
              <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
              <Route path="/club-dashboard" element={<Navigate to="/organizer/dashboard" replace />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

              {/* Authenticated Student Hub Routes */}
              <Route
                path="/profile"
                element={<Navigate to="/profile/edit" replace />}
              />
              <Route
                path="/profile/edit"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <ProfileEdit />
                  </RoleGuard>
                }
              />
              {/* Permanent Student Achievement & Participation Record System */}
              <Route
                path="/my-achievements"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <MyAchievements />
                  </RoleGuard>
                }
              />
              <Route
                path="/my-achievements/:id"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <ParticipationDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="/achievements"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <Achievements />
                  </RoleGuard>
                }
              />
              <Route
                path="/student/verification"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <Achievements />
                  </RoleGuard>
                }
              />
              <Route
                path="/submit-achievement"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <Achievements />
                  </RoleGuard>
                }
              />
              <Route
                path="/certificates"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <CertificatesVault />
                  </RoleGuard>
                }
              />
              <Route
                path="/applications"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <MyApplications />
                  </RoleGuard>
                }
              />
              <Route
                path="/teams"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <Teams />
                  </RoleGuard>
                }
              />
              <Route
                path="/teams/find"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <FindTeammates />
                  </RoleGuard>
                }
              />
              <Route
                path="/saved"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <SavedItems />
                  </RoleGuard>
                }
              />
              <Route
                path="/notifications"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}>
                    <NotificationsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/verification"
                element={
                  <RoleGuard allowedRoles={['FACULTY', 'ADMIN', 'SUPER_ADMIN']}>
                    <VerificationCenter />
                  </RoleGuard>
                }
              />

              {/* Fallback to Root (which redirects to Login if unauthenticated) */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />

          {/* Global Search Modal */}
          <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

          {/* Global Role Switcher Widget */}
          <RoleSwitcher />
        </div>
      </Router>
    </AuthProvider>
  );
}
