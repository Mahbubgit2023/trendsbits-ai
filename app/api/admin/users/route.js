import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  const caller = getUser(req);
  if (!caller || caller.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = supabaseAdmin();
  const { data } = await db
    .from('users')
    .select('id, username, email, role, active, plan, max_devices, access_expires_at, device_ids, created_at')
    .order('created_at', { ascending: false });

  return NextResponse.json(data);
}

export async function PATCH(req) {
  const caller = getUser(req);
  if (!caller || caller.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { user_id, active, days, reset_device } = await req.json();
  const db = supabaseAdmin();

  const update = {};
  if (typeof active === 'boolean') update.active = active;
  if (days) {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    update.access_expires_at = expires.toISOString();
    update.active = true;
  }
  // Clear all device slots — user can log in fresh from any device
  if (reset_device) update.device_ids = [];

  await db.from('users').update(update).eq('id', user_id);
  return NextResponse.json({ ok: true });
}
