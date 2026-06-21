"use client"
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getClasses } from '@/lib/dataService';
import { useAuth } from '@/lib/AuthContext';

export default function Upacara() {
  const { user, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [topAbsences, setTopAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const cls = await getClasses();
      setClasses(cls);

      // Dummy calculation for top absences since we need to aggregate
      // Ideally we fetch from attendance collection and group by student
      const q = query(collection(db, 'attendance'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      
      const absMap = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.status !== 'Hadir') {
            if(!absMap[data.studentId]) absMap[data.studentId] = { name: data.studentName, class: data.className, count: 0 };
            absMap[data.studentId].count += 1;
        }
      });
      
      const arr = Object.values(absMap).sort((a,b) => b.count - a.count).slice(0, 5);
      setTopAbsences(arr);

    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 backdrop-blur-md bg-opacity-90 text-white rounded-b-3xl px-6 pt-10 pb-16 shadow-lg relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
        
        <div className="relative z-10 flex justify-between items-start">
            {user?.role === 'osis' ? (
              <div className="w-full flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">SIGMA 7</h1>
                  <p className="text-blue-100 text-sm font-medium">SMAN 7 Makassar</p>
                  <div className="mt-2 inline-flex items-center gap-2 bg-blue-700/50 rounded-full pr-3 pl-1 py-1">
                    <div className="h-6 w-6 bg-white rounded-full flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                      {user?.username?.charAt(0) || 'O'}
                    </div>
                    <span className="text-xs font-medium capitalize">{user?.username || 'OSIS'}</span>
                    <button onClick={logout} className="ml-2 text-[10px] bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded-full transition-colors shadow-sm">Logout</button>
                  </div>
                </div>
                <div className="h-14 w-14 bg-white/20 rounded-lg flex items-center justify-center p-1 shadow-md backdrop-blur-sm">
                  <div className="h-full w-full bg-white/50 rounded animate-pulse" /> {/* Placeholder for logo */}
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="bg-white/20 p-2 rounded-full backdrop-blur-sm transition-colors shadow-sm active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Absensi Upacara</h1>
                        <p className="text-blue-100 text-xs font-medium">Pilih Kelas</p>
                    </div>
                </div>
                <div className="w-10"></div>
              </div>
            )}
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20">
        
        {/* Top 5 Absences */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="bg-red-100 text-red-600 p-1 rounded">📉</span> Top 5 (Alpa, Izin, Bolos)
            </h2>
            
            {loading ? (
                <div className="animate-pulse h-20 bg-slate-100 rounded-xl"></div>
            ) : (
                <div className="space-y-3">
                    {topAbsences.length === 0 && <p className="text-xs text-center text-slate-400 p-2">Belum ada data absensi yang buruk.</p>}
                    {topAbsences.map((item, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 bg-red-50 text-red-600 font-bold rounded flex items-center justify-center text-xs">#{i+1}</div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                                    <p className="text-[10px] text-slate-500">{item.class}</p>
                                </div>
                            </div>
                            <div className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                {item.count}x Absen
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Classes List */}
        <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Pilih Kelas</h2>
        {loading ? (
            <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-14 bg-slate-200 animate-pulse rounded-xl"></div>)}
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-3">
                {classes.length === 0 && (
                    <div className="col-span-2 bg-yellow-50 text-yellow-600 p-4 text-center rounded-xl text-sm font-semibold border border-yellow-200">
                        Belum ada kelas yang terdaftar. <br/> Tambahkan kelas di halaman Master Data.
                    </div>
                )}
                {classes.map(c => (
                    <Link key={c.id} href={`/upacara/kelas/absensi?classId=${c.name}`} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm active:scale-95 transition-transform">
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                ))}
                
                {/* Fallback buttons if db is empty just to show UI */}
                {classes.length === 0 && (
                    <>
                        <Link href={`/upacara/kelas/absensi?classId=dummy`} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm active:scale-95 transition-transform">
                            <span className="font-bold text-slate-800">X.1 (Dummy)</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </Link>
                    </>
                )}
            </div>
        )}
      </div>
    </main>
  );
}
