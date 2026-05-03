"use client"
import { useState } from 'react';
import Link from 'next/link';
import { violations, rewards } from '@/lib/data';

export default function MasterPage() {
  const [activeTab, setActiveTab] = useState('pelanggaran');

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
          <h1 className="text-lg font-bold text-slate-800">Master Data</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('pelanggaran')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'pelanggaran' ? 'border-violation-500 text-violation-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Pelanggaran
          </button>
          <button 
            onClick={() => setActiveTab('prestasi')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'prestasi' ? 'border-reward-500 text-reward-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Prestasi
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {activeTab === 'pelanggaran' ? (
            violations.map(item => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{item.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                      ${item.category === 'Ringan' ? 'bg-green-100 text-green-700' : 
                        item.category === 'Sedang' ? 'bg-warning-100 text-warning-700' : 
                        'bg-violation-100 text-violation-700'}
                    `}>{item.category}</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm">{item.desc}</h3>
                </div>
                <div className="font-bold text-violation-600 bg-violation-50 px-3 py-1 rounded-lg">
                  -{item.points}
                </div>
              </div>
            ))
          ) : (
            rewards.map(item => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{item.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-primary-50 text-primary-600">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm">{item.desc}</h3>
                </div>
                <div className="font-bold text-reward-600 bg-reward-50 px-3 py-1 rounded-lg">
                  +{item.points}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
