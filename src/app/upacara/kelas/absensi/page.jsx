"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStudents, saveAttendance } from '@/lib/dataService';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';
import { toast, Toaster } from 'react-hot-toast';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function UpacaraContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');
  
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!classId) return;

    if (classId === 'dummy') {
        const dummy = Array.from({length: 15}).map((_, i) => ({ id: `std${i}`, name: `Siswa Dummy ${i+1}`, classId: 'X.1' }));
        setStudents(dummy);
        const initialAtt = {};
        dummy.forEach(s => initialAtt[s.id] = 'Hadir');
        setAttendance(initialAtt);
        setLoading(false);
        return;
    }

    let isMounted = true;
    const fetchStudents = async () => {
      try {
        const data = await getStudents(classId);
        if (isMounted) {
          setStudents(data);
          const initialAtt = {};
          data.forEach(s => initialAtt[s.id] = 'Hadir'); // Default to Hadir
          setAttendance(initialAtt);
        }
      } catch (error) {
        if (isMounted) toast.error("Gagal memuat daftar siswa");
      }
      if (isMounted) setLoading(false);
    };
    fetchStudents();
    return () => { isMounted = false; };
  }, [classId]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleBulkAction = (status) => {
    setAttendance(prev => {
        const next = { ...prev };
        filteredStudents.forEach(s => {
            next[s.id] = status;
        });
        return next;
    });
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 36) {
      toast.error("Maksimal 36 foto!");
      return;
    }
    
    // Preview
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Upload photos with auto-compression
      const photoUrls = [];
      
      for (const p of photos) {
        // Compress
        const options = { maxSizeMB: 0.05, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(p.file, options);
        
        // Upload to Supabase Storage
        const fileName = `upacara/${Date.now()}_${compressedFile.name}`;
        const { data, error: uploadError } = await supabase.storage
            .from('record_photos')
            .upload(fileName, compressedFile, { contentType: compressedFile.type });

        if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from('record_photos').getPublicUrl(fileName);
            photoUrls.push(publicUrlData.publicUrl);
        }
      }

      // 2. Save Attendance Records
      const dateStr = new Date().toISOString().split('T')[0];
      let savedCount = 0;
      for (const student of students) {
        const status = attendance[student.id];
        if (status !== 'Hadir') {
          await saveAttendance({
            studentId: student.id,
            studentName: student.name,
            classId: student.classId,
            className: student.classId, // Need actual class name here
            status: status,
            date: dateStr,
            photos: photoUrls // Attach same photos to the class record, or keep a separate class_attendance collection
          });
          savedCount++;
        }
      }
      
      toast.success(`Berhasil! ${savedCount} siswa tidak hadir dicatat.`);
      setTimeout(() => {
          window.location.href = '/upacara';
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Memuat data...</div>;

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-b-3xl px-6 pt-10 pb-8 shadow-lg sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
        <div className="flex justify-between items-center relative z-10">
            <Link href="/upacara" className="bg-white/20 p-2 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div className="text-center">
                <h1 className="text-xl font-bold tracking-tight">Kelas {students[0]?.classId || classId}</h1>
                <p className="text-xs text-blue-100">{students.length} Siswa</p>
            </div>
            <div className="w-10"></div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-4 relative z-10">
            <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                    type="text" 
                    placeholder="Cari nama siswa..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-blue-900/40 border border-blue-400/30 text-white placeholder-blue-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-white/50 transition-colors backdrop-blur-sm"
                />
            </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="px-4 mt-6 flex justify-between gap-2">
          <button onClick={() => handleBulkAction('Hadir')} className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 py-2 rounded-xl text-xs font-bold transition-colors">Semua Hadir</button>
          <button onClick={() => handleBulkAction('Alpa')} className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-2 rounded-xl text-xs font-bold transition-colors">Semua Alpa</button>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {filteredStudents.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-4">Siswa tidak ditemukan.</div>
        )}
        {filteredStudents.map((student, idx) => {
            const isAbsent = attendance[student.id] !== 'Hadir';
            return (
                <div key={student.id} className={`bg-white p-4 rounded-xl shadow-sm border transition-all duration-300 cursor-pointer ${isAbsent ? 'border-red-400 bg-red-50 hover:shadow-md hover:-translate-y-0.5' : 'border-slate-100 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'}`}>
                    <div className="flex gap-3 items-center" onClick={() => handleStatusChange(student.id, isAbsent ? 'Hadir' : 'Alpa')}>
                        <span className={`font-bold text-sm w-5 ${isAbsent ? 'text-red-500' : 'text-slate-400'}`}>{idx+1}.</span>
                        <span className={`font-semibold flex-1 ${isAbsent ? 'text-red-900' : 'text-slate-800'}`}>{student.name}</span>
                        <div className={`h-6 w-6 rounded flex items-center justify-center border ${isAbsent ? 'bg-red-500 border-red-500 text-white' : 'bg-slate-50 border-slate-200 text-transparent'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                    </div>
                    
                    {/* Absent Options (Only show if marked absent) */}
                    {isAbsent && (
                        <div className="flex bg-white rounded-lg p-1 border border-red-200 mt-3 overflow-hidden shadow-sm">
                            {['Alpa', 'Izin', 'Bolos'].map(status => {
                                const isSelected = attendance[student.id] === status;
                                let colorClass = "text-slate-500 hover:bg-slate-100";
                                if (isSelected) {
                                    if (status === 'Izin') colorClass = "bg-blue-500 text-white";
                                    else if (status === 'Alpa') colorClass = "bg-red-500 text-white";
                                    else if (status === 'Bolos') colorClass = "bg-orange-500 text-white";
                                }
                                
                                return (
                                    <button
                                        key={status}
                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(student.id, status); }}
                                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${colorClass}`}
                                    >
                                        {status}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      {/* Photo Upload Section */}
      <div className="px-4 mt-8">
        <h2 className="text-sm font-bold text-slate-700 mb-3">Bukti Foto ({photos.length}/36)</h2>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                    <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200">
                        <img src={p.preview} alt="preview" className="h-full w-full object-cover" />
                        <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                ))}
                
                {photos.length < 36 && (
                    <div className="flex gap-2">
                        <label className="h-16 w-16 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors" title="Kamera">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <input type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                        </label>
                        <label className="h-16 w-16 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors" title="Galeri">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </label>
                    </div>
                )}
            </div>
            <p className="text-[10px] text-slate-500 mt-3">Upload foto saat baris upacara. Foto akan di-compress otomatis.</p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="px-4 mt-8 mb-8">
        <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex justify-center items-center gap-2"
        >
            {submitting ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Menyimpan...
                </>
            ) : (
                "Simpan Absensi"
            )}
        </button>
      </div>

    </main>
  );
}

export default function UpacaraKelas() {
  return (
    <Suspense fallback={<div className="p-10 text-center animate-pulse">Memuat...</div>}>
      <UpacaraContent />
    </Suspense>
  );
}
