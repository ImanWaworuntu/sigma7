import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Baca kredensial dari .env.local
const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
  console.error("File .env.local tidak ditemukan!");
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/); // Gunakan service role key untuk bypass RLS

if (!urlMatch || !keyMatch) {
  console.error("Kredensial Supabase tidak lengkap di .env.local!");
  process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

const maleNames = [
  "Budi", "Dimas", "Rian", "Bayu", "Reza", "Eko", "Joko", "Rizky", "Agung",
  "Ilham", "Indra", "Kevin", "Wahyu", "Dika", "Fajar", "Yoga", "Dedi", "Hendra"
];

const femaleNames = [
  "Ayu", "Siti", "Rini", "Dewi", "Putri", "Sari", "Dian", "Indah", "Maya",
  "Rika", "Nisa", "Siska", "Mega", "Ratna", "Fitri", "Wati", "Yuni", "Wulan"
];

const classes = [];
// Generate Kelas X.1 - X.10
for (let i = 1; i <= 10; i++) classes.push(`X.${i}`);
// Generate Kelas XI.1 - XI.10
for (let i = 1; i <= 10; i++) classes.push(`XI.${i}`);
// Generate Kelas XII.1 - XII.11
for (let i = 1; i <= 11; i++) classes.push(`XII.${i}`);

async function wipeOut() {
  console.log("Menghapus data lama (Wipe out)...");
  
  // Hapus data secara berurutan untuk menghindari constraint error
  await supabase.from('attendance').delete().not('id', 'is', null);
  await supabase.from('records').delete().not('id', 'is', null);
  await supabase.from('students').delete().not('id', 'is', null);
  await supabase.from('classes').delete().not('id', 'is', null);
  
  console.log("Data lama berhasil dihapus.");
}

async function injectData() {
  await wipeOut();

  console.log(`Memulai injeksi data untuk ${classes.length} kelas...`);
  
  for (const className of classes) {
    // Insert Kelas
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .insert([{ name: className }])
      .select();

    if (classError) {
      console.error(`Gagal membuat kelas ${className}:`, classError);
      continue;
    }

    const classId = classData[0].id;
    const studentsToInsert = [];

    // Siapkan 18 Pria
    for (let i = 0; i < 18; i++) {
      studentsToInsert.push({
        name: maleNames[i % maleNames.length],
        class_id: classId,
        gender: 'Pria',
        nis: `1${className.replace(/\./g, '')}0${i+1}`.substring(0,8),
        nisn: `00${Math.floor(Math.random() * 100000000)}`,
        address: "Jl. Pendidikan No. 1",
        poin_pelanggaran: 0,
        poin_penghargaan: 0,
        sp_issued_level: 0
      });
    }

    // Siapkan 18 Wanita
    for (let i = 0; i < 18; i++) {
      studentsToInsert.push({
        name: femaleNames[i % femaleNames.length],
        class_id: classId,
        gender: 'Wanita',
        nis: `2${className.replace(/\./g, '')}0${i+1}`.substring(0,8),
        nisn: `00${Math.floor(Math.random() * 100000000)}`,
        address: "Jl. Pendidikan No. 2",
        poin_pelanggaran: 0,
        poin_penghargaan: 0,
        sp_issued_level: 0
      });
    }

    // Insert 36 Siswa untuk kelas ini
    const { error: studentError } = await supabase
      .from('students')
      .insert(studentsToInsert);

    if (studentError) {
      console.error(`Gagal menambahkan siswa di kelas ${className}:`, studentError);
    } else {
      console.log(`Berhasil membuat kelas ${className} dan menambahkan 36 siswa.`);
    }
  }

  console.log("Proses injeksi data selesai!");
}

injectData();
