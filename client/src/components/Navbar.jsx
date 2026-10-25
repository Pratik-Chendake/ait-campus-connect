import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, Search, Bell, Menu, X, LogOut, ChevronDown, Check,
  Sparkles, ArrowRight, LayoutDashboard, UserCheck, Crown, User, Bookmark, Trophy,
  Repeat, Users, KeyRound, ShieldCheck
} from 'lucide-react';
import { useAuth, getDashboardRoute } from '../context/AuthContext';
import LogoutModal from './LogoutModal';

export default function Navbar({ onOpenSearch }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for global open-logout-modal events
  React.useEffect(() => {
    const handleOpenLogout = () => setLogoutModalOpen(true);
    window.addEventListener('open-logout-modal', handleOpenLogout);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogout);
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const userDashboardPath = getDashboardRoute(user?.role);
  const isVerifier = ['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes((user?.role || '').toUpperCase());

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Hackathons', path: '/hackathons' },
    { label: 'Competitions', path: '/competitions' },
    { label: 'Events', path: '/events' },
    { label: 'Clubs', path: '/clubs' },
    { label: 'Opportunities', path: '/opportunities' },
    { label: 'Dashboard', path: userDashboardPath },
    ...(isVerifier ? [{ label: 'Verification Center', path: '/verification' }] : []),
  ];

  const getRoleBadgeStyle = (role) => {
    const r = (role || '').toUpperCase();
    if (r === 'SUPER_ADMIN') return 'bg-purple-950/70 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]';
    if (r === 'ADMIN') return 'bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
    if (r === 'FACULTY') return 'bg-amber-950/70 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
    if (r === 'ORGANIZER') return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
    return 'bg-blue-950/70 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]';
  };

  const formatRoleName = (role) => {
    if (!role) return 'Student';
    const r = String(role).toUpperCase();
    if (r === 'SUPER_ADMIN') return 'Super Admin';
    if (r === 'ADMIN') return 'Admin';
    if (r === 'FACULTY') return 'Faculty';
    if (r === 'ORGANIZER') return 'Organizer';
    return 'Student';
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#030712]/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.7)] transition-all">
      <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 xl:gap-3 2xl:gap-5">
          {/* LEFT: Logo & Website Name */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 group-hover:shadow-rose-500/30 transition-all border border-white/20 overflow-hidden shrink-0">
              <img src="/ait-logo.png" alt="AIT Pune Crest" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white leading-none">AIT</span>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-cyan-300 to-rose-400 bg-clip-text text-transparent leading-none">
                  CAMPUS CONNECT
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block leading-none mt-1">
                Army Institute of Technology
              </span>
            </div>
          </Link>

          {/* CENTER: Navigation Links (Rendered for all, highlighting active) */}
          <div className="hidden xl:flex items-center space-x-0.5 2xl:space-x-1 text-sm font-medium shrink min-w-0">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`px-1.5 2xl:px-2.5 py-1.5 rounded-xl transition-all text-xs font-bold shrink-0 flex items-center gap-1 ${
                  isActive(link.path)
                    ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                    : link.path === '/verification'
                    ? 'text-purple-300 hover:text-white hover:bg-purple-500/15 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {link.path === '/verification' && <ShieldCheck className="w-3 h-3 text-purple-400 shrink-0" />}
                <span>
                  {link.path === '/verification' ? (
                    <>
                      <span className="hidden 2xl:inline">Verification Center</span>
                      <span className="2xl:hidden">Verification</span>
                    </>
                  ) : (
                    link.label
                  )}
                </span>
              </Link>
            ))}
          </div>

          {/* RIGHT: Search, Role Badge & User Profile OR Auth CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Global Search Button */}
            <button
              onClick={onOpenSearch}
              className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition border border-white/10 hover:border-blue-500/30 cursor-pointer backdrop-blur-md shrink-0 flex items-center gap-1.5"
              title="Global Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden 2xl:inline">Search...</span>
              <kbd className="hidden 2xl:inline-block px-1.5 py-0.5 text-[10px] bg-black/50 rounded border border-white/10 text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Visual Divider between Search Tool and Role Switcher */}
            <div className="hidden xl:block h-4 w-[1px] bg-white/15 mx-0.5 shrink-0" />

            {user ? (
              <>
                {/* Authenticated Role Badge (Clickable to switch roles) */}
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-role-switcher'))}
                  className={`px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 sm:gap-1.5 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0 ${getRoleBadgeStyle(user.role)}`}
                  title={`Current Role: ${formatRoleName(user.role)} • Click to Switch Role (ID & Pass)`}
                >
                  {user.role === 'SUPER_ADMIN' ? (
                    <Crown className="w-3.5 h-3.5 text-purple-400" />
                  ) : user.role === 'ADMIN' ? (
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                  ) : user.role === 'FACULTY' ? (
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  ) : user.role === 'ORGANIZER' ? (
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span className="hidden sm:inline">{formatRoleName(user.role)}</span>
                  <Repeat className="w-2.5 h-2.5 opacity-70 ml-0.5" />
                </button>

                {/* Notifications Link */}
                <Link
                  to="/notifications"
                  className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition relative border border-white/5 shrink-0"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 text-blue-400" />
                </Link>

                {/* Quick Log Out Button in Top Bar */}
                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(true)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition cursor-pointer shadow-sm shrink-0"
                  title="Sign out of current campus session"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden 2xl:inline">Log Out</span>
                </button>

                {/* User Dropdown */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/10 cursor-pointer"
                  >
                    <img
                      src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                      alt={user.full_name}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-blue-500/40 shrink-0"
                    />
                    <span className="hidden 2xl:inline text-xs font-bold text-slate-200 max-w-[80px] truncate">
                      {user.full_name || 'My Profile'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  {userDropdownOpen && (
                    <>
                      {/* Viewport Backdrop: dismisses menu when clicking outside */}
                      <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setUserDropdownOpen(false)}
                        aria-hidden="true"
                      />
                      {/* Dropdown Menu anchored safely inside viewport */}
                      <div className="fixed top-16 right-3 sm:right-6 md:right-8 w-64 max-w-[calc(100vw-1.5rem)] bg-slate-950/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 py-2 z-50 animate-fade-in">
                        <div className="px-4 py-2 border-b border-white/10">
                          <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(user.role)}`}>
                              {formatRoleName(user.role)}
                            </span>
                            {user.branch && (
                              <span className="text-[10px] text-slate-400 truncate">
                                • {user.branch}
                              </span>
                            )}
                          </div>
                        </div>

                        {user && (
                          <div className="py-1 text-xs text-slate-300">
                            {isVerifier && (
                              <Link
                                to="/verification"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-purple-500/15 font-bold text-purple-300 border-b border-purple-500/20 bg-purple-950/40"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span className="truncate">Verification Center</span>
                              </Link>
                            )}
                            <Link
                              to={userDashboardPath}
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 font-semibold text-blue-400"
                            >
                              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Go to Dashboard</span>
                            </Link>
                            <Link
                              to="/my-achievements"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 font-bold text-amber-300"
                            >
                              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">My Achievements</span>
                            </Link>
                            <Link
                              to="/achievements"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 font-bold text-emerald-400"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">Send to Verify</span>
                            </Link>
                            <Link
                              to="/profile/edit"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-white/10"
                            >
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">Edit Academic Profile</span>
                            </Link>
                            <Link
                              to="/saved"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-white/10"
                            >
                              <Bookmark className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span className="truncate">Saved Library</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                setUserDropdownOpen(false);
                                window.dispatchEvent(new CustomEvent('open-role-switcher'));
                              }}
                              className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-white/10 font-bold text-amber-300 cursor-pointer"
                            >
                              <Repeat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">Switch Role (ID & Pass)</span>
                            </button>

                            <Link
                              to="/login"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 font-bold text-cyan-300"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="truncate">Login / Authenticate Account</span>
                            </Link>
                          </div>
                        )}

                        <div className="border-t border-white/10 pt-1">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              setLogoutModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer font-semibold"
                          >
                            <LogOut className="w-3.5 h-3.5 shrink-0" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile Hamburger Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="xl:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              /* Logged-Out Public View */
              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-role-switcher'))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition border border-amber-500/30 cursor-pointer shadow-sm"
                  title="Switch Role & View Credentials"
                >
                  <Repeat className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Switch Role</span>
                  <span className="sm:hidden">Roles</span>
                </button>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center gap-1.5 border border-blue-400/30 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>Log In</span>
                </Link>
                <Link
                  to="/signup"
                  className="clay-btn-rose px-4 py-2 text-xs font-bold text-white rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-1"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer with scroll constraint */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-white/10">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                  isActive(link.path)
                    ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30'
                    : link.path === '/verification'
                    ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <span>{link.label}</span>
                {link.path === '/verification' && <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />}
              </Link>
            ))}
          </div>

          {user ? (
            <div className="space-y-2">
              <Link
                to="/my-achievements"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>My Achievements (Permanent Record)</span>
              </Link>
              <Link
                to="/achievements"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Send to Verify (Participation / Winning)</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.dispatchEvent(new CustomEvent('open-role-switcher'));
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-xs cursor-pointer"
              >
                <Repeat className="w-4 h-4 text-purple-400" />
                <span>Switch Role (ID & Pass)</span>
              </button>
              <Link
                to={userDashboardPath}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl clay-btn-blue text-white font-bold text-xs"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLogoutModalOpen(true);
                }}
                className="w-full py-2.5 text-center text-xs text-rose-400 font-bold hover:bg-rose-500/10 rounded-xl cursor-pointer flex items-center justify-center gap-2 border border-rose-500/20 bg-rose-500/5"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out Session</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/30"
              >
                <KeyRound className="w-4 h-4 text-amber-300" />
                <span>Campus Login & Authentication</span>
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl clay-btn-rose text-white font-bold text-xs shadow-md shadow-rose-500/30"
              >
                <span>Create Student Account</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.dispatchEvent(new CustomEvent('open-role-switcher'));
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/30 font-bold text-xs cursor-pointer"
              >
                <Repeat className="w-3.5 h-3.5 text-amber-400" />
                <span>Switch Role (ID & Pass)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Global Interactive Logout Confirmation Modal */}
      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
    </nav>
  );
}
