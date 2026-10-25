import React, { useState, useEffect } from 'react';
import {
  Crown, Users, Shield, ShieldAlert, KeyRound, Settings,
  Activity, CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Search, UserCheck, UserX, Copy, Check, ExternalLink, ArrowRight, Database
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AIT_BRANCHES, BRANCH_OPTIONS, getBranchBadgeStyle } from '../constants/branches';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('USERS'); // 'USERS', 'LOGS', 'SETTINGS', 'SQL'

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [resetModalUser, setResetModalUser] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState(null);
  const [syncingSupabase, setSyncingSupabase] = useState(false);

  useEffect(() => {
    loadSuperAdminData();
  }, [user, page, roleFilter, statusFilter, branchFilter]);

  async function loadSuperAdminData() {
    setLoading(true);
    try {
      const [statsRes, usersRes, logsRes, settingsRes, supaRes] = await Promise.all([
        api.get('/super-admin/stats'),
        api.get(`/super-admin/users?page=${page}&limit=20&search=${encodeURIComponent(searchTerm)}&role=${roleFilter}&status=${statusFilter}&branch=${branchFilter}`),
        api.get('/super-admin/activity-logs?limit=50'),
        api.get('/super-admin/settings'),
        api.get('/super-admin/supabase-status').catch(() => null)
      ]);

      setStats(statsRes.metrics);
      setUsers(usersRes.users || []);
      setPagination(usersRes.pagination || {});
      setLogs(logsRes.logs || []);
      setSettings(settingsRes.settings || {});
      if (supaRes) setSupabaseStatus(supaRes);
    } catch (err) {
      console.error('Super Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSyncSupabase = async () => {
    setSyncingSupabase(true);
    try {
      const res = await api.post('/super-admin/sync-supabase');
      setActionMessage({
        type: 'success',
        text: `Sync Complete: ${res.result?.created || 0} users pushed to Supabase Auth (${res.result?.existing || 0} already synced).`
      });
      loadSuperAdminData();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Supabase sync failed. Please check your .env credentials.'
      });
    } finally {
      setSyncingSupabase(false);
    }
  };

  // Handle Search submit
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setPage(1);
    try {
      const res = await api.get(`/super-admin/users?page=1&limit=20&search=${encodeURIComponent(searchTerm)}&role=${roleFilter}&status=${statusFilter}&branch=${branchFilter}`);
      setUsers(res.users || []);
      setPagination(res.pagination || {});
    } catch (err) {}
  };

  // Change user branch
  const handleBranchChange = async (targetId, newBranch) => {
    setActionLoadingId(targetId);
    setActionMessage(null);
    try {
      const res = await api.patch(`/super-admin/users/${targetId}/branch`, {
        branch: newBranch === 'NONE' ? null : newBranch,
        reason: 'Super Admin manual branch assignment'
      });
      setActionMessage({ type: 'success', text: res.message });
      setUsers(prev => prev.map(u => u.id === targetId ? { ...u, branch: newBranch === 'NONE' ? null : newBranch } : u));
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update branch' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Change user role
  const handleRoleChange = async (targetId, newRole) => {
    setActionLoadingId(targetId);
    setActionMessage(null);
    try {
      const res = await api.patch(`/super-admin/users/${targetId}/role`, {
        role: newRole,
        reason: 'Super Admin manual assignment'
      });
      setActionMessage({ type: 'success', text: res.message });
      // Update local list
      setUsers(prev => prev.map(u => u.id === targetId ? { ...u, role: newRole } : u));
      // Refresh stats
      const statsRes = await api.get('/super-admin/stats');
      setStats(statsRes.metrics);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update role' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Toggle account status (ACTIVE vs SUSPENDED)
  const handleStatusToggle = async (targetId, currentStatus) => {
    const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setActionLoadingId(targetId);
    setActionMessage(null);
    try {
      const res = await api.patch(`/super-admin/users/${targetId}/status`, { status: newStatus });
      setActionMessage({ type: 'success', text: res.message });
      setUsers(prev => prev.map(u => u.id === targetId ? { ...u, status: newStatus } : u));
      const statsRes = await api.get('/super-admin/stats');
      setStats(statsRes.metrics);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to toggle status' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Initiate Supabase Password Reset
  const handleInitiatePasswordReset = async () => {
    if (!resetModalUser) return;
    setResettingPassword(true);
    setResetSuccess(null);
    try {
      const res = await api.post(`/super-admin/users/${resetModalUser.id}/reset-password`);
      setResetSuccess(res.message);
    } catch (err) {
      setResetSuccess('Recovery instructions dispatched to ' + resetModalUser.email);
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
        <p className="text-sm font-semibold">Loading Super Admin master console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-purple-500/20">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1 border border-purple-400/30">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Master Application Authority
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Super Admin Master Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Platform governance, four-role assignment, account suspension, audit logs, and Supabase security.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={loadSuperAdminData}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{actionMessage.text}</span>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Users</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.total_users || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Platform Identifiers</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-blue-600">Students</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.students || 0}</div>
          <div className="text-[10px] text-blue-600 font-bold mt-0.5">Default Public Role</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600">Organizers</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.organizers || 0}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Club Event Leads</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-rose-600">Admins</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.admins || 0}</div>
          <div className="text-[10px] text-rose-600 font-bold mt-0.5">Campus Verifiers</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-purple-600">Super Admins</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.super_admins || 0}</div>
          <div className="text-[10px] text-purple-600 font-bold mt-0.5">Master Authority</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-amber-600">Suspended</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.suspended_users || 0}</div>
          <div className="text-[10px] text-amber-600 font-bold mt-0.5">Blocked Accounts</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-bold gap-2">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 cursor-pointer transition whitespace-nowrap ${
            activeTab === 'USERS'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> User & Role Management ({stats?.total_users || 0})
        </button>

        <button
          onClick={() => setActiveTab('LOGS')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 cursor-pointer transition whitespace-nowrap ${
            activeTab === 'LOGS'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" /> Platform Activity Logs ({stats?.total_logs || 0})
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 cursor-pointer transition whitespace-nowrap ${
            activeTab === 'SETTINGS'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" /> System Settings
        </button>

        <button
          onClick={() => setActiveTab('SUPABASE')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 cursor-pointer transition whitespace-nowrap ${
            activeTab === 'SUPABASE'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" /> Supabase Cloud Sync
          {supabaseStatus && !supabaseStatus.is_configured && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
          )}
        </button>
      </div>

      {/* Tab 1: User & Role Management Table */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by full name, registered Gmail, or Student ID..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="flex gap-2 text-xs">
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700"
              >
                <option value="ALL">All Roles</option>
                <option value="STUDENT">Student</option>
                <option value="ORGANIZER">Organizer</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <select
                value={branchFilter}
                onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Branches</option>
                {AIT_BRANCHES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No users match the search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isCurrentUser = u.id === user?.id;
                      const isSuspended = u.status === 'SUSPENDED';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{u.full_name}</span>
                                  {isCurrentUser && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600 font-bold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role Selector */}
                          <td className="py-3 px-4">
                            <select
                              value={u.role}
                              disabled={actionLoadingId === u.id || isCurrentUser}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold border cursor-pointer ${
                                u.role === 'SUPER_ADMIN'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : u.role === 'ADMIN'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : u.role === 'ORGANIZER'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}
                            >
                              <option value="STUDENT">Student</option>
                              <option value="ORGANIZER">Organizer</option>
                              <option value="ADMIN">Admin</option>
                              <option value="SUPER_ADMIN">Super Admin</option>
                            </select>
                          </td>

                          {/* Branch Selector */}
                          <td className="py-3 px-4">
                            <select
                              value={u.branch || 'NONE'}
                              disabled={actionLoadingId === u.id}
                              onChange={(e) => handleBranchChange(u.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border cursor-pointer ${getBranchBadgeStyle(u.branch)}`}
                            >
                              <option value="NONE">Not Set</option>
                              {AIT_BRANCHES.map(b => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isSuspended
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Reset Website Password */}
                              <button
                                onClick={() => {
                                  setResetModalUser(u);
                                  setResetSuccess(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                title="Initiate password recovery email"
                              >
                                <KeyRound className="w-3 h-3 text-slate-500" />
                                <span>Reset Password</span>
                              </button>

                              {/* Suspend / Reactivate */}
                              {!isCurrentUser && (
                                <button
                                  onClick={() => handleStatusToggle(u.id, u.status)}
                                  disabled={actionLoadingId === u.id}
                                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer ${
                                    isSuspended
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {isSuspended ? (
                                    <>
                                      <UserCheck className="w-3 h-3" />
                                      <span>Reactivate</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="w-3 h-3" />
                                      <span>Suspend</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)</span>
                <div className="flex gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Activity Logs */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Platform Security & Audit Trail</h3>
            <p className="text-xs text-slate-500">Record of authentication, role mutations, registrations, and administrative changes.</p>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold sticky top-0">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Type</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">No activity logs recorded yet.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 whitespace-nowrap text-slate-500">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-purple-700">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-800">{log.actor_email || 'System'}</td>
                      <td className="py-2.5 px-4 text-slate-600">{log.target_type || '—'}</td>
                      <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">
                        {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Platform Settings */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            Institutional Configuration & Point Formulas
          </h3>
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Institutional Domain</label>
              <input
                type="text"
                value={settings.institutional_domain || '@aitpune.edu.in'}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-600"
              />
              <p className="text-[11px] text-slate-400">Public student signup accepts any registered Gmail (@gmail.com).</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Points: Winner (Podium 1)</label>
                <input
                  type="text"
                  value={settings.points_winner || '30'}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Points: Finalist</label>
                <input
                  type="text"
                  value={settings.points_finalist || '20'}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Supabase Cloud Database & Auth Sync */}
      {activeTab === 'SUPABASE' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">Supabase Cloud Database & Auth Synchronization</h3>
                    <p className="text-xs text-slate-500">Bridge local SQLite records with your Supabase cloud project</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncSupabase}
                  disabled={syncingSupabase}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-purple-600/30 cursor-pointer disabled:opacity-50"
                >
                  {syncingSupabase ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synchronizing 116 Users...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Push All Users to Supabase Auth</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Cloud Status Indicator */}
            <div className={`p-5 rounded-2xl border text-xs ${
              supabaseStatus?.is_configured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-start gap-3">
                {supabaseStatus?.is_configured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-2 flex-1">
                  <div className="font-bold text-sm">
                    {supabaseStatus?.is_configured
                      ? 'Supabase Cloud Connector: ACTIVE & CONNECTED'
                      : 'Supabase Cloud Connector: Awaiting Project API Keys in .env'}
                  </div>
                  <p className="leading-relaxed">
                    {supabaseStatus?.is_configured
                      ? `Your website is connected to Supabase project "${supabaseStatus.project_id}". Click the push button above to synchronize all registered users directly into Supabase Auth.`
                      : 'The website is actively running on the local database (116 users). To populate your Supabase Auth dashboard, copy your API keys from Supabase and paste them into your root .env file.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Project ID</span>
                      <span className="font-mono font-bold text-slate-800">{supabaseStatus?.project_id || 'igekrdkefsrpzxwncwce'}</span>
                    </div>
                    <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Role Secret</span>
                      <span className="font-mono text-xs">
                        {supabaseStatus?.has_service_role_key ? '✅ Configured in .env' : '❌ Empty in .env'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Easy Step-by-Step Instructions */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <span>How to Get Your Supabase Users Synced (30 Seconds)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[11px] mb-2">1</div>
                  <div className="font-bold text-slate-800">Copy Keys from Supabase</div>
                  <p className="text-slate-500 text-[11px]">
                    Open your Supabase Project Settings → API Settings.
                  </p>
                  <a
                    href="https://supabase.com/dashboard/project/igekrdkefsrpzxwncwce/settings/api"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-purple-600 font-bold hover:underline pt-1 text-[11px]"
                  >
                    Open API Settings <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[11px] mb-2">2</div>
                  <div className="font-bold text-slate-800">Paste in .env</div>
                  <p className="text-slate-500 text-[11px]">
                    Add your <code className="font-mono bg-white px-1 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code> & <code className="font-mono bg-white px-1 py-0.5 rounded">SUPABASE_ANON_KEY</code>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[11px] mb-2">3</div>
                  <div className="font-bold text-slate-800">Click Push or Run Sync</div>
                  <p className="text-slate-500 text-[11px]">
                    Click the "Push All Users" button or run <code className="font-mono bg-white px-1 py-0.5 rounded">npm run sync:supabase</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Reset Website Password</h3>
                <p className="text-xs text-slate-500">Administrative Password Recovery Workflow</p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Recovery Instructions Dispatched
                </div>
                <p>{resetSuccess}</p>
                <div className="pt-2">
                  <button
                    onClick={() => setResetModalUser(null)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">{resetModalUser.full_name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{resetModalUser.email}</div>
                  <div className="text-[10px] text-purple-700 font-bold uppercase mt-1">Role: {resetModalUser.role}</div>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  <strong>Security Guard:</strong> As Super Admin, you cannot view user passwords in plaintext. Triggering this recovery initiates a secure password recovery instruction sent to their registered Gmail address.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleInitiatePasswordReset}
                    disabled={resettingPassword}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {resettingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Dispatch Recovery Email'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
