import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import { useAuth, getDashboardRoute } from '../context/AuthContext';

export default function RoleGuard({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // If unauthenticated, redirect to login with return path
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  // If account is suspended
  if (user.status === 'SUSPENDED') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-rose-900">Account Unavailable</h2>
        <p className="text-xs text-rose-700">
          Your account is currently suspended. Please contact the platform administrator at admin@aitpune.edu.in.
        </p>
      </div>
    );
  }

  // Check if role is allowed
  const userRole = (user.role || '').toUpperCase();
  const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

  // SUPER_ADMIN has full clearance everywhere
  const hasAccess = userRole === 'SUPER_ADMIN' || normalizedAllowed.includes(userRole);

  if (!hasAccess) {
    const userHome = getDashboardRoute(user.role);
    return (
      <div className="max-w-lg mx-auto my-20 p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your account role (<span className="font-bold text-slate-800">{user.role}</span>) does not have authorization to view this area.
          Required role(s): <span className="font-semibold text-slate-800">{allowedRoles.join(', ')}</span>.
        </p>
        <div className="pt-2">
          <Link
            to={userHome}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <span>Return to Your Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
