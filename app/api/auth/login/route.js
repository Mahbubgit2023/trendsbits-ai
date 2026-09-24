import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  const { login, password, device_id } = await req.json();

  if (!device_id)
    return NextResponse.json({ error: 'Device ID missing' }, { status: 400 });

  const db = supabaseAdmin();

  const { data: user } = await db
    .from('users')
    .select('id, username, email, password_hash, role, active, access_expires_at, plan, max_devices, device_ids')
    .or(`email.eq.${login},username.eq.${login}`)
    .single();

  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const deviceIds = user.device_ids || [];
  const maxDevices = user.max_devices || 1;

  // Already registered on this device — allow
  if (!deviceIds.includes(device_id)) {
    // Slot available — register device
    if (deviceIds.length < maxDevices) {
      await db
        .from('users')
        .update({ device_ids: [...deviceIds, device_id] })
        .eq('id', user.id);
    } else {
      // No slots left
      const label = maxDevices === 1 ? 'single device' : `${maxDevices} devices`;
      return NextResponse.json(
        { error: `Your ${label} plan is fully used. Contact support to reset or upgrade.` },
        { status: 403 }
      );
    }
  }

  const expired = user.access_expires_at && new Date(user.access_expires_at) < new Date();
  const accessOk = user.active && !expired;

  const token = signToken({ id: user.id, role: user.role, device_id });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      plan: user.plan,
      active: accessOk,
      expires: user.access_expires_at,
      max_devices: maxDevices,
      device_count: deviceIds.includes(device_id) ? deviceIds.length : deviceIds.length + 1,
    },
  });
}
