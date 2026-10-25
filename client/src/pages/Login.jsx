import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, Loader2,
  CheckCircle2, Compass, Trophy, Award, Users, BookOpen, Copy, Check, Crown, UserCheck, User, KeyRound
} from 'lucide-react';
import { useAuth, getDashboardRoute } from '../context/AuthContext';
import { ROLE_ACCOUNTS } from '../components/RoleSwitcher';
import AuthProcessModal from '../components/AuthProcessModal';

export default function Login() {
  const { user, login, quickLogin, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if there was an intended redirect route
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');

  // Interactive Authentication Process state
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

  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showRolePassword, setShowRolePassword] = useState(false);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAutoFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  // Main Authentication Pipeline with Visible Process Steps
  const executeAuth = async (emailInput, passwordInput, roleHint = 'STUDENT') => {
    const cleanEmail = (emailInput || '').trim();
    if (!cleanEmail || !passwordInput) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setLoading(true);

    // Initialize visual authentication process modal
    setAuthProcess({
      isOpen: true,
      step: 1,
      email: cleanEmail,
      role: roleHint,
      fullName: '',
      statusText: 'Connecting to Campus Auth Gateway...',
      progress: 25,
      error: null
    });

    try {
      // Step 1: Handshake (250ms)
      await new Promise((r) => setTimeout(r, 260));

      // Step 2: Database & Supabase verification
      setAuthProcess((prev) => ({
        ...prev,
        step: 2,
        statusText: 'Verifying identity & password hash...',
        progress: 55
      }));

      const loggedUser = await login(cleanEmail, passwordInput);

      // Step 3: Role Authorization
      setAuthProcess((prev) => ({
        ...prev,
        step: 3,
        role: loggedUser.role,
        fullName: loggedUser.full_name,
        statusText: `Access Granted: ${loggedUser.full_name} (${loggedUser.role})`,
        progress: 80
      }));

      await new Promise((r) => setTimeout(r, 380));

      // Step 4: Session Bearer Token Issued
      const dest =
        redirectParam &&
        !redirectParam.includes('login') &&
        !redirectParam.includes('signup') &&
        !redirectParam.includes('register')
          ? redirectParam
          : getDashboardRoute(loggedUser.role);

      setAuthProcess((prev) => ({
        ...prev,
        step: 4,
        statusText: `Session Authenticated! Routing to ${loggedUser.role} Dashboard...`,
        progress: 100
      }));

      await new Promise((r) => setTimeout(r, 450));
      setAuthProcess((prev) => ({ ...prev, isOpen: false }));
      navigate(dest);
    } catch (err) {
      console.error('Authentication failure:', err);
      setAuthProcess((prev) => ({
        ...prev,
        step: -1,
        statusText: 'Authentication Failed',
        error: err.message || 'Invalid email or password.',
        progress: 100
      }));
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    executeAuth(email, password);
  };

  const handleRoleLogin = (acc) => {
    executeAuth(acc.email, acc.password, acc.role);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-start sm:justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Container with flexible viewport handling */}
      <div className="max-w-5xl w-full mx-auto liquid-glass rounded-3xl shadow-2xl overflow-hidden border border-white/20 bg-slate-950/85 backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 relative z-10 text-white my-auto">

        {/* ===================== LEFT SIDE: LOGIN FORM ===================== */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-5 sm:space-y-6">
          <div className="space-y-6">
            {/* Header Brand */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center border border-white/20 shadow-lg shadow-blue-500/20 shrink-0 overflow-hidden">
                <img src="/ait-logo.png" alt="AIT Pune Crest" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-lg tracking-tight text-white">AIT</span>
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-cyan-300 to-rose-400 bg-clip-text text-transparent">
                    CAMPUS CONNECT
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block leading-none mt-1">
                  Army Institute of Technology, Pune
                </span>
              </div>
            </div>

            {/* Currently Logged In Session Notification */}
            {user && (
              <div className="p-3.5 rounded-2xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-between text-xs animate-fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <p className="text-slate-300 truncate">
                      Active: <span className="font-bold text-white">{user.full_name}</span>
                    </p>
                    <p className="text-[10px] text-blue-300 uppercase font-semibold">
                      Role: {user.role}
                    </p>
                  </div>
                </div>
                <Link
                  to={getDashboardRoute(user.role)}
                  className="clay-btn-blue px-3 py-1.5 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 shadow-sm"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Welcome & Prompt */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                <KeyRound className="w-3 h-3 text-amber-400" />
                <span>Institutional Authentication</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Campus Portal Login
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                Enter your registered ID & password to authenticate your campus session and view verified opportunities, scholarships, and your permanent achievements.
              </p>
            </div>

            {redirectParam && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Authentication required to access: {redirectParam}</span>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold leading-relaxed animate-fade-in flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email / ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Login ID / Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gmail.com or @aitpune.edu.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25 transition backdrop-blur-md"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25 transition backdrop-blur-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 border-white/20 bg-white/5"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl clay-btn-blue text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Authentication...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In & Authenticate</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Create Account Link */}
            <div className="pt-2 text-center text-xs text-slate-400">
              New student to AIT Pune?{' '}
              <Link to="/signup" className="font-bold text-blue-400 hover:text-blue-300 underline">
                Create a Student Account
              </Link>
            </div>
          </div>

          {/* Official Role Credentials & Interactive Switcher */}
          <div className="pt-4 border-t border-white/10">
            <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass bg-white/5 border border-white/15 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-white">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Role Credentials & 1-Click Authenticator</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Role to Inspect
                </span>
              </div>

              {/* Role Selection Tabs */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 p-1 bg-black/40 rounded-xl border border-white/10 shadow-inner">
                {ROLE_ACCOUNTS.map((acc, idx) => {
                  const isSelected = selectedRoleIndex === idx;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => setSelectedRoleIndex(idx)}
                      className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer truncate ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{acc.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Role Account Details */}
              {(() => {
                const acc = ROLE_ACCOUNTS[selectedRoleIndex] || ROLE_ACCOUNTS[0];
                return (
                  <div className="p-3 bg-black/50 rounded-xl border border-white/10 shadow-sm space-y-2.5">
                    {/* Header: User name and department */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${acc.theme.badge}`}>
                            {acc.label}
                          </span>
                          <span className="text-xs font-bold text-white truncate">{acc.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{acc.subtitle}</p>
                      </div>

                      {/* 1-Click Instant Authenticate Button */}
                      <button
                        type="button"
                        onClick={() => handleRoleLogin(acc)}
                        disabled={loading}
                        className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50"
                        title={`Instant 1-Click login as ${acc.label}`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>1-Click Authenticate</span>
                      </button>
                    </div>

                    {/* ID and Password Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* ID / Email */}
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between gap-1">
                        <div className="min-w-0">
                          <div className="text-[9px] font-extrabold uppercase text-slate-400 leading-none">Login ID</div>
                          <div className="font-mono text-[11px] text-cyan-300 font-bold truncate mt-0.5" title={acc.email}>
                            {acc.email}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(acc.email, `login_email_${acc.role}`)}
                          className="shrink-0 p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                          title="Copy Email ID"
                        >
                          {copiedKey === `login_email_${acc.role}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Password */}
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between gap-1">
                        <div className="min-w-0">
                          <div className="text-[9px] font-extrabold uppercase text-slate-400 leading-none">Password</div>
                          <div className="font-mono text-[11px] text-amber-300 font-bold truncate mt-0.5">
                            {showRolePassword ? acc.password : '••••••••'}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowRolePassword(!showRolePassword)}
                            className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                            title={showRolePassword ? 'Hide Password' : 'Show Password'}
                          >
                            {showRolePassword ? (
                              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.password, `login_pass_${acc.role}`)}
                            className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedKey === `login_pass_${acc.role}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Auto-fill Trigger Button */}
                    <button
                      type="button"
                      onClick={() => handleAutoFill(acc)}
                      className="w-full py-1.5 px-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold rounded-lg text-[11px] transition text-center flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
                    >
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      <span>Auto-Fill {acc.label} Credentials Above</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* ===================== RIGHT SIDE: CAMPUS BRANDING VISUAL ===================== */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-950/70 via-slate-900/80 to-slate-950/90 border-t lg:border-t-0 lg:border-l border-white/10 p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden backdrop-blur-xl">
          {/* Subtle decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top badge */}
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/15 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Official Campus Portal
            </span>

            <div className="space-y-2 pt-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                Connect. <br />
                Compete. <br />
                <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-300 bg-clip-text text-transparent">
                  Achieve.
                </span>
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                The centralized digital achievement & opportunity ecosystem for Army Institute of Technology, Pune.
              </p>
            </div>
          </div>

          {/* Three Value Pillars */}
          <div className="relative z-10 space-y-3 py-6">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Verified Opportunities</h4>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Curated engineering internships & 30+ authentic Indian scholarships.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Deterministic Eligibility</h4>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Explainable matching against institutional, defense, and government rules.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Verified Student Portfolio</h4>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Faculty-approved credentials, hackathon wins, and alumni networking.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Security Subtext */}
          <div className="relative z-10 pt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Secured via Supabase Auth</span>
            <span className="font-semibold text-slate-300">AY 2026–27</span>
          </div>

        </div>

      </div>

      {/* Interactive Authentication Process Modal */}
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
        onRetry={() => executeAuth(email, password)}
      />
    </div>
  );
}
