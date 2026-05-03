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
    if (username === 'admin' && password === 'admin') {
      role = 'admin';
    } else if (username === 'guru' && password === 'guru') {
      role = 'guru';
    }

    if (role) {
      const userData = { username, role };
      setUser(userData);
      localStorage.setItem('sigma_user', JSON.stringify(userData));
      router.push('/');
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
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {/* Jika loading, tampilkan skeleton atau layar putih sejenak agar tidak berkedip */}
      {loading ? <div className="h-screen w-full flex items-center justify-center bg-slate-50"><div className="animate-pulse flex flex-col items-center"><div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div><div className="h-4 w-24 bg-slate-200 rounded"></div></div></div> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
