import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield, Users, Globe, Mail, Calendar,
  ArrowRight, Heart, Check, Loader2, Award, ChevronRight
} from 'lucide-react';
import { InstagramIcon } from '../components/SocialIcons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ClubDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    loadClub();
  }, [id]);

  async function loadClub() {
    setLoading(true);
    try {
      const res = await api.get(`/clubs/${id}`);
      setData(res);
      setIsFollowing(res.club?.is_following || false);
      setFollowersCount(res.club?.total_followers || 0);
    } catch (err) {
      console.error('Failed to load club:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleFollowToggle = async () => {
    if (!user) return alert('Please sign in to follow this club');
    try {
      if (isFollowing) {
        await api.post(`/clubs/${id}/unfollow`, {});
        setIsFollowing(false);
        setFollowersCount(c => Math.max(0, c - 1));
      } else {
        await api.post(`/clubs/${id}/follow`, {});
        setIsFollowing(true);
        setFollowersCount(c => c + 1);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
        <p className="text-sm font-semibold">Loading club profile...</p>
      </div>
    );
  }

  if (!data || !data.club) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center liquid-glass rounded-3xl m-8 border border-white/10">
        <h2 className="text-xl font-bold text-white">Club Not Found</h2>
        <Link to="/clubs" className="text-rose-400 text-xs font-semibold mt-2 inline-block hover:underline">
          Return to clubs directory
        </Link>
      </div>
    );
  }

  const { club, upcoming_events = [], past_events = [], members = [] } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Club Hero Card */}
      <div className="relative rounded-3xl overflow-hidden liquid-glass border border-white/10 shadow-2xl backdrop-blur-2xl">
        <div className="relative h-56 sm:h-80 w-full">
          <img
            src={club.banner_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200'}
            alt={club.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-slate-950/60 to-transparent" />

          {/* Social Links on top right */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {club.instagram_url && (
              <a
                href={club.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 hover:scale-105 transition-transform"
              >
                <InstagramIcon className="w-4 h-4" /> Official Instagram
              </a>
            )}
          </div>
        </div>

        {/* Club Meta Floating Bar */}
        <div className="p-6 sm:p-8 liquid-glass border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-2xl">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={club.logo_url}
              alt={club.name}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/20 shadow-xl bg-slate-950 shrink-0 -mt-16 sm:-mt-20 relative z-10"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">{club.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {club.category}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Founded: <b className="text-white">{club.founded_year || 'AIT Pune'}</b> • Followers: <b className="text-white">{followersCount} Students</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleFollowToggle}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isFollowing
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-md'
                  : 'clay-btn-blue text-white shadow-md'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFollowing ? 'fill-emerald-400 text-emerald-400' : ''}`} />
              {isFollowing ? 'Following Club' : 'Follow Club'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Leadership (Left) + Events (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Club */}
          <div className="liquid-glass rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
            <h3 className="font-bold text-lg text-white">About {club.name}</h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {club.about || club.description}
            </p>
          </div>

          {/* Leadership & Faculty */}
          <div className="liquid-glass rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Club Leadership & Governance (AY 2026–27)</h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                {club.leadership_verified ? 'Verified Appointments' : 'Status: Verification Pending'}
              </span>
            </div>

            {club.leadership_verified && data.leadership && data.leadership.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.leadership.map((leader) => (
                  <div key={leader.id} className="p-4 rounded-xl liquid-glass border border-white/10">
                    <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
                      {leader.kind} • {leader.role}
                    </span>
                    <div className="font-bold text-white text-sm mt-1">{leader.full_name}</div>
                    <div className="text-[11px] text-emerald-300 font-semibold mt-0.5">
                      ✓ AIT Verified {leader.academic_year_start}–{leader.academic_year_end}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="liquid-glass border border-amber-500/30 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  AY 2026–27 leadership information has not yet been verified.
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Official AIT appointment circular verification is currently pending review. In accordance with strict data provenance standards, previous-year office-bearers and unauthenticated claims are not published as current.
                </p>
              </div>
            )}
          </div>

          {/* Past Event Archive & Institutional Reports */}
          <div className="liquid-glass rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
            <h3 className="font-bold text-base text-white">
              Documented Historical Archive & Reports ({((data.past_archives || []).length) + past_events.length})
            </h3>

            {/* Sourced Institutional Archive Events */}
            {data.past_archives && data.past_archives.length > 0 && (
              <div className="space-y-3 mb-4">
                {data.past_archives.map((pa) => (
                  <div key={pa.id} className="p-4 rounded-xl liquid-glass border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        AY {pa.academic_year} Archive
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {pa.start_date} {pa.end_date ? `to ${pa.end_date}` : ''}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">{pa.event_name}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{pa.description}</p>
                    {pa.source_file && (
                      <div className="text-[10px] text-slate-400 font-mono pt-1">
                        Citation: {pa.source_file} (Pages {pa.source_pages || 'N/A'}) • Historical Evidence
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Past Events from Events table */}
            {past_events.length > 0 ? (
              <div className="space-y-3">
                {past_events.map((pe) => (
                  <div key={pe.id} className="p-4 rounded-xl liquid-glass border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white">{pe.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{pe.result_summary || 'Event successfully concluded.'}</p>
                    </div>
                    <Link to={`/event/${pe.id}`} className="text-xs text-rose-400 font-semibold hover:underline shrink-0 ml-4">
                      View Event →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (!data.past_archives || data.past_archives.length === 0) ? (
              <p className="text-xs text-slate-400">No past events recorded in the archive yet.</p>
            ) : null}
          </div>
        </div>

        {/* Right Column (Upcoming Events) */}
        <div className="space-y-6">
          <div className="liquid-glass rounded-2xl p-6 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
            <h3 className="font-bold text-base text-white">Upcoming Events ({upcoming_events.length})</h3>

            {upcoming_events.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No upcoming events scheduled right now. Follow to get notified.</p>
            ) : (
              <div className="space-y-3">
                {upcoming_events.map((ue) => {
                  const isUnconfirmed = ue.registration_status === 'UNCONFIRMED';
                  const isExternal = ue.registration_mode === 'EXTERNAL';

                  return (
                    <div key={ue.id} className="p-3.5 rounded-xl liquid-glass border border-white/10 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          {ue.category}
                        </span>
                        {isUnconfirmed && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Registration Details Pending
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-xs text-white">{ue.title}</h5>
                      <p className="text-[11px] text-slate-400">
                        Dates: {new Date(ue.event_start_date).toLocaleDateString()}
                        {ue.event_end_date && ue.event_end_date !== ue.event_start_date && (
                          ` – ${new Date(ue.event_end_date).toLocaleDateString()}`
                        )}
                      </p>
                      <Link
                        to={`/event/${ue.id}`}
                        className="inline-block text-xs font-bold text-rose-400 hover:text-rose-300"
                      >
                        {isUnconfirmed ? 'View Official Details →' : (isExternal ? 'Official Portal →' : 'Register Now →')}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
