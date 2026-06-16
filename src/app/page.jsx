"use client"
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

export default function Home() {
  const { user, logout } = useAuth();
  const [timeFilter, setTimeFilter] = useState('today'); // today, week, month, year
  const [topPelanggaran, setTopPelanggaran] = useState([]);
  const [topPrestasi, setTopPrestasi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopRecords();
  }, [timeFilter]);

  const fetchTopRecords = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate;
      if (timeFilter === 'today') startDate = startOfDay(now);
      else if (timeFilter === 'week') startDate = startOfWeek(now, { weekStartsOn: 1 });
      else if (timeFilter === 'month') startDate = startOfMonth(now);
      else if (timeFilter === 'year') startDate = startOfYear(now);
      
      const isoStartDate = startDate.toISOString();
      
      // Fetch ALL records for the period to avoid complex composite index requirements
      const qRecords = query(
        collection(db, 'records'),
        where('createdAt', '>=', isoStartDate)
      );
      const snapRecords = await getDocs(qRecords);
      
      const studentMapPelanggaran = {};
      const studentMapPrestasi = {};

      snapRecords.docs.forEach(doc => {
          const data = doc.data();
          if (data.points < 0) {
              if (!studentMapPelanggaran[data.studentId]) {
                  studentMapPelanggaran[data.studentId] = { name: data.studentName, class: data.className, points: 0 };
              }
              studentMapPelanggaran[data.studentId].points += data.points;
          } else if (data.points > 0) {
              if (!studentMapPrestasi[data.studentId]) {
                  studentMapPrestasi[data.studentId] = { name: data.studentName, class: data.className, points: 0 };
              }
              studentMapPrestasi[data.studentId].points += data.points;
          }
      });

      const arrPelanggaran = Object.values(studentMapPelanggaran).sort((a, b) => a.points - b.points).slice(0, 5);
      const arrPrestasi = Object.values(studentMapPrestasi).sort((a, b) => b.points - a.points).slice(0, 5);

      setTopPelanggaran(arrPelanggaran);
      setTopPrestasi(arrPrestasi);
    } catch (error) {
      console.error("Error fetching top records:", error);
    }
    setLoading(false);
  };

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
              <span className="text-xs font-medium capitalize">{user?.role || 'Admin'}</span>
              <button onClick={logout} className="ml-2 text-[10px] bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded-full transition-colors">Logout</button>
            </div>
          </div>
          <div className="h-14 w-14 bg-white rounded-lg flex items-center justify-center p-1 shadow-md">
            <div className="h-full w-full bg-slate-200 rounded animate-pulse" /> {/* Placeholder for logo */}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mt-6">
        <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Aksi Cepat</h2>
        <div className="grid grid-cols-4 gap-2">
          <Link href="/input" className="bg-white border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform">
            <div className="bg-primary-100 text-primary-600 h-8 w-8 rounded-full flex items-center justify-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <span className="font-semibold text-slate-700 text-[10px] text-center">Input Poin</span>
          </Link>
          <Link href="/siswa" className="bg-white border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform">
            <div className="bg-slate-100 text-slate-600 h-8 w-8 rounded-full flex items-center justify-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <span className="font-semibold text-slate-700 text-[10px] text-center">Data Siswa</span>
          </Link>
          <Link href="/upacara" className="bg-white border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform">
            <div className="bg-blue-100 text-blue-600 h-8 w-8 rounded-full flex items-center justify-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
            </div>
            <span className="font-semibold text-slate-700 text-[10px] text-center">Absen</span>
          </Link>
          <Link href="/master" className="bg-white border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform">
            <div className="bg-purple-100 text-purple-600 h-8 w-8 rounded-full flex items-center justify-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <span className="font-semibold text-slate-700 text-[10px] text-center">Master</span>
          </Link>
        </div>
      </div>

      {/* Top 5 Lists */}
      <div className="px-6 mt-8 pb-6 flex flex-col gap-6">
        
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Papan Peringkat</h2>
            <select 
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs font-semibold px-2 py-1 outline-none text-slate-600"
            >
                <option value="today">Hari Ini</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="year">Tahun Ini</option>
            </select>
        </div>

        {loading ? (
           <div className="animate-pulse space-y-4">
             <div className="h-24 bg-slate-200 rounded-xl"></div>
             <div className="h-24 bg-slate-200 rounded-xl"></div>
           </div> 
        ) : (
            <>
                {/* 1. Top 5 Siswa Pelanggaran */}
                <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="bg-violation-100 text-violation-600 p-1 rounded">⚠️</span> Top 5 Pelanggaran
                </h3>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    {topPelanggaran.length === 0 && <p className="text-xs text-center text-slate-400 p-4">Tidak ada data</p>}
                    {topPelanggaran.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-3">
                        <div className="h-7 w-7 bg-violation-50 rounded text-violation-600 font-bold flex items-center justify-center text-xs">
                            #{i+1}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                            <p className="text-[10px] text-slate-500">{item.class}</p>
                        </div>
                        </div>
                        <div className="text-violation-600 font-black text-sm bg-violation-50 px-2 py-1 rounded-md">
                        {item.points}
                        </div>
                    </div>
                    ))}
                </div>
                </div>

                {/* 2. Top 5 Siswa Prestasi */}
                <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="bg-reward-100 text-reward-600 p-1 rounded">🌟</span> Top 5 Penghargaan
                </h3>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    {topPrestasi.length === 0 && <p className="text-xs text-center text-slate-400 p-4">Tidak ada data</p>}
                    {topPrestasi.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-3">
                        <div className="h-7 w-7 bg-reward-50 rounded text-reward-600 font-bold flex items-center justify-center text-xs">
                            #{i+1}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                            <p className="text-[10px] text-slate-500">{item.class}</p>
                        </div>
                        </div>
                        <div className="text-reward-600 font-black text-sm bg-reward-50 px-2 py-1 rounded-md">
                        +{item.points}
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            </>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center pb-safe z-50">
        <Link href="/" className="flex flex-col items-center text-primary-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href="/input" className="flex flex-col items-center text-slate-400 hover:text-primary-600 transition-colors">
          <div className="bg-primary-600 text-white rounded-full p-2 -mt-6 shadow-lg shadow-primary-600/30 border-4 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
          <span className="text-[10px] font-semibold mt-1">Input</span>
        </Link>
        <Link href="/siswa" className="flex flex-col items-center text-slate-400 hover:text-primary-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          <span className="text-[10px] font-semibold">Siswa</span>
        </Link>
      </div>
    </main>
  );
}
