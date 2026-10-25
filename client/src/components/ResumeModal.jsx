import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, Award, Briefcase, GraduationCap, Code, FileText } from 'lucide-react';

export default function ResumeModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;
  if (typeof document === 'undefined') return null;

  const { personal, education, skills, projects, achievements, research, internships, leadership } = data;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">AIT Institutional Resume Preview</h3>
            <p className="text-xs text-slate-500">Standardized verified career portfolio resume</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Resume Sheet */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 bg-white text-slate-900 font-sans" id="printable-resume">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
              {personal?.full_name || 'Student Name'}
            </h1>
            <p className="text-sm font-semibold text-blue-700 mt-1">
              Army Institute of Technology (AIT), Pune • {education?.branch || 'Engineering'}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-2 font-mono">
              {personal?.email && <span>Email: {personal.email}</span>}
              {personal?.phone && <span>• Tel: {personal.phone}</span>}
              {personal?.github && <span>• GitHub: {personal.github.replace('https://', '')}</span>}
              {personal?.linkedin && <span>• LinkedIn: {personal.linkedin.replace('https://', '')}</span>}
            </div>
            {personal?.bio && (
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-sans">{personal.bio}</p>
            )}
          </div>

          {/* Education */}
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-slate-700" /> Education
            </h2>
            <div className="flex justify-between items-baseline text-xs">
              <div>
                <span className="font-bold text-slate-800">{education?.institution}</span>
                <span className="text-slate-600"> — {education?.degree} in {education?.branch}</span>
              </div>
              <span className="font-medium text-slate-500">{education?.duration}</span>
            </div>
          </div>

          {/* Technical Skills */}
          {skills && skills.length > 0 && (
            <div className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-slate-700" /> Technical Skills & Competencies
              </h2>
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-800">Technologies: </span>
                {skills.map((s) => s.name).join(', ')}
              </div>
            </div>
          )}

          {/* Verified Achievements & Honors */}
          {achievements && achievements.length > 0 && (
            <div className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-slate-700" /> Honors & Verified Achievements (AIT Authenticated)
              </h2>
              <div className="space-y-2 text-xs">
                {achievements.map((a) => (
                  <div key={a.id} className="flex justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{a.position}: {a.title}</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">{a.description}</p>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] shrink-0 ml-4">{a.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <div className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-700" /> Engineering Projects
              </h2>
              <div className="space-y-3 text-xs">
                {projects.map((p) => (
                  <div key={p.id}>
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{p.title}</span>
                      <span className="font-normal text-slate-500">{p.completed_date || '2025'}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{p.description}</p>
                    <p className="text-[10px] text-blue-700 font-mono mt-0.5">Tech: {p.tech_stack}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research & Publications */}
          {research && research.length > 0 && (
            <div className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-700" /> Research & Publications
              </h2>
              <div className="space-y-2 text-xs">
                {research.map((r) => (
                  <div key={r.id}>
                    <div className="font-bold text-slate-800">
                      "{r.title}" {r.is_ieee ? '(IEEE Conference Publication)' : ''}
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Authors: {r.authors} • In: {r.conference_or_journal} ({r.publication_date})
                    </p>
                    {r.doi && <p className="text-[10px] font-mono text-slate-500">DOI: {r.doi}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internships & Work Experience */}
          {internships && internships.length > 0 && (
            <div className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-700" /> Work Experience & Internships
              </h2>
              <div className="space-y-2 text-xs">
                {internships.map((intern) => (
                  <div key={intern.id} className="flex justify-between">
                    <div>
                      <div className="font-bold text-slate-800">
                        {intern.role} — <span className="text-slate-600 font-semibold">{intern.company}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{intern.description}</p>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] shrink-0 ml-4">
                      {intern.start_date} – {intern.end_date || 'Present'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leadership & Co-Curricular */}
          {leadership && leadership.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Leadership & Institutional Positions
              </h2>
              <div className="space-y-2 text-xs">
                {leadership.map((l) => (
                  <div key={l.id} className="flex justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{l.role}</span>
                      <span className="text-slate-600">, {l.organization}</span>
                      {l.responsibilities && <p className="text-slate-600 text-[11px]">{l.responsibilities}</p>}
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] shrink-0">{l.start_date} – {l.end_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
