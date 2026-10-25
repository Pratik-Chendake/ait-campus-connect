import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Clock, Trophy, Users, ShieldCheck, CheckCheck, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function NotificationsPage() {
  const { user, refreshUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifs();
  }, [user]);

  async function loadNotifs() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      refreshUser();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all', {});
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
      refreshUser();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getIcon = (type) => {
    if (type === 'ACHIEVEMENT') return <Trophy className="w-4 h-4 text-amber-500" />;
    if (type === 'INVITATION') return <Users className="w-4 h-4 text-blue-500" />;
    if (type === 'VERIFICATION') return <ShieldCheck className="w-4 h-4 text-purple-500" />;
    if (type === 'DEADLINE') return <Clock className="w-4 h-4 text-rose-500" />;
    return <Bell className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-2">
            <Bell className="w-3.5 h-3.5 text-blue-600" />
            Alerts & Deadline Center
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notifications</h1>
        </div>

        {notifications.some(n => n.is_read === 0) && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" /> Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm">Loading alerts...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">You're all caught up!</h3>
          <p className="text-xs text-slate-500">No new alerts or deadline reminders right now.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 transition flex items-start justify-between gap-4 ${
                n.is_read === 0 ? 'bg-blue-50/40' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                    {n.is_read === 0 && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] font-mono text-slate-400 block pt-0.5">
                    {n.created_at}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.link && (
                  <Link
                    to={n.link}
                    onClick={() => handleMarkAsRead(n.id)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    View →
                  </Link>
                )}
                {n.is_read === 0 && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Mark read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
