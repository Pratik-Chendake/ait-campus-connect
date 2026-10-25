import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Award, ShieldCheck, Sparkles, Star, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../api/client';

export default function HallOfFame() {
  const [honorees, setHonorees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  const categories = [
    'All',
    'Hackathon',
    'Research',
    'Sports',
    'Competition',
    'Cultural'
  ];

  useEffect(() => {
    fetchHallOfFame();
  }, [category]);

  async function fetchHallOfFame() {
    setLoading(true);
    try {
      const endpoint = category === 'All' ? '/leaderboard/hall-of-fame' : `/leaderboard/hall-of-fame?category=${category}`;
      const res = await api.get(endpoint);
      setHonorees(res.hall_of_fame || []);
    } catch (err) {
      console.error('Failed to load hall of fame:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.25)]">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          AIT Apex Excellence
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
          AIT Hall of Fame
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          Honoring exceptional students who brought national and international laurels to Army Institute of Technology, Pune.
        </p>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-2 pt-4 text-xs font-semibold">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full transition cursor-pointer ${
                category === c
                  ? 'clay-btn-rose text-white shadow-lg font-bold'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-2" />
          <p className="text-sm font-semibold">Loading Hall of Fame honorees...</p>
        </div>
      ) : honorees.length === 0 ? (
        <div className="text-center py-16 liquid-glass rounded-2xl border border-white/10 backdrop-blur-xl">
          <p className="font-semibold text-slate-300">No verified honorees in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {honorees.map((ach) => (
            <div
              key={ach.id}
              className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-2xl hover:border-amber-400/50 hover:shadow-[0_10px_30px_rgba(245,158,11,0.2)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden backdrop-blur-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <img
                    src={ach.student_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt={ach.student_name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-blue-300 transition-colors">
                      {ach.student_name}
                    </h3>
                    <p className="text-xs text-slate-300">{ach.branch || 'AIT'} • Year {ach.year || 1}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full mt-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> AIT Verified
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                    {ach.level} Level • {ach.position}
                  </span>
                  <h4 className="font-extrabold text-white text-lg leading-snug group-hover:text-amber-300 transition-colors">
                    {ach.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {ach.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Date: <b className="text-slate-200">{ach.date}</b></span>
                <Link
                  to={`/student/${ach.student_id || ach.user_id}`}
                  className="font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  Student Portfolio <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
