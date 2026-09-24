import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export async function POST(req) {
  // Auth check
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  // ── Device check ─────────────────────────────────────────────
  const requestDevice = req.headers.get('x-device-id');
  if (!requestDevice || requestDevice !== user.device_id) {
    return NextResponse.json(
      { error: 'Device not recognised. Please log in again.' },
      { status: 403 }
    );
  }

  // Subscription check
  const db = supabaseAdmin();
  const { data: profile } = await db
    .from('users')
    .select('active, access_expires_at, plan, device_ids, gemini_enabled')
    .eq('id', user.id)
    .single();

  // Verify device is still in the allowed list (catches admin resets)
  if (!profile?.device_ids?.includes(requestDevice)) {
    return NextResponse.json(
      { error: 'Session expired. Please log in again.' },
      { status: 403 }
    );
  }

  if (!profile?.active || (profile.access_expires_at && new Date(profile.access_expires_at) < new Date()))
    return NextResponse.json({ error: 'Subscription inactive. Please renew your plan.' }, { status: 403 });

  const { model, messages } = await req.json();

  // Gemini only on 'all tools' plans
  if (model === 'gemini' && !profile.gemini_enabled)
    return NextResponse.json({ error: 'Gemini is not included in your plan. Upgrade to All Tools.' }, { status: 403 });

  try {
    let reply = '';

    if (model === 'chatgpt') {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 1024,
      });
      reply = res.choices[0].message.content;

    } else if (model === 'claude') {
      const res = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages,
      });
      reply = res.content[0].text;

    } else if (model === 'gemini') {
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const chat = geminiModel.startChat({ history });
      const last = messages[messages.length - 1].content;
      const res = await chat.sendMessage(last);
      reply = res.response.text();

    } else {
      return NextResponse.json({ error: 'Unknown model' }, { status: 400 });
    }

    await db.from('chat_logs').insert({ user_id: user.id, model, message_count: messages.length });

    return NextResponse.json({ reply });

  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'AI request failed. Please try again.' }, { status: 500 });
  }
}
