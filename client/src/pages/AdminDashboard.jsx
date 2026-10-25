import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Award, Calendar, BookOpen, Settings,
  BarChart2, FileText, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, Database, Copy, Check, ExternalLink, Trophy, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const SUPABASE_SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unstop_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    organizer TEXT,
    opportunity_type TEXT DEFAULT 'hackathons',
    url TEXT NOT NULL,
    banner_url TEXT,
    deadline TIMESTAMPTZ,
    deadline_text TEXT,
    eligibility TEXT,
    registration_fee TEXT,
    location TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_unstop_id ON public.opportunities(unstop_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON public.opportunities(deadline);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
ON public.opportunities
FOR SELECT
TO anon, authenticated
USING (true);`;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('METRICS'); // 'METRICS', 'USERS', 'RESEARCH', 'UNSTOP', 'SETTINGS', 'AUDIT'
  const [researchCandidates, setResearchCandidates] = useState([]);
  const [researchSummary, setResearchSummary] = useState(null);
  const [candidateFilter, setCandidateFilter] = useState('ALL');

  // Unstop Sync state
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [forceFresh, setForceFresh] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Settings form
  const [domain, setDomain] = useState('@aitpune.edu.in');
  const [pointsWinner, setPointsWinner] = useState('30');
  const [pointsFinalist, setPointsFinalist] = useState('20');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [user]);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [statsRes, usersRes, logsRes, settingsRes, researchRes, summaryRes, syncRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/audit-logs'),
        api.get('/admin/settings'),
        api.get('/admin/research/candidates').catch(() => ({ candidates: [] })),
        api.get('/admin/research/summary').catch(() => ({ summary: null })),
        api.get('/opportunities/sync-status').catch(() => ({ status: 'IDLE' }))
      ]);
      setStats(statsRes);
      setUsersList(usersRes.users || []);
      setAuditLogs(logsRes.audit_logs || []);
      setSettings(settingsRes.settings || {});
      setResearchCandidates(researchRes.candidates || []);
      setResearchSummary(summaryRes.summary || null);
      setSyncStatus(syncRes);

      if (settingsRes.settings?.institutional_domain) {
        setDomain(settingsRes.settings.institutional_domain);
      }
      if (settingsRes.settings?.points_winner) {
        setPointsWinner(settingsRes.settings.points_winner);
      }
      if (settingsRes.settings?.points_finalist) {
        setPointsFinalist(settingsRes.settings.points_finalist);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleTriggerSync = async () => {
    setSyncLoading(true);
    setSyncMsg(null);
    try {
      const res = await api.post('/opportunities/sync', {
        maxItems: 50,
        forceFresh
      });
      setSyncMsg({ type: 'success', text: `Sync successful! Processed ${res.result?.upserted || 0} opportunities.` });
      // Reload sync status
      const updated = await api.get('/opportunities/sync-status');
      setSyncStatus(updated);
    } catch (err) {
      setSyncMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Sync failed.' });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleApproveCandidate = async (candidateId) => {
    try {
      await api.post(`/admin/research/candidates/${candidateId}/approve`, {});
      setResearchCandidates(researchCandidates.map(c => c.id === candidateId ? { ...c, status: 'APPROVED' } : c));
      alert('Candidate approved for publication');
    } catch (err) {
      alert('Failed to approve candidate');
    }
  };

  const handleRejectCandidate = async (candidateId) => {
    const reason = prompt('Please enter rejection or conflict reason:');
    if (!reason) return;
    try {
      await api.post(`/admin/research/candidates/${candidateId}/reject`, { rejection_reason: reason });
      setResearchCandidates(researchCandidates.map(c => c.id === candidateId ? { ...c, status: 'REJECTED', reason } : c));
      alert('Candidate rejected');
    } catch (err) {
      alert('Failed to reject candidate');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert(`User role changed to ${newRole}`);
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.post('/admin/settings', {
        institutional_domain: domain,
        points_winner: pointsWinner,
        points_finalist: pointsFinalist
      });
      alert('Platform settings updated successfully!');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Super Administrator Console Only</h2>
        <p className="text-xs text-slate-500">
          Switch role to <b>Super Admin</b> in the top navigation role switcher to access institutional analytics, users, and settings.
        </p>
      </div>
    );
  }

  const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-900 text-xs font-bold mb-2">
          <Shield className="w-3.5 h-3.5 text-rose-600" />
          AIT Institutional Super Admin Console
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Platform Governance & Analytics
        </h1>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">
          Directorial oversight, student participation charts, role management, audit logs, and domain configuration.
        </p>
      </div>

      {/* Admin Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold w-fit">
        <button
          onClick={() => setActiveTab('METRICS')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'METRICS' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
          }`}
        >
          Institutional Metrics & Charts
        </button>
        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'USERS' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
          }`}
        >
          User Management ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('RESEARCH')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'RESEARCH' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-600'
          }`}
        >
          Research Moderation ({researchCandidates.filter(c => c.status === 'PENDING_REVIEW').length})
        </button>
        <button
          onClick={() => setActiveTab('UNSTOP')}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'UNSTOP' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-blue-600" />
          Unstop Sync Engine
        </button>
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'SETTINGS' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
          }`}
        >
          Platform Settings
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'AUDIT' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600 mb-2" />
          <p className="text-sm">Generating institutional analytics...</p>
        </div>
      ) : activeTab === 'METRICS' ? (
        <div className="space-y-8">
          {/* Key Stat Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</div>
              <div className="text-3xl font-black text-blue-700 mt-1">{stats?.metrics?.total_students || 0}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Undergraduate Enrolled</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Registrations</div>
              <div className="text-3xl font-black text-emerald-600 mt-1">{stats?.metrics?.total_registrations || 0}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Cumulative Participation</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Achievements</div>
              <div className="text-3xl font-black text-amber-500 mt-1">{stats?.metrics?.verified_achievements || 0}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Faculty Authenticated</div>
            </div>
            <Link
              to="/verification"
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md transition group block"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-600 transition">Pending Verification</div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition" />
              </div>
              <div className="text-3xl font-black text-purple-600 mt-1">{stats?.metrics?.pending_verification || 0}</div>
              <div className="text-[10px] text-purple-600 font-semibold mt-0.5">Open Verification Center →</div>
            </Link>
          </div>

          {/* Visual Charts (Section 83: Branch & Year-wise distribution) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Branch Distribution Bar Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900">Student Participation by Branch</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.charts?.branch_distribution || []}>
                    <XAxis dataKey="branch" tick={{ fontSize: 10 }} interval={0} angle={-10} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="student_count" fill="#2563eb" radius={[6, 6, 0, 0]} name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Event Category Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900">Opportunities by Category</h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.charts?.category_distribution || []}
                      dataKey="event_count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(stats?.charts?.category_distribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'USERS' ? (
        /* Users Management Table */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Student / User</th>
                  <th className="p-4">Student ID</th>
                  <th className="p-4">Branch & Year</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{u.full_name} <br /><span className="text-slate-400 font-normal">{u.email}</span></td>
                    <td className="p-4 font-mono text-slate-500">{u.student_id || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{u.branch || (u.role === 'STUDENT' ? 'Not Set' : 'Administration')} {u.year ? `• Yr ${u.year}` : ''}</td>
                    <td className="p-4 font-black text-amber-600">★ {u.contribution_score || 0}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        u.role === 'ADMIN' ? 'bg-rose-100 text-rose-800' :
                        u.role === 'FACULTY' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'ORGANIZER' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs text-slate-700"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="ORGANIZER">ORGANIZER</option>
                        <option value="FACULTY">FACULTY</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'RESEARCH' ? (
        /* Research Moderation & Ingestion Queue */
        <div className="space-y-6">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canonical Clubs</div>
              <div className="text-2xl font-black text-slate-900 mt-1">23 / 23</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ 100% Sourced Directory</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evidence Sources</div>
              <div className="text-2xl font-black text-blue-600 mt-1">{researchSummary?.sources_tracked || 6}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Primary & Official Sites</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Historical Archives</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{researchSummary?.historical_archives || 2}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">AY 2025-26 Report Citations</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moderation Queue</div>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {researchCandidates.filter(c => c.status === 'PENDING_REVIEW').length}
              </div>
              <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Withheld From Public APIs</div>
            </div>
          </div>

          {/* Provenance & Compliance Notice */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center gap-2 text-amber-800">
              <Shield className="w-4 h-4 text-amber-600 shrink-0" />
              Strict AY 2026–27 Research Governance & Provenance Policy
            </div>
            <p className="text-[11px] leading-relaxed">
              In accordance with institutional research integrity standards, claims from secondary research PDFs or unauthenticated circulars are withheld in this moderation queue. Currently published AY 2026-27 student secretary appointments: <b>0</b> (by design, until primary appointment circular AIT/324/Appt-St-IC/Prin is authenticated).
            </p>
          </div>

          {/* Candidates Queue Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <h3 className="font-bold text-sm text-slate-900">
                Candidate Ingestion Claims & Conflict Queue ({researchCandidates.length})
              </h3>
              <div className="flex gap-1 text-xs">
                {['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setCandidateFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      candidateFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {researchCandidates
                .filter(c => candidateFilter === 'ALL' || c.status === candidateFilter)
                .map((c) => (
                  <div key={c.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                          {c.type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">Key: {c.review_key}</span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{c.label}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <b>Withheld Reason:</b> {c.reason}
                      </p>
                      {c.source_citation && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          Citation: {c.source_citation}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {c.status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            onClick={() => handleApproveCandidate(c.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
                          >
                            Approve Claim
                          </button>
                          <button
                            onClick={() => handleRejectCandidate(c.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-semibold transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {c.status !== 'PENDING_REVIEW' && (
                        <span className="text-[11px] text-slate-400 font-medium italic">
                          Action completed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'UNSTOP' ? (
        /* Unstop Sync Engine & Supabase PostgreSQL Panel */
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  Apify Scraper & Supabase PostgreSQL Pipeline
                </div>
                <h3 className="font-bold text-xl text-slate-900 tracking-tight">
                  Unstop Opportunity Synchronization Console
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Automated 24-hour ingestion pipeline harvesting public hackathons from Unstop, validating schemas via Zod, assessing AIT Pune eligibility, and syncing to Supabase.
                </p>
              </div>

              {/* Sync Action Trigger */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceFresh}
                    onChange={(e) => setForceFresh(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Force Fresh Run</span>
                </label>

                <button
                  onClick={handleTriggerSync}
                  disabled={syncLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                  {syncLoading ? 'Synchronizing...' : 'Sync Opportunities Now'}
                </button>
              </div>
            </div>

            {/* Sync Feedback Message */}
            {syncMsg && (
              <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
                syncMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {syncMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{syncMsg.text}</span>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Synced</span>
                <p className="text-2xl font-black text-slate-900">{syncStatus?.metrics?.unstop_scraped || 0}</p>
                <span className="text-[10px] text-slate-500">Unstop hackathons live</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">AIT Verified</span>
                <p className="text-2xl font-black text-emerald-900">{syncStatus?.metrics?.verified_eligible_ait || 0}</p>
                <span className="text-[10px] text-emerald-600">Eligible for AIT engineers</span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
                <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Apify Actor</span>
                <p className="text-xs font-mono font-bold text-blue-900 truncate">hipersoft/unstop-scraper</p>
                <span className="text-[10px] text-blue-600">Verified & Active</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sync Status</span>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {syncStatus?.status || 'COMPLETED'}
                </p>
                <span className="text-[10px] text-slate-400">
                  {syncStatus?.latest_sync?.started_at ? new Date(syncStatus.latest_sync.started_at).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Execution Telemetry Log */}
          {syncStatus?.latest_sync && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 text-xs">
              <h4 className="font-bold text-sm text-slate-900">Latest Sync Execution Telemetry</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block">Sync Run ID</span>
                  <span className="font-bold text-slate-800 truncate block">{syncStatus.latest_sync.sync_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Ingested</span>
                  <span className="font-bold text-blue-700">{syncStatus.latest_sync.total_fetched} items</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Upserted / Updated</span>
                  <span className="font-bold text-emerald-700">{(syncStatus.latest_sync.inserted_records || 0) + (syncStatus.latest_sync.updated_records || 0)} records</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Execution Finished</span>
                  <span className="text-slate-600">{syncStatus.latest_sync.finished_at ? new Date(syncStatus.latest_sync.finished_at).toLocaleTimeString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Supabase PostgreSQL Schema Script Viewer */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-base text-white">Supabase PostgreSQL Schema Setup</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paste into your Supabase Dashboard SQL Editor (<code>https://supabase.com/dashboard/project/igekrdkefsrpzxwncwce/sql</code>) to enable native cloud PostgreSQL storage.
                </p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition flex items-center gap-1.5 shrink-0"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'SQL Copied!' : 'Copy Supabase SQL'}
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 border border-slate-800">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      ) : activeTab === 'SETTINGS' ? (
        /* Platform Settings Form */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            Institutional Configuration
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Required Institutional Email Domain</label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="@aitpune.edu.in"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">Restricts student registration to this verified institute domain.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Winner Points</label>
                <input
                  type="number"
                  value={pointsWinner}
                  onChange={(e) => setPointsWinner(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Finalist Points</label>
                <input
                  type="number"
                  value={pointsFinalist}
                  onChange={(e) => setPointsFinalist(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
              >
                {savingSettings ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Audit Logs */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700">{log.action}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-700">{log.details}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Actor: {log.actor_name || 'System Admin'} ({log.actor_role || 'ADMIN'})
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-400">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
