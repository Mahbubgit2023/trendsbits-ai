import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - list all pending payments (admin only)
export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyToken(authHeader.slice(7));
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const db = supabaseAdmin();
    const { data, error } = await db
      .from('manual_payments')
      .select('*, users(email)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ payments: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - approve or reject a payment (admin only)
export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyToken(authHeader.slice(7));
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { paymentId, action } = await req.json();
    const db = supabaseAdmin();

    const { data: payment, error: fetchError } = await db
      .from('manual_payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (action === 'approve') {
      const maxDevices = payment.plan?.startsWith('dual') ? 2 : 1;
      const geminiEnabled = payment.plan?.endsWith('_all');
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);

      if (payment.user_id) {
        await db.from('users').update({
          active: true,
          plan: payment.plan,
          max_devices: maxDevices,
          gemini_enabled: geminiEnabled,
          access_expires_at: expires.toISOString(),
          device_ids: [],
        }).eq('id', payment.user_id);
      }

      await db.from('manual_payments').update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      }).eq('id', paymentId);

    } else if (action === 'reject') {
      await db.from('manual_payments').update({
        status: 'rejected',
      }).eq('id', paymentId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
