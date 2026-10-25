import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Code2, Users, Calendar, ArrowRight, ShieldCheck,
  Sparkles, Loader2, ExternalLink, Bookmark, Clock, MapPin, Search
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Competitions() {
  const { user } = useAuth();
  const [campusCompetitions, setCampusCompetitions] = useState([]);
  const [unstopCompetitions, setUnstopCompetitions] = useState([]);
  const [tab, setTab] = useState('ALL'); // 'ALL', 'UPCOMING', 'ARCHIVE'
  const [modeFilter, setModeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const queryParam = tab === 'ARCHIVE' ? 'status=archive' : tab === 'UPCOMING' ? 'status=upcoming' : '';
        const eventUrl = `/events?category=Competition${queryParam ? '&' + queryParam : ''}`;

        const [eventsRes, oppsRes] = await Promise.all([
          api.get(eventUrl),
          api.get('/opportunities?type=competition')
        ]);

        setCampusCompetitions(eventsRes.events || []);
        setUnstopCompetitions(oppsRes.opportunities || []);
      } catch (err) {
        console.error('Failed to load competitions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tab]);

  // Combine campus competitions and external unstop competitions
  const allCompetitions = [
    ...campusCompetitions.map(c => ({
      ...c,
      source: 'CAMPUS',
      prize: c.prize_pool || 'Certificates & Trophy',
      team: c.max_team_size ? `Up to ${c.max_team_size} members` : 'Individual / Team',
      link: `/event/${c.id}`
    })),
    ...unstopCompetitions.map(c => ({
      ...c,
      source: 'UNSTOP',
      prize: c.prize_pool || 'Cash & Mentorship',
      team: c.team_max_size ? `1 - ${c.team_max_size} members` : 'Team',
      link: c.apply_url || c.source_url || '#'
    }))
  ];

  const filteredCompetitions = allCompetitions.filter(item => {
    if (modeFilter !== 'ALL' && item.mode && item.mode.toUpperCase() !== modeFilter.toUpperCase()) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = (item.title || item.name || '').toLowerCase().includes(q);
      const matchOrg = (item.organizer || item.club_name || '').toLowerCase().includes(q);
      return matchTitle || matchOrg;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass border border-blue-400/30 text-blue-300 text-xs font-bold mb-2 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
            <Trophy className="w-3.5 h-3.5 text-blue-400" />
            AIT Arena • Flagship Competitions
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
            National & Campus Competitions
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Competitive programming sprints, algorithmic contests, robotics leagues, and technical design challenges at Army Institute of Technology.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex liquid-glass p-1 rounded-xl text-xs font-semibold border border-white/10 backdrop-blur-xl">
            <button
              onClick={() => setTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                tab === 'ALL'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)] font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              All Contests
            </button>
            <button
              onClick={() => setTab('UPCOMING')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                tab === 'UPCOMING'
                  ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.3)] font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTab('ARCHIVE')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                tab === 'ARCHIVE'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)] font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Archived
            </button>
          </div>
        </div>
      </div>

      {/* Search and Mode Filter Bar */}
      <div className="liquid-glass rounded-2xl p-4 border border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search competitions by title, organizing club, or domain..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#030712]/70 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-400 backdrop-blur-md"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
          <span className="text-slate-300">Mode:</span>
          {['ALL', 'ONLINE', 'IN-PERSON', 'HYBRID'].map(m => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                modeFilter === m
                  ? 'clay-btn-blue text-white font-bold shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Competitions Grid */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
          <p className="text-xs font-semibold">Loading verified competition listings...</p>
        </div>
      ) : filteredCompetitions.length === 0 ? (
        <div className="text-center py-16 liquid-glass rounded-3xl border border-white/10 p-8 space-y-3 backdrop-blur-xl">
          <Trophy className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-white text-base">No competitions match your criteria</h4>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different status tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompetitions.map((comp, idx) => (
            <div
              key={comp.id || idx}
              className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl hover:border-blue-400/40 hover:shadow-[0_10px_30px_rgba(59,130,246,0.15)] transition-all duration-300 flex flex-col justify-between group backdrop-blur-2xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    comp.source === 'CAMPUS'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                  }`}>
                    {comp.source === 'CAMPUS' ? '🏛️ AIT Campus Event' : '⚡ National Contest'}
                  </span>

                  <span className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                    {comp.mode || 'Online'}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-white text-base group-hover:text-blue-300 transition line-clamp-2 leading-snug">
                    {comp.title || comp.name}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Organized by: <strong className="text-rose-300">{comp.organizer || comp.club_name || 'AIT Pune'}</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {comp.description || 'Join this competitive programming and technical problem-solving event.'}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-medium border-t border-white/10">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Prize Pool</span>
                    <strong className="text-amber-400 font-black">{comp.prize}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Team Size</span>
                    <strong className="text-white">{comp.team}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Deadline: <b className="text-slate-200">{comp.registration_deadline || comp.deadline || 'Ongoing'}</b></span>
                </div>

                {comp.source === 'CAMPUS' ? (
                  <Link
                    to={comp.link}
                    className="clay-btn-blue py-2 px-4 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <span>View & Register</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <a
                    href={comp.link}
                    target="_blank"
                    rel="noreferrer"
                    className="clay-btn-rose py-2 px-4 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
