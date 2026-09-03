"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRecords, getAppUsers } from '@/lib/dataService';
import { format } from 'date-fns';
import { toast, Toaster } from 'react-hot-toast';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function LogPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appUsers, setAppUsers] = useState([]);
  const [filterReporter, setFilterReporter] = useState('all');
  
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only allow admin
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    const init = async () => {
      const users = await getAppUsers();
      setAppUsers(users);
    };
    if (user?.role === 'admin') {
        init();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
        fetchLogData();
    }
  }, [targetDate, filterReporter, user]);

  const fetchLogData = async () => {
    setLoading(true);
    try {
      const data = await getRecords({
        startDate: targetDate,
        endDate: targetDate,
        reportedBy: filterReporter
      });
      // Sort by latest created first (already done in getRecords, but let's ensure it)
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecords(data);
    } catch (err) {
      toast.error("Gagal memuat log aktivitas");
    }
    setLoading(false);
  };

  if (user?.role !== 'admin') return null;

  return (
    <main className="flex-1 bg-slate-50 pb-20 flex flex-col h-screen">
      <Toaster />
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 shadow-md flex items-center justify-between border-b border-slate-900 z-10 sticky top-0">
        <div className="flex items-center gap-3 text-white">
          <Link href="/dashboard" className="active:scale-95 transition-transform bg-white/10 p-1.5 rounded-full hover:bg-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
              <h1 className="text-lg font-bold leading-tight">Log Aktivitas</h1>
              <p className="text-[10px] font-medium text-slate-300">Lacak penginputan harian</p>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col gap-4">
            
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Pilih Tanggal Kejadian</label>
              <input 
                type="date" 
                value={targetDate} 
                onChange={e => setTargetDate(e.target.value)} 
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-primary-500 rounded-xl p-3 text-sm outline-none font-bold text-slate-700 transition-colors"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Filter Pelapor (Guru/OSIS)</label>
              <div className="relative">
                  <select 
                    value={filterReporter} 
                    onChange={e => setFilterReporter(e.target.value)} 
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-primary-500 rounded-xl p-3 appearance-none text-sm outline-none font-semibold text-slate-700 transition-colors"
                  >
                    <option value="all">-- Semua Pelapor --</option>
                    {appUsers.map(u => (
                        <option key={u.id} value={u.nama_lengkap || u.username}>
                            {u.nama_lengkap || u.username} ({u.role.toUpperCase()})
                        </option>
                    ))}
                    <option value="-">Sistem / Tidak Diketahui</option>
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </div>
              </div>
            </div>

        </div>

        {loading ? (
            <div className="flex justify-center p-10">
                <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
        ) : (
            <>
                <div className="flex justify-between items-end mb-3 px-1">
                    <h3 className="text-sm font-bold text-slate-800">Riwayat Tanggal {format(new Date(targetDate), 'dd MMM yyyy')}</h3>
                    <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full">{records.length} Data</span>
                </div>
                
                {records.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {records.map((r, i) => (
                    <Link href={`/siswa/detail?id=${r.studentId}`} key={r.id || i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col gap-2 hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98]">
                        <div className="flex justify-between items-start gap-2">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                                    {new Date(r.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className="font-bold text-slate-800 leading-tight">{r.studentName}</div>
                                <div className="text-xs font-semibold text-primary-600 mt-0.5">Kelas {r.className}</div>
                            </div>
                            <div className={`font-black px-2 py-1.5 rounded-lg text-sm shrink-0 border shadow-sm ${r.points > 0 ? 'text-reward-700 bg-reward-50 border-reward-200' : 'text-violation-700 bg-violation-50 border-violation-200'}`}>
                                {r.points > 0 ? `+${r.points}` : r.points}
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                            <p className="text-sm font-bold text-slate-700 leading-tight mb-1">{r.description}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span>Pelapor: <strong>{r.reportedBy}</strong></span>
                            </div>
                        </div>
                    </Link>
                    ))}
                </div>
                ) : (
                <div className="bg-slate-100 rounded-2xl p-10 text-center border border-slate-200 border-dashed flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <p className="text-slate-500 text-sm font-bold mb-1">Tidak ada rekam jejak</p>
                    <p className="text-xs text-slate-400">Belum ada pelanggaran atau prestasi yang dicatat dengan filter ini.</p>
                </div>
                )}
            </>
        )}
      </div>
    </main>
  );
}
