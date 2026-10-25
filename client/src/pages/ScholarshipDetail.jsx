import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Award, ShieldCheck, Calendar, ExternalLink, Bookmark, CheckCircle2,
  AlertCircle, HelpCircle, XCircle, ArrowLeft, Clock, FileText, Check,
  Building2, Users, IndianRupee, MapPin, GraduationCap, Sparkles, Loader2, Share2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ScholarshipDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [scholarship, setScholarship] = useState(null);
  const [rules, setRules] = useState([]);
  const [sources, setSources] = useState([]);
  const [userEvaluation, setUserEvaluation] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [slug, user]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await api.get(`/scholarships/slug/${slug}`);
      setScholarship(res.scholarship);
      setRules(res.rules || []);
      setSources(res.sources || []);
      setUserEvaluation(res.user_evaluation || null);
      setIsSaved(Boolean(res.is_saved));
      setSavedRecord(res.saved_record || null);
    } catch (err) {
      console.error('Failed to load scholarship details:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSavingBookmark(true);
    try {
      if (isSaved) {
        await api.delete(`/scholarships/${scholarship.id}/save`);
        setIsSaved(false);
        setSavedRecord(null);
      } else {
        await api.post(`/scholarships/${scholarship.id}/save`, {});
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSavingBookmark(false);
    }
  };

  const handleApplyRedirect = async () => {
    try {
      const res = await api.get(`/scholarships/${scholarship.id}/redirect`);
      if (res?.target_url) {
        window.open(res.target_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      // Fallback directly to URL in record
      const dest = scholarship.official_application_url || scholarship.apply_url;
      if (dest) window.open(dest, '_blank', 'noopener,noreferrer');
    }
    setRedirectModalOpen(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-semibold">Loading verified scholarship specifications...</p>
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-black text-slate-900">Scholarship Record Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested scholarship could not be located in the verified database.
        </p>
        <Link
          to="/scholarships"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Scholarships Portal
        </Link>
      </div>
    );
  }

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'CENTRAL':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'DEFENCE':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'POLICE_CAPF':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'STATE':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'PRIVATE_CORPORATE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'AIT_EXCLUSIVE':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'CENTRAL': return 'Central Government (NSP)';
      case 'DEFENCE': return 'Defence & Armed Forces';
      case 'POLICE_CAPF': return 'Police & CAPF';
      case 'STATE': return 'State Government';
      case 'PRIVATE_CORPORATE': return 'Private / Corporate CSR';
      case 'AIT_EXCLUSIVE': return 'AIT Pune Exclusive';
      default: return cat;
    }
  };

  const isClosed = scholarship.status === 'CLOSED';
  const isClosingSoon = scholarship.status === 'CLOSING_SOON';

  return (
    <div className="min-h-screen bg-transparent pb-20 relative z-10 animate-fade-in">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="liquid-glass border-b border-white/10 sticky top-16 z-30 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link
            to="/scholarships"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Scholarships
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl border border-white/15 liquid-glass hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Copy share link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-blue-400" />}
              <span>{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handleToggleSave}
              disabled={savingBookmark}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                isSaved
                  ? 'clay-btn-rose text-white shadow-md'
                  : 'liquid-glass hover:bg-white/10 text-slate-200 border-white/15'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-amber-300' : ''}`} />
              <span>{isSaved ? 'Saved in Library' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Main Hero Card */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryBadge(scholarship.category)}`}>
              {getCategoryLabel(scholarship.category)}
            </span>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> AY {scholarship.academic_year || '2026-27'}
            </span>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Scheme
            </span>

            {isClosed ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Application Closed
              </span>
            ) : isClosingSoon ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold clay-btn-rose text-white shadow-md animate-pulse">
                Closing Soon (31 Oct 2026)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold clay-btn-blue text-white shadow-md">
                Accepting Applications
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {scholarship.title || scholarship.name}
            </h1>
            <p className="text-sm sm:text-base font-semibold text-slate-300 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Issuing Authority: <strong className="text-rose-300">{scholarship.provider}</strong></span>
            </p>
          </div>

          {/* Key Metric Highlights Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100/90">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" /> Financial Benefit
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-950 mt-1">
                {scholarship.amount_display}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                Direct to student / institute account
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100/90">
              <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> Eligible Course
              </div>
              <div className="text-base sm:text-lg font-black text-blue-950 mt-1">
                B.Tech / B.E. (All Branches)
              </div>
              <div className="text-[10px] text-blue-700 font-medium mt-0.5">
                Undergraduate Engineering
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100/90">
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Application Deadline
              </div>
              <div className="text-base sm:text-lg font-black text-amber-950 mt-1">
                {scholarship.application_close_at ? new Date(scholarship.application_close_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'As Notified'}
              </div>
              <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                {scholarship.institute_verification_deadline ? `Verification: ${new Date(scholarship.institute_verification_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Verify on official portal'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100/90">
              <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Jurisdiction
              </div>
              <div className="text-base sm:text-lg font-black text-purple-950 mt-1">
                {scholarship.applicable_states === 'ALL_INDIA' ? 'All-India Merit' : `State: ${scholarship.applicable_states}`}
              </div>
              <div className="text-[10px] text-purple-700 font-medium mt-0.5">
                {scholarship.outside_state_study_allowed ? 'AIT Pune study permitted' : 'State institution only'}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Source validated on <span className="font-semibold text-slate-700">{scholarship.last_verified_at ? new Date(scholarship.last_verified_at).toLocaleDateString('en-IN') : '24 Oct 2026'}</span> against official circulars.
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setRedirectModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isClosed ? 'Open Official Portal' : 'Apply on Official Website'}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Smart Eligibility Assessment Card (Personalized for authenticated student) */}
        {userEvaluation ? (
          <div className={`rounded-3xl p-6 sm:p-7 border shadow-xs space-y-4 ${
            userEvaluation.result === 'LIKELY_ELIGIBLE'
              ? 'bg-emerald-50/60 border-emerald-200'
              : userEvaluation.result === 'NEEDS_MORE_INFO'
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-slate-100/70 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {userEvaluation.result === 'LIKELY_ELIGIBLE' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : userEvaluation.result === 'NEEDS_MORE_INFO' ? (
                  <HelpCircle className="w-6 h-6 text-amber-600 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
                )}
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Your Personalized Eligibility: {
                      userEvaluation.result === 'LIKELY_ELIGIBLE'
                        ? 'Likely Eligible'
                        : userEvaluation.result === 'NEEDS_MORE_INFO'
                        ? 'Needs More Information / Verification'
                        : 'Currently Not Eligible'
                    }
                  </h3>
                  <p className="text-xs text-slate-600">
                    Evaluated for <strong>{user?.full_name}</strong> ({user?.branch || 'Branch Not Set'} • Year {user?.year || 1})
                  </p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto ${
                userEvaluation.result === 'LIKELY_ELIGIBLE'
                  ? 'bg-emerald-600 text-white'
                  : userEvaluation.result === 'NEEDS_MORE_INFO'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-300 text-slate-800'
              }`}>
                {userEvaluation.result.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Criteria Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              {/* Met */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                <span className="font-bold text-emerald-700 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Requirements Met ({userEvaluation.requirements_met?.length || 0})
                </span>
                <ul className="space-y-1.5 text-slate-600">
                  {userEvaluation.requirements_met?.map((m, idx) => (
                    <li key={idx} className="leading-snug">
                      {typeof m === 'object' && m !== null ? (
                        <span>• <strong>{m.title || 'Requirement'}:</strong> {m.description || JSON.stringify(m)}</span>
                      ) : (
                        <span>• {String(m)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Needs Info */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                <span className="font-bold text-amber-700 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5" /> Needs Verification ({userEvaluation.needs_verification?.length || 0})
                </span>
                {userEvaluation.needs_verification?.length > 0 ? (
                  <ul className="space-y-1.5 text-slate-600">
                    {userEvaluation.needs_verification.map((v, idx) => (
                      <li key={idx} className="leading-snug">
                        {typeof v === 'object' && v !== null ? (
                          <span>• <strong>{v.title || 'Verification'}:</strong> {v.description || JSON.stringify(v)}</span>
                        ) : (
                          <span>• {String(v)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">All optional attributes verified.</p>
                )}
              </div>

              {/* Not Satisfied */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                <span className="font-bold text-rose-700 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <XCircle className="w-3.5 h-3.5" /> Ineligible Conditions ({userEvaluation.not_satisfied?.length || 0})
                </span>
                {userEvaluation.not_satisfied?.length > 0 ? (
                  <ul className="space-y-1.5 text-slate-600">
                    {userEvaluation.not_satisfied.map((f, idx) => (
                      <li key={idx} className="leading-snug text-rose-700">
                        {typeof f === 'object' && f !== null ? (
                          <span>• <strong>{f.title || 'Condition'}:</strong> {f.description || JSON.stringify(f)}</span>
                        ) : (
                          <span>• {String(f)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">Zero failed conditions.</p>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1">
              Note: {userEvaluation.disclaimer}
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-4 text-xs text-blue-900">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Sign in with your student account to see your automated personalized eligibility assessment.</span>
            </div>
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold whitespace-nowrap transition"
            >
              Sign In to Check
            </Link>
          </div>
        )}

        {/* Detailed Information Tabs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main 2-Column Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section A: Overview & Description */}
            <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-3 backdrop-blur-2xl">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Scheme Overview & Purpose
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {scholarship.description}
              </p>
            </div>

            {/* Section B: Who Can Apply? */}
            <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-3 backdrop-blur-2xl">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Who Can Apply? (Eligibility Criteria)
              </h2>
              <p className="text-sm text-slate-200 leading-relaxed liquid-glass bg-[#030712]/50 p-4 rounded-2xl border border-white/10">
                {scholarship.who_can_apply || scholarship.eligibility}
              </p>
            </div>

            {/* Section C: Who Cannot Apply? */}
            {scholarship.who_cannot_apply && (
              <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-3 backdrop-blur-2xl">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  Who Cannot Apply? (Specific Exclusions)
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed liquid-glass-rose p-4 rounded-2xl border border-rose-500/30">
                  {scholarship.who_cannot_apply}
                </p>
              </div>
            )}

            {/* Section D: Financial Benefits */}
            <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-3 backdrop-blur-2xl">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-400" />
                Financial Benefits & Coverage Details
              </h2>
              <p className="text-sm text-emerald-300 leading-relaxed liquid-glass p-4 rounded-2xl border border-emerald-500/30 font-medium">
                {scholarship.benefits_summary || scholarship.amount_display}
              </p>
            </div>

            {/* Section E: Required Documents Checklist */}
            <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-3 backdrop-blur-2xl">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Mandatory Documentation Checklist
              </h2>
              <div className="p-4 rounded-2xl liquid-glass bg-[#030712]/50 border border-white/10 text-xs text-slate-300 leading-relaxed space-y-2">
                <p className="font-semibold text-white">
                  Please keep genuine scanned copies ready before accessing the official portal:
                </p>
                <div className="pl-4 space-y-1 text-slate-300">
                  {scholarship.required_documents?.split(',').map((doc, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{doc.trim()}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 pt-1 italic">
                  Note: Do not upload original bank passwords, PINs, or Aadhaar OTPs anywhere online.
                </p>
              </div>
            </div>

            {/* Section G: Application Procedure */}
            <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-3 backdrop-blur-2xl">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-purple-400" />
                Official Application Procedure
              </h2>
              <div className="text-xs text-slate-300 leading-relaxed liquid-glass bg-[#030712]/50 p-5 rounded-2xl border border-white/10 space-y-2">
                {scholarship.application_procedure}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Timeline, References & Application Links */}
          <div className="space-y-6">
            {/* Important Dates Card */}
            <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
              <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Important Dates (AY 2026-27)
              </h3>

              <div className="space-y-3 text-xs divide-y divide-white/10">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Applications Open:</span>
                  <span className="font-bold text-white">{scholarship.application_open_at ? new Date(scholarship.application_open_at).toLocaleDateString('en-IN') : 'Active'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Student Submission Deadline:</span>
                  <span className="font-extrabold text-amber-400">{scholarship.application_close_at ? new Date(scholarship.application_close_at).toLocaleDateString('en-IN') : 'As Notified'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Institute Verification:</span>
                  <span className="font-bold text-white">{scholarship.institute_verification_deadline ? new Date(scholarship.institute_verification_deadline).toLocaleDateString('en-IN') : '15 Days Post Close'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Application Cycle:</span>
                  <span className="font-bold text-white">{scholarship.application_type?.replace(/_/g, ' ') || 'Fresh & Renewal'}</span>
                </div>
              </div>
            </div>

            {/* Official References & Sources */}
            <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Official Sources & References
              </h3>

              <div className="space-y-2 text-xs">
                {scholarship.official_application_url && (
                  <a
                    href={scholarship.official_application_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl liquid-glass hover:bg-white/10 text-cyan-300 font-semibold flex items-center justify-between transition border border-white/10"
                  >
                    <span className="truncate">Official Application Portal</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                )}

                {scholarship.official_scheme_url && (
                  <a
                    href={scholarship.official_scheme_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl liquid-glass hover:bg-white/10 text-slate-200 font-semibold flex items-center justify-between transition border border-white/10"
                  >
                    <span className="truncate">Scheme Notification Page</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                )}

                {scholarship.official_guideline_url && (
                  <a
                    href={scholarship.official_guideline_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl liquid-glass hover:bg-white/10 text-slate-200 font-semibold flex items-center justify-between transition border border-white/10"
                  >
                    <span className="truncate">Official PDF Guidelines</span>
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                  </a>
                )}
              </div>

              {sources.length > 0 && (
                <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 space-y-1">
                  <p className="font-bold text-slate-200">Source Citations:</p>
                  {sources.map((src, i) => (
                    <div key={i} className="leading-snug">
                      • {src.source_name}: {src.evidence_excerpt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Apply CTA Box */}
            <div className="liquid-glass rounded-3xl p-6 text-white space-y-4 shadow-2xl border border-rose-500/30 backdrop-blur-2xl">
              <h3 className="font-black text-lg">Direct Official Application</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clicking below will direct you directly to the verified official scholarship portal. Keep your documents and academic records ready.
              </p>
              <button
                onClick={() => setRedirectModalOpen(true)}
                className="w-full py-3.5 rounded-2xl clay-btn-rose text-white font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isClosed ? 'Open Official Portal' : 'Apply on Official Website'}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Outbound Redirection Modal */}
      {redirectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl max-w-md w-full p-6 border border-white/20 shadow-2xl space-y-5 animate-scale-up backdrop-blur-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
              <ExternalLink className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">
                Directing to Official Scholarship Portal
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You are about to open the genuine government or corporate scholarship application portal:
              </p>
              <p className="text-xs font-mono text-cyan-300 liquid-glass p-2.5 rounded-xl break-all border border-white/10">
                {scholarship.official_application_url || scholarship.apply_url}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl liquid-glass border border-white/10 text-[11px] text-slate-300 space-y-1">
              <p className="font-bold text-white">Safety Notice:</p>
              <p>• AIT Pune does not ask for your official government passwords or banking OTPs.</p>
              <p>• The external portal will open in a new tab so you can return here anytime.</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRedirectModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl liquid-glass border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyRedirect}
                className="flex-1 py-2.5 rounded-xl clay-btn-rose text-white font-black text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Official Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
