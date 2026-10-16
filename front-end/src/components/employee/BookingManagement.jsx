import { Input, Select, ValidatedForm, SubmitButton } from '../common/FormControls';
import { CardsSkeleton, TableSkeletonRows, LoadingError } from '../common/SkeletonLoader';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import PortalModal from '../common/PortalModal';
import { money, parseMoney } from '../../utils/formatters';
import { usePolling } from '../../hooks/usePolling';
import { authFetch, readError } from '../../utils/api';
import { todayISO } from '../../utils/dateUtils';
import ConfirmModal from '../common/ConfirmModal';
import RecordPaymentModal from './RecordPaymentModal';
import { exportToCSV } from '../../utils/exportUtils';

// ─── Accent colour adapts to dark/light mode
// Dark mode: amber/gold (matches the overall dark theme warmth)
// Light mode: gold/amber (matches the sidebar logo and active menu items)
const getAccent = (dark) => dark
  ? { accent: '#f59e0b', accentLight: 'rgba(245,158,11,0.12)', accentDark: '#d97706' }
  : { accent: '#b8860b', accentLight: 'rgba(184,134,11,0.12)', accentDark: '#d97706' };

const parseAmount = parseMoney;

function BookingManagement({ employee }) {
  // Dark mode for the front-desk portal is signalled by the 'app-dark' class
  // that EmployeePortal toggles on <body>. Reading that (instead of the admin
  // localStorage key this used to read) keeps this view's accent in step with
  // the rest of the front-desk UI, including same-tab theme toggles.
  const [isDark, setIsDark] = useState(
    () => document.body.classList.contains('app-dark')
  );

  useEffect(() => {
    const sync = () => setIsDark(document.body.classList.contains('app-dark'));
    // Observe body class changes so a theme toggle updates the accent instantly.
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    sync();
    return () => observer.disconnect();
  }, []);

  const FD = getAccent(isDark);
  const [isLoading, setIsLoading]         = useState(true);
  const [bookings, setBookings]           = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showWalkIn, setShowWalkIn]       = useState(false);
  const [walkInSaving, setWalkInSaving] = useState(false);
  const [walkInError, setWalkInError] = useState('');
  const walkInLock = useRef(false);
  const initialLoad = useRef(true);
  const [processingId, setProcessingId]   = useState(null);
  const [error, setError]                 = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'checkin'|'checkout', booking }
  const [payingBooking, setPayingBooking] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery]     = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  // Default the date range to today so opening Booking Management shows
  // today's reservations without having to pick the date manually.
  const [dateFrom, setDateFrom]           = useState(todayISO());
  const [dateTo, setDateTo]               = useState(todayISO());

  // ── FETCH ────────────────────────────────────────
  // `background` = true for polling refreshes: don't flip the loading state,
  // so the table stays on screen instead of flashing "Loading…" every 10s.
  const fetchBookings = async ({ background = false } = {}) => {
    if (!background) setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/bookings');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const normalized = data.map(b => ({
        id:              b.booking_id || b._id,
        guest:           b.guest?.full_name || '',
        email:           b.guest?.email    || '',
        phone:           b.guest?.phone    || '',
        room:            String(b.room_number || ''),
        checkIn:         b.dates?.check_in  || '',
        checkOut:        b.dates?.check_out || '',
        nights:          parseInt(b.dates?.nights) || 0,
        source:          b.source          || '',
        status:          b.status          || '',
        amount:          parseAmount(b.billing?.expected_total),
        balanceDue:      parseAmount(b.billing?.balance_due),
        totalPaid:       parseAmount(b.billing?.total_paid),
        paymentStatus:   parseAmount(b.billing?.balance_due) === 0 ? 'Paid' : 'Balance Due',
        transactions:    b.transactions    || [],
        _id:             b._id,
      }));
      setBookings(normalized);
      setSelectedBooking(current => current ? normalized.find(b => b._id === current._id) || null : null);
    } catch (err) {
      console.error(err);
      setError('Failed to connect to server.');
    } finally {
      setIsLoading(false);
      initialLoad.current = false;
    }
  };

  const invalidDates = Boolean(dateFrom && dateTo && dateTo < dateFrom);
  const filtered = useMemo(() => {
    let r = [...bookings];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      r = r.filter(b => b.guest.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.room.includes(q));
    }
    if (filterStatus !== 'all') r = r.filter(b => b.status === filterStatus);
    if (dateFrom) r = r.filter(b => b.checkIn >= dateFrom);
    if (dateTo)   r = r.filter(b => b.checkIn <= dateTo);
    return invalidDates ? [] : r;
  }, [bookings, searchQuery, filterStatus, dateFrom, dateTo, invalidDates]);

  const handleExportCSV = () => {
    const columns = [
      { header: 'Booking ID', key: 'id' },
      { header: 'Guest Name', key: 'guest' },
      { header: 'Room Number', key: 'room' },
      { header: 'Room Type', key: 'roomType' },
      { header: 'Check-In', key: 'checkIn' },
      { header: 'Check-Out', key: 'checkOut' },
      { header: 'Nights', key: 'nights' },
      { header: 'Status', key: 'status' },
      { header: 'Booking Source', key: 'source' },
      { header: 'Total Amount (PHP)', accessor: b => Number(b.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) },
      { header: 'Paid (PHP)', accessor: b => Number(b.paidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) },
      { header: 'Balance Due (PHP)', accessor: b => Number(b.balanceDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) },
    ];
    const todayStr = new Date().toISOString().slice(0, 10);
    exportToCSV(filtered, columns, `jofiane-reservations-${todayStr}`);
  };

  // One initial request, then silent background refreshes.
  usePolling(() => fetchBookings({ background: !initialLoad.current }), 10000);

  // ── CHECK-IN ─────────────────────────────────────
  // Clicking Check In / Check Out opens a styled confirmation modal; the
  // request runs only after the user confirms (see runConfirmedAction).
  const handleCheckIn = (booking) => setConfirmAction({ type: 'checkin', booking });
  const handleCheckOut = (booking) => setConfirmAction({ type: 'checkout', booking });

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, booking } = confirmAction;
    const isCheckin = type === 'checkin';
    const endpoint = isCheckin ? 'checkin' : 'checkout';
    const nextStatus = isCheckin ? 'Checked In' : 'Checked Out';
    setProcessingId(booking._id);
    try {
      const res = await authFetch(`/api/bookings/${booking._id}/${endpoint}`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setBookings(prev => prev.map(b => b._id === booking._id ? { ...b, status: nextStatus } : b));
      if (selectedBooking?._id === booking._id) setSelectedBooking(prev => ({ ...prev, status: nextStatus }));
      setConfirmAction(null);
    } catch { alert(`${isCheckin ? 'Check-in' : 'Check-out'} failed. Please try again.`); }
    finally { setProcessingId(null); }
  };

  // ── RECORD PAYMENT ───────────────────────────────
  const handleRecordPayment = async ({ amount, payment_method, reference }) => {
    const booking = payingBooking;
    if (!booking) return;
    const res = await authFetch(`/api/bookings/${booking._id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, payment_method, reference }),
    });
    if (!res.ok) throw new Error(await readError(res, 'Failed to record payment.'));
    setPayingBooking(null);
    await fetchBookings();   // refresh so balance/ledger update immediately
  };

  // ── WALK-IN SAVE ─────────────────────────────────
  const handleWalkIn = async (formData) => {
    if (walkInLock.current) return;
    walkInLock.current = true;
    setWalkInSaving(true);
    setWalkInError('');
    try {
      const fmtAmt = (n) => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
      const total = parseFloat(formData.amount) || 0;
      const now = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
      const txns = [];
      // The room cost is a CHARGE (what the guest owes).
      if (total > 0) {
        txns.push({
          txn_id: `TXN-${Date.now()}`,
          type: 'charge',
          datetime: now,
          description: `Room Charge (Rm ${formData.room})`,
          amount: fmtAmt(total),
          payment_method: 'Room Charge',
          payment_details: 'Front Desk',
          status: 'COMPLETED',
        });
      }
      // Any amount collected at walk-in is a PAYMENT against that charge.
      if (total > 0) {
        txns.push({
          txn_id: `TXN-${Date.now() + 1}`,
          type: 'payment',
          datetime: now,
          description: 'Walk-in Payment',
          amount: fmtAmt(total),
          payment_method: formData.paymentMethod || 'Cash',
          payment_details: 'Front Desk',
          status: 'COMPLETED',
        });
      }
      const payload = {
        booking_id:  `BKG-${Date.now()}`,
        room_number:  formData.room,
        source:       'Walk-in',
        status:       'Confirmed',
        dates: { check_in: formData.checkIn, check_out: formData.checkOut, nights: String(formData.nights) },
        guest: { guest_id: String(Date.now()), full_name: formData.guest, email: formData.email || '', phone: formData.phone || '' },
        billing: { expected_total: fmtAmt(total), total_paid: '0.00', balance_due: fmtAmt(total) },
        transactions: txns,
      };
      const res = await authFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      await fetchBookings();
      setShowWalkIn(false);
    } catch { setWalkInError('Failed to save walk-in booking. Your entries have been kept. Please try again.'); }
    finally { walkInLock.current = false; setWalkInSaving(false); }
  };

  // ── HELPERS ──────────────────────────────────────
  const getStatusBadge = (status) => {
    const map = {
      'Confirmed':   { bg: '#dbeafe', color: '#1d4ed8' },
      'Checked In':  { bg: '#d1fae5', color: '#065f46' },
      'Checked Out': { bg: '#f3f4f6', color: '#374151' },
      'Cancelled':   { bg: '#fee2e2', color: '#991b1b' },
      'No Show':     { bg: '#fee2e2', color: '#991b1b' },
    };
    const s = map[status] || { bg: '#f3f4f6', color: '#6b7280' };
    return (
      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
        background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
        {status}
      </span>
    );
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  // Stats
  const confirmedCount  = bookings.filter(b => b.status === 'Confirmed').length;
  const checkedInCount  = bookings.filter(b => b.status === 'Checked In').length;
  const totalRevenue    = bookings.filter(b => b.status !== 'Cancelled').reduce((s, b) => s + b.amount, 0);

  return (
    <section className="admin-tab-content active employee-module booking-module">

      {/* ── PAGE HEADER ── */}
      <div className="page-header employee-page-header" style={{ marginBottom: '24px' }}>
        <div className="left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '700', margin: 0 }}>Booking Management</h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
            Review and action reservations for today's operations.
            {employee?.name && <> · <strong>{employee.name}</strong></>}
          </p>
        </div>
        <div className="right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '9px 16px', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleExportCSV}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export CSV
          </button>
          <button
            className="btn btn-sm"
            style={{ background: FD.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => { setWalkInError(''); setShowWalkIn(true); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Walk-In
          </button>
        </div>
      </div>

      {isLoading ? <CardsSkeleton cards={4} label="Loading reservation summary" /> :
        <dl className="reservation-metrics panel" aria-label="Reservation summary across all dates">
          <div><dt>Total reservations</dt><dd>{bookings.length}</dd><small>Across all dates</small></div>
          <div className="metric-confirmed"><dt>Confirmed</dt><dd>{confirmedCount}</dd><small>Awaiting arrival</small></div>
          <div className="metric-inhouse"><dt>Checked in</dt><dd>{checkedInCount}</dd><small>Currently in house</small></div>
          <div><dt>Total revenue</dt><dd>{money(totalRevenue)}</dd><small>Non-cancelled booking value</small></div>
        </dl>}

      <div className="reservation-toolbar" role="search" aria-label="Reservation filters">
        <label className="reservation-search"><span>Find a reservation</span>
          <div className="search-input-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg>
            <Input type="search" aria-label="Search reservations" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Guest name, booking ID, or room…" /></div>
        </label>
        <label><span>Status</span><Select aria-label="Reservation status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {['Confirmed', 'Checked In', 'Checked Out', 'Cancelled', 'No Show'].map(status => <option key={status}>{status}</option>)}
        </Select></label>
        <div className="reservation-scope"><span>Date scope</span>
          <div className="segmented-control">
            <button type="button" aria-pressed={dateFrom === todayISO() && dateTo === todayISO()} onClick={() => { setDateFrom(todayISO()); setDateTo(todayISO()); }}>Today</button>
            <button type="button" aria-pressed={!dateFrom && !dateTo} onClick={() => { setDateFrom(''); setDateTo(''); }}>All dates</button>
          </div>
        </div>
        <label><span>Check-in from</span><Input type="date" aria-label="Check-in from" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></label>
        <label><span>Check-in to</span><Input type="date" aria-label="Check-in to" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} /></label>
        {(searchQuery || filterStatus !== 'all' || ((dateFrom || dateTo) && (dateFrom !== todayISO() || dateTo !== todayISO()))) &&
          <button className="btn reservation-reset" onClick={() => { setSearchQuery(''); setFilterStatus('all'); setDateFrom(''); setDateTo(''); }}>Clear filters</button>}
      </div>
      {error && !isLoading && <LoadingError message={bookings.length ? 'Refresh failed. The last loaded reservations are shown below.' : error} onRetry={() => fetchBookings()} />}

      {/* ── MAIN TABLE ── */}
      <div className="panel reservation-panel">
        <div className="panel-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <h3 style={{ margin: 0 }}>Reservations <span className="record-count">{isLoading ? '—' : filtered.length}</span></h3>
          {/* Teal top-border accent strip */}
          <div style={{ height: '3px', background: FD.accent, borderRadius: '2px', width: '48px' }} />
        </div>

        <div className="table-wrap ledger-table-scroll" role="region" aria-label="Reservations table" tabIndex={0}>
            <table className="reservation-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Nights</th>
                  <th>Source</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? <TableSkeletonRows columns={11} label="Loading reservations" /> : filtered.length === 0 ?
                  <tr><td colSpan={11}><div className="ledger-empty"><strong>{invalidDates ? 'Check your date range' : error ? 'Reservations are unavailable' : 'No matching reservations'}</strong><span>{invalidDates ? 'The end date must be on or after the start date.' : 'Try another guest, status, or date range.'}</span></div></td></tr> :
                  filtered.map(b => (
                  <tr
                    key={b._id}
                    className={`table-row-hover${selectedBooking?._id === b._id ? ' selected-booking-row' : ''}`}
                    onClick={() => setSelectedBooking(b)}
                    style={{
                      cursor: 'pointer',
                      background: selectedBooking?._id === b._id ? FD.accentLight : 'transparent',
                    }}
                  >
                    <td><button type="button" className="table-reference" aria-expanded={selectedBooking?._id === b._id} aria-controls="booking-details" onClick={e => { e.stopPropagation(); setSelectedBooking(current => current?._id === b._id ? null : b); }}>{b.id}</button></td>
                    <td>
                      <span className="guest-name">{b.guest}</span>
                      {b.phone && <span className="guest-sub">{b.phone}</span>}
                    </td>
                    <td><span className="std-text">Rm {b.room}</span></td>
                    <td><span className="std-text">{fmtDate(b.checkIn)}</span></td>
                    <td><span className="std-text">{fmtDate(b.checkOut)}</span></td>
                    <td><span className="std-text">{b.nights}</span></td>
                    <td><span className="std-text">{b.source}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>{money(b.amount)}</td>
                    <td>
                      {b.balanceDue > 0
                        ? <span className="balance-due">{money(b.balanceDue)}</span>
                        : <span className="balance-paid">Paid</span>
                      }
                    </td>
                    <td>{getStatusBadge(b.status)}</td>
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      {processingId === b._id ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>processing…</span>
                      ) : b.status === 'Confirmed' ? (
                        <button
                          className="btn btn-xs"
                          style={{ background: FD.accent, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', padding: '4px 12px' }}
                          onClick={() => handleCheckIn(b)}
                        >
                          Check In
                        </button>
                      ) : b.status === 'Checked In' ? (
                        <button
                          className="btn btn-xs"
                          style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', padding: '4px 12px' }}
                          onClick={() => handleCheckOut(b)}
                        >
                          Check Out
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>

      {/* ── BOOKING DETAIL DRAWER ── */}
      {selectedBooking && (
        <div id="booking-details" className="panel booking-details-panel" style={{ marginTop: '16px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>{selectedBooking.id}</h3>
              {getStatusBadge(selectedBooking.status)}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {selectedBooking.balanceDue > 0 && selectedBooking.status !== 'Cancelled' && (
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--gold, #c5a059)', color: '#fff', border: 'none', fontWeight: '700' }}
                  onClick={() => setPayingBooking(selectedBooking)}
                >
                  Record Payment
                </button>
              )}
              {selectedBooking.status === 'Confirmed' && (
                <button
                  className="btn btn-sm"
                  style={{ background: FD.accent, color: '#fff', border: 'none', fontWeight: '700' }}
                  disabled={processingId === selectedBooking._id}
                  onClick={() => handleCheckIn(selectedBooking)}
                >
                  {processingId === selectedBooking._id ? 'Processing…' : 'Check In Guest'}
                </button>
              )}
              {selectedBooking.status === 'Checked In' && (
                <button
                  className="btn btn-sm"
                  style={{ background: '#dc2626', color: '#fff', border: 'none', fontWeight: '700' }}
                  disabled={processingId === selectedBooking._id}
                  onClick={() => handleCheckOut(selectedBooking)}
                >
                  {processingId === selectedBooking._id ? 'Processing…' : 'Check Out Guest'}
                </button>
              )}
            </div>
          </div>

          <div className="booking-fact-grid">
            {[
              ['Guest',        selectedBooking.guest],
              ['Email',        selectedBooking.email || '—'],
              ['Phone',        selectedBooking.phone || '—'],
              ['Room',         `Room ${selectedBooking.room}`],
              ['Check-In',     fmtDate(selectedBooking.checkIn)],
              ['Check-Out',    fmtDate(selectedBooking.checkOut)],
              ['Nights',       selectedBooking.nights],
              ['Source',       selectedBooking.source],
              ['Total Amount', `₱${selectedBooking.amount.toLocaleString()}`],
              ['Total Paid',   `₱${selectedBooking.totalPaid.toLocaleString()}`],
              ['Balance Due',  selectedBooking.balanceDue > 0 ? `₱${selectedBooking.balanceDue.toLocaleString()}` : 'None'],
              ['Payment',      selectedBooking.paymentStatus],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Transaction ledger */}
          {selectedBooking.transactions.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Transaction Ledger ({selectedBooking.transactions.length})
              </div>
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
                {selectedBooking.transactions.map((t, i) => {
                  const amt = parseAmount(t.amount);
                  const voided = t.status === 'VOIDED';
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px',
                      borderBottom: i < selectedBooking.transactions.length - 1 ? '1px solid var(--border-light)' : 'none',
                      opacity: voided ? 0.45 : 1,
                      background: voided ? 'var(--bg-input)' : 'transparent',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', textDecoration: voided ? 'line-through' : 'none' }}>{t.description}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {t.txn_id} · {t.payment_method}{t.payment_details ? ` · ${t.payment_details}` : ''} · {t.datetime}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: amt < 0 ? '#dc2626' : 'var(--text-primary)' }}>
                          {amt < 0 ? '−' : ''}₱{Math.abs(amt).toLocaleString()}
                        </div>
                        <span style={{
                          fontSize: '10px', padding: '2px 7px', borderRadius: '10px', fontWeight: '600',
                          background: t.status === 'COMPLETED' ? '#d1fae5' : t.status === 'VOIDED' ? '#f3f4f6' : '#fef3c7',
                          color:      t.status === 'COMPLETED' ? '#065f46' : t.status === 'VOIDED' ? '#6b7280' : '#92400e',
                        }}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WALK-IN MODAL ── */}
      {showWalkIn && <WalkInModal onClose={() => { if (!walkInSaving) setShowWalkIn(false); }}
        onSave={handleWalkIn} accentColor={FD.accent} busy={walkInSaving} error={walkInError} />}

      {/* ── RECORD PAYMENT ── */}
      {payingBooking && (
        <RecordPaymentModal
          booking={{
            _id: payingBooking._id,
            guest: payingBooking.guest,
            room: payingBooking.room,
            balance: payingBooking.balanceDue,
          }}
          onSubmit={handleRecordPayment}
          onClose={() => setPayingBooking(null)}
        />
      )}

      {/* ── CHECK-IN / CHECK-OUT CONFIRMATION ── */}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'checkin' ? 'Confirm Check-In' : 'Confirm Check-Out'}
          message={
            confirmAction.type === 'checkin'
              ? <>Check in <strong>{confirmAction.booking.guest}</strong> to Room <strong>{confirmAction.booking.room}</strong>?</>
              : (() => {
                  const bal = confirmAction.booking.balanceDue || 0;
                  return (
                    <>
                      Check out <strong>{confirmAction.booking.guest}</strong> from Room <strong>{confirmAction.booking.room}</strong>?
                      {bal > 0 && (
                        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', fontSize: '13px', color: '#854d0e' }}>
                          ⚠️ <strong>Outstanding balance: ₱{Number(bal).toLocaleString()}</strong><br />
                          <span style={{ fontWeight: 400 }}>The guest has an unsettled balance. You can still check them out, but consider collecting payment first.</span>
                        </div>
                      )}
                    </>
                  );
                })()
          }
          confirmLabel={confirmAction.type === 'checkin' ? 'Check In' : 'Check Out'}
          tone={confirmAction.type === 'checkin' ? 'primary' : 'danger'}
          busy={processingId === confirmAction.booking._id}
          onConfirm={runConfirmedAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </section>
  );
}

/* ================================================================
   WALK-IN MODAL — streamlined for speed at the front desk
   ================================================================ */
function WalkInModal({ onClose, onSave, accentColor, busy, error }) {
  const calcNights = (ci, co) => {
    if (!ci || !co) return 0;
    const diff = (new Date(co) - new Date(ci)) / 86400000;
    return diff > 0 ? diff : 0;
  };

  const today = todayISO();
  const [form, setForm] = useState({
    guest: '', phone: '', email: '',
    room: '', checkIn: today, checkOut: '', nights: 0,
    amount: '', paymentMethod: 'Cash',
  });

  const set = (k) => (e) => {
    const updated = { ...form, [k]: e.target.value };
    if (k === 'checkIn' || k === 'checkOut') updated.nights = calcNights(updated.checkIn, updated.checkOut);
    setForm(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.guest.trim())   { alert('Guest name is required.'); return; }
    if (!form.room.trim())    { alert('Room number is required.'); return; }
    if (!form.checkIn)        { alert('Check-in date is required.'); return; }
    if (!form.checkOut)       { alert('Check-out date is required.'); return; }
    if (form.nights <= 0)     { alert('Check-out must be after check-in.'); return; }
    if (!busy) onSave({ ...form, nights: String(form.nights) });
  };

  return (
    <PortalModal maxWidth={560} className="finance-modal" title="New Walk-In" onClose={onClose} busy={busy}>
        <button type="button" className="modal-close" aria-label="Close dialog" disabled={busy} onClick={onClose}>&times;</button>

        {/* Teal header strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '4px', height: '28px', borderRadius: '2px', background: accentColor }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>New Walk-In</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Quick registration for walk-in guests</p>
          </div>
        </div>

        <ValidatedForm onSubmit={handleSubmit}>
          <fieldset className="dialog-fields" disabled={busy}>

          {/* Guest Info */}
          <div style={{ fontSize: '10px', fontWeight: '700', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Guest</div>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <Input type="text" required value={form.guest} onChange={set('guest')} placeholder="e.g. Juan Dela Cruz" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <Input type="tel" value={form.phone} onChange={set('phone')} placeholder="+63 9xx xxx xxxx" />
            </div>
          </div>

          {/* Stay */}
          <div style={{ fontSize: '10px', fontWeight: '700', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Stay</div>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label>Room # <span className="required">*</span></label>
              <Input type="text" required value={form.room} onChange={set('room')} placeholder="e.g. 304" />
            </div>
            <div className="form-group">
              <label>Nights</label>
              <Input type="number" value={form.nights} readOnly style={{ background: 'var(--bg-body)', cursor: 'not-allowed' }} />
            </div>
          </div>
          <div className="form-grid" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Check-In <span className="required">*</span></label>
              <Input type="date" required value={form.checkIn} onChange={set('checkIn')} />
            </div>
            <div className="form-group">
              <label>Check-Out <span className="required">*</span></label>
              <Input type="date" required min={form.checkIn || undefined} validation={value => value && value <= form.checkIn ? 'Check-out must be after check-in.' : ''} value={form.checkOut} onChange={set('checkOut')} />
            </div>
          </div>

          {/* Payment */}
          <div style={{ fontSize: '10px', fontWeight: '700', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Payment</div>
          <div className="form-grid" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Total Amount (₱)</label>
              <Input type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label>Method</label>
              <Select value={form.paymentMethod} onChange={set('paymentMethod')}>
                <option>Cash</option>
                <option>Credit Card</option>
                <option>GCash</option>
                <option>Maya</option>
                <option>Bank Transfer</option>
              </Select>
            </div>
          </div>

          </fieldset>
          {error && <p role="alert" className="form-submit-error">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="btn" disabled={busy} onClick={onClose}>Cancel</button>
            <SubmitButton disabled={busy} className="btn btn-gold">{busy ? 'Registering…' : 'Register Walk-In'}</SubmitButton>
          </div>
        </ValidatedForm>
    </PortalModal>
  );
}

export default BookingManagement;
