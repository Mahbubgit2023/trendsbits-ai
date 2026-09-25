'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDeviceId } from '@/lib/device';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function doLogin(loginId, pass) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: loginId, password: pass, device_id: getDeviceId() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('tb_token', data.token);
    localStorage.setItem('tb_user', JSON.stringify(data.user));
    return data.user;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user;
      if (mode === 'register') {
        if (password.length < 8) throw new Error('Password must be at least 8 characters');
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Sign up failed');
        user = await doLogin(email.trim(), password);
      } else {
        user = await doLogin(login.trim(), password);
      }
      if (next) router.push(next);
      else if (user.role === 'admin') router.push('/admin/payments');
      else if (user.active) router.push('/dashboard');
      else router.push('/#plans');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isReg = mode === 'register';

  return (
    <div style={s.page}>
      <a href="/" style={s.logo}>TrendsBits <span style={{ color: '#2563eb' }}>AI</span></a>
      <div style={s.card}>
        <div style={s.tabs}>
          <button type="button" onClick={() => { setMode('login'); setError(''); }} style={{ ...s.tab, ...(!isReg ? s.tabActive : {}) }}>Log in</button>
          <button type="button" onClick={() => { setMode('register'); setError(''); }} style={{ ...s.tab, ...(isReg ? s.tabActive : {}) }}>Sign up</button>
        </div>
        {next && <p style={s.note}>Please log in or sign up to continue.</p>}
        <form onSubmit={handleSubmit}>
          {isReg ? (
            <>
              <input style={s.input} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
              <input style={s.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            </>
          ) : (
            <input style={s.input} placeholder="Email or username" value={login} onChange={e => setLogin(e.target.value)} required />
          )}
          <input style={s.input} type="password" placeholder={isReg ? 'Password (min 8 characters)' : 'Password'} value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div style={s.error}>{error}</div>}
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? 'Please wait...' : isReg ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p style={s.small}>
          {isReg ? 'Already have an account? ' : "Don't have an account? "}
          <a href="#" onClick={e => { e.preventDefault(); setMode(isReg ? 'login' : 'register'); setError(''); }} style={s.link}>
            {isReg ? 'Log in' : 'Sign up'}
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', color: '#0f172a' },
  logo: { fontWeight: 800, fontSize: 24, marginBottom: 20, color: '#0f172a', textDecoration: 'none' },
  card: { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  tabs: { display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 20 },
  tab: { flex: 1, padding: '10px', border: 'none', background: 'transparent', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer', color: '#64748b' },
  tabActive: { background: '#fff', color: '#0f172a', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  note: { background: '#eff6ff', color: '#1d4ed8', padding: '10px 12px', borderRadius: 8, fontSize: 14, margin: '0 0 16px' },
  input: { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, marginBottom: 12, boxSizing: 'border-box' },
  btn: { width: '100%', padding: 14, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  error: { color: '#dc2626', fontSize: 14, marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 },
  small: { textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 16, marginBottom: 0 },
  link: { color: '#2563eb', fontWeight: 600, textDecoration: 'none' },
};
