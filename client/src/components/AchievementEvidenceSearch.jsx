import React, { useState, useEffect } from 'react';
import {
  Search, ExternalLink, Globe, Sparkles, ChevronDown, ChevronUp,
  Info, Copy, Check
} from 'lucide-react';
import { api } from '../api/client';

/**
 * Validate that a URL is a legitimate HTTP/HTTPS URI to prevent XSS or protocol exploits
 */
function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return false;
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitize query terms for inclusion in search queries (strips control characters and quotes)
 */
function cleanQueryTerm(term) {
  if (!term || typeof term !== 'string') return '';
  return term.replace(/[\r\n\t"]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Helper to compute client-side fallback search queries immediately
 */
function computeFallbackQueries(achievement) {
  const studentName = cleanQueryTerm(achievement.student_name || '');
  const eventName = cleanQueryTerm(achievement.event_name || achievement.title || '');
  const position = cleanQueryTerm(achievement.position || '').replace(/\([^)]*\)/g, '').trim();

  let primaryQuery = `"${eventName}" "${studentName}"`;
  if (position && !position.toLowerCase().includes('participant')) {
    primaryQuery += ` "${position}"`;
  }

  const institutionalQuery = `"${eventName}" "${studentName}" ("Army Institute of Technology" OR "AIT Pune")`;
  const platformQuery = `site:unstop.com OR site:devfolio.co OR site:hackerearth.com "${eventName}" "${studentName}"`;

  const buildGoogleUrl = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  const buildDuckDuckGoUrl = (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;

  return {
    queries: {
      primary: primaryQuery,
      institutional: institutionalQuery,
      platform: platformQuery
    },
    google_links: {
      primary: { url: buildGoogleUrl(primaryQuery) },
      institutional: { url: buildGoogleUrl(institutionalQuery) },
      platform: { url: buildGoogleUrl(platformQuery) }
    },
    duckduckgo_links: {
      primary: { url: buildDuckDuckGoUrl(primaryQuery) },
      institutional: { url: buildDuckDuckGoUrl(institutionalQuery) },
      platform: { url: buildDuckDuckGoUrl(platformQuery) }
    }
  };
}

/**
 * Achievement Evidence Search Component
 * 
 * Provides two free, safe manual search options:
 * 1. Google Search
 * 2. DuckDuckGo Search
 * 
 * Strict policy:
 * - Opens targeted pre-formulated queries in a new browser tab for human inspection.
 * - Zero HTML scraping or automated requests to Google/DuckDuckGo.
 * - Search links serve as supporting reference evidence, not automatic approval/rejection.
 */
export default function AchievementEvidenceSearch({ achievement }) {
  const [isOpen, setIsOpen] = useState(false);
  const [manualLinks, setManualLinks] = useState(null);
  const [activeQueryTab, setActiveQueryTab] = useState('primary'); // 'primary' | 'institutional' | 'platform'
  const [copiedQuery, setCopiedQuery] = useState(false);

  // Initialize with fast client-side fallback immediately
  const fallback = computeFallbackQueries(achievement);
  const activeLinks = manualLinks || fallback;
  const currentQuery = activeLinks.queries?.[activeQueryTab] || fallback.queries[activeQueryTab];

  // Fetch pre-formulated links from backend when expanded
  useEffect(() => {
    if (isOpen && !manualLinks && achievement?.id) {
      api.get(`/verification/achievements/${achievement.id}/search-evidence`)
        .then((data) => {
          if (data?.manual_links) {
            setManualLinks(data.manual_links);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch backend search links, using client fallback:', err.message);
        });
    }
  }, [isOpen, achievement?.id]);

  const rawGoogleUrl = activeLinks.google_links?.[activeQueryTab]?.url || fallback.google_links[activeQueryTab].url;
  const rawDuckDuckGoUrl = activeLinks.duckduckgo_links?.[activeQueryTab]?.url || fallback.duckduckgo_links[activeQueryTab].url;

  const safeGoogleUrl = isValidHttpUrl(rawGoogleUrl) ? rawGoogleUrl : '#';
  const safeDuckDuckGoUrl = isValidHttpUrl(rawDuckDuckGoUrl) ? rawDuckDuckGoUrl : '#';

  const handleCopyQuery = () => {
    if (!currentQuery) return;
    navigator.clipboard.writeText(currentQuery).then(() => {
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="w-full mt-3 border border-slate-200/80 rounded-2xl bg-slate-50/70 overflow-hidden transition-all">
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/80 transition focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Achievement Evidence Search</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100/80 text-purple-800">
                Google Search • DuckDuckGo
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Cross-reference claim on Google Search and DuckDuckGo in a new tab
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isOpen ? 'Hide Evidence Panel' : 'Inspect Evidence'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
        </div>
      </button>

      {/* Expanded Search Evidence Panel */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-white space-y-4">
          {/* Query Preset Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveQueryTab('primary')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeQueryTab === 'primary' ? 'bg-white text-purple-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Exact Name & Event
              </button>
              <button
                type="button"
                onClick={() => setActiveQueryTab('institutional')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeQueryTab === 'institutional' ? 'bg-white text-purple-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AIT Campus Mention
              </button>
              <button
                type="button"
                onClick={() => setActiveQueryTab('platform')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeQueryTab === 'platform' ? 'bg-white text-purple-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hackathon Portals
              </button>
            </div>

            <div className="text-[11px] text-slate-400 italic">
              Target: <span className="font-semibold text-slate-700">{achievement.student_name || 'Student'}</span>
            </div>
          </div>

          {/* Active Query String Preview with Copy Option */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="text-[11px] text-slate-700 font-mono truncate">
              <span className="text-slate-400 font-sans text-[10px] uppercase font-bold mr-2">Query:</span>
              {currentQuery}
            </div>
            <button
              type="button"
              onClick={handleCopyQuery}
              className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 text-[10px] font-semibold flex items-center gap-1 shrink-0 transition"
              title="Copy search query to clipboard"
            >
              {copiedQuery ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Two Search Options Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: Google Search */}
            <a
              href={safeGoogleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition hover:shadow cursor-pointer"
            >
              <Globe className="w-4 h-4 text-blue-100" />
              <span>Search on Google</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-200 ml-1" />
            </a>

            {/* Option 2: DuckDuckGo Search */}
            <a
              href={safeDuckDuckGoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition hover:shadow cursor-pointer"
            >
              <Search className="w-4 h-4 text-amber-100" />
              <span>Search on DuckDuckGo</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-200 ml-1" />
            </a>
          </div>

          {/* Ethical Reviewer Guidance Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <b className="text-slate-700">Reviewer Guidance:</b> Google Search and DuckDuckGo links are supporting evidence to assist human verification. Search engine results do not prove or disprove authentic achievements, and lack of web results does not mean a submission is fraudulent. Reviewers must examine the student's official uploaded certificates and institutional records before approving or rejecting.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
