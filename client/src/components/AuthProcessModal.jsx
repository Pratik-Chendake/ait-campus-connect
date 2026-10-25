import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield, CheckCircle2, AlertCircle, Loader2, KeyRound,
  Lock, ArrowRight, Sparkles, User, RefreshCw
} from 'lucide-react';

export default function AuthProcessModal({
  isOpen,
  step = 1,
  email = '',
  role = 'STUDENT',
  fullName = '',
  statusText = 'Authenticating...',
  progress = 25,
  error = null,
  onClose,
  onRetry
}) {
  // Prevent background page scrolling while auth modal is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const isFailed = step === -1 || Boolean(error);
  const isSuccess = step >= 4 && !isFailed;

  const pipeline = [
    {
      num: 1,
      title: 'Gateway Handshake',
      desc: 'Connecting to Campus Connect & Supabase Auth',
      active: step >= 1,
      done: step > 1
    },
    {
      num: 2,
      title: 'Database Verification',
      desc: 'Validating academic identity & password hash',
      active: step >= 2,
      done: step > 2
    },
    {
      num: 3,
      title: 'Role Authorization',
      desc: `Verifying access rights for ${role || 'STUDENT'}`,
      active: step >= 3,
      done: step > 3
    },
    {
      num: 4,
      title: 'Session Token Issued',
      desc: 'Signing JWT bearer token & launching dashboard',
      active: step >= 4,
      done: isSuccess
    }
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="liquid-glass rounded-3xl max-w-md w-full border border-white/20 bg-slate-950/95 p-5 sm:p-7 space-y-5 text-white shadow-2xl relative m-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
        {/* Ambient background glow */}
        <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isFailed ? 'bg-rose-500/20' : isSuccess ? 'bg-emerald-500/25' : 'bg-blue-500/25'
        }`} />

        {/* Central Icon */}
        <div className="flex flex-col items-center text-center space-y-3 relative z-10">
          <div className="relative">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              isFailed
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.4)]'
                : isSuccess
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                : 'bg-blue-500/20 text-blue-400 border border-blue-400/40 shadow-[0_0_25px_rgba(59,130,246,0.4)] animate-pulse'
            }`}>
              {isFailed ? (
                <AlertCircle className="w-8 h-8" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-8 h-8 animate-scale-in" />
              ) : (
                <Lock className="w-8 h-8" />
              )}
            </div>

            {!isFailed && !isSuccess && (
              <div className="absolute -inset-1 rounded-2xl border-2 border-blue-500/30 border-t-blue-400 animate-spin pointer-events-none" />
            )}
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Authentication Process
            </div>
            <h3 className="text-xl font-black text-white">
              {isFailed
                ? 'Authentication Failed'
                : isSuccess
                ? 'Session Authenticated!'
                : 'Authenticating Credentials'}
            </h3>
            {email && (
              <p className="text-xs font-mono text-cyan-300 truncate max-w-[280px]">
                {email}
              </p>
            )}
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>{isFailed ? 'Process Halted' : statusText}</span>
            <span className="font-mono text-white">{isFailed ? 'Error' : `${progress}%`}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                isFailed
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400'
              }`}
              style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
            />
          </div>
        </div>

        {/* Live Step-by-Step Pipeline */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 relative z-10 text-xs">
          {pipeline.map((p) => {
            const isCurrent = p.active && !p.done && !isFailed;
            return (
              <div
                key={p.num}
                className={`flex items-start gap-3 p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-blue-500/15 border border-blue-400/30'
                    : p.done
                    ? 'bg-white/5 border border-transparent opacity-85'
                    : 'opacity-40'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${
                  p.done
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-white/10 text-slate-400'
                }`}>
                  {p.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : p.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px] truncate">{p.title}</span>
                    {isCurrent && (
                      <Loader2 className="w-3 h-3 text-blue-400 animate-spin shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight truncate">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Notice if Failed */}
        {isFailed && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center space-y-1 relative z-10">
            <p className="font-bold">Verification Error</p>
            <p className="text-[11px] text-rose-200">{error || 'Invalid credentials or user not found.'}</p>
          </div>
        )}

        {/* Success User Card if Authenticated */}
        {isSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs relative z-10 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white leading-tight">{fullName || 'Campus User'}</p>
                <p className="text-[10px] text-emerald-300 uppercase font-semibold">{role}</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              Authorized
            </span>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 relative z-10 flex items-center justify-center gap-2">
          {isFailed ? (
            <>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              )}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              )}
            </>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>Secured by Supabase Auth & Institutional Encryption</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
