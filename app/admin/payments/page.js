'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/payments', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setPayments(data.payments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(paymentId, action) {
    setActionLoading(paymentId + action);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ paymentId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await fetchPayments();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = payments.filter(p => filter === 'all' || p.status === filter);

  const planLabel = (plan) => {
    const labels = {
      single_standard: 'Single Standard',
      single_all: 'Single All Tools',
      dual_standard: 'Dual Standard',
      dual_all: 'Dual All Tools',
    };
    return labels[plan] || plan;
  };

  const methodColor = (method) => {
    const colors = { bkash: '#E2136E', nagad: '#F05A28', rocket: '#8B2FC9' };
    return colors[method] || '#666';
  };

  const statusBadge = (status) => {
    const styles = {
      pending: { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' },
      approved: { background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' },
      rejected: { background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' },
    };
    return styles[status] || {};
  };

  if (loading) return (
    <div style={s.page}>
      <div style={s.container}>
        <p style={{ textAlign: 'center', color: '#666', padding: 40 }}>Loading payments...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          Error: {error}
        </div>
        <button onClick={fetchPayments} style={s.btnPrimary}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Payment Requests</h1>
            <p style={{ color: '#6B7280', marginTop: 4, fontSize: 14 }}>
              {payments.filter(p => p.status === 'pending').length} pending review
            </p>
          </div>
          <button onClick={fetchPayments} style={s.btnSecondary}>Refresh</button>
        </div>

        {/* Filter Tabs */}
        <div style={s.tabs}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...s.tab, ...(filter === f ? s.tabActive : {}) }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span style={s.tabCount}>{payments.filter(p => f === 'all' || p.status === f).length}</span>
            </button>
          ))}
        </div>

        {/* Payments List */}
        {filtered.length === 0 ? (
          <div style={s.empty}>No {filter} payments</div>
        ) : (
          <div style={s.list}>
            {filtered.map(p => (
              <div key={p.id} style={s.card}>
                <div style={s.cardTop}>
                  <div>
                    <div style={s.planName}>{planLabel(p.plan)}</div>
                    <div style={s.email}>{p.users?.email || 'Guest (no account)'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={s.amount}>BDT {p.amount}</div>
                    <span style={{ ...s.badge, ...statusBadge(p.status) }}>{p.status}</span>
                  </div>
                </div>

                <div style={s.details}>
                  <div style={s.detailItem}>
                    <span style={s.label}>Method</span>
                    <span style={{ ...s.value, color: methodColor(p.payment_method), fontWeight: 700 }}>
                      {p.payment_method?.toUpperCase()}
                    </span>
                  </div>
                  <div style={s.detailItem}>
                    <span style={s.label}>Sender Number</span>
                    <span style={s.value}>{p.sender_number}</span>
                  </div>
                  <div style={s.detailItem}>
                    <span style={s.label}>Transaction ID</span>
                    <span style={{ ...s.value, fontFamily: 'monospace', letterSpacing: 1 }}>{p.transaction_id}</span>
                  </div>
                  <div style={s.detailItem}>
                    <span style={s.label}>Submitted</span>
                    <span style={s.value}>{new Date(p.created_at).toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}</span>
                  </div>
                </div>

                {p.status === 'pending' && (
                  <div style={s.actions}>
                    <button
                      onClick={() => handleAction(p.id, 'approve')}
                      disabled={actionLoading === p.id + 'approve'}
                      style={s.btnApprove}>
                      {actionLoading === p.id + 'approve' ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(p.id, 'reject')}
                      disabled={actionLoading === p.id + 'reject'}
                      style={s.btnReject}>
                      {actionLoading === p.id + 'reject' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#F3F4F6', padding: 24 },
  container: { maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tab: { padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 },
  tabActive: { background: '#2563EB', color: '#fff', border: '1px solid #2563EB' },
  tabCount: { background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: '1px 7px', fontSize: 12 },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  planName: { fontWeight: 700, fontSize: 17, color: '#111827' },
  email: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  amount: { fontWeight: 800, fontSize: 20, color: '#2563EB' },
  badge: { fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginTop: 4 },
  details: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, background: '#F9FAFB', borderRadius: 8, padding: 14 },
  detailItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  label: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 14, color: '#374151', fontWeight: 500 },
  actions: { display: 'flex', gap: 10 },
  btnApprove: { flex: 1, padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  btnReject: { flex: 1, padding: '10px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  btnPrimary: { padding: '10px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
  btnSecondary: { padding: '8px 16px', background: '#fff', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  empty: { textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 16, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' },
};
