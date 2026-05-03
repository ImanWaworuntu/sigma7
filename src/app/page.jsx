"use client"
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
      {/* Header Profile / School Info */}
      <div className="bg-primary-600 text-white rounded-b-3xl px-6 pt-10 pb-8 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SIGMA 7</h1>
            <p className="text-primary-100 text-sm font-medium">SMAN 7 Makassar</p>
            <div className="mt-2 inline-flex items-center gap-2 bg-primary-700/50 rounded-full pr-3 pl-1 py-1">
              <div className="h-6 w-6 bg-white rounded-full flex items-center justify-center text-primary-700 font-bold text-xs uppercase">
                {user?.role?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-medium capitalize">{user?.role}</span>
              <button onClick={logout} className="ml-2 text-[10px] bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded-full transition-colors">Logout</button>
            </div>
          </div>
          <div className="h-14 w-14 bg-white rounded-lg flex items-center justify-center p-1 shadow-md">
            <img src="/logo.jpg" alt="Logo SMAN 7" className="h-full w-full object-contain" />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-6 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 grid grid-cols-2 gap-4">
          <div className="bg-reward-50 rounded-xl p-3 border border-reward-100">
            <p className="text-xs text-reward-600 font-semibold mb-1">Prestasi Hari Ini</p>
            <p className="text-2xl font-bold text-reward-600">12</p>
          </div>
          <div className="bg-violation-50 rounded-xl p-3 border border-violation-100">
            <p className="text-xs text-violation-600 font-semibold mb-1">Pelanggaran</p>
            <p className="text-2xl font-bold text-violation-600">5</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mt-6">
        <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Aksi Cepat</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/input" className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform">
            <div className="bg-primary-100 text-primary-600 h-10 w-10 rounded-full flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-semibold text-slate-700 text-sm">Input Poin</span>
          </Link>
          <Link href="/siswa" className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform">
            <div className="bg-slate-100 text-slate-600 h-10 w-10 rounded-full flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-700 text-sm">Data Siswa</span>
          </Link>
        </div>
      </div>

      {/* Top 5 Lists */}
      <div className="px-6 mt-8 pb-6 flex flex-col gap-8">
        
        {/* 1. Top 5 Siswa Pelanggaran */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="bg-violation-100 text-violation-600 p-1 rounded">⚠️</span> Top 5 Siswa Pelanggaran
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {[1,2,3].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-violation-50 rounded text-violation-600 font-bold flex items-center justify-center text-sm">
                    #{i+1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Budi Santoso {item}</p>
                    <p className="text-xs text-slate-500">XI.2</p>
                  </div>
                </div>
                <div className="text-violation-600 font-black text-sm">
                  -{(4-i)*20}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Top 5 Kelas Pelanggaran */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 p-1 rounded">📊</span> Top 5 Kelas Pelanggaran
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {[1,2,3].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-orange-50 rounded text-orange-600 font-bold flex items-center justify-center text-sm">
                    #{i+1}
                  </div>
                  <p className="font-bold text-slate-800 text-sm">Kelas XII.{item+2}</p>
                </div>
                <div className="text-orange-600 font-black text-sm">
                  -{(10-i)*15} pts
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Top 5 Siswa Prestasi */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="bg-reward-100 text-reward-600 p-1 rounded">🌟</span> Top 5 Siswa Prestasi
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {[1,2,3].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-reward-50 rounded text-reward-600 font-bold flex items-center justify-center text-sm">
                    #{i+1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Ahmad Fulan {item}</p>
                    <p className="text-xs text-slate-500">X.1</p>
                  </div>
                </div>
                <div className="text-reward-600 font-black text-sm">
                  +{(5-i)*35}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Top 5 Kelas Prestasi */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="bg-green-100 text-green-600 p-1 rounded">🏆</span> Top 5 Kelas Prestasi
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {[1,2,3].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-50 rounded text-green-600 font-bold flex items-center justify-center text-sm">
                    #{i+1}
                  </div>
                  <p className="font-bold text-slate-800 text-sm">Kelas X.{item}</p>
                </div>
                <div className="text-green-600 font-black text-sm">
                  +{(8-i)*25} pts
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center pb-safe">
        <Link href="/" className="flex flex-col items-center text-primary-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href="/input" className="flex flex-col items-center text-slate-400 hover:text-primary-600 transition-colors">
          <div className="bg-primary-600 text-white rounded-full p-2 -mt-6 shadow-lg shadow-primary-600/30 border-4 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-[10px] font-semibold mt-1">Input</span>
        </Link>
        <Link href="/siswa" className="flex flex-col items-center text-slate-400 hover:text-primary-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-[10px] font-semibold">Siswa</span>
        </Link>
      </div>
    </main>
  );
}
