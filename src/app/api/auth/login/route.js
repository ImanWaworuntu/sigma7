import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'sigma7-super-secret-key-change-me');

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Find user in database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    // Check if the password is plain text or hashed.
    // If it starts with $2a$ or $2b$, it's likely a bcrypt hash.
    const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
    let isValid = false;

    if (isHashed) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Fallback for plain text password (TEMPORARY during migration)
      isValid = (password === user.password);
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    // Elevate specific user to admin (Bypass for DB constraint that rejects 'admin' role)
    if (user.username === 'iman.waw@gmail.com' || user.username === 'admin') {
      user.role = 'admin';
    }

    // Generate JWT
    const token = await new SignJWT({
      username: user.username,
      role: user.role,
      nama_lengkap: user.nama_lengkap
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(JWT_SECRET);

    // Set HttpOnly Cookie
    const response = NextResponse.json({ success: true, role: user.role, nama_lengkap: user.nama_lengkap });
    response.cookies.set({
      name: 'sigma_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
