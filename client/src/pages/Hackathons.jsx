import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Code, Users, Calendar, ArrowRight, ShieldCheck,
  Sparkles, Loader2, ExternalLink, Bookmark, Clock, MapPin, CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Hackathons() {
  const { user } = useAuth();
  const [campusHackathons, setCampusHackathons] = useState([]);
  const [unstopHackathons, setUnstopHackathons] = useState([]);
  const [tab, setTab] = useState('ALL'); // 'ALL', 'UPCOMING', 'ARCHIVE'
  const [sourceFilter, setSourceFilter] = useState('ALL'); // 'ALL', 'UNSTOP', 'CAMPUS'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const queryParam = tab === 'ARCHIVE' ? 'status=archive' : tab === 'UPCOMING' ? 'status=upcoming' : '';
        const eventUrl = `/events?category=Hackathon${queryParam ? '&' + queryParam : ''}`;

        const [eventsRes, oppsRes] = await Promise.all([
          api.get(eventUrl),
          api.get('/opportunities?type=hackathons')
        ]);

        setCampusHackathons(eventsRes.events || []);
        setUnstopHackathons(oppsRes.opportunities || []);
      } catch (err) {
        console.error('Failed to load hackathons:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tab]);

  // Combine or filter items based on sourceFilter
  const displayCampus = sourceFilter === 'ALL' || sourceFilter === 'CAMPUS' ? campusHackathons : [];
  const displayUnstop = (sourceFilter === 'ALL' || sourceFilter === 'UNSTOP') && tab !== 'ARCHIVE' ? unstopHackathons : [];

  const totalCount = displayCampus.length + displayUnstop.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold mb-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            AIT Hackathon Arena & Unstop Aggregator
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            National & Campus Hackathons
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Live national hackathons from Unstop and flagship AIT campus sprint competitions. Form teams, build solutions, win prizes, and build your engineering portfolio.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex liquid-glass p-1 rounded-2xl text-xs font-bold border border-white/10 shadow-lg">
            <button
              onClick={() => setTab('ALL')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${tab === 'ALL' ? 'clay-btn-blue text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              All Hackathons
            </button>
            <button
              onClick={() => setTab('UPCOMING')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${tab === 'UPCOMING' ? 'clay-btn-rose text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Upcoming Sprints
            </button>
            <button
              onClick={() => setTab('ARCHIVE')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${tab === 'ARCHIVE' ? 'bg-white/15 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Past Archives & Winners
            </button>
          </div>
        </div>
      </div>

      {/* Source Filter Selector Bar */}
      <div className="liquid-glass p-4 rounded-2xl border border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-4 text-xs backdrop-blur-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-semibold">Source Filter:</span>
          <div className="flex bg-black/40 p-1 rounded-xl font-bold border border-white/5 flex-wrap gap-1">
            <button
              onClick={() => setSourceFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${sourceFilter === 'ALL' ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'text-slate-400 hover:text-white'}`}
            >
              All Sources ({campusHackathons.length + (tab !== 'ARCHIVE' ? unstopHackathons.length : 0)})
            </button>
            <button
              onClick={() => setSourceFilter('UNSTOP')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${sourceFilter === 'UNSTOP' ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'text-slate-400 hover:text-white'}`}
            >
              Unstop National ({unstopHackathons.length})
            </button>
            <button
              onClick={() => setSourceFilter('CAMPUS')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${sourceFilter === 'CAMPUS' ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]' : 'text-slate-400 hover:text-white'}`}
            >
              AIT Campus ({campusHackathons.length})
            </button>
          </div>
        </div>

        <Link
          to="/teams/find"
          className="clay-btn-rose px-4 py-2 rounded-xl text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/30"
        >
          <Users className="w-4 h-4" />
          Find Hackathon Teammates
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
          <p className="text-sm">Loading hackathon records from database...</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="font-semibold text-slate-700">No hackathons in this section right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Unstop Hackathons List */}
          {displayUnstop.map((opp) => {
            const isEligible = opp.eligibility_category === 'ELIGIBLE';
            const isPotentiallyEligible = opp.eligibility_category === 'POTENTIALLY_ELIGIBLE';
            const deadlineDate = opp.apply_deadline || opp.registration_deadline;

            return (
              <div
                key={opp.id}
                className="liquid-glass rounded-3xl border border-white/10 shadow-2xl hover:border-blue-500/40 hover:shadow-[0_20px_50px_rgba(37,99,235,0.2)] transition-all duration-300 overflow-hidden flex flex-col lg:flex-row group spatial-card"
              >
                {/* Banner Thumbnail */}
                <div className="lg:w-80 h-52 lg:h-auto bg-slate-950 relative shrink-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
                  <img
                    src={opp.banner_url || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800'}
                    alt={opp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 filter contrast-110"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-md shadow-blue-500/30">
                      Unstop National
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md ${
                      isEligible ? 'bg-emerald-500/90 text-white' :
                      isPotentiallyEligible ? 'bg-amber-500/90 text-white' : 'bg-slate-800/90 text-slate-200'
                    }`}>
                      {isEligible ? '✓ AIT Eligible' : isPotentiallyEligible ? '⚡ Potentially Eligible' : 'Verify'}
                    </span>
                  </div>

                  {opp.prize_pool && (
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/30">
                      {opp.prize_pool}
                    </div>
                  )}
                </div>

                {/* Details Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      <span className="text-blue-400 font-bold">{opp.organizer}</span>
                      <span>Mode: {opp.mode || 'Online'}</span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {opp.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                      {opp.description}
                    </p>

                    {/* Eligibility Reason */}
                    {opp.eligibility_reason && (
                      <p className="text-xs text-slate-400 italic">
                        {opp.eligibility_reason}
                      </p>
                    )}

                    {/* Skills Pills */}
                    {opp.skills_required && opp.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {opp.skills_required.slice(0, 4).map((skill, sIdx) => (
                          <span key={sIdx} className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metadata and Actions */}
                  <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {deadlineDate && (
                        <span>Deadline: <strong className="text-rose-400">{new Date(deadlineDate).toLocaleDateString()}</strong></span>
                      )}
                      <span>Team: <strong className="text-slate-200">{opp.team_min_size || 1}–{opp.team_max_size || 4} Members</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/opportunity/${opp.unstop_id || opp.id}`}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 font-bold text-xs transition cursor-pointer"
                      >
                        Full Details
                      </Link>

                      <a
                        href={opp.link || opp.application_link || 'https://unstop.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="clay-btn-rose px-4 py-2 rounded-xl text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
                      >
                        Apply on Unstop <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 2. Campus Hackathons List */}
          {displayCampus.map((hackathon) => {
            const isCompleted = hackathon.status === 'COMPLETED' || hackathon.results_published;

            return (
              <div
                key={`campus-${hackathon.id}`}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col lg:flex-row group"
              >
                {/* Banner Thumbnail */}
                <div className="lg:w-80 h-52 lg:h-auto bg-slate-100 relative shrink-0 overflow-hidden">
                  <img
                    src={hackathon.banner_url || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800'}
                    alt={hackathon.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isCompleted
                        ? 'bg-slate-900/90 text-amber-400'
                        : hackathon.registration_status === 'UNCONFIRMED'
                        ? 'bg-amber-500 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}>
                      {isCompleted
                        ? 'Archive: Results Concluded'
                        : hackathon.registration_status === 'UNCONFIRMED'
                        ? 'Confirmed Jan 29-30 2027 • Registration Pending'
                        : 'AIT Campus Verified'}
                    </span>
                  </div>

                  {hackathon.prize_pool && (
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                      {hackathon.prize_pool}
                    </div>
                  )}
                </div>

                {/* Details Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      <span>{hackathon.organizer_name}</span>
                      <span>Mode: {hackathon.mode}</span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {hackathon.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {hackathon.description}
                    </p>

                    {hackathon.result_summary && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                        🏆 {hackathon.result_summary}
                      </div>
                    )}
                  </div>

                  {/* Metadata and Actions */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Deadline: <strong className="text-rose-600">{new Date(hackathon.registration_deadline).toLocaleDateString()}</strong></span>
                      <span>Team: <strong className="text-slate-800">{hackathon.team_size_min}–{hackathon.team_size_max} Members</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/event/${hackathon.id}`}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        {isCompleted
                          ? 'View Results & Archive'
                          : hackathon.registration_status === 'UNCONFIRMED'
                          ? 'View Official Details'
                          : 'Details & Squad Registration'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
