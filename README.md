# Sigma7 🚀

Sigma7 adalah sistem informasi manajemen berbasis web yang dibangun menggunakan **Next.js** dan terintegrasi dengan ekosistem **Firebase**. Sistem ini dirancang untuk mempermudah pengelolaan data master, pencatatan siswa, pengelolaan kegiatan (seperti upacara), serta pembuatan laporan secara dinamis.

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun menggunakan berbagai teknologi modern, di antaranya:
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router) & React 18
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend as a Service:** [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore, Hosting)
- **UI & Animasi:** [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/) (Icons)
- **Visualisasi Data:** [Recharts](https://recharts.org/)
- **Dokumen & PDF:** `jspdf` & `jspdf-autotable`
- **Utilitas:** `date-fns` (pemrosesan tanggal), `browser-image-compression` (kompresi gambar otomatis), dan `react-hot-toast` (notifikasi).

## 🌟 Fitur & Modul Utama

- 📊 **Dashboard** (`/dashboard`): Menampilkan ringkasan dan statistik visual menggunakan Recharts.
- 🗃️ **Data Master** (`/master`): Pengelolaan rekapitulasi data utama sistem.
- 👨‍🎓 **Manajemen Siswa** (`/siswa`): Pengelolaan data siswa secara menyeluruh (termasuk fitur tambah siswa).
- 📝 **Input Data** (`/input`): Fasilitas formulir terintegrasi untuk memasukkan entri harian.
- 🎌 **Kegiatan Upacara** (`/upacara`): Modul khusus pencatatan atau manajemen kegiatan upacara.
- 📸 **Bukti Dokumentasi** (`/bukti`): Modul untuk verifikasi atau menampilkan dokumentasi bukti kegiatan.
- 📑 **Laporan** (`/laporan`): Modul ekspor laporan yang bisa langsung dijadikan PDF.

## 🚀 Cara Menjalankan secara Lokal

1. **Persiapan:** Pastikan Anda memiliki Node.js terinstal.
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Environment Variables:** Pastikan konfigurasi Firebase Client Anda diatur pada `.env.local` (jika tidak hardcoded).
4. **Jalankan Server Development:**
   ```bash
   npm run dev
   ```
5. Akses [http://localhost:3000](http://localhost:3000) pada browser Anda.

## 🌐 Build & Deployment

Sistem ini dikonfigurasi untuk menggunakan mekanisme **Static Export** Next.js (menghasilkan folder `out`), yang kemudian di-deploy melalui Firebase Hosting.

1. **Build Export:**
   ```bash
   npm run build
   ```
2. **Deploy ke Firebase:**
   Pastikan Anda sudah menginstal Firebase CLI (`npm i -g firebase-tools`) dan sudah login (`firebase login`).
   ```bash
   firebase deploy --only hosting
   ```

---
**© Pandu Digital SMANET 2026**
