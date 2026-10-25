import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users, UserPlus, Sparkles, Trophy, Check, X,
  ArrowRight, ShieldCheck, Mail, Plus, Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Teams() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('event_id');

  const [myTeams, setMyTeams] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(eventIdParam || '');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('React, Python, Design');
  const [maxMembers, setMaxMembers] = useState(4);
  const [leaderRole, setLeaderRole] = useState('Team Leader');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTeamsAndInvitations();
  }, [user]);

  async function loadTeamsAndInvitations() {
    if (!user) return;
    setLoading(true);
    try {
      const [teamsRes, invRes, eventsRes] = await Promise.all([
        api.get(`/teams?user_id=${user.id}`),
        api.get('/teams/my/invitations'),
        api.get('/events?status=upcoming')
      ]);
      setMyTeams(teamsRes.teams || []);
      setInvitations(invRes.invitations || []);
      setEvents(eventsRes.events || []);
      if (eventIdParam) setSelectedEventId(eventIdParam);
    } catch (err) {
      console.error('Failed to load teams data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !teamName) return;
    setCreating(true);
    try {
      await api.post('/teams', {
        event_id: parseInt(selectedEventId, 10),
        name: teamName,
        description,
        required_skills: requiredSkills,
        max_members: parseInt(maxMembers, 10),
        leader_role: leaderRole
      });
      setShowCreateModal(false);
      setTeamName('');
      setDescription('');
      loadTeamsAndInvitations();
      alert('Team formed successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const handleRespondInvitation = async (invId, action) => {
    try {
      await api.post(`/teams/invitations/${invId}/respond`, { action });
      loadTeamsAndInvitations();
      alert(action === 'ACCEPTED' ? 'Joined team!' : 'Invitation declined');
    } catch (err) {
      alert(err.message || 'Failed to process invitation');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            AIT Collaborative Team Formation Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Teams & Matchmaking
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Create teams for upcoming hackathons, check missing skill roles, and discover high-compatibility peers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/teams/find"
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-slate-900" /> Find Teammates (94% Fit)
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Team
          </button>
        </div>
      </div>

      {/* Invitations Inbox */}
      {invitations.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900">
              Team Invitations Awaiting Your Decision ({invitations.length})
            </h3>
          </div>

          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 bg-white rounded-xl border border-amber-200/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {inv.inviter_name} invited you to join <span className="text-blue-700 font-extrabold">{inv.team_name}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    For: {inv.event_title} • Role: <b className="text-amber-700">{inv.role_offered || 'Member'}</b>
                  </p>
                  {inv.message && <p className="text-slate-600 text-xs italic mt-1 font-sans">"{inv.message}"</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRespondInvitation(inv.id, 'ACCEPTED')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => handleRespondInvitation(inv.id, 'REJECTED')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Teams List */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm">Loading your teams...</p>
        </div>
      ) : myTeams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">You are not in any teams yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create a squad for an upcoming hackathon or use our matchmaker to discover members.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs"
            >
              Create Squad
            </button>
            <Link
              to="/teams/find"
              className="px-4 py-2 bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl"
            >
              Find Teammates
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {team.event_category}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {team.current_members}/{team.max_members} Members
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-xl text-slate-900">{team.name}</h3>
                  <p className="text-xs font-semibold text-blue-700 mt-0.5">For: {team.event_title}</p>
                </div>

                {team.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">{team.description}</p>
                )}

                {/* Missing Skills Checklist (Section 19) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">Stack Checklist</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {team.required_skills?.split(',').map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-medium">
                        ✓ {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Leader: <b className="text-slate-700">{team.leader_name}</b></span>
                <Link
                  to={`/teams/find?skills=${encodeURIComponent(team.required_skills || '')}&eventId=${team.event_id}`}
                  className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Recruit Missing Role <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TEAM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Create New Squad</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Team / Squad Name *</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. CyberSentinels"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Target Event *</label>
                <select
                  required
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                >
                  <option value="">Select an upcoming event...</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Your Role</label>
                  <input
                    type="text"
                    value={leaderRole}
                    onChange={(e) => setLeaderRole(e.target.value)}
                    placeholder="Team Leader / ML Lead"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Max Members</label>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Required Skills & Stacks</label>
                <input
                  type="text"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="React, Python, ROS, UI/UX"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Team Goal & Pitch</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What idea or track are you building?"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-blue-600/20"
                >
                  {creating ? 'Forming Team...' : 'Create Team & Launch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
