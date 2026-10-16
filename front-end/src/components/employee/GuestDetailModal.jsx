import React, { useEffect, useState } from 'react';
import PortalModal from '../common/PortalModal';
import { CardsSkeleton } from '../common/SkeletonLoader';
import { API_BASE } from '../../utils/api';

/**
 * GuestDetailModal — a read-only detail/folio pop-up for a single booking,
 * shared by Arrivals ("View Details"), Departures ("View Folio") and RoomRack
 * ("View booking"). It renders as a centered modal (via PortalModal) that opens
 * when the row/action is clicked.
 *
 * It renders the summary from the passed `booking` object, and — when that
 * object carries a Mongo `_id` — fetches the full booking to show the itemized
 * transaction ledger (folio).
 *
 * Props:
 *  - booking : the normalized row (arrival/departure/stay) or null
 *  - title   : heading (e.g. "Guest Details" / "Guest Folio")
 *  - onClose : called when the user dismisses the modal
 */
export default function GuestDetailModal({ booking, title = 'Guest Details', onClose }) {
  const [txns, setTxns] = useState(null);            // null = not loaded, [] = none
  const [txnState, setTxnState] = useState('idle');  // idle | loading | error | done

  const bookingObjectId = booking?._id;

  useEffect(() => {
    if (!bookingObjectId) { setTxnState('done'); setTxns([]); return; }
    let cancelled = false;
    setTxnState('loading');
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/bookings/${bookingObjectId}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setTxns(Array.isArray(data.transactions) ? data.transactions : []);
        setTxnState('done');
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load folio:', err);
        setTxnState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [bookingObjectId]);

  if (!booking) return null;

  const peso = (n) => `₱${Number(n || 0).toLocaleString()}`;
  const parseAmt = (str) => parseFloat(String(str || '0').replace(/,/g, '')) || 0;
  const balance = Number(booking.balance || 0);

  const rows = [
    { label: 'Booking ID', value: booking.bookingId || booking.id || '—' },
    { label: 'Room', value: booking.roomNumber ? `Rm ${booking.roomNumber}` : 'Unassigned' },
    { label: 'Room Type', value: booking.roomType || '—' },
    {
      label: 'Occupancy',
      value: `${booking.adults || 0} Adult${(booking.adults || 0) === 1 ? '' : 's'}` +
        (booking.children ? ` · ${booking.children} Child${booking.children === 1 ? '' : 'ren'}` : ''),
    },
    {
      label: 'Nights',
      value: booking.totalNights || booking.nights
        ? String(booking.totalNights || booking.nights)
        : '—',
    },
  ];

  return (
    <PortalModal maxWidth={480} title={title} onClose={onClose}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>{title}</h3>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #6b7280)', fontSize: '20px', lineHeight: 1, padding: '4px' }}
        >
          ×
        </button>
      </div>

      {/* Guest name + status */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>
          {booking.guestName || 'Guest'}
        </div>
        {booking.status && (
          <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '3px 10px', borderRadius: '20px', background: '#f3f4f6', color: '#374151' }}>
            {booking.status}
          </span>
        )}
      </div>

      {/* Detail rows */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: '18px' }}>
        {rows.map((r) => (
          <div key={r.label}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted, #9ca3af)', marginBottom: '3px' }}>{r.label}</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary, #1f2937)' }}>{r.value}</div>
          </div>
        ))}
      </div>

      {/* Folio — itemized transactions */}
      <div style={{ borderTop: '1px solid var(--border-light, #eaeaea)', paddingTop: '14px', marginBottom: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted, #9ca3af)', marginBottom: '10px' }}>Folio</div>

        {txnState === 'loading' && (
          <CardsSkeleton cards={1} label="Loading guest transactions" />
        )}

        {txnState === 'error' && (
          <div style={{ fontSize: '13px', color: '#dc2626', padding: '8px 0' }}>Couldn't load the folio. The summary below still applies.</div>
        )}

        {txnState === 'done' && txns && txns.length === 0 && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted, #6b7280)', padding: '8px 0' }}>No transactions recorded yet.</div>
        )}

        {txnState === 'done' && txns && txns.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            {txns.map((t, i) => {
              const amt = parseAmt(t.amount);
              const voided = (t.status || '').toUpperCase() === 'VOIDED';
              return (
                <div key={t.txn_id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', padding: '6px 0', borderBottom: '1px solid var(--border-light, #f3f4f6)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary, #374151)', textDecoration: voided ? 'line-through' : 'none' }}>
                      {t.description || 'Transaction'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #9ca3af)' }}>
                      {t.datetime || ''}{t.payment_method ? ` · ${t.payment_method}` : ''}{voided ? ' · VOIDED' : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', color: amt < 0 ? '#dc2626' : 'var(--text-primary, #111827)', textDecoration: voided ? 'line-through' : 'none' }}>
                    {amt < 0 ? `(${peso(Math.abs(amt))})` : peso(amt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {booking.deposit != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: 'var(--text-primary, #374151)' }}>
            <span>Total Paid</span>
            <span style={{ fontWeight: 600 }}>{peso(booking.deposit)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700 }}>
          <span style={{ color: 'var(--text-primary, #111827)' }}>Balance Due</span>
          <span style={{ color: balance > 0 ? '#dc2626' : '#059669' }}>
            {balance > 0 ? `${peso(balance)} Due` : 'Settled'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn"
          onClick={onClose}
          style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: 600 }}
        >
          Close
        </button>
      </div>
    </PortalModal>
  );
}
