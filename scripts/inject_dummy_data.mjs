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

// Generator Nama Unik (Sistem Suku Kata) untuk menghindari duplikat di 1000+ siswa
const malePrefixes = ["Ad", "Ar", "Bim", "Bud", "Cahy", "Dan", "Dim", "Ek", "Faj", "Gil", "Hend", "Ind", "Jok", "Kev", "Luk", "Mah", "Nug", "Oky", "Pan", "Riz", "Sat", "Teg", "Unt", "Wah", "Yog", "Zain"];
const maleSuffixes = ["a", "o", "i", "an", "ar", "awan", "anto", "adi", "aka", "anda", "at", "as", "al", "am", "en", "er", "es", "et", "id", "ir", "is", "in", "on", "ur", "us"];

const femalePrefixes = ["Ay", "Ann", "Bel", "Citr", "Dew", "Din", "El", "Fit", "Git", "Han", "Ind", "Int", "Kart", "Lest", "Meg", "Nis", "Nov", "Put", "Rin", "Rat", "Sit", "Sisk", "Tiar", "Ut", "Vid", "Wul", "Yen", "Zel"];
const femaleSuffixes = ["a", "i", "e", "o", "u", "an", "in", "en", "ah", "ih", "awati", "ami", "ari", "ati", "asi", "ani", "ila", "ima", "ira", "isa", "ita", "iya"];

const generatedMaleNames = [];
for (const p of malePrefixes) {
  for (const s of maleSuffixes) {
    generatedMaleNames.push(p + s);
  }
} // 26 * 25 = 650 unique names

const generatedFemaleNames = [];
for (const p of femalePrefixes) {
  for (const s of femaleSuffixes) {
    generatedFemaleNames.push(p + s);
  }
} // 28 * 22 = 616 unique names

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
  
  let globalMaleCounter = 0;
  let globalFemaleCounter = 0;

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
        name: generatedMaleNames[globalMaleCounter % generatedMaleNames.length],
        class_id: classId,
        gender: 'Pria',
        nis: `1${className.replace(/\./g, '')}0${i+1}`.substring(0,8),
        nisn: `00${Math.floor(Math.random() * 100000000)}`,
        address: "Jl. Pendidikan No. 1",
        poin_pelanggaran: 0,
        poin_penghargaan: 0,
        sp_issued_level: 0
      });
      globalMaleCounter++;
    }

    // Siapkan 18 Wanita
    for (let i = 0; i < 18; i++) {
      studentsToInsert.push({
        name: generatedFemaleNames[globalFemaleCounter % generatedFemaleNames.length],
        class_id: classId,
        gender: 'Wanita',
        nis: `2${className.replace(/\./g, '')}0${i+1}`.substring(0,8),
        nisn: `00${Math.floor(Math.random() * 100000000)}`,
        address: "Jl. Pendidikan No. 2",
        poin_pelanggaran: 0,
        poin_penghargaan: 0,
        sp_issued_level: 0
      });
      globalFemaleCounter++;
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
