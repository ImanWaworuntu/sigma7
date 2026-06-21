"use client"
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getStudentById, getRecords } from '@/lib/dataService';

function SiswaProfileContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('id');

  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const std = await getStudentById(studentId);
      if (std) {
        setStudent(std);
        const recs = await getRecords({ studentId });
        setHistory(recs);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  if (loading) {
    return <main className="flex-1 bg-slate-50 p-10 flex flex-col items-center justify-center min-h-screen text-slate-500">Memuat profil siswa...</main>;
  }

  if (!student) {
    return <main className="flex-1 bg-slate-50 p-10 flex flex-col items-center justify-center min-h-screen text-slate-500">Siswa tidak ditemukan.</main>;
  }

  // Hitung HP dari points secara terpisah
  const hpMerah = Math.abs(student.poinPelanggaran || 0);
  const hpHijau = student.poinPenghargaan || 0;

  let bannerText = null;
  let bannerColor = '';

  if (hpMerah >= 200) {
    bannerText = 'Siswa telah mencapai batas maksimal Pelanggaran. SP 3 segera diproses!';
    bannerColor = 'bg-red-100 text-red-700 border-red-200';
  } else if (hpMerah >= 150) {
    bannerText = 'Pelanggaran Kritis (≥150). Siswa memerlukan SP 2.';
    bannerColor = 'bg-orange-100 text-orange-700 border-orange-200';
  } else if (hpMerah >= 50) {
    bannerText = 'Pelanggaran Menumpuk (≥50). Siswa memerlukan SP 1.';
    bannerColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
  }

  return (
    <main className="flex-1 bg-slate-50 pb-20 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm flex items-center justify-between z-10 print:hidden border-b border-slate-100">
        <div className="flex items-center">
          <Link href="/siswa" className="mr-4 text-slate-500 active:scale-95 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-slate-800">Profil Siswa</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/input?studentId=${studentId}&step=2`} className="bg-primary-600 text-white px-4 py-2 rounded-full shadow-sm hover:bg-primary-700 active:scale-95 transition-all text-xs font-bold flex items-center print:hidden">
            + Input Poin
          </Link>
          <button onClick={() => window.print()} className="bg-slate-800 text-white p-2 rounded-full shadow-sm hover:bg-slate-900 active:scale-95 transition-all print:hidden" title="Cetak Rekam Jejak">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 flex-1">
        {/* Laporan Cetak Header (Hanya muncul saat print) */}
        <div className="hidden print:block text-center mb-8 border-b-2 border-slate-800 pb-4">
          <h1 className="text-2xl font-bold uppercase">Laporan Rekam Jejak Siswa</h1>
          <h2 className="text-lg font-bold">SMAN 7 Makassar</h2>
          <p className="text-sm">Sistem Siswa Integrasi & Garda Moral (SIGMA 7)</p>
        </div>

        {/* Warning Banner */}
        {bannerText && (
          <div className={`rounded-xl p-4 mb-6 border font-bold text-sm text-center shadow-sm print:hidden ${bannerColor} animate-pulse`}>
            ⚠️ {bannerText}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 flex flex-col items-center text-center relative print:shadow-none print:border-slate-300">
          <div className="h-24 w-24 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-4xl font-bold mb-4">
            {student.name.charAt(0)}
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
          <p className="text-slate-500 font-medium mb-4">Kelas {student.classId || student.class} • NISN: {student.nisn || '-'}</p>
          
          <div className="flex w-full gap-3 mb-6">
            <div className="bg-red-50 flex-1 rounded-xl p-3 border border-red-100">
              <div className="text-red-600 text-[10px] font-bold mb-1 uppercase">Poin Pelanggaran</div>
              <div className="text-2xl font-black text-red-700">{hpMerah}/200</div>
            </div>
            <div className="bg-green-50 flex-1 rounded-xl p-3 border border-green-100">
              <div className="text-green-600 text-[10px] font-bold mb-1 uppercase">Poin Penghargaan</div>
              <div className="text-2xl font-black text-green-700">{hpHijau}</div>
            </div>
          </div>

          <div className="w-full space-y-4 text-left">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5 text-red-600">
                <span>Bar Pelanggaran</span>
                <span>{((hpMerah/200)*100).toFixed(0)}% (Batas 200)</span>
              </div>
              <div className="w-full h-3 bg-red-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-red-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (hpMerah/200)*100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5 text-green-600">
                <span>Bar Penghargaan</span>
                <span>+{hpHijau} Poin</span>
              </div>
              <div className="w-full h-3 bg-green-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-green-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (hpHijau/200)*100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="mb-6">
          <h3 className="font-bold text-slate-800 mb-4 text-lg">Rekam Jejak</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-slate-300">
            {history.length > 0 ? (
              history.map((record) => (
                <div key={record.id} className="p-4 border-b border-slate-50 last:border-0 flex items-start gap-4">
                  <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0
                    ${record.type === 'reward' ? 'bg-reward-100 text-reward-600' : 'bg-violation-100 text-violation-600'}
                  `}>
                    {record.type === 'reward' ? '🌟' : '⚠️'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 leading-tight mb-1">{record.description || record.desc}</p>
                    <p className="text-xs font-semibold text-slate-500">{record.date}</p>
                  </div>
                  <div className={`font-black ${record.type === 'reward' ? 'text-reward-600' : 'text-violation-600'}`}>
                    {record.points > 0 ? '+' : ''}{record.points}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500">Belum ada rekam jejak.</div>
            )}
          </div>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block mt-16 flex justify-end">
          <div className="text-center w-48">
            <p className="mb-16">Makassar, {new Date().toLocaleDateString('id-ID')}</p>
            <p className="font-bold border-b border-black pb-1">Guru Bimbingan Konseling</p>
            <p className="text-sm mt-1">NIP. .............................</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SiswaProfilePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Memuat...</div>}>
      <SiswaProfileContent />
    </Suspense>
  );
}
