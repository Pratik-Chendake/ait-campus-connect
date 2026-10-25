import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Trophy, Award, Calendar, CheckCircle, Clock, ShieldCheck,
  AlertCircle, Sparkles, Plus, ExternalLink, ChevronRight,
  Filter, Search, Bookmark, Eye, Download, FileText, Check,
  X, Layers, Share2, ArrowUpRight, Users, GitBranch, ArrowRight,
  FolderPlus, RefreshCw, AlertTriangle, Lock, Shield
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function MyAchievements() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active filter tab
  const activeTab = searchParams.get('tab') || 'all';
  const selectedCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline'

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState(null); // Detail modal
  const [portfolioModalRecord, setPortfolioModalRecord] = useState(null); // Add to portfolio modal
  const [withdrawModalRecord, setWithdrawModalRecord] = useState(null); // Withdraw modal
  const [withdrawReason, setWithdrawReason] = useState('');
  const [addPreviousOpen, setAddPreviousOpen] = useState(false); // Manual import modal

  // Manual Import Form state
  const [manualForm, setManualForm] = useState({
    title: '',
    organizer: '',
    category: 'Hackathon',
    mode: 'In-Person',
    location: '',
    event_date: '',
    participation_status: 'PARTICIPATED',
    role_in_team: 'Individual',
    project_title: '',
    project_repo_url: '',
    submission_url: '',
    notes: '',
    certificate_url: '',
    certificate_name: '',
    is_in_portfolio: false
  });
  const [submittingManual, setSubmittingManual] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Load participation records
  const loadAchievements = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (activeTab !== 'all') queryParams.append('tab', activeTab);
      if (selectedCategory !== 'All') queryParams.append('category', selectedCategory);
      if (searchQuery) queryParams.append('search', searchQuery);

      const res = await api.get(`/my-achievements?${queryParams.toString()}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAchievements();
  }, [user, activeTab, selectedCategory, searchQuery]);

  // Tab switcher
  const handleTabChange = (tabKey) => {
    const params = new URLSearchParams(searchParams);
    if (tabKey === 'all') params.delete('tab');
    else params.set('tab', tabKey);
    setSearchParams(params);
  };

  // Category switcher
  const handleCategoryChange = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (cat === 'All') params.delete('category');
    else params.set('category', cat);
    setSearchParams(params);
  };

  // Search input handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (!val) params.delete('search');
    else params.set('search', val);
    setSearchParams(params);
  };

  // Toggle Portfolio inclusion
  const handlePortfolioToggle = async (recordId, currentStatus) => {
    try {
      const nextStatus = !currentStatus;
      await api.post(`/my-achievements/${recordId}/portfolio`, {
        is_in_portfolio: nextStatus,
        portfolio_visibility: 'PUBLIC'
      });
      setStatusMessage({
        type: 'success',
        text: nextStatus
          ? 'Achievement added to your Public Student Portfolio!'
          : 'Achievement removed from your Public Portfolio. Permanent history in My Achievements is preserved.'
      });
      setTimeout(() => setStatusMessage(null), 4000);
      setPortfolioModalRecord(null);
      loadAchievements();
    } catch (err) {
      console.error('Failed to toggle portfolio:', err);
      alert(err.message || 'Failed to update portfolio setting');
    }
  };

  // Handle Withdrawal
  const handleConfirmWithdraw = async () => {
    if (!withdrawModalRecord) return;
    try {
      await api.patch(`/my-achievements/${withdrawModalRecord.id}/withdraw`, {
        reason: withdrawReason || 'Student requested withdrawal.'
      });
      setStatusMessage({
        type: 'success',
        text: 'Participation status marked as Withdrawn. Official history and audit trail are preserved.'
      });
      setTimeout(() => setStatusMessage(null), 4000);
      setWithdrawModalRecord(null);
      setWithdrawReason('');
      loadAchievements();
    } catch (err) {
      alert(err.message || 'Failed to withdraw');
    }
  };

  // Handle Manual Achievement Submission
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSubmittingManual(true);
    try {
      await api.post('/my-achievements/manual', manualForm);
      setStatusMessage({
        type: 'success',
        text: 'Previous achievement submitted successfully! It has been marked as Pending Verification.'
      });
      setTimeout(() => setStatusMessage(null), 5000);
      setAddPreviousOpen(false);
      setManualForm({
        title: '',
        organizer: '',
        category: 'Hackathon',
        mode: 'In-Person',
        location: '',
        event_date: '',
        participation_status: 'PARTICIPATED',
        role_in_team: 'Individual',
        project_title: '',
        project_repo_url: '',
        submission_url: '',
        notes: '',
        certificate_url: '',
        certificate_name: '',
        is_in_portfolio: false
      });
      loadAchievements();
    } catch (err) {
      alert(err.message || 'Failed to submit historical achievement');
    } finally {
      setSubmittingManual(false);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'WINNER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[11px] shadow-[0_0_12px_rgba(245,158,11,0.3)]">
          <Trophy className="w-3.5 h-3.5 text-amber-400" /> Winner (1st)
        </span>
      );
    }
    if (s === 'RUNNER_UP') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 font-bold text-[11px]">
          <Award className="w-3.5 h-3.5 text-slate-300" /> 1st Runner-up
        </span>
      );
    }
    if (s === 'SECOND_RUNNER_UP') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-700/20 text-amber-300 border border-amber-700/40 font-bold text-[11px]">
          <Award className="w-3.5 h-3.5 text-amber-600" /> 2nd Runner-up
        </span>
      );
    }
    if (s === 'FINALIST') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[11px] shadow-[0_0_10px_rgba(244,63,94,0.25)]">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Selected Finalist
        </span>
      );
    }
    if (s === 'QUALIFIED' || s === 'SHORTLISTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-[11px]">
          <CheckCircle className="w-3.5 h-3.5 text-purple-400" /> Round Qualified
        </span>
      );
    }
    if (s === 'ATTENDANCE_CONFIRMED' || s === 'PARTICIPATED' || s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]">
          <Check className="w-3.5 h-3.5 text-emerald-400" /> Participated & Completed
        </span>
      );
    }
    if (s === 'WITHDRAWN' || s === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-semibold text-[11px]">
          <X className="w-3.5 h-3.5" /> Withdrawn / Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold text-[11px]">
        <Clock className="w-3.5 h-3.5 text-blue-400" /> Registered
      </span>
    );
  };

  const overview = data?.overview || {};
  const records = data?.records || [];
  const timeline = data?.timeline || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl liquid-glass border border-emerald-500/40 bg-slate-950/90 text-white shadow-2xl flex items-center gap-3 backdrop-blur-2xl animate-fade-in max-w-md">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="ml-auto text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/15 backdrop-blur-2xl">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-blue-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
            Permanent Student Achievement & Participation System
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
            My Achievements
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Your permanent, immutable academic and competitive history at Army Institute of Technology, Pune.
            Every campus event, hackathon, competition, and workshop you register for is recorded automatically.
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Immutable Official Records
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-blue-300">
              <Lock className="w-3.5 h-3.5" /> Data Isolated to Your Account
            </span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10 shrink-0 w-full md:w-auto">
          <Link
            to="/achievements"
            className="clay-btn-rose px-4 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" /> Send to Faculty for Verification
          </Link>
          <button
            onClick={() => setAddPreviousOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4 text-rose-400" /> Add Previous Record
          </button>
          <Link
            to={`/student/${user?.student_id || user?.id}`}
            className="clay-btn-blue px-4 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition"
          >
            <ExternalLink className="w-4 h-4" /> View Public Portfolio
          </Link>
        </div>
      </div>

      {/* Top Statistical Telemetry Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl liquid-glass border border-white/10 shadow-lg flex items-center gap-3.5 backdrop-blur-xl">
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
              {overview.total_registered || 0}
            </div>
            <div className="text-[11px] font-semibold text-slate-300">Total Registered</div>
            <div className="text-[10px] text-blue-300/80 font-medium">Automatic records</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl liquid-glass border border-white/10 shadow-lg flex items-center gap-3.5 backdrop-blur-xl">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              {overview.confirmed_participations || 0}
            </div>
            <div className="text-[11px] font-semibold text-slate-300">Confirmed Participations</div>
            <div className="text-[10px] text-emerald-300/80 font-medium">Verified attendance</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl liquid-glass border border-white/10 shadow-lg flex items-center gap-3.5 backdrop-blur-xl">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
              {overview.podium_finishes || 0}
            </div>
            <div className="text-[11px] font-semibold text-slate-300">Podium Finishes</div>
            <div className="text-[10px] text-amber-300/80 font-medium">
              {overview.first_place_wins || 0} Wins • {overview.second_place_finishes || 0} 2nd • {overview.third_place_finishes || 0} 3rd
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl liquid-glass border border-white/10 shadow-lg flex items-center gap-3.5 backdrop-blur-xl">
          <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">
              {overview.finalist_count || 0}
            </div>
            <div className="text-[11px] font-semibold text-slate-300">Finalist Selections</div>
            <div className="text-[10px] text-purple-300/80 font-medium">
              {overview.rounds_qualified || 0} Rounds Qualified
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl liquid-glass border border-white/10 shadow-lg flex items-center gap-3.5 backdrop-blur-xl col-span-2 sm:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
              {overview.verified_certificates || 0}
            </div>
            <div className="text-[11px] font-semibold text-slate-300">Verified Credentials</div>
            <div className="text-[10px] text-rose-300/80 font-medium">
              {overview.portfolio_achievements || 0} in Public Portfolio
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar: Filter Tabs, Category, Search, View Mode */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-white/10 text-xs font-bold">
          {[
            { key: 'all', label: 'All Activities', count: overview.total_registered },
            { key: 'ongoing', label: 'Ongoing', count: records.filter(r => ['REGISTERED', 'ATTENDANCE_CONFIRMED', 'QUALIFIED', 'FINALIST'].includes(r.participation_status)).length },
            { key: 'completed', label: 'Completed', count: records.filter(r => ['COMPLETED', 'WINNER', 'PARTICIPATED'].includes(r.participation_status)).length },
            { key: 'winners', label: 'Winners & Rankings', count: overview.podium_finishes },
            { key: 'qualified', label: 'Shortlisted & Qualified', count: overview.finalist_count },
            { key: 'certificates', label: 'Certificates & Vault', count: overview.verified_certificates },
            { key: 'portfolio', label: 'Portfolio Showcase', count: overview.portfolio_achievements }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.key ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Dropdown + Search + View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="bg-slate-950/80 text-xs text-slate-200 rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-blue-500/50"
            >
              <option value="All">All Categories</option>
              <option value="Hackathon">Hackathons</option>
              <option value="Competition">Competitions & Coding</option>
              <option value="Sports">Sports Activities</option>
              <option value="Cultural">Cultural & Arts</option>
              <option value="Workshop">Workshops & Seminars</option>
              <option value="Research">Research & Papers</option>
              <option value="Certification">Certifications</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search event, organizer, ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-slate-950/80 text-xs text-slate-200 rounded-xl pl-9 pr-3 py-2 border border-white/10 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* View Mode Switcher (Grid vs Chronological Timeline) */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-white/10 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Grid View
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Timeline View
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center liquid-glass rounded-3xl border border-white/10">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-300">Loading permanent participation records...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center liquid-glass rounded-3xl border border-white/10 space-y-3">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No participation records found in this view</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Activities you register for on AIT Campus Connect are automatically saved here. You can also import previous external achievements manually.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link to="/opportunities" className="clay-btn-blue px-4 py-2 text-white rounded-xl text-xs font-bold">
              Explore Campus Opportunities
            </Link>
            <button
              onClick={() => setAddPreviousOpen(true)}
              className="clay-btn-rose px-4 py-2 text-white rounded-xl text-xs font-bold"
            >
              Add Previous Achievement
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ======================== 7. CARDS GRID VIEW ======================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((rec) => {
            const latestResult = rec.latest_result;
            const hasCerts = rec.certificates && rec.certificates.length > 0;

            return (
              <div
                key={rec.id}
                className="liquid-glass rounded-3xl p-5 border border-white/10 hover:border-blue-500/40 shadow-xl transition-all flex flex-col justify-between group backdrop-blur-2xl relative overflow-hidden"
              >
                {/* Top Corner Glow on Podiums */}
                {rec.participation_status === 'WINNER' && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                )}

                <div className="space-y-3">
                  {/* Category & Status Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                      {rec.category || rec.event_type}
                    </span>
                    {getStatusBadge(rec.participation_status)}
                  </div>

                  {/* Title & Organizer */}
                  <div>
                    <h3 className="text-base font-black text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                      {rec.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <span>{rec.organizer}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-mono text-[11px]">
                        ID: {rec.registration_id || `AIT-${rec.id}`}
                      </span>
                    </p>
                  </div>

                  {/* Result / Placement Highlight if available */}
                  {latestResult && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-amber-200">
                          {latestResult.rank_category || `Rank ${latestResult.official_rank}`}
                        </span>
                      </div>
                      {latestResult.score && (
                        <span className="text-[11px] font-mono text-amber-300">
                          Score: {latestResult.score}/100
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata Chips: Date, Mode, Team */}
                  <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-slate-300">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {rec.event_date ? new Date(rec.event_date).toLocaleDateString() : 'Active'}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">
                      {rec.mode || 'In-Person'}
                    </span>
                    {rec.team_name ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-cyan-300 font-medium">
                        <Users className="w-3 h-3" /> Team: {rec.team_name}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-slate-400">
                        Individual
                      </span>
                    )}
                  </div>

                  {/* Verified & Portfolio Badges */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {rec.verification_status === 'OFFICIAL' ? 'Official Record' : rec.verification_status}
                    </span>
                    {rec.is_in_portfolio === 1 && (
                      <span className="inline-flex items-center gap-1 text-rose-300 font-semibold bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-400/30 text-[10px]">
                        <Bookmark className="w-3 h-3" /> In Portfolio
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedRecord(rec)}
                    className="clay-btn-blue px-3.5 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Add to Portfolio Toggle Button */}
                    <button
                      onClick={() => handlePortfolioToggle(rec.id, rec.is_in_portfolio)}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        rec.is_in_portfolio === 1
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
                      }`}
                      title={rec.is_in_portfolio ? 'Remove from public portfolio' : 'Add to public portfolio'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${rec.is_in_portfolio ? 'fill-rose-400 text-rose-400' : ''}`} />
                    </button>

                    {/* Withdraw option for active registrations */}
                    {['REGISTERED', 'ATTENDANCE_CONFIRMED'].includes(rec.participation_status) && (
                      <button
                        onClick={() => setWithdrawModalRecord(rec)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition cursor-pointer"
                        title="Withdraw from activity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ======================== 8. VISUAL CHRONOLOGICAL TIMELINE ======================== */
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-400" /> Chronological Participation Timeline
            </h2>
            <p className="text-xs text-slate-400">
              Complete journey of all registered events, round advancements, placements, and issued credentials.
            </p>
          </div>

          <div className="relative pl-6 sm:pl-8 border-l-2 border-white/10 space-y-8">
            {timeline.map((m, idx) => (
              <div key={m.id || idx} className="relative group">
                {/* Node Icon */}
                <div className={`absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full flex items-center justify-center border text-[11px] ${
                  m.milestone_type === 'RESULT_PUBLISHED'
                    ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : m.milestone_type === 'ROUND_QUALIFIED'
                    ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                    : m.milestone_type === 'CERTIFICATE_ISSUED'
                    ? 'bg-rose-500/30 border-rose-400 text-rose-300'
                    : 'bg-blue-500/30 border-blue-400 text-blue-300'
                }`}>
                  {m.milestone_type === 'RESULT_PUBLISHED' ? '🏆' : m.milestone_type === 'ROUND_QUALIFIED' ? '⭐' : '•'}
                </div>

                <div className="p-4 rounded-2xl liquid-glass border border-white/10 hover:border-blue-400/30 transition space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="font-black text-rose-300 uppercase tracking-wider text-[10px]">
                      {m.milestone_type?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {m.occurred_at ? new Date(m.occurred_at).toLocaleDateString() : 'Official'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white">{m.event_title}</h4>
                  <p className="text-xs text-slate-300">
                    <b className="text-amber-300">{m.new_status}</b> {m.round_name ? `• ${m.round_name}` : ''}
                  </p>
                  {m.notes && <p className="text-[11px] text-slate-400 pt-0.5">{m.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. DETAILED PARTICIPATION MODAL (Sections A to G)                   */}
      {/* ==================================================================== */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in overflow-y-auto">
          <div className="liquid-glass rounded-3xl max-w-3xl w-full border border-white/20 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                    {selectedRecord.category}
                  </span>
                  {getStatusBadge(selectedRecord.participation_status)}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">{selectedRecord.title}</h2>
                <p className="text-xs text-slate-400">
                  Organized by <b className="text-slate-200">{selectedRecord.organizer}</b> • Registration ID:{' '}
                  <span className="font-mono text-cyan-300 font-bold">{selectedRecord.registration_id}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section A: Event Information */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Event & Venue Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Mode / Venue:</span>
                  <span className="font-semibold text-white">{selectedRecord.mode} • {selectedRecord.location || 'AIT Campus'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Event Date:</span>
                  <span className="font-semibold text-white">{selectedRecord.event_date || 'Announced'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Registered On:</span>
                  <span className="font-semibold text-white">{new Date(selectedRecord.registered_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Section B & C: Participation & Team Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Participation Details
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Student:</span>
                    <span className="font-semibold text-white">{user?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Student ID:</span>
                    <span className="font-mono text-cyan-300">{user?.student_id || 'AIT-UG'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Attendance:</span>
                    <span className="font-bold text-emerald-400">
                      {['ATTENDANCE_CONFIRMED', 'PARTICIPATED', 'COMPLETED', 'WINNER'].includes(selectedRecord.participation_status) ? 'Verified Present' : 'Confirmed Registration'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Source:</span>
                    <span className="font-semibold text-slate-300">{selectedRecord.source_type}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Team & Project Info
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Team Name:</span>
                    <span className="font-semibold text-white">{selectedRecord.team_name || 'Individual Participant'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Role:</span>
                    <span className="font-semibold text-slate-300">{selectedRecord.role_in_team || 'Participant'}</span>
                  </div>
                  {selectedRecord.project_title && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Project:</span>
                      <span className="font-semibold text-white truncate max-w-[150px]">{selectedRecord.project_title}</span>
                    </div>
                  )}
                  {selectedRecord.project_repo_url && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Repository:</span>
                      <a href={selectedRecord.project_repo_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                        Code <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section D: Competition Progress Milestones */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Milestone Progression Journey
              </h4>
              {selectedRecord.milestones && selectedRecord.milestones.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {selectedRecord.milestones.map((m) => (
                    <div key={m.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white">{m.round_name || m.milestone_type}</span>
                        <p className="text-[11px] text-slate-400">{m.notes}</p>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{new Date(m.occurred_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Registration confirmed in permanent system.</p>
              )}
            </div>

            {/* Section E & F: Results & Certificates */}
            {selectedRecord.results && selectedRecord.results.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" /> Official Competition Results
                </h4>
                {selectedRecord.results.map((res) => (
                  <div key={res.id} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-amber-200 text-sm">{res.rank_category || `Rank ${res.official_rank}`}</span>
                      <p className="text-[11px] text-slate-300">{res.feedback}</p>
                    </div>
                    {res.score && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold">
                        {res.score} / {res.score_max || 100}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedRecord.certificates && selectedRecord.certificates.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Issued Official Credentials
                </h4>
                {selectedRecord.certificates.map((cert) => (
                  <div key={cert.id} className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{cert.certificate_type}</span>
                      <p className="text-[10px] font-mono text-cyan-300">Credential ID: {cert.credential_id}</p>
                    </div>
                    {cert.file_path && (
                      <a
                        href={cert.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="clay-btn-rose px-3 py-1 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> View Credential
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Immutable Record Protection Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 text-xs text-slate-400 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-white">Tamper-Proof Record Policy:</b> Official participation history cannot be deleted or manipulated by students.
                If you withdraw from an event or require a correction, an audited milestone entry is added to preserve your accurate academic history.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <button
                onClick={() => handlePortfolioToggle(selectedRecord.id, selectedRecord.is_in_portfolio)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  selectedRecord.is_in_portfolio === 1
                    ? 'clay-btn-rose text-white'
                    : 'clay-btn-blue text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {selectedRecord.is_in_portfolio === 1 ? 'Remove from Portfolio' : 'Add to Public Portfolio'}
              </button>

              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. WITHDRAW CONFIRMATION MODAL                                       */}
      {/* ==================================================================== */}
      {withdrawModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="liquid-glass rounded-3xl max-w-md w-full border border-white/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm Withdrawal</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to withdraw from <b className="text-white">"{withdrawModalRecord.title}"</b>?
            </p>
            <p className="text-[11px] text-slate-400">
              Per institute audit rules, official records cannot be erased. Your participation status will be updated to <b className="text-rose-400">Withdrawn</b>.
            </p>

            <textarea
              placeholder="Optional: State reason for withdrawal (e.g. Schedule conflict)"
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              className="w-full bg-slate-950/80 text-xs text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-rose-500/50 resize-none h-20"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setWithdrawModalRecord(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWithdraw}
                className="clay-btn-rose px-4 py-2 rounded-xl text-white text-xs font-bold transition"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 10. ADD PREVIOUS ACHIEVEMENT MODAL (Manual Historical Import)         */}
      {/* ==================================================================== */}
      {addPreviousOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in overflow-y-auto">
          <div className="liquid-glass rounded-3xl max-w-2xl w-full border border-white/20 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative my-8">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-rose-400" /> Add Previous External Achievement
                </h3>
                <p className="text-xs text-slate-400">
                  Import past hackathons, sports medals, papers, or off-campus achievements.
                  Submissions are labelled as <b className="text-amber-400">Pending Verification</b> until reviewed by faculty.
                </p>
              </div>
              <button
                onClick={() => setAddPreviousOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Event / Achievement Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smart India Hackathon 2025"
                    value={manualForm.title}
                    onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                    className="w-full bg-slate-950/80 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Organizing College / Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AICTE / Ministry of Education"
                    value={manualForm.organizer}
                    onChange={(e) => setManualForm({ ...manualForm, organizer: e.target.value })}
                    className="w-full bg-slate-950/80 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={manualForm.category}
                    onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                    className="w-full bg-slate-950/80 text-white px-3 py-2 rounded-xl border border-white/10"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Competition">Competition & Coding</option>
                    <option value="Sports">Sports Activity</option>
                    <option value="Cultural">Cultural Event</option>
                    <option value="Workshop">Workshop / Seminar</option>
                    <option value="Research">Research Paper</option>
                    <option value="Certification">Professional Certification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Participation Outcome</label>
                  <select
                    value={manualForm.participation_status}
                    onChange={(e) => setManualForm({ ...manualForm, participation_status: e.target.value })}
                    className="w-full bg-slate-950/80 text-white px-3 py-2 rounded-xl border border-white/10"
                  >
                    <option value="WINNER">Winner (1st Place)</option>
                    <option value="RUNNER_UP">1st Runner-up (2nd Place)</option>
                    <option value="SECOND_RUNNER_UP">2nd Runner-up (3rd Place)</option>
                    <option value="FINALIST">Selected Finalist</option>
                    <option value="QUALIFIED">Qualified for Next Round</option>
                    <option value="PARTICIPATED">Participated & Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={manualForm.event_date}
                    onChange={(e) => setManualForm({ ...manualForm, event_date: e.target.value })}
                    className="w-full bg-slate-950/80 text-white px-3 py-2 rounded-xl border border-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Title (If applicable)</label>
                  <input
                    type="text"
                    placeholder="e.g. Autonomous Drone Surveillance"
                    value={manualForm.project_title}
                    onChange={(e) => setManualForm({ ...manualForm, project_title: e.target.value })}
                    className="w-full bg-slate-950/80 text-white px-3 py-2 rounded-xl border border-white/10"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GitHub / Project Demo Link</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={manualForm.project_repo_url}
                    onChange={(e) => setManualForm({ ...manualForm, project_repo_url: e.target.value })}
                    className="w-full bg-slate-950/80 text-white px-3 py-2 rounded-xl border border-white/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Certificate / Proof Document URL</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or uploaded document URL"
                  value={manualForm.certificate_url}
                  onChange={(e) => setManualForm({ ...manualForm, certificate_url: e.target.value })}
                  className="w-full bg-slate-950/80 text-white px-3 py-2 rounded-xl border border-white/10"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Attach certificate, credential verification link, or official photo evidence for faculty verification.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="includePortfolio"
                  checked={manualForm.is_in_portfolio}
                  onChange={(e) => setManualForm({ ...manualForm, is_in_portfolio: e.target.checked })}
                  className="rounded border-white/20 bg-slate-900 text-rose-500 focus:ring-rose-500"
                />
                <label htmlFor="includePortfolio" className="text-xs text-slate-200 font-semibold cursor-pointer">
                  Highlight this achievement in my public student portfolio
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddPreviousOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 hover:text-white font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="clay-btn-rose px-5 py-2 rounded-xl text-white font-bold transition flex items-center gap-2"
                >
                  {submittingManual ? 'Saving...' : 'Save Achievement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
