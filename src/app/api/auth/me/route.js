import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'sigma7-super-secret-key-change-me');

export async function GET(request) {
  try {
    const token = request.cookies.get('sigma_token')?.value;
    
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    return NextResponse.json({
      authenticated: true,
      user: {
        username: payload.username,
        role: payload.role,
        nama_lengkap: payload.nama_lengkap
      }
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
