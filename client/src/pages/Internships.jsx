import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Clock, DollarSign, ExternalLink, Search, Loader2 } from 'lucide-react';
import { api } from '../api/client';

export default function Internships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInternships();
  }, [mode]);

  async function fetchInternships() {
    setLoading(true);
    try {
      let endpoint = `/internships?mode=${mode}`;
      if (search) endpoint += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(endpoint);
      setInternships(res.internships || []);
    } catch (err) {
      console.error('Failed to load internships:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInternships();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass border border-blue-400/30 text-blue-300 text-xs font-bold mb-2 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
          <Briefcase className="w-3.5 h-3.5 text-blue-400" />
          AIT Career & Industry Relations
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
          Engineering & Research Internships
        </h1>
        <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
          Curated internship opportunities across Microsoft, DRDO, Tata Motors, NVIDIA, and defense research labs.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="liquid-glass rounded-2xl p-4 border border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, company, or skills required..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#030712]/70 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-400 backdrop-blur-md"
          />
        </form>

        <div className="flex items-center gap-1 liquid-glass p-1 rounded-xl border border-white/10 text-xs shrink-0">
          {['All', 'Hybrid', 'On-site', 'Remote'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                mode === m
                  ? 'clay-btn-blue text-white font-bold shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Internships List */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
          <p className="text-sm font-semibold">Loading internship listings...</p>
        </div>
      ) : internships.length === 0 ? (
        <div className="text-center py-16 liquid-glass rounded-2xl border border-white/10 backdrop-blur-xl">
          <p className="font-semibold text-slate-300">No internship postings matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {internships.map((intern) => (
            <div
              key={intern.id}
              className="liquid-glass rounded-2xl p-6 border border-white/10 shadow-xl hover:border-blue-400/40 hover:shadow-[0_10px_30px_rgba(59,130,246,0.15)] transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-2xl group"
            >
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-blue-300 bg-blue-500/20 border border-blue-400/30 px-2.5 py-0.5 rounded-full">
                    {intern.company}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    {intern.mode}
                  </span>
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    {intern.stipend}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  {intern.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">{intern.description}</p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                  <span>Location: <b className="text-slate-200">{intern.location}</b></span>
                  <span>Duration: <b className="text-slate-200">{intern.duration}</b></span>
                  <span>Deadline: <b className="text-rose-400 font-bold">{intern.deadline}</b></span>
                </div>

                {intern.skills_required && (
                  <div className="pt-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Skills: </span>
                    <span className="font-mono text-cyan-300">{intern.skills_required}</span>
                  </div>
                )}
              </div>

              <div className="shrink-0 self-end md:self-center">
                <a
                  href={intern.apply_url || 'https://careers.google.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="clay-btn-blue px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  Apply Opportunity <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
