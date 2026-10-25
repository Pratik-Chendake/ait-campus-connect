import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Award, Search, Filter, Calendar, ExternalLink, Bookmark, BookmarkCheck,
  ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, ChevronRight,
  IndianRupee, Building2, MapPin, GraduationCap, Sparkles, Clock,
  ArrowRight, RefreshCw, User, HelpCircle, X, Check, Share2, Layers,
  ChevronDown, HeartHandshake, Eye, BookOpen, Lock, ShieldAlert, CheckSquare,
  FileText
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'HOME', label: 'Home', icon: Sparkles },
  { id: 'ALL', label: 'All Scholarships', icon: Layers },
  { id: 'ELIGIBLE', label: 'Eligible for Me', icon: CheckCircle2 },
  { id: 'CENTRAL', label: 'Central Govt', icon: Building2 },
  { id: 'STATES', label: 'State-Wise (36)', icon: MapPin },
  { id: 'DEFENCE', label: 'Defence & Police', icon: ShieldCheck },
  { id: 'CORPORATE', label: 'Private & CSR', icon: IndianRupee },
  { id: 'AIT', label: 'AIT Exclusive', icon: Award },
  { id: 'SAVED', label: 'Saved Library', icon: Bookmark },
  { id: 'CALENDAR', label: 'Deadlines Calendar', icon: Calendar },
];

const DEFENCE_CATEGORY_LABELS = {
  NONE: 'None / Civilian',
  ESM_PRIORITY_1_TO_8: 'Ex-Servicemen (ESM) Ward (Priority 1-8)',
  SERVING_ARMY: 'Serving Army Personnel Ward',
  BATTLE_CASUALTY: 'Battle Casualty / Disabled in Action Ward',
  CAPF_AR: 'CAPF / Assam Rifles Ward (WARB)',
  STATE_POLICE_MARTYR: 'State Police Martyr Ward (Terror/Naxal)',
};

export default function Scholarships() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State
  const activeTab = searchParams.get('tab') || 'HOME';
  const setActiveTab = (tabId) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    });
  };

  // Main Data States
  const [scholarships, setScholarships] = useState([]);
  const [stats, setStats] = useState(null);
  const [statesData, setStatesData] = useState([]);
  const [calendarData, setCalendarData] = useState(null);
  const [matchedData, setMatchedData] = useState(null);
  const [savedList, setSavedList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterState, setFilterState] = useState('ALL');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterIncome, setFilterIncome] = useState('ALL');
  const [filterSocialCategory, setFilterSocialCategory] = useState('ALL');
  const [filterGender, setFilterGender] = useState('ALL');
  const [filterDefence, setFilterDefence] = useState('ALL');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEADLINE_ASC');

  // Interactive Profile Drawer / Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    domicile_state: 'Maharashtra',
    category: 'GEN',
    gender: 'MALE',
    family_annual_income: 400000,
    defence_category: 'ESM_PRIORITY_1_TO_8',
    is_hosteller: true,
    is_single_girl_child: false,
    is_pwd: false,
    is_orphan: false,
    class_12_percentage: 82,
    current_cgpa: 8.4,
    has_active_other_scholarship: false
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Outbound Redirection Modal
  const [redirectModalItem, setRedirectModalItem] = useState(null);

  // Selected State in State Explorer
  const [selectedStateCode, setSelectedStateCode] = useState('MH');
  const [stateSearchQuery, setStateSearchQuery] = useState('');

  // Initial Load
  useEffect(() => {
    fetchStats();
    fetchStates();
    if (user) {
      fetchUserProfile();
      fetchUserMatches();
      fetchSavedScholarships();
    }
  }, [user]);

  // Tab-specific loading
  useEffect(() => {
    if (activeTab === 'CALENDAR') {
      fetchCalendar();
    } else if (activeTab === 'ELIGIBLE' && user) {
      fetchUserMatches();
    } else if (activeTab === 'SAVED' && user) {
      fetchSavedScholarships();
    } else {
      fetchFilteredScholarships();
    }
  }, [activeTab, filterCategory, filterState, filterBranch, filterYear, filterIncome, filterSocialCategory, filterGender, filterDefence, filterUrgency, sortBy]);

  // API Callers
  async function fetchStats() {
    try {
      const res = await api.get('/scholarships/stats');
      setStats(res);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  async function fetchStates() {
    try {
      const res = await api.get('/scholarships/states');
      setStatesData(res.states || []);
    } catch (err) {
      console.error('Failed to load states:', err);
    }
  }

  async function fetchCalendar() {
    setLoading(true);
    try {
      const res = await api.get('/scholarships/calendar');
      setCalendarData(res);
    } catch (err) {
      console.error('Failed to load calendar:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserProfile() {
    try {
      const res = await api.get('/scholarships/my/profile');
      if (res.profile) {
        setProfileData(prev => ({
          ...prev,
          ...res.profile
        }));
      }
    } catch (err) {
      console.error('Failed to load scholarship profile:', err);
    }
  }

  async function fetchUserMatches() {
    setLoading(true);
    try {
      const res = await api.get('/scholarships/my/matches');
      setMatchedData(res);
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSavedScholarships() {
    setLoading(true);
    try {
      const res = await api.get('/scholarships/my/saved');
      setSavedList(res.saved || []);
    } catch (err) {
      console.error('Failed to load saved:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFilteredScholarships() {
    setLoading(true);
    try {
      let endpoint = `/scholarships?limit=100`;
      if (search) endpoint += `&search=${encodeURIComponent(search)}`;

      // Category tab overrides
      if (activeTab === 'CENTRAL') endpoint += `&category=CENTRAL`;
      else if (activeTab === 'DEFENCE') endpoint += `&category=DEFENCE`;
      else if (activeTab === 'CORPORATE') endpoint += `&category=CORPORATE`;
      else if (activeTab === 'AIT') endpoint += `&category=AIT_EXCLUSIVE`;
      else if (filterCategory !== 'ALL') endpoint += `&category=${filterCategory}`;

      if (filterState !== 'ALL') endpoint += `&state=${filterState}`;
      if (filterBranch !== 'ALL') endpoint += `&branch=${filterBranch}`;
      if (filterYear !== 'ALL') endpoint += `&year=${filterYear}`;
      if (filterIncome !== 'ALL') endpoint += `&income=${filterIncome}`;
      if (filterSocialCategory !== 'ALL') endpoint += `&category_restriction=${filterSocialCategory}`;
      if (filterGender !== 'ALL') endpoint += `&gender=${filterGender}`;
      if (filterDefence !== 'ALL') endpoint += `&defence=${filterDefence}`;
      if (filterUrgency !== 'ALL') endpoint += `&urgency=${filterUrgency}`;
      if (sortBy) endpoint += `&sort=${sortBy}`;

      const res = await api.get(endpoint);
      setScholarships(res.scholarships || []);
    } catch (err) {
      console.error('Failed to load scholarships:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFilteredScholarships();
  };

  // Toggle Save Scholarship
  const handleToggleSave = async (sch, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    const isSaved = savedList.some(item => item.scholarship_id === sch.id);
    try {
      if (isSaved) {
        await api.delete(`/scholarships/${sch.id}/save`);
        setSavedList(prev => prev.filter(i => i.scholarship_id !== sch.id));
      } else {
        await api.post(`/scholarships/${sch.id}/save`, { status: 'INTERESTED' });
        setSavedList(prev => [...prev, { scholarship_id: sch.id, status: 'INTERESTED', scholarship: sch }]);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  // Update Saved Status
  const handleUpdateSavedStatus = async (scholarshipId, status, notes) => {
    try {
      await api.patch(`/scholarships/${scholarshipId}/save-status`, { status, notes });
      setSavedList(prev => prev.map(item =>
        item.scholarship_id === scholarshipId
          ? { ...item, status, notes: notes !== undefined ? notes : item.notes }
          : item
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Save Eligibility Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.post('/scholarships/my/profile', profileData);
      setProfileModalOpen(false);
      await fetchUserMatches();
      await fetchUserProfile();
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Safe Outbound Redirect
  const handleInitiateRedirect = (sch, e) => {
    if (e) e.stopPropagation();
    setRedirectModalItem(sch);
  };

  const handleProceedRedirect = () => {
    if (!redirectModalItem) return;
    const targetUrl = redirectModalItem.official_application_url || redirectModalItem.apply_url || 'https://scholarships.gov.in';
    const redirectUrl = `/api/scholarships/${redirectModalItem.id}/redirect`;
    window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    setRedirectModalItem(null);
  };

  // Check if saved
  const isItemSaved = (id) => savedList.some(item => item.scholarship_id === id);

  // Compute Days Remaining helper
  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const ref = new Date('2026-10-24T00:00:00Z');
    const d = new Date(deadline + 'T00:00:00Z');
    const diff = Math.ceil((d - ref) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Filtered States list
  const filteredStates = useMemo(() => {
    if (!stateSearchQuery.trim()) return statesData;
    const q = stateSearchQuery.toLowerCase();
    return statesData.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.portal_name && s.portal_name.toLowerCase().includes(q))
    );
  }, [statesData, stateSearchQuery]);

  const activeStateObj = useMemo(() => {
    if (!statesData || statesData.length === 0) {
      return {
        code: 'MH',
        name: 'Maharashtra',
        portal_name: 'MahaDBT (Directorate of Technical Education)',
        portal_url: 'https://mahadbt.maharashtra.gov.in/',
        out_of_state_notes: 'Eligible for Maharashtra domiciled students studying in AICTE-approved institutions in Maharashtra.'
      };
    }
    return statesData.find(s => s.code === selectedStateCode) || statesData[0];
  }, [statesData, selectedStateCode]);

  // Safe Memoized Collections
  const likelyEligibleList = useMemo(() => {
    return Array.isArray(matchedData?.likely_eligible)
      ? matchedData.likely_eligible
      : Array.isArray(matchedData?.matches?.likely_eligible)
      ? matchedData.matches.likely_eligible
      : [];
  }, [matchedData]);

  const needsMoreInfoList = useMemo(() => {
    return Array.isArray(matchedData?.needs_more_info)
      ? matchedData.needs_more_info
      : Array.isArray(matchedData?.matches?.needs_more_info)
      ? matchedData.matches.needs_more_info
      : [];
  }, [matchedData]);

  const notEligibleList = useMemo(() => {
    return Array.isArray(matchedData?.not_eligible)
      ? matchedData.not_eligible
      : Array.isArray(matchedData?.matches?.not_eligible)
      ? matchedData.matches.not_eligible
      : [];
  }, [matchedData]);

  const thisWeekList = useMemo(() => {
    return Array.isArray(calendarData?.this_week)
      ? calendarData.this_week
      : Array.isArray(calendarData?.calendar?.this_week)
      ? calendarData.calendar.this_week
      : [];
  }, [calendarData]);

  const thisMonthList = useMemo(() => {
    return Array.isArray(calendarData?.this_month)
      ? calendarData.this_month
      : Array.isArray(calendarData?.calendar?.this_month)
      ? calendarData.calendar.this_month
      : [];
  }, [calendarData]);

  const upcomingList = useMemo(() => {
    return Array.isArray(calendarData?.upcoming)
      ? calendarData.upcoming
      : Array.isArray(calendarData?.calendar?.upcoming)
      ? calendarData.calendar.upcoming
      : [];
  }, [calendarData]);

  const closedList = useMemo(() => {
    return Array.isArray(calendarData?.closed)
      ? calendarData.closed
      : Array.isArray(calendarData?.calendar?.closed)
      ? calendarData.calendar.closed
      : [];
  }, [calendarData]);

  const safeScholarshipList = useMemo(() => {
    return Array.isArray(scholarships) ? scholarships : [];
  }, [scholarships]);

  return (
    <div className="min-h-screen pb-20 relative z-10 text-slate-100 animate-fade-in">

      {/* 1. HERO HEADER */}
      <section className="liquid-glass text-white pt-10 pb-12 border-b border-white/10 shadow-2xl mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Top Trust & Authority Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/10 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold shadow-[0_0_12px_rgba(244,63,94,0.25)]">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Verified Indian Scholarships
              </span>
              <span className="hidden sm:inline text-slate-400">•</span>
              <span className="text-slate-300 hidden sm:inline">2026–27 Academic Cycle</span>
              <span className="hidden md:inline text-slate-400">•</span>
              <span className="text-slate-400 hidden md:inline">Army Institute of Technology, Pune</span>
            </div>

            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <span className="flex items-center gap-1 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-blue-400" /> Official Portals Only
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">100% Free & Transparent</span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                AIT Scholarship Connect
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Your Future Deserves <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-rose-400 bg-clip-text text-transparent">
                  Every Opportunity.
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
                Discover verified scholarships across India, check your eligibility with our deterministic rule engine, and apply directly through authentic government, defence, and corporate portals.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    if (user) {
                      setActiveTab('ELIGIBLE');
                    } else {
                      setProfileModalOpen(true);
                    }
                  }}
                  className="clay-btn-rose px-6 py-3 rounded-xl text-white font-black text-sm shadow-lg shadow-rose-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Check My Eligibility Now
                </button>

                <button
                  onClick={() => setActiveTab('ALL')}
                  className="clay-btn-blue px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-white" />
                  Browse Master Catalog
                </button>

                <button
                  onClick={() => setActiveTab('STATES')}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-medium text-sm border border-white/10 transition flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-rose-400" />
                  All 36 States & UTs
                </button>
              </div>

              {/* Trust Subtext */}
              <div className="pt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                  Never asks for login passwords or banking OTPs
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                  Out-of-state study compatibility for AIT Pune
                </span>
              </div>
            </div>

            {/* Quick Metrics Card */}
            <div className="lg:col-span-4 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/70 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Live Portal Stats
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Synced 24 Oct 2026
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
                  <div className="text-2xl font-black text-white">
                    {stats?.total_verified || 30}+
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">
                    Verified Schemes
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
                  <div className="text-2xl font-black text-emerald-400">
                    {stats?.currently_open || 16}
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">
                    Open for 2026-27
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-rose-500/30">
                  <div className="text-2xl font-black text-rose-400 flex items-center gap-1.5">
                    {stats?.closing_soon || 11}
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  </div>
                  <div className="text-xs text-rose-300 font-medium mt-0.5">
                    Closing Soon (≤7d)
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
                  <div className="text-2xl font-black text-amber-300">
                    {user ? (matchedData?.likely_eligible?.length || 0) : '—'}
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">
                    {user ? 'Matching You' : 'Log in to Match'}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('CALENDAR')}
                  className="w-full py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-xs text-slate-300 hover:text-white font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  View Urgency Matrix & Deadlines
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. NAVIGATION TABS BAR (10 DEDICATED TABS) */}
      <div className="sticky top-16 z-30 liquid-glass border-b border-white/10 shadow-xl backdrop-blur-2xl mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto py-2.5 gap-1.5 no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                    isActive
                      ? 'clay-btn-rose text-white shadow-md shadow-rose-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {tab.label}
                  {tab.id === 'SAVED' && savedList.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                      {savedList.length}
                    </span>
                  )}
                  {tab.id === 'ELIGIBLE' && matchedData?.likely_eligible?.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-black">
                      {matchedData.likely_eligible.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. MAIN TAB CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* ===================== TAB 1: HOME ===================== */}
        {activeTab === 'HOME' && (
          <div className="space-y-10">

            {/* Urgent Deadline Banner */}
            <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-rose-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                  Urgent Notice: 31 October 2026 Deadlines
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  National Scholarship Portal (NSP) & KSB PMSS Applications Closing
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm max-w-3xl leading-relaxed">
                  Central AICTE Schemes (Pragati, Saksham, Swanath), Kendriya Sainik Board PMSS, and Reliance Foundation UG applications close on or before 31 October 2026. Complete your One-Time Registration (OTR) and verify documents immediately.
                </p>
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0">
                <button
                  onClick={() => {
                    setFilterUrgency('CLOSING_SOON');
                    setActiveTab('ALL');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  View 11 Urgent Schemes <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab('CALENDAR')}
                  className="px-5 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-950 text-white font-semibold text-xs border border-rose-500/40 transition cursor-pointer"
                >
                  Deadlines Calendar
                </button>
              </div>
            </div>

            {/* Quick Explore Categories Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Explore Schemes by Category
                  </h2>
                  <p className="text-xs text-slate-500">
                    Authentic programs categorized for undergraduate engineering students at AIT Pune
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { id: 'CENTRAL', label: 'Central Govt / NSP', count: '8 Schemes', icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                  { id: 'STATES', label: 'State Domicile', count: '36 States/UTs', icon: MapPin, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                  { id: 'DEFENCE', label: 'Defence / KSB', count: '5 Schemes', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                  { id: 'CORPORATE', label: 'Corporate CSR', count: '6 Foundations', icon: IndianRupee, color: 'text-purple-600 bg-purple-50 border-purple-200' },
                  { id: 'AIT', label: 'AIT Exclusive', count: '4 Endowments', icon: Award, color: 'text-rose-600 bg-rose-50 border-rose-200' },
                  { id: 'ELIGIBLE', label: 'Eligible for You', count: 'Instant Check', icon: Sparkles, color: 'text-teal-600 bg-teal-50 border-teal-200' },
                ].map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      className="p-4 rounded-2xl liquid-glass border border-white/10 hover:border-amber-400/40 hover:shadow-[0_10px_25px_rgba(245,158,11,0.15)] transition text-left flex flex-col justify-between group cursor-pointer backdrop-blur-xl"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-3 ${cat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs sm:text-sm group-hover:text-amber-300 transition">
                          {cat.label}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {cat.count}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Featured Scholarships Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Featured & High-Impact Schemes
                  </h2>
                  <p className="text-xs text-slate-400">
                    Major verified grants with proven track records for AIT Pune students
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('ALL')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  View All ({scholarships.length}) <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {scholarships.slice(0, 6).map((sch) => (
                  <ScholarshipCard
                    key={sch.id}
                    sch={sch}
                    isSaved={isItemSaved(sch.id)}
                    onToggleSave={(e) => handleToggleSave(sch, e)}
                    onInitiateRedirect={(e) => handleInitiateRedirect(sch, e)}
                  />
                ))}
              </div>
            </div>

            {/* How It Works Explainer */}
            <div className="liquid-glass rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6 backdrop-blur-2xl">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-full">
                  How Scholarship Connect Works
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Transparent, Safe & Direct
                </h3>
                <p className="text-xs text-slate-300">
                  We believe no student should miss out on education funding due to lack of verified information.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                {[
                  {
                    step: '01',
                    title: 'Enter Voluntary Profile',
                    desc: 'Provide domicile, category, income, and defence background. Zero sensitive data (no Aadhaar, passwords, or bank OTPs).',
                    icon: User,
                  },
                  {
                    step: '02',
                    title: 'Instant Rule Engine',
                    desc: 'Our deterministic algorithm evaluates hard criteria and explains exactly why you are eligible or what documents are missing.',
                    icon: ShieldCheck,
                  },
                  {
                    step: '03',
                    title: 'Prepare Verified Docs',
                    desc: 'Review exact required certificates: Income, Domicile, ESM Certificate, Bonafide, Fee Receipt, and Marksheets.',
                    icon: FileText,
                  },
                  {
                    step: '04',
                    title: 'Direct Official Apply',
                    desc: 'One-click safe redirection to authentic National Scholarship Portal, MahaDBT, KSB, or CSR foundation portals.',
                    icon: ExternalLink,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400 font-mono">{item.step}</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ===================== TAB 2: ALL SCHOLARSHIPS ===================== */}
        {activeTab === 'ALL' && (
          <div className="space-y-6">

            {/* Filter and Search Bar */}
            <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-4">
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by scholarship title, provider (AICTE, KSB, Reliance...), or benefit..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#030712]/70 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-400 backdrop-blur-md"
                  />
                </div>
                <button
                  type="submit"
                  className="clay-btn-rose px-6 py-2.5 rounded-xl text-white font-bold text-xs transition cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Multi-Filters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="CENTRAL">Central Govt / NSP</option>
                    <option value="STATE">State Govt</option>
                    <option value="DEFENCE">Defence Wards</option>
                    <option value="POLICE">Police & CAPF</option>
                    <option value="CORPORATE">Corporate CSR</option>
                    <option value="AIT_EXCLUSIVE">AIT Exclusive</option>
                  </select>
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Branch</label>
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700"
                  >
                    <option value="ALL">All Branches</option>
                    <option value="Computer">Computer</option>
                    <option value="IT">Information Tech</option>
                    <option value="EnTC">Electronics (EnTC)</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="ASGE">ASGE</option>
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Academic Year</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700"
                  >
                    <option value="ALL">All Years</option>
                    <option value="1">1st Year Only (Fresh)</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                {/* Income Ceiling */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Family Income</label>
                  <select
                    value={filterIncome}
                    onChange={(e) => setFilterIncome(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700"
                  >
                    <option value="ALL">Any Income</option>
                    <option value="250000">Up to ₹2.5 Lakh</option>
                    <option value="600000">Up to ₹6.0 Lakh</option>
                    <option value="800000">Up to ₹8.0 Lakh</option>
                  </select>
                </div>

                {/* Social Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Social Category</label>
                  <select
                    value={filterSocialCategory}
                    onChange={(e) => setFilterSocialCategory(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="GEN">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Urgency</label>
                  <select
                    value={filterUrgency}
                    onChange={(e) => setFilterUrgency(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700"
                  >
                    <option value="ALL">All Deadlines</option>
                    <option value="CLOSING_SOON">Closing Soon (≤7d)</option>
                    <option value="OPEN_NOW">Open for 2026-27</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Showing {scholarships.length} scholarships</span>
                  {(filterCategory !== 'ALL' || filterBranch !== 'ALL' || filterYear !== 'ALL' || filterIncome !== 'ALL' || filterSocialCategory !== 'ALL' || filterUrgency !== 'ALL' || search) && (
                    <button
                      onClick={() => {
                        setFilterCategory('ALL');
                        setFilterBranch('ALL');
                        setFilterYear('ALL');
                        setFilterIncome('ALL');
                        setFilterSocialCategory('ALL');
                        setFilterUrgency('ALL');
                        setSearch('');
                      }}
                      className="text-amber-600 hover:text-amber-700 underline font-semibold cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>

                {/* Sort control */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-400">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold"
                  >
                    <option value="DEADLINE_ASC">Deadline: Soonest first</option>
                    <option value="AMOUNT_DESC">Amount: Highest first</option>
                    <option value="VERIFIED_DESC">Recently Verified</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scholarships Grid */}
            {loading ? (
              <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-2" />
                <p className="text-sm font-medium">Loading verified scholarships...</p>
              </div>
            ) : scholarships.length === 0 ? (
              <div className="text-center py-16 liquid-glass rounded-3xl border border-white/10 p-8 space-y-3 backdrop-blur-xl">
                <Award className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-white text-base">No scholarships match your filter criteria</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Try broadening your income limit, branch, or category filter to discover available state and central programs.
                </p>
                <button
                  onClick={() => {
                    setFilterCategory('ALL');
                    setFilterBranch('ALL');
                    setFilterYear('ALL');
                    setFilterIncome('ALL');
                    setFilterSocialCategory('ALL');
                    setFilterUrgency('ALL');
                    setSearch('');
                  }}
                  className="clay-btn-rose px-4 py-2 rounded-xl text-white font-bold text-xs cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {scholarships.map((sch) => (
                  <ScholarshipCard
                    key={sch.id}
                    sch={sch}
                    isSaved={isItemSaved(sch.id)}
                    onToggleSave={(e) => handleToggleSave(sch, e)}
                    onInitiateRedirect={(e) => handleInitiateRedirect(sch, e)}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* ===================== TAB 3: ELIGIBLE FOR ME ===================== */}
        {activeTab === 'ELIGIBLE' && (
          <div className="space-y-8">

            {/* Profile Overview Header Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Deterministic Eligibility Calculator
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Personalized Scholarship Matches
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  Evaluated using transparent, explainable institutional and government criteria. We never guess: every rule is matched directly against your academic and voluntary background data.
                </p>

                {/* Student Profile Badges Preview */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                    📍 {profileData.domicile_state}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                    🏷️ {profileData.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                    💰 ≤ ₹{(profileData.family_annual_income / 100000).toFixed(1)} Lakh/yr
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                    🎖️ {DEFENCE_CATEGORY_LABELS[profileData.defence_category] || profileData.defence_category}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                    📊 12th: {profileData.class_12_percentage}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => setProfileModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  Edit Eligibility Profile
                </button>
                <button
                  onClick={fetchUserMatches}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-600/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Recalculate Matches
                </button>
              </div>
            </div>

            {/* Results Grouped: LIKELY ELIGIBLE / NEEDS INFO / NOT ELIGIBLE */}
            {loading ? (
              <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-2" />
                <p className="text-sm font-medium">Evaluating criteria against official guidelines...</p>
              </div>
            ) : !matchedData ? (
              <div className="text-center py-16 liquid-glass rounded-3xl border border-white/10 p-8 space-y-3 backdrop-blur-xl">
                <Award className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-white text-base">Please log in to calculate matches</h4>
                <p className="text-xs text-slate-300">Sign in with your student account to see personalized eligibility.</p>
                <Link to="/login" className="inline-block px-5 py-2 rounded-xl clay-btn-rose text-white font-bold text-xs">
                  Log In
                </Link>
              </div>
            ) : (
              <div className="space-y-10">

                {/* 1. LIKELY ELIGIBLE */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <h4 className="font-black text-white text-lg">
                        Likely Eligible ({likelyEligibleList.length})
                      </h4>
                    </div>
                    <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                      High Probability of Approval
                    </span>
                  </div>

                  {likelyEligibleList.length === 0 ? (
                    <div className="p-6 rounded-2xl liquid-glass border border-white/10 text-center text-slate-400 text-xs backdrop-blur-xl">
                      No scholarships match all strict criteria right now. Check "Needs Verification" below to see if updating voluntary details qualifies you!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {likelyEligibleList.map((item, idx) => {
                        const sch = item.scholarship || item || {};
                        const schId = sch.id || item.id || idx;
                        return (
                          <EvaluatedScholarshipCard
                            key={schId}
                            item={item}
                            statusType="LIKELY_ELIGIBLE"
                            isSaved={isItemSaved(sch.id || item.id)}
                            onToggleSave={(e) => handleToggleSave(sch, e)}
                            onInitiateRedirect={(e) => handleInitiateRedirect(sch, e)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. NEEDS MORE INFO */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <h4 className="font-black text-white text-lg">
                        Needs More Information ({needsMoreInfoList.length})
                      </h4>
                    </div>
                    <span className="text-xs font-semibold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                      Action Required: Verify Details
                    </span>
                  </div>

                  {needsMoreInfoList.length === 0 ? (
                    <div className="p-6 rounded-2xl liquid-glass border border-white/10 text-center text-slate-400 text-xs backdrop-blur-xl">
                      All criteria are verified!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {needsMoreInfoList.map((item, idx) => {
                        const sch = item.scholarship || item || {};
                        const schId = sch.id || item.id || idx;
                        return (
                          <EvaluatedScholarshipCard
                            key={schId}
                            item={item}
                            statusType="NEEDS_MORE_INFO"
                            isSaved={isItemSaved(sch.id || item.id)}
                            onToggleSave={(e) => handleToggleSave(sch, e)}
                            onInitiateRedirect={(e) => handleInitiateRedirect(sch, e)}
                            onOpenProfile={() => setProfileModalOpen(true)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. NOT ELIGIBLE */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold">
                        <X className="w-4 h-4" />
                      </div>
                      <h4 className="font-black text-white text-lg">
                        Not Eligible ({notEligibleList.length})
                      </h4>
                    </div>
                    <span className="text-xs font-semibold text-rose-300 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30">
                      Transparent Disqualification Reasons
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notEligibleList.slice(0, 6).map((item, idx) => {
                      const sch = item.scholarship || item || {};
                      const schId = sch.id || item.id || idx;
                      return (
                        <EvaluatedScholarshipCard
                          key={schId}
                          item={item}
                          statusType="NOT_ELIGIBLE"
                          isSaved={isItemSaved(sch.id || item.id)}
                          onToggleSave={(e) => handleToggleSave(sch, e)}
                          onInitiateRedirect={(e) => handleInitiateRedirect(sch, e)}
                        />
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ===================== TAB 4: CENTRAL GOVT ===================== */}
        {activeTab === 'CENTRAL' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  National Scholarship Portal (NSP)
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Government of India Central Sector Schemes
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Administered by Ministry of Education, Ministry of Social Justice & Empowerment, Ministry of Tribal Affairs, and AICTE. All applications require One-Time Registration (OTR) and APAAR / ABC ID verification.
                </p>
              </div>

              <a
                href="https://scholarships.gov.in"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 shrink-0"
              >
                Open Official NSP Portal <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Central Schemes List */}
            <div className="space-y-6">
              {scholarships.map((sch) => (
                <ScholarshipCard
                  key={sch.id}
                  sch={sch}
                  isSaved={isItemSaved(sch.id)}
                  onToggleSave={(e) => handleToggleSave(sch, e)}
                  onInitiateRedirect={(e) => handleInitiateRedirect(sch, e)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 5: ALL 28 STATES & 8 UTs EXPLORER ===================== */}
        {activeTab === 'STATES' && (
          <div className="space-y-8">

            {/* Header info */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  All-India Domicile Directory
                </span>
                <span className="text-xs font-mono text-slate-500">
                  28 States • 8 Union Territories
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                All 36 Indian States & Union Territories Explorer
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                AIT Pune admits students from every state in India. Most state governments operate Post-Matric and Merit-cum-Means schemes that permit out-of-state study in AICTE-approved institutions. Select your domicile state below to view verified portal links and eligibility rules.
              </p>
            </div>

            {/* State Search & Grid Selector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: State List (36 States) */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stateSearchQuery}
                    onChange={(e) => setStateSearchQuery(e.target.value)}
                    placeholder="Search 36 states or UTs..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="h-[480px] overflow-y-auto space-y-1 pr-1.5 custom-scrollbar">
                  {filteredStates.map((st) => (
                    <button
                      key={st.code}
                      onClick={() => setSelectedStateCode(st.code)}
                      className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between text-xs cursor-pointer ${
                        selectedStateCode === st.code
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] ${
                          selectedStateCode === st.code
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {st.code}
                        </span>
                        <div>
                          <div className="font-semibold">{st.name}</div>
                          <div className={`text-[10px] truncate max-w-[170px] ${
                            selectedStateCode === st.code ? 'text-emerald-100' : 'text-slate-400'
                          }`}>
                            {st.portal_name || 'NSP State Post-Matric'}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Active State Card & Policies */}
              <div className="lg:col-span-7 space-y-6">
                {activeStateObj && (
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">
                          State Code: {activeStateObj.code}
                        </span>
                        <h4 className="text-2xl font-black text-slate-900 mt-1">
                          {activeStateObj.name}
                        </h4>
                      </div>

                      <a
                        href={activeStateObj.portal_url || 'https://scholarships.gov.in'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center gap-2"
                      >
                        Official State Portal <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Official State Scholarship Portal
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {activeStateObj.portal_name || 'National Scholarship Portal (NSP) State Post-Matric'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono break-all">
                          {activeStateObj.portal_url || 'https://scholarships.gov.in'}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                        <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-amber-700" />
                          AIT Pune Out-of-State Study Compatibility
                        </div>
                        <p className="text-xs text-amber-900 leading-relaxed font-medium">
                          {activeStateObj.out_of_state_notes ||
                            `Students holding genuine domicile of ${activeStateObj.name} studying at Army Institute of Technology, Pune (AICTE-approved) are generally eligible for Post-Matric Scholarship schemes for SC/ST/OBC/EBC categories. AIT Pune provides institute bonafide and fee structure certificates.`}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                        <div className="font-bold text-slate-700 uppercase tracking-wider">
                          Key Domicile Requirements for {activeStateObj.name}
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                          <li>Valid Domicile / Resident Certificate issued by competent revenue authority (Tahsildar / SDO / DM).</li>
                          <li>Caste Validity Certificate (for SC/ST/OBC category applicants where mandated).</li>
                          <li>Current Financial Year Family Income Certificate.</li>
                          <li>AIT Pune Bonafide Certificate issued by Student Section.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setFilterState(activeStateObj.code);
                          setActiveTab('ALL');
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
                      >
                        View filtered scholarships for {activeStateObj.name} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ===================== TAB 6: DEFENCE & POLICE ===================== */}
        {activeTab === 'DEFENCE' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-700/40 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-400/30">
                AIT Pune Lineage • AWES & Veterans Affairs
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Defence, Ex-Servicemen & Police Wards Financial Assistance
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                As an institution founded exclusively for children of Army personnel, AIT students have priority access to Kendriya Sainik Board (KSB PMSS), Army Headquarters (ESSA), and DIAV grants.
              </p>

              {/* Defence Categories Explanation Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="font-bold text-amber-400 mb-1">1. KSB PMSS (Ex-Servicemen)</div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    Wards of Ex-Servicemen (ESM Categories 1-8). Priority 1 to 4 receives preferential approval. Requires PPO and ESM certificate.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="font-bold text-amber-400 mb-1">2. ESSA (Serving / Retired Army)</div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    Army Headquarters Education Scholarship Scheme for children of all serving and pensioner Army personnel based on academic merit.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="font-bold text-amber-400 mb-1">3. WARB & Police Martyr</div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    Separate quota for Central Armed Police Forces (BSF, CRPF, CISF, ITBP, SSB, Assam Rifles) and State Police martyr wards.
                  </div>
                </div>
              </div>
            </div>

            {/* Defence Scholarships List */}
            <div className="space-y-6">
              {scholarships.map((sch) => (
                <ScholarshipCard
                  key={sch.id}
                  sch={sch}
                  isSaved={isItemSaved(sch.id)}
                  onToggleSave={(e) => handleToggleSave(sch, e)}
                  onInitiateRedirect={(e) => handleInitiateRedirect(sch, e)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 7: CORPORATE & CSR ===================== */}
        {activeTab === 'CORPORATE' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  Private & Corporate CSR Grants
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  India's Top Corporate Philanthropic Scholarships
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Generous corporate scholarships including Reliance Foundation Undergraduate Grant (₹2,00,000), HDFC Parivartan ECSS, Amazon Future Engineer, and Deutsche Bank Women in Tech Grant.
                </p>
              </div>

              <div className="text-xs font-medium text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                💡 <span className="font-bold text-slate-800">Pro-Tip:</span> Corporate schemes often evaluate academic aptitude test scores or personal essay statements.
              </div>
            </div>

            <div className="space-y-6">
              {scholarships.map((sch) => (
                <ScholarshipCard
                  key={sch.id}
                  sch={sch}
                  isSaved={isItemSaved(sch.id)}
                  onToggleSave={(e) => handleToggleSave(sch, e)}
                  onInitiateRedirect={(e) => handleInitiateRedirect(sch, e)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 8: AIT EXCLUSIVE ===================== */}
        {activeTab === 'AIT' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  AIT Campus Exclusive
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Student Section: Admin Block, 1st Floor
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                AIT Institutional, Alumni & Partner Endowments
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                Direct institutional financial assistance instituted by AIT alumni, industry partners, and well-wishers specifically for enrolled Army Institute of Technology students: udChalo Merit-cum-Means, Hashmap (NTT DATA) Technology Grant, Ekam Foundation, and AIT Internal Corpus.
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-700" />
                  Submission Procedure for AIT Exclusive Schemes
                </div>
                <p>
                  Physical application forms and income affidavits must be submitted to the AIT Pune Scholarship Section / Registrar Office before the announced institutional deadline each academic semester.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {scholarships.map((sch) => (
                <ScholarshipCard
                  key={sch.id}
                  sch={sch}
                  isSaved={isItemSaved(sch.id)}
                  onToggleSave={(e) => handleToggleSave(sch, e)}
                  onInitiateRedirect={(e) => handleInitiateRedirect(sch, e)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 9: SAVED LIBRARY & STATUS TRACKER ===================== */}
        {activeTab === 'SAVED' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  My Scholarship Workspace
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Saved Scholarships & Application Tracker
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Track your application lifecycle across multiple government and private portals. Keep application registration IDs and notes organized in one place.
                </p>
              </div>

              <div className="text-xs font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                {savedList.length} Scholarships in Tracker
              </div>
            </div>

            {!user ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-base">Please log in to track your applications</h4>
                <p className="text-xs text-slate-500">Sign in with your student account to save scholarships and update your application stage.</p>
                <Link to="/login" className="inline-block px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs">
                  Log In
                </Link>
              </div>
            ) : savedList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-base">No saved scholarships yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click the bookmark icon on any scholarship in the master catalog or eligible list to save it to your tracking library.
                </p>
                <button
                  onClick={() => setActiveTab('ALL')}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedList.map((item) => {
                  const sch = item.scholarship || {};
                  return (
                    <div
                      key={item.scholarship_id}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                            {sch.provider || 'Scholarship'}
                          </span>
                          <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            {sch.amount_display || sch.amount || 'Financial Grant'}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            Deadline: <strong className="text-slate-800">{sch.application_close_at || sch.deadline || 'Ongoing'}</strong>
                          </span>
                        </div>

                        <h4 className="text-lg font-black text-slate-900">
                          {sch.name || sch.title}
                        </h4>

                        <p className="text-xs text-slate-600 max-w-2xl line-clamp-2">
                          {sch.benefits_summary || sch.description}
                        </p>

                        {/* Saved Notes display / inline editor */}
                        {item.notes && (
                          <div className="text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-slate-700">
                            <span className="font-bold text-slate-500">Notes / App ID: </span>
                            {item.notes}
                          </div>
                        )}
                      </div>

                      {/* Tracker Controls */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 w-full sm:w-auto">
                        <div className="w-full sm:w-auto">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Application Stage:
                          </label>
                          <select
                            value={item.status || 'INTERESTED'}
                            onChange={(e) => handleUpdateSavedStatus(item.scholarship_id, e.target.value)}
                            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                          >
                            <option value="INTERESTED">⭐ Interested / Shortlisted</option>
                            <option value="PREPARING_DOCS">📝 Preparing Documents</option>
                            <option value="APPLIED_EXTERNALLY">🚀 Applied on Official Portal</option>
                            <option value="AWAITING_RESULTS">⏳ Awaiting Results</option>
                            <option value="AWARDED">🎉 Awarded Scholarship</option>
                            <option value="REJECTED">❌ Application Rejected</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-4 sm:pt-0">
                          <Link
                            to={`/scholarships/${sch.slug || sch.id}`}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={(e) => handleInitiateRedirect(sch, e)}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            Official Apply <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleToggleSave(sch, e)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs cursor-pointer"
                            title="Remove from saved"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 10: DEADLINES CALENDAR ===================== */}
        {activeTab === 'CALENDAR' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  Urgency Matrix & Deadlines
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Scholarship Application Timeline (2026-27 Cycle)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Plan ahead to avoid missing institutional verification cutoff dates. Most schemes require AIT Student Section signature 5-7 days before final portal submission.
                </p>
              </div>

              <div className="text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                Reference Date: <strong className="text-slate-900">24 October 2026</strong>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-2" />
                <p className="text-sm font-medium">Loading deadlines...</p>
              </div>
            ) : !calendarData ? (
              <div className="text-center py-16 text-slate-500 text-sm">Failed to load calendar data.</div>
            ) : (
              <div className="space-y-10">

                {/* 1. THIS WEEK (Within 7 Days) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-rose-200">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                    <h4 className="font-black text-slate-900 text-lg">
                      🚨 Closing This Week (Immediate Action Required) — {thisWeekList.length} Schemes
                    </h4>
                  </div>

                  {thisWeekList.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs">
                      No scholarships closing within the next 7 days.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {thisWeekList.map((sch) => (
                        <ScholarshipCard
                          key={sch.id}
                          sch={sch}
                          isSaved={isItemSaved(sch.id)}
                          onToggleSave={(e) => handleToggleSave(sch, e)}
                          onInitiateRedirect={(e) => handleInitiateRedirect(sch, e)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. THIS MONTH (Within 30 Days) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <h4 className="font-black text-slate-900 text-lg">
                      ⏳ Closing This Month — {thisMonthList.length} Schemes
                    </h4>
                  </div>

                  {thisMonthList.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs">
                      No additional scholarships closing within 30 days.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {thisMonthList.map((sch) => (
                        <ScholarshipCard
                          key={sch.id}
                          sch={sch}
                          isSaved={isItemSaved(sch.id)}
                          onToggleSave={(e) => handleToggleSave(sch, e)}
                          onInitiateRedirect={(e) => handleInitiateRedirect(sch, e)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. UPCOMING DEADLINES */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <h4 className="font-black text-slate-900 text-lg">
                      📅 Upcoming Deadlines (Late 2026 & 2027) — {upcomingList.length} Schemes
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingList.map((sch) => (
                      <ScholarshipCard
                        key={sch.id}
                        sch={sch}
                        isSaved={isItemSaved(sch.id)}
                        onToggleSave={(e) => handleToggleSave(sch, e)}
                        onInitiateRedirect={(e) => handleInitiateRedirect(sch, e)}
                      />
                    ))}
                  </div>
                </div>

                {/* 4. CLOSED SCHEMES (REFERENCE) */}
                {closedList.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <h4 className="font-bold text-slate-600 text-base">
                        🔒 Closed Applications ({closedList.length}) — Archived for Reference
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-75">
                      {closedList.map((sch) => (
                        <div key={sch.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400">{sch.provider}</span>
                          <h5 className="font-bold text-slate-700 text-xs">{sch.name || sch.title}</h5>
                          <div className="text-[11px] text-rose-500 font-semibold">Closed on {sch.application_close_at || sch.deadline}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </main>

      {/* ===================== EDIT ELIGIBILITY PROFILE MODAL ===================== */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Voluntary Eligibility Profile
                  </h3>
                  <p className="text-xs text-slate-500">
                    Zero sensitive data. Used solely for deterministic scholarship matching.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Domicile State */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Permanent Domicile State *
                  </label>
                  <select
                    value={profileData.domicile_state}
                    onChange={(e) => setProfileData(p => ({ ...p, domicile_state: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                    required
                  >
                    {statesData.map(st => (
                      <option key={st.code} value={st.name}>{st.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-0.5">Where your permanent domicile certificate was issued.</p>
                </div>

                {/* Social Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Social Category *
                  </label>
                  <select
                    value={profileData.category}
                    onChange={(e) => setProfileData(p => ({ ...p, category: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                    required
                  >
                    <option value="GEN">General / Open</option>
                    <option value="OBC">OBC (Other Backward Classes)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="EWS">EWS (Economically Weaker Section)</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => setProfileData(p => ({ ...p, gender: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                    required
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other / Prefer not to say</option>
                  </select>
                </div>

                {/* Annual Family Income */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Annual Family Income (₹) *
                  </label>
                  <input
                    type="number"
                    value={profileData.family_annual_income}
                    onChange={(e) => setProfileData(p => ({ ...p, family_annual_income: Number(e.target.value) }))}
                    placeholder="e.g. 400000"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">As stated on current official Income Certificate.</p>
                </div>

                {/* Defence Background Category */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Defence / Police Service Category *
                  </label>
                  <select
                    value={profileData.defence_category}
                    onChange={(e) => setProfileData(p => ({ ...p, defence_category: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                    required
                  >
                    <option value="NONE">None / Civilian</option>
                    <option value="ESM_PRIORITY_1_TO_8">Ex-Servicemen (ESM) Ward (Priority 1-8)</option>
                    <option value="SERVING_ARMY">Serving Army Personnel Ward</option>
                    <option value="BATTLE_CASUALTY">Battle Casualty / Disabled in Action Ward</option>
                    <option value="CAPF_AR">CAPF / Assam Rifles Ward (WARB)</option>
                    <option value="STATE_POLICE_MARTYR">State Police Martyr Ward (Terror/Naxal)</option>
                  </select>
                </div>

                {/* Academic Scores */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Class 12th Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={profileData.class_12_percentage || ''}
                    onChange={(e) => setProfileData(p => ({ ...p, class_12_percentage: Number(e.target.value) }))}
                    placeholder="e.g. 84.5"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Current Engineering CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={profileData.current_cgpa || ''}
                    onChange={(e) => setProfileData(p => ({ ...p, current_cgpa: Number(e.target.value) }))}
                    placeholder="e.g. 8.6"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Checkbox Options */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="block font-bold text-slate-700 mb-1">Special Criteria:</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.is_hosteller}
                      onChange={(e) => setProfileData(p => ({ ...p, is_hosteller: e.target.checked }))}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">Hostel Resident (AIT Campus)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.is_single_girl_child}
                      onChange={(e) => setProfileData(p => ({ ...p, is_single_girl_child: e.target.checked }))}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">Single Girl Child in Family</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.is_pwd}
                      onChange={(e) => setProfileData(p => ({ ...p, is_pwd: e.target.checked }))}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">Person with Disability (PwD ≥40%)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.is_orphan}
                      onChange={(e) => setProfileData(p => ({ ...p, is_orphan: e.target.checked }))}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">Orphan / Armed Forces Martyr Ward</span>
                  </label>
                </div>
              </div>

              {/* Submit & Cancel */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save & Recalculate Matches
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== SAFE OUTBOUND APPLICATION MODAL ===================== */}
      {redirectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full">
                  Official Application Redirection
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  You are proceeding to an Official Scholarship Portal
                </h3>
              </div>
              <button
                onClick={() => setRedirectModalItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="font-bold text-slate-800">
                {redirectModalItem.name || redirectModalItem.title}
              </div>
              <div className="text-slate-500 font-mono text-[11px] break-all">
                {redirectModalItem.official_application_url || redirectModalItem.apply_url || 'https://scholarships.gov.in'}
              </div>
            </div>

            {/* Safety checklist */}
            <div className="space-y-2 text-xs text-slate-600 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Anti-Fraud & Security Notice:
              </div>
              <ul className="space-y-1.5 text-[11px] text-amber-950">
                <li>• All government and genuine scholarships in India are <strong>100% free</strong>. Never pay any fee.</li>
                <li>• Never share your banking OTP, debit card CVV, or portal login passwords.</li>
                <li>• Have your Bonafide Certificate and Fee Receipt issued by AIT Student Section ready.</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setRedirectModalItem(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedRedirect}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition flex items-center gap-2 cursor-pointer"
              >
                Continue to Official Portal <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ===================== HELPER SUBCOMPONENT: STANDARD SCHOLARSHIP CARD =====================
function ScholarshipCard({ sch, isSaved, onToggleSave, onInitiateRedirect }) {
  // Days Remaining calculation
  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const ref = new Date('2026-10-24T00:00:00Z');
    const d = new Date(deadline + 'T00:00:00Z');
    return Math.ceil((d - ref) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysRemaining(sch.application_close_at || sch.deadline);
  const bannerUrl = sch.banner_url || sch.logo_url || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col lg:flex-row group">
      {/* Banner Thumbnail (Exact match to Hackathons Image 2 Reference) */}
      <div className="lg:w-80 h-52 lg:h-auto bg-slate-900 relative shrink-0 overflow-hidden">
        <img
          src={bannerUrl}
          alt={sch.name || sch.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
            {sch.category?.replace(/_/g, ' ') || 'Scholarship'}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-md">
            ✓ AIT Eligible
          </span>
        </div>

        {(sch.amount_display || sch.amount) && (
          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
            {sch.amount_display || sch.amount}
          </div>
        )}
      </div>

      {/* Details Body (Exact match to Hackathons Image 2 Reference) */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Top Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>{sch.provider || sch.organization || 'Government / Armed Forces Authority'}</span>
            <span>MODE: {sch.application_mode || 'ONLINE PORTAL'}</span>
          </div>

          {/* Title */}
          <Link
            to={`/scholarships/${sch.slug || sch.id}`}
            className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors block"
          >
            {sch.name || sch.title}
          </Link>

          {/* Overview Description */}
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {sch.overview || sch.description}
          </p>

          {/* Eligibility Note */}
          {sch.who_can_apply && (
            <p className="text-xs text-slate-600 italic">
              Verified Eligible: {sch.who_can_apply}
            </p>
          )}

          {/* Scheme Tags */}
          <div className="flex flex-wrap gap-1 pt-1">
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
              {sch.category?.replace(/_/g, ' ') || 'Scheme'}
            </span>
            {sch.academic_year && (
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                Cycle: {sch.academic_year}
              </span>
            )}
            {sch.max_income && (
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                Income ≤ ₹{(sch.max_income / 100000).toFixed(1)}L/yr
              </span>
            )}
          </div>
        </div>

        {/* Bottom Actions Row */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Deadline: <strong className="text-rose-600">{sch.application_close_at || sch.deadline || 'Active'}</strong></span>
            {daysLeft !== null && (
              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                ⏳ {daysLeft > 0 ? `${daysLeft} days left` : 'Closing soon'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSave}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isSaved ? 'bg-amber-50 text-amber-600 border-amber-300' : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700'
              }`}
              title={isSaved ? 'Saved to library' : 'Save scholarship'}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 fill-amber-600" /> : <Bookmark className="w-4 h-4" />}
            </button>

            <Link
              to={`/scholarships/${sch.slug || sch.id}`}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Full Details
            </Link>

            <button
              onClick={onInitiateRedirect}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              Apply on Portal <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== HELPER SUBCOMPONENT: EVALUATED SCHOLARSHIP CARD =====================
function EvaluatedScholarshipCard({ item, statusType, isSaved, onToggleSave, onInitiateRedirect, onOpenProfile }) {
  const sch = item.scholarship || item || {};
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-3xl p-6 border shadow-xs flex flex-col justify-between transition-all ${
      statusType === 'LIKELY_ELIGIBLE'
        ? 'border-emerald-300 ring-1 ring-emerald-400/20'
        : statusType === 'NEEDS_MORE_INFO'
        ? 'border-amber-300 ring-1 ring-amber-400/20'
        : 'border-slate-200 opacity-90'
    }`}>
      <div className="space-y-3">
        {/* Top Evaluation Pill */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
            statusType === 'LIKELY_ELIGIBLE'
              ? 'bg-emerald-100 text-emerald-800'
              : statusType === 'NEEDS_MORE_INFO'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }`}>
            {statusType === 'LIKELY_ELIGIBLE' && '✓ Likely Eligible'}
            {statusType === 'NEEDS_MORE_INFO' && '⚠ Needs Verification'}
            {statusType === 'NOT_ELIGIBLE' && '✕ Not Eligible'}
          </span>

          <button
            onClick={onToggleSave}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isSaved ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400 hover:text-slate-700'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4 fill-amber-700" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Title */}
        <div>
          <Link
            to={`/scholarships/${sch.slug || sch.id}`}
            className="block font-black text-base text-slate-900 hover:text-amber-600 transition leading-snug line-clamp-2"
          >
            {sch.name || sch.title}
          </Link>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">
            {sch.provider} • <strong className="text-emerald-700">{sch.amount_display || sch.amount}</strong>
          </div>
        </div>

        {/* Criteria Breakdown Accordion */}
        <div className="pt-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-between w-full p-2 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer"
          >
            <span>Criteria Breakdown</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {expanded && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mt-2 space-y-2 text-[11px]">
              {/* Met requirements */}
              {item.requirements_met?.length > 0 && (
                <div className="space-y-1">
                  <div className="font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Requirements Met:
                  </div>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                    {item.requirements_met.map((req, idx) => (
                      <li key={idx}>
                        {typeof req === 'object' && req !== null ? (
                          <span>
                            {req.title ? <strong className="text-slate-700">{req.title}: </strong> : null}
                            {req.description || JSON.stringify(req)}
                          </span>
                        ) : (
                          <span>{String(req)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Needs verification */}
              {item.needs_verification?.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="font-bold text-amber-700 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> Needs Verification:
                  </div>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                    {item.needs_verification.map((req, idx) => (
                      <li key={idx}>
                        {typeof req === 'object' && req !== null ? (
                          <span>
                            {req.title ? <strong className="text-amber-800">{req.title}: </strong> : null}
                            {req.description || JSON.stringify(req)}
                          </span>
                        ) : (
                          <span>{String(req)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {onOpenProfile && (
                    <button
                      onClick={onOpenProfile}
                      className="text-[10px] font-bold text-amber-700 underline mt-1 block cursor-pointer"
                    >
                      Update your profile to verify →
                    </button>
                  )}
                </div>
              )}

              {/* Not satisfied */}
              {item.not_satisfied?.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="font-bold text-rose-700 flex items-center gap-1">
                    <X className="w-3 h-3" /> Disqualified Reason:
                  </div>
                  <ul className="list-disc list-inside text-rose-800 space-y-0.5">
                    {item.not_satisfied.map((req, idx) => (
                      <li key={idx}>
                        {typeof req === 'object' && req !== null ? (
                          <span>
                            {req.title ? <strong className="text-rose-900">{req.title}: </strong> : null}
                            {req.description || JSON.stringify(req)}
                          </span>
                        ) : (
                          <span>{String(req)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Footers */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
        <Link
          to={`/scholarships/${sch.slug || sch.id}`}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition"
        >
          View Details
        </Link>
        {statusType !== 'NOT_ELIGIBLE' && (
          <button
            onClick={onInitiateRedirect}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            Apply <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
