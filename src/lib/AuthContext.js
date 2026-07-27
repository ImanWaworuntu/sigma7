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
    // Check sessionStorage for saved session
    const storedUser = sessionStorage.getItem('sigma_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // Admin access (Exclusive)
    if (
      (username === 'admin' && password === 'admin') || 
      (username === 'iman.waw@gmail.com' && password === 'sigma123')
    ) {
      const userData = { username, role: 'admin', nama_lengkap: 'Administrator' };
      setUser(userData);
      sessionStorage.setItem('sigma_user', JSON.stringify(userData));
      router.push('/dashboard');
      return true;
    } 

    // Cek Guru & OSIS di database
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (data && !error) {
        const userData = { 
          username: data.username, 
          role: data.role, 
          nama_lengkap: data.nama_lengkap 
        };
        setUser(userData);
        sessionStorage.setItem('sigma_user', JSON.stringify(userData));
        
        if (data.role === 'osis') {
          router.push('/upacara');
        } else {
          router.push('/dashboard');
        }
        return true;
      }
    } catch (err) {
      console.error("Login DB error:", err);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('sigma_user');
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
