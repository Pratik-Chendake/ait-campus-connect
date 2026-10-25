import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User, Award, Code, FileText, Briefcase, Trophy, Globe,
  Mail, ShieldCheck, Download, Share2,
  Calendar, CheckCircle, ExternalLink, Sparkles, Loader2, ArrowRight
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/SocialIcons';
import { api } from '../api/client';
import ResumeModal from '../components/ResumeModal';
import DigitalAchievementCard from '../components/DigitalAchievementCard';

export default function StudentPortfolio() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumeData, setResumeData] = useState(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [activeAchievement, setActiveAchievement] = useState(null);

  useEffect(() => {
    loadPortfolio();
  }, [username]);

  async function loadPortfolio() {
    setLoading(true);
    try {
      const res = await api.get(`/students/${username}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadResume = async () => {
    if (!data?.user) return;
    try {
      const res = await api.get(`/students/${data.user.id}/resume`);
      setResumeData(res);
      setResumeOpen(true);
    } catch (err) {
      console.error('Failed to load resume:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Portfolio link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Loading verified student portfolio...</p>
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-xl font-bold text-slate-800">Student Profile Not Found</h2>
        <Link to="/students" className="text-blue-600 text-xs font-semibold mt-2 inline-block">
          Return to Student Directory
        </Link>
      </div>
    );
  }

  const { user, skills = [], achievements = [], projects = [], research_papers = [], internships = [], leadership = [], sports_cultural = [], certifications = [], clubs = [], timeline = [] } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Portfolio Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/70 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
              alt={user.full_name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-blue-50 shadow-md"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {user.full_name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> AIT Verified Identity
                </span>
              </div>

              <p className="text-sm font-semibold text-blue-700">
                {user.branch || 'Branch Not Set'} • Class of {user.year ? 2026 - (user.year - 4) : 2026} (Year {user.year || 1})
              </p>

              <p className="text-xs text-slate-500">
                Army Institute of Technology, Pune {user.student_id ? `• Reg ID: ${user.student_id}` : ''}
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-3 pt-2">
                {user.github_url && (
                  <a href={user.github_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-900">
                    <GithubIcon className="w-4 h-4" />
                  </a>
                )}
                {user.linkedin_url && (
                  <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-600">
                    <LinkedinIcon className="w-4 h-4" />
                  </a>
                )}
                {user.portfolio_url && (
                  <a href={user.portfolio_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-emerald-600">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full ml-2">
                  ★ {user.contribution_score || 0} Contribution Points
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-col gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={handleDownloadResume}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" /> Generate Resume
            </button>
            <button
              onClick={handleShare}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Share2 className="w-4 h-4" /> Share Portfolio
            </button>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
              {user.bio}
            </p>
          </div>
        )}
      </div>

      {/* Skills Showcase */}
      {skills.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" /> Technical Skills & Competencies
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {skills.map((s) => (
              <div
                key={s.user_skill_id}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs"
              >
                <span className="font-semibold text-slate-800">{s.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                  {s.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Achievements & Digital Card Trigger */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Verified Achievements ({achievements.length})
            </h2>
            <span className="text-xs text-slate-400">Click any card to generate digital credential</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                onClick={() => setActiveAchievement(ach)}
                className="p-5 rounded-2xl border border-slate-200/90 hover:border-amber-300 hover:shadow-md transition cursor-pointer bg-slate-50/50 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> ✓ AIT VERIFIED
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{ach.date}</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                    {ach.position}: {ach.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Event: <b className="text-slate-700">{ach.event_name}</b> ({ach.organization}) • Level: <b className="text-amber-700">{ach.level}</b>
                  </p>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {ach.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-blue-600 font-semibold">
                  <span className="flex items-center gap-1 group-hover:underline">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> View Digital Credential Card
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Showcase */}
      {projects.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Engineering Projects ({projects.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                {proj.banner_url && (
                  <div className="h-44 bg-slate-100 overflow-hidden">
                    <img src={proj.banner_url} alt={proj.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-base text-slate-900">{proj.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                  <p className="text-[11px] text-blue-700 font-mono">Tech Stack: {proj.tech_stack}</p>
                </div>
                <div className="p-5 pt-0 flex items-center gap-3">
                  {proj.github_url && (
                    <a
                      href={proj.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                    >
                      <GithubIcon className="w-3.5 h-3.5" /> Repository
                    </a>
                  )}
                  {proj.demo_url && (
                    <a
                      href={proj.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Research & IEEE Publications */}
      {research_papers.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" /> Research & Publications ({research_papers.length})
          </h2>

          <div className="space-y-4">
            {research_papers.map((r) => (
              <div key={r.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {r.is_ieee === 1 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-900 text-white text-[10px] font-bold">
                      IEEE Conference Publication
                    </span>
                  )}
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {r.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{r.publication_date}</span>
                </div>

                <h3 className="font-bold text-base text-slate-900">"{r.title}"</h3>
                <p className="text-xs text-slate-600">Authors: {r.authors}</p>
                <p className="text-xs text-slate-500">In: {r.conference_or_journal} {r.doi ? `• DOI: ${r.doi}` : ''}</p>
                {r.abstract && <p className="text-xs text-slate-600 pt-1 line-clamp-3 leading-relaxed">{r.abstract}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Timeline: "MY AIT JOURNEY" (Section 80) */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> My AIT Journey
            </h2>
            <p className="text-xs text-slate-500">The verified chronological progression of milestones at Army Institute of Technology.</p>
          </div>

          <div className="relative pl-6 border-l-2 border-blue-200 space-y-6">
            {timeline.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                <span className="text-[11px] font-bold text-blue-700 font-mono">{step.year}</span>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{step.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ResumeModal
        isOpen={resumeOpen}
        onClose={() => setResumeOpen(false)}
        data={resumeData}
      />

      <DigitalAchievementCard
        isOpen={Boolean(activeAchievement)}
        onClose={() => setActiveAchievement(null)}
        achievement={activeAchievement}
        student={user}
      />
    </div>
  );
}
