"use client"
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { getStudents } from '@/lib/dataService';

export default function Home() {
  const { user, logout } = useAuth();
  const [timeFilter, setTimeFilter] = useState('week'); // today, week, month, year
  const [topPelanggaran, setTopPelanggaran] = useState([]);
  const [topPrestasi, setTopPrestasi] = useState([]);
  const [topAbsences, setTopAbsences] = useState([]);
  const [spStudents, setSpStudents] = useState([]);
  const [studentIndicators, setStudentIndicators] = useState({});
  const [studentGenders, setStudentGenders] = useState({});
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
      
      const allStudents = await getStudents();
      const indicatorMap = {};
      const genderMap = {};
      const classMap = {};
      allStudents.forEach(s => {
          genderMap[s.id] = s.gender;
          classMap[s.id] = s.classId;
          const hpMerah = Math.abs(s.poinPelanggaran || 0);
          if (hpMerah >= 200) indicatorMap[s.id] = '⚠️⚠️⚠️';
          else if (hpMerah >= 150) indicatorMap[s.id] = '⚠️⚠️';
          else if (hpMerah >= 50) indicatorMap[s.id] = '⚠️';
      });
      setStudentIndicators(indicatorMap);
      setStudentGenders(genderMap);

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
          
          // Skip if student has been deleted from database
          if (!classMap.hasOwnProperty(data.studentId)) return;

          const currentClass = classMap[data.studentId] || data.className || '';
          
          if (currentClass.toUpperCase().startsWith('ALUMNI')) return;

          if (data.points < 0) {
              if (!studentMapPelanggaran[data.studentId]) {
                  studentMapPelanggaran[data.studentId] = { id: data.studentId, name: data.studentName, class: currentClass, points: 0 };
              }
              studentMapPelanggaran[data.studentId].points += data.points;
          } else if (data.points > 0) {
              if (!studentMapPrestasi[data.studentId]) {
                  studentMapPrestasi[data.studentId] = { id: data.studentId, name: data.studentName, class: currentClass, points: 0 };
              }
              studentMapPrestasi[data.studentId].points += data.points;
          }
      });

      const arrPelanggaran = Object.values(studentMapPelanggaran).sort((a, b) => a.points - b.points).slice(0, 5);
      const arrPrestasi = Object.values(studentMapPrestasi).sort((a, b) => b.points - a.points).slice(0, 5);

      // Fetch Upacara Absences
      const qAbsence = query(
        collection(db, 'attendance'),
        where('createdAt', '>=', isoStartDate)
      );
      const snapAbsence = await getDocs(qAbsence);
      const absMap = {};
      snapAbsence.docs.forEach(doc => {
          const data = doc.data();
          
          // Skip if student has been deleted from database
          if (!classMap.hasOwnProperty(data.studentId)) return;

          const currentClass = classMap[data.studentId] || data.className || '';
          
          if (currentClass.toUpperCase().startsWith('ALUMNI')) return;

          if (data.status !== 'Hadir') {
              if(!absMap[data.studentId]) absMap[data.studentId] = { id: data.studentId, name: data.studentName, class: currentClass, count: 0 };
              absMap[data.studentId].count += 1;
          }
      });
      const arrAbsence = Object.values(absMap).sort((a,b) => b.count - a.count).slice(0, 5);

      // Fetch SP Students (HP Merah <= 150 means poinPelanggaran <= -50)
      const qSP = query(
        collection(db, 'students'),
        where('poinPelanggaran', '<=', -50),
        orderBy('poinPelanggaran', 'asc')
      );
      const snapSP = await getDocs(qSP);
      const arrSP = snapSP.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(student => {
          if ((student.classId || '').toUpperCase().startsWith('ALUMNI')) return false;
          
          const hpMerah = Math.abs(student.poinPelanggaran || 0);
          const issued = student.spIssuedLevel || 0;
          if (hpMerah >= 200 && issued < 3) return true;
          if (hpMerah >= 150 && issued < 2) return true;
          if (hpMerah >= 50 && hpMerah < 150 && issued < 1) return true;
          return false;
      });

      setTopPelanggaran(arrPelanggaran);
      setTopPrestasi(arrPrestasi);
      setTopAbsences(arrAbsence);
      setSpStudents(arrSP);
    } catch (error) {
      console.error("Error fetching top records:", error);
    }
    setLoading(false);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
      {/* Header Profile / School Info */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 backdrop-blur-md bg-opacity-90 text-white rounded-b-3xl px-6 pt-10 pb-8 shadow-lg relative overflow-hidden">
        {/* Decorative circles for premium feel */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SIGMA 7</h1>
            <p className="text-primary-100 text-sm font-medium">SMAN 7 Makassar</p>
            <div className="mt-2 inline-flex items-center gap-2 bg-primary-700/50 rounded-full px-3 py-1">
              <span className="text-xs font-medium capitalize">{user?.username || user?.role || 'Admin'}</span>
              <button onClick={logout} className="ml-2 text-[10px] bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded-full transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mt-6">
        <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Aksi Cepat</h2>
        <div className={`grid gap-3 ${user?.role === 'admin' ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <Link href="/input" className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-2 flex flex-col items-center justify-center shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 active:scale-95 group">
            <div className="bg-primary-50 text-primary-600 h-10 w-10 rounded-full flex items-center justify-center mb-1 group-hover:bg-primary-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <span className="font-bold text-slate-700 text-[10px] text-center">Input Poin</span>
          </Link>
          <Link href="/siswa" className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-2 flex flex-col items-center justify-center shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 active:scale-95 group">
            <div className="bg-slate-50 text-slate-600 h-10 w-10 rounded-full flex items-center justify-center mb-1 group-hover:bg-slate-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <span className="font-bold text-slate-700 text-[10px] text-center">Siswa</span>
          </Link>
          <Link href="/upacara" className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-2 flex flex-col items-center justify-center shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 active:scale-95 group">
            <div className="bg-blue-50 text-blue-600 h-10 w-10 rounded-full flex items-center justify-center mb-1 group-hover:bg-blue-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
            </div>
            <span className="font-bold text-slate-700 text-[10px] text-center">Absen</span>
          </Link>
          {user?.role === 'admin' && (
            <Link href="/master" className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-2 flex flex-col items-center justify-center shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 active:scale-95 group">
              <div className="bg-purple-50 text-purple-600 h-10 w-10 rounded-full flex items-center justify-center mb-1 group-hover:bg-purple-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <span className="font-bold text-slate-700 text-[10px] text-center">Master</span>
            </Link>
          )}
        </div>
      </div>

      {/* Top 5 Lists & SP Warnings */}
      <div className="px-6 mt-8 pb-6 flex flex-col gap-6">

        {/* Peringatan SP Section */}
        {!loading && spStudents.length > 0 && (
            <div className="mb-2">
                <h2 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Siswa Perlu SP
                </h2>
                <div className="flex flex-col gap-3">
                    {spStudents.map((student) => {
                        const hpMerah = Math.abs(student.poinPelanggaran || 0);
                        const issued = student.spIssuedLevel || 0;
                        let spLevel = 'SP 1';
                        if (hpMerah >= 200 && issued < 3) spLevel = 'SP 3';
                        else if (hpMerah >= 150 && issued < 2) spLevel = 'SP 2';

                        return (
                            <Link href={`/siswa/detail?id=${student.id}`} key={student.id} className="bg-red-50 border border-red-200 rounded-xl p-3 flex justify-between items-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-red-100 text-red-600 font-bold rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {spLevel}
                                    </div>
                                    <div>
                                        <p className={`font-bold leading-tight ${student.gender === 'Wanita' ? 'text-pink-600' : student.gender === 'Pria' ? 'text-blue-600' : 'text-red-900'}`}>{student.name}</p>
                                        <p className="text-[10px] text-red-700 font-medium">{student.classId} • {hpMerah} Poin</p>
                                    </div>
                                </div>
                                <div className="bg-red-600 text-white rounded-full p-1.5 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        )}
        
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
                    {topPelanggaran.map((item, i) => {
                        const minPoints = topPelanggaran[0]?.points || -1; // points are negative
                        const percentage = Math.min(100, Math.max(0, (item.points / minPoints) * 100));
                        
                        const hpMerah = Math.abs(item.points || item.poinPelanggaran || 0);
                        let cardBg = 'hover:bg-slate-50';
                        if (hpMerah >= 150) cardBg = 'bg-red-50 hover:bg-red-100 border-red-200';
                        else if (hpMerah >= 50) cardBg = 'bg-orange-50 hover:bg-orange-100 border-orange-200';
                        
                        let nameColor = 'text-slate-800';
                        if (studentGenders[item.id] === 'Wanita') nameColor = 'text-pink-600';
                        else if (studentGenders[item.id] === 'Pria') nameColor = 'text-blue-600';

                        return (
                        <Link href={`/siswa/detail?id=${item.id}`} key={i} className={`relative p-3 border-b border-slate-50 last:border-0 transition-colors group overflow-hidden block ${cardBg}`}>
                            {/* Visual Progress Bar Background */}
                            <div className="absolute top-0 left-0 h-full bg-violation-50/30 -z-10 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                            
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                <div className="h-7 w-7 bg-violation-50 rounded text-violation-600 font-bold flex items-center justify-center text-xs group-hover:scale-110 transition-transform shadow-sm">
                                    #{i+1}
                                </div>
                                <div>
                                    <p className={`font-bold text-sm leading-tight flex items-center gap-1 ${nameColor}`}>
                                      {item.name}
                                      {studentIndicators[item.id] && <span className="text-red-500 text-[10px] tracking-tighter" title="Terindikasi Peringatan SP">{studentIndicators[item.id]}</span>}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{item.class || item.classId}</p>
                                </div>
                                </div>
                                <div className="text-violation-600 font-black text-sm bg-violation-50 px-2 py-1 rounded-md">
                                {item.points}
                                </div>
                            </div>
                        </Link>
                        );
                    })}
                </div>
                </div>

                {/* 2. Top 5 Siswa Prestasi */}
                <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="bg-reward-100 text-reward-600 p-1 rounded">🌟</span> Top 5 Penghargaan
                </h3>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    {topPrestasi.length === 0 && <p className="text-xs text-center text-slate-400 p-4">Tidak ada data</p>}
                    {topPrestasi.map((item, i) => {
                        const maxPoints = topPrestasi[0]?.points || 1;
                        const percentage = Math.min(100, Math.max(0, (item.points / maxPoints) * 100));
                        
                        let nameColor = 'text-slate-800';
                        if (studentGenders[item.id] === 'Wanita') nameColor = 'text-pink-600';
                        else if (studentGenders[item.id] === 'Pria') nameColor = 'text-blue-600';

                        return (
                        <Link href={`/siswa/detail?id=${item.id}`} key={i} className="relative p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group overflow-hidden block">
                            {/* Visual Progress Bar Background */}
                            <div className="absolute top-0 left-0 h-full bg-reward-50/50 -z-10 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                            
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                <div className="h-7 w-7 bg-reward-50 rounded text-reward-600 font-bold flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                                    #{i+1}
                                </div>
                                <div>
                                    <p className={`font-bold text-sm leading-tight flex items-center gap-1 ${nameColor}`}>
                                      {item.name}
                                      {studentIndicators[item.id] && <span className="text-red-500 text-[10px] tracking-tighter" title="Terindikasi Peringatan SP">{studentIndicators[item.id]}</span>}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{item.class || item.classId}</p>
                                </div>
                                </div>
                                <div className="text-reward-600 font-black text-sm bg-reward-50 px-2 py-1 rounded-md">
                                +{item.points}
                                </div>
                            </div>
                        </Link>
                        );
                    })}
                </div>
                </div>

                {/* 3. Top 5 Siswa Alpa Upacara */}
                <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="bg-red-100 text-red-600 p-1 rounded">📉</span> Top 5 Absen Upacara
                </h3>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    {topAbsences.length === 0 && <p className="text-xs text-center text-slate-400 p-4">Tidak ada data</p>}
                    {topAbsences.map((item, i) => (
                    <Link href={`/siswa/detail?id=${item.id}`} key={i} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors block">
                        <div className="flex items-center gap-3">
                        <div className="h-7 w-7 bg-red-50 rounded text-red-600 font-bold flex items-center justify-center text-xs">
                            #{i+1}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight flex items-center gap-1">
                              {item.name}
                              {studentIndicators[item.id] && <span className="text-red-500 text-[10px] tracking-tighter" title="Terindikasi Peringatan SP">{studentIndicators[item.id]}</span>}
                            </p>
                            <p className="text-[10px] text-slate-500">{item.class}</p>
                        </div>
                        </div>
                        <div className="text-red-600 font-black text-sm bg-red-50 px-2 py-1 rounded-md">
                        {item.count}x
                        </div>
                    </Link>
                    ))}
                </div>
                </div>
            </>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-xl border-t border-slate-200/50 px-6 py-3 flex justify-between items-center pb-safe z-50">
        <Link href="/dashboard" className="flex flex-col items-center text-primary-600">
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
