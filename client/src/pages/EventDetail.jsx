import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar, MapPin, Users, Trophy, ShieldCheck, Clock,
  ArrowRight, Check, Share2, Bookmark, CheckCircle2, AlertCircle,
  FileText, Sparkles, Loader2, X
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);

  // Registration Form State
  const [tshirtSize, setTshirtSize] = useState('M');
  const [dietary, setDietary] = useState('Veg');
  const [githubUrl, setGithubUrl] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadEvent();
  }, [id]);

  async function loadEvent() {
    setLoading(true);
    try {
      const res = await api.get(`/events/${id}`);
      setEventData(res);
      if (res.user_registration) {
        setRegistrationSuccess({
          registration_number: res.user_registration.registration_number,
          already_registered: true
        });
      }
    } catch (err) {
      console.error('Failed to load event:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setRegistering(true);
    setErrorMsg('');

    try {
      const res = await api.post(`/events/${id}/register`, {
        team_id: selectedTeamId ? parseInt(selectedTeamId, 10) : null,
        custom_answers: {
          tshirt_size: tshirtSize,
          dietary,
          github_url: githubUrl || user.github_url
        }
      });

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setRegistrationSuccess(res);
      setRegisterModalOpen(false);
      loadEvent(); // Refresh status
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;
    try {
      await api.post(`/events/${id}/cancel-registration`, {});
      setRegistrationSuccess(null);
      loadEvent();
    } catch (err) {
      alert('Failed to cancel registration');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
        <p className="text-sm font-semibold">Loading event details...</p>
      </div>
    );
  }

  if (!eventData || !eventData.event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center liquid-glass rounded-3xl m-8 border border-white/10">
        <h2 className="text-xl font-bold text-white">Event Not Found</h2>
        <Link to="/opportunities" className="text-rose-400 font-semibold text-xs mt-2 inline-block hover:underline">
          Return to opportunities
        </Link>
      </div>
    );
  }

  const { event, user_registration, user_team, teams } = eventData;
  const isRegistered = Boolean(user_registration || registrationSuccess);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in relative z-10">
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Link to="/opportunities" className="hover:text-rose-400 transition-colors">Opportunities</Link>
          <span>/</span>
          <span className="font-semibold text-slate-200">{event.title}</span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Event link copied to clipboard!');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass border border-white/10 text-slate-300 hover:text-white font-medium transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-400" /> Share
        </button>
      </div>

      {/* Hero Banner Card */}
      <div className="relative rounded-3xl overflow-hidden liquid-glass border border-white/10 shadow-2xl backdrop-blur-2xl">
        <div className="relative h-64 sm:h-96 w-full">
          <img
            src={event.banner_url || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200'}
            alt={event.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-slate-950/70 to-transparent" />

          {/* Hero text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-600/80 border border-blue-400/30 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                {event.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white text-xs font-semibold">
                {event.mode}
              </span>
              {event.prize_pool && (
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black shadow-md">
                  Prize: {event.prize_pool}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight max-w-4xl drop-shadow-md">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-300">
              <span className="font-semibold text-rose-300">Organized by {event.organizer_name}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                {new Date(event.event_start_date).toLocaleDateString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-400" />
                {event.venue}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Details (Left) + Registration / Team Box (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Content) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Registration status banner if registered */}
          {isRegistered && (
            <div className="p-5 rounded-2xl liquid-glass border border-emerald-500/40 text-emerald-200 flex items-center justify-between backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">You are Registered for this Event</h4>
                  <p className="text-xs text-emerald-300">
                    Registration ID:{' '}
                    <b className="font-mono">{registrationSuccess?.registration_number || user_registration?.registration_number}</b>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelRegistration}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Description */}
          <div className="liquid-glass rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
            <h3 className="font-bold text-lg text-white">About the Opportunity</h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>

            {event.problem_statement && (
              <div className="pt-4 border-t border-white/10">
                <h4 className="font-bold text-sm text-white mb-2">Problem Statement & Tracks</h4>
                <div className="p-4 rounded-xl liquid-glass bg-[#030712]/60 border border-white/10 text-xs sm:text-sm text-slate-300 leading-relaxed font-mono">
                  {event.problem_statement}
                </div>
              </div>
            )}
          </div>

          {/* Rules & Eligibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="liquid-glass rounded-2xl p-6 border border-white/10 shadow-xl space-y-2 backdrop-blur-2xl">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Eligibility Criteria
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {event.eligibility || 'Open to all undergraduate students of Army Institute of Technology, Pune and affiliated colleges.'}
              </p>
            </div>

            <div className="liquid-glass rounded-2xl p-6 border border-white/10 shadow-xl space-y-2 backdrop-blur-2xl">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Rules & Conduct
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {event.rules || 'Standard institute competition conduct applies. Strict adherence to time windows and safety regulations.'}
              </p>
            </div>
          </div>

          {/* Teams Formed for This Event */}
          <div className="liquid-glass rounded-2xl p-6 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Teams Formed ({teams.length})</h3>
                <p className="text-xs text-slate-400">Student teams registered or recruiting members for this event</p>
              </div>
              <Link
                to={`/teams?event_id=${event.id}`}
                className="text-xs font-bold text-rose-400 hover:text-rose-300"
              >
                Find Teammates →
              </Link>
            </div>

            {teams.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No teams created yet. Be the first to create a team!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teams.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-xl liquid-glass border border-white/10 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-white">{t.name}</h5>
                      <p className="text-[11px] text-slate-400">Leader: {t.leader_name}</p>
                      <p className="text-[10px] text-blue-300 mt-0.5">Need: {t.required_skills}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300 bg-white/5 border border-white/10 px-2 py-1 rounded">
                      {t.current_member_count}/{t.max_members}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Registration Sidebar) */}
        <div className="space-y-6">
          <div className="liquid-glass rounded-2xl p-6 border border-white/10 shadow-2xl space-y-5 sticky top-24 backdrop-blur-2xl">
            <h3 className="font-black text-white text-lg">Event Registration</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Registration Deadline:</span>
                <span className="font-bold text-rose-400">
                  {new Date(event.registration_deadline).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Team Size:</span>
                <span className="font-bold text-slate-200">
                  {event.team_size_min === event.team_size_max
                    ? `${event.team_size_min} Member(s)`
                    : `${event.team_size_min}–${event.team_size_max} Members`}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Total Enrolled:</span>
                <span className="font-bold text-slate-200">{event.registration_count || 0} Students</span>
              </div>
              {event.prize_pool && (
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-slate-400">Prize Pool:</span>
                  <span className="font-bold text-amber-400">{event.prize_pool}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isRegistered ? (
              <div className="space-y-2">
                <div className="w-full py-3 rounded-xl bg-emerald-600/80 border border-emerald-400/40 text-white font-bold text-xs text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Registered (ID: {registrationSuccess?.registration_number || user_registration?.registration_number})
                </div>
                <Link
                  to="/applications"
                  className="w-full py-2.5 rounded-xl liquid-glass border border-white/15 hover:bg-white/10 text-slate-200 font-semibold text-xs text-center block transition"
                >
                  View in My Applications
                </Link>
              </div>
            ) : event.registration_status === 'UNCONFIRMED' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl liquid-glass border border-amber-500/40 text-xs text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    Registration Details Pending
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Official dates (29–30 January 2027) are confirmed on the organizer website. Registration forms and problem statements are not yet open. Parallel local registration is disabled.
                  </p>
                </div>

                <a
                  href={event.official_event_url || event.source_url || 'https://www.innerve.tech/'}
                  target="_blank"
                  rel="noreferrer"
                  className="clay-btn-blue w-full py-3 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  View Official Event Site <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : event.registration_mode === 'EXTERNAL' ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl liquid-glass border border-blue-500/40 text-xs text-blue-200">
                  Registration is hosted directly on the organizer's official website.
                </div>
                <a
                  href={event.official_event_url || event.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="clay-btn-rose w-full py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2"
                >
                  Apply on Official Portal <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <button
                onClick={() => setRegisterModalOpen(true)}
                className="clay-btn-blue w-full py-3.5 rounded-xl text-white font-bold text-xs tracking-wider uppercase shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                Register Now
              </button>
            )}

            {/* Team Matching CTA */}
            {event.team_size_max > 1 && (
              <div className="p-4 rounded-xl liquid-glass border border-amber-500/30 text-xs space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Need Teammates?
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Our matching engine searches skilled AIT peers matching your stack with compatibility scoring.
                </p>
                <Link
                  to={`/teams?event_id=${event.id}`}
                  className="inline-block font-bold text-rose-400 hover:text-rose-300 underline text-[11px]"
                >
                  Find Matching Teammates (94% Fit) →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg liquid-glass rounded-3xl shadow-2xl border border-white/20 overflow-hidden backdrop-blur-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div>
                <h3 className="font-bold text-white text-base">Complete Registration</h3>
                <p className="text-xs text-slate-400">{event.title}</p>
              </div>
              <button onClick={() => setRegisterModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.full_name || ''}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Student ID</label>
                  <input
                    type="text"
                    disabled
                    value={user?.student_id || 'AIT Student'}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Branch & Year</label>
                  <input
                    type="text"
                    disabled
                    value={`${user?.branch || 'Engineering'} • Yr ${user?.year || 3}`}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300"
                  />
                </div>
              </div>

              {/* Team selection if event allows teams */}
              {event.team_size_max > 1 && teams.length > 0 && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Join an Existing Team (Optional)</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#030712] border border-white/15 text-white"
                  >
                    <option value="">Register Individually / Form Team Later</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Leader: {t.leader_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">T-Shirt Size</label>
                  <select
                    value={tshirtSize}
                    onChange={(e) => setTshirtSize(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#030712] border border-white/15 text-white"
                  >
                    <option value="S">S (Small)</option>
                    <option value="M">M (Medium)</option>
                    <option value="L">L (Large)</option>
                    <option value="XL">XL (Extra Large)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Dietary Preference</label>
                  <select
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#030712] border border-white/15 text-white"
                  >
                    <option value="Veg">Vegetarian</option>
                    <option value="Non-Veg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">GitHub or Portfolio URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder={user?.github_url || 'https://github.com/...'}
                  className="w-full p-2.5 rounded-xl bg-[#030712] border border-white/15 text-white placeholder-slate-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={registering}
                  className="clay-btn-blue w-full py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
