import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, User, Calendar, Shield, Briefcase, Award, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults(null);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  const hasAnyResults = results && results.total_matches > 0;

  const modalContent = (
    <div className="fixed inset-0 z-[99998] flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, hackathons, clubs, internships, research..."
            className="w-full bg-transparent text-slate-900 text-lg placeholder-slate-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />}
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded font-medium ml-2"
          >
            ESC
          </button>
        </div>

        {/* Category Tabs */}
        {results && (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto text-xs font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                activeTab === 'ALL' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-200'
              }`}
            >
              All ({results.total_matches})
            </button>
            {results.events.length > 0 && (
              <button
                onClick={() => setActiveTab('EVENTS')}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  activeTab === 'EVENTS' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-200'
                }`}
              >
                Events ({results.events.length})
              </button>
            )}
            {results.students.length > 0 && (
              <button
                onClick={() => setActiveTab('STUDENTS')}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  activeTab === 'STUDENTS' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-200'
                }`}
              >
                Students ({results.students.length})
              </button>
            )}
            {results.clubs.length > 0 && (
              <button
                onClick={() => setActiveTab('CLUBS')}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  activeTab === 'CLUBS' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-200'
                }`}
              >
                Clubs ({results.clubs.length})
              </button>
            )}
            {results.internships.length > 0 && (
              <button
                onClick={() => setActiveTab('CAREER')}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  activeTab === 'CAREER' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-200'
                }`}
              >
                Internships & Scholarships ({results.internships.length + results.scholarships.length})
              </button>
            )}
          </div>
        )}

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!query && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">Type anything to search across the entire AIT Campus Connect ecosystem.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
                {['Hackathon', 'Machine Learning', 'GDSC', 'Robotics', 'Priya Nair', 'Microsoft', 'IEEE'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && !loading && !hasAnyResults && (
            <div className="text-center py-12 text-slate-500">
              <p className="font-medium">No results found for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for skills, club names, or student names.</p>
            </div>
          )}

          {/* Events Results */}
          {results && (activeTab === 'ALL' || activeTab === 'EVENTS') && results.events.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5 text-amber-500" /> Events & Hackathons
              </div>
              <div className="space-y-1.5">
                {results.events.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => handleSelect(`/event/${e.id}`)}
                    className="p-3 hover:bg-blue-50/70 rounded-xl cursor-pointer transition border border-transparent hover:border-blue-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">{e.title}</span>
                        <span className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-700 font-medium rounded-full">
                          {e.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {e.mode} • Venue: {e.venue} {e.prize_pool ? `• Prize: ${e.prize_pool}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Students Results */}
          {results && (activeTab === 'ALL' || activeTab === 'STUDENTS') && results.students.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5 text-blue-500" /> Students & Peers
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {results.students.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelect(`/student/${s.id}`)}
                    className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition border border-slate-100 flex items-center gap-3"
                  >
                    <img
                      src={s.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={s.full_name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 text-sm truncate">{s.full_name}</div>
                      <p className="text-xs text-slate-500 truncate">
                        {s.branch} • Year {s.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clubs Results */}
          {results && (activeTab === 'ALL' || activeTab === 'CLUBS') && results.clubs.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> Campus Clubs
              </div>
              <div className="space-y-1.5">
                {results.clubs.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(`/club/${c.id}`)}
                    className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition border border-slate-100 flex items-center gap-3"
                  >
                    <img src={c.logo_url} alt={c.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 text-sm truncate">{c.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {c.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{c.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internships & Scholarships */}
          {results && (activeTab === 'ALL' || activeTab === 'CAREER') && (results.internships.length > 0 || results.scholarships.length > 0) && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Career & Scholarships
              </div>
              <div className="space-y-2">
                {results.internships.map((i) => (
                  <div
                    key={i.id}
                    onClick={() => handleSelect('/internships')}
                    className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{i.title}</div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {i.company} • Stipend: {i.stipend} • Mode: {i.mode}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-blue-600">View</span>
                  </div>
                ))}
                {results.scholarships.map((sch) => (
                  <div
                    key={sch.id}
                    onClick={() => handleSelect('/scholarships')}
                    className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{sch.name}</div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Provider: {sch.provider} • Grant: {sch.amount}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-emerald-600">Apply</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
