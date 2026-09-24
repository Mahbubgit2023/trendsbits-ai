'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('tb_user') || '{}');
    if (u.role !== 'admin') { router.push('/dashboard'); return; }
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const token = localStorage.getItem('tb_token');
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function toggle(userId, active) {
    const token = localStorage.getItem('tb_token');
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, active }),
    });
    fetchUsers();
  }

  async function extendDays(userId) {
    const token = localStorage.getItem('tb_token');
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, active: true, days: 30 }),
    });
    fetchUsers();
  }

  async function resetDevice(userId) {
    if (!confirm('Reset this user\'s device lock? They can log in from any device once.')) return;
    const token = localStorage.getItem('tb_token');
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, reset_device: true }),
    });
    fetchUsers();
  }

  const fmt = d => d ? new Date(d).toLocaleDateString('en-GB') : '—';

  return (
    <div style={s.root}>
      <header style={s.header}>
        <div style={s.logo}>TrendsBits <span style={{color:'#FF4D7E'}}>AI</span> — Admin</div>
        <button style={s.backBtn} onClick={() => router.push('/dashboard')}>← Dashboard</button>
      </header>

      <main style={s.main}>
        <div style={s.titleRow}>
          <h1 style={s.title}>Users</h1>
          <span style={s.count}>{users.length} total</span>
        </div>

        {loading ? <p style={{color:'#8A8A9A'}}>Loading…</p> : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Username','Email','Plan','Active','Expires','Device','Actions'].map(h =>
                    <th key={h} style={s.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={s.tr}>
                    <td style={s.td}>{u.username}</td>
                    <td style={s.td}><span style={s.muted}>{u.email}</span></td>
                    <td style={s.td}>{u.plan ? <span style={s.planBadge}>{u.plan}</span> : <span style={s.muted}>—</span>}</td>
                    <td style={s.td}>
                      <span style={{ ...s.statusDot, background: u.active ? '#10A37F' : '#8A8A9A' }}/>
                      {u.active ? 'Active' : 'Inactive'}
                    </td>
                    <td style={s.td}><span style={s.muted}>{fmt(u.access_expires_at)}</span></td>
                    <td style={s.td}>
                      <span style={(u.device_ids?.length || 0) >= (u.max_devices || 1) ? s.deviceLocked : s.deviceFree}>
                        {u.device_ids?.length || 0}/{u.max_devices || 1}
                        {(u.device_ids?.length || 0) >= (u.max_devices || 1) ? ' 🔒' : ' ✓'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button style={{ ...s.actionBtn, ...(u.active ? s.btnDanger : s.btnGreen) }}
                          onClick={() => toggle(u.id, !u.active)}>
                          {u.active ? 'Disable' : 'Enable'}
                        </button>
                        <button style={{ ...s.actionBtn, ...s.btnBlue }} onClick={() => extendDays(u.id)}>
                          +30d
                        </button>
                        {u.device_id && (
                          <button style={{ ...s.actionBtn, ...s.btnOrange }} onClick={() => resetDevice(u.id)}>
                            Reset device
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  root:      { minHeight:'100vh', background:'#0A0A0C', color:'#F0F0F5', fontFamily:'Inter,sans-serif' },
  header:    { padding:'16px 32px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo:      { fontWeight:800, fontSize:18 },
  backBtn:   { background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#8A8A9A', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:13 },
  main:      { padding:'40px 32px' },
  titleRow:  { display:'flex', alignItems:'center', gap:16, marginBottom:24 },
  title:     { fontSize:24, fontWeight:700 },
  count:     { background:'rgba(255,255,255,0.07)', padding:'4px 12px', borderRadius:100, fontSize:13, color:'#8A8A9A' },
  tableWrap: { overflowX:'auto' },
  table:     { width:'100%', borderCollapse:'collapse', fontSize:14 },
  th:        { textAlign:'left', padding:'10px 16px', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#8A8A9A', borderBottom:'1px solid rgba(255,255,255,0.07)' },
  tr:        { borderBottom:'1px solid rgba(255,255,255,0.04)' },
  td:        { padding:'14px 16px', verticalAlign:'middle' },
  muted:     { color:'#8A8A9A' },
  planBadge: { background:'rgba(224,40,92,0.15)', color:'#FF4D7E', padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:700, textTransform:'uppercase' },
  statusDot: { display:'inline-block', width:8, height:8, borderRadius:'50%', marginRight:8 },
  actions:   { display:'flex', gap:8 },
  actionBtn: { padding:'6px 12px', borderRadius:6, border:'none', fontSize:12, fontWeight:600, cursor:'pointer' },
  btnGreen:  { background:'rgba(16,163,127,0.15)', color:'#10A37F' },
  btnDanger: { background:'rgba(224,40,92,0.15)', color:'#FF4D7E' },
  btnBlue:    { background:'rgba(66,133,244,0.15)', color:'#4285F4' },
  btnOrange:  { background:'rgba(251,146,60,0.15)', color:'#FB923C' },
  deviceLocked:{ fontSize:12, color:'#FB923C' },
  deviceFree: { fontSize:12, color:'#10A37F' },
};
