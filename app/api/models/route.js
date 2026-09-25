import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getModels, planAllows, PLAN_CREDITS, DEFAULT_CREDITS, periodStart, creditsUsed } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from('users')
    .select('plan, access_expires_at')
    .eq('id', user.id)
    .single();

  let models;
  try {
    models = await getModels();
  } catch {
    return NextResponse.json({ error: 'Could not load models. Please refresh.' }, { status: 502 });
  }

  const plan = profile?.plan || null;
  const limit = PLAN_CREDITS[plan] || DEFAULT_CREDITS;
  const used = await creditsUsed(db, user.id, periodStart(profile?.access_expires_at));

  return NextResponse.json({
    plan,
    usage: { used, limit },
    models: models.map(m => ({ ...m, allowed: planAllows(plan, m.id) })),
  });
}
