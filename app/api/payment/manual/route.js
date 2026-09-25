import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = verifyToken(authHeader.slice(7));
        userId = decoded?.id || decoded?.userId || null;
      } catch {}
    }

    const { plan, amount, paymentMethod, transactionId, senderNumber } = await req.json();

    if (!plan || !amount || !paymentMethod || !transactionId || !senderNumber) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data, error } = await db.from('manual_payments').insert({
      user_id: userId,
      plan,
      amount,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      sender_number: senderNumber,
      status: 'pending',
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      console.error('Payment insert error:', error);
      return NextResponse.json({ error: 'Failed to save payment' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, paymentId: data.id });
  } catch (err) {
    console.error('Payment error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
  }
