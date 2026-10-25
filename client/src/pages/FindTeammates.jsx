import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users, Sparkles, Trophy, ShieldCheck, Mail, Send,
  CheckCircle2, ArrowRight, Search, Loader2, X, Filter
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BRANCH_OPTIONS, getBranchAbbr, getBranchBadgeStyle } from '../constants/branches';

export default function FindTeammates() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [requiredSkills, setRequiredSkills] = useState(searchParams.get('skills') || 'Python, React, Machine Learning');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [candidates, setCandidates] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [roleOffered, setRoleOffered] = useState('Frontend Developer');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchCandidates();
    if (user) fetchMyTeams();
  }, [requiredSkills, selectedBranch]);

  async function fetchCandidates() {
    setLoading(true);
    try {
      let url = `/teams/match/candidates?required_skills=${encodeURIComponent(requiredSkills)}`;
      if (selectedBranch && selectedBranch !== 'All') {
        url += `&branch=${encodeURIComponent(selectedBranch)}`;
      }
      const res = await api.get(url);
      setCandidates(res.candidates || []);
    } catch (err) {
      console.error('Failed to load candidate matches:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyTeams() {
    try {
      const res = await api.get(`/teams?user_id=${user.id}`);
      setMyTeams(res.teams || []);
      if (res.teams?.length > 0) setSelectedTeamId(res.teams[0].id.toString());
    } catch (err) {
      console.error('Failed to load user teams:', err);
    }
  }

  const handleOpenInvite = (candidate) => {
    if (!user) return alert('Please sign in to invite teammates');
    if (myTeams.length === 0) {
      alert('You need to create a squad first before sending team invitations. Go to Teams > Create Team.');
      return;
    }
    setSelectedCandidate(candidate);
    setInviteModalOpen(true);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !selectedCandidate) return;
    setInviting(true);
    try {
      await api.post(`/teams/${selectedTeamId}/invite`, {
        invitee_id: selectedCandidate.id,
        role_offered: roleOffered,
        message: inviteMessage || `Hey ${selectedCandidate.full_name}, we'd love for you to join our squad!`
      });
      setInviteModalOpen(false);
      setInviteMessage('');
      alert(`Invitation sent to ${selectedCandidate.full_name}!`);
    } catch (err) {
      alert(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          AIT AI Teammate Compatibility Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Find Your Teammates
        </h1>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">
          Enter the technical stack or roles you need. Our algorithm scores candidate compatibility based on skills, branch, past hackathon wins, and activity.
        </p>
      </div>

      {/* Filter / Stack Selector */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="space-y-1.5">
          <label className="font-bold text-xs text-slate-700 uppercase tracking-wider">
            I Need Teammates Skilled In:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              placeholder="e.g. Python, React, Machine Learning, ROS, Figma..."
              className="flex-1 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              onClick={fetchCandidates}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition"
            >
              Run Matcher
            </button>
          </div>
        </div>

        {/* Quick stack presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium">Quick presets:</span>
          {[
            'AI / ML & Quant',
            'Fullstack Web (React + Node)',
            'Robotics & Embedded C',
            'Cybersecurity & CTF',
            'UI/UX Design & Frontend'
          ].map((preset) => (
            <button
              key={preset}
              onClick={() => setRequiredSkills(preset)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px]"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Branch Filter Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-600" /> Filter by Branch:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BRANCH_OPTIONS.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBranch(b)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  selectedBranch === b
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {b === 'All' ? 'All Branches' : b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Candidates Results Grid */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
          <p className="text-sm">Evaluating student compatibility scores...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
          <p className="font-semibold text-slate-800">No peers found matching this specific stack query.</p>
          <p className="text-xs text-slate-500">Try broadening your required skills tags.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Match Badge & Profile Header */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs shadow-xs tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {c.match_score}% MATCH
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    ★ {c.contribution_score} pts
                  </span>
                </div>

                <div className="flex items-center gap-3.5 pt-1">
                  <img
                    src={c.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt={c.full_name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-slate-900 truncate">{c.full_name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getBranchBadgeStyle(c.branch)}`}>
                        {getBranchAbbr(c.branch)}
                      </span>
                      <span className="text-xs text-slate-500 truncate">
                        Year {c.year || 1}
                      </span>
                    </div>
                    {c.student_id ? (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{c.student_id}</span>
                    ) : null}
                  </div>
                </div>

                {c.bio && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {c.bio}
                  </p>
                )}

                {/* Matched skills highlight */}
                {c.all_skills && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {c.all_skills.slice(0, 5).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Achievement highlight */}
                {c.top_achievement && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 truncate">
                    🏆 <b>{c.top_achievement.position}:</b> {c.top_achievement.title}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  to={`/student/${c.student_id || c.id}`}
                  className="font-semibold text-slate-500 hover:text-slate-800"
                >
                  View Profile
                </Link>
                <button
                  onClick={() => handleOpenInvite(c)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Invite to Squad
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INVITE MODAL */}
      {inviteModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Invite {selectedCandidate.full_name} to Squad
              </h3>
              <button onClick={() => setInviteModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Choose Squad *</label>
                <select
                  required
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                >
                  {myTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (For: {t.event_title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Role Offered</label>
                <input
                  type="text"
                  required
                  value={roleOffered}
                  onChange={(e) => setRoleOffered(e.target.value)}
                  placeholder="e.g. ML Lead / Frontend Engineer"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Invitation Note</label>
                <textarea
                  rows={2}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Tell them why they are a great fit for your team..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-blue-600/20"
                >
                  {inviting ? 'Dispatching...' : 'Send Official Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
