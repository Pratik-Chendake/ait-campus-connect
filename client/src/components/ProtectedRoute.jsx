import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

/**
 * ProtectedRoute Guard
 * Blocks any unauthenticated visitor from accessing protected campus routes.
 * Ensures session is resolved before rendering protected children.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-radial from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-xl shadow-blue-500/20 border border-white/20 overflow-hidden">
            <img src="/ait-logo.png" alt="AIT Pune Crest" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1 text-center">
            <h3 className="font-black text-sm tracking-widest uppercase text-slate-300">
              AIT CAMPUS CONNECT
            </h3>
            <p className="text-xs text-slate-400">
              Verifying authenticated campus session...
            </p>
          </div>
          <div className="animate-spin w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full mt-2" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Preserve intended target for redirection after successful login
    const targetUrl = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(targetUrl)}`} replace />;
  }

  // Account suspended guard
  if (user.status === 'SUSPENDED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-rose-900">Account Suspended</h2>
          <p className="text-xs text-rose-700">
            Your AIT Campus Connect account is currently suspended. Please contact the platform administration at admin@aitpune.edu.in.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
