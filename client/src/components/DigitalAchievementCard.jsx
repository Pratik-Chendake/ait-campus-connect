import React, { useState } from 'react';
import { X, CheckCircle, Share2, Download, Copy, Check, ShieldCheck, Sparkles } from 'lucide-react';

export default function DigitalAchievementCard({ isOpen, onClose, achievement, student }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !achievement) return null;

  const handleShare = () => {
    const shareUrl = window.location.origin + `/student/${student?.student_id || student?.id || ''}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Official Digital Credential</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Digital Card Preview (Styled for institutional prestige) */}
        <div className="p-6 bg-slate-900 text-white flex justify-center">
          <div
            id="ait-credential-card"
            className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-2 border-amber-500/40 p-6 shadow-2xl relative overflow-hidden text-center"
          >
            {/* Background watermark seal */}
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <ShieldCheck className="w-64 h-64 text-amber-400" />
            </div>

            {/* Institution Header */}
            <div className="flex flex-col items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center mb-2">
                <ShieldCheck className="w-7 h-7 text-amber-400" />
              </div>
              <h4 className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                Army Institute of Technology, Pune
              </h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Campus Achievement Portal</p>
            </div>

            {/* Verified Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
              <CheckCircle className="w-3.5 h-3.5" />
              AIT Authenticated Record
            </div>

            {/* Position & Title */}
            <div className="my-3">
              <h2 className="text-xl font-extrabold text-white tracking-tight">{achievement.position}</h2>
              <p className="text-sm font-semibold text-amber-300 mt-1">{achievement.title}</p>
            </div>

            {/* Student Details */}
            <div className="border-t border-b border-slate-700/60 py-3 my-3">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Conferred Upon</p>
              <h3 className="text-lg font-bold text-white mt-0.5">{student?.full_name || 'AIT Student'}</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {student?.branch || 'Engineering'} • Class of {student?.year ? 2026 - (student.year - 4) : '2026'}
              </p>
            </div>

            {/* Event & Level */}
            <div className="text-xs text-slate-400 space-y-1">
              <div>
                <span className="text-slate-500">Event: </span>
                <span className="text-slate-200 font-medium">{achievement.event_name}</span>
              </div>
              <div>
                <span className="text-slate-500">Organized By: </span>
                <span className="text-slate-200 font-medium">{achievement.organization}</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-[11px] pt-2 text-slate-400">
                <span>Level: <b className="text-amber-400">{achievement.level}</b></span>
                <span>•</span>
                <span>Date: <b className="text-slate-200">{achievement.date}</b></span>
              </div>
            </div>

            {/* Card Footer Bar */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
              <span>ID: AIT-ACH-{achievement.id.toString().padStart(5, '0')}</span>
              <span className="font-mono text-emerald-400">VERIFIED ✓</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            {copied ? 'Link Copied!' : 'Copy Portfolio Link'}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md"
          >
            <Download className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
