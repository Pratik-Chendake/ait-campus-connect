import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, MapPin, Users, CheckCircle, Clock, XCircle,
  ExternalLink, ChevronRight, Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function MyApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL'); // 'ALL', 'REGISTERED', 'COMPLETED', 'CANCELLED'

  useEffect(() => {
    loadApplications();
  }, [user]);

  async function loadApplications() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/events/applications/my');
      setApplications(res.applications || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;
    try {
      await api.post(`/events/${eventId}/cancel-registration`, {});
      loadApplications();
    } catch (err) {
      alert('Failed to cancel registration');
    }
  };

  const filtered = applications.filter((app) => {
    if (tab === 'ALL') return true;
    return app.registration_status === tab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-2">
          <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
          AIT Official Enrolled Registrations
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          My Applications
        </h1>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">
          Track official event registrations, verify unique enrollment numbers, and check status of hackathon submissions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold w-fit">
        {['ALL', 'REGISTERED', 'COMPLETED', 'CANCELLED'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-lg transition capitalize ${
              tab === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.toLowerCase()} ({applications.filter(a => t === 'ALL' || a.registration_status === t).length})
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm">Loading applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No applications found in this tab</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Discover hackathons and college fests to enroll.
          </p>
          <Link
            to="/opportunities"
            className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs inline-block"
          >
            Explore Opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div
              key={app.registration_id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {app.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    app.registration_status === 'REGISTERED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : app.registration_status === 'COMPLETED'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {app.registration_status}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    ID: {app.registration_number}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{app.title}</h3>

                <p className="text-xs text-slate-500">
                  Organizer: <b className="text-slate-700">{app.organizer_name}</b> {app.team_name ? `• Team: ${app.team_name}` : '• Individual Participation'}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                  <span>Starts: <b className="text-slate-800">{new Date(app.event_start_date).toLocaleDateString()}</b></span>
                  <span>Venue: <b className="text-slate-800">{app.venue}</b></span>
                  <span>Registered: <b className="text-slate-800">{new Date(app.registered_at).toLocaleDateString()}</b></span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                {app.registration_status === 'REGISTERED' && (
                  <button
                    onClick={() => handleCancel(app.event_id)}
                    className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                )}
                <Link
                  to={`/event/${app.event_id}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  Event Details <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
