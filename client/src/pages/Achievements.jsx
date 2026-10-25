import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, ShieldCheck, Clock, AlertCircle, Plus, Upload,
  ExternalLink, Sparkles, CheckCircle2, ChevronRight, Loader2, X,
  Trophy, FileText, Check, Filter, Search, ArrowRight, BookOpen, Layers
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export default function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Filter States
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [outcomeType, setOutcomeType] = useState('WINNING'); // 'WINNING' or 'PARTICIPATION'
  const [title, setTitle] = useState('');
  const [eventName, setEventName] = useState('');
  const [organization, setOrganization] = useState('');
  const [category, setCategory] = useState('Hackathon');
  const [level, setLevel] = useState('National');
  const [position, setPosition] = useState('Winner (1st)');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [certUrl, setCertUrl] = useState('');
  const [projectUrl, setProjectUrl] = useState('');

  const categories = [
    'Hackathon',
    'Competition',
    'Robotics',
    'Coding',
    'Research',
    'Sports',
    'Cultural',
    'Certification',
    'Workshop',
    'Leadership'
  ];

  const levels = [
    'Class',
    'Department',
    'College',
    'Inter-college',
    'University',
    'State',
    'National',
    'International'
  ];

  const winningPositions = [
    'Winner (1st)',
    '1st Runner-up (2nd)',
    '2nd Runner-up (3rd)',
    'Selected Finalist',
    'Special Mention / Award'
  ];

  const participationPositions = [
    'Participated & Completed',
    'Qualified for Next Round',
    'Attendee / Workshop Completion'
  ];

  useEffect(() => {
    loadAchievements();
  }, [user]);

  async function loadAchievements() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`/achievements?user_id=${user.id}`);
      setAchievements(res.achievements || []);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (presetType = 'WINNING') => {
    setOutcomeType(presetType);
    setPosition(presetType === 'WINNING' ? 'Winner (1st)' : 'Participated & Completed');
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleAddAchievement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/achievements', {
        title,
        event_name: eventName,
        organization,
        category,
        level,
        position,
        date,
        description: description ? `${description}${projectUrl ? ` • Project: ${projectUrl}` : ''}` : projectUrl,
        certificate_url: certUrl || null,
        proof_doc_url: certUrl || null
      });

      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setShowAddModal(false);
      setTitle('');
      setEventName('');
      setOrganization('');
      setDescription('');
      setCertUrl('');
      setProjectUrl('');

      setSuccessToast('Submitted for faculty verification! Your submission is now in the Verification Center queue.');
      setTimeout(() => setSuccessToast(''), 6000);

      loadAchievements();
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const totalSubmissions = achievements.length;
  const pendingCount = achievements.filter((a) => a.verification_status === 'PENDING').length;
  const verifiedCount = achievements.filter((a) => a.verification_status === 'VERIFIED').length;
  const rejectedCount = achievements.filter((a) => a.verification_status === 'REJECTED').length;
  const totalPoints = achievements
    .filter((a) => a.verification_status === 'VERIFIED')
    .reduce((sum, a) => sum + (a.points_awarded || 0), 0);

  // Filtered list
  const filteredAchievements = achievements.filter((ach) => {
    // Status Filter
    if (statusFilter !== 'ALL' && ach.verification_status !== statusFilter) return false;

    // Type Filter
    if (typeFilter === 'WINNING') {
      const isWin = ach.position?.includes('Winner') || ach.position?.includes('Runner') || ach.position?.includes('Finalist');
      if (!isWin) return false;
    } else if (typeFilter === 'PARTICIPATION') {
      const isPart = ach.position?.includes('Participat') || ach.position?.includes('Qualified') || ach.position?.includes('Attendee');
      if (!isPart) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ach.title?.toLowerCase().includes(q);
      const matchEvent = ach.event_name?.toLowerCase().includes(q);
      const matchOrg = ach.organization?.toLowerCase().includes(q);
      const matchCat = ach.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchEvent && !matchOrg && !matchCat) return false;
    }

    return true;
  });

  const getStatusBadge = (status, reason, points) => {
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>✓ AIT Verified</span>
          {points > 0 && <span className="text-emerald-200 ml-1">+{points} pts</span>}
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold shadow-[0_0_12px_rgba(244,63,94,0.25)]">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Needs Correction</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.25)]">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span>Awaiting Faculty Verification</span>
      </span>
    );
  };

  const getPositionStyle = (pos) => {
    const p = (pos || '').toLowerCase();
    if (p.includes('winner') || p.includes('1st')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-400/40';
    }
    if (p.includes('runner') || p.includes('2nd') || p.includes('3rd')) {
      return 'bg-blue-500/20 text-blue-300 border-blue-400/40';
    }
    if (p.includes('finalist')) {
      return 'bg-purple-500/20 text-purple-300 border-purple-400/40';
    }
    return 'bg-slate-500/20 text-slate-300 border-slate-400/40';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-2xl backdrop-blur-xl animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-blue-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Student Achievement & Participation Verification Hub
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              Send for Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Submit your off-campus hackathons, paper presentations, competitions, and winning medals to Dr. S. R. Patil and the AIT Faculty Verification Center. Authenticated submissions award official contribution points and appear on your permanent public portfolio.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => handleOpenModal('WINNING')}
              className="clay-btn-rose px-5 py-3 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Submit Winning / Podium</span>
            </button>
            <button
              onClick={() => handleOpenModal('PARTICIPATION')}
              className="clay-btn-blue px-5 py-3 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Participation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl liquid-glass border border-white/10 shadow-lg flex items-center gap-3.5 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{totalSubmissions}</div>
            <div className="text-xs font-semibold text-slate-300">Total Submissions</div>
            <div className="text-[10px] text-slate-400">Recorded records</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl liquid-glass border border-white/10 shadow-lg flex items-center gap-3.5 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-300">{pendingCount}</div>
            <div className="text-xs font-semibold text-slate-300">Awaiting Verification</div>
            <div className="text-[10px] text-amber-300/80">In faculty queue</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl liquid-glass border border-white/10 shadow-lg flex items-center gap-3.5 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">{verifiedCount}</div>
            <div className="text-xs font-semibold text-slate-300">✓ AIT Verified</div>
            <div className="text-[10px] text-emerald-300/80">+{totalPoints} contribution pts</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl liquid-glass border border-white/10 shadow-lg flex items-center gap-3.5 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-400">{rejectedCount}</div>
            <div className="text-xs font-semibold text-slate-300">Needs Attention</div>
            <div className="text-[10px] text-rose-300/80">Faculty feedback</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="liquid-glass rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-xl">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'ALL'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All Status ({totalSubmissions})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('VERIFIED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'VERIFIED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Outcome Type & Search Input */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900/90 text-slate-200 text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-rose-400/40"
          >
            <option value="ALL">All Outcomes</option>
            <option value="WINNING">Winnings & Podiums</option>
            <option value="PARTICIPATION">Participations</option>
          </select>

          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 text-white pl-8 pr-3 py-1.5 rounded-xl border border-white/10 text-xs focus:outline-none focus:border-blue-400/50"
            />
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-400 mb-2" />
          <p className="text-sm font-semibold">Loading your verification records...</p>
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="text-center py-16 liquid-glass rounded-3xl border border-white/10 p-8 space-y-4 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8 text-amber-300" />
          </div>
          <h3 className="font-bold text-lg text-white">No verification records found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'No submissions match your active filter criteria. Try resetting the filters above.'
              : 'Won an external hackathon, presented a technical paper, or participated in an inter-college contest? Submit it here to have it verified by faculty.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleOpenModal('WINNING')}
              className="clay-btn-rose px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Submit Winning Medal</span>
            </button>
            <button
              onClick={() => handleOpenModal('PARTICIPATION')}
              className="clay-btn-blue px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Participation</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAchievements.map((ach) => (
            <div
              key={ach.id}
              className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl hover:border-white/20 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 backdrop-blur-xl"
            >
              <div className="space-y-2.5 max-w-3xl flex-1">
                {/* Badges Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(ach.verification_status, ach.rejection_reason, ach.points_awarded)}
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getPositionStyle(ach.position)}`}>
                    {ach.position}
                  </span>
                  <span className="text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                    {ach.category}
                  </span>
                  <span className="text-xs font-medium text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    {ach.level} Level
                  </span>
                  <span className="text-xs text-slate-400 font-mono ml-1">
                    {ach.date}
                  </span>
                </div>

                {/* Title & Organization */}
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {ach.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Event: <b className="text-slate-200">{ach.event_name}</b> • Host: <b className="text-slate-200">{ach.organization}</b>
                </p>

                {/* Description */}
                {ach.description && (
                  <p className="text-xs text-slate-300/90 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                    {ach.description}
                  </p>
                )}

                {/* Status Guidance / Feedback */}
                {ach.verification_status === 'REJECTED' && ach.rejection_reason && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs">
                    <span className="font-bold text-rose-300">Faculty Review Feedback: </span>
                    {ach.rejection_reason}
                  </div>
                )}

                {ach.verification_status === 'VERIFIED' && (
                  <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Verified by {ach.verifier_name || 'Faculty Committee'}. Contribution score credited.
                  </div>
                )}
              </div>

              {/* Actions Right */}
              <div className="shrink-0 flex flex-wrap items-center gap-2.5 self-end lg:self-center">
                {ach.certificate_url && (
                  <a
                    href={ach.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition border border-white/10 flex items-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>View Proof Document</span>
                  </a>
                )}
                {ach.verification_status === 'REJECTED' && (
                  <button
                    onClick={() => {
                      setTitle(ach.title);
                      setEventName(ach.event_name);
                      setOrganization(ach.organization);
                      setCategory(ach.category);
                      setLevel(ach.level);
                      setPosition(ach.position);
                      setDate(ach.date);
                      setDescription(ach.description || '');
                      setCertUrl(ach.certificate_url || '');
                      setShowAddModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Re-submit with Updates</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBMISSION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-slate-950/95 rounded-3xl shadow-2xl border border-white/20 overflow-hidden max-h-[92vh] flex flex-col text-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Submit for Faculty Verification</h3>
                  <p className="text-[11px] text-slate-400">Official review by AIT Department & Faculty Verifiers</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddAchievement} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-200 font-semibold border border-rose-500/40 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submission Mode Selector (Winning vs Participation) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setOutcomeType('WINNING');
                    setPosition('Winner (1st)');
                  }}
                  className={`py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    outcomeType === 'WINNING'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>🏆 Winning / Podium</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOutcomeType('PARTICIPATION');
                    setPosition('Participated & Completed');
                  }}
                  className={`py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    outcomeType === 'PARTICIPATION'
                      ? 'bg-blue-500/25 text-blue-300 border border-blue-400/50 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>📜 Participation</span>
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-200">Achievement Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    outcomeType === 'WINNING'
                      ? 'e.g. 1st Place Winner - Smart India Hackathon 2026'
                      : 'e.g. Completed 36-Hour Hackathon - SIH 2026'
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-rose-400/50"
                />
              </div>

              {/* Event & Organization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">Event / Competition Name *</label>
                  <input
                    type="text"
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. Smart India Hackathon"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-rose-400/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-200">Host Organization / College *</label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. AICTE / Ministry of Education"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-rose-400/50"
                  />
                </div>
              </div>

              {/* Category, Level & Position */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-200">Competition Level *</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                  >
                    {levels.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-200">Position / Outcome *</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-semibold"
                  >
                    {(outcomeType === 'WINNING' ? winningPositions : participationPositions).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Proof URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">Date Conferred / Held *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-200">Certificate / Proof Link</label>
                  <input
                    type="url"
                    value={certUrl}
                    onChange={(e) => setCertUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or cloud PDF"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                  />
                </div>
              </div>

              {/* GitHub / Demo Link */}
              <div className="space-y-1">
                <label className="font-bold text-slate-200">Project / GitHub Repository Link (Optional)</label>
                <input
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-200">Description / Solution Overview</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your role, solution built, or award criteria..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                />
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-200 text-[11px] leading-relaxed">
                <span className="font-bold text-purple-300">⚡ Faculty Review Flow: </span>
                Once submitted, this entry is forwarded to the Verification Center. Verifiers can cross-reference your achievement using direct Google and DuckDuckGo links before granting verified points.
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-slate-300 hover:text-white font-bold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="clay-btn-rose px-6 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending to Verifiers...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Send to Faculty for Verification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
