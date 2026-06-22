"use client"
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { 
  getRules, addRule, deleteRule, 
  getClasses, addClass, deleteClass, 
  getStudents, moveStudents, graduateClass12, cleanAlumniRecords
} from '@/lib/dataService';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toast, Toaster } from 'react-hot-toast';

export default function MasterData() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

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


  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.replace('/dashboard');
    } else if (!authLoading && user?.role === 'admin') {
      fetchInitData();
    }
  }, [user, authLoading, router]);

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
    if (!confirm("PERHATIAN! Tindakan ini meluluskan siswa kelas XII (akan diubah menjadi ALUMNI + Tahun). Lanjutkan?")) return;
    try {
        await graduateClass12();
        toast.success("Siswa kelas XII berhasil diluluskan!");
    } catch (e) {
        toast.error("Gagal meluluskan siswa");
    }
  };

  const handleCleanAlumni = async () => {
    if (!confirm("PERHATIAN! Tindakan ini akan menghapus semua RIWAYAT PELANGGARAN dan FOTO BUKTI untuk semua ALUMNI secara permanen. Biodata alumni akan tetap aman. Lanjutkan?")) return;
    setCleaning(true);
    try {
        await cleanAlumniRecords();
        toast.success("Riwayat dan foto alumni berhasil dihapus secara permanen!");
    } catch (e) {
        console.error(e);
        toast.error("Gagal menghapus riwayat alumni");
    }
    setCleaning(false);
  };

  const handleDownloadAlumni = async () => {
    try {
      const allStudents = await getStudents(); 
      const alumniList = allStudents.filter(s => s.status === 'graduated');
      
      if (alumniList.length === 0) {
        return toast.error("Belum ada data alumni.");
      }

      const csvRows = [];
      const headers = ['Nama', 'Kelas Kelulusan', 'Jenis Kelamin', 'NIS', 'NISN', 'Poin Pelanggaran', 'Poin Penghargaan'];
      csvRows.push(headers.join(','));

      alumniList.forEach(s => {
        const row = [
          `"${s.name || ''}"`,
          `"${s.classId || ''}"`,
          `"${s.gender || ''}"`,
          `"${s.nis || ''}"`,
          `"${s.nisn || ''}"`,
          s.poinPelanggaran || 0,
          s.poinPenghargaan || 0
        ];
        csvRows.push(row.join(','));
      });

      const blob = new Blob([csvRows.join('\\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `data_alumni_${new Date().getFullYear()}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      toast.error("Gagal mengunduh data");
    }
  };

  const runMigration = async () => {
    if (!confirm("Jalankan injeksi otomatis Gender, NIS, dan NISN untuk seluruh siswa?")) return;
    try {
      const snapshot = await getDocs(collection(db, "students"));
      let count = 0;
      
      const guessGender = (name) => {
        const n = (name || "").toLowerCase();
        if (n.includes('putri') || n.includes('ayu') || n.includes('wati') || n.includes('sari') || n.includes('nisa') || n.includes('nur') || n.includes('dwi') || n.includes('indah') || n.endsWith('ni') || n.endsWith('na') || n.endsWith('ah') || n.endsWith('ia')) {
          return 'Wanita';
        }
        return 'Pria'; 
      };

      for (const document of snapshot.docs) {
        const data = document.data();
        let updates = {};
        let needsUpdate = false;

        if (!data.gender) {
          updates.gender = guessGender(data.name);
          needsUpdate = true;
        }
        if (data.nis === undefined) {
          updates.nis = "";
          needsUpdate = true;
        }
        if (data.nisn === undefined) {
          updates.nisn = "";
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(doc(db, "students", document.id), updates);
          count++;
        }
      }
      toast.success(`Berhasil menginjeksi ${count} data siswa!`);
    } catch (e) {
      toast.error("Gagal menjalankan migrasi");
      console.error(e);
    }
  };


  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
      <Toaster />
      <div className="bg-primary-600 text-white rounded-b-3xl px-6 pt-10 pb-8 shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <Link href="/dashboard" className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-xl font-bold tracking-tight">Master Data</h1>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        
        {/* REKAPITULASI MENU */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden border border-slate-700">
            {/* Dekorasi Background */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-500/20 blur-3xl rounded-full"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full"></div>
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center p-2.5 bg-white/10 rounded-xl mb-3 backdrop-blur-sm border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h2 className="font-bold text-xl mb-1.5 tracking-tight">
                  Dashboard Rekapitulasi
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
                  Akses panel analitik mendalam, pantau tren kedisiplinan per kelas, dan cetak laporan rekam jejak secara komprehensif.
                </p>
              </div>
              <Link href="/master/rekapitulasi" className="w-full sm:w-auto bg-primary-600 hover:bg-primary-500 text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2 mt-2 sm:mt-0 group border border-primary-400/50">
                <span>Buka Dashboard</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
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

        {/* LULUSKAN KELAS XII */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mt-6">
            <h2 className="font-bold text-slate-800 mb-1 border-b pb-2">Luluskan Kelas XII</h2>
            <p className="text-[10px] text-slate-500 mb-3">Tindakan ini akan memindahkan semua siswa kelas XII ke status ALUMNI beserta tahun kelulusannya.</p>
            <button 
                onClick={handleGraduate}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg text-sm transition-colors"
            >
                Proses Kelulusan
            </button>
        </div>

        {/* MANAJEMEN ALUMNI (JUNI) */}
        <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-200 mt-6">
            <h2 className="font-bold text-orange-800 mb-1 border-b border-orange-200 pb-2">Manajemen Alumni & Beban Database</h2>
            <p className="text-[10px] text-orange-600 mb-4">Gunakan fitur di bawah untuk mengelola data alumni. Unduh Excel untuk mencadangkan rekam jejak mereka, lalu Bersihkan Rekam Jejak (Sangat disarankan tiap bulan Juni) untuk menghemat kapasitas database dari beban foto. Biodata tetap aman.</p>
            <div className="flex flex-col sm:flex-row gap-2">
                <button 
                    onClick={handleDownloadAlumni}
                    className="flex-1 bg-white hover:bg-slate-50 text-orange-700 border border-orange-300 font-bold py-2 rounded-lg text-sm transition-colors shadow-sm"
                >
                    Unduh CSV (Excel) Alumni
                </button>
                <button 
                    onClick={handleCleanAlumni}
                    disabled={cleaning}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                    {cleaning ? 'Membersihkan...' : 'Hapus Rekam Jejak & Foto'}
                </button>
            </div>
        </div>

        {/* MIGRASI DATA */}
        <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100 mt-6 mb-10">
            <h2 className="font-bold text-red-800 mb-1 border-b border-red-200 pb-2">Migrasi Data Terpusat (Admin)</h2>
            <p className="text-[10px] text-red-600 mb-3">Jalankan fungsi ini HANYA SEKALI untuk menyuntikkan kolom Jenis Kelamin, NIS, dan NISN ke seluruh siswa yang sudah ada di database saat ini secara otomatis.</p>
            <button 
                onClick={runMigration}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-sm"
            >
                Injeksi Database (Sekarang)
            </button>
        </div>

      </div>
    </main>
  );
}
