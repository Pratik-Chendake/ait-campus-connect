import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Lock, Mail, Eye, EyeOff, CheckCircle2, ArrowRight, Loader2,
  Sparkles, GraduationCap, Compass, Trophy, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AIT_BRANCHES } from '../constants/branches';

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [branch, setBranch] = useState('Computer Engineering');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength helper
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' };
    if (score === 4) return { score: 3, label: 'Good', color: 'bg-blue-500', text: 'text-blue-600' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = gmail.trim().toLowerCase();

    // Validate Gmail specifically
    if (!trimmedEmail.endsWith('@gmail.com')) {
      setError('Please enter a valid Gmail address ending with @gmail.com (e.g. yourname@gmail.com).');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      await signup(trimmedEmail, password, branch);
      // Automatic role is student -> direct to Student Dashboard
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create your account. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col justify-start sm:justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 grid grid-cols-1 lg:grid-cols-12 relative z-10 my-auto">

        {/* ===================== LEFT SIDE: REGISTRATION FORM ===================== */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Header Brand */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center border border-slate-200 shadow-md shadow-blue-900/10 shrink-0 overflow-hidden">
                <img src="/ait-logo.png" alt="AIT Pune Crest" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-lg tracking-tight text-slate-900">AIT</span>
                  <span className="font-extrabold text-lg tracking-tight text-blue-700">CAMPUS CONNECT</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block leading-none mt-1">
                  Army Institute of Technology, Pune
                </span>
              </div>
            </div>

            {/* Welcome */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Create Your Student Account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Register with your Gmail address to build your digital campus profile.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Field 1: Gmail Address */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Gmail Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Field 2: Branch Selection */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Engineering Branch <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                    {AIT_BRANCHES.map(b => (
                      <option key={b.name} value={b.name}>
                        {b.name} ({b.abbr})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 3: Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength Meter */}
                {password && (
                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${(strength.score / 4) * 100}%` }} />
                    </div>
                    <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                  </div>
                )}
              </div>

              {/* Field 4: Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Student Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-black text-blue-600 hover:text-blue-700 underline">
                Sign In Instead
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Self-registered accounts automatically receive default Student authorization.
          </div>
        </div>

        {/* ===================== RIGHT SIDE: CAMPUS BRANDING VISUAL ===================== */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 p-6 sm:p-8 lg:p-10 border-t lg:border-t-0 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/15 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Student Registration
            </span>

            <div className="space-y-2 pt-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                One Platform. <br />
                Every Opportunity. <br />
                <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-300 bg-clip-text text-transparent">
                  Your Legacy.
                </span>
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Join hundreds of AIT engineers discovering internships, winning national hackathons, and unlocking scholarships.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-3 py-6">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200">
                Automatic default Student role assignment
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200">
                100% Genuine external application links
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200">
                Deterministic institutional eligibility matching
              </span>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Army Institute of Technology</span>
            <span className="font-semibold text-slate-300">AY 2026–27</span>
          </div>

        </div>

      </div>
    </div>
  );
}
