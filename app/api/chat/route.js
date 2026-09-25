import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { findModel, planAllows, PLAN_CREDITS, DEFAULT_CREDITS, periodStart, creditsUsed, logUsage } from '@/lib/models';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_HISTORY_CHARS = 12000; // keeps input cost per message bounded
const MAX_OUTPUT_TOKENS = 2000;

export async function POST(req) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const requestDevice = req.headers.get('x-device-id');
  if (!requestDevice || requestDevice !== user.device_id)
    return NextResponse.json({ error: 'Device not recognised. Please log in again.' }, { status: 403 });

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from('users')
    .select('active, access_expires_at, plan, device_ids')
    .eq('id', user.id)
    .single();

  if (!profile?.device_ids?.includes(requestDevice))
    return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 403 });

  if (!profile.active || (profile.access_expires_at && new Date(profile.access_expires_at) < new Date()))
    return NextResponse.json({ error: 'Subscription inactive. Please renew your plan.' }, { status: 403 });

  if (!process.env.OPENROUTER_API_KEY)
    return NextResponse.json({ error: 'AI service is not configured yet. Please contact support.' }, { status: 503 });

  const { model: modelId, messages } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0)
    return NextResponse.json({ error: 'Empty message' }, { status: 400 });

  const model = await findModel(modelId);
  if (!model) return NextResponse.json({ error: 'This model is not available.' }, { status: 400 });
  if (!planAllows(profile.plan, model.id))
    return NextResponse.json({ error: 'This model is not in your plan. Upgrade to an All Tools plan.' }, { status: 403 });

  const limit = PLAN_CREDITS[profile.plan] || DEFAULT_CREDITS;
  const used = await creditsUsed(db, user.id, periodStart(profile.access_expires_at));
  if (used + model.credits > limit)
    return NextResponse.json({ error: `Monthly limit reached (${used}/${limit} credits). It resets when you renew.` }, { status: 429 });

  // Keep only the most recent messages that fit the history budget
  const clean = messages
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content }));
  const trimmed = [];
  let chars = 0;
  for (let i = clean.length - 1; i >= 0; i--) {
    chars += clean[i].content.length;
    if (chars > MAX_HISTORY_CHARS && trimmed.length > 0) break;
    trimmed.unshift({ ...clean[i], content: clean[i].content.slice(-MAX_HISTORY_CHARS) });
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai.trendsbits.com',
        'X-Title': 'TrendsBits AI',
      },
      body: JSON.stringify({ model: model.id, messages: trimmed, max_tokens: MAX_OUTPUT_TOKENS }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      console.error('OpenRouter error:', data.error || res.status);
      return NextResponse.json({ error: 'AI request failed. Please try again or pick another model.' }, { status: 502 });
    }
    const reply = data.choices?.[0]?.message?.content || '';

    await logUsage(db, user.id, model.id, model.credits, trimmed.length);

    return NextResponse.json({ reply, usage: { used: used + model.credits, limit } });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'AI request failed. Please try again.' }, { status: 500 });
  }
}
