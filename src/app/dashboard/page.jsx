"use client"
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { getStudents } from '@/lib/dataService';

export default function Home() {
  const { user, logout } = useAuth();
  const [timeFilter, setTimeFilter] = useState('week'); // today, week, month, year
  
  // 7 Leaderboards
  const [topSiswaBermasalah, setTopSiswaBermasalah] = useState([]);
  const [topKelasBermasalah, setTopKelasBermasalah] = useState([]);
  const [topSiswaPanutan, setTopSiswaPanutan] = useState([]);
  const [topKelasPanutan, setTopKelasPanutan] = useState([]);
  const [topSiswaAlpa, setTopSiswaAlpa] = useState([]);
  const [topSiswaBolos, setTopSiswaBolos] = useState([]);
  const [topSiswaIzin, setTopSiswaIzin] = useState([]);

  const [expandedClass, setExpandedClass] = useState(null);

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

      const { data: snapRecords, error: err1 } = await supabase
        .from('records')
        .select('*, students(name, class_id, classes(name))')
        .gte('created_at', isoStartDate);
      if (err1) console.error("Error fetching records:", err1);
      
      const studentMapPelanggaran = {};
      const studentMapPrestasi = {};
      const classMapPelanggaran = {};
      const classMapPrestasi = {};

      (snapRecords || []).forEach(doc => {
          const data = {
            studentId: doc.student_id,
            studentName: doc.students?.name,
            className: doc.students?.classes?.name || doc.students?.class_id,
            points: doc.points
          };
          
          if (!classMap.hasOwnProperty(data.studentId)) return;
          const currentClass = classMap[data.studentId] || data.className || '';
          if (currentClass.toUpperCase().startsWith('ALUMNI')) return;

          if (data.points < 0) {
              if (!studentMapPelanggaran[data.studentId]) {
                  studentMapPelanggaran[data.studentId] = { id: data.studentId, name: data.studentName, class: currentClass, points: 0 };
              }
              studentMapPelanggaran[data.studentId].points += data.points;
              
              if (!classMapPelanggaran[currentClass]) {
                  classMapPelanggaran[currentClass] = { className: currentClass, points: 0, contributors: {} };
              }
              classMapPelanggaran[currentClass].points += data.points;
              if (!classMapPelanggaran[currentClass].contributors[data.studentId]) {
                  classMapPelanggaran[currentClass].contributors[data.studentId] = { id: data.studentId, name: data.studentName, points: 0 };
              }
              classMapPelanggaran[currentClass].contributors[data.studentId].points += data.points;

          } else if (data.points > 0) {
              if (!studentMapPrestasi[data.studentId]) {
                  studentMapPrestasi[data.studentId] = { id: data.studentId, name: data.studentName, class: currentClass, points: 0 };
              }
              studentMapPrestasi[data.studentId].points += data.points;
              
              if (!classMapPrestasi[currentClass]) {
                  classMapPrestasi[currentClass] = { className: currentClass, points: 0, contributors: {} };
              }
              classMapPrestasi[currentClass].points += data.points;
              if (!classMapPrestasi[currentClass].contributors[data.studentId]) {
                  classMapPrestasi[currentClass].contributors[data.studentId] = { id: data.studentId, name: data.studentName, points: 0 };
              }
              classMapPrestasi[currentClass].contributors[data.studentId].points += data.points;
          }
      });

      setTopSiswaBermasalah(Object.values(studentMapPelanggaran).sort((a, b) => a.points - b.points).slice(0, 5));
      setTopSiswaPanutan(Object.values(studentMapPrestasi).sort((a, b) => b.points - a.points).slice(0, 5));
      
      setTopKelasBermasalah(Object.values(classMapPelanggaran).sort((a, b) => a.points - b.points).slice(0, 5).map(c => ({
          ...c,
          topContributors: Object.values(c.contributors).sort((a, b) => a.points - b.points).slice(0, 5)
      })));
      setTopKelasPanutan(Object.values(classMapPrestasi).sort((a, b) => b.points - a.points).slice(0, 5).map(c => ({
          ...c,
          topContributors: Object.values(c.contributors).sort((a, b) => b.points - a.points).slice(0, 5)
      })));

      const { data: snapAbsence, error: err2 } = await supabase
        .from('attendance')
        .select('*, students(name, class_id, classes(name))')
        .gte('created_at', isoStartDate);
      if (err2) console.error("Error fetching attendance:", err2);
      const absMapAlpa = {};
      const absMapBolos = {};
      const absMapIzin = {};

      (snapAbsence || []).forEach(doc => {
          const data = {
            studentId: doc.student_id,
            studentName: doc.students?.name,
            className: doc.students?.classes?.name || doc.students?.class_id,
            status: doc.status
          };
          if (!classMap.hasOwnProperty(data.studentId)) return;
          const currentClass = classMap[data.studentId] || data.className || '';
          if (currentClass.toUpperCase().startsWith('ALUMNI')) return;

          if (data.status === 'Alpa') {
              if(!absMapAlpa[data.studentId]) absMapAlpa[data.studentId] = { id: data.studentId, name: data.studentName, class: currentClass, count: 0 };
              absMapAlpa[data.studentId].count += 1;
          } else if (data.status === 'Bolos') {
              if(!absMapBolos[data.studentId]) absMapBolos[data.studentId] = { id: data.studentId, name: data.studentName, class: currentClass, count: 0 };
              absMapBolos[data.studentId].count += 1;
          } else if (data.status === 'Izin') {
              if(!absMapIzin[data.studentId]) absMapIzin[data.studentId] = { id: data.studentId, name: data.studentName, class: currentClass, count: 0 };
              absMapIzin[data.studentId].count += 1;
          }
      });
      setTopSiswaAlpa(Object.values(absMapAlpa).sort((a,b) => b.count - a.count).slice(0, 5));
      setTopSiswaBolos(Object.values(absMapBolos).sort((a,b) => b.count - a.count).slice(0, 5));
      setTopSiswaIzin(Object.values(absMapIzin).sort((a,b) => b.count - a.count).slice(0, 5));

      const { data: snapSP, error: err3 } = await supabase
        .from('students')
        .select('*')
        .lte('poin_pelanggaran', -50)
        .order('poin_pelanggaran', { ascending: true });
      if (err3) console.error("Error fetching SP students:", err3);

      const arrSP = (snapSP || []).map(doc => ({
          ...doc,
          classId: doc.class_id,
          poinPelanggaran: doc.poin_pelanggaran,
          spIssuedLevel: doc.sp_issued_level
      })).filter(student => {
          if ((student.classId || '').toUpperCase().startsWith('ALUMNI')) return false;
          const hpMerah = Math.abs(student.poinPelanggaran || 0);
          const issued = student.spIssuedLevel || 0;
          if (hpMerah >= 200 && issued < 3) return true;
          if (hpMerah >= 150 && issued < 2) return true;
          if (hpMerah >= 50 && hpMerah < 150 && issued < 1) return true;
          return false;
      });
      setSpStudents(arrSP);
    } catch (error) {
      console.error("Error fetching top records:", error);
    }
    setLoading(false);
  };

  const toggleAccordion = (classId) => {
    if (expandedClass === classId) setExpandedClass(null);
    else setExpandedClass(classId);
  };

  const renderStudentItem = (item, i, type = 'pelanggaran') => {
      const hpMerah = Math.abs(item.points || item.poinPelanggaran || 0);
      let cardBg = 'hover:bg-slate-50';
      if (type === 'pelanggaran') {
          if (hpMerah >= 150) cardBg = 'bg-red-50 hover:bg-red-100 border-red-200';
          else if (hpMerah >= 50) cardBg = 'bg-orange-50 hover:bg-orange-100 border-orange-200';
      }
      
      let nameColor = 'text-slate-800';
      if (studentGenders[item.id] === 'Wanita') nameColor = 'text-pink-600';
      else if (studentGenders[item.id] === 'Pria') nameColor = 'text-blue-600';

      const maxP = type === 'pelanggaran' ? Math.min(...topSiswaBermasalah.map(x=>x.points)) || -1 : Math.max(...topSiswaPanutan.map(x=>x.points)) || 1;
      const percentage = Math.min(100, Math.max(0, (item.points / maxP) * 100));

      return (
        <Link href={`/siswa/detail?id=${item.id}`} key={i} className={`relative p-3 border-b border-slate-50 last:border-0 transition-colors group overflow-hidden block ${cardBg}`}>
            <div className={`absolute top-0 left-0 h-full ${type === 'pelanggaran' ? 'bg-violation-50/30' : 'bg-reward-50/50'} -z-10 transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                <div className={`h-7 w-7 rounded font-bold flex items-center justify-center text-xs group-hover:scale-110 transition-transform shadow-sm ${type === 'pelanggaran' ? 'bg-violation-50 text-violation-600' : 'bg-reward-50 text-reward-600'}`}>
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
                <div className={`font-black text-sm px-2 py-1 rounded-md ${type === 'pelanggaran' ? 'text-violation-600 bg-violation-50' : 'text-reward-600 bg-reward-50'}`}>
                {type === 'prestasi' ? '+' : ''}{item.points}
                </div>
            </div>
        </Link>
      );
  };

  const renderClassItem = (item, i, type = 'pelanggaran') => {
      const isExpanded = expandedClass === `${type}-${item.className}`;
      const maxP = type === 'pelanggaran' ? Math.min(...topKelasBermasalah.map(x=>x.points)) || -1 : Math.max(...topKelasPanutan.map(x=>x.points)) || 1;
      const percentage = Math.min(100, Math.max(0, (item.points / maxP) * 100));

      return (
        <div key={i} className="border-b border-slate-100 last:border-0">
            <div onClick={() => toggleAccordion(`${type}-${item.className}`)} className="relative p-3 hover:bg-slate-50 transition-colors group overflow-hidden cursor-pointer">
                <div className={`absolute top-0 left-0 h-full ${type === 'pelanggaran' ? 'bg-violation-50/30' : 'bg-reward-50/50'} -z-10 transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`h-7 w-7 rounded font-bold flex items-center justify-center text-xs shadow-sm ${type === 'pelanggaran' ? 'bg-violation-50 text-violation-600' : 'bg-reward-50 text-reward-600'}`}>
                            #{i+1}
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-tight text-slate-800">Kelas {item.className}</p>
                            <p className="text-[10px] text-slate-500">Klik untuk melihat kontributor</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`font-black text-sm px-2 py-1 rounded-md ${type === 'pelanggaran' ? 'text-violation-600 bg-violation-50' : 'text-reward-600 bg-reward-50'}`}>
                            {type === 'prestasi' ? '+' : ''}{item.points}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>
            {isExpanded && (
                <div className="bg-slate-50 p-3 pt-1 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Top Kontributor</p>
                    <div className="space-y-1.5">
                        {item.topContributors.map((c, idx) => (
                            <Link href={`/siswa/detail?id=${c.id}`} key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm hover:shadow border border-slate-100">
                                <span className={`text-xs font-semibold ${studentGenders[c.id] === 'Wanita' ? 'text-pink-600' : studentGenders[c.id] === 'Pria' ? 'text-blue-600' : 'text-slate-700'}`}>{c.name}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${type === 'pelanggaran' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{type === 'prestasi' ? '+' : ''}{c.points}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
      );
  };

  const renderAbsenceItem = (item, i, typeTitle) => {
      let icon = '📉';
      let bg = 'bg-red-50 text-red-600';
      if (typeTitle === 'Izin') { icon = '📨'; bg = 'bg-blue-50 text-blue-600'; }
      else if (typeTitle === 'Bolos') { icon = '🏃'; bg = 'bg-orange-50 text-orange-600'; }

      return (
        <Link href={`/siswa/detail?id=${item.id}`} key={i} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors block">
            <div className="flex items-center gap-3">
            <div className={`h-7 w-7 rounded font-bold flex items-center justify-center text-xs ${bg}`}>
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
            <div className={`font-black text-sm px-2 py-1 rounded-md ${bg}`}>
            {item.count}x
            </div>
        </Link>
      );
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 backdrop-blur-md bg-opacity-90 text-white rounded-b-3xl px-6 pt-10 pb-8 shadow-lg relative overflow-hidden">
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

      <div className="px-6 mt-8 pb-6 flex flex-col gap-6">
        {/* Peringatan SP */}
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
        
        {/* Leaderboards Header */}
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
             <div className="h-32 bg-slate-200 rounded-xl"></div>
             <div className="h-32 bg-slate-200 rounded-xl"></div>
           </div> 
        ) : (
            <div className="flex flex-col gap-6">
                
                {/* 1. Top Siswa Bermasalah */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <span className="bg-violation-100 text-violation-600 p-1 rounded">⚠️</span> 1. Top Siswa Bermasalah
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        {topSiswaBermasalah.length === 0 && <p className="text-xs text-center text-slate-400 p-4">Tidak ada data</p>}
                        {topSiswaBermasalah.map((item, i) => renderStudentItem(item, i, 'pelanggaran'))}
                    </div>
                </div>

                {/* 2. Top Kelas Bermasalah */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-600 p-1 rounded">🏫</span> 2. Top Kelas Bermasalah
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        {topKelasBermasalah.length === 0 && <p className="text-xs text-center text-slate-400 p-4">Tidak ada data</p>}
                        {topKelasBermasalah.map((item, i) => renderClassItem(item, i, 'pelanggaran'))}
                    </div>
                </div>

                {/* 3. Top Siswa Panutan */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <span className="bg-reward-100 text-reward-600 p-1 rounded">🌟</span> 3. Top Siswa Panutan
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        {topSiswaPanutan.length === 0 && <p className="text-xs text-center text-slate-400 p-4">Tidak ada data</p>}
                        {topSiswaPanutan.map((item, i) => renderStudentItem(item, i, 'prestasi'))}
                    </div>
                </div>

                {/* 4. Top Kelas Panutan */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <span className="bg-green-100 text-green-600 p-1 rounded">🏫</span> 4. Top Kelas Panutan
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        {topKelasPanutan.length === 0 && <p className="text-xs text-center text-slate-400 p-4">Tidak ada data</p>}
                        {topKelasPanutan.map((item, i) => renderClassItem(item, i, 'prestasi'))}
                    </div>
                </div>

                {/* 5. Top Siswa Alpa */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <span className="bg-red-100 text-red-600 p-1 rounded">📉</span> 5. Top Siswa Alpa Upacara
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        {topSiswaAlpa.length === 0 && <p className="text-xs text-center text-slate-400 p-4">Tidak ada data</p>}
                        {topSiswaAlpa.map((item, i) => renderAbsenceItem(item, i, 'Alpa'))}
                    </div>
                </div>

                {/* 6. Top Siswa Bolos */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-600 p-1 rounded">🏃</span> 6. Top Siswa Bolos Upacara
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        {topSiswaBolos.length === 0 && <p className="text-xs text-center text-slate-400 p-4">Tidak ada data</p>}
                        {topSiswaBolos.map((item, i) => renderAbsenceItem(item, i, 'Bolos'))}
                    </div>
                </div>

                {/* 7. Top Siswa Izin */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-600 p-1 rounded">📨</span> 7. Top Siswa Izin Upacara
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        {topSiswaIzin.length === 0 && <p className="text-xs text-center text-slate-400 p-4">Tidak ada data</p>}
                        {topSiswaIzin.map((item, i) => renderAbsenceItem(item, i, 'Izin'))}
                    </div>
                </div>

            </div>
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
