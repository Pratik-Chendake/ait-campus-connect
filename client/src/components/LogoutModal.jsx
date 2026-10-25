import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Shield, AlertTriangle, CheckCircle2, Loader2,
  X, ArrowRight, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LogoutModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1);
  const [statusText, setStatusText] = useState('');
  const [progress, setProgress] = useState(0);

  // Prevent background page scrolling while logout modal is open
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

  const handleConfirmLogout = async () => {
    setProcessing(true);
    setStep(1);
    setStatusText('Terminating active session & Supabase connection...');
    setProgress(35);

    try {
      await new Promise((r) => setTimeout(r, 260));

      setStep(2);
      setStatusText('Clearing security bearer tokens & academic cache...');
      setProgress(70);

      await logout();

      setStep(3);
      setStatusText('Signed out successfully! Redirecting to login...');
      setProgress(100);

      await new Promise((r) => setTimeout(r, 380));

      setProcessing(false);
      if (onClose) onClose();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Force local clean-up even if network fails
      localStorage.removeItem('ait_auth_token');
      if (onClose) onClose();
      navigate('/login');
    } finally {
      setProcessing(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !processing && onClose) {
          onClose();
        }
      }}
    >
      <div className="liquid-glass rounded-3xl max-w-md w-full border border-white/20 bg-slate-950/95 p-5 sm:p-7 space-y-5 text-white shadow-2xl relative my-auto mx-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
        {/* Ambient red/rose glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {!processing ? (
          /* Confirmation Screen */
          <>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
                  <LogOut className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Sign Out Session</h3>
                  <p className="text-xs text-slate-400">AIT Campus Connect Security</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current User Card */}
            {user && (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 relative z-10">
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                  alt={user.full_name}
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-blue-500/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-white truncate">{user.full_name}</p>
                  <p className="text-xs text-slate-400 truncate font-mono">{user.email}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase shrink-0">
                  {user.role}
                </span>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed relative z-10">
              Are you sure you want to sign out of your authenticated session? You will need to enter your credentials or use the role switcher to sign in again.
            </p>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2 relative z-10">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Confirm Sign Out</span>
              </button>
            </div>
          </>
        ) : (
          /* Live Logout Process Sequence */
          <div className="py-4 space-y-6 text-center relative z-10 animate-fade-in">
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/30">
              {step >= 3 ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-scale-in" />
              ) : (
                <LogOut className="w-8 h-8 animate-pulse" />
              )}
              {step < 3 && (
                <div className="absolute -inset-1 rounded-2xl border-2 border-rose-500/30 border-t-rose-400 animate-spin pointer-events-none" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                {step >= 3 ? 'Session Closed' : 'Signing Out...'}
              </h3>
              <p className="text-xs text-slate-400">{statusText}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="space-y-2 text-left text-xs bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white' : 'text-slate-500'}`}>
                {step > 1 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                )}
                <span>Terminating active Supabase cloud session</span>
              </div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white' : 'text-slate-500'}`}>
                {step > 2 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : step === 2 ? (
                  <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block" />
                )}
                <span>Revoking local authentication credentials & tokens</span>
              </div>
              <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-300 font-bold' : 'text-slate-500'}`}>
                {step >= 3 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block" />
                )}
                <span>Session ended. Redirecting to login portal...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
