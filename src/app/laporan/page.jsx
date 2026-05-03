import Link from 'next/link';

export default function LaporanPage() {
  return (
    <main className="flex-1 bg-slate-50 pb-20 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm flex flex-col z-10">
        <div className="flex items-center mb-4">
          <Link href="/" className="mr-4 text-slate-500 active:scale-95 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-slate-800">Laporan & Statistik</h1>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Fitur Laporan</h2>
        <p className="text-slate-500 max-w-xs text-sm">
          Fitur export laporan ke PDF/Excel dan filter data mendalam akan tersedia pada pembaruan MVP berikutnya.
        </p>
      </div>
    </main>
  );
}
