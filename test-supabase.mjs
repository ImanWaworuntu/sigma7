import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

async function check() {
  const { data: records, error } = await supabase.from('records').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent Records:', records.map(r => ({ id: r.id, action: r.action, photo: r.photo_url })));
  
  const { data: files } = await supabase.storage.from('record_photos').list();
  console.log('Files in storage:', files);
}
check();
