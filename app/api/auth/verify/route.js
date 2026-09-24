import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// Called by the Chrome extension every hour to verify the session is still valid
export async function GET(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const requestDevice = req.headers.get('x-device-id');
  if (!requestDevice || requestDevice !== user.device_id)
    return NextResponse.json({ error: 'Device mismatch' }, { status: 403 });

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from('users')
    .select('active, access_expires_at, plan, device_ids, gemini_enabled, username')
    .eq('id', user.id)
    .single();

  if (!profile?.device_ids?.includes(requestDevice))
    return NextResponse.json({ error: 'Device revoked' }, { status: 403 });

  const expired = profile.access_expires_at && new Date(profile.access_expires_at) < new Date();
  if (!profile.active || expired)
    return NextResponse.json({ error: 'Subscription inactive' }, { status: 403 });

  return NextResponse.json({
    ok: true,
    username: profile.username,
    plan: profile.plan,
    active: true,
    expires: profile.access_expires_at,
    gemini_enabled: profile.gemini_enabled,
  });
}
