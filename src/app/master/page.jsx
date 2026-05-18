"use client"
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getClasses, addClass, deleteClass, getStudents, moveStudents, graduateClass12, addStudent } from '@/lib/dataService';
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

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    const cls = await getClasses();
    setClasses(cls);
    setLoading(false);
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName) return;
    try {
      await addClass({ name: newClassName.toUpperCase() });
      toast.success(`Kelas ${newClassName} ditambahkan`);
      setNewClassName('');
      fetchClasses();
    } catch (e) {
      toast.error('Gagal tambah kelas');
    }
  };

  const handleDeleteClass = async (id, name) => {
    if (!confirm(`Hapus kelas ${name}? Pastikan kelas kosong.`)) return;
    try {
      await deleteClass(id);
      toast.success('Kelas dihapus');
      fetchClasses();
    } catch (e) {
      toast.error('Gagal hapus');
    }
  };

  // --- Kenaikan / Pindah Kelas ---
  const handleFetchStudentsForTransfer = async (classId) => {
    setSelectedClassFrom(classId);
    if (!classId) {
        setStudentsInClass([]);
        return;
    }
    const stds = await getStudents(classId);
    setStudentsInClass(stds);
    setSelectedStudents([]); // Reset selection
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
        handleFetchStudentsForTransfer(selectedClassFrom); // Refresh list
    } catch (e) {
        toast.error("Gagal memindahkan siswa");
    }
  };

  const handleGraduate = async () => {
    if (!confirm("PERHATIAN! Tindakan ini akan menghapus/mengarsipkan SEMUA siswa yang berada di kelas berawalan 'XII'. Lanjutkan?")) return;
    try {
        await graduateClass12();
        toast.success("Siswa kelas XII berhasil diluluskan!");
    } catch (e) {
        toast.error("Gagal meluluskan siswa");
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
      <Toaster />
      <div className="bg-primary-600 text-white rounded-b-3xl px-6 pt-10 pb-8 shadow-md">
        <div className="flex items-center gap-3">
            <Link href="/" className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-xl font-bold tracking-tight">Master Data</h1>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        
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
