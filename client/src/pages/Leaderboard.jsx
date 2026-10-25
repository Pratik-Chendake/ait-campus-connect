import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Medal, Award, Star, ShieldCheck, ChevronRight,
  Filter, Info, Sparkles, Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { BRANCH_OPTIONS, getBranchBadgeStyle, getBranchAbbr } from '../constants/branches';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState('All');
  const [year, setYear] = useState('All');

  const branches = BRANCH_OPTIONS;
  const years = ['All', '1', '2', '3', '4'];

  useEffect(() => {
    fetchLeaderboard();
  }, [branch, year]);

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      const endpoint = `/leaderboard?branch=${branch}&year=${year}`;
      const res = await api.get(endpoint);
      setLeaderboard(res.leaderboard || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">🥇 1</span>;
    if (rank === 2) return <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">🥈 2</span>;
    if (rank === 3) return <span className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black text-xs flex items-center justify-center shadow-md">🥉 3</span>;
    return <span className="font-bold text-xs text-slate-400 w-7 text-center">#{rank}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass border border-amber-400/30 text-amber-300 text-xs font-bold mb-2 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          AIT Verified Contribution Ranking
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
          Campus Contribution Leaderboard
        </h1>
        <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
          Recognizing verified student initiative, competition wins, hackathons, open source, and campus leadership.
        </p>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-2xl liquid-glass-blue border border-blue-500/30 text-xs text-blue-200 flex items-start gap-3 backdrop-blur-xl">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <b>How Points Work:</b> Points represent verified activity only (Winner +30, Finalist +20, Research +30, Leadership +15, Participation +5). This is NOT a measure of academic GPA; it measures extracurricular drive and institutional participation.
        </p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 liquid-glass rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl text-xs">
        {/* Branch */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-medium scrollbar-thin">
          {branches.map((b) => (
            <button
              key={b}
              onClick={() => setBranch(b)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                branch === b
                  ? 'clay-btn-blue text-white font-bold shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {b.replace(' Engineering', '')}
            </button>
          ))}
        </div>

        {/* Year */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium">Class:</span>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`w-7 h-7 rounded-lg font-semibold flex items-center justify-center transition cursor-pointer ${
                year === y
                  ? 'bg-rose-500 text-white font-bold shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {y === 'All' ? 'All' : `Y${y}`}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
          <p className="text-sm font-semibold">Calculating rankings...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-16 liquid-glass rounded-2xl border border-white/10 backdrop-blur-xl">
          <p className="font-semibold text-slate-300">No students found matching filters.</p>
        </div>
      ) : (
        <div className="liquid-glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-2xl">
          <div className="divide-y divide-white/10">
            {leaderboard.map((student) => (
              <div
                key={student.id}
                className="p-4 sm:p-5 hover:bg-white/5 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  {getRankBadge(student.rank)}

                  <img
                    src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={student.full_name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/30 shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/student/${student.student_id || student.id}`}
                        className="font-bold text-sm text-white hover:text-blue-300 truncate transition-colors"
                      >
                        {student.full_name}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        {student.student_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getBranchBadgeStyle(student.branch)}`}>
                        {getBranchAbbr(student.branch)}
                      </span>
                      <span className="text-xs text-slate-300 truncate">
                        Year {student.year || 1}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-semibold text-slate-200">
                      {student.wins_count || 0} Wins • {student.verified_achievements_count || 0} Verified
                    </span>
                    <p className="text-[10px] text-slate-400">Authenticated Records</p>
                  </div>

                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-amber-400 block leading-tight drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                      {student.contribution_score || 0}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Points
                    </span>
                  </div>

                  <Link
                    to={`/student/${student.student_id || student.id}`}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
