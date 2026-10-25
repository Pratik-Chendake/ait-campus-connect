import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Grid, List, Clock, MapPin,
  ChevronRight, Trophy, Sparkles, Filter, Loader2, ArrowRight
} from 'lucide-react';
import { api } from '../api/client';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [pastArchives, setPastArchives] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [view, setView] = useState('LIST'); // 'LIST' or 'CALENDAR'
  const [category, setCategory] = useState('All');
  const [clubFilter, setClubFilter] = useState('All');
  const [statusTab, setStatusTab] = useState('upcoming'); // 'upcoming', 'completed', or 'archive'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [eventsRes, clubsRes] = await Promise.all([
          api.get(`/events?status=${statusTab}`),
          api.get('/clubs')
        ]);
        setEvents(eventsRes.events || []);
        setPastArchives(eventsRes.past_archives || []);
        setClubs(clubsRes.clubs || []);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [statusTab]);

  const filteredEvents = events.filter((e) => {
    if (category !== 'All' && e.category !== category) return false;
    if (clubFilter !== 'All' && e.club_id !== parseInt(clubFilter, 10)) return false;
    return true;
  });

  const categories = ['All', 'Sports', 'Cultural', 'Robotics', 'Coding', 'Hackathon', 'Conference', 'Workshop'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass border border-blue-400/30 text-blue-300 text-xs font-semibold mb-2 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
            Academic Year 2026–27 Schedule • Active Date Boundary: 1 Jul 2026 – 30 Jun 2027
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
            Campus Events & Festivals
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
            Active dashboards strictly display Academic Year 2026–27 events. Historical records from AY 2025–26 or earlier are segregated into the Historical Archive.
          </p>
        </div>

        {/* View Switcher & Archive Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex liquid-glass p-1 rounded-xl text-xs font-semibold border border-white/10 backdrop-blur-xl">
            <button
              onClick={() => setStatusTab('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusTab === 'upcoming'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)] font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Upcoming (AY 2026–27)
            </button>
            <button
              onClick={() => setStatusTab('completed')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusTab === 'completed'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Completed (AY 2026–27)
            </button>
            <button
              onClick={() => setStatusTab('archive')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusTab === 'archive'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)] font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Historical Archive (Past Years)
            </button>
          </div>

          <div className="hidden sm:flex liquid-glass p-1 rounded-xl text-xs border border-white/10 backdrop-blur-xl">
            <button
              onClick={() => setView('LIST')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                view === 'LIST'
                  ? 'bg-white/15 text-white shadow-inner font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('CALENDAR')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                view === 'CALENDAR'
                  ? 'bg-white/15 text-white shadow-inner font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid/Calendar view"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row - Liquid Glass with Cyber Refraction */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 liquid-glass rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl text-xs">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-medium scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                category === cat
                  ? 'clay-btn-blue text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Club selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-semibold">Club:</span>
          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            className="bg-[#030712]/70 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-400 backdrop-blur-md cursor-pointer"
          >
            <option value="All" className="bg-[#030712] text-white">All Clubs</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#030712] text-white">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Render */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-2" />
          <p className="text-sm font-semibold">Loading event schedule...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 liquid-glass rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
          <p className="font-semibold text-slate-300">No events found matching your criteria.</p>
        </div>
      ) : (
        <div className={view === 'LIST' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
          {filteredEvents.map((event) => {
            const isCompleted = event.status === 'COMPLETED' || event.results_published;

            if (view === 'LIST') {
              return (
                <div
                  key={event.id}
                  className="liquid-glass rounded-2xl p-5 border border-white/10 shadow-xl hover:border-blue-400/40 hover:shadow-[0_10px_30px_rgba(59,130,246,0.15)] transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group backdrop-blur-2xl"
                >
                  <div className="flex items-start gap-4">
                    {/* Date Badge */}
                    <div className="w-16 h-16 rounded-xl bg-blue-500/10 border border-blue-400/30 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)] flex flex-col items-center justify-center shrink-0 backdrop-blur-md group-hover:scale-105 transition-transform">
                      <span className="text-[10px] uppercase font-black text-rose-400 tracking-wider">
                        {new Date(event.event_start_date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-xl font-black text-white leading-none mt-0.5">
                        {new Date(event.event_start_date).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/30">
                          {event.category}
                        </span>
                        <span className="text-xs text-rose-300 font-semibold">{event.organizer_name}</span>
                        {isCompleted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Results Published
                          </span>
                        )}
                        {event.registration_status === 'UNCONFIRMED' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Registration Details Pending
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-white mt-1 group-hover:text-blue-300 transition-colors">
                        {event.title}
                      </h3>

                      <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Mode: <b className="text-white font-semibold">{event.mode}</b></span>
                        <span>Venue: <b className="text-white font-semibold">{event.venue}</b></span>
                        {event.prize_pool && (
                          <span>Prize: <b className="text-amber-400 font-bold">{event.prize_pool}</b></span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Link
                      to={`/event/${event.id}`}
                      className="clay-btn-blue px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                    >
                      {isCompleted
                        ? 'View Results & Archive'
                        : event.registration_status === 'UNCONFIRMED'
                        ? 'View Official Details'
                        : 'Details & Register'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            }

            // Grid card view - Liquid Glass
            return (
              <div
                key={event.id}
                className="liquid-glass rounded-2xl border border-white/10 overflow-hidden shadow-xl hover:border-rose-400/40 hover:shadow-[0_10px_30px_rgba(244,63,94,0.15)] transition-all duration-300 flex flex-col justify-between backdrop-blur-2xl group"
              >
                <div>
                  <div className="h-40 bg-slate-900/60 overflow-hidden relative">
                    <img
                      src={event.banner_url || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600'}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/90 text-white text-[10px] font-bold border border-white/10 backdrop-blur-md">
                      {event.category}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">{event.organizer_name}</div>
                    <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{event.description}</p>
                    <div className="text-xs text-slate-400 pt-2 border-t border-white/10 flex items-center justify-between">
                      <span>Date: <b className="text-slate-200">{new Date(event.event_start_date).toLocaleDateString()}</b></span>
                      {event.prize_pool && (
                        <span className="text-amber-400 font-bold">{event.prize_pool}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link
                    to={`/event/${event.id}`}
                    className="clay-btn-blue w-full py-2 rounded-xl text-white font-semibold text-xs transition flex items-center justify-center gap-1 shadow-md"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sourced Institutional Archive Section (AY 2025-26) */}
      {statusTab === 'archive' && pastArchives.length > 0 && (
        <div className="pt-8 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Institutional Annual Activity Report Archives (Historical AY 2025–26)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastArchives.map((pa) => (
              <div key={pa.id} className="p-5 liquid-glass rounded-2xl border border-white/10 shadow-xl space-y-2 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    AY {pa.academic_year} Documented Fest
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{pa.start_date}</span>
                </div>
                <h4 className="font-bold text-sm text-white">{pa.event_name}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{pa.description}</p>
                <div className="pt-2 text-[11px] text-slate-400 font-mono border-t border-white/10">
                  Evidence Citation: {pa.source_file} (Pages {pa.source_pages}) • Primary Historical Report
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
