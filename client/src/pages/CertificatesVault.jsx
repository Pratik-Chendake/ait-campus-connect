import React, { useState, useEffect } from 'react';
import {
  Shield, Lock, Globe, ExternalLink, Plus, Eye,
  CheckCircle2, AlertCircle, FileText, Loader2, X
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CertificatesVault() {
  const { user } = useAuth();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [credentialId, setCredentialId] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [category, setCategory] = useState('Winner');
  const [isPublic, setIsPublic] = useState(false); // Private by default per requirement!

  useEffect(() => {
    loadVault();
  }, [user]);

  async function loadVault() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/achievements/vault/my');
      setCerts(res.certificates || []);
    } catch (err) {
      console.error('Failed to load vault:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleVisibility = async (certId) => {
    try {
      const res = await api.patch(`/achievements/vault/${certId}/visibility`, {});
      setCerts(certs.map(c => c.id === certId ? { ...c, is_public: res.is_public } : c));
    } catch (err) {
      alert('Failed to update certificate visibility');
    }
  };

  const handleAddCert = async (e) => {
    e.preventDefault();
    try {
      await api.post('/achievements/vault', {
        name,
        issuer,
        issue_date: issueDate,
        credential_id: credentialId,
        file_url: fileUrl,
        category,
        is_public: isPublic
      });
      setShowAddModal(false);
      setName('');
      setIssuer('');
      setCredentialId('');
      setFileUrl('');
      loadVault();
      alert('Certificate stored in vault!');
    } catch (err) {
      alert(err.message || 'Failed to add certificate');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold mb-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Encrypted Document Vault
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Certificate Vault
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Securely preserve verified participation and winner certificates. All documents are <b>private by default</b>; you choose which ones to display on your public portfolio.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> Add Certificate
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm">Accessing vault credentials...</p>
        </div>
      ) : certs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Lock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">Your certificate vault is empty</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Store course certificates, workshop credentials, and competition proofs safely here.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs"
          >
            Add First Certificate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {cert.category}
                  </span>
                  <button
                    onClick={() => handleToggleVisibility(cert.id)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition ${
                      cert.is_public
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                    title="Toggle public visibility on portfolio"
                  >
                    {cert.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {cert.is_public ? 'Public on Portfolio' : 'Private to You'}
                  </button>
                </div>

                <h3 className="font-bold text-base text-slate-900 line-clamp-1">{cert.name}</h3>

                <p className="text-xs text-slate-500">
                  Issuer: <b className="text-slate-800">{cert.issuer}</b>
                </p>

                <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                  {cert.credential_id && <div>ID: {cert.credential_id}</div>}
                  <div>Issued: {cert.issue_date}</div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <a
                  href={cert.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Certificate
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Certificate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Store Certificate in Vault</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCert} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Certificate Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="AWS Solutions Architect / SIH Winner Certificate"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Issuing Organization *</label>
                  <input
                    type="text"
                    required
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder="Amazon Web Services"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                  >
                    <option value="Winner">Winner Certificate</option>
                    <option value="Participation">Participation</option>
                    <option value="Course">Online Course / Tech</option>
                    <option value="Internship">Internship Completion</option>
                    <option value="Sports">Sports</option>
                    <option value="Cultural">Cultural</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Credential ID</label>
                  <input
                    type="text"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    placeholder="AWS-ARCH-9921"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Document File URL *</label>
                <input
                  type="text"
                  required
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://... or /uploads/..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Public Visibility</span>
                  <p className="text-[11px] text-slate-500">Allow this certificate to be seen on your public portfolio</p>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
