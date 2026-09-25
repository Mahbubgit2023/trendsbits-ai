const PLANS = [
  { id: 'single_standard', name: 'Single Standard', price: 700, devices: 1, tools: ['ChatGPT', 'Claude'] },
  { id: 'single_all', name: 'Single All Tools', price: 800, devices: 1, tools: ['ChatGPT', 'Claude', 'Gemini'], popular: true },
  { id: 'dual_standard', name: 'Dual Standard', price: 1000, devices: 2, tools: ['ChatGPT', 'Claude'] },
  { id: 'dual_all', name: 'Dual All Tools', price: 1100, devices: 2, tools: ['ChatGPT', 'Claude', 'Gemini'] },
];

const STEPS = [
  { n: 1, title: 'Choose a plan', text: 'Pick the plan that fits you below.' },
  { n: 2, title: 'Send money', text: 'Pay with bKash, Nagad or Rocket using Send Money.' },
  { n: 3, title: 'Submit Transaction ID', text: 'Enter your Transaction ID. We activate your account within 1-2 hours.' },
];

export default function Home() {
  return (
    <main style={s.page}>
      <header style={s.header}>
        <div style={s.logo}>TrendsBits <span style={{ color: '#2563eb' }}>AI</span></div>
        <a href="#plans" style={s.headerLink}>Plans</a>
      </header>

      <section style={s.hero}>
        <div style={s.badge}>ChatGPT · Claude · Gemini</div>
        <h1 style={s.h1}>All top AI tools in one subscription</h1>
        <p style={s.lead}>
          Use ChatGPT, Claude and Gemini from one place. Pay monthly in Taka with bKash, Nagad or Rocket.
        </p>
        <a href="#plans" style={s.cta}>See plans</a>
      </section>

      <section id="plans" style={s.section}>
        <h2 style={s.h2}>Plans</h2>
        <p style={s.sub}>All plans are for 30 days.</p>
        <div style={s.grid}>
          {PLANS.map((p) => (
            <div key={p.id} style={{ ...s.card, ...(p.popular ? s.cardPopular : {}) }}>
              {p.popular && <div style={s.popular}>Most popular</div>}
              <div style={s.planName}>{p.name}</div>
              <div style={s.price}>
                ৳{p.price}<span style={s.per}> / month</span>
              </div>
              <ul style={s.list}>
                {p.tools.map((t) => (
                  <li key={t} style={s.li}>✓ {t}</li>
                ))}
                <li style={s.li}>✓ {p.devices} device{p.devices > 1 ? 's' : ''}</li>
              </ul>
              <a href={`/payment?plan=${p.id}`} style={p.popular ? s.btnPrimary : s.btn}>
                Buy now
              </a>
            </div>
          ))}
        </div>
      </section>

      <section style={s.section}>
        <h2 style={s.h2}>How it works</h2>
        <div style={s.steps}>
          {STEPS.map((st) => (
            <div key={st.n} style={s.step}>
              <div style={s.stepNum}>{st.n}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{st.title}</div>
              <div style={{ color: '#555', fontSize: 14 }}>{st.text}</div>
            </div>
          ))}
        </div>
      </section>

      <footer style={s.footer}>
        © {new Date().getFullYear()} TrendsBits AI · Payment: bKash / Nagad / Rocket 01878976371
      </footer>
    </main>
  );
}

const s = {
  page: { fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', background: '#f8fafc', color: '#0f172a', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1100, margin: '0 auto', padding: '20px 16px' },
  logo: { fontWeight: 800, fontSize: 22 },
  headerLink: { color: '#0f172a', textDecoration: 'none', fontWeight: 600 },
  hero: { textAlign: 'center', maxWidth: 760, margin: '0 auto', padding: '48px 16px 32px' },
  badge: { display: 'inline-block', background: '#e0ecff', color: '#1d4ed8', borderRadius: 999, padding: '6px 14px', fontSize: 14, fontWeight: 600, marginBottom: 20 },
  h1: { fontSize: 'clamp(30px, 6vw, 48px)', lineHeight: 1.15, fontWeight: 800, margin: '0 0 16px' },
  lead: { fontSize: 18, color: '#475569', margin: '0 0 28px' },
  cta: { display: 'inline-block', background: '#2563eb', color: '#fff', padding: '14px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' },
  section: { maxWidth: 1100, margin: '0 auto', padding: '40px 16px' },
  h2: { fontSize: 28, fontWeight: 800, textAlign: 'center', margin: '0 0 8px' },
  sub: { textAlign: 'center', color: '#64748b', margin: '0 0 28px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 },
  card: { position: 'relative', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column' },
  cardPopular: { border: '2px solid #2563eb', boxShadow: '0 8px 30px rgba(37,99,235,0.15)' },
  popular: { position: 'absolute', top: -12, left: 24, background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999 },
  planName: { fontWeight: 700, fontSize: 18, marginBottom: 8 },
  price: { fontSize: 34, fontWeight: 800, marginBottom: 16 },
  per: { fontSize: 15, fontWeight: 500, color: '#64748b' },
  list: { listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 },
  li: { padding: '6px 0', color: '#334155' },
  btn: { display: 'block', textAlign: 'center', border: '2px solid #2563eb', color: '#2563eb', padding: '12px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' },
  btnPrimary: { display: 'block', textAlign: 'center', background: '#2563eb', color: '#fff', padding: '12px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' },
  steps: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 24 },
  step: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 },
  stepNum: { width: 32, height: 32, borderRadius: 999, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: 12 },
  footer: { textAlign: 'center', color: '#64748b', fontSize: 14, padding: '32px 16px 40px' },
};
