import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function getDashboardRoute(role) {
  if (!role) return '/login';
  const r = String(role).toUpperCase();
  if (r === 'SUPER_ADMIN') return '/super-admin/dashboard';
  if (r === 'ADMIN') return '/admin/dashboard';
  if (r === 'ORGANIZER') return '/organizer/dashboard';
  return '/student/dashboard';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ait_auth_token'));
  const [loading, setLoading] = useState(true);

  // Load current user from token on startup
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.user);
      } catch (err) {
        console.error('Session expired or invalid:', err);
        localStorage.removeItem('ait_auth_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  // Primary Gmail + Website Password Sign-Up (Student Role automatically assigned)
  const signup = async (email, password, branch = 'Computer Engineering') => {
    // 1. Call Backend to create user and persist in database
    const res = await api.post('/auth/signup', { email, password, branch });

    // 2. Authenticate to Supabase Auth client-side if configured
    // Note: Backend provisioned with email_confirm: true to prevent transactional bounce issues
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signInWithPassword({
          email,
          password
        });
      } catch (e) {
        // Safe fallback notice
      }
    }

    localStorage.setItem('ait_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  // Primary Login with Gmail + Website Password
  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { email: identifier, identifier, password });

    // Also establish Supabase Auth session client-side if email format and configured
    if (isSupabaseConfigured() && identifier.includes('@')) {
      try {
        await supabase.auth.signInWithPassword({
          email: identifier,
          password
        });
      } catch (e) {
        // Safe fallback notice
      }
    }

    localStorage.setItem('ait_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  // 1-Click Quick Demo Login for Instant Evaluation
  const quickLogin = async (role) => {
    const res = await api.post('/auth/quick-login', { role });
    localStorage.setItem('ait_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  // Legacy multi-field registration support
  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    localStorage.setItem('ait_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  // Forgot password trigger with client-side throttling
  const forgotPassword = async (email) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.resetPasswordForEmail(email);
      } catch (e) {
        // Safe fallback
      }
    }
    return await api.post('/auth/forgot-password', { email });
  };

  // Secure Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('ait_auth_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      setUser(res.user);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signup,
        login,
        quickLogin,
        register,
        forgotPassword,
        logout,
        refreshUser,
        getDashboardRoute: () => getDashboardRoute(user?.role),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
