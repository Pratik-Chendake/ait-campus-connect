import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, ExternalLink, Calendar,
  Search, Check, Sparkles, Loader2, Heart
} from 'lucide-react';
import { InstagramIcon } from '../components/SocialIcons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Clubs() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [followedClubs, setFollowedClubs] = useState(new Set());

  const categories = [
    'All',
    'Technical',
    'Cultural',
    'Sports',
    'Community',
    'Media',
    'Entrepreneurship',
    'Research'
  ];

  useEffect(() => {
    fetchClubs();
  }, [category]);

  async function fetchClubs() {
    setLoading(true);
    try {
      let endpoint = `/clubs?category=${category}`;
      if (search) endpoint += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(endpoint);
      setClubs(res.clubs || []);
    } catch (err) {
      console.error('Failed to load clubs:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleFollow = async (clubId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return alert('Please sign in to follow clubs');

    const isFollowing = followedClubs.has(clubId);
    try {
      if (isFollowing) {
        await api.post(`/clubs/${clubId}/unfollow`, {});
        const next = new Set(followedClubs);
        next.delete(clubId);
        setFollowedClubs(next);
      } else {
        await api.post(`/clubs/${clubId}/follow`, {});
        const next = new Set(followedClubs);
        next.add(clubId);
        setFollowedClubs(next);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClubs();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-2 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          AIT Campus Clubs & Societies • Canonical Directory
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
          23 Official Campus Clubs
        </h1>
        <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
          Explore all 23 official boards, cells, and societies at Army Institute of Technology Pune with verified Instagram links and AY 2026–27 governance.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass rounded-2xl p-4 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs by name, category, or leadership..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#030712]/70 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-400 backdrop-blur-md transition"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium scrollbar-thin">
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
      </div>

      {/* Clubs Grid */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
          <p className="text-sm font-semibold">Loading AIT clubs directory...</p>
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-16 liquid-glass rounded-2xl border border-white/10 backdrop-blur-xl">
          <p className="font-semibold text-slate-300">No clubs found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => {
            const isFollowing = followedClubs.has(club.id);

            return (
              <div
                key={club.id}
                className="liquid-glass rounded-2xl border border-white/10 shadow-xl hover:border-emerald-400/40 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)] transition-all duration-300 flex flex-col justify-between overflow-hidden group backdrop-blur-2xl"
              >
                <div>
                  {/* Card Header with Banner/Logo */}
                  <div className="h-32 bg-slate-900/60 relative overflow-hidden">
                    <img
                      src={club.banner_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600'}
                      alt={club.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-slate-950/60 to-transparent" />
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-900/90 text-white border border-white/15 backdrop-blur-md">
                      {club.category}
                    </span>
                  </div>

                  {/* Logo overlay & Name */}
                  <div className="px-5 -mt-8 relative z-10 flex items-end justify-between">
                    <img
                      src={club.logo_url}
                      alt={club.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/20 shadow-xl bg-slate-950"
                    />
                    {club.instagram_url && (
                      <a
                        href={club.instagram_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md hover:scale-105 transition-transform"
                        title="Official Instagram Reference"
                      >
                        <InstagramIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Club details */}
                  <div className="p-5 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors">
                        {club.name}
                      </h3>
                    </div>
                    {club.instagram_handle && (
                      <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md inline-block">
                        @{club.instagram_handle}
                      </span>
                    )}

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {club.description}
                    </p>

                    <div className="pt-2 text-xs text-slate-400 space-y-1">
                      {club.leadership_verified && club.lead_name ? (
                        <div>
                          Lead: <b className="text-slate-200">{club.lead_name}</b> ({club.lead_role || 'Secretary'})
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1.5 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          AY 2026–27 leadership verification pending
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-5 pt-0 border-t border-white/10 flex items-center justify-between gap-3">
                  <button
                    onClick={(e) => handleToggleFollow(club.id, e)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      isFollowing
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'liquid-glass border border-white/10 hover:border-white/30 text-slate-300'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFollowing ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>

                  <Link
                    to={`/club/${club.id}`}
                    className="clay-btn-blue px-4 py-1.5 rounded-xl text-white font-semibold text-xs shadow-md transition flex items-center gap-1"
                  >
                    View Club →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
