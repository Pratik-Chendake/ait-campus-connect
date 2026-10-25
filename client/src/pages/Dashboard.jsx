import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Award, Users, Calendar, ArrowRight, ShieldCheck,
  Clock, CheckCircle, AlertCircle, Sparkles, Plus, ExternalLink,
  ChevronRight, Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;
      setLoading(true);
      try {
        const [profileRes, appRes, teamsRes, notifRes, eventsRes] = await Promise.all([
          api.get(`/students/${user.id}`),
          api.get('/events/applications/my'),
          api.get(`/teams?user_id=${user.id}`),
          api.get('/notifications'),
          api.get('/events?status=upcoming')
        ]);

        setData({
          profile: profileRes,
          applications: appRes.applications || [],
          teams: teamsRes.teams || [],
          notifications: notifRes.notifications?.slice(0, 5) || [],
          recommended: eventsRes.events?.slice(0, 3) || []
        });
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center liquid-glass rounded-3xl m-8 border border-white/10">
        <h2 className="text-xl font-bold text-white">Please sign in to view your student dashboard.</h2>
        <Link to="/login" className="mt-4 inline-block clay-btn-blue px-6 py-2.5 text-white rounded-xl text-xs font-bold">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
        <p className="text-sm font-semibold">Loading your AIT dashboard...</p>
      </div>
    );
  }

  const profile = data?.profile;
  const completion = profile?.user?.profile_completion || user?.profile_completion || 75;
  const verifiedCount = profile?.achievements?.filter(a => a.verification_status === 'VERIFIED').length || 0;
  const winsCount = profile?.achievements?.filter(a => a.position?.includes('Winner')).length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Greeting & Profile Completion Bar */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/15 backdrop-blur-2xl">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AIT Pune Undergraduate Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
            Welcome back, {user.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-rose-300">{user.branch || 'Branch Not Set'}</span>
            <span>•</span>
            <span>Year {user.year || 1}</span>
            {user.student_id ? (
              <>
                <span>•</span>
                <span className="font-mono text-cyan-300">{user.student_id}</span>
              </>
            ) : null}
          </p>
        </div>

        {/* Dynamic Profile Completion Widget */}
        <div className="w-full md:w-80 liquid-glass p-4 rounded-2xl border border-white/15 space-y-2 z-10 shrink-0 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">Profile Completion</span>
            <span className="font-black text-amber-400">{completion}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-rose-500 to-amber-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
              style={{ width: `${completion}%` }}
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-300">
              {completion === 100 ? 'Portfolio 100% unlocked!' : 'Complete profile to unlock portfolio.'}
            </span>
            <Link
              to="/profile/edit"
              className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline"
            >
              Update
            </Link>
          </div>
        </div>
      </div>

      {/* Unassigned Branch Notice */}
      {!user.branch && (
        <div className="p-4 rounded-2xl liquid-glass border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 animate-fade-in backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-white">Engineering Branch Not Set:</span> Please select your official AIT engineering branch to enable accurate teammate recommendations, leaderboard rankings, and departmental opportunity filtering.
            </div>
          </div>
          <Link
            to="/profile/edit"
            className="clay-btn-rose px-3.5 py-1.5 rounded-xl text-white font-bold text-xs whitespace-nowrap self-start sm:self-auto transition shadow-sm"
          >
            Set Branch Now
          </Link>
        </div>
      )}

      {/* Metric Tiles Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl liquid-glass border border-white/10 shadow-xl flex items-center gap-4 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">{profile?.achievements?.length || 0}</div>
            <div className="text-xs font-semibold text-slate-300">Total Achievements</div>
            <div className="text-[10px] text-amber-300 font-bold">{winsCount} Podiums</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl liquid-glass border border-white/10 shadow-xl flex items-center gap-4 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{verifiedCount}</div>
            <div className="text-xs font-semibold text-slate-300">AIT Verified Records</div>
            <div className="text-[10px] text-emerald-300 font-bold">100% Authenticated</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl liquid-glass border border-white/10 shadow-xl flex items-center gap-4 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">{data?.applications?.length || 0}</div>
            <div className="text-xs font-semibold text-slate-300">Active Registrations</div>
            <Link to="/applications" className="text-[10px] text-rose-400 font-bold hover:underline">
              View Status →
            </Link>
          </div>
        </div>

        <div className="p-5 rounded-2xl liquid-glass border border-white/10 shadow-xl flex items-center gap-4 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">{user.contribution_score || 0}</div>
            <div className="text-xs font-semibold text-slate-300">Contribution Points</div>
            <Link to="/leaderboard" className="text-[10px] text-rose-400 font-bold hover:underline">
              Leaderboard Rank →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Recommended & Applications (Left) + Teams & Notifications (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Event Registrations */}
          <div className="liquid-glass rounded-3xl p-6 sm:p-7 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">My Upcoming Registrations</h3>
                <p className="text-xs text-slate-400">Events and competitions you are actively enrolled in</p>
              </div>
              <Link to="/applications" className="text-xs font-semibold text-rose-400 hover:text-rose-300">
                View All →
              </Link>
            </div>

            {data?.applications?.length === 0 ? (
              <div className="p-8 text-center liquid-glass rounded-2xl border border-white/10">
                <p className="text-xs text-slate-400">You haven't registered for any events yet.</p>
                <Link
                  to="/opportunities"
                  className="mt-3 inline-block clay-btn-blue px-4 py-2 text-white rounded-xl text-xs font-semibold"
                >
                  Discover Opportunities
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.applications.slice(0, 3).map((app) => (
                  <div
                    key={app.registration_id}
                    className="p-4 rounded-2xl liquid-glass border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          {app.category}
                        </span>
                        <span className="text-[11px] font-mono text-cyan-300">ID: {app.registration_number}</span>
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1">{app.title}</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Date: {new Date(app.event_start_date).toLocaleDateString()} • Venue: {app.venue}
                      </p>
                    </div>
                    <Link
                      to={`/event/${app.event_id}`}
                      className="clay-btn-blue px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold self-end sm:self-center shrink-0 transition"
                    >
                      Event Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended For You */}
          <div className="liquid-glass rounded-3xl p-6 sm:p-7 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Explainable Matching
              </div>
              <h3 className="font-bold text-base text-white">Recommended For You</h3>
              <p className="text-xs text-slate-400">
                Recommended based on your enrollment in <b className="text-rose-300">{user.branch}</b> and active skills.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data?.recommended?.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-2xl liquid-glass border border-white/10 p-4 flex flex-col justify-between hover:border-blue-400/40 transition"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {rec.category}
                    </span>
                    <h5 className="font-bold text-xs text-white line-clamp-1">{rec.title}</h5>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{rec.description}</p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400">{rec.prize_pool || 'Prize Pool'}</span>
                    <Link to={`/event/${rec.id}`} className="font-bold text-rose-400 hover:text-rose-300">
                      Register →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-3 backdrop-blur-2xl">
            <h3 className="font-bold text-sm text-white">Portfolio Shortcuts</h3>
            <div className="space-y-2 text-xs">
              <Link
                to="/my-achievements"
                className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-blue-500/15 border border-amber-500/40 hover:border-amber-400 font-bold text-amber-200 hover:text-white flex items-center justify-between transition shadow-md"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>My Achievements (Permanent Record)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </Link>
              <Link
                to="/achievements"
                className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 border border-emerald-500/40 hover:border-emerald-400 font-bold text-emerald-200 hover:text-white flex items-center justify-between transition shadow-md"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Send Participation / Winning to Verify</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>
              <Link
                to="/certificates"
                className="w-full p-3 rounded-xl liquid-glass border border-white/10 hover:border-emerald-400/40 font-semibold text-slate-200 hover:text-white flex items-center justify-between transition"
              >
                <span>Open Certificate Vault</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </Link>
              <Link
                to="/teams/find"
                className="w-full p-3 rounded-xl liquid-glass border border-white/10 hover:border-amber-400/40 font-semibold text-slate-200 hover:text-white flex items-center justify-between transition"
              >
                <span>Find Teammates (94% Fit)</span>
                <Users className="w-4 h-4 text-amber-400" />
              </Link>
              <Link
                to={`/student/${user.student_id || user.id}`}
                className="w-full p-3 rounded-xl liquid-glass border border-white/10 hover:border-blue-400/40 font-semibold text-slate-200 hover:text-white flex items-center justify-between transition"
              >
                <span>View Public Portfolio</span>
                <ExternalLink className="w-4 h-4 text-blue-400" />
              </Link>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Recent Notifications</h3>
              <Link to="/notifications" className="text-xs text-rose-400 font-semibold hover:text-rose-300">All</Link>
            </div>

            {data?.notifications?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No notifications right now.</p>
            ) : (
              <div className="space-y-3">
                {data.notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl liquid-glass border border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{n.created_at?.slice(11, 16)}</span>
                    </div>
                    <p className="text-xs text-slate-300">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
