import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Trophy, Users, ShieldCheck, Calendar,
  Clock, Zap, CheckCircle2, ChevronRight, Award, Compass,
  BookOpen, Star, Code, Activity, Search, KeyRound
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [featuredAchievers, setFeaturedAchievers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventsRes, achRes, clubsRes] = await Promise.all([
          api.get('/events?status=upcoming'),
          api.get('/leaderboard/hall-of-fame'),
          api.get('/clubs')
        ]);
        setEvents(eventsRes.events || []);
        setFeaturedAchievers(achRes.hall_of_fame?.slice(0, 4) || []);
        setClubs(clubsRes.clubs || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const trendingEvents = events.slice(0, 3);
  const closingSoon = events.filter(e => e.registration_deadline).slice(0, 2);

  return (
    <div className="space-y-16 pb-20 relative">
      {/* HERO SECTION - Transparent background so Cinematic Background Video plays right behind */}
      <section className="relative overflow-hidden bg-transparent text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass border border-blue-400/40 text-blue-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Army Institute of Technology, Pune
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-lg">
            Your AIT Journey.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-rose-400 drop-shadow-[0_0_25px_rgba(244,63,94,0.3)]">
              One Digital Identity.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-200 font-normal leading-relaxed drop-shadow-md">
            Discover opportunities, build teams, participate in events, and showcase everything you achieve at AIT.
            From hackathons and IEEE research to sports and club leadership.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/opportunities"
              className="clay-btn-blue px-6 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 group cursor-pointer"
            >
              Explore Opportunities
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/scholarships"
              className="clay-btn-rose px-6 py-3.5 rounded-xl text-white font-black text-sm shadow-lg shadow-rose-500/30 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Award className="w-4 h-4 text-white" />
              Scholarships Portal
            </Link>
            {!user ? (
              <Link
                to="/login"
                className="liquid-glass px-6 py-3.5 rounded-xl border border-blue-400/30 hover:border-blue-400/60 bg-blue-500/10 hover:bg-blue-500/20 text-white font-bold text-sm transition shadow-lg backdrop-blur-md flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Sign In / Authenticate</span>
              </Link>
            ) : (
              <Link
                to="/profile/edit"
                className="liquid-glass px-6 py-3.5 rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/10 text-white font-semibold text-sm transition shadow-lg backdrop-blur-md"
              >
                Build My Profile
              </Link>
            )}
          </div>

          {/* Visual Lifecycle Ribbon: Student -> Opportunity -> Team -> Achievement -> Portfolio */}
          <div className="pt-10">
            <div className="max-w-3xl mx-auto p-4 rounded-2xl liquid-glass border border-white/15 backdrop-blur-xl shadow-2xl">
              <div className="grid grid-cols-5 text-center text-xs font-semibold gap-1">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 shadow-[0_0_12px_rgba(59,130,246,0.3)] flex items-center justify-center text-blue-300 mb-1">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-slate-200 font-semibold">Discover</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center justify-center text-amber-300 mb-1">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-slate-200 font-semibold">Team Up</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center justify-center text-emerald-300 mb-1">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-slate-200 font-semibold">Participate</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)] flex items-center justify-center text-purple-300 mb-1">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-slate-200 font-semibold">Verify</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/40 shadow-[0_0_12px_rgba(244,63,94,0.3)] flex items-center justify-center text-rose-300 mb-1">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span className="text-slate-200 font-semibold">Portfolio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS STRIP */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 liquid-glass rounded-2xl shadow-2xl border border-white/15 backdrop-blur-xl">
          <div className="text-center md:border-r border-white/10">
            <div className="text-2xl sm:text-3xl font-black text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">22</div>
            <div className="text-xs font-semibold text-slate-300 mt-0.5">Official AIT Clubs</div>
          </div>
          <div className="text-center md:border-r border-white/10">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">₹5,00,000+</div>
            <div className="text-xs font-semibold text-slate-300 mt-0.5">Active Prize Pools</div>
          </div>
          <div className="text-center md:border-r border-white/10">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">100%</div>
            <div className="text-xs font-semibold text-slate-300 mt-0.5">Verified Credentials</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-black text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">94%</div>
            <div className="text-xs font-semibold text-slate-300 mt-0.5">Teammate Match Fit</div>
          </div>
        </div>
      </div>

      {/* AIT SCHOLARSHIP CONNECT SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-rose-500/30 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <Award className="w-3.5 h-3.5 text-rose-400" />
                New: AIT Scholarship Connect (2026–27)
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                All-India & Defence Scholarship Discovery Platform
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Discover 30+ verified Central (NSP), State Domicile (all 36 States/UTs), Kendriya Sainik Board (KSB PMSS), and Corporate CSR schemes. Check your automated eligibility with zero sensitive documents.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Genuine Portals
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to ₹50,000/yr Grants
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 36 States & UTs Directory
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
              <Link
                to="/scholarships"
                className="clay-btn-rose px-7 py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-500/25 transition flex items-center justify-center gap-2 text-center"
              >
                <span>Open Scholarship Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/scholarships?tab=ELIGIBLE"
                className="liquid-glass px-7 py-3 rounded-2xl text-white font-bold text-xs border border-white/20 hover:border-white/40 transition flex items-center justify-center gap-2 text-center"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Check My Eligibility</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DEADLINES CLOSING SOON */}
      {closingSoon.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-4 rounded-2xl liquid-glass-rose border border-rose-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">Registration Deadlines Closing Soon</span>
                <p className="text-sm font-semibold text-white">
                  {closingSoon[0].title} — Deadline: {new Date(closingSoon[0].registration_deadline).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Link
              to={`/event/${closingSoon[0].id}`}
              className="clay-btn-rose px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-md transition"
            >
              Register Before Deadline
            </Link>
          </div>
        </section>
      )}

      {/* TRENDING OPPORTUNITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Trending Opportunities</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              High-impact hackathons, algorithmic contests, and innovation challenges at AIT Pune.
            </p>
          </div>
          <Link
            to="/opportunities"
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 group"
          >
            View all <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trendingEvents.map((event) => (
            <div
              key={event.id}
              className="liquid-glass rounded-2xl border border-white/10 overflow-hidden shadow-xl hover:border-blue-400/50 hover:shadow-blue-500/20 transition-all duration-300 flex flex-col group backdrop-blur-xl"
            >
              <div className="relative h-44 overflow-hidden bg-slate-900/60">
                <img
                  src={event.banner_url || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800'}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-blue-600/90 text-white text-[11px] font-bold backdrop-blur-md border border-blue-400/30">
                    {event.category}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-slate-900/90 text-slate-200 text-[11px] font-semibold backdrop-blur-md border border-white/10">
                    {event.mode}
                  </span>
                </div>
                {event.prize_pool && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md">
                    {event.prize_pool}
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">
                    {event.organizer_name}
                  </div>
                  <h3 className="font-bold text-base text-white mt-1 line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    {new Date(event.event_start_date).toLocaleDateString()}
                  </div>
                  <Link
                    to={`/event/${event.id}`}
                    className="font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    Details & Register <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED ACHIEVERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="liquid-glass rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl space-y-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/30 px-2.5 py-1 rounded-full mb-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> AIT Hall of Fame
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Featured Achievers</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Officially authenticated victories in national hackathons, sports championships, and IEEE publications.
              </p>
            </div>
            <Link
              to="/hall-of-fame"
              className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              Explore Full Hall of Fame <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredAchievers.map((ach) => (
              <div
                key={ach.id}
                className="liquid-glass rounded-2xl p-5 border border-white/10 shadow-lg hover:border-amber-400/40 transition-all flex flex-col justify-between backdrop-blur-md"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={ach.student_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={ach.student_name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400"
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm truncate">{ach.student_name}</h4>
                      <p className="text-[11px] text-slate-300 truncate">{ach.branch || 'AIT'} • Year {ach.year || 1}</p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> ✓ AIT VERIFIED
                  </div>

                  <h5 className="font-bold text-white text-xs line-clamp-1">{ach.position}</h5>
                  <p className="text-xs text-blue-300 font-semibold mt-0.5 line-clamp-1">{ach.title}</p>
                  <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{ach.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Level: <b className="text-slate-200">{ach.level}</b></span>
                  <Link to={`/student/${ach.student_id || ach.user_id}`} className="text-rose-400 font-semibold hover:underline">
                    View Portfolio
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLUBS DIRECTORY PREVIEW (23 Official AIT Clubs) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">23 Official Campus Clubs</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              The vibrant student organizations shaping technical innovation, military tradition, and culture at AIT.
            </p>
          </div>
          <Link
            to="/clubs"
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            All 23 Clubs <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {clubs.slice(0, 6).map((club) => (
            <Link
              key={club.id}
              to={`/club/${club.id}`}
              className="p-4 liquid-glass rounded-2xl border border-white/10 hover:border-blue-400/50 hover:shadow-lg transition text-center flex flex-col items-center group backdrop-blur-md"
            >
              <img
                src={club.logo_url}
                alt={club.name}
                className="w-14 h-14 rounded-xl object-cover mb-2.5 group-hover:scale-105 transition-transform"
              />
              <span className="font-bold text-xs text-white line-clamp-1 group-hover:text-blue-400">
                {club.name}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">{club.category}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION: DIGITAL PORTFOLIO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl liquid-glass border border-white/15 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-2xl">
          <div className="space-y-3 max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to build your digital AIT identity?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every hackathon, workshop, research paper, and club role you complete becomes an authenticated building block in your official verified resume.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link
                to={user ? "/profile/edit" : "/register"}
                className="clay-btn-rose px-5 py-2.5 rounded-xl text-white font-bold text-xs transition shadow-md"
              >
                Start Profile Setup
              </Link>
              <Link
                to="/teams"
                className="text-xs font-semibold text-blue-300 hover:text-white underline underline-offset-4"
              >
                Find Teammates with 94% Match Fit
              </Link>
            </div>
          </div>
          <div className="shrink-0 flex gap-3 text-center">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
              <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto mb-1" />
              <div className="text-xs font-bold">100% Verified</div>
              <div className="text-[10px] text-slate-400">Institutional Seal</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
              <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-1" />
              <div className="text-xs font-bold">PDF Resume</div>
              <div className="text-[10px] text-slate-400">Instant Generator</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
