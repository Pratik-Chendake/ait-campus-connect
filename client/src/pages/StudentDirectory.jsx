import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, ShieldCheck, Trophy, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { BRANCH_OPTIONS, getBranchBadgeStyle, getBranchAbbr } from '../constants/branches';

export default function StudentDirectory() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState('All');
  const [year, setYear] = useState('All');
  const [skill, setSkill] = useState('');
  const [search, setSearch] = useState('');

  const branches = BRANCH_OPTIONS;
  const years = ['All', '1', '2', '3', '4'];

  useEffect(() => {
    fetchStudents();
  }, [branch, year]);

  async function fetchStudents() {
    setLoading(true);
    try {
      let endpoint = `/students?branch=${branch}&year=${year}`;
      if (skill) endpoint += `&skill=${encodeURIComponent(skill)}`;
      if (search) endpoint += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(endpoint);
      setStudents(res.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass border border-blue-400/30 text-blue-300 text-xs font-semibold mb-2 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
          <User className="w-3.5 h-3.5 text-blue-400" />
          AIT Verified Student Directory
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
          AIT Pune Student Directory
        </h1>
        <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
          Search peers across all branches and academic years. Find teammates by skill or discover top performers.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass rounded-2xl p-4 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or bio..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#030712]/70 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-400 backdrop-blur-md"
            />
          </div>
          <input
            type="text"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Skill (e.g. Python, ROS, Figma)..."
            className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-[#030712]/70 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-400 backdrop-blur-md"
          />
          <button
            type="submit"
            className="clay-btn-blue px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          {/* Branch filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {branches.map((b) => (
              <button
                key={b}
                onClick={() => setBranch(b)}
                className={`px-3 py-1 rounded-xl whitespace-nowrap transition font-medium cursor-pointer ${
                  branch === b
                    ? 'clay-btn-blue text-white font-bold shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {b.replace(' Engineering', '')}
              </button>
            ))}
          </div>

          {/* Year filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium">Year:</span>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                  year === y
                    ? 'bg-rose-500 text-white font-bold shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Grid */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
          <p className="text-sm font-semibold">Loading student directory...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 liquid-glass rounded-2xl border border-white/10 backdrop-blur-xl">
          <p className="font-semibold text-slate-300">No students found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <div
              key={student.id}
              className="liquid-glass rounded-2xl border border-white/10 p-5 shadow-xl hover:border-blue-400/40 hover:shadow-[0_10px_30px_rgba(59,130,246,0.15)] transition-all duration-300 flex flex-col justify-between backdrop-blur-2xl group"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-3">
                  <img
                    src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt={student.full_name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/30 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-white truncate group-hover:text-blue-300 transition-colors">
                      {student.full_name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getBranchBadgeStyle(student.branch)}`}>
                        {getBranchAbbr(student.branch)}
                      </span>
                      <span className="text-xs text-slate-300 truncate">
                        Year {student.year || 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {student.student_id ? (
                        <span className="text-[10px] font-mono text-slate-400">{student.student_id}</span>
                      ) : null}
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/30 px-1.5 py-0.5 rounded">
                        ★ {student.contribution_score || 0} pts
                      </span>
                    </div>
                  </div>
                </div>

                {student.bio && (
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {student.bio}
                  </p>
                )}

                {/* Top Skills */}
                {student.skills && student.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {student.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[10px] font-medium"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Top Achievement Badge */}
                {student.top_achievement && (
                  <div className="p-2.5 rounded-xl liquid-glass-rose border border-rose-500/30 text-[11px] text-rose-300 flex items-center gap-2 mb-2 backdrop-blur-md">
                    <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate font-semibold">
                      {student.top_achievement.position}: {student.top_achievement.title}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <Link
                  to={`/teams?invitee_id=${student.id}`}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Invite to Team
                </Link>
                <Link
                  to={`/student/${student.student_id || student.id}`}
                  className="clay-btn-blue px-3.5 py-1.5 rounded-xl text-white font-semibold text-xs shadow-md transition flex items-center gap-1"
                >
                  View Portfolio <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
