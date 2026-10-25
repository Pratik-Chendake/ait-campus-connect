import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Trophy, Award, Calendar, CheckCircle, Clock, ShieldCheck,
  AlertCircle, Sparkles, ExternalLink, ArrowLeft, Download,
  Users, Bookmark, X, Shield, RefreshCw, GitBranch, FileText
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ParticipationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/my-achievements/${id}`);
        setData(res);
      } catch (err) {
        console.error('Error fetching participation record:', err);
        setError(err.message || 'Failed to load participation record. Access may be restricted.');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  const handlePortfolioToggle = async () => {
    if (!data?.record) return;
    try {
      const nextStatus = !data.record.is_in_portfolio;
      await api.post(`/my-achievements/${id}/portfolio`, {
        is_in_portfolio: nextStatus,
        portfolio_visibility: 'PUBLIC'
      });
      setStatusMessage(
        nextStatus
          ? 'Achievement added to your public student portfolio showcase!'
          : 'Achievement removed from public portfolio. Permanent record in My Achievements remains saved.'
      );
      setTimeout(() => setStatusMessage(null), 4000);
      // Reload
      const res = await api.get(`/my-achievements/${id}`);
      setData(res);
    } catch (err) {
      alert(err.message || 'Failed to toggle portfolio');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center liquid-glass rounded-3xl m-8 border border-white/10">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-300">Loading participation journey...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center liquid-glass rounded-3xl m-8 border border-red-500/30 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Denied or Record Not Found</h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          {error || 'This participation record does not exist or belongs to another student. Student participation records are strictly private and isolated.'}
        </p>
        <Link
          to="/my-achievements"
          className="inline-flex items-center gap-2 clay-btn-blue px-5 py-2 text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Return to My Achievements
        </Link>
      </div>
    );
  }

  const { record, event, student, team, milestones = [], results = [], certificates = [], audits = [] } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-fade-in relative z-10">
      {/* Toast Alert */}
      {statusMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl liquid-glass border border-emerald-500/40 bg-slate-950/90 text-white shadow-2xl flex items-center gap-3 backdrop-blur-2xl animate-fade-in max-w-md">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="ml-auto text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/my-achievements"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition px-3 py-1.5 rounded-xl bg-white/5 border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Achievements
        </Link>

        <button
          onClick={handlePortfolioToggle}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            record.is_in_portfolio === 1
              ? 'clay-btn-rose text-white'
              : 'clay-btn-blue text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          {record.is_in_portfolio === 1 ? 'In Public Portfolio (Click to Remove)' : 'Add to Public Portfolio'}
        </button>
      </div>

      {/* Main Card Header */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] font-black px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
            {record.category || record.event_type}
          </span>
          <span className="text-xs font-mono text-cyan-300 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
            Reg ID: {record.registration_id}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white">{record.title}</h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Organized by <b className="text-white">{record.organizer}</b>
        </p>

        <div className="flex flex-wrap gap-2 pt-2 text-xs">
          <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {record.event_date ? new Date(record.event_date).toLocaleDateString() : 'Active'}
          </span>
          <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300">
            Mode: {record.mode || 'In-Person'}
          </span>
          <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified AIT Record
          </span>
        </div>
      </div>

      {/* Section A & B: Event & Student Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section A: Event Details */}
        <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-3 backdrop-blur-xl">
          <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Section A: Event Details
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Location / Venue</span>
              <span className="font-semibold text-white">{record.location || event?.venue || 'AIT Campus Pune'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Event Dates</span>
              <span className="font-semibold text-white">
                {record.event_date} {record.event_end_date ? `to ${record.event_end_date}` : ''}
              </span>
            </div>
            {event?.description && (
              <div>
                <span className="text-slate-400 block text-[10px]">Event Description</span>
                <p className="text-slate-300 leading-relaxed text-[11px] pt-0.5">{event.description}</p>
              </div>
            )}
            {event?.problem_statement && (
              <div>
                <span className="text-slate-400 block text-[10px]">Problem Statement</span>
                <p className="text-slate-300 leading-relaxed text-[11px] pt-0.5">{event.problem_statement}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section B: Student Participation Info */}
        <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-3 backdrop-blur-xl">
          <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Section B: Student Participation
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Student Name:</span>
              <span className="font-bold text-white">{student?.full_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Student ID / PRN:</span>
              <span className="font-mono text-cyan-300">{student?.student_id || 'AIT-UG'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Branch & Year:</span>
              <span className="font-semibold text-white">{student?.branch} • Year {student?.year}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Registration Timestamp:</span>
              <span className="text-slate-300">{new Date(record.registered_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Current Status:</span>
              <span className="font-bold text-amber-300">{record.participation_status}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Registration Source:</span>
              <span className="text-slate-300">{record.source_type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section C: Team & Project Info */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-3 backdrop-blur-xl">
        <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4" /> Section C: Team & Project Submissions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Participation Mode</span>
            <span className="font-bold text-white">{team ? `Team (${team.name})` : 'Individual Participation'}</span>
            {team?.members && (
              <div className="mt-2 space-y-1">
                <span className="text-slate-400 block text-[10px]">Team Members:</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {team.members.map((m) => (
                    <span key={m.id} className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-[11px]">
                      {m.full_name} ({m.role_in_team})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-slate-400 block text-[10px]">Project Title</span>
              <span className="font-semibold text-white">{record.project_title || 'N/A (Individual or Campus Activity)'}</span>
            </div>
            {record.project_repo_url && (
              <div>
                <span className="text-slate-400 block text-[10px]">Source Code Repository</span>
                <a href={record.project_repo_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 font-mono">
                  <GitBranch className="w-3.5 h-3.5" /> {record.project_repo_url}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section D: Milestone Progression Journey */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 backdrop-blur-xl">
        <h3 className="text-sm font-black text-purple-400 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4" /> Section D: Round-by-Round Progression Journey
        </h3>

        <div className="relative pl-6 border-l-2 border-white/10 space-y-4 text-xs">
          {milestones.length === 0 ? (
            <p className="text-slate-400">Initial registration recorded.</p>
          ) : (
            milestones.map((m) => (
              <div key={m.id} className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-purple-500 border-2 border-slate-900" />
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span className="font-bold text-purple-300 uppercase">{m.milestone_type?.replace(/_/g, ' ')}</span>
                    <span>{new Date(m.occurred_at).toLocaleString()}</span>
                  </div>
                  <h5 className="font-bold text-white text-xs">{m.round_name || 'Stage Progress'}</h5>
                  <p className="text-[11px] text-slate-300">
                    Status: <b className="text-amber-300">{m.new_status}</b>
                  </p>
                  {m.notes && <p className="text-[11px] text-slate-400">{m.notes}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section E: Official Results & Rankings */}
      {results.length > 0 && (
        <div className="liquid-glass rounded-3xl p-6 border border-amber-500/30 bg-amber-500/5 shadow-xl space-y-3 backdrop-blur-xl">
          <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Section E: Official Competition Results & Rankings
          </h3>
          <div className="space-y-3">
            {results.map((res) => (
              <div key={res.id} className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-lg font-black text-amber-300">{res.rank_category || `Rank ${res.official_rank}`}</span>
                  <p className="text-xs text-slate-300 mt-1">{res.feedback}</p>
                </div>
                {res.score && (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold text-sm">
                    Score: {res.score} / {res.score_max || 100}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section F: Certificates & Credentials */}
      {certificates.length > 0 && (
        <div className="liquid-glass rounded-3xl p-6 border border-rose-500/30 bg-rose-500/5 shadow-xl space-y-3 backdrop-blur-xl">
          <h3 className="text-sm font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4" /> Section F: Official Issued Certificates & Credentials
          </h3>
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div key={cert.id} className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm">{cert.certificate_type}</h4>
                  <p className="text-xs text-slate-400">Issued by {cert.issuer} • Status: <b className="text-emerald-400">Verified</b></p>
                  <p className="text-[10px] font-mono text-cyan-300 mt-0.5">Credential ID: {cert.credential_id}</p>
                </div>
                {cert.file_path && (
                  <a
                    href={cert.file_path}
                    target="_blank"
                    rel="noreferrer"
                    className="clay-btn-rose px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shrink-0"
                  >
                    <Download className="w-4 h-4" /> Download Credential
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section G: Verification & Audit History */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-3 backdrop-blur-xl">
        <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" /> Section G: Record Verification & Audit Trail
        </h3>
        <p className="text-xs text-slate-400">
          This record is governed by the AIT permanent record protection policy. All mutations are timestamped and signed.
        </p>
        <div className="space-y-2 text-xs pt-1">
          {audits.map((a) => (
            <div key={a.id} className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">{a.action}</span>
                <p className="text-[11px] text-slate-400">Reason: {a.reason}</p>
              </div>
              <span className="font-mono text-[10px] text-slate-400">{new Date(a.performed_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
