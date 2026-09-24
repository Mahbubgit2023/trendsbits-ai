import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 });
  }

  const db = supabaseAdmin();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan;

    if (!userId) return NextResponse.json({ ok: true });

    const maxDevices = plan?.startsWith('dual') ? 2 : 1;
    const includesGemini = plan?.endsWith('_all');

    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    await db.from('users').update({
      active: true,
      plan,
      max_devices: maxDevices,
      gemini_enabled: includesGemini,
      access_expires_at: expires.toISOString(),
      device_ids: [],
    }).eq('id', userId);
  }

  return NextResponse.json({ ok: true });
}
