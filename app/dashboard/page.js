'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const MODELS = [
  { id: 'chatgpt', label: 'ChatGPT', color: '#10A37F', dot: '🟢' },
  { id: 'claude',  label: 'Claude',  color: '#CC785C', dot: '🟠' },
  { id: 'gemini',  label: 'Gemini',  color: '#4285F4', dot: '🔵' },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [model, setModel] = useState('chatgpt');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('tb_token');
    const u = localStorage.getItem('tb_user');
    if (!token || !u) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (!parsed.active) { router.push('/#plans'); return; }
    setUser(parsed);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError('');

    const token = localStorage.getItem('tb_token');
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-device-id': localStorage.getItem('tb_device') || '' },
      body: JSON.stringify({ model, messages: next }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
  }

  const activeModel = MODELS.find(m => m.id === model);

  if (!user) return <div style={s.loading}>Loading…</div>;

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.logo}>TrendsBits <span style={{color:'#FF4D7E'}}>AI</span></div>
        <div style={s.sideLabel}>AI Models</div>
        {MODELS.map(m => (
          <button key={m.id} onClick={() => { setModel(m.id); setMessages([]); }}
            style={{ ...s.modelBtn, ...(model === m.id ? s.modelBtnActive : {}) }}>
            <span>{m.dot}</span>
            <span>{m.label}</span>
            {m.proOnly && <span style={s.proBadge}>PRO</span>}
          </button>
        ))}
        <div style={s.spacer}/>
        <div style={s.userBox}>
          <div style={s.userName}>@{user.username}</div>
          <div style={s.userPlan}>{user.plan?.toUpperCase() || 'STARTER'} · Active</div>
          <button style={s.logoutBtn} onClick={() => { localStorage.clear(); router.push('/'); }}>
            Log out
          </button>
        </div>
      </aside>

      {/* Chat area */}
      <main style={s.main}>
        <div style={s.chatHeader}>
          <span style={{ ...s.modelDot, background: activeModel.color }}/>
          <span style={s.chatTitle}>Chatting with {activeModel.label}</span>
        </div>

        <div style={s.messages}>
          {messages.length === 0 && (
            <div style={s.empty}>
              <div style={s.emptyIcon}>{activeModel.dot}</div>
              <div style={s.emptyTitle}>Start a conversation with {activeModel.label}</div>
              <div style={s.emptySub}>Ask anything — coding, writing, analysis, ideas.</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ ...s.bubble, ...(m.role === 'user' ? s.userBubble : s.aiBubble) }}>
              <div style={s.bubbleRole}>{m.role === 'user' ? 'You' : activeModel.label}</div>
              <div style={s.bubbleText}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ ...s.bubble, ...s.aiBubble }}>
              <div style={s.bubbleRole}>{activeModel.label}</div>
              <div style={s.typing}>●●●</div>
            </div>
          )}
          {error && <div style={s.errorBubble}>{error}</div>}
          <div ref={bottomRef}/>
        </div>

        <form onSubmit={send} style={s.inputRow}>
          <input
            style={s.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message ${activeModel.label}…`}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} style={s.sendBtn}>
            {loading ? '…' : '↑'}
          </button>
        </form>
      </main>
    </div>
  );
}

const s = {
  root:         { display:'flex', height:'100vh', background:'#0A0A0C', color:'#F0F0F5', fontFamily:'Inter,sans-serif' },
  loading:      { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0A0A0C', color:'#8A8A9A' },
  sidebar:      { width:220, background:'#111116', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', padding:'24px 16px', flexShrink:0 },
  logo:         { fontWeight:800, fontSize:18, marginBottom:28 },
  sideLabel:    { fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'#8A8A9A', marginBottom:10 },
  modelBtn:     { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, background:'transparent', border:'none', color:'#8A8A9A', fontSize:14, fontWeight:500, cursor:'pointer', width:'100%', marginBottom:4 },
  modelBtnActive:{ background:'rgba(224,40,92,0.1)', color:'#F0F0F5', borderLeft:'2px solid #E0285C' },
  proBadge:     { marginLeft:'auto', fontSize:10, fontWeight:700, background:'#E0285C', color:'#fff', padding:'2px 6px', borderRadius:4 },
  spacer:       { flex:1 },
  userBox:      { borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:16 },
  userName:     { fontSize:14, fontWeight:600, marginBottom:2 },
  userPlan:     { fontSize:11, color:'#FF4D7E', fontWeight:700, marginBottom:10 },
  logoutBtn:    { background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#8A8A9A', fontSize:12, padding:'6px 12px', borderRadius:6, cursor:'pointer', width:'100%' },
  main:         { flex:1, display:'flex', flexDirection:'column', minWidth:0 },
  chatHeader:   { padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10 },
  modelDot:     { width:10, height:10, borderRadius:'50%', flexShrink:0 },
  chatTitle:    { fontWeight:600, fontSize:15 },
  messages:     { flex:1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:16 },
  empty:        { margin:'auto', textAlign:'center', color:'#8A8A9A' },
  emptyIcon:    { fontSize:48, marginBottom:16 },
  emptyTitle:   { fontSize:18, fontWeight:600, color:'#F0F0F5', marginBottom:6 },
  emptySub:     { fontSize:14 },
  bubble:       { maxWidth:680, padding:'14px 18px', borderRadius:12, lineHeight:1.65, fontSize:14 },
  userBubble:   { alignSelf:'flex-end', background:'rgba(224,40,92,0.12)', border:'1px solid rgba(224,40,92,0.2)' },
  aiBubble:     { alignSelf:'flex-start', background:'#16161D', border:'1px solid rgba(255,255,255,0.07)' },
  bubbleRole:   { fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#8A8A9A', marginBottom:6 },
  bubbleText:   { whiteSpace:'pre-wrap' },
  typing:       { color:'#8A8A9A', letterSpacing:4 },
  errorBubble:  { padding:'12px 16px', background:'rgba(224,40,92,0.1)', border:'1px solid rgba(224,40,92,0.3)', borderRadius:8, color:'#FF4D7E', fontSize:13 },
  inputRow:     { padding:'16px 24px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:10 },
  input:        { flex:1, background:'#16161D', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 16px', color:'#F0F0F5', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none' },
  sendBtn:      { background:'linear-gradient(135deg,#FF4D7E,#E0285C)', border:'none', color:'#fff', width:44, height:44, borderRadius:10, fontSize:18, cursor:'pointer', flexShrink:0 },
};
