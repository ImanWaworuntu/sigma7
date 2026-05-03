"use client"
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

// Dummy data
const students = [
  { id: 1, name: 'Ahmad Fulan', class: 'XII IPA 1', points: 85, status: 'safe' },
  { id: 2, name: 'Budi Santoso', class: 'XI IPS 2', points: -35, status: 'warning' },
  { id: 3, name: 'Citra Kirana', class: 'X MIPA 3', points: 120, status: 'safe' },
  { id: 4, name: 'Dewi Lestari', class: 'XII IPS 1', points: -80, status: 'danger' },
  { id: 5, name: 'Eko Prasetyo', class: 'X MIPA 1', points: -10, status: 'safe' },
];

export default function SiswaPage() {
  const { user } = useAuth();
  
  return (
    <main className="flex-1 bg-slate-50 pb-20 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm flex flex-col z-10 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link href="/" className="mr-4 text-slate-500 active:scale-95 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold text-slate-800">Data Siswa</h1>
          </div>
          <div className="flex gap-2">
            {user?.role === 'admin' && (
              <Link href="/siswa/tambah" className="bg-primary-600 text-white p-2 rounded-full shadow-sm hover:bg-primary-700 active:scale-95 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </Link>
            )}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Cari siswa..." 
            className="w-full bg-slate-100 border-none rounded-xl py-3 px-4 pl-10 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-sm"
          />
          <div className="absolute left-3 top-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Filter chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
          <button className="whitespace-nowrap bg-primary-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold">Semua</button>
          <button className="whitespace-nowrap bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-xs font-semibold">Bermasalah</button>
          <button className="whitespace-nowrap bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-xs font-semibold">Berprestasi</button>
          <button className="whitespace-nowrap bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-xs font-semibold">Kelas XII</button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {students.map(student => (
            <div key={student.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg
                    ${student.status === 'safe' && student.points >= 0 ? 'bg-reward-100 text-reward-600' : 
                      student.status === 'danger' ? 'bg-violation-100 text-violation-600' : 
                      student.status === 'warning' ? 'bg-warning-100 text-warning-600' : 
                      'bg-slate-100 text-slate-500'
                    }
                  `}>
                    {student.name.charAt(0)}
                  </div>
                  {user?.role === 'admin' && (
                    <button className="absolute -bottom-1 -right-1 bg-white border border-slate-200 rounded-full p-1 text-slate-500 shadow-sm hover:text-primary-600 active:scale-95" title="Ubah Foto">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <div>
                  <Link href={`/siswa/${student.id}`} className="font-bold text-slate-800 leading-tight hover:text-primary-600 hover:underline block">{student.name}</Link>
                  <p className="text-xs text-slate-500 mt-1">{student.class}</p>
                </div>
              </div>
              <div className={`font-bold text-lg
                ${student.points > 0 ? 'text-reward-500' : 
                  student.points < -50 ? 'text-violation-600' : 
                  student.points < 0 ? 'text-warning-500' : 'text-slate-500'
                }
              `}>
                {student.points > 0 ? '+' : ''}{student.points}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
