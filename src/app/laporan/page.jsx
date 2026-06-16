"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRecords, getClasses } from '@/lib/dataService';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast, Toaster } from 'react-hot-toast';

export default function LaporanPage() {
  const [classes, setClasses] = useState([]);
  const [filterKelas, setFilterKelas] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const init = async () => {
      const cls = await getClasses();
      setClasses(cls);
    };
    init();
  }, []);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const data = await getRecords({
        classId: filterKelas,
        type: filterType,
        startDate,
        endDate
      });
      setRecords(data);
      if (data.length === 0) toast.error("Tidak ada data ditemukan");
    } catch (err) {
      toast.error("Gagal memuat data");
    }
    setLoading(false);
  };

  const handleExportPDF = () => {
    if (records.length === 0) {
      toast.error("Tidak ada data untuk dicetak!");
      return;
    }

    const doc = new jsPDF('landscape');
    
    // Kop Surat (Header)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PEMERINTAH PROVINSI SULAWESI SELATAN', doc.internal.pageSize.getWidth()/2, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('DINAS PENDIDIKAN', doc.internal.pageSize.getWidth()/2, 22, { align: 'center' });
    doc.setFontSize(18);
    doc.text('UPT SMA NEGERI 7 MAKASSAR', doc.internal.pageSize.getWidth()/2, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Jl. Perintis Kemerdekaan Km. 18, Sudiang, Kec. Biringkanaya, Kota Makassar', doc.internal.pageSize.getWidth()/2, 36, { align: 'center' });
    
    // Garis
    doc.setLineWidth(1);
    doc.line(15, 40, doc.internal.pageSize.getWidth() - 15, 40);
    doc.setLineWidth(0.3);
    doc.line(15, 41.5, doc.internal.pageSize.getWidth() - 15, 41.5);

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN DATA TATA TERTIB (SIGMA 7)', doc.internal.pageSize.getWidth()/2, 52, { align: 'center' });
    
    // Info Filter
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 15, 60);
    doc.text(`Kelas: ${filterKelas === 'all' ? 'Semua Kelas' : filterKelas}`, 15, 66);
    doc.text(`Jenis: ${filterType === 'all' ? 'Semua' : (filterType === 'reward' ? 'Prestasi' : 'Pelanggaran')}`, 15, 72);

    // Tabel
    const tableColumn = ["No", "Tanggal", "Nama Siswa", "Kelas", "Kategori", "Keterangan", "Poin"];
    const tableRows = [];

    records.forEach((r, idx) => {
      const recordData = [
        idx + 1,
        r.date || r.createdAt.split('T')[0],
        r.studentName,
        r.className,
        r.category || (r.type === 'reward' ? 'Prestasi' : 'Pelanggaran'),
        r.description,
        r.points > 0 ? `+${r.points}` : r.points
      ];
      tableRows.push(recordData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 78,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }, // Blue primary
    });

    const finalY = doc.lastAutoTable.finalY || 80;

    // Tanda Tangan
    doc.setFontSize(11);
    const w = doc.internal.pageSize.getWidth();
    doc.text(`Makassar, ${format(new Date(), 'dd MMMM yyyy')}`, w - 20, finalY + 15, { align: 'right' });
    
    doc.text('Mengetahui,', 40, finalY + 25, { align: 'center' });
    doc.text('Wakasek Kesiswaan', 40, finalY + 31, { align: 'center' });
    
    doc.text('Guru BK', w - 40, finalY + 31, { align: 'center' });

    // Tempat ttd
    doc.setFont('helvetica', 'bold');
    doc.text('(_________________________)', 40, finalY + 60, { align: 'center' });
    doc.text('NIP. ', 20, finalY + 65, { align: 'left' });

    doc.text('(_________________________)', w - 40, finalY + 60, { align: 'center' });
    doc.text('NIP. ', w - 65, finalY + 65, { align: 'left' });

    doc.save(`Laporan_SIGMA7_${Date.now()}.pdf`);
    toast.success("PDF Berhasil Diunduh!");
  };

  return (
    <main className="flex-1 bg-slate-50 pb-20 flex flex-col h-screen">
      <Toaster />
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm flex items-center border-b border-slate-100 z-10">
        <Link href="/" className="mr-4 text-slate-500 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-slate-800">Cetak Laporan</h1>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Filter Data</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Kelas</label>
              <select value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none">
                <option value="all">Semua Kelas</option>
                {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Jenis</label>
              <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none">
                <option value="all">Semua Jenis</option>
                <option value="violation">Pelanggaran</option>
                <option value="reward">Prestasi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Mulai Tanggal</label>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Sampai Tanggal</label>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none"/>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handlePreview} disabled={loading} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition active:scale-95 text-sm">
              {loading ? 'Memuat...' : 'Tampilkan Data'}
            </button>
            <button onClick={handleExportPDF} disabled={records.length === 0} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition active:scale-95 disabled:bg-slate-300 text-sm flex justify-center items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>
              Cetak PDF
            </button>
          </div>
        </div>

        {/* Preview Data */}
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Preview ({records.length} Data)</h3>
        {records.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {records.slice(0, 20).map((r, i) => (
              <div key={r.id || i} className="p-3 border-b border-slate-50 flex justify-between items-center text-sm">
                <div>
                  <div className="font-bold text-slate-800">{r.studentName}</div>
                  <div className="text-xs text-slate-500">{r.className} | {r.date || r.createdAt.split('T')[0]}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{r.description}</div>
                </div>
                <div className={`font-black px-2 py-1 rounded text-xs ${r.points > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                  {r.points > 0 ? `+${r.points}` : r.points}
                </div>
              </div>
            ))}
            {records.length > 20 && (
              <div className="p-3 text-center text-xs text-slate-500 font-medium bg-slate-50">
                ...dan {records.length - 20} data lainnya
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-100 rounded-xl p-8 text-center border border-slate-200 border-dashed">
            <p className="text-slate-500 text-sm font-medium">Klik "Tampilkan Data" untuk preview laporan</p>
          </div>
        )}
      </div>
    </main>
  );
}
