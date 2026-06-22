"use client"
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getStudents, getClasses, addRecord, getRules } from '@/lib/dataService';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/lib/firebase';
import imageCompression from 'browser-image-compression';
import { toast, Toaster } from 'react-hot-toast';

function InputForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = parseInt(searchParams.get('step') || '1');
  const setStep = (newStep) => router.push(`?step=${newStep}`);

  const [students, setStudents] = useState([]);
  const [classList, setClassList] = useState([]);
  const [violations, setViolations] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [type, setType] = useState(null); // 'reward' or 'violation'
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchItem, setSearchItem] = useState(''); 
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadInitData = async () => {
      const [cls, stds, rulesData] = await Promise.all([getClasses(), getStudents(), getRules()]);
      setClassList(cls);
      setStudents(stds);
      setViolations(rulesData.filter(r => r.type === 'violation'));
      setRewards(rulesData.filter(r => r.type === 'reward'));

      const initialStudentId = searchParams.get('studentId');
      if (initialStudentId && step === 2) {
        const std = stds.find(s => s.id === initialStudentId);
        if (std) {
          setSelectedStudents([std]);
        }
      }
    };
    loadInitData();
  }, [searchParams]);

  let filteredStudents = students;
  if (filterKelas) filteredStudents = filteredStudents.filter(s => s.classId === filterKelas);
  if (search.length > 0) filteredStudents = filteredStudents.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const showStudents = search.length > 0 || filterKelas !== '';

  const handleToggleStudent = (student) => {
    setSelectedStudents(prev => {
      const exists = prev.find(s => s.id === student.id);
      if (exists) return prev.filter(s => s.id !== student.id);
      return [...prev, student];
    });
  };

  const selectAllInClass = () => {
    if (filterKelas) {
      const classStudents = students.filter(s => s.classId === filterKelas);
      setSelectedStudents(classStudents);
    }
  };

  const handleSelectType = (selectedType) => {
    setType(selectedType);
    setSearchItem('');
    setStep(3);
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      let photoUrl = '';
      if (photo) {
        const options = { maxSizeMB: 0.15, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(photo, options);
        const storage = getStorage(app);
        const fileName = compressedFile.name || photo.name || 'photo.jpg';
        const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const fileRef = ref(storage, `records/${Date.now()}_${safeFileName}`);
        await uploadBytes(fileRef, compressedFile);
        photoUrl = await getDownloadURL(fileRef);
      }

      const promises = selectedStudents.map(student => {
        return addRecord({
          studentId: student.id,
          studentName: student.name,
          classId: student.classId,
          className: student.classId,
          type: type,
          itemId: selectedItem.id,
          description: selectedItem.desc,
          category: selectedItem.category,
          points: type === 'reward' ? selectedItem.points : -Math.abs(selectedItem.points),
          date: tanggal,
          photoUrl: photoUrl
        });
      });

      await Promise.all(promises);

      toast.success('Data berhasil disimpan!');
      
      // Reset
        setTimeout(() => {
          if (searchParams.get('studentId')) {
             router.push(`/siswa/detail?id=${searchParams.get('studentId')}`);
          } else {
             router.push('?step=1');
             setSelectedStudents([]);
             setType(null);
             setSelectedItem(null);
             setSearchItem('');
             setPhoto(null);
             setTanggal(new Date().toISOString().split('T')[0]);
          }
        }, 1500);

    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan data');
    }
    setSubmitting(false);
  };

  return (
    <main className="flex-1 bg-slate-50 pb-20 flex flex-col h-screen">
      <Toaster />
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm flex items-center border-b border-slate-100 z-10">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.push('/dashboard')} className="mr-4 text-slate-500 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-slate-800">Input Poin</h1>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className={`text-xs font-bold ${step >= 1 ? 'text-primary-600' : 'text-slate-400'}`}>1. Siswa</div>
          <div className={`h-px flex-1 mx-2 ${step >= 2 ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
          <div className={`text-xs font-bold ${step >= 2 ? 'text-primary-600' : 'text-slate-400'}`}>2. Jenis</div>
          <div className={`h-px flex-1 mx-2 ${step >= 3 ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
          <div className={`text-xs font-bold ${step >= 3 ? 'text-primary-600' : 'text-slate-400'}`}>3. Item</div>
        </div>

        {/* Step 1: Search Student */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Cari Siswa</h2>
            
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ketik nama..." 
                  className="w-full bg-white border-2 border-slate-200 focus:border-primary-500 rounded-xl py-3 px-4 pl-10 outline-none transition-colors text-sm shadow-sm"
                />
                <div className="absolute left-3 top-3.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>

              <div className="relative w-1/3">
                <select 
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 focus:border-primary-500 rounded-xl py-3 px-3 appearance-none outline-none transition-colors text-sm shadow-sm font-semibold text-slate-700"
                >
                  <option value="">Kelas</option>
                  {classList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <div className="absolute right-2 top-3.5 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>
              </div>
            </div>

            {filterKelas && (
              <button 
                onClick={selectAllInClass}
                className="mb-3 w-full bg-slate-100 text-slate-700 font-bold text-xs py-2 rounded-lg border border-slate-200 active:bg-slate-200 transition-colors"
              >
                Pilih Semua di Kelas {filterKelas}
              </button>
            )}

            {showStudents && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden max-h-[40vh] overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => {
                    const isSelected = selectedStudents.some(s => s.id === student.id);
                    return (
                      <div 
                        key={student.id} 
                        onClick={() => handleToggleStudent(student)}
                        className={`p-4 border-b border-slate-50 last:border-0 cursor-pointer flex justify-between items-center transition-colors ${isSelected ? 'bg-primary-50 hover:bg-primary-100' : 'hover:bg-slate-50'}`}
                      >
                        <div>
                          <div className={`font-bold ${isSelected ? 'text-primary-700' : 'text-slate-800'}`}>{student.name}</div>
                          <div className={`text-sm font-medium ${isSelected ? 'text-primary-500' : 'text-slate-500'}`}>Kelas {student.classId}</div>
                        </div>
                        <div className={`p-1 rounded-full ${isSelected ? 'text-white bg-primary-600' : 'text-slate-300 bg-slate-100'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-slate-700 mb-1">Siswa tidak ditemukan</p>
                    <p className="text-xs">Coba cari dengan nama atau kelas lain</p>
                  </div>
                )}
              </div>
            )}

            {selectedStudents.length > 0 && (
              <button 
                onClick={() => setStep(2)}
                className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95"
              >
                Lanjut ({selectedStudents.length} Siswa Terpilih)
              </button>
            )}
          </div>
        )}

        {/* Step 2: Select Type */}
        {step === 2 && selectedStudents.length > 0 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6 bg-slate-100 rounded-xl p-4 flex items-center justify-between border border-slate-200">
              <div>
                <div className="text-xs text-slate-500 mb-1 font-semibold uppercase">Siswa Terpilih:</div>
                <div className="font-bold text-slate-800 text-lg">{selectedStudents.length === 1 ? selectedStudents[0].name : `${selectedStudents.length} Siswa`}</div>
                <div className="text-sm text-slate-500">{selectedStudents.length === 1 ? selectedStudents[0].classId : 'Multiple Classes'}</div>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-primary-600 font-bold bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm active:scale-95">Ganti</button>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-4">Pilih Jenis</h2>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleSelectType('reward')}
                className="bg-reward-50 border-2 border-reward-200 active:border-reward-500 rounded-2xl p-6 flex flex-col items-center justify-center transition-all active:scale-95 shadow-sm"
              >
                <div className="bg-white h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm text-reward-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </div>
                <span className="font-bold text-reward-700 text-lg">Prestasi</span>
                <span className="text-xs text-reward-600 mt-1 font-medium">Tambah Poin</span>
              </button>

              <button 
                onClick={() => handleSelectType('violation')}
                className="bg-violation-50 border-2 border-violation-200 active:border-violation-500 rounded-2xl p-6 flex flex-col items-center justify-center transition-all active:scale-95 shadow-sm"
              >
                <div className="bg-white h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm text-violation-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <span className="font-bold text-violation-700 text-lg">Pelanggaran</span>
                <span className="text-xs text-violation-600 mt-1 font-medium">Kurangi Poin</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Item */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-4 bg-slate-100 rounded-xl p-4 flex flex-col gap-3 border border-slate-200">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Siswa Terpilih</span>
                  <span className="font-bold text-slate-800">{selectedStudents.length === 1 ? selectedStudents[0].name : `${selectedStudents.length} Siswa`}</span> <span className="text-xs text-slate-500">({selectedStudents.length === 1 ? selectedStudents[0].classId : 'Multiple Classes'})</span>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm font-semibold active:scale-95">Ubah</button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Jenis</span>
                  <span className={`font-bold ${type === 'reward' ? 'text-reward-600' : 'text-violation-600'}`}>{type === 'reward' ? '🌟 Prestasi' : '⚠️ Pelanggaran'}</span>
                </div>
                <button onClick={() => setStep(2)} className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm font-semibold active:scale-95">Ubah</button>
              </div>
            </div>

            {/* Pencarian Keterangan */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Cari Keterangan</h2>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  placeholder={`Cari jenis ${type === 'reward' ? 'prestasi' : 'pelanggaran'}...`} 
                  className="w-full bg-white border-2 border-slate-200 focus:border-primary-500 rounded-xl py-3 px-4 pl-10 outline-none transition-colors text-sm shadow-sm"
                />
                <div className="absolute left-3 top-3.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>
            </div>
            
            <div className="bg-transparent overflow-hidden mb-6 flex flex-col gap-3 max-h-[35vh] overflow-y-auto pb-2 px-1">
              {type === 'violation' ? (
                violations.filter(i => i.desc.toLowerCase().includes(searchItem.toLowerCase())).map((item) => {
                  let cardColor = selectedItem?.id === item.id ? "bg-red-50 border-red-500 ring-2 ring-red-500/50" : "bg-white border-red-200 hover:border-red-400";
                  return (
                    <div key={item.id} className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm active:scale-[0.98] ${cardColor}`} onClick={() => setSelectedItem(item)}>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <span className="font-bold leading-tight text-slate-800">{item.desc}</span> 
                        <span className="text-violation-600 font-black bg-white/60 px-2 py-1 rounded text-sm shrink-0 shadow-sm border border-violation-100">{item.points}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                rewards.filter(i => i.desc.toLowerCase().includes(searchItem.toLowerCase())).map((item) => (
                  <div key={item.id} className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm active:scale-[0.98] ${selectedItem?.id === item.id ? 'bg-reward-50 border-reward-500 ring-2 ring-reward-500/50' : 'bg-white border-reward-100 hover:border-reward-300'}`} onClick={() => setSelectedItem(item)}>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="font-bold leading-tight text-slate-800">{item.desc}</span> 
                      <span className="text-reward-600 font-black bg-white/60 px-2 py-1 rounded text-sm shrink-0 shadow-sm border border-reward-100">+{item.points}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="tanggal" className="text-sm font-semibold text-slate-700 block mb-2">Tanggal Kejadian</label>
              <input type="date" id="tanggal" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full bg-white border-2 border-slate-200 focus:border-primary-500 rounded-xl py-3 px-4 outline-none transition-colors text-sm shadow-sm" />
            </div>

            <div className="mb-6">
              {photo ? (
                <div className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-primary-500 bg-primary-50 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="absolute top-2 right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <p className="text-xs font-bold text-primary-700">Foto Siap Diupload</p>
                  <p className="text-[10px] text-primary-600 max-w-[200px] truncate">{photo.name}</p>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-xs font-bold text-slate-500">Ambil Foto Bukti <span className="font-normal">(Opsional)</span></p>
                  </div>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>

            <button 
              disabled={!selectedItem || submitting}
              onClick={handleSave}
              className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-md ${!selectedItem ? 'bg-slate-300' : type === 'reward' ? 'bg-reward-500 hover:bg-reward-600' : 'bg-violation-500 hover:bg-violation-600'}`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Menyimpan...
                </>
              ) : (
                `Simpan ${type === 'reward' ? 'Prestasi' : 'Pelanggaran'}`
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function InputPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Memuat formulir...</div>}>
      <InputForm />
    </Suspense>
  );
}
