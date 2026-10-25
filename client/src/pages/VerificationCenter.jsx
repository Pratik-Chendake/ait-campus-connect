import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Check, X, ExternalLink, Clock, AlertCircle,
  FileText, Award, BookOpen, Loader2, CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import AchievementEvidenceSearch from '../components/AchievementEvidenceSearch';

export default function VerificationCenter() {
  const { user } = useAuth();
  const [pendingAchievements, setPendingAchievements] = useState([]);
  const [pendingResearch, setPendingResearch] = useState([]);
  const [recentlyReviewed, setRecentlyReviewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ACHIEVEMENTS');

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetAchId, setTargetAchId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadQueue();
  }, [user]);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await api.get('/verification/pending');
      setPendingAchievements(res.pending_achievements || []);
      setPendingResearch(res.pending_research || []);
      setRecentlyReviewed(res.recently_reviewed || []);
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (achId) => {
    try {
      await api.post(`/verification/achievements/${achId}/approve`, {});
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      loadQueue();
      alert('Achievement authenticated and marked ✓ AIT VERIFIED!');
    } catch (err) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleOpenReject = (achId) => {
    setTargetAchId(achId);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return alert('Feedback reason is required');
    try {
      await api.post(`/verification/achievements/${targetAchId}/reject`, { reason: rejectReason });
      setRejectModalOpen(false);
      loadQueue();
      alert('Submission rejected with feedback sent to student.');
    } catch (err) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleApproveResearch = async (paperId) => {
    try {
      await api.post(`/verification/research/${paperId}/approve`, {});
      loadQueue();
      alert('Research paper verified!');
    } catch (err) {
      alert(err.message || 'Verification failed');
    }
  };

  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Faculty & Institutional Authority Only</h2>
        <p className="text-xs text-slate-500">
          You are currently signed in as {user?.role || 'Guest'}. Switch role to <b>Faculty Verifier</b> using the demo switcher in the top navigation.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-900 text-xs font-bold mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          AIT Faculty & Institutional Verification Authority
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Verification Center
        </h1>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">
          Review student achievement documents, authenticated certificates, and IEEE research submissions. Validated items receive the official <b>✓ AIT Verified</b> seal.
        </p>
      </div>

      {/* Queue Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold w-fit">
        <button
          onClick={() => setActiveTab('ACHIEVEMENTS')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'ACHIEVEMENTS' ? 'bg-white text-purple-800 shadow-xs font-bold' : 'text-slate-600'
          }`}
        >
          Pending Achievements ({pendingAchievements.length})
        </button>
        <button
          onClick={() => setActiveTab('RESEARCH')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'RESEARCH' ? 'bg-white text-purple-800 shadow-xs font-bold' : 'text-slate-600'
          }`}
        >
          Pending Research ({pendingResearch.length})
        </button>
        <button
          onClick={() => setActiveTab('RECENT')}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === 'RECENT' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
          }`}
        >
          Audit History ({recentlyReviewed.length})
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
          <p className="text-sm">Loading verification queue...</p>
        </div>
      ) : activeTab === 'ACHIEVEMENTS' ? (
        pendingAchievements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-base text-slate-900">All caught up!</h3>
            <p className="text-xs text-slate-500">No pending student achievement submissions requiring verification right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAchievements.map((ach) => (
              <div
                key={ach.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col gap-5"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-3xl">
                    {/* Student details */}
                    <div className="flex items-center gap-3">
                      <img
                        src={ach.student_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={ach.student_name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-sm text-slate-900">{ach.student_name}</div>
                        <div className="text-xs text-slate-500">
                          {ach.branch || 'AIT'} • Year {ach.year || 1} • {ach.student_id || 'ID Pending'} ({ach.student_email})
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                          {ach.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {ach.level} Level
                        </span>
                        <span className="text-xs font-bold text-blue-700">{ach.position}</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">{ach.title}</h3>
                      <p className="text-xs text-slate-500">
                        Event: <b className="text-slate-800">{ach.event_name}</b> • Host: <b className="text-slate-800">{ach.organization}</b> • Conferred: {ach.date}
                      </p>

                      {ach.description && (
                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          {ach.description}
                        </p>
                      )}
                    </div>

                    {ach.certificate_url && (
                      <div className="pt-1">
                        <a
                          href={ach.certificate_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Uploaded Proof / Certificate
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Faculty Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleOpenReject(ach.id)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition"
                    >
                      Reject with Feedback
                    </button>
                    <button
                      onClick={() => handleApprove(ach.id)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Authenticate & Verify
                    </button>
                  </div>
                </div>

                {/* Evidence Verification Search Widget (Google Search / DuckDuckGo) */}
                <AchievementEvidenceSearch achievement={ach} />
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'RESEARCH' ? (
        pendingResearch.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-base text-slate-900">All research verified!</h3>
            <p className="text-xs text-slate-500">No pending publications requiring verification.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingResearch.map((paper) => (
              <div
                key={paper.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="text-xs text-slate-500">
                    Submitted by: <b className="text-slate-800">{paper.student_name}</b> ({paper.branch || 'AIT'} • Year {paper.year || 1})
                  </div>
                  <h3 className="text-base font-bold text-slate-900">"{paper.title}"</h3>
                  <p className="text-xs text-slate-600">Authors: {paper.authors}</p>
                  <p className="text-xs text-slate-500">Forum: {paper.conference_or_journal} ({paper.publication_date})</p>
                  {paper.abstract && <p className="text-xs text-slate-600 pt-1 line-clamp-2">{paper.abstract}</p>}
                </div>

                <div className="shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleApproveResearch(paper.id)}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    Verify Publication (+30 Pts)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Audit History */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {recentlyReviewed.map((rev) => (
              <div key={rev.id} className="p-4 sm:p-5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      rev.verification_status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {rev.verification_status}
                    </span>
                    <span className="font-bold text-slate-900">{rev.title}</span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    Student: {rev.student_name} • Reviewed by: {rev.verifier_name || 'Dr. S. R. Patil'}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-400">{rev.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REJECT MODAL (Constructive feedback) */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Provide Correction Feedback</h3>
              <button onClick={() => setRejectModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reason for Non-Approval / Required Corrections</label>
                <textarea
                  rows={4}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Please upload the clear high-resolution scanned certificate bearing the official organizers seal and registration number."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
