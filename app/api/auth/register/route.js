import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  const { username, email, password } = await req.json();

  if (!username || !email || !password)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });

  if (password.length < 8)
    return NextResponse.json({ error: 'Password too short' }, { status: 400 });

  const db = supabaseAdmin();

  // Check existing
  const { data: existing } = await db
    .from('users')
    .select('id')
    .or(`email.eq.${email},username.eq.${username}`)
    .single();

  if (existing)
    return NextResponse.json({ error: 'Email or username already taken' }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);

  const { data: user, error } = await db
    .from('users')
    .insert({ username, email, password_hash: hash, role: 'user', active: false })
    .select('id, username, email, role, active')
    .single();

  if (error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });

  const token = signToken({ id: user.id, role: user.role });

  return NextResponse.json({ token, user }, { status: 201 });
}
