import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Users, Trophy, Plus, ShieldCheck, Check,
  ExternalLink, Sparkles, AlertCircle, ArrowRight, Loader2, X
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export default function ClubDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Event Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hackathon');
  const [description, setDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [venue, setVenue] = useState('AIT Pune Campus');
  const [mode, setMode] = useState('In-Person');
  const [prizePool, setPrizePool] = useState('₹50,000');
  const [teamSizeMin, setTeamSizeMin] = useState(2);
  const [teamSizeMax, setTeamSizeMax] = useState(4);
  const [deadline, setDeadline] = useState('2026-11-20T23:59:59');
  const [startDate, setStartDate] = useState('2026-11-25T09:00:00');
  const [creating, setCreating] = useState(false);

  // Publish Results Modal (CRITICAL WORKFLOW)
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedEventForResults, setSelectedEventForResults] = useState(null);
  const [winnerIds, setWinnerIds] = useState([]);
  const [runnerUpIds, setRunnerUpIds] = useState([]);
  const [finalistIds, setFinalistIds] = useState([]);
  const [summaryText, setSummaryText] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadClubDashboard();
  }, [user]);

  async function loadClubDashboard() {
    setLoading(true);
    try {
      const [eventsRes, studentsRes] = await Promise.all([
        api.get('/events'),
        api.get('/students')
      ]);
      setEvents(eventsRes.events || []);
      setStudents(studentsRes.students || []);
    } catch (err) {
      console.error('Failed to load club dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/events', {
        title,
        category,
        description,
        problem_statement: problemStatement,
        venue,
        mode,
        prize_pool: prizePool,
        team_size_min: parseInt(teamSizeMin, 10),
        team_size_max: parseInt(teamSizeMax, 10),
        registration_deadline: deadline,
        event_start_date: startDate,
        event_end_date: startDate
      });
      setCreateModalOpen(false);
      loadClubDashboard();
      alert('Event created and published live on the AIT portal!');
    } catch (err) {
      alert(err.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenResults = (event) => {
    setSelectedEventForResults(event);
    setWinnerIds([1]); // Default demo winner (Rahul Sharma)
    setRunnerUpIds([2]); // Default demo runner-up (Priya Nair)
    setFinalistIds([3]); // Default demo finalist (Ananya Singh)
    setSummaryText(`Official results published for ${event.title}. Verified by club executive panel.`);
    setResultModalOpen(true);
  };

  const handlePublishResults = async (e) => {
    e.preventDefault();
    if (!selectedEventForResults) return;
    setPublishing(true);
    try {
      await api.post(`/events/${selectedEventForResults.id}/results`, {
        winners: winnerIds,
        runners_up: runnerUpIds,
        finalists: finalistIds,
        result_summary: summaryText
      });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setResultModalOpen(false);
      loadClubDashboard();
      alert('Results published! Verified achievement records automatically created for students.');
    } catch (err) {
      alert(err.message || 'Failed to publish results');
    } finally {
      setPublishing(false);
    }
  };

  if (user?.role !== 'ORGANIZER' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Club Organizer Hub</h2>
        <p className="text-xs text-slate-500">
          Switch role to <b>Club Organizer</b> in the top navigation role switcher to access club event management and results publishing.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold mb-2">
            <Trophy className="w-3.5 h-3.5 text-emerald-600" />
            AIT Club Organizer Console
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Club Dashboard & Results Engine
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Launch campus hackathons and workshops, track student enrollments, and <b>publish official results to automatically generate verified student portfolio achievements</b>.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> Create & Host Event
        </button>
      </div>

      {/* Events Management List */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm">Loading club events...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-base text-slate-900">Manage Campus Events & Publish Results</h3>
          <div className="grid grid-cols-1 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {event.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      event.results_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {event.results_published ? '✓ Results Published & Concluded' : 'Active / In-Progress'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Starts: {new Date(event.event_start_date).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900">{event.title}</h4>
                  <p className="text-xs text-slate-500">
                    Venue: {event.venue} • Enrolled: <b>{event.registration_count || 0} Students</b> {event.prize_pool ? `• Prize: ${event.prize_pool}` : ''}
                  </p>

                  {event.result_summary && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-sans border border-slate-200/80">
                      <span className="font-bold text-slate-800">Podium: </span>
                      {event.result_summary}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <Link
                    to={`/event/${event.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                  >
                    View Details
                  </Link>

                  {!event.results_published ? (
                    <button
                      onClick={() => handleOpenResults(event)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                    >
                      <Trophy className="w-4 h-4" /> Publish Results & Award
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Published
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Create Campus Event / Hackathon</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AIT Web3 Hackathon 2026"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Coding">Coding</option>
                    <option value="Robotics">Robotics</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                  >
                    <option value="In-Person">In-Person</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Prize Pool</label>
                  <input
                    type="text"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    placeholder="₹50,000"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Venue</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Ramanujan Complex, AIT Pune"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Event Start Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event details..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Problem Statement / Tracks</label>
                <textarea
                  rows={2}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Hackathon problem tracks..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition"
                >
                  {creating ? 'Publishing Event...' : 'Publish Official Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISH RESULTS MODAL (CRITICAL PRODUCT LOOP - Section 42 & 43) */}
      {resultModalOpen && selectedEventForResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Publish Event Results</h3>
                <p className="text-xs text-slate-500">{selectedEventForResults.title}</p>
              </div>
              <button onClick={() => setResultModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishResults} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <p className="font-bold">⚡ Automatic Achievement Engine Activated:</p>
                <p className="text-[11px] mt-0.5">
                  Publishing results will automatically generate <b>✓ AIT Verified achievements</b> on each winning student's portfolio and grant contribution points!
                </p>
              </div>

              {/* Select Winner */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">🏆 Winner (1st Place) — +30 Pts</label>
                <select
                  value={winnerIds[0] || ''}
                  onChange={(e) => setWinnerIds([parseInt(e.target.value, 10)])}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.branch || 'General'} • {s.student_id || 'ID Pending'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Runner-up */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">🥈 1st Runner-up (2nd Place) — +20 Pts</label>
                <select
                  value={runnerUpIds[0] || ''}
                  onChange={(e) => setRunnerUpIds([parseInt(e.target.value, 10)])}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.branch || 'General'} • {s.student_id || 'ID Pending'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Finalist */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">🎖️ Finalist — +10 Pts</label>
                <select
                  value={finalistIds[0] || ''}
                  onChange={(e) => setFinalistIds([parseInt(e.target.value, 10)])}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.branch || 'General'} • {s.student_id || 'ID Pending'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Result Summary Citation</label>
                <textarea
                  rows={2}
                  required
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={publishing}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-md"
                >
                  {publishing ? 'Publishing & Generating...' : 'Publish Results & Conclude Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
