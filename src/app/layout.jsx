import './globals.css'
import ClientLayout from './ClientLayout'
export const metadata = {
  title: 'SIGMA 7 - SMAN 7 Makassar',
  description: 'Sistem Siswa Integrasi & Garda Moral SMAN 7 Makassar',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SIGMA 7',
  },
}

export const viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased text-slate-800 bg-slate-50 min-h-screen">
        {/* Mobile App Container */}
        <div className="max-w-md mx-auto min-h-screen bg-slate-50/50 shadow-2xl shadow-slate-300/50 relative overflow-hidden flex flex-col">
          <ClientLayout>
            {children}
          </ClientLayout>
        </div>
      </body>
    </html>
  )
}
