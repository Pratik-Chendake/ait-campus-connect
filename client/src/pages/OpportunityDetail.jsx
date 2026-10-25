import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Trophy, MapPin, Users, Clock, Calendar, ExternalLink,
  Bookmark, BookmarkCheck, ChevronRight, ShieldCheck, Loader2, FileText
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function OpportunityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    async function loadOpportunity() {
      setLoading(true);
      try {
        const res = await api.get(`/opportunities/${id}`);
        setOpportunity(res.opportunity);

        if (user) {
          try {
            const savedRes = await api.get('/opportunities/saved');
            const savedIds = (savedRes.saved || []).map(s => s.opportunity_id);
            setIsSaved(savedIds.includes(parseInt(id, 10)));
          } catch {
            // Not logged in or error
          }
        }
      } catch (err) {
        console.error('Failed to load opportunity:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOpportunity();
  }, [id, user]);

  const handleToggleSave = async () => {
    if (!user) {
      alert('Please sign in to save opportunities to your profile');
      return;
    }
    setSaveLoading(true);
    try {
      if (isSaved) {
        await api.delete(`/opportunities/saved/${id}`);
        setIsSaved(false);
      } else {
        await api.post(`/opportunities/saved/${id}`, {});
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
        <p className="text-sm font-semibold">Loading opportunity details...</p>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center liquid-glass rounded-3xl m-8 border border-white/10">
        <h2 className="text-xl font-bold text-white">Opportunity Not Found</h2>
        <Link to="/opportunities" className="text-rose-400 font-semibold text-xs mt-2 inline-block hover:underline">
          Return to all opportunities
        </Link>
      </div>
    );
  }

  const deadlineDate = opportunity.registration_deadline || opportunity.deadline;
  const isEligible = opportunity.eligibility_status === 'ELIGIBLE';
  const isPotentiallyEligible = opportunity.eligibility_status === 'POTENTIALLY_ELIGIBLE';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link to="/opportunities" className="hover:text-rose-400 transition">Opportunities</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-slate-200 font-semibold truncate max-w-xs">{opportunity.title}</span>
      </div>

      {/* Hero Banner Section */}
      <div className="liquid-glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-2xl">
        {/* Banner Image */}
        <div className="h-56 sm:h-72 w-full bg-slate-900 relative overflow-hidden">
          <img
            src={opportunity.banner_url || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200'}
            alt={opportunity.title}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-slate-950/40 to-transparent" />

          {/* Badges in Hero */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600/90 text-white shadow-xs border border-blue-400/30 backdrop-blur-md">
              {opportunity.source === 'UNSTOP' ? 'Unstop Verified Listing' : 'Campus Verified'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${
              isEligible ? 'bg-emerald-500/90 text-white' :
              isPotentiallyEligible ? 'bg-amber-500/90 text-slate-950' : 'bg-slate-800/90 text-slate-200 border border-white/10'
            }`}>
              {isEligible ? '✓ AIT Pune Eligible' :
               isPotentiallyEligible ? '⚡ Potentially Eligible' : 'Eligibility Verification Needed'}
            </span>
          </div>

          {/* Bottom Title & Details in Hero */}
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-rose-300 uppercase tracking-wider">
              {opportunity.organizer}
            </p>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight drop-shadow-md">
              {opportunity.title}
            </h1>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-6 liquid-glass border-t border-white/10 flex flex-wrap items-center justify-between gap-4 backdrop-blur-2xl">
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
            {opportunity.prize_pool && (
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Prize: <strong className="text-amber-300">{opportunity.prize_pool}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Mode: <strong className="text-white">{opportunity.mode || 'Online'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Team Size: <strong className="text-white">{opportunity.team_min_size || 1}–{opportunity.team_max_size || 4} Members</strong></span>
            </div>
            {deadlineDate && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400" />
                <span>Deadline: <strong className="text-rose-400 font-bold">{new Date(deadlineDate).toLocaleDateString()}</strong></span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSave}
              disabled={saveLoading}
              className={`px-4 py-2.5 rounded-xl border font-semibold text-xs transition flex items-center gap-2 cursor-pointer ${
                isSaved
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-md'
                  : 'liquid-glass border-white/15 text-slate-200 hover:bg-white/10'
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
              {isSaved ? 'Saved to Profile' : 'Save Opportunity'}
            </button>

            <Link
              to="/teams/find"
              className="px-4 py-2.5 rounded-xl border border-blue-400/30 liquid-glass text-blue-300 font-semibold text-xs hover:bg-white/10 transition flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              Find Teammates
            </Link>

            {opportunity.official_url && (
              <a
                href={opportunity.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="clay-btn-blue px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                Apply on Unstop
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Main Details & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Content) */}
        <div className="lg:col-span-2 space-y-6">
          {/* AIT Pune Eligibility Assessment Notice */}
          <div className={`p-5 rounded-2xl liquid-glass border ${
            isEligible ? 'border-emerald-500/40 text-emerald-200' :
            isPotentiallyEligible ? 'border-amber-500/40 text-amber-200' : 'border-white/10 text-slate-300'
          }`}>
            <div className="flex items-start gap-3">
              <ShieldCheck className={`w-5 h-5 mt-0.5 shrink-0 ${
                isEligible ? 'text-emerald-400' : isPotentiallyEligible ? 'text-amber-400' : 'text-slate-400'
              }`} />
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-white">
                  AIT Pune Eligibility Assessment
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {opportunity.eligibility_reason || 'Evaluated for undergraduate engineering students across Computer, IT, E&TC, and Mechanical Engineering branches.'}
                </p>
              </div>
            </div>
          </div>

          {/* Event Description */}
          <div className="liquid-glass rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Opportunity Overview
            </h3>
            <div className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {opportunity.description || 'Full event overview available on the official Unstop page.'}
            </div>
          </div>

          {/* Required Skills & Domain Tags */}
          {((opportunity.skills_required && opportunity.skills_required.length > 0) || (opportunity.domains && opportunity.domains.length > 0)) && (
            <div className="liquid-glass rounded-2xl p-6 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
              <h3 className="font-bold text-sm text-white">Recommended Skills & Domains</h3>
              <div className="flex flex-wrap gap-2">
                {(opportunity.skills_required || []).map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {skill}
                  </span>
                ))}
                {(opportunity.domains || []).map((domain, idx) => (
                  <span key={`domain-${idx}`} className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-white/10">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Genuine Unstop Application Disclaimer */}
          <div className="p-4 rounded-xl liquid-glass border border-white/10 text-xs text-slate-400 leading-relaxed space-y-1">
            <p className="font-semibold text-slate-200">Official Registration Notice:</p>
            <p>
              Registration and submission for this opportunity are managed directly on Unstop by {opportunity.organizer}.
              Saving or forming a team on AIT Campus Connect does not automatically complete external registration. You must submit your official application on Unstop.
            </p>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          {/* Important Dates Timeline Card */}
          <div className="liquid-glass rounded-2xl p-6 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Important Timeline
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl liquid-glass bg-[#030712]/50 border border-white/10 space-y-0.5">
                <span className="text-slate-400 font-medium">Registration Deadline</span>
                <p className="font-bold text-rose-400">
                  {deadlineDate ? new Date(deadlineDate).toLocaleString() : 'Not announced yet'}
                </p>
              </div>

              {opportunity.registration_start && (
                <div className="p-3 rounded-xl liquid-glass bg-[#030712]/50 border border-white/10 space-y-0.5">
                  <span className="text-slate-400 font-medium">Registration Started</span>
                  <p className="font-bold text-white">
                    {new Date(opportunity.registration_start).toLocaleDateString()}
                  </p>
                </div>
              )}

              {opportunity.event_end && (
                <div className="p-3 rounded-xl liquid-glass bg-[#030712]/50 border border-white/10 space-y-0.5">
                  <span className="text-slate-400 font-medium">Event Concludes</span>
                  <p className="font-bold text-white">
                    {new Date(opportunity.event_end).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Team Formation Action Card */}
          <div className="liquid-glass rounded-2xl p-6 space-y-4 shadow-xl border border-rose-500/30 backdrop-blur-2xl text-white">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Need Teammates from AIT?</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Use our automated peer matchmaking algorithm to find students matching your required tech stack.
              </p>
            </div>
            <Link
              to="/teams/find"
              className="clay-btn-rose w-full py-2.5 rounded-xl text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
            >
              Match Teammates Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
