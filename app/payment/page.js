'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const PLANS = {
  single_standard: { name: 'Single Standard', price: 700, devices: 1, tools: '11 GPT & Claude models' },
  single_all: { name: 'Single All Tools', price: 800, devices: 1, tools: '30 top AI models' },
  dual_standard: { name: 'Dual Standard', price: 1000, devices: 2, tools: '11 GPT & Claude models' },
  dual_all: { name: 'Dual All Tools', price: 1100, devices: 2, tools: '30 top AI models' },
};

const PAYMENT_METHODS = [
  { id: 'bkash', name: 'bKash', number: '01878976371', color: '#E2136E', type: 'Personal' },
  { id: 'nagad', name: 'Nagad', number: '01878976371', color: '#F05A28', type: 'Personal' },
  { id: 'rocket', name: 'Rocket', number: '01878976371', color: '#8B2FC9', type: 'Personal' },
];

function PaymentForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan') || 'single_standard';
  const plan = PLANS[planId] || PLANS.single_standard;
  const [selectedMethod, setSelectedMethod] = useState('bkash');
  const [txnId, setTxnId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);

useEffect(() => {
if (!localStorage.getItem('tb_token')) router.replace('/login?next=' + encodeURIComponent('/payment?plan=' + planId));
}, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!txnId.trim()) return setError('Please enter your Transaction ID');
    if (!senderNumber.trim()) return setError('Please enter your mobile number');
    setLoading(true);
    try {
      const res = await fetch('/api/payment/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('tb_token') || '') },
        body: JSON.stringify({ plan: planId, amount: plan.price, paymentMethod: selectedMethod, transactionId: txnId.trim(), senderNumber: senderNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div style={styles.container}><div style={styles.card}>
      <div style={{ fontSize: 64, textAlign: 'center' }}>OK</div>
      <h2 style={{ textAlign: 'center', color: '#16a34a' }}>Payment Submitted!</h2>
      <p style={{ textAlign: 'center', color: '#555' }}>Your payment is under review. Account activated within <strong>1-2 hours</strong>. After activation, log in again to open your dashboard.</p>
      <button onClick={() => router.push('/')} style={styles.btnPrimary}>Go to Home</button>
    </div></div>
  );

  return (
    <div style={styles.container}><div style={styles.card}>
      <h1 style={styles.title}>Complete Payment</h1>
      <div style={styles.planBox}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{plan.name}</div>
        <div style={{ color: '#555', fontSize: 14 }}>{plan.tools} - {plan.devices} Device(s) - 30 Days</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb' }}>BDT {plan.price}</div>
      </div>
      <div style={styles.stepLabel}>Step 1: Select Payment Method</div>
      <div style={styles.methodGrid}>
        {PAYMENT_METHODS.map(m => (
          <button key={m.id} onClick={() => setSelectedMethod(m.id)}
            style={{ ...styles.methodBtn, borderColor: selectedMethod === m.id ? m.color : '#ddd' }}>
            <span style={{ fontWeight: 700, color: m.color }}>{m.name}</span>
          </button>
        ))}
      </div>
      <div style={styles.stepLabel}>Step 2: Send Money</div>
      <div style={{ ...styles.sendBox, borderColor: method.color }}>
        <p>Send <strong>BDT {plan.price}</strong> to {method.name}: <strong>{method.number}</strong></p>
        <p style={{ color: '#888', fontSize: 13 }}>Use "Send Money" in {method.name} app</p>
      </div>
      <div style={styles.stepLabel}>Step 3: Submit Transaction ID</div>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Transaction ID" value={txnId} onChange={e => setTxnId(e.target.value)} style={styles.input} />
        <input type="text" placeholder="Your mobile number (01XXXXXXXXX)" value={senderNumber} onChange={e => setSenderNumber(e.target.value)} style={styles.input} />
        {error && <div style={styles.error}>{error}</div>}
        <button type="submit" disabled={loading} style={styles.btnPrimary}>{loading ? 'Submitting...' : 'Submit Payment'}</button>
      </form>
    </div></div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentForm />
    </Suspense>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { background: '#fff', borderRadius: 16, padding: 32, maxWidth: 480, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { textAlign: 'center', fontSize: 24, fontWeight: 800, marginBottom: 24 },
  planBox: { background: '#f0f7ff', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid #bfdbfe' },
  stepLabel: { fontWeight: 700, color: '#374151', marginBottom: 12, marginTop: 20 },
  methodGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 8 },
  methodBtn: { border: '2px solid', borderRadius: 10, padding: '12px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  sendBox: { border: '2px solid', borderRadius: 12, padding: 16, marginBottom: 8 },
  input: { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, marginBottom: 12, boxSizing: 'border-box' },
  btnPrimary: { width: '100%', padding: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  error: { color: '#dc2626', fontSize: 14, marginBottom: 8, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 },
};
