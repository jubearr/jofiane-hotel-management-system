import React, { useState, useEffect, useRef } from 'react';
import { usePolling } from '../../../hooks/usePolling';
import { authFetch } from '../../../utils/api';
import { Input, Select, Textarea, ValidatedForm, SubmitButton } from '../../common/FormControls';
import { PageSkeleton, CardsSkeleton } from '../../common/SkeletonLoader';
import { createThemedPortal as createPortal } from '../../common/ThemePortal';
import { exportToCSV } from '../../../utils/exportUtils';

function AllBookings() {
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterRoomType, setFilterRoomType] = useState('all');

  useEffect(() => { applyFilters(); }, [bookings, searchQuery, filterStatus, filterSource, filterRoomType]);

  const firstLoad = useRef(true);

  const fetchBookings = async () => {
    // Only show the full-page skeleton on the first load; polls refresh silently.
    if (firstLoad.current) setIsLoading(true);
    try {
      const res = await authFetch('/api/bookings');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      // Normalize MongoDB field names to match the UI field names
      // Parse "25,500.00" → 25500
      const parseAmount = (str) => parseFloat((str || '0').replace(/,/g, '')) || 0;

      const normalized = data.map(b => ({
        id: b.booking_id || b._id,
        guest: b.guest?.full_name || '',
        email: b.guest?.email || '',
        phone: b.guest?.phone || '',
        roomType: b.room_number || '',   // no room_type field; use room_number
        room: b.room_number || '',
        checkIn: b.dates?.check_in || '',
        checkOut: b.dates?.check_out || '',
        nights: parseInt(b.dates?.nights) || 0,
        source: b.source || '',
        status: b.status || '',
        amount: parseAmount(b.billing?.expected_total),
        specialRequests: '',
        paymentStatus: parseAmount(b.billing?.balance_due) === 0 ? 'Paid' : 'Balance Due',
        _id: b._id,
      }));
      setBookings(normalized);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  usePolling(fetchBookings, 10000);

  const applyFilters = () => {
    let result = [...bookings];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => b.id.toLowerCase().includes(q) || b.guest.toLowerCase().includes(q));
    }
    if (filterStatus !== 'all') result = result.filter(b => b.status === filterStatus);
    if (filterSource !== 'all') result = result.filter(b => b.source === filterSource);
    if (filterRoomType !== 'all') result = result.filter(b => b.roomType === filterRoomType);
    setFilteredBookings(result);
  };

  const handleExport = () => {
    const columns = [
      { header: 'Booking ID', key: 'id' },
      { header: 'Guest Name', key: 'guest' },
      { header: 'Email', key: 'email' },
      { header: 'Phone', key: 'phone' },
      { header: 'Room Number', key: 'room' },
      { header: 'Check-In', key: 'checkIn' },
      { header: 'Check-Out', key: 'checkOut' },
      { header: 'Nights', key: 'nights' },
      { header: 'Source', key: 'source' },
      { header: 'Expected Total', accessor: b => Number(b.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) },
      { header: 'Payment Status', key: 'paymentStatus' },
      { header: 'Reservation Status', key: 'status' },
    ];
    const todayStr = new Date().toISOString().slice(0, 10);
    exportToCSV(filteredBookings, columns, `jofiane-bookings-${todayStr}`);
  };

  const handleCreateBooking = async (bookingData) => {
    try {
      // Build the initial transaction if a payment amount was entered
      const hasPayment = bookingData.amount && parseFloat(bookingData.amount) > 0;
      const paymentStatus = hasPayment
        ? (bookingData.paymentStatus === 'Paid' ? 'Paid' : 'Pending')
        : 'Pending';

      // Format amount as stored in DB: "25,500.00"
      const fmtAmount = (n) =>
        parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Derive payment method label and detail for the transaction
      let txnMethod = bookingData.paymentMethod || 'Cash';
      let txnDetail = '';
      if (bookingData.paymentMethod === 'Card/Online') {
        txnMethod = bookingData.onlinePlatform || 'Card/Online';
        txnDetail = bookingData.cardHolder
          ? `${bookingData.cardHolder}${bookingData.onlineRef ? ` ····${bookingData.onlineRef.slice(-4)}` : ''}`
          : bookingData.onlineRef || '';
      } else if (bookingData.paymentMethod === 'Cash') {
        txnDetail = bookingData.cashReceived
          ? `Cash received: ${fmtAmount(bookingData.cashReceived)}`
          : 'Front Desk';
      }

      // Decide initial transaction status:
      // "Paid" → COMPLETED, "Pending" → PENDING, others → PENDING
      const txnStatus = bookingData.paymentStatus === 'Paid' ? 'COMPLETED' : 'PENDING';

      const initialTransactions = hasPayment
        ? [{
            txn_id: `TXN-${Date.now()}`,
            datetime: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
            description: `Room Charge - ${bookingData.roomType || 'Room'} ${bookingData.room ? `(Rm ${bookingData.room})` : ''}`.trim(),
            amount: fmtAmount(bookingData.amount),
            payment_method: txnMethod,
            payment_details: txnDetail,
            status: txnStatus,
          }]
        : [];

      const totalPaid = txnStatus === 'COMPLETED' ? fmtAmount(bookingData.amount) : '0.00';
      const balanceDue = txnStatus === 'COMPLETED'
        ? '0.00'
        : fmtAmount(bookingData.amount);

      const payload = {
        booking_id: `BKG-${Date.now()}`,
        room_number: bookingData.room || '',
        source: bookingData.source,
        status: 'Confirmed',
        dates: {
          check_in: bookingData.checkIn,
          check_out: bookingData.checkOut,
          nights: String(bookingData.nights),
        },
        guest: {
          guest_id: String(Date.now()),
          full_name: bookingData.guest,
          email: bookingData.email || '',
          phone: bookingData.phone || '',
        },
        billing: {
          expected_total: hasPayment ? fmtAmount(bookingData.amount) : '0.00',
          total_paid: totalPaid,
          balance_due: balanceDue,
        },
        transactions: initialTransactions,
      };

      const res = await authFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await fetchBookings();
    } catch (err) {
      console.error('Failed to create booking:', err);
      alert('Failed to save booking. Please try again.');
    }
    setShowCreateModal(false);
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'Confirmed': return <span className="status-tag tag-gold">Confirmed</span>;
      case 'Checked In': return <span className="status-tag tag-success">Checked In</span>;
      case 'Checked Out': return <span className="status-tag tag-neutral">Checked Out</span>;
      case 'No Show': return <span className="status-tag tag-danger">No-Show</span>;
      case 'Cancelled': return <span className="status-tag tag-danger">Cancelled</span>;
      default: return <span className="status-tag tag-neutral">{status}</span>;
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Stats
  const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
  const checkedInCount = bookings.filter(b => b.status === 'Checked In').length;
  const totalRevenue = bookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + b.amount, 0);

  if (isLoading) {
    return (<section className="admin-tab-content active"><PageSkeleton rows={6} /></section>);
  }

  return (
    <section className="admin-tab-content active">
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>All Bookings</h2>
          <p>Complete reservation ledger</p>
        </div>
        <div className="right">
        </div>
      </div>

      {/* SUMMARY */}
      <div className="panel" style={{ padding: '20px 28px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{bookings.length}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total</div></div>
          <div style={{ width: '1px', height: '36px', background: 'var(--border-light)' }}></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gold)' }}>{confirmedCount}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Confirmed</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-vac)' }}>{checkedInCount}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>In-House</div></div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button className="btn btn-sm btn-gold" onClick={() => setShowCreateModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              New Booking
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="panel">
        <div className="panel-header">
          <h3>Reservations ({filteredBookings.length})</h3>

          {/* SEARCH + FILTERS */}
          <div className="panel-toolbar">
            <div className="panel-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <Input type="text" placeholder="Search by guest or booking ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select className="floor-dropdown" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Checked In">Checked In</option>
              <option value="Checked Out">Checked Out</option>
              <option value="No Show">No-Show</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
            <Select className="floor-dropdown" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
              <option value="all">All Sources</option>
              <option value="Direct">Direct</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Booking.com">Booking.com</option>
              <option value="Expedia">Expedia</option>
              <option value="Agoda">Agoda</option>
            </Select>
            <Select className="floor-dropdown" value={filterRoomType} onChange={(e) => setFilterRoomType(e.target.value)}>
              <option value="all">All Room Types</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Premium">Premium</option>
              <option value="Suite">Suite</option>
              <option value="Presidential">Presidential</option>
            </Select>
            <button className="btn btn-sm" onClick={handleExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Nights</th>
                <th>Source</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No bookings found.</td></tr>
              ) : (
                filteredBookings.map(b => (
                  <tr key={b.id} className="table-row-hover" onClick={() => setSelectedBooking(b)} style={{ cursor: 'pointer' }}>
                    <td><span className="guest-name">{b.id}</span></td>
                    <td><span className="guest-name">{b.guest}</span></td>
                    <td><span className="std-text">{b.roomType}</span><span className="guest-sub">Rm {b.room}</span></td>
                    <td><span className="std-text">{formatDate(b.checkIn)}</span></td>
                    <td><span className="std-text">{formatDate(b.checkOut)}</span></td>
                    <td><span className="std-text">{b.nights}</span></td>
                    <td><span className="std-text">{b.source}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>{b.amount.toLocaleString()}</td>
                    <td>{getStatusTag(b.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOOKING DETAIL MODAL */}
      {selectedBooking && createPortal(
        <BookingDetailModal
          booking={selectedBooking}
          getStatusTag={getStatusTag}
          formatDate={formatDate}
          onClose={() => setSelectedBooking(null)}
          onDeleted={(deletedId) => {
            setBookings(prev => prev.filter(b => b._id !== deletedId));
            setSelectedBooking(null);
          }}
          onCancelled={(cancelledId) => {
            setBookings(prev => prev.map(b =>
              b._id === cancelledId ? { ...b, status: 'Cancelled', paymentStatus: 'Cancelled' } : b
            ));
            setSelectedBooking(null);
          }}
        />,
        document.body
      )}

      {/* CREATE BOOKING MODAL */}
      {showCreateModal && createPortal(
        <CreateBookingModal onClose={() => setShowCreateModal(false)} onSave={handleCreateBooking} />,
        document.body
      )}
    </section>
  );
}

/* BOOKING DETAIL MODAL */
function BookingDetailModal({ booking, getStatusTag, formatDate, onClose, onDeleted, onCancelled }) {
  const [transactions, setTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    reason: 'Guest request',
    cancelled_by: '',
    penalty_applied: false,
    penalty_amount: '',
  });
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!booking._id) return;
    const fetchTxns = async () => {
      setLoadingTxns(true);
      try {
        const res = await authFetch(`/api/bookings/${booking._id}`);
        const data = await res.json();
        setTransactions(data?.transactions || []);
      } catch (err) {
        console.error('Failed to load transactions', err);
      } finally {
        setLoadingTxns(false);
      }
    };
    fetchTxns();
  }, [booking._id]);

  const handleDelete = async () => {
    if (!window.confirm(`Archive booking ${booking.id} for ${booking.guest}? An administrator can restore it from Archive.`)) return;
    setIsDeleting(true);
    try {
      const res = await authFetch(`/api/bookings/${booking._id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to delete booking.');
        setIsDeleting(false);
        return;
      }
      onDeleted(booking._id);
      onClose();
    } catch (err) {
      console.error('Failed to delete booking:', err);
      alert('Cannot reach the server. Make sure the back-end is running on port 5000.');
    } finally {
      setIsDeleting(false);
    }
  };

  const parseAmount = (str) => parseFloat((str || '0').replace(/,/g, '')) || 0;
  const canDelete = !loadingTxns && ['Checked Out', 'Cancelled', 'No Show'].includes(booking.status) && booking.paymentStatus === 'Paid';
  const canCancel = !['Cancelled', 'Checked Out'].includes(booking.status);

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancelForm.reason) { alert('Please select a cancellation reason.'); return; }
    setIsCancelling(true);
    try {
      const res = await authFetch(`/api/bookings/${booking._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelForm.reason,
          cancelled_by: cancelForm.cancelled_by || 'Staff',
          penalty_applied: cancelForm.penalty_applied,
          penalty_amount: cancelForm.penalty_applied ? parseFloat(cancelForm.penalty_amount) || 0 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to cancel booking.'); return; }
      onCancelled(booking._id);
      onClose();
    } catch (err) {
      console.error('Cancel failed:', err);
      alert('Cannot reach the server. Make sure the back-end is running on port 5000.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-content" style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{booking.id}</h3>
          {getStatusTag(booking.status)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div><div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Guest</div><div style={{ fontSize: '13px', fontWeight: '600' }}>{booking.guest}</div></div>
          <div><div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Email</div><div style={{ fontSize: '13px' }}>{booking.email}</div></div>
          <div><div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Phone</div><div style={{ fontSize: '13px' }}>{booking.phone}</div></div>
          <div><div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Source</div><div style={{ fontSize: '13px' }}>{booking.source}</div></div>
          <div><div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Room</div><div style={{ fontSize: '13px' }}>Rm {booking.room}</div></div>
          <div><div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Stay</div><div style={{ fontSize: '13px' }}>{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} ({booking.nights}N)</div></div>
          <div><div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Amount</div><div style={{ fontSize: '13px', fontWeight: '700' }}>₱{booking.amount.toLocaleString()}</div></div>
          <div><div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Balance</div><div style={{ fontSize: '13px', fontWeight: '600', color: booking.paymentStatus === 'Paid' ? 'var(--status-vac)' : '#b45309' }}>{booking.paymentStatus}</div></div>
        </div>

        {/* TRANSACTION LEDGER */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
            Transaction Ledger
          </div>
          {loadingTxns ? (
            <CardsSkeleton cards={2} label="Loading transaction ledger" />
          ) : transactions.length === 0 ? (
            <div style={{ padding: '14px 16px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--text-muted)' }}>
              No transactions recorded for this booking.
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
              {transactions.map((t, i) => {
                const amt = parseAmount(t.amount);
                const isVoided = t.status === 'VOIDED';
                return (
                  <div key={t.txn_id || i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px',
                    borderBottom: i < transactions.length - 1 ? '1px solid var(--border-light)' : 'none',
                    opacity: isVoided ? 0.5 : 1,
                    background: isVoided ? 'var(--bg-input)' : 'transparent',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textDecoration: isVoided ? 'line-through' : 'none' }}>
                        {t.description}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {t.txn_id} · {t.payment_method}{t.payment_details ? ` · ${t.payment_details}` : ''} · {t.datetime}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: amt < 0 ? '#dc2626' : 'var(--text-primary)' }}>
                        {amt < 0 ? '−' : ''}₱{Math.abs(amt).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '10px', marginTop: '2px' }}>
                        <span style={{
                          padding: '2px 7px', borderRadius: '10px', fontWeight: '600',
                          background: t.status === 'COMPLETED' ? '#d1fae5' : t.status === 'VOIDED' ? '#f3f4f6' : '#fef3c7',
                          color: t.status === 'COMPLETED' ? '#065f46' : t.status === 'VOIDED' ? '#6b7280' : '#92400e',
                        }}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CANCEL BOOKING FORM */}
        {canCancel && (
          <div style={{ marginBottom: '20px' }}>
            {!showCancelForm ? (
              <button
                className="btn btn-sm"
                style={{ color: '#fff', background: '#dc2626', borderColor: '#dc2626' }}
                onClick={() => setShowCancelForm(true)}
              >
                Cancel Booking
              </button>
            ) : (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                  Cancel Booking
                </div>
                <ValidatedForm onSubmit={handleCancel}>
                  <div className="form-grid" style={{ marginBottom: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11px' }}>Reason <span className="required">*</span></label>
                      <Select
                        value={cancelForm.reason}
                        onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
                      >
                        <option>Guest request</option>
                        <option>No-show</option>
                        <option>OTA cancellation</option>
                        <option>Flight cancelled</option>
                        <option>Overbooking</option>
                        <option>Other</option>
                      </Select>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11px' }}>Cancelled By</label>
                      <Input
                        type="text"
                        value={cancelForm.cancelled_by}
                        onChange={(e) => setCancelForm({ ...cancelForm, cancelled_by: e.target.value })}
                        placeholder="Staff name"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <Input
                        type="checkbox"
                        checked={cancelForm.penalty_applied}
                        onChange={(e) => setCancelForm({ ...cancelForm, penalty_applied: e.target.checked, penalty_amount: '' })}
                        style={{ width: '15px', height: '15px', accentColor: 'var(--gold)' }}
                      />
                      Apply cancellation penalty
                    </label>
                  </div>
                  {cancelForm.penalty_applied && (
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '11px' }}>Penalty Amount (₱)</label>
                      <Input
                        type="number"
                        min="0"
                        value={cancelForm.penalty_amount}
                        onChange={(e) => setCancelForm({ ...cancelForm, penalty_amount: e.target.value })}
                        placeholder={`Max: ${booking.amount.toLocaleString()}`}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <SubmitButton type="submit" className="btn btn-sm" style={{ background: '#b45309', color: '#fff', borderColor: '#b45309' }} disabled={isCancelling}>
                      {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                    </SubmitButton>
                    <button type="button" className="btn btn-sm" onClick={() => setShowCancelForm(false)}>
                      Back
                    </button>
                  </div>
                </ValidatedForm>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Archive settled, completed stays without altering their ledger. */}
          {canDelete ? (
            <button
              className="btn btn-sm"
              style={{ color: 'var(--status-occ)', borderColor: 'var(--status-occ)' }}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Archiving…' : 'Archive Booking'}
            </button>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {loadingTxns ? '' : 'Archive is available after the stay ends and the balance is settled.'}
            </span>
          )}
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* CREATE BOOKING MODAL */
function CreateBookingModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    guest: '', email: '', phone: '', nationality: '', idType: 'Passport', idNumber: '',
    adults: 1, children: 0, roomType: 'Standard', room: '',
    checkIn: '', checkOut: '', nights: 1,
    source: 'Direct', status: 'confirmed',
    amount: '', paymentMethod: 'Cash', paymentStatus: 'Pending',
    specialRequests: '', arrivalTime: '', purpose: 'Leisure'
  });

  // Auto-calculate nights
  const calcNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const diff = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : 0;
  };

  const handleDateChange = (field, value) => {
    const updated = { ...form, [field]: value };
    if (updated.checkIn && updated.checkOut) {
      updated.nights = calcNights(updated.checkIn, updated.checkOut);
    }
    setForm(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.guest || !form.checkIn || !form.checkOut) { alert('Please fill in guest name, check-in, and check-out dates.'); return; }
    if (form.nights <= 0) { alert('Check-out must be after check-in.'); return; }
    onSave({ ...form, amount: parseFloat(form.amount) || 0, nights: parseInt(form.nights) || 1, adults: parseInt(form.adults) || 1, children: parseInt(form.children) || 0 });
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-content" style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>New Booking</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Fill in reservation details</p>

        <ValidatedForm onSubmit={handleSubmit}>

          {/* GUEST INFO */}
          <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-dark)', marginBottom: '12px' }}>Guest Information</h4>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Full Name <span className="required">*</span></label><Input type="text" value={form.guest} onChange={(e) => setForm({ ...form, guest: e.target.value })} placeholder="e.g. Juan Dela Cruz" /></div>
            <div className="form-group"><label>Email</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="guest@email.com" /></div>
          </div>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Phone</label><Input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+63 9xx xxx xxxx" /></div>
            <div className="form-group"><label>Nationality</label><Input type="text" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="e.g. Filipino" /></div>
          </div>
          <div className="form-grid" style={{ marginBottom: '22px' }}>
            <div className="form-group"><label>ID Type</label>
              <Select value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })}>
                <option>Passport</option><option>Driver's License</option><option>National ID</option><option>Company ID</option><option>Other</option>
              </Select>
            </div>
            <div className="form-group"><label>ID Number</label><Input type="text" value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} placeholder="e.g. P12345678" /></div>
          </div>

          {/* STAY DETAILS */}
          <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-dark)', marginBottom: '12px' }}>Stay Details</h4>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Check-in <span className="required">*</span></label><Input type="date" value={form.checkIn} onChange={(e) => handleDateChange('checkIn', e.target.value)} /></div>
            <div className="form-group"><label>Check-out <span className="required">*</span></label><Input type="date" value={form.checkOut} onChange={(e) => handleDateChange('checkOut', e.target.value)} /></div>
          </div>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Nights</label><Input type="number" value={form.nights} readOnly style={{ background: 'var(--bg-body)', cursor: 'not-allowed' }} /></div>
            <div className="form-group"><label>Expected Arrival</label><Input type="time" value={form.arrivalTime} onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })} /></div>
          </div>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Adults</label><Input type="number" value={form.adults} onChange={(e) => setForm({ ...form, adults: e.target.value })} min="1" max="10" /></div>
            <div className="form-group"><label>Children</label><Input type="number" value={form.children} onChange={(e) => setForm({ ...form, children: e.target.value })} min="0" max="10" /></div>
          </div>
          <div className="form-grid" style={{ marginBottom: '22px' }}>
            <div className="form-group"><label>Room Type</label>
              <Select value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })}>
                <option>Standard</option><option>Deluxe</option><option>Premium</option><option>Suite</option><option>Presidential</option>
              </Select>
            </div>
            <div className="form-group"><label>Room # (assign later if empty)</label><Input type="text" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="e.g. 304" /></div>
          </div>
          <div className="form-grid" style={{ marginBottom: '22px' }}>
            <div className="form-group"><label>Source</label>
              <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option>Direct</option><option>Walk-in</option><option>Booking.com</option><option>Expedia</option><option>Agoda</option><option>Airbnb</option><option>Phone</option>
              </Select>
            </div>
            <div className="form-group"><label>Purpose of Stay</label>
              <Select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                <option>Leisure</option><option>Business</option><option>Event</option><option>Transit</option><option>Other</option>
              </Select>
            </div>
          </div>

          {/* PAYMENT */}
          <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-dark)', marginBottom: '12px' }}>Payment</h4>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Total Amount</label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min="0" placeholder="0" /></div>
            <div className="form-group"><label>Payment Status</label>
              <Select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                <option>Pending</option><option>Paid</option><option>Partial</option><option>OTA Collect</option>
              </Select>
            </div>
          </div>

          {/* Payment Method Toggle */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Payment Method</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setForm({ ...form, paymentMethod: 'Cash', cardNumber: '', cardHolder: '', onlineRef: '', onlinePlatform: '' })}
                style={{
                  flex: 1, padding: '14px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                  background: form.paymentMethod === 'Cash' ? 'rgba(201,168,76,0.1)' : 'var(--bg-input)',
                  border: form.paymentMethod === 'Cash' ? '2px solid var(--gold)' : '1px solid var(--border-light)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={form.paymentMethod === 'Cash' ? 'var(--gold-dark)' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="3"></circle><path d="M2 10h2M20 10h2M2 14h2M20 14h2"></path></svg>
                <span style={{ fontSize: '12px', fontWeight: '700', color: form.paymentMethod === 'Cash' ? 'var(--gold-dark)' : 'var(--text-secondary)' }}>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, paymentMethod: 'Card/Online', cashReceived: '', cashChange: '' })}
                style={{
                  flex: 1, padding: '14px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                  background: form.paymentMethod === 'Card/Online' ? 'rgba(201,168,76,0.1)' : 'var(--bg-input)',
                  border: form.paymentMethod === 'Card/Online' ? '2px solid var(--gold)' : '1px solid var(--border-light)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={form.paymentMethod === 'Card/Online' ? 'var(--gold-dark)' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                <span style={{ fontSize: '12px', fontWeight: '700', color: form.paymentMethod === 'Card/Online' ? 'var(--gold-dark)' : 'var(--text-secondary)' }}>Card / Online</span>
              </button>
            </div>
          </div>

          {/* Cash Detail Panel */}
          {form.paymentMethod === 'Cash' && (
            <div style={{ background: 'var(--bg-input)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-light)', marginBottom: '22px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Cash Payment Details</div>
              <div className="form-grid">
                <div className="form-group"><label>Cash Received</label><Input type="number" value={form.cashReceived || ''} onChange={(e) => setForm({ ...form, cashReceived: e.target.value })} placeholder="0" min="0" /></div>
                <div className="form-group"><label>Change</label><Input type="number" value={form.cashReceived && form.amount ? (parseFloat(form.cashReceived) - parseFloat(form.amount)).toFixed(2) : ''} readOnly style={{ background: 'var(--bg-body)', cursor: 'not-allowed' }} /></div>
              </div>
            </div>
          )}

          {/* Card/Online Detail Panel */}
          {form.paymentMethod === 'Card/Online' && (
            <div style={{ background: 'var(--bg-input)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-light)', marginBottom: '22px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Card / Online Payment Details</div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Platform</label>
                <Select value={form.onlinePlatform || ''} onChange={(e) => setForm({ ...form, onlinePlatform: e.target.value })}>
                  <option value="">Select...</option>
                  <option>Credit Card (Visa)</option>
                  <option>Credit Card (Mastercard)</option>
                  <option>Debit Card</option>
                  <option>GCash</option>
                  <option>Maya</option>
                  <option>Bank Transfer</option>
                  <option>PayPal</option>
                  <option>OTA Collect</option>
                </Select>
              </div>
              <div className="form-grid" style={{ marginBottom: '12px' }}>
                <div className="form-group"><label>Card / Account Holder</label><Input type="text" value={form.cardHolder || ''} onChange={(e) => setForm({ ...form, cardHolder: e.target.value })} placeholder="Name on card" /></div>
                <div className="form-group"><label>Last 4 Digits / Ref #</label><Input type="text" value={form.onlineRef || ''} onChange={(e) => setForm({ ...form, onlineRef: e.target.value })} placeholder="e.g. 4242 or TXN-REF" /></div>
              </div>
            </div>
          )}

          {/* SPECIAL REQUESTS */}
          <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-dark)', marginBottom: '12px' }}>Additional</h4>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Special Requests / Notes</label>
            <Textarea value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })} placeholder="e.g. Extra pillows, late check-in, anniversary setup..." style={{ minHeight: '70px' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <SubmitButton type="submit" className="btn btn-gold">Create Booking</SubmitButton>
          </div>
        </ValidatedForm>
      </div>
    </div>
  );
}

export default AllBookings;
