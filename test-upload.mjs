import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

async function testUpload() {
  console.log('Testing upload to record_photos...');
  const { data, error } = await supabase.storage
    .from('record_photos')
    .upload('test.txt', 'hello world', { contentType: 'text/plain', upsert: true });
    
  if (error) {
    console.error('UPLOAD ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('UPLOAD SUCCESS:', data);
  }
}
testUpload();
