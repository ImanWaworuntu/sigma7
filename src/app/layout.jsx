import './globals.css'
import ClientLayout from './ClientLayout'
export const metadata = {
  title: 'SIGMA 7 - SMAN 7 Makassar',
  description: 'Sistem Siswa Integrasi & Garda Moral SMAN 7 Makassar',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="antialiased text-slate-800 bg-slate-50 min-h-screen">
        {/* Mobile App Container */}
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative overflow-hidden flex flex-col">
          <ClientLayout>
            {children}
          </ClientLayout>
        </div>
      </body>
    </html>
  )
}
