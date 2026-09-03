import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Setup supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log("Starting Admin insertion and password hashing migration...");
    
    // 1. Insert admin
    const adminPassword = "sigma123";
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);
    
    // Check if admin exists
    const { data: adminExists } = await supabase.from('users').select('*').eq('username', 'iman.waw@gmail.com').single();
    if (!adminExists) {
        console.log("Inserting admin: iman.waw@gmail.com...");
        const { error } = await supabase.from('users').insert([{
            username: 'iman.waw@gmail.com',
            password: hashedAdminPassword,
            role: 'guru', // Database check constraint prevents 'admin'
            nama_lengkap: 'Administrator'
        }]);
        if (error) console.error("Error inserting admin:", error.message);
        else console.log("Admin inserted successfully.");
    } else {
        console.log("Admin already exists. Updating password...");
        await supabase.from('users').update({ password: hashedAdminPassword }).eq('username', 'iman.waw@gmail.com');
    }

    // 2. Hash existing users
    console.log("Fetching all users to hash existing plaintext passwords...");
    const { data: users, error: fetchError } = await supabase.from('users').select('*');
    if (fetchError) {
        console.error("Error fetching users:", fetchError.message);
        return;
    }
    
    for (let user of users) {
        if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
            console.log(`Hashing password for ${user.username}...`);
            const hashedPwd = await bcrypt.hash(user.password, salt);
            await supabase.from('users').update({ password: hashedPwd }).eq('id', user.id);
        }
    }
    
    console.log("Migration complete!");
}

migrate();
