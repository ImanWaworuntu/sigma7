"use client"
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from './supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check with backend API if we have a valid HttpOnly cookie
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Session check error", err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        setUser({ username, role: data.role, nama_lengkap: data.nama_lengkap });
        
        if (data.role === 'osis') {
          router.push('/upacara');
        } else {
          router.push('/dashboard');
        }
        return true;
      }
    } catch (err) {
      console.error("Login API error:", err);
    }
    return false;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error("Logout error", e);
    }
    setUser(null);
    router.push('/');
  };

  // Route protection
  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/') {
        router.push('/');
      } else if (user && pathname === '/') {
        router.push('/dashboard');
      }
      
      // Admin only routes
      if (user && user.role !== 'admin' && pathname === '/siswa/tambah') {
        router.push('/dashboard');
      }

      // OSIS only routes
      if (user && user.role === 'osis' && !pathname.startsWith('/upacara')) {
        router.push('/upacara');
      }
    }
  }, [user, loading, pathname, router]);

  // Determine if we should show the loading screen to prevent flashing protected content
  let showLoading = loading;
  if (!loading) {
    if (!user && pathname !== '/') showLoading = true;
    else if (user && pathname === '/') showLoading = true;
    else if (user && user.role !== 'admin' && pathname === '/siswa/tambah') showLoading = true;
    else if (user && user.role === 'osis' && !pathname.startsWith('/upacara')) showLoading = true;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {/* Jika loading atau sedang proses redirect, tampilkan skeleton agar tidak berkedip */}
      {showLoading ? <div className="h-screen w-full flex items-center justify-center bg-slate-50"><div className="animate-pulse flex flex-col items-center"><div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div><div className="h-4 w-24 bg-slate-200 rounded"></div></div></div> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
