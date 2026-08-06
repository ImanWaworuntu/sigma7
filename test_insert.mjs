import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

async function testInsert() {
  const { data, error } = await supabase.from('users').insert([{
    nama_lengkap: 'Test',
    username: 'test',
    password: '123',
    role: 'guru'
  }]).select();
  
  if (error) {
    console.error("Insert error details:", error);
  } else {
    console.log("Insert success:", data);
  }
}
testInsert();
