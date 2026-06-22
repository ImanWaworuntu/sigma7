"use client"
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getStudentById, getRecords, issueSp, updateStudent, getClasses } from '@/lib/dataService';
import { toast, Toaster } from 'react-hot-toast';

function SiswaProfileContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('id');

  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [classes, setClasses] = useState([]);
  const [editForm, setEditForm] = useState({
    name: '', classId: '', nis: '', nisn: '', gender: '',
    address: '', phone: '', parentPhone: '', homeroomTeacher: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  useEffect(() => {
    if (user?.role === 'admin' && showEditModal && classes.length === 0) {
      getClasses().then(setClasses);
    }
  }, [showEditModal, user]);

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
  const issued = student.spIssuedLevel || 0;

  let bannerText = null;
  let bannerColor = '';
  let pendingSpLevel = 0;

  if (hpMerah >= 200 && issued < 3) {
    bannerText = 'Siswa telah mencapai batas maksimal Pelanggaran. SP 3 segera diproses!';
    bannerColor = 'bg-red-100 text-red-700 border-red-200';
    pendingSpLevel = 3;
  } else if (hpMerah >= 150 && issued < 2) {
    bannerText = 'Pelanggaran Kritis (≥150). Siswa memerlukan SP 2.';
    bannerColor = 'bg-orange-100 text-orange-700 border-orange-200';
    pendingSpLevel = 2;
  } else if (hpMerah >= 50 && hpMerah < 150 && issued < 1) {
    bannerText = 'Pelanggaran Menumpuk (≥50). Siswa memerlukan SP 1.';
    bannerColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
    pendingSpLevel = 1;
  }

  const handleMarkSp = async () => {
    try {
      await issueSp(studentId, pendingSpLevel);
      setStudent(prev => ({ ...prev, spIssuedLevel: pendingSpLevel }));
      alert(`Sukses menandai bahwa SP ${pendingSpLevel} telah diberikan.`);
    } catch (error) {
      alert("Gagal memperbarui status SP.");
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: student.name || '',
      classId: student.classId || student.class || '',
      nis: student.nis || '',
      nisn: student.nisn || '',
      gender: student.gender || '',
      address: student.address || '',
      phone: student.phone || '',
      parentPhone: student.parentPhone || '',
      homeroomTeacher: student.homeroomTeacher || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateBiodata = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.classId || !editForm.gender) {
      return toast.error("Nama, Kelas, dan Jenis Kelamin wajib diisi!");
    }
    
    setSubmitting(true);
    try {
      await updateStudent(studentId, editForm);
      setStudent(prev => ({ ...prev, ...editForm }));
      setShowEditModal(false);
      toast.success("Biodata berhasil diperbarui!");
    } catch (error) {
      toast.error("Gagal memperbarui biodata");
    }
    setSubmitting(false);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 pb-20 relative min-h-screen flex flex-col">
      <Toaster />
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-b-3xl px-6 pt-10 pb-20 shadow-lg relative overflow-hidden">
        {/* Decorative glass circles */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
        
        <div className="relative z-10 flex items-center justify-between mb-4">
            <Link href="/siswa" className="active:scale-95 transition-transform p-2 -ml-2 rounded-full hover:bg-white/10 flex items-center gap-1 text-sm font-semibold text-white/90">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Kembali
            </Link>
            {user?.role === 'admin' && (
              <button onClick={openEditModal} className="text-white text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full hover:bg-white/20 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Edit
              </button>
            )}
        </div>
        <div className="relative z-10 text-center mt-2">
            <h1 className="text-2xl font-black tracking-tight drop-shadow-sm">PROFIL SISWA</h1>
            <p className="text-primary-100 text-xs font-medium mt-1 opacity-80 uppercase tracking-widest">SMAN 7 Makassar</p>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="px-6 -mt-6 relative z-20 flex justify-center w-full">
        <div className="flex gap-3 mb-4 items-center justify-center bg-white/80 backdrop-blur-xl p-2 rounded-full shadow-lg border border-slate-100/50 print:hidden w-max">
          <Link href={`/input?studentId=${studentId}&step=2`} className="bg-primary-600 text-white px-5 py-2.5 rounded-full shadow-md shadow-primary-600/30 hover:bg-primary-700 active:scale-95 transition-all text-xs font-bold flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Input Poin
          </Link>
          <button onClick={() => window.print()} className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-full hover:bg-slate-200 active:scale-95 transition-all text-xs font-bold flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print
          </button>
        </div>
      </div>

        {/* Laporan Cetak Header (Hanya muncul saat print) */}
        <div className="hidden print:block text-center mb-8 border-b-2 border-slate-800 pb-4">
          <h1 className="text-2xl font-bold uppercase">Laporan Rekam Jejak Siswa</h1>
          <h2 className="text-lg font-bold">SMAN 7 Makassar</h2>
          <p className="text-sm">Sistem Siswa Integrasi & Garda Moral (SIGMA 7)</p>
        </div>

        {/* Warning Banner */}
        {bannerText && (
          <div className={`rounded-xl p-4 mb-6 border font-bold text-sm text-center shadow-sm print:hidden ${bannerColor} flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2`}>
            <span className="flex items-center gap-2">⚠️ {bannerText}</span>
            <button onClick={handleMarkSp} className="bg-white/90 text-slate-800 px-4 py-2 rounded-lg shadow-sm hover:bg-white active:scale-95 transition-all text-xs whitespace-nowrap">
              Tandai SP {pendingSpLevel} Diberikan
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 flex flex-col items-center text-center relative print:shadow-none print:border-slate-300">
          <div className={`h-24 w-24 rounded-full flex items-center justify-center text-4xl font-bold mb-4 ${student.gender === 'Wanita' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
            {student.name.charAt(0)}
          </div>
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${student.gender === 'Wanita' ? 'text-pink-500' : 'text-blue-600'}`}>
            {student.name}
            {hpMerah >= 50 && (
                <span className="text-red-500 text-lg tracking-tighter" title="Terindikasi Peringatan SP">
                    {hpMerah >= 200 ? '⚠️⚠️⚠️' : hpMerah >= 150 ? '⚠️⚠️' : '⚠️'}
                </span>
            )}
          </h2>
          <p className="text-slate-500 font-medium mb-1">Kelas {student.classId || student.class} • NIS: {student.nis || '-'} • NISN: {student.nisn || '-'}</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500 mb-4 bg-slate-50 py-2 px-4 rounded-lg w-full max-w-md border border-slate-100">
            <span className="w-full text-center mb-1 text-slate-400 font-bold uppercase tracking-widest text-[9px]">Biodata Tambahan</span>
            <span className="flex-1 min-w-[120px] text-left">Wali Kelas: <strong className="text-slate-700 block text-xs">{student.homeroomTeacher || '-'}</strong></span>
            <span className="flex-1 min-w-[120px] text-left">HP Siswa: <strong className="text-slate-700 block text-xs">{student.phone || '-'}</strong></span>
            <span className="flex-1 min-w-[120px] text-left">HP Ortu: <strong className="text-slate-700 block text-xs">{student.parentPhone || '-'}</strong></span>
            <span className="flex-1 min-w-[120px] text-left">Alamat: <strong className="text-slate-700 block text-xs">{student.address || '-'}</strong></span>
          </div>
          
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
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-500">{record.date}</p>
                      <span className="text-[10px] text-slate-400 border-l border-slate-300 pl-2 ml-1 flex-shrink-0">Oleh: {record.reportedBy || 'Sistem'}</span>
                      {(record.hasPhoto || record.photoUrl) && (
                        <Link 
                          href={record.photoUrl || `/bukti?id=${record.id}`} 
                          className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1 print:hidden"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Lihat Bukti
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className={`font-black flex flex-col items-end justify-center ${record.type === 'reward' ? 'text-reward-600' : 'text-violation-600'}`}>
                    <span>{record.points > 0 ? '+' : ''}{record.points}</span>
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

      {/* MODAL EDIT BIODATA */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-0">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800">Edit Biodata Siswa</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateBiodata} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nama Lengkap</label>
                <input required type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Kelas</label>
                <select required value={editForm.classId} onChange={e => setEditForm({...editForm, classId: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 bg-white">
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    {editForm.classId?.toUpperCase().startsWith('ALUMNI') && !classes.find(c => c.name === editForm.classId) && (
                        <option value={editForm.classId}>{editForm.classId}</option>
                    )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">NIS</label>
                  <input type="text" inputMode="numeric" value={editForm.nis} onChange={e => setEditForm({...editForm, nis: e.target.value.replace(/\D/g, '')})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">NISN</label>
                  <input type="text" inputMode="numeric" value={editForm.nisn} onChange={e => setEditForm({...editForm, nisn: e.target.value.replace(/\D/g, '')})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Jenis Kelamin</label>
                <select required value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 bg-white">
                    <option value="">-- Pilih --</option>
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Alamat</label>
                <textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} rows="2" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">No. HP Siswa</label>
                  <input type="text" inputMode="numeric" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value.replace(/\D/g, '')})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">No. HP Orang Tua</label>
                  <input type="text" inputMode="numeric" value={editForm.parentPhone} onChange={e => setEditForm({...editForm, parentPhone: e.target.value.replace(/\D/g, '')})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Wali Kelas</label>
                <input type="text" value={editForm.homeroomTeacher} onChange={e => setEditForm({...editForm, homeroomTeacher: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl active:scale-95 transition-transform text-sm">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-primary-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform text-sm flex justify-center items-center">
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
