'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const PROVIDER_ORDER = ['OpenAI', 'Anthropic', 'Google', 'xAI', 'DeepSeek', 'Meta', 'Mistral', 'Qwen'];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [models, setModels] = useState([]);
  const [usage, setUsage] = useState({ used: 0, limit: 0 });
  const [modelId, setModelId] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('tb_token')}`,
      'x-device-id': localStorage.getItem('tb_device') || '',
    };
  }

  useEffect(() => {
    const token = localStorage.getItem('tb_token');
    const u = localStorage.getItem('tb_user');
    if (!token || !u) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (!parsed.active) { router.push('/#plans'); return; }
    setUser(parsed);

    fetch('/api/models', { headers: authHeaders() })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) { setError(d.error || 'Could not load models'); return; }
        setModels(d.models);
        setUsage(d.usage);
        const saved = localStorage.getItem('tb_model');
        const allowed = d.models.filter(m => m.allowed);
        const pick = allowed.find(m => m.id === saved)
          || allowed.find(m => m.provider === 'OpenAI' && m.credits <= 2)
          || allowed[0];
        if (pick) setModelId(pick.id);
      })
      .catch(() => setError('Could not load models. Please refresh.'));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const active = models.find(m => m.id === modelId);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = models.filter(m => !q || m.name.toLowerCase().includes(q) || m.id.includes(q) || m.provider.toLowerCase().includes(q));
    const groups = {};
    list.forEach(m => { (groups[m.provider] ||= []).push(m); });
    return Object.entries(groups).sort((a, b) => {
      const ia = PROVIDER_ORDER.indexOf(a[0]), ib = PROVIDER_ORDER.indexOf(b[0]);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a[0].localeCompare(b[0]);
    });
  }, [models, search]);

  function choose(m) {
    if (!m.allowed) return;
    setModelId(m.id);
    localStorage.setItem('tb_model', m.id);
    setPickerOpen(false);
    setSearch('');
  }

  async function send(e) {
    e.preventDefault();
    if (!input.trim() || loading || !active) return;
    const next = [...messages, { role: 'user', content: input.trim() }];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ model: active.id, messages: next }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, model: active.name }]);
      if (data.usage) setUsage(data.usage);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <div style={s.loading}>Loading…</div>;

  const pct = usage.limit ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;

  return (
    <div style={s.root}>
      <style>{`@media (max-width: 760px){ .tb-side{display:none !important} }`}</style>

      <aside className="tb-side" style={s.sidebar}>
        <a href="/" style={s.logo}>TrendsBits <span style={{ color: '#FF4D7E' }}>AI</span></a>
        <button style={s.newChat} onClick={() => { setMessages([]); setError(''); }}>+ New chat</button>
        <div style={s.spacer} />
        <div style={s.usageBox}>
          <div style={s.usageRow}><span>Credits this month</span><span>{usage.used}/{usage.limit}</span></div>
          <div style={s.bar}><div style={{ ...s.barFill, width: pct + '%', background: pct > 85 ? '#FB923C' : '#10A37F' }} /></div>
        </div>
        <div style={s.userBox}>
          <div style={s.userName}>@{user.username}</div>
          <div style={s.userPlan}>{(user.plan || '').replace('_', ' ').toUpperCase() || 'PLAN'} · Active</div>
          {user.role === 'admin' && <a href="/admin/payments" style={s.adminLink}>Admin panel</a>}
          <button style={s.logoutBtn} onClick={() => { localStorage.removeItem('tb_token'); localStorage.removeItem('tb_user'); router.push('/login'); }}>Log out</button>
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.chatHeader}>
          <button style={s.modelBtn} onClick={() => setPickerOpen(true)}>
            <span style={s.modelDot} />
            <span style={{ fontWeight: 600 }}>{active ? active.name : 'Choose a model'}</span>
            {active && <span style={s.cost}>{active.credits} cr</span>}
            <span style={{ color: '#8A8A9A' }}>▾</span>
          </button>
          <span style={s.headerUsage}>{usage.used}/{usage.limit} credits</span>
        </div>

        <div style={s.messages}>
          {messages.length === 0 && (
            <div style={s.empty}>
              <div style={s.emptyTitle}>{models.length ? `${models.length} AI models ready` : 'Loading models…'}</div>
              <div style={s.emptySub}>Pick any model at the top, then ask anything: coding, writing, analysis, ideas.</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ ...s.bubble, ...(m.role === 'user' ? s.userBubble : s.aiBubble) }}>
              <div style={s.bubbleRole}>{m.role === 'user' ? 'You' : m.model || 'AI'}</div>
              <div style={s.bubbleText}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ ...s.bubble, ...s.aiBubble }}>
              <div style={s.bubbleRole}>{active?.name}</div>
              <div style={s.typing}>●●●</div>
            </div>
          )}
          {error && <div style={s.errorBubble}>{error}</div>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} style={s.inputRow}>
          <textarea
            style={s.input}
            value={input}
            rows={1}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) send(e); }}
            placeholder={active ? `Message ${active.name}…` : 'Choose a model first'}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim() || !active} style={s.sendBtn}>{loading ? '…' : '↑'}</button>
        </form>
      </main>

      {pickerOpen && (
        <div style={s.overlay} onClick={() => setPickerOpen(false)}>
          <div style={s.picker} onClick={e => e.stopPropagation()}>
            <div style={s.pickerHead}>
              <input autoFocus style={s.search} placeholder={`Search ${models.length} models…`} value={search} onChange={e => setSearch(e.target.value)} />
              <button style={s.closeBtn} onClick={() => setPickerOpen(false)}>✕</button>
            </div>
            <div style={s.legend}>cr = credits per message</div>
            <div style={s.pickerList}>
              {grouped.map(([provider, list]) => (
                <div key={provider}>
                  <div style={s.groupLabel}>{provider}</div>
                  {list.map(m => (
                    <button key={m.id} onClick={() => choose(m)}
                      style={{ ...s.modelRow, ...(m.id === modelId ? s.modelRowActive : {}), ...(m.allowed ? {} : s.modelRowLocked) }}>
                      <span style={{ flex: 1, textAlign: 'left' }}>{m.name}</span>
                      {m.allowed
                        ? <span style={s.cost}>{m.credits} cr</span>
                        : <span style={s.lock}>🔒 All Tools plan</span>}
                    </button>
                  ))}
                </div>
              ))}
              {grouped.length === 0 && <div style={{ color: '#8A8A9A', padding: 16 }}>No models found.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  root: { display: 'flex', height: '100vh', background: '#0A0A0C', color: '#F0F0F5', fontFamily: 'Inter, system-ui, sans-serif' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0A0A0C', color: '#8A8A9A' },
  sidebar: { width: 240, background: '#111116', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0 },
  logo: { fontWeight: 800, fontSize: 18, marginBottom: 24, color: '#F0F0F5', textDecoration: 'none' },
  newChat: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F5', padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 14, textAlign: 'left' },
  spacer: { flex: 1 },
  usageBox: { marginBottom: 16 },
  usageRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8A8A9A', marginBottom: 6 },
  bar: { height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  userBox: { borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 },
  userName: { fontSize: 14, fontWeight: 600, marginBottom: 2 },
  userPlan: { fontSize: 11, color: '#FF4D7E', fontWeight: 700, marginBottom: 10 },
  adminLink: { display: 'block', fontSize: 13, color: '#4285F4', marginBottom: 10, textDecoration: 'none' },
  logoutBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#8A8A9A', fontSize: 12, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', width: '100%' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  chatHeader: { padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  modelBtn: { display: 'flex', alignItems: 'center', gap: 10, background: '#16161D', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F5', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 14, maxWidth: '75%' },
  modelDot: { width: 8, height: 8, borderRadius: '50%', background: '#10A37F', flexShrink: 0 },
  headerUsage: { fontSize: 12, color: '#8A8A9A', whiteSpace: 'nowrap' },
  cost: { fontSize: 11, fontWeight: 700, color: '#8A8A9A', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' },
  messages: { flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  empty: { margin: 'auto', textAlign: 'center', color: '#8A8A9A', maxWidth: 420 },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: '#F0F0F5', marginBottom: 8 },
  emptySub: { fontSize: 14 },
  bubble: { maxWidth: 720, padding: '14px 18px', borderRadius: 12, lineHeight: 1.65, fontSize: 14 },
  userBubble: { alignSelf: 'flex-end', background: 'rgba(224,40,92,0.12)', border: '1px solid rgba(224,40,92,0.2)' },
  aiBubble: { alignSelf: 'flex-start', background: '#16161D', border: '1px solid rgba(255,255,255,0.07)' },
  bubbleRole: { fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8A9A', marginBottom: 6 },
  bubbleText: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  typing: { color: '#8A8A9A', letterSpacing: 4 },
  errorBubble: { padding: '12px 16px', background: 'rgba(224,40,92,0.1)', border: '1px solid rgba(224,40,92,0.3)', borderRadius: 8, color: '#FF4D7E', fontSize: 13 },
  inputRow: { padding: '16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10 },
  input: { flex: 1, background: '#16161D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#F0F0F5', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none' },
  sendBtn: { background: 'linear-gradient(135deg,#FF4D7E,#E0285C)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: 10, fontSize: 18, cursor: 'pointer', flexShrink: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 16px', zIndex: 50 },
  picker: { background: '#111116', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '75vh', display: 'flex', flexDirection: 'column' },
  pickerHead: { display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid rgba(255,255,255,0.07)' },
  search: { flex: 1, background: '#16161D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#F0F0F5', fontSize: 14, outline: 'none' },
  closeBtn: { background: 'transparent', border: 'none', color: '#8A8A9A', fontSize: 18, cursor: 'pointer', padding: '0 8px' },
  legend: { fontSize: 11, color: '#8A8A9A', padding: '8px 16px 0' },
  pickerList: { overflowY: 'auto', padding: '4px 8px 12px' },
  groupLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8A8A9A', padding: '14px 8px 6px' },
  modelRow: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'transparent', border: 'none', color: '#F0F0F5', padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  modelRowActive: { background: 'rgba(16,163,127,0.15)' },
  modelRowLocked: { opacity: 0.5, cursor: 'not-allowed' },
  lock: { fontSize: 11, color: '#FB923C', whiteSpace: 'nowrap' },
};
