"use client"
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check localStorage for saved session
    const storedUser = localStorage.getItem('sigma_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    let role = null;
    // Admin access (also includes Guru access)
    if (
      (username === 'admin' && password === 'admin') || 
      (username === 'iman.waw@gmail.com' && password === 'sigma123')
    ) {
      role = 'admin';
    } 
    // Guru access
    else if (username === 'guru' && password === 'guru') {
      role = 'guru';
    }

    // OSIS access
    else if (username.startsWith('osis') && password === 'osis') {
      role = 'osis';
    }

    if (role) {
      const userData = { username, role };
      setUser(userData);
      localStorage.setItem('sigma_user', JSON.stringify(userData));
      if (role === 'osis') {
        router.push('/upacara');
      } else {
        router.push('/');
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sigma_user');
    router.push('/login');
  };

  // Route protection
  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/');
      }
      
      // Admin only routes
      if (user && user.role !== 'admin' && pathname === '/siswa/tambah') {
        router.push('/');
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
    if (!user && pathname !== '/login') showLoading = true;
    else if (user && pathname === '/login') showLoading = true;
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
