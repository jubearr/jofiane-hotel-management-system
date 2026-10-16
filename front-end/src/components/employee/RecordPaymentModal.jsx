import React, { useState } from 'react';
import PortalModal from '../common/PortalModal';

/**
 * RecordPaymentModal — collect a payment against a booking's outstanding
 * balance. Amount defaults to the full balance; partial payments allowed
 * (0 < amount <= balance). Calls onSubmit({ amount, payment_method, reference }).
 */
const METHODS = ['Cash', 'Credit Card', 'Debit Card', 'E-Wallet', 'Bank Transfer'];

export default function RecordPaymentModal({ booking, onSubmit, onClose }) {
  const balance = Number(booking?.balance || 0);
  const [amount, setAmount] = useState(balance > 0 ? String(balance) : '');
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const peso = (n) => `₱${Number(n || 0).toLocaleString()}`;

  const submit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!(amt > 0)) { setError('Enter an amount greater than zero.'); return; }
    if (amt > balance + 0.005) { setError(`Amount cannot exceed the balance of ${peso(balance)}.`); return; }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ amount: amt, payment_method: method, reference: reference.trim() });
    } catch (err) {
      setError(err?.message || 'Failed to record payment. Please try again.');
      setBusy(false);
    }
  };

  const remaining = Math.max(0, balance - (parseFloat(amount) || 0));

  return (
    <PortalModal maxWidth={420}>
      <form onSubmit={submit}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>Record Payment</h3>
          <button type="button" aria-label="Close" onClick={onClose} disabled={busy}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #6b7280)', fontSize: '20px', lineHeight: 1, padding: '4px' }}>×</button>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'var(--text-muted, #6b7280)' }}>
          {booking?.guest || 'Guest'}{booking?.room ? ` · Room ${booking.room}` : ''}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--employee-surface-muted, #f9fafb)', border: '1px solid var(--border-light, #eaeaea)', borderRadius: '10px', marginBottom: '18px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted, #6b7280)' }}>Outstanding Balance</span>
          <strong style={{ fontSize: '14px', color: balance > 0 ? '#dc2626' : '#059669' }}>{peso(balance)}</strong>
        </div>

        <label style={{ display: 'block', marginBottom: '14px' }}>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted, #9ca3af)', marginBottom: '5px' }}>Amount to Pay</span>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 12px' }}>
            <span style={{ color: 'var(--text-muted, #6b7280)', fontWeight: 700 }}>₱</span>
            <input type="number" min="0" step="0.01" value={amount} autoFocus
              onChange={(e) => setAmount(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 8px', fontSize: '15px', fontWeight: 600, background: 'transparent', color: 'var(--text-primary, #111827)' }} />
            <button type="button" onClick={() => setAmount(String(balance))}
              style={{ background: 'transparent', border: 'none', color: 'var(--gold-dark, #b8860b)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Full</button>
          </div>
        </label>

        <label style={{ display: 'block', marginBottom: '14px' }}>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted, #9ca3af)', marginBottom: '5px' }}>Payment Method</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', background: '#fff', color: 'var(--text-primary, #111827)' }}>
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: '16px' }}>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted, #9ca3af)', marginBottom: '5px' }}>Reference <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></span>
          <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Receipt / transaction no."
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
        </label>

        <div style={{ fontSize: '12px', color: 'var(--text-muted, #6b7280)', marginBottom: '16px' }}>
          Remaining after payment: <strong style={{ color: remaining > 0 ? '#dc2626' : '#059669' }}>{peso(remaining)}</strong>
        </div>

        {error && <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn" onClick={onClose} disabled={busy}
            style={{ padding: '9px 18px', borderRadius: '8px', fontWeight: 600 }}>Cancel</button>
          <button type="submit" className="btn" disabled={busy}
            style={{ padding: '9px 18px', borderRadius: '8px', fontWeight: 700, border: 'none', background: 'var(--gold, #c5a059)', color: '#fff' }}>
            {busy ? 'Recording…' : 'Record Payment'}
          </button>
        </div>
      </form>
    </PortalModal>
  );
}
