"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getClasses, addStudent } from '@/lib/dataService';
import { toast, Toaster } from 'react-hot-toast';

export default function TambahSiswa() {
  const [classes, setClasses] = useState([]);
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [homeroomTeacher, setHomeroomTeacher] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      const cls = await getClasses();
      setClasses(cls);
    };
    fetchClasses();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !classId || !gender) return toast.error("Lengkapi data yang wajib (Nama, Kelas, Jenis Kelamin)");
    
    setSubmitting(true);
    try {
      await addStudent({ name, classId, nis, nisn, gender, address, phone, parentPhone, homeroomTeacher });
      toast.success("Siswa berhasil ditambahkan!");
      setName('');
      setNis('');
      setNisn('');
      setGender('');
      setAddress('');
      setPhone('');
      setParentPhone('');
      setHomeroomTeacher('');
    } catch (error) {
      toast.error("Gagal menambahkan siswa");
    }
    setSubmitting(false);
  };

  return (
    <main className="flex-1 bg-slate-50 pb-20 h-screen overflow-y-auto">
      <Toaster />
      <div className="bg-white px-6 py-4 shadow-sm flex items-center border-b border-slate-100 sticky top-0 z-10">
        <Link href="/siswa" className="mr-4 text-slate-500 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-lg font-bold text-slate-800">Tambah Siswa</h1>
      </div>

      <div className="p-6">
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
            <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Nama Lengkap</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 transition-colors text-sm"
                />
            </div>
            <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Kelas</label>
                <select 
                    value={classId}
                    onChange={e => setClassId(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 transition-colors text-sm font-semibold text-slate-700 bg-white"
                >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">NIS (Opsional)</label>
                    <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={nis}
                        onChange={e => setNis(e.target.value.replace(/\D/g, ''))}
                        placeholder="Contoh: 10293"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 transition-colors text-sm"
                    />
                </div>
                <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">NISN (Opsional)</label>
                    <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={nisn}
                        onChange={e => setNisn(e.target.value.replace(/\D/g, ''))}
                        placeholder="Contoh: 0089201923"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 transition-colors text-sm"
                    />
                </div>
            </div>
            <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Jenis Kelamin</label>
                <select 
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 transition-colors text-sm font-semibold text-slate-700 bg-white"
                >
                    <option value="">-- Pilih Jenis Kelamin --</option>
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                </select>
            </div>
            
            <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Alamat (Opsional)</label>
                <textarea 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Contoh: Jl. Sudirman No. 10"
                    rows="2"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 transition-colors text-sm"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">No. HP Siswa (Opsional)</label>
                    <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="Contoh: 0812..."
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 transition-colors text-sm"
                    />
                </div>
                <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">No. HP Orang Tua (Opsional)</label>
                    <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={parentPhone}
                        onChange={e => setParentPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="Contoh: 0852..."
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 transition-colors text-sm"
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Wali Kelas (Opsional)</label>
                <input 
                    type="text" 
                    value={homeroomTeacher}
                    onChange={e => setHomeroomTeacher(e.target.value)}
                    placeholder="Contoh: Bapak/Ibu Guru"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 transition-colors text-sm"
                />
            </div>
            
            <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl mt-4 transition-all shadow-md active:scale-95 flex justify-center gap-2"
            >
                {submitting ? "Menyimpan..." : "Simpan Siswa"}
            </button>
        </form>

        <div className="mt-8 bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h2 className="font-bold text-blue-800 mb-2">Import Data Massal?</h2>
            <p className="text-xs text-blue-600 mb-4">Untuk memasukkan data siswa atau rekaman lama secara massal, disarankan untuk langsung mengunggah file CSV/Excel melalui panel Admin Firebase atau menggunakan script import khusus.</p>
            <button onClick={() => alert("Fitur Import CSV sedang dalam pengembangan")} className="bg-white text-blue-700 px-4 py-2 rounded-lg text-xs font-bold border border-blue-200 shadow-sm active:scale-95">Gunakan Alat Import</button>
        </div>
      </div>
    </main>
  );
}
