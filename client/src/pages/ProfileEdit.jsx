import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Code, FileText, Globe,
  Upload, Plus, Trash2, ShieldCheck, CheckCircle2, Loader2, Sparkles
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/SocialIcons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AIT_BRANCHES } from '../constants/branches';

export default function ProfileEdit() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [branch, setBranch] = useState('Computer Engineering');
  const [year, setYear] = useState(3);
  const [semester, setSemester] = useState(6);
  const [phone, setPhone] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileVisibility, setProfileVisibility] = useState('PUBLIC');

  // Skills
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('Intermediate');
  const [addingSkill, setAddingSkill] = useState(false);

  // New Project Form
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectTech, setProjectTech] = useState('');
  const [projectGithub, setProjectGithub] = useState('');
  const [addingProject, setAddingProject] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        const res = await api.get(`/students/${user.id}`);
        const u = res.user;
        setFullName(u.full_name || '');
        setBio(u.bio || '');
        setBranch(u.branch || 'Computer Engineering');
        setYear(u.year || 3);
        setSemester(u.semester || 6);
        setPhone(u.phone || '');
        setGithubUrl(u.github_url || '');
        setLinkedinUrl(u.linkedin_url || '');
        setPortfolioUrl(u.portfolio_url || '');
        setAvatarUrl(u.avatar_url || '');
        setProfileVisibility(u.profile_visibility || 'PUBLIC');
        setSkills(res.skills || []);
      } catch (err) {
        console.error('Failed to load profile for editing:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await api.patch(`/students/${user.id}/profile`, {
        full_name: fullName,
        bio,
        branch,
        year: parseInt(year, 10),
        semester: parseInt(semester, 10),
        phone,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        avatar_url: avatarUrl,
        profile_visibility: profileVisibility
      });

      await refreshUser();
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setAddingSkill(true);
    try {
      await api.post(`/students/${user.id}/skills`, {
        skill_name: newSkillName.trim(),
        level: newSkillLevel
      });
      // Refresh skills
      const res = await api.get(`/students/${user.id}`);
      setSkills(res.skills || []);
      setNewSkillName('');
      await refreshUser();
    } catch (err) {
      alert('Failed to add skill');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (userSkillId) => {
    try {
      await api.delete(`/students/${user.id}/skills/${userSkillId}`);
      setSkills(skills.filter(s => s.user_skill_id !== userSkillId));
      await refreshUser();
    } catch (err) {
      alert('Failed to remove skill');
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!projectTitle || !projectDesc || !projectTech) {
      alert('Project title, description, and tech stack are required');
      return;
    }
    try {
      await api.post(`/students/${user.id}/projects`, {
        title: projectTitle,
        description: projectDesc,
        tech_stack: projectTech,
        github_url: projectGithub
      });
      setProjectTitle('');
      setProjectDesc('');
      setProjectTech('');
      setProjectGithub('');
      setAddingProject(false);
      await refreshUser();
      alert('Project added to your portfolio!');
    } catch (err) {
      alert('Failed to add project');
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold">Please sign in to edit profile.</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Loading your profile editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Profile Builder</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build your comprehensive digital identity. Every detail increases your profile strength.
          </p>
        </div>
        <Link
          to={`/student/${user.student_id || user.id}`}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold self-start transition"
        >
          View Public Portfolio →
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleProfileSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
          Personal & Institutional Credentials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Profile Picture URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium cursor-pointer"
            >
              {AIT_BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
              >
                <option value={1}>1st Year (FE)</option>
                <option value={2}>2nd Year (SE)</option>
                <option value={3}>3rd Year (TE)</option>
                <option value={4}>4th Year (BE)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="font-bold text-slate-700">Student Bio (Professional Summary)</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell recruiters and peers about your engineering focus, areas of interest, and key milestones..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">GitHub Profile</label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">LinkedIn Profile</label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Personal Portfolio / Website</label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://yourname.dev"
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Profile Visibility (Section 64)</label>
            <select
              value={profileVisibility}
              onChange={(e) => setProfileVisibility(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
            >
              <option value="PUBLIC">Public (Visible to everyone & recruiters)</option>
              <option value="AIT_ONLY">AIT Students & Faculty Only</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile Changes'}
          </button>
        </div>
      </form>

      {/* Skills Manager (Section 21) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
          <span>Manage Technical Skills ({skills.length})</span>
          <span className="text-xs text-slate-400 font-normal">Beginner to Expert</span>
        </h3>

        {/* Existing skills chips */}
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <div
              key={s.user_skill_id}
              className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-medium flex items-center gap-2 border border-slate-200"
            >
              <span>{s.name} ({s.level})</span>
              <button
                type="button"
                onClick={() => handleRemoveSkill(s.user_skill_id)}
                className="text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add skill form */}
        <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
          <input
            type="text"
            required
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Add new skill (e.g. Next.js, Docker, PyTorch)..."
            className="flex-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none"
          />
          <select
            value={newSkillLevel}
            onChange={(e) => setNewSkillLevel(e.target.value)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
          <button
            type="submit"
            disabled={addingSkill}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
          >
            Add Skill
          </button>
        </form>
      </div>

      {/* Add Project Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900">Add Project to Portfolio</h3>
          <button
            onClick={() => setAddingProject(!addingProject)}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            {addingProject ? 'Close Form' : '+ Add New Project'}
          </button>
        </div>

        {addingProject && (
          <form onSubmit={handleAddProject} className="space-y-3 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Project Title</label>
              <input
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Autonomous Quadcopter Telemetry System"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Description</label>
              <textarea
                rows={2}
                required
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="What does it do and what problems does it solve?"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  required
                  value={projectTech}
                  onChange={(e) => setProjectTech(e.target.value)}
                  placeholder="Python, OpenCV, ROS, React"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">GitHub Link</label>
                <input
                  type="url"
                  value={projectGithub}
                  onChange={(e) => setProjectGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
              >
                Save Project
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
