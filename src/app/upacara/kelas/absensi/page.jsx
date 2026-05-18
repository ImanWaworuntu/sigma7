"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStudents, saveAttendance } from '@/lib/dataService';
import imageCompression from 'browser-image-compression';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/lib/firebase';
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

  useEffect(() => {
    // If testing with dummy ID, generate dummy students
    if (classId === 'dummy') {
        const dummy = Array.from({length: 15}).map((_, i) => ({ id: `std${i}`, name: `Siswa Dummy ${i+1}`, classId: 'X.1' }));
        setStudents(dummy);
        const initialAtt = {};
        dummy.forEach(s => initialAtt[s.id] = 'Hadir');
        setAttendance(initialAtt);
        setLoading(false);
        return;
    }

    const fetchStudents = async () => {
      try {
        const data = await getStudents(classId);
        setStudents(data);
        const initialAtt = {};
        data.forEach(s => initialAtt[s.id] = 'Hadir'); // Default to Hadir
        setAttendance(initialAtt);
      } catch (error) {
        toast.error("Gagal memuat daftar siswa");
      }
      setLoading(false);
    };
    fetchStudents();
  }, [classId]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

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
      const storage = getStorage(app);
      
      for (const p of photos) {
        // Compress
        const options = { maxSizeMB: 0.15, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(p.file, options);
        
        // Upload to Firebase Storage
        const fileRef = ref(storage, `upacara/${Date.now()}_${compressedFile.name}`);
        await uploadBytes(fileRef, compressedFile);
        const url = await getDownloadURL(fileRef);
        photoUrls.push(url);
      }

      // 2. Save Attendance Records
      const dateStr = new Date().toISOString().split('T')[0];
      for (const student of students) {
        const status = attendance[student.id];
        await saveAttendance({
          studentId: student.id,
          studentName: student.name,
          classId: student.classId,
          className: student.classId, // Need actual class name here
          status: status,
          date: dateStr,
          photos: photoUrls // Attach same photos to the class record, or keep a separate class_attendance collection
        });
      }
      
      toast.success("Absensi berhasil disimpan!");
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
      <div className="bg-blue-600 text-white rounded-b-3xl px-6 pt-10 pb-8 shadow-md sticky top-0 z-50">
        <div className="flex justify-between items-center">
            <Link href="/upacara" className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div className="text-center">
                <h1 className="text-xl font-bold tracking-tight">Kelas {students[0]?.classId || classId}</h1>
                <p className="text-xs text-blue-100">{students.length} Siswa</p>
            </div>
            <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-3">
        {students.map((student, idx) => (
            <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex gap-3 items-center">
                    <span className="text-slate-400 font-bold text-sm w-5">{idx+1}.</span>
                    <span className="font-semibold text-slate-800 flex-1">{student.name}</span>
                </div>
                
                {/* Checkboxes */}
                <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100 overflow-hidden">
                    {['Hadir', 'Izin', 'Alpa', 'Bolos'].map(status => {
                        const isSelected = attendance[student.id] === status;
                        let colorClass = "text-slate-500 hover:bg-slate-200";
                        if (isSelected) {
                            if (status === 'Hadir') colorClass = "bg-green-500 text-white shadow-sm";
                            else if (status === 'Izin') colorClass = "bg-blue-500 text-white shadow-sm";
                            else if (status === 'Alpa') colorClass = "bg-red-500 text-white shadow-sm";
                            else if (status === 'Bolos') colorClass = "bg-orange-500 text-white shadow-sm";
                        }
                        
                        return (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(student.id, status)}
                                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${colorClass}`}
                            >
                                {status}
                            </button>
                        );
                    })}
                </div>
            </div>
        ))}
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
                    <label className="h-16 w-16 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
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
