import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Briefcase, Award, Search, Filter, Calendar, MapPin, ExternalLink,
  Bookmark, BookmarkCheck, Sparkles, CheckCircle2, Clock, AlertCircle,
  HelpCircle, XCircle, ArrowRight, RefreshCw, ChevronRight, Building2,
  GraduationCap, IndianRupee, ShieldCheck, Zap, Layers, User, Eye, X,
  Check, FileText, ChevronDown, Lock, Loader2, Compass, TrendingUp
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Opportunities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redirect legacy /opportunities?type=competition to /competitions
  useEffect(() => {
    if (searchParams.get('type') === 'competition') {
      navigate('/competitions', { replace: true });
    }
  }, [searchParams, navigate]);

  // Tab: 'INTERNSHIPS', 'SCHOLARSHIPS', 'ALL'
  const currentTab = searchParams.get('tab') === 'scholarships'
    ? 'SCHOLARSHIPS'
    : searchParams.get('tab') === 'all'
    ? 'ALL'
    : 'INTERNSHIPS';

  const setTab = (tab) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab.toLowerCase());
      return next;
    });
  };

  // Main Data States
  const [internships, setInternships] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());

  // Filter States
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Detail Modal
  const [selectedItem, setSelectedItem] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [internRes, scholRes] = await Promise.all([
          api.get('/internships').catch(() => ({ internships: [] })),
          api.get('/scholarships?limit=50').catch(() => ({ scholarships: [] }))
        ]);

        setInternships(internRes.internships || []);
        setScholarships(scholRes.scholarships || []);

        if (user) {
          const [savedI, savedS] = await Promise.all([
            api.get('/internships/my/saved').catch(() => ({ saved: [] })),
            api.get('/scholarships/my/saved').catch(() => ({ saved: [] }))
          ]);
          const set = new Set();
          (savedI.saved || savedI.internships || []).forEach(i => set.add(`internship_${i.id || i.internship_id}`));
          (savedS.saved || []).forEach(s => set.add(`scholarship_${s.id || s.scholarship_id}`));
          setSavedIds(set);
        }
      } catch (err) {
        console.error('Failed to load opportunities:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Safe Skills array helper (prevents .split is not a function error)
  const getSkillsArray = (item) => {
    if (!item) return [];
    if (Array.isArray(item.skills_required)) return item.skills_required;
    if (typeof item.skills_required === 'string') {
      return item.skills_required.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    }
    if (Array.isArray(item.tags)) return item.tags;
    if (item.category) return [item.category];
    return ['Engineering', 'Technical'];
  };

  // Toggle Save
  const handleToggleSave = async (item, isInternship, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    const key = isInternship ? `internship_${item.id}` : `scholarship_${item.id}`;
    const isSaved = savedIds.has(key);
    try {
      if (isInternship) {
        if (isSaved) {
          await api.delete(`/internships/${item.id}/save`);
          setSavedIds(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        } else {
          await api.post(`/internships/${item.id}/save`, {});
          setSavedIds(prev => new Set(prev).add(key));
        }
      } else {
        if (isSaved) {
          await api.delete(`/scholarships/${item.id}/save`);
          setSavedIds(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        } else {
          await api.post(`/scholarships/${item.id}/save`, {});
          setSavedIds(prev => new Set(prev).add(key));
        }
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  // Filter Internships
  const filteredInternships = useMemo(() => {
    return internships.filter(item => {
      // Category filter
      if (sourceFilter === 'SOFTWARE' && !['Software Development', 'Artificial Intelligence', 'Data Science', 'Machine Learning'].includes(item.category)) return false;
      if (sourceFilter === 'CORE' && !['Electronics and Embedded Systems', 'Mechanical Engineering', 'Electrical Engineering'].includes(item.category)) return false;
      if (sourceFilter === 'RESEARCH' && !['Research Internships', 'Government Internships', 'Defense Research'].includes(item.category)) return false;

      // Mode filter
      if (modeFilter !== 'ALL' && (item.mode || '').toUpperCase() !== modeFilter.toUpperCase()) return false;

      // Branch filter
      if (branchFilter !== 'ALL') {
        const rawBranches = (item.eligible_branches_raw || (Array.isArray(item.eligible_branches) ? item.eligible_branches.join(' ') : item.eligible_branches) || '').toUpperCase();
        if (!rawBranches.includes('ALL') && !rawBranches.includes(branchFilter.toUpperCase())) {
          return false;
        }
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${item.title} ${item.company || item.company_name} ${item.description} ${item.category}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [internships, sourceFilter, modeFilter, branchFilter, searchQuery]);

  // Filter Scholarships
  const filteredScholarships = useMemo(() => {
    return scholarships.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${item.title || item.name} ${item.organization || item.portal_name} ${item.description || item.overview}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [scholarships, searchQuery]);

  // Combined items based on current tab
  const displayItems = useMemo(() => {
    if (currentTab === 'INTERNSHIPS') {
      return filteredInternships.map(i => ({ ...i, itemType: 'INTERNSHIP' }));
    }
    if (currentTab === 'SCHOLARSHIPS') {
      return filteredScholarships.map(s => ({ ...s, itemType: 'SCHOLARSHIP' }));
    }
    return [
      ...filteredInternships.map(i => ({ ...i, itemType: 'INTERNSHIP' })),
      ...filteredScholarships.map(s => ({ ...s, itemType: 'SCHOLARSHIP' }))
    ];
  }, [currentTab, filteredInternships, filteredScholarships]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10 text-slate-100">

      {/* ===================== SPATIAL BENTO TELEMETRY STRIP ===================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Bento Card 1: Verified Internships */}
        <div className="liquid-glass rounded-2xl p-4 spatial-card border-blue-500/20 hover:border-blue-500/40 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Internships</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-400/20 group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{internships.length}</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center">✓ 100% Verified</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Industry, Defense & Research</p>
        </div>

        {/* Bento Card 2: National Scholarships */}
        <div className="liquid-glass rounded-2xl p-4 spatial-card border-rose-500/20 hover:border-rose-500/40 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Scholarships</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-400/20 group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{scholarships.length}</span>
            <span className="text-[10px] text-rose-300 font-bold">36 States Covered</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Central, Armed Forces & Corporate</p>
        </div>

        {/* Bento Card 3: Average Stipend / Benefit */}
        <div className="liquid-glass rounded-2xl p-4 spatial-card border-white/10 hover:border-white/25 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Avg Stipend</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300">₹48.5K</span>
            <span className="text-[10px] text-slate-400 font-medium">/ month</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Up to ₹1,25,000 / mo</p>
        </div>

        {/* Bento Card 4: Match Engine */}
        <div className="liquid-glass rounded-2xl p-4 spatial-card border-purple-500/20 hover:border-purple-500/40 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">AI Eligibility</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-400/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">Active</span>
            <span className="text-[10px] text-emerald-400 font-bold">● Live Sync</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Deterministic Branch & Skill Rules</p>
        </div>
      </div>

      {/* ===================== HERO HEADER (Matches Hackathons.jsx Reference Image) ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold mb-2 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AIT Career Arena & Opportunity Hub
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Your Future Starts Here.
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Discover verified engineering internships that accelerate your career and authentic scholarships that support your academic journey — all in one spatial platform.
          </p>
        </div>

        {/* Tab Filters (Exact styling from Hackathons.jsx Image 2 Reference) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex liquid-glass p-1 rounded-2xl text-xs font-bold border border-white/10 shadow-lg">
            <button
              onClick={() => setTab('INTERNSHIPS')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'INTERNSHIPS'
                  ? 'clay-btn-blue text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Internships ({internships.length})
            </button>
            <button
              onClick={() => setTab('SCHOLARSHIPS')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'SCHOLARSHIPS'
                  ? 'clay-btn-rose text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Scholarships ({scholarships.length})
            </button>
            <button
              onClick={() => setTab('ALL')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'ALL'
                  ? 'bg-white/15 text-white font-bold border border-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Opportunities ({internships.length + scholarships.length})
            </button>
          </div>
        </div>
      </div>

      {/* ===================== SOURCE FILTER SELECTOR BAR (Exact match to Image 2) ===================== */}
      <div className="liquid-glass p-4 rounded-2xl border border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-4 text-xs backdrop-blur-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-semibold">Filter:</span>
          <div className="flex bg-black/40 p-1 rounded-xl font-bold flex-wrap gap-1 border border-white/5">
            <button
              onClick={() => setSourceFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                sourceFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({displayItems.length})
            </button>
            {currentTab !== 'SCHOLARSHIPS' && (
              <>
                <button
                  onClick={() => setSourceFilter('SOFTWARE')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    sourceFilter === 'SOFTWARE'
                      ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Software & AI
                </button>
                <button
                  onClick={() => setSourceFilter('CORE')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    sourceFilter === 'CORE'
                      ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Core & Hardware
                </button>
                <button
                  onClick={() => setSourceFilter('RESEARCH')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    sourceFilter === 'RESEARCH'
                      ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Research & Defense
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Controls: Branch Filter & Search Box */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-black/50 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-rose-500/50 w-44 sm:w-52"
            />
          </div>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/60 text-slate-200 font-bold cursor-pointer text-xs focus:outline-hidden focus:border-blue-500/50"
          >
            <option value="ALL">All Branches</option>
            <option value="COMP">Computer (COMP)</option>
            <option value="IT">Information Tech (IT)</option>
            <option value="ENTC">Electronics (E&TC)</option>
            <option value="MECH">Mechanical (MECH)</option>
            <option value="AS">Robotics & Automation</option>
          </select>

          <Link
            to="/teams/find"
            className="clay-btn-rose px-4 py-2 rounded-xl text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/30"
          >
            <Briefcase className="w-3.5 h-3.5" />
            Find Career Peers
          </Link>
        </div>
      </div>

      {/* ===================== LISTINGS / CARDS (Matching Hackathons.jsx Image 2 Reference) ===================== */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-9 h-9 animate-spin text-rose-500 mb-3" />
          <p className="text-sm font-semibold">Loading verified opportunities from database...</p>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-16 liquid-glass rounded-3xl border border-white/10">
          <p className="font-bold text-slate-300">No opportunities match the selected filters right now.</p>
          <button
            onClick={() => { setSourceFilter('ALL'); setBranchFilter('ALL'); setModeFilter('ALL'); setSearchQuery(''); }}
            className="mt-3 px-4 py-2 rounded-xl clay-btn-blue text-white text-xs font-bold cursor-pointer shadow-md"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {displayItems.map((item) => {
            const isInternship = item.itemType === 'INTERNSHIP';
            const skillsArray = getSkillsArray(item);
            const isSaved = savedIds.has(isInternship ? `internship_${item.id}` : `scholarship_${item.id}`);
            const deadlineDate = item.deadline || item.application_close_at;

            // Thumbnail / Banner image
            const bannerUrl = item.company_logo_url || item.banner_url || (isInternship
              ? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'
              : 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800');

            // Bottom-left highlight tag
            const highlightTag = isInternship
              ? (item.stipend || (item.stipend_amount ? `₹${item.stipend_amount.toLocaleString()} / month` : 'Paid Stipend'))
              : (item.amount || (item.max_amount ? `₹${item.max_amount.toLocaleString()} / year` : 'Financial Grant'));

            return (
              <div
                key={`${item.itemType}_${item.id}`}
                className="liquid-glass rounded-3xl border border-white/10 shadow-2xl hover:border-blue-500/40 hover:shadow-[0_20px_50px_rgba(37,99,235,0.2)] transition-all duration-300 overflow-hidden flex flex-col lg:flex-row group spatial-card"
              >
                {/* Banner Thumbnail (Exact match to Image 2) */}
                <div className="lg:w-80 h-52 lg:h-auto bg-slate-950 relative shrink-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
                  <img
                    src={bannerUrl}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 filter contrast-110"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-md ${
                      isInternship ? 'bg-blue-600 shadow-blue-500/40' : 'bg-rose-600 shadow-rose-500/40'
                    }`}>
                      {isInternship ? (item.category || 'Internship') : (item.category || 'Scholarship')}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-md shadow-emerald-500/30">
                      ✓ AIT Eligible
                    </span>
                  </div>

                  {highlightTag && (
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/30">
                      {highlightTag}
                    </div>
                  )}
                </div>

                {/* Details Body (Exact match to Image 2) */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Top Meta Line */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      <span className="text-blue-400 font-bold">{item.company || item.company_name || item.organization || item.portal_name || 'Organization'}</span>
                      <span>MODE: {item.mode || (isInternship ? 'Hybrid / Remote' : 'Online Portal')}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {item.title || item.name}
                    </h3>

                    {/* Overview Description */}
                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                      {item.description || item.overview}
                    </p>

                    {/* Eligibility Reason */}
                    {(item.eligibility || item.eligible_branches_raw || item.qualification) && (
                      <p className="text-xs text-slate-400 italic">
                        Verified Eligible: {item.eligibility || `Open to ${item.eligible_branches_raw || 'all AIT branches'}`}
                      </p>
                    )}

                    {/* Skills Pills */}
                    {skillsArray.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {skillsArray.slice(0, 5).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-medium hover:border-blue-500/40 transition-colors"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metadata and Actions (Exact match to Image 2) */}
                  <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      {deadlineDate && (
                        <span>Deadline: <strong className="text-rose-400">{new Date(deadlineDate).toLocaleDateString()}</strong></span>
                      )}
                      <span>Duration: <strong className="text-slate-200">{item.duration || (isInternship ? '2 to 6 Months' : 'Academic Year')}</strong></span>
                      {item.days_remaining !== null && item.days_remaining !== undefined && (
                        <span className="text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          ⏳ {item.days_remaining > 0 ? `${item.days_remaining} days left` : 'Closing soon'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Save Bookmark button */}
                      <button
                        onClick={(e) => handleToggleSave(item, isInternship, e)}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          isSaved
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                        }`}
                        title={isSaved ? 'Saved in personal library' : 'Save opportunity'}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4 text-amber-300" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      {/* Full Details modal trigger */}
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 font-bold text-xs transition cursor-pointer"
                      >
                        Full Details
                      </button>

                      {/* Apply Now button (claymorphic neon) */}
                      <a
                        href={item.apply_url || item.application_link || item.official_application_url || 'https://scholarships.gov.in'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 rounded-xl text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg ${
                          isInternship ? 'clay-btn-blue shadow-blue-500/40' : 'clay-btn-rose shadow-rose-500/40'
                        }`}
                      >
                        {isInternship ? 'Apply on Portal' : 'Apply on NSP/Portal'} <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== FULL DETAILS SPATIAL LIQUID MODAL ===================== */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="liquid-glass rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 p-6 sm:p-8 space-y-6 text-slate-200">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  {selectedItem.company || selectedItem.organization || 'AIT Verified Posting'}
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  {selectedItem.title || selectedItem.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <h4 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-1">Overview</h4>
                <p className="text-slate-300 leading-relaxed">{selectedItem.description || selectedItem.overview}</p>
              </div>

              {selectedItem.responsibilities && (
                <div>
                  <h4 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-1">Key Responsibilities</h4>
                  <p className="text-slate-300 leading-relaxed">{selectedItem.responsibilities}</p>
                </div>
              )}

              {selectedItem.qualifications && (
                <div>
                  <h4 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-1">Eligibility & Qualifications</h4>
                  <p className="text-slate-300 leading-relaxed">{selectedItem.qualifications}</p>
                </div>
              )}

              {selectedItem.selection_process && (
                <div>
                  <h4 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-1">Selection Process</h4>
                  <p className="text-slate-300 leading-relaxed">{selectedItem.selection_process}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-black/40 rounded-2xl border border-white/10 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Stipend / Grant</span>
                  <span className="font-bold text-amber-300">{selectedItem.stipend || selectedItem.amount || 'As per scheme'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Mode / Location</span>
                  <span className="font-bold text-blue-400">{selectedItem.mode || selectedItem.location || 'Online'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Deadline</span>
                  <span className="font-bold text-rose-400">{selectedItem.deadline ? new Date(selectedItem.deadline).toLocaleDateString() : 'Active'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
              <a
                href={selectedItem.apply_url || selectedItem.application_link || selectedItem.official_application_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="clay-btn-rose px-5 py-2.5 rounded-xl text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-rose-600/40 cursor-pointer"
              >
                Proceed to Official Application <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
