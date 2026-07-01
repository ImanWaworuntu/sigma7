"use client"
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getStudents, getClasses } from '@/lib/dataService';

export default function SiswaPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('Semua'); // Semua, Bermasalah, Berprestasi, Kelas XII
  const [displayLimit, setDisplayLimit] = useState(20);
  const [sortBy, setSortBy] = useState('name-asc');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setDisplayLimit(20);
  }, [searchTerm, filter, sortBy]);

  const observerRef = useRef(null);
  const loadingRef = useCallback(node => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setDisplayLimit(prev => prev + 20);
      }
    });
    if (node) observerRef.current.observe(node);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stds, cls] = await Promise.all([
        getStudents(),
        getClasses()
      ]);
      setStudents(stds);
      setClasses(cls);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // Filter & Search Logic
  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (s.classId || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchFilter = true;
    const isAlumni = (s.classId || '').toUpperCase().startsWith('ALUMNI');

    if (filter === 'Bermasalah') matchFilter = (s.poinPelanggaran || 0) < 0 && !isAlumni;
    else if (filter === 'Berprestasi') matchFilter = (s.poinPenghargaan || 0) > 0 && !isAlumni;
    else if (filter === 'Perlu SP') matchFilter = (s.poinPelanggaran || 0) <= -50 && !isAlumni;
    else if (filter === 'Kelas X') matchFilter = (s.classId || '').toUpperCase().startsWith('X') && !(s.classId || '').toUpperCase().startsWith('XI') && !(s.classId || '').toUpperCase().startsWith('XII');
    else if (filter === 'Kelas XI') matchFilter = (s.classId || '').toUpperCase().startsWith('XI') && !(s.classId || '').toUpperCase().startsWith('XII');
    else if (filter === 'Kelas XII') matchFilter = (s.classId || '').toUpperCase().startsWith('XII') && !isAlumni;
    else if (filter === 'Alumni') matchFilter = isAlumni;
    else if (filter === 'Semua') matchFilter = !isAlumni;
    else matchFilter = s.classId === filter;

    return matchSearch && matchFilter;
  }).sort((a, b) => {
    if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
    if (sortBy === 'violation-desc') return Math.abs(b.poinPelanggaran || 0) - Math.abs(a.poinPelanggaran || 0);
    if (sortBy === 'reward-desc') return (b.poinPenghargaan || 0) - (a.poinPenghargaan || 0);
    return 0;
  });

  const visibleStudents = filteredStudents.slice(0, displayLimit);

  return (
    <main className="flex-1 bg-slate-50 pb-20 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm flex flex-col z-10 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4 text-slate-500 active:scale-95 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-lg font-bold text-slate-800">Data Siswa</h1>
          </div>
          <div className="flex gap-2">
            {user?.role === 'admin' && (
              <Link href="/siswa/tambah" className="bg-primary-600 text-white p-2 rounded-full shadow-sm hover:bg-primary-700 active:scale-95 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
              </Link>
            )}
          </div>
        </div>
        
        {/* Search & Sort */}
        <div className="flex gap-2 relative">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Cari nama atau kelas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-xl py-3 px-4 pl-10 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-sm"
            />
            <div className="absolute left-3 top-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <div className="relative w-28 shrink-0">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-full bg-slate-100 border-none rounded-xl pl-3 pr-8 outline-none focus:ring-2 focus:ring-primary-500 text-xs text-slate-600 font-semibold appearance-none"
            >
              <option value="name-asc">A - Z</option>
              <option value="name-desc">Z - A</option>
              <option value="violation-desc">Pelanggaran</option>
              <option value="reward-desc">Penghargaan</option>
            </select>
            <div className="absolute right-2 top-0 bottom-0 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
        
        {/* Filter chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
          {['Semua', 'Bermasalah', 'Perlu SP', 'Berprestasi', 'Kelas X', 'Kelas XI', 'Kelas XII', 'Alumni'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-xl"></div>)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleStudents.length === 0 && <div className="text-center text-slate-500 mt-10">Tidak ada data.</div>}
            
            {visibleStudents.map(student => {
              const pPelanggaran = student.poinPelanggaran || 0;
              const pPenghargaan = student.poinPenghargaan || 0;
              
              const hpMerah = Math.abs(pPelanggaran);
              const hpHijau = pPenghargaan;

              const statusColor = pPelanggaran < -50 ? 'bg-violation-100 text-violation-600' : 
                                  pPenghargaan > 0 ? 'bg-reward-100 text-reward-600' : 
                                  'bg-slate-100 text-slate-500';
              let cardBg = 'bg-white border-slate-100';
              if (hpMerah >= 150) cardBg = 'bg-red-50 border-red-200';
              else if (hpMerah >= 50) cardBg = 'bg-orange-50 border-orange-200';

              let nameColor = 'text-slate-800 group-hover:text-primary-600';
              if (student.gender === 'Wanita') nameColor = 'text-pink-600 group-hover:text-pink-700';
              else if (student.gender === 'Pria') nameColor = 'text-blue-600 group-hover:text-blue-700';

              return (
                <Link href={`/siswa/detail?id=${student.id}`} key={student.id} className={`rounded-xl p-4 shadow-sm border flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all group block cursor-pointer ${cardBg}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                    <div className="relative shrink-0">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${statusColor}`}>
                        {student.name.charAt(0)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold leading-tight transition-colors truncate ${nameColor}`} title={student.name}>{student.name}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{student.classId}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end w-24 shrink-0">
                    <div className="w-full flex items-center justify-between text-[10px] font-bold text-red-600 mb-0.5">
                      <span>Pelanggaran</span>
                      <span>{hpMerah}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex mb-2" title={`${hpMerah} Poin Pelanggaran`}>
                      <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${Math.min(100, (hpMerah/200)*100)}%` }}></div>
                    </div>
                    <div className="w-full flex items-center justify-between text-[10px] font-bold text-green-600 mb-0.5">
                      <span>Penghargaan</span>
                      <span>{hpHijau}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex" title={`${hpHijau} Poin Penghargaan`}>
                      <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${Math.min(100, (hpHijau/200)*100)}%` }}></div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {visibleStudents.length > 0 && displayLimit < filteredStudents.length && (
              <div ref={loadingRef} className="py-4 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
