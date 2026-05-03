"use client"
import { useState } from 'react';
import Link from 'next/link';
import { violations, rewards } from '@/lib/data';

// Dummy data for auto-complete
const students = [
  { id: 1, name: 'Ahmad Fulan', class: 'XII.1' },
  { id: 2, name: 'Budi Santoso', class: 'XI.2' },
  { id: 3, name: 'Citra Kirana', class: 'X.3' },
  { id: 4, name: 'Dewi Lestari', class: 'XII.1' },
];

const generateClasses = () => {
  const kelas = [];
  for (let i = 1; i <= 10; i++) kelas.push(`X.${i}`);
  for (let i = 1; i <= 10; i++) kelas.push(`XI.${i}`);
  for (let i = 1; i <= 11; i++) kelas.push(`XII.${i}`);
  return kelas;
};

const classList = generateClasses();

export default function InputPage() {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [type, setType] = useState(null); // 'reward' or 'violation'
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchItem, setSearchItem] = useState(''); // Untuk filter list item
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]); // Default hari ini
  const [photo, setPhoto] = useState(null);

  // Filter students based on search AND class filter
  let filteredStudents = students;
  if (filterKelas) {
    filteredStudents = filteredStudents.filter(s => s.class === filterKelas);
  }
  if (search.length > 0) {
    filteredStudents = filteredStudents.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }

  // If only filterKelas is selected but no search, show students in that class
  const showStudents = search.length > 0 || filterKelas !== '';

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearch('');
    setFilterKelas('');
    setStep(2);
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

  const handleSave = () => {
    const fotoInfo = photo ? ' (dengan Foto Bukti)' : '';
    alert(`Tersimpan!\nSiswa: ${selectedStudent.name}\nTanggal: ${tanggal}\nStatus: ${type === 'reward' ? 'Prestasi' : 'Pelanggaran'} (${selectedItem.desc})${fotoInfo}`);
    setStep(1);
    setSelectedStudent(null);
    setType(null);
    setSelectedItem(null);
    setSearchItem('');
    setPhoto(null);
    setTanggal(new Date().toISOString().split('T')[0]);
  };

  return (
    <main className="flex-1 bg-slate-50 pb-20 flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm flex items-center border-b border-slate-100 z-10">
        <Link href="/" className="mr-4 text-slate-500 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="relative w-1/3">
                <select 
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 focus:border-primary-500 rounded-xl py-3 px-3 appearance-none outline-none transition-colors text-sm shadow-sm font-semibold text-slate-700"
                >
                  <option value="">Kelas</option>
                  <optgroup label="Kelas X">
                    {classList.filter(c => c.startsWith('X.')).map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="Kelas XI">
                    {classList.filter(c => c.startsWith('XI.')).map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="Kelas XII">
                    {classList.filter(c => c.startsWith('XII.')).map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                </select>
                <div className="absolute right-2 top-3.5 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {showStudents && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden max-h-[50vh] overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <div 
                      key={student.id} 
                      onClick={() => handleSelectStudent(student)}
                      className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 active:bg-slate-100 cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{student.name}</div>
                        <div className="text-sm text-slate-500 font-medium">Kelas {student.class}</div>
                      </div>
                      <div className="text-primary-600 bg-primary-50 p-1 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-slate-700 mb-1">Siswa tidak ditemukan</p>
                    <p className="text-xs">Coba cari dengan nama atau kelas lain</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Type */}
        {step === 2 && selectedStudent && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6 bg-slate-100 rounded-xl p-4 flex items-center justify-between border border-slate-200">
              <div>
                <div className="text-xs text-slate-500 mb-1 font-semibold uppercase">Siswa Terpilih:</div>
                <div className="font-bold text-slate-800 text-lg">{selectedStudent.name}</div>
                <div className="text-sm text-slate-500">{selectedStudent.class}</div>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <span className="font-bold text-reward-700 text-lg">Prestasi</span>
                <span className="text-xs text-reward-600 mt-1 font-medium">Tambah Poin</span>
              </button>

              <button 
                onClick={() => handleSelectType('violation')}
                className="bg-violation-50 border-2 border-violation-200 active:border-violation-500 rounded-2xl p-6 flex flex-col items-center justify-center transition-all active:scale-95 shadow-sm"
              >
                <div className="bg-white h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm text-violation-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
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
                  <span className="font-bold text-slate-800">{selectedStudent?.name}</span> <span className="text-xs text-slate-500">({selectedStudent?.class})</span>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-transparent overflow-hidden mb-6 flex flex-col gap-3 max-h-[35vh] overflow-y-auto pb-2 px-1">
              {type === 'violation' ? (
                violations.filter(i => i.desc.toLowerCase().includes(searchItem.toLowerCase())).map((item) => {
                  // Tentukan warna berdasarkan kategori (Ringan=Kuning, Sedang=Orange, Berat=Merah)
                  let cardColor = "bg-white border-slate-200";
                  let headerTextColor = "text-slate-800";
                  let badgeColor = "bg-slate-100 text-slate-600";
                  
                  if (item.category === 'Ringan') {
                    cardColor = selectedItem?.id === item.id ? "bg-yellow-50 border-yellow-400 ring-2 ring-yellow-400/50" : "bg-white border-yellow-200 hover:border-yellow-400";
                    headerTextColor = selectedItem?.id === item.id ? "text-yellow-900" : "text-slate-800";
                    badgeColor = "bg-yellow-100 text-yellow-800";
                  } else if (item.category === 'Sedang') {
                    cardColor = selectedItem?.id === item.id ? "bg-orange-50 border-orange-400 ring-2 ring-orange-400/50" : "bg-white border-orange-200 hover:border-orange-400";
                    headerTextColor = selectedItem?.id === item.id ? "text-orange-900" : "text-slate-800";
                    badgeColor = "bg-orange-100 text-orange-800";
                  } else if (item.category === 'Berat') {
                    cardColor = selectedItem?.id === item.id ? "bg-red-50 border-red-500 ring-2 ring-red-500/50" : "bg-white border-red-200 hover:border-red-400";
                    headerTextColor = selectedItem?.id === item.id ? "text-red-900" : "text-slate-800";
                    badgeColor = "bg-red-100 text-red-800";
                  }

                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm active:scale-[0.98] ${cardColor}`} 
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <span className={`font-bold leading-tight ${headerTextColor}`}>{item.desc}</span> 
                        <span className="text-violation-600 font-black bg-white/60 px-2 py-1 rounded text-sm shrink-0 shadow-sm border border-violation-100">-{item.points}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${badgeColor}`}>{item.category}</span>
                        <span className="text-xs font-bold text-slate-400 bg-white/50 px-2 rounded border border-slate-100">{item.id}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                rewards.filter(i => i.desc.toLowerCase().includes(searchItem.toLowerCase())).map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm active:scale-[0.98] 
                      ${selectedItem?.id === item.id ? 'bg-reward-50 border-reward-500 ring-2 ring-reward-500/50' : 'bg-white border-reward-100 hover:border-reward-300'}`} 
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className={`font-bold leading-tight ${selectedItem?.id === item.id ? 'text-reward-900' : 'text-slate-800'}`}>{item.desc}</span> 
                      <span className="text-reward-600 font-black bg-white/60 px-2 py-1 rounded text-sm shrink-0 shadow-sm border border-reward-100">+{item.points}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-reward-100 text-reward-700">{item.category}</span>
                      <span className="text-xs font-bold text-slate-400 bg-white/50 px-2 rounded border border-slate-100">{item.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tanggal Kejadian */}
            <div className="mb-4">
              <label htmlFor="tanggal" className="text-sm font-semibold text-slate-700 block mb-2">Tanggal Kejadian</label>
              <input 
                type="date" 
                id="tanggal"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 focus:border-primary-500 rounded-xl py-3 px-4 outline-none transition-colors text-sm shadow-sm"
              />
            </div>

            {/* Optional Photo Upload */}
            <div className="mb-6">
              <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                ${photo ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
              >
                {photo ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-primary-500 text-white p-1.5 rounded-full mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-primary-700">Foto Berhasil Dipilih</p>
                    <p className="text-[10px] text-primary-600 max-w-[200px] truncate">{photo.name}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-xs font-bold text-slate-500">Ambil Foto Bukti <span className="font-normal">(Opsional)</span></p>
                  </div>
                )}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            <button 
              disabled={!selectedItem}
              onClick={handleSave}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all active:scale-95 shadow-md ${
                selectedItem 
                  ? type === 'reward' ? 'bg-reward-500 hover:bg-reward-600' : 'bg-violation-500 hover:bg-violation-600'
                  : 'bg-slate-300'
              }`}
            >
              Simpan {type === 'reward' ? 'Prestasi' : 'Pelanggaran'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
