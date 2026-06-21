"use client"
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { getClasses, getRecords } from '@/lib/dataService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

export default function RekapitulasiLanjutan() {
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedJenjang, setSelectedJenjang] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'violation', 'reward'

  useEffect(() => {
    const init = async () => {
      const cls = await getClasses();
      setClasses(cls);
      fetchData();
    };
    init();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const recs = await getRecords({ startDate, endDate, classId: selectedClass === 'all' ? null : selectedClass });
      setRecords(recs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // --- FILTERED DATA ---
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Filter by Type
      if (selectedType === 'violation' && r.points > 0) return false;
      if (selectedType === 'reward' && r.points < 0) return false;
      
      // Filter by Jenjang
      if (selectedJenjang !== 'all') {
        const className = r.className || '';
        if (selectedJenjang === 'X' && !className.startsWith('X.')) return false;
        if (selectedJenjang === 'XI' && !className.startsWith('XI.')) return false;
        if (selectedJenjang === 'XII' && !className.startsWith('XII.')) return false;
      }
      return true;
    });
  }, [records, selectedType, selectedJenjang]);

  // --- DERIVED DATA FOR CHARTS ---

  // 1. Summary Cards
  const summary = useMemo(() => {
    let totalPelanggaran = 0;
    let totalPenghargaan = 0;
    const uniqueStudents = new Set();
    filteredRecords.forEach(r => {
      uniqueStudents.add(r.studentId);
      if (r.points < 0) totalPelanggaran += 1;
      else if (r.points > 0) totalPenghargaan += 1;
    });
    return {
      pelanggaran: totalPelanggaran,
      penghargaan: totalPenghargaan,
      students: uniqueStudents.size
    };
  }, [filteredRecords]);

  // 2. Trend by Date (Bar Chart)
  const trendData = useMemo(() => {
    const map = {};
    filteredRecords.forEach(r => {
      const dateStr = r.date || r.createdAt.split('T')[0];
      if (!map[dateStr]) map[dateStr] = { date: dateStr, Pelanggaran: 0, Penghargaan: 0 };
      if (r.points < 0) map[dateStr].Pelanggaran += 1;
      else if (r.points > 0) map[dateStr].Penghargaan += 1;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  // 3. Violations by Class (Pie/Donut Chart)
  const classPieData = useMemo(() => {
    const map = {};
    filteredRecords.forEach(r => {
      if (r.points < 0) {
        if (!map[r.className]) map[r.className] = { name: r.className, value: 0 };
        map[r.className].value += 1;
      }
    });
    return Object.values(map).sort((a,b) => b.value - a.value).slice(0, 8); // Top 8
  }, [filteredRecords]);

  // --- EXPORT PDF ---
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan Rekapitulasi Kedisiplinan SIGMA 7", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 27);
    doc.text(`Filter Kelas: ${selectedClass === 'all' ? 'Semua Kelas' : classes.find(c=>c.id===selectedClass)?.name || selectedClass}`, 14, 32);
    doc.text(`Filter Jenjang: ${selectedJenjang === 'all' ? 'Semua Jenjang' : 'Kelas ' + selectedJenjang}`, 14, 37);
    doc.text(`Tipe Data: ${selectedType === 'all' ? 'Pelanggaran & Penghargaan' : selectedType === 'violation' ? 'Hanya Pelanggaran' : 'Hanya Penghargaan'}`, 14, 42);

    let currentY = 50;

    // Grouping: Jenjang -> Class -> Student
    const groupedData = {}; // { jenjang: { className: { studentName: { points, records: [] } } } }

    filteredRecords.forEach(r => {
      // Determine Jenjang
      let jenjang = 'Lainnya';
      if (r.className?.startsWith('X.')) jenjang = 'Kelas X';
      else if (r.className?.startsWith('XI.')) jenjang = 'Kelas XI';
      else if (r.className?.startsWith('XII.')) jenjang = 'Kelas XII';

      if (!groupedData[jenjang]) groupedData[jenjang] = {};
      if (!groupedData[jenjang][r.className]) groupedData[jenjang][r.className] = {};
      if (!groupedData[jenjang][r.className][r.studentName]) {
        groupedData[jenjang][r.className][r.studentName] = {
          totalPelanggaran: 0,
          totalPenghargaan: 0,
          records: []
        };
      }

      groupedData[jenjang][r.className][r.studentName].records.push(r);
      if (r.points < 0) groupedData[jenjang][r.className][r.studentName].totalPelanggaran += Math.abs(r.points);
      else groupedData[jenjang][r.className][r.studentName].totalPenghargaan += r.points;
    });

    const jenjangKeys = Object.keys(groupedData).sort();

    jenjangKeys.forEach(jenjang => {
      // Jenjang Header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94); // green
      doc.text(jenjang, 14, currentY);
      currentY += 8;

      const classKeys = Object.keys(groupedData[jenjang]).sort();
      classKeys.forEach(className => {
        // Class Header
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(59, 130, 246); // blue
        doc.text(`Kelas: ${className}`, 14, currentY);
        currentY += 6;

        const studentKeys = Object.keys(groupedData[jenjang][className]).sort();
        
        studentKeys.forEach(studentName => {
          const studentData = groupedData[jenjang][className][studentName];
          
          // Determine SP
          let spStatus = "-";
          if (studentData.totalPelanggaran >= 200) spStatus = "SP 3 (>= 200 Poin)";
          else if (studentData.totalPelanggaran >= 150) spStatus = "SP 2 (>= 150 Poin)";
          else if (studentData.totalPelanggaran >= 50) spStatus = "SP 1 (>= 50 Poin)";

          const tableData = studentData.records.map((r, idx) => [
            idx + 1,
            r.date || r.createdAt.split('T')[0],
            r.description,
            r.points > 0 ? `+${r.points}` : r.points,
            r.points > 0 ? 'Penghargaan' : 'Pelanggaran'
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [[`Siswa: ${studentName}`, `Total Pelanggaran: ${studentData.totalPelanggaran}`, `Total Penghargaan: ${studentData.totalPenghargaan}`, `Status: ${spStatus}`, '']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
            styles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 10 },
              1: { cellWidth: 25 },
              2: { cellWidth: 'auto' },
              3: { cellWidth: 20 },
              4: { cellWidth: 30 }
            },
            margin: { left: 14, right: 14 }
          });

          currentY = doc.lastAutoTable.finalY + 8;

          // Page break if too low
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }
        });
        currentY += 4;
      });
      currentY += 6;
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
    });

    doc.save(`Rekapitulasi_Sigma7_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-b-3xl px-6 pt-10 pb-8 shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3 mb-4">
            <Link href="/master" className="bg-white/20 hover:bg-white/30 transition-colors p-2 rounded-full backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Dashboard Rekapitulasi</h1>
              <p className="text-xs text-slate-400">Analisis Kedisiplinan Siswa SIGMA 7</p>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-end gap-3 bg-white/10 p-3 rounded-xl border border-white/5">
           <div className="flex-1 min-w-[120px]">
             <label className="text-[10px] font-semibold text-slate-300 uppercase mb-1 block">Dari Tanggal</label>
             <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-sm outline-none text-white focus:border-primary-500 transition-colors"/>
           </div>
           <div className="flex-1 min-w-[120px]">
             <label className="text-[10px] font-semibold text-slate-300 uppercase mb-1 block">Sampai Tanggal</label>
             <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-sm outline-none text-white focus:border-primary-500 transition-colors"/>
           </div>
           <div className="flex-1 min-w-[120px]">
             <label className="text-[10px] font-semibold text-slate-300 uppercase mb-1 block">Tipe Data</label>
             <select value={selectedType} onChange={e=>setSelectedType(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-sm outline-none text-white focus:border-primary-500 transition-colors appearance-none">
               <option value="all">Semua Tipe</option>
               <option value="violation">Hanya Pelanggaran</option>
               <option value="reward">Hanya Penghargaan</option>
             </select>
           </div>
           <div className="flex-1 min-w-[100px]">
             <label className="text-[10px] font-semibold text-slate-300 uppercase mb-1 block">Jenjang</label>
             <select value={selectedJenjang} onChange={e=>setSelectedJenjang(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-sm outline-none text-white focus:border-primary-500 transition-colors appearance-none">
               <option value="all">Semua</option>
               <option value="X">Kelas X</option>
               <option value="XI">Kelas XI</option>
               <option value="XII">Kelas XII</option>
             </select>
           </div>
           <div className="flex-1 min-w-[120px]">
             <label className="text-[10px] font-semibold text-slate-300 uppercase mb-1 block">Kelas</label>
             <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-sm outline-none text-white focus:border-primary-500 transition-colors appearance-none">
               <option value="all">Semua Kelas</option>
               {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
           </div>
           <button onClick={fetchData} className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 h-[38px] flex items-center justify-center min-w-[100px]">
             {loading ? 'Memuat...' : 'Terapkan'}
           </button>
           <button onClick={handleExportPDF} className="bg-white hover:bg-slate-100 text-slate-800 px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 h-[38px] flex items-center justify-center min-w-[140px] gap-2 ml-auto">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
             Cetak PDF
           </button>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Insiden</p>
              <p className="text-3xl font-black text-red-600">{summary.pelanggaran}</p>
              <p className="text-xs text-red-500 font-medium">Pelanggaran Tercatat</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Prestasi</p>
              <p className="text-3xl font-black text-green-600">{summary.penghargaan}</p>
              <p className="text-xs text-green-500 font-medium">Penghargaan Tercatat</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary-100 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Siswa Terlibat</p>
              <p className="text-3xl font-black text-primary-600">{summary.students}</p>
              <p className="text-xs text-primary-500 font-medium">Siswa Terdata</p>
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
              Tren Kedisiplinan Harian
            </h2>
            <div className="h-64 w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fontSize: 10}} tickMargin={10} stroke="#cbd5e1" />
                    <YAxis tick={{fontSize: 10}} stroke="#cbd5e1" allowDecimals={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                    <Bar dataKey="Pelanggaran" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Penghargaan" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">Tidak ada data tren</div>
              )}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
              Sebaran Pelanggaran per Kelas
            </h2>
            <div className="h-64 w-full">
              {classPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {classPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">Tidak ada data pelanggaran</div>
              )}
            </div>
          </div>
        </div>

        {/* FULL DATA TABLE */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
           <h2 className="font-bold text-slate-800 mb-4 text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                Tabel Riwayat Lengkap
              </span>
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{filteredRecords.length} Data</span>
           </h2>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead>
                 <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                   <th className="p-3 font-semibold rounded-tl-lg">Tanggal</th>
                   <th className="p-3 font-semibold">Nama Siswa</th>
                   <th className="p-3 font-semibold">Kelas</th>
                   <th className="p-3 font-semibold">Deskripsi</th>
                   <th className="p-3 font-semibold rounded-tr-lg">Poin</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredRecords.length === 0 ? (
                   <tr>
                     <td colSpan="5" className="p-8 text-center text-slate-400">Tidak ada data pada periode ini</td>
                   </tr>
                 ) : (
                   filteredRecords.map(r => (
                     <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                       <td className="p-3 whitespace-nowrap text-slate-600">{r.date || r.createdAt.split('T')[0]}</td>
                       <td className="p-3 font-bold text-slate-800">
                         <Link href={`/siswa/detail?id=${r.studentId}`} className="hover:text-primary-600 hover:underline">{r.studentName}</Link>
                       </td>
                       <td className="p-3 text-slate-600">{r.className}</td>
                       <td className="p-3 text-slate-600 max-w-[200px] truncate" title={r.description}>{r.description}</td>
                       <td className="p-3 font-bold">
                         <span className={`px-2 py-1 rounded text-xs ${r.points < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                           {r.points > 0 ? `+${r.points}` : r.points}
                         </span>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </div>

      </div>
    </main>
  );
}
