"use client"
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  
  const handleLogin = (e) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError('Username atau password salah');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen flex flex-col justify-center px-6">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
        <div className="text-center mb-8">
          <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md p-2">
            <img src="/logo.jpg" alt="Logo SMAN 7" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SIGMA 7</h1>
          <p className="text-sm text-slate-500 mt-1">Sistem Siswa Integrasi & Garda Moral</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold text-center border border-red-200">{error}</div>}
          
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-primary-500 rounded-xl py-3 px-4 outline-none transition-colors"
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-primary-500 rounded-xl py-3 px-4 outline-none transition-colors"
                placeholder="Masukkan password"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full bg-primary-600 text-white font-bold rounded-xl py-3.5 mt-4 hover:bg-primary-700 active:scale-95 transition-all shadow-md shadow-primary-500/30">
            Masuk
          </button>
        </form>

      </div>
    </div>
  );
}
