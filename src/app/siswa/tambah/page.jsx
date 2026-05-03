"use client"
import { useState } from 'react';
import Link from 'next/link';

// Helper array for classes
const generateClasses = () => {
  const kelas = [];
  for (let i = 1; i <= 10; i++) kelas.push(`X.${i}`);
  for (let i = 1; i <= 10; i++) kelas.push(`XI.${i}`);
  for (let i = 1; i <= 11; i++) kelas.push(`XII.${i}`);
  return kelas;
};

const classList = generateClasses();

export default function TambahSiswaPage() {
  const [formData, setFormData] = useState({
    nama: '',
    kelas: '',
    nisn: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    alert(`Data siswa ${formData.nama} berhasil ditambahkan! (Simulasi)`);
    // Reset form
    setFormData({ nama: '', kelas: '', nisn: '' });
  };

  return (
    <main className="flex-1 bg-slate-50 pb-20 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm flex items-center border-b border-slate-100 z-10">
        <Link href="/siswa" className="mr-4 text-slate-500 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-slate-800">Tambah Siswa Baru</h1>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            
            {/* Input Nama */}
            <div className="flex flex-col gap-2">
              <label htmlFor="nama" className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
              <input 
                type="text" 
                id="nama"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap siswa" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow text-sm"
              />
            </div>

            {/* Input NISN */}
            <div className="flex flex-col gap-2">
              <label htmlFor="nisn" className="text-sm font-semibold text-slate-700">NISN / NIS</label>
              <input 
                type="text" 
                id="nisn"
                name="nisn"
                value={formData.nisn}
                onChange={handleChange}
                placeholder="Masukkan nomor induk siswa" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow text-sm"
              />
            </div>

            {/* Input Kelas */}
            <div className="flex flex-col gap-2">
              <label htmlFor="kelas" className="text-sm font-semibold text-slate-700">Pilih Kelas</label>
              <div className="relative">
                <select 
                  id="kelas"
                  name="kelas"
                  value={formData.kelas}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 appearance-none outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow text-sm text-slate-700"
                >
                  <option value="" disabled>Pilih tingkat & rombel</option>
                  <optgroup label="Kelas X">
                    {classList.filter(c => c.startsWith('X.')).map(c => (
                      <option key={c} value={c}>Kelas {c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Kelas XI">
                    {classList.filter(c => c.startsWith('XI.')).map(c => (
                      <option key={c} value={c}>Kelas {c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Kelas XII">
                    {classList.filter(c => c.startsWith('XII.')).map(c => (
                      <option key={c} value={c}>Kelas {c}</option>
                    ))}
                  </optgroup>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tombol Simpan */}
            <button 
              type="submit"
              className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm shadow-primary-600/30 active:scale-95"
            >
              Simpan Data Siswa
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
