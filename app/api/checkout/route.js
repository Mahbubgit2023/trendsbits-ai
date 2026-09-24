import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// plan codes: 'single_standard' | 'single_all' | 'dual_standard' | 'dual_all'
const PRICES = {
  single_standard: process.env.STRIPE_SINGLE_STANDARD_PRICE_ID, // ৳700
  single_all:      process.env.STRIPE_SINGLE_ALL_PRICE_ID,      // ৳800
  dual_standard:   process.env.STRIPE_DUAL_STANDARD_PRICE_ID,   // ৳1000
  dual_all:        process.env.STRIPE_DUAL_ALL_PRICE_ID,        // ৳1100
};

export async function POST(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { plan } = await req.json();
  const priceId = PRICES[plan];
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  const origin = req.headers.get('origin') || 'https://ai.trendsbits.com';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: user.id, plan },
    success_url: `${origin}/dashboard?success=1`,
    cancel_url: `${origin}/#pricing`,
  });

  return NextResponse.json({ url: session.url });
}
