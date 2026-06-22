"use client"
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function BuktiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getDoc(doc(db, 'record_photos', id)).then(snap => {
        if (snap.exists()) {
          setPhoto(snap.data().photoBase64);
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Memuat foto bukti...</div>;
  if (!photo) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      <h1 className="text-xl font-bold mb-2">Foto Tidak Ditemukan</h1>
      <p className="text-slate-400 mb-6">Bukti foto untuk pelanggaran ini mungkin sudah dihapus atau tidak tersedia.</p>
      <button onClick={() => router.back()} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full font-bold transition-colors">Kembali</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
        <button onClick={() => router.back()} className="bg-white/20 text-white p-2 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-white font-bold text-sm tracking-widest uppercase">Bukti Pelanggaran</span>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>
      <img src={photo} alt="Bukti Pelanggaran" className="max-w-full max-h-screen object-contain" />
    </div>
  );
}

export default function BuktiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Memuat...</div>}>
      <BuktiContent />
    </Suspense>
  );
}
