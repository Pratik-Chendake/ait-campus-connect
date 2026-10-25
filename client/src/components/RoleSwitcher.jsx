import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, Shield, Crown, UserCheck, User, Sparkles,
  Check, Copy, ArrowRight, Eye, EyeOff, X, LogIn, ChevronDown, ChevronUp, LogOut
} from 'lucide-react';
import { useAuth, getDashboardRoute } from '../context/AuthContext';
import AuthProcessModal from './AuthProcessModal';

export const ROLE_ACCOUNTS = [
  {
    role: 'STUDENT',
    label: 'Student',
    name: 'Rahul Sharma',
    subtitle: 'Year 3 • Computer Engineering',
    email: 'rahul.sharma@aitpune.edu.in',
    password: 'student123',
    dashboard: '/student/dashboard',
    theme: {
      badge: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
      border: 'hover:border-blue-500/50',
      activeBorder: 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
      button: 'clay-btn-blue text-white',
      icon: <User className="w-4 h-4 text-blue-400" />
    }
  },
  {
    role: 'ORGANIZER',
    label: 'Organizer',
    name: 'Aarav Deshmukh (GDSC Lead)',
    subtitle: 'Lead Organizer • Google Developer Student Club',
    email: 'gdsc@aitpune.edu.in',
    password: 'club123',
    dashboard: '/organizer/dashboard',
    theme: {
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      border: 'hover:border-emerald-500/50',
      activeBorder: 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
      button: 'clay-btn-emerald text-white bg-emerald-600 hover:bg-emerald-500',
      icon: <Users className="w-4 h-4 text-emerald-400" />
    }
  },
  {
    role: 'ADMIN',
    label: 'Admin',
    name: 'Col. A. K. Joshi (Retd)',
    subtitle: 'Administration Office • Operations & Moderation',
    email: 'admin@aitpune.edu.in',
    password: 'admin123',
    dashboard: '/admin/dashboard',
    theme: {
      badge: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
      border: 'hover:border-rose-500/50',
      activeBorder: 'border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
      button: 'clay-btn-rose text-white',
      icon: <Shield className="w-4 h-4 text-rose-400" />
    }
  },
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    name: 'Campus Super Admin',
    subtitle: 'Master Administrator • System Governance',
    email: 'superadmin@gmail.com',
    password: 'SuperAdmin@123',
    dashboard: '/super-admin/dashboard',
    theme: {
      badge: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
      border: 'hover:border-purple-500/50',
      activeBorder: 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
      button: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30',
      icon: <Crown className="w-4 h-4 text-purple-400" />
    }
  },
  {
    role: 'FACULTY',
    label: 'Faculty',
    name: 'Dr. S. R. Patil',
    subtitle: 'Head of Department • Verification Center',
    email: 'dr.patil@aitpune.edu.in',
    password: 'faculty123',
    dashboard: '/verification',
    theme: {
      badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      border: 'hover:border-amber-500/50',
      activeBorder: 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      button: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30',
      icon: <UserCheck className="w-4 h-4 text-amber-400" />
    }
  }
];

export default function RoleSwitcher({ isOpen, onClose }) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [switching, setSwitching] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showPass, setShowPass] = useState({});
  const [panelOpen, setPanelOpen] = useState(false);

  // Live Authentication Process Modal state
  const [authProcess, setAuthProcess] = useState({
    isOpen: false,
    step: 1,
    email: '',
    role: 'STUDENT',
    fullName: '',
    statusText: '',
    progress: 0,
    error: null
  });

  // Listen for global 'open-role-switcher' custom events from Navbar, buttons, etc.
  useEffect(() => {
    const handleOpenEvent = () => setPanelOpen(true);
    window.addEventListener('open-role-switcher', handleOpenEvent);
    return () => window.removeEventListener('open-role-switcher', handleOpenEvent);
  }, []);

  // Controlled or uncontrolled open state
  const isModalOpen = isOpen !== undefined ? isOpen : panelOpen;
  const handleClose = () => {
    if (onClose) onClose();
    else setPanelOpen(false);
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRoleSwitch = async (account) => {
    setSwitching(account.role);

    // Launch visible authentication process modal
    setAuthProcess({
      isOpen: true,
      step: 1,
      email: account.email,
      role: account.role,
      fullName: account.name,
      statusText: `Connecting to Campus Gateway for ${account.label}...`,
      progress: 25,
      error: null
    });

    try {
      await new Promise((r) => setTimeout(r, 240));

      setAuthProcess((prev) => ({
        ...prev,
        step: 2,
        statusText: 'Verifying identity & password hash...',
        progress: 55
      }));

      const loggedUser = await login(account.email, account.password);

      setAuthProcess((prev) => ({
        ...prev,
        step: 3,
        role: loggedUser.role,
        fullName: loggedUser.full_name,
        statusText: `Access Granted: ${loggedUser.full_name} (${loggedUser.role})`,
        progress: 80
      }));

      await new Promise((r) => setTimeout(r, 350));

      const targetRoute = getDashboardRoute(account.role);

      setAuthProcess((prev) => ({
        ...prev,
        step: 4,
        statusText: `Session Authenticated! Launching ${account.label} Dashboard...`,
        progress: 100
      }));

      await new Promise((r) => setTimeout(r, 400));
      setAuthProcess((prev) => ({ ...prev, isOpen: false }));
      handleClose();
      navigate(targetRoute);
    } catch (err) {
      console.error('Failed to switch role:', err);
      setAuthProcess((prev) => ({
        ...prev,
        step: -1,
        statusText: 'Authentication Failed',
        error: err.message || 'Failed to switch role',
        progress: 100
      }));
    } finally {
      setSwitching(null);
    }
  };

  const toggleShowPass = (role) => {
    setShowPass((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isModalOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 animate-fade-in flex items-center gap-2 max-w-[calc(100vw-2rem)]">
          <button
            onClick={() => setPanelOpen(true)}
            className="group px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl liquid-glass border border-white/20 bg-slate-950/85 hover:bg-slate-900 text-white shadow-2xl flex items-center gap-2 sm:gap-2.5 text-xs font-bold transition-all hover:scale-105 hover:border-blue-400/50 backdrop-blur-2xl cursor-pointer"
            title="Open Role Switcher (Switch Student / Organizer / Admin / Super Admin)"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Role Switcher</span>
              <span className="text-xs font-black text-white flex items-center gap-1">
                {user ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    {user.role}
                  </span>
                ) : (
                  <span className="text-blue-300">Switch Roles</span>
                )}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Role Switcher Drawer / Modal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99998] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-fade-in overflow-y-auto">
          <div className="liquid-glass rounded-3xl max-w-2xl w-full border border-white/20 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto relative m-auto text-white">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-rose-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Instant Role & Identity Switcher
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Switch Campus Account & Role</h2>
                <p className="text-xs text-slate-300">
                  Select any role to switch instantly, or view/copy its authentic credentials.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Active Account Indicator */}
            {user && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-400">Currently Authenticated:</span>
                  <span className="font-bold text-white">{user.full_name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 font-mono text-[10px] text-cyan-300">
                    {user.role}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">{user.email}</span>
              </div>
            )}

            {/* Accounts List */}
            <div className="space-y-3">
              {ROLE_ACCOUNTS.map((acc) => {
                const isCurrent = user?.email?.toLowerCase() === acc.email.toLowerCase() || (user && user.role === acc.role);
                const isLoadingThis = switching === acc.role;

                return (
                  <div
                    key={acc.role}
                    className={`p-4 rounded-2xl liquid-glass border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isCurrent
                        ? acc.theme.activeBorder
                        : `border-white/10 ${acc.theme.border}`
                    }`}
                  >
                    {/* Left: Role identity info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1.5 uppercase ${acc.theme.badge}`}>
                          {acc.theme.icon}
                          {acc.label}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active Session
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-white">{acc.name}</h4>
                      <p className="text-[11px] text-slate-400">{acc.subtitle}</p>

                      {/* Credentials Block */}
                      <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                        {/* Email/ID */}
                        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">ID:</span>
                          <span className="font-mono text-cyan-300 text-[11px]">{acc.email}</span>
                          <button
                            onClick={() => handleCopy(acc.email, `email-${acc.role}`)}
                            className="p-1 hover:text-white text-slate-400 transition cursor-pointer"
                            title="Copy Email ID"
                          >
                            {copiedKey === `email-${acc.role}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Password */}
                        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Pass:</span>
                          <span className="font-mono text-amber-300 text-[11px]">
                            {showPass[acc.role] ? acc.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => toggleShowPass(acc.role)}
                            className="p-1 hover:text-white text-slate-400 transition cursor-pointer"
                            title={showPass[acc.role] ? 'Hide password' : 'Show password'}
                          >
                            {showPass[acc.role] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopy(acc.password, `pass-${acc.role}`)}
                            className="p-1 hover:text-white text-slate-400 transition cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedKey === `pass-${acc.role}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Switch Role Action CTA */}
                    <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => handleRoleSwitch(acc)}
                        disabled={isLoadingThis}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                          acc.theme.button
                        } ${isCurrent ? 'opacity-90 ring-1 ring-white/30' : ''}`}
                      >
                        {isLoadingThis ? (
                          <span>Switching...</span>
                        ) : isCurrent ? (
                          <>
                            <span>Open Dashboard</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Switch to {acc.label}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Note */}
            <div className="pt-3 text-[11px] text-slate-400 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span>All roles use authentic hashed credentials in the SQLite database.</span>
              <div className="flex items-center gap-2">
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      window.dispatchEvent(new CustomEvent('open-logout-modal'));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out Session</span>
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Live Authentication Process Modal */}
      <AuthProcessModal
        isOpen={authProcess.isOpen}
        step={authProcess.step}
        email={authProcess.email}
        role={authProcess.role}
        fullName={authProcess.fullName}
        statusText={authProcess.statusText}
        progress={authProcess.progress}
        error={authProcess.error}
        onClose={() => setAuthProcess((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
