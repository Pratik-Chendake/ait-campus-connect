import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle2, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Logout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(25);
  const [statusText, setStatusText] = useState('Terminating active campus session...');

  useEffect(() => {
    let active = true;

    async function runLogout() {
      try {
        await new Promise((r) => setTimeout(r, 260));
        if (!active) return;

        setStep(2);
        setStatusText('Clearing security bearer tokens & local storage...');
        setProgress(70);

        await logout();

        if (!active) return;
        setStep(3);
        setStatusText('Session terminated successfully! Redirecting...');
        setProgress(100);

        await new Promise((r) => setTimeout(r, 450));
        if (active) {
          navigate('/login');
        }
      } catch (err) {
        console.error('Logout error:', err);
        localStorage.removeItem('ait_auth_token');
        if (active) navigate('/login');
      }
    }

    runLogout();

    return () => {
      active = false;
    };
  }, [logout, navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center px-4 py-8 sm:py-12 relative overflow-y-auto">
      <div className="liquid-glass rounded-3xl max-w-md w-full mx-auto border border-white/20 bg-slate-950/85 p-6 sm:p-8 text-center text-white space-y-6 shadow-2xl relative my-auto max-h-[calc(100vh-3rem)] overflow-y-auto backdrop-blur-2xl">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

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

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Sign Out Process
          </div>
          <h2 className="text-2xl font-black text-white">
            {step >= 3 ? 'Session Closed' : 'Signing Out...'}
          </h2>
          <p className="text-xs text-slate-400">{statusText}</p>
        </div>

        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 mx-auto"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
