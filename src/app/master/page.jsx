"use client"
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getClasses, addClass, deleteClass, getStudents, moveStudents, graduateClass12, getRules, addRule, deleteRule, getRecords } from '@/lib/dataService';
import { toast, Toaster } from 'react-hot-toast';

export default function MasterData() {
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(true);

  // Transfer Student State
  const [selectedClassFrom, setSelectedClassFrom] = useState('');
  const [selectedClassTo, setSelectedClassTo] = useState('');
  const [studentsInClass, setStudentsInClass] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Rules State
  const [rules, setRules] = useState([]);
  const [ruleType, setRuleType] = useState('violation');
  const [ruleDesc, setRuleDesc] = useState('');
  const [rulePoints, setRulePoints] = useState('');
  const [ruleCategory, setRuleCategory] = useState('Ringan');

  // Recap State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [recapTopStudents, setRecapTopStudents] = useState([]);
  const [recapTopClasses, setRecapTopClasses] = useState([]);
  const [recapLoading, setRecapLoading] = useState(false);

  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    setLoading(true);
    const [cls, rls] = await Promise.all([getClasses(), getRules()]);
    setClasses(cls);
    setRules(rls);
    setLoading(false);
  };

  // --- CLASSES ---
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName) return;
    try {
      await addClass({ name: newClassName.toUpperCase() });
      toast.success(`Kelas ${newClassName} ditambahkan`);
      setNewClassName('');
      const cls = await getClasses(); setClasses(cls);
    } catch (e) {
      toast.error('Gagal tambah kelas');
    }
  };

  const handleDeleteClass = async (id, name) => {
    if (!confirm(`Hapus kelas ${name}? Pastikan kelas kosong.`)) return;
    try {
      await deleteClass(id);
      toast.success('Kelas dihapus');
      const cls = await getClasses(); setClasses(cls);
    } catch (e) {
      toast.error('Gagal hapus');
    }
  };

  // --- RULES ---
  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!ruleDesc || !rulePoints) return;
    try {
      let pts = parseInt(rulePoints);
      if (ruleType === 'violation' && pts > 0) pts = -pts;
      if (ruleType === 'reward' && pts < 0) pts = Math.abs(pts);

      await addRule({
        type: ruleType,
        desc: ruleDesc,
        points: pts,
        category: ruleType === 'reward' ? 'Prestasi' : ruleCategory
      });
      toast.success('Aturan berhasil ditambahkan');
      setRuleDesc('');
      setRulePoints('');
      const rls = await getRules(); setRules(rls);
    } catch (e) {
      toast.error('Gagal tambah aturan');
    }
  };

  const handleDeleteRule = async (id) => {
    if (!confirm("Hapus aturan ini?")) return;
    try {
      await deleteRule(id);
      toast.success('Aturan dihapus');
      const rls = await getRules(); setRules(rls);
    } catch (e) {
      toast.error('Gagal hapus aturan');
    }
  };

  // --- TRANSFER ---
  const handleFetchStudentsForTransfer = async (classId) => {
    setSelectedClassFrom(classId);
    if (!classId) {
        setStudentsInClass([]);
        return;
    }
    const stds = await getStudents(classId);
    setStudentsInClass(stds);
    setSelectedStudents([]);
  };

  const toggleStudentSelection = (id) => {
    if (selectedStudents.includes(id)) {
        setSelectedStudents(prev => prev.filter(s => s !== id));
    } else {
        setSelectedStudents(prev => [...prev, id]);
    }
  };

  const handleTransfer = async () => {
    if (!selectedClassTo) return toast.error("Pilih kelas tujuan!");
    if (selectedStudents.length === 0) return toast.error("Pilih minimal 1 siswa!");
    
    try {
        await moveStudents(selectedStudents, selectedClassTo);
        toast.success(`${selectedStudents.length} siswa berhasil dipindahkan!`);
        setSelectedClassTo('');
        setSelectedStudents([]);
        const stds = await getStudents(selectedClassFrom);
        setStudentsInClass(stds);
    } catch (e) {
        toast.error("Gagal memindahkan siswa");
    }
  };

  const handleGraduate = async () => {
    if (!confirm("PERHATIAN! Tindakan ini meluluskan siswa kelas XII. Lanjutkan?")) return;
    try {
        await graduateClass12();
        toast.success("Siswa kelas XII berhasil diluluskan!");
    } catch (e) {
        toast.error("Gagal meluluskan siswa");
    }
  };

  // --- RECAP ---
  const handleGenerateRecap = async () => {
    setRecapLoading(true);
    try {
      const allRecords = await getRecords({ startDate, endDate });
      
      const studentMap = {};
      const classMap = {};

      allRecords.forEach(r => {
        // Student Aggregation
        if (!studentMap[r.studentId]) {
          studentMap[r.studentId] = { name: r.studentName, className: r.className, points: 0, violationCount: 0, rewardCount: 0 };
        }
        studentMap[r.studentId].points += r.points;
        if (r.points < 0) studentMap[r.studentId].violationCount++;
        else studentMap[r.studentId].rewardCount++;

        // Class Aggregation
        if (!classMap[r.classId]) {
          classMap[r.classId] = { className: r.className, points: 0, violationCount: 0, rewardCount: 0, uniqueViolators: new Set() };
        }
        classMap[r.classId].points += r.points;
        if (r.points < 0) {
            classMap[r.classId].violationCount++;
            classMap[r.classId].uniqueViolators.add(r.studentId);
        } else {
            classMap[r.classId].rewardCount++;
        }
      });

      const topStudents = Object.values(studentMap).sort((a,b) => a.points - b.points).slice(0, 10);
      const topClasses = Object.values(classMap).map(c => ({
          ...c,
          uniqueViolatorCount: c.uniqueViolators.size
      })).sort((a,b) => a.points - b.points).slice(0, 10);

      setRecapTopStudents(topStudents);
      setRecapTopClasses(topClasses);
      toast.success("Rekap berhasil dibuat");
    } catch (error) {
      toast.error("Gagal membuat rekap");
    }
    setRecapLoading(false);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
      <Toaster />
      <div className="bg-primary-600 text-white rounded-b-3xl px-6 pt-10 pb-8 shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <Link href="/" className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-xl font-bold tracking-tight">Master Data</h1>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        
        {/* REKAPITULASI KHUSUS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Rekapitulasi Cepat
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Mulai</label>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none bg-slate-50"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Sampai</label>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none bg-slate-50"/>
              </div>
            </div>
            <button onClick={handleGenerateRecap} disabled={recapLoading} className="w-full bg-slate-800 text-white font-bold py-2 rounded-lg text-sm mb-4">
              {recapLoading ? 'Menghitung...' : 'Buat Rekap'}
            </button>

            {recapTopStudents.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 bg-slate-100 p-2 rounded mb-2">Paling Sering Melanggar (Top 10 Siswa)</h3>
                  {recapTopStudents.map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-xs border-b border-slate-50 py-1">
                      <span>{i+1}. {s.name} ({s.className})</span>
                      <span className="text-red-600 font-bold">{s.points} Pts</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-700 bg-slate-100 p-2 rounded mb-2">Kelas Paling Bermasalah (Top 10 Kelas)</h3>
                  {recapTopClasses.map((c, i) => (
                    <div key={i} className="flex justify-between items-center text-xs border-b border-slate-50 py-1">
                      <div>
                        <span>{i+1}. {c.className}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{c.uniqueViolatorCount} siswa melanggar</p>
                      </div>
                      <span className="text-red-600 font-bold">{c.points} Pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* MANAJEMEN ATURAN */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-3 border-b pb-2">Aturan & Poin</h2>
            <form onSubmit={handleAddRule} className="space-y-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex gap-2">
                <select value={ruleType} onChange={e=>setRuleType(e.target.value)} className="flex-1 border rounded-lg p-2 text-sm outline-none">
                  <option value="violation">Pelanggaran</option>
                  <option value="reward">Prestasi</option>
                </select>
                {ruleType === 'violation' && (
                  <select value={ruleCategory} onChange={e=>setRuleCategory(e.target.value)} className="flex-1 border rounded-lg p-2 text-sm outline-none">
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Berat">Berat</option>
                  </select>
                )}
              </div>
              <input type="text" placeholder="Deskripsi Aturan..." value={ruleDesc} onChange={e=>setRuleDesc(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none"/>
              <div className="flex gap-2">
                <input type="number" placeholder="Poin (Cth: 10)" value={rulePoints} onChange={e=>setRulePoints(e.target.value)} className="flex-1 border rounded-lg p-2 text-sm outline-none"/>
                <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Tambah</button>
              </div>
            </form>

            <div className="h-48 overflow-y-auto space-y-2 border-t pt-2">
              {rules.map(r => (
                <div key={r.id} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded shadow-sm text-xs">
                  <div>
                    <span className={`font-bold mr-2 ${r.type === 'violation' ? 'text-red-600' : 'text-green-600'}`}>
                      {r.points > 0 ? `+${r.points}` : r.points}
                    </span>
                    <span>{r.desc} <span className="text-[10px] text-slate-400">({r.category})</span></span>
                  </div>
                  <button onClick={() => handleDeleteRule(r.id)} className="text-red-500 hover:text-red-700 p-1">&times;</button>
                </div>
              ))}
            </div>
        </div>

        {/* MANAJEMEN KELAS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-3 border-b pb-2">Manajemen Kelas</h2>
            <form onSubmit={handleAddClass} className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    placeholder="Nama Kelas (ex: X.1)" 
                    className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                />
                <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold">+</button>
            </form>
            
            <div className="max-h-40 overflow-y-auto flex flex-wrap gap-2">
                {classes.map(c => (
                    <div key={c.id} className="bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-200">
                        <span className="font-semibold">{c.name}</span>
                        <button onClick={() => handleDeleteClass(c.id, c.name)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                    </div>
                ))}
            </div>
        </div>

        {/* PINDAH / NAIK KELAS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-1 border-b pb-2">Naik / Pindah Kelas</h2>
            <p className="text-[10px] text-slate-500 mb-3">Pindahkan siswa ke kelas baru atau naik tingkat.</p>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <label className="text-xs font-semibold text-slate-600">Dari Kelas:</label>
                    <select 
                        className="w-full border rounded-lg p-2 text-sm outline-none"
                        value={selectedClassFrom}
                        onChange={(e) => handleFetchStudentsForTransfer(e.target.value)}
                    >
                        <option value="">-- Pilih --</option>
                        {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-600">Ke Kelas (Tujuan):</label>
                    <select 
                        className="w-full border rounded-lg p-2 text-sm outline-none"
                        value={selectedClassTo}
                        onChange={(e) => setSelectedClassTo(e.target.value)}
                    >
                        <option value="">-- Pilih --</option>
                        {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {selectedClassFrom && (
                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold">Pilih Siswa ({selectedStudents.length}/{studentsInClass.length}):</span>
                        <button 
                            className="text-[10px] text-primary-600 font-bold"
                            onClick={() => setSelectedStudents(selectedStudents.length === studentsInClass.length ? [] : studentsInClass.map(s => s.id))}
                        >
                            {selectedStudents.length === studentsInClass.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {studentsInClass.map(s => (
                            <label key={s.id} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-100 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={selectedStudents.includes(s.id)}
                                    onChange={() => toggleStudentSelection(s.id)}
                                    className="accent-primary-600"
                                />
                                <span className="text-xs font-semibold text-slate-700">{s.name}</span>
                            </label>
                        ))}
                    </div>
                    <button 
                        onClick={handleTransfer}
                        className="w-full mt-3 bg-primary-600 text-white font-bold py-2 rounded-lg text-sm"
                    >
                        Pindahkan Siswa
                    </button>
                </div>
            )}
        </div>

        {/* KELULUSAN */}
        <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100">
            <h2 className="font-bold text-red-700 mb-1 border-b border-red-200 pb-2 flex items-center gap-2">
                🎓 Kelulusan Kelas XII
            </h2>
            <p className="text-[10px] text-red-600/80 mb-3">Tindakan ini akan me-luluskan (menghapus status aktif) seluruh siswa yang berada di kelas XII. Lakukan hanya di akhir tahun ajaran.</p>
            <button 
                onClick={handleGraduate}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-sm transition-colors"
            >
                Luluskan Siswa Kelas XII
            </button>
        </div>

      </div>
    </main>
  );
}
