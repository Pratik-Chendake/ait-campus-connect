import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ExternalLink, Sparkles, BookOpen, Search, Loader2 } from 'lucide-react';
import { api } from '../api/client';

export default function Research() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ieeeOnly, setIeeeOnly] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPapers();
  }, [ieeeOnly]);

  async function fetchPapers() {
    setLoading(true);
    try {
      let endpoint = `/research?is_ieee=${ieeeOnly ? 'true' : 'false'}`;
      if (search) endpoint += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(endpoint);
      setPapers(res.papers || []);
    } catch (err) {
      console.error('Failed to load papers:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPapers();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass border border-purple-400/30 text-purple-300 text-xs font-bold mb-2 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          AIT Undergraduate Research & R&D Cell
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
          Research & IEEE Publications
        </h1>
        <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
          Showcasing peer-reviewed student research presented at IEEE international conferences, Springer journals, and defense symposia.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="liquid-glass rounded-2xl p-4 border border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search publications by title, authors, or research area..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#030712]/70 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-400 backdrop-blur-md"
          />
        </form>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none shrink-0 liquid-glass px-3 py-2 rounded-xl border border-white/15">
          <input
            type="checkbox"
            checked={ieeeOnly}
            onChange={(e) => setIeeeOnly(e.target.checked)}
            className="rounded text-rose-500 focus:ring-rose-500"
          />
          <span>Show IEEE Publications Only</span>
        </label>
      </div>

      {/* Papers List */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
          <p className="text-sm font-semibold">Loading research papers...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-16 liquid-glass rounded-2xl border border-white/10 backdrop-blur-xl">
          <p className="font-semibold text-slate-300">No research publications found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="liquid-glass rounded-3xl p-6 sm:p-7 border border-white/10 shadow-xl hover:border-purple-400/40 hover:shadow-[0_10px_30px_rgba(168,85,247,0.15)] transition-all duration-300 space-y-3 backdrop-blur-2xl group"
            >
              <div className="flex flex-wrap items-center gap-2">
                {paper.is_ieee === 1 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-400/40 text-[10px] font-bold">
                    IEEE Conference Publication
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                  {paper.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">{paper.publication_date}</span>
                <span className="text-xs text-slate-400 ml-auto">
                  By:{' '}
                  <Link to={`/student/${paper.student_id || paper.user_id}`} className="font-bold text-rose-400 hover:underline">
                    {paper.student_name}
                  </Link>
                </span>
              </div>

              <h3 className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors">
                "{paper.title}"
              </h3>

              <p className="text-xs text-slate-300">
                <span className="font-semibold text-slate-200">Authors: </span>
                {paper.authors}
              </p>

              <p className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Forum: </span>
                {paper.conference_or_journal} {paper.doi ? `• DOI: ${paper.doi}` : ''}
              </p>

              {paper.abstract && (
                <div className="p-4 rounded-xl liquid-glass bg-[#030712]/50 border border-white/10 text-xs text-slate-300 leading-relaxed font-sans backdrop-blur-md">
                  <p className="font-bold text-slate-200 mb-1">Abstract:</p>
                  {paper.abstract}
                </div>
              )}

              {paper.url && (
                <div className="pt-2 flex justify-end">
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noreferrer"
                    className="clay-btn-blue px-4 py-1.5 rounded-xl text-white font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    View Publication Document <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
