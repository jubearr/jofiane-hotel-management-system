import React, { useState, useEffect } from 'react';

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

  useEffect(() => { fetchBookings(); }, []);
  useEffect(() => { applyFilters(); }, [bookings, searchQuery, filterStatus, filterSource, filterRoomType]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await fetch('http://localhost:8080/api/admin/bookings');
      // const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockBookings = [
        { id: 'BKG-8001', guest: 'Marisol Reyes', email: 'marisol@email.com', phone: '+63 917 111 2222', roomType: 'Suite', room: '304', checkIn: '2026-08-10', checkOut: '2026-08-13', nights: 3, source: 'Direct', status: 'checked-in', amount: 25500, specialRequests: 'Late check-in, extra pillows', paymentStatus: 'Paid' },
        { id: 'BKG-8002', guest: 'Daniel Kho', email: 'daniel.kho@email.com', phone: '+63 918 222 3333', roomType: 'Standard', room: '208', checkIn: '2026-08-11', checkOut: '2026-08-14', nights: 3, source: 'Booking.com', status: 'confirmed', amount: 7500, specialRequests: '', paymentStatus: 'Pending' },
        { id: 'BKG-8003', guest: 'Fam. Villanueva', email: 'villa@email.com', phone: '+63 919 333 4444', roomType: 'Deluxe', room: '412', checkIn: '2026-08-09', checkOut: '2026-08-12', nights: 3, source: 'Expedia', status: 'checked-out', amount: 12600, specialRequests: 'Connecting rooms', paymentStatus: 'Paid' },
        { id: 'BKG-8004', guest: 'Lena Park', email: 'lena.p@email.com', phone: '+63 920 444 5555', roomType: 'Premium', room: '220', checkIn: '2026-08-12', checkOut: '2026-08-15', nights: 3, source: 'Direct', status: 'confirmed', amount: 16500, specialRequests: 'Airport transfer', paymentStatus: 'Paid' },
        { id: 'BKG-8005', guest: 'Kim Tan', email: 'kim.t@email.com', phone: '+63 921 555 6666', roomType: 'Standard', room: '105', checkIn: '2026-08-10', checkOut: '2026-08-11', nights: 1, source: 'Agoda', status: 'no-show', amount: 2500, specialRequests: '', paymentStatus: 'Penalty Applied' },
        { id: 'BKG-8006', guest: 'Carlos Mendoza', email: 'carlos.m@email.com', phone: '+63 922 666 7777', roomType: 'Deluxe', room: '115', checkIn: '2026-08-08', checkOut: '2026-08-11', nights: 3, source: 'Booking.com', status: 'checked-in', amount: 12600, specialRequests: 'High floor preferred', paymentStatus: 'Paid' },
        { id: 'BKG-8007', guest: 'Angela Cruz', email: 'angela@email.com', phone: '+63 923 777 8888', roomType: 'Presidential', room: '401', checkIn: '2026-08-14', checkOut: '2026-08-17', nights: 3, source: 'Direct', status: 'confirmed', amount: 45000, specialRequests: 'Champagne on arrival, anniversary setup', paymentStatus: 'Paid' },
        { id: 'BKG-8008', guest: 'Roberto Santos', email: 'roberto@email.com', phone: '+63 924 888 9999', roomType: 'Suite', room: '305', checkIn: '2026-08-07', checkOut: '2026-08-09', nights: 2, source: 'Expedia', status: 'checked-out', amount: 17000, specialRequests: '', paymentStatus: 'Paid' },
        { id: 'BKG-8009', guest: 'Jun Aquino', email: 'jun.a@email.com', phone: '+63 925 999 0000', roomType: 'Standard', room: '103', checkIn: '2026-08-11', checkOut: '2026-08-12', nights: 1, source: 'Walk-in', status: 'confirmed', amount: 2500, specialRequests: '', paymentStatus: 'Pending' },
        { id: 'BKG-8010', guest: 'Maria Clara', email: 'maria.c@email.com', phone: '+63 926 000 1111', roomType: 'Premium', room: '203', checkIn: '2026-08-09', checkOut: '2026-08-10', nights: 1, source: 'Agoda', status: 'cancelled', amount: 5500, specialRequests: '', paymentStatus: 'Refunded' },
      ];

      setBookings(mockBookings);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleCreateBooking = (bookingData) => {
    // TODO: POST to API
    const newBooking = { ...bookingData, id: `BKG-${8010 + bookings.length + 1}` };
    setBookings(prev => [newBooking, ...prev]);
    setShowCreateModal(false);
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'confirmed': return <span className="status-tag tag-gold">Confirmed</span>;
      case 'checked-in': return <span className="status-tag tag-success">Checked In</span>;
      case 'checked-out': return <span className="status-tag tag-neutral">Checked Out</span>;
      case 'no-show': return <span className="status-tag tag-danger">No-Show</span>;
      case 'cancelled': return <span className="status-tag tag-danger">Cancelled</span>;
      default: return <span className="status-tag tag-neutral">{status}</span>;
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Stats
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const checkedInCount = bookings.filter(b => b.status === 'checked-in').length;
  const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.amount, 0);

  if (isLoading) {
    return (<section className="admin-tab-content active"><div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading bookings...</div></section>);
  }

  return (
    <section className="admin-tab-content active">
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>All Bookings</h2>
          <p>Complete reservation ledger</p>
        </div>
        <div className="right">
          <button className="btn btn-sm" onClick={() => alert('Exporting bookings...')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export
          </button>
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

      {/* FILTERS */}
      <div className="panel" style={{ padding: '16px 24px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search by guest or booking ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', fontSize: '13px' }} />
          </div>
          <select className="floor-dropdown" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked-in">Checked In</option>
            <option value="checked-out">Checked Out</option>
            <option value="no-show">No-Show</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="floor-dropdown" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
            <option value="all">All Sources</option>
            <option value="Direct">Direct</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Booking.com">Booking.com</option>
            <option value="Expedia">Expedia</option>
            <option value="Agoda">Agoda</option>
          </select>
          <select className="floor-dropdown" value={filterRoomType} onChange={(e) => setFilterRoomType(e.target.value)}>
            <option value="all">All Room Types</option>
            <option value="Standard">Standard</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Premium">Premium</option>
            <option value="Suite">Suite</option>
            <option value="Presidential">Presidential</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="panel">
        <div className="panel-header"><h3>Reservations ({filteredBookings.length})</h3></div>
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
      {selectedBooking && (
        <BookingDetailModal booking={selectedBooking} getStatusTag={getStatusTag} formatDate={formatDate} onClose={() => setSelectedBooking(null)} />
      )}

      {/* CREATE BOOKING MODAL */}
      {showCreateModal && (
        <CreateBookingModal onClose={() => setShowCreateModal(false)} onSave={handleCreateBooking} />
      )}
    </section>
  );
}

/* BOOKING DETAIL MODAL */
function BookingDetailModal({ booking, getStatusTag, formatDate, onClose }) {
  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '520px' }}>
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
          <div><div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Room</div><div style={{ fontSize: '13px' }}>{booking.roomType} (Rm {booking.room})</div></div>
          <div><div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Stay</div><div style={{ fontSize: '13px' }}>{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} ({booking.nights}N)</div></div>
          <div><div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Amount</div><div style={{ fontSize: '13px', fontWeight: '700' }}>{booking.amount.toLocaleString()}</div></div>
          <div><div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Payment</div><div style={{ fontSize: '13px' }}>{booking.paymentStatus}</div></div>
        </div>
        {booking.specialRequests && (
          <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Special Requests</div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{booking.specialRequests}</div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn" onClick={onClose}>Close</button></div>
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
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>New Booking</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Fill in reservation details</p>

        <form onSubmit={handleSubmit}>

          {/* GUEST INFO */}
          <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-dark)', marginBottom: '12px' }}>Guest Information</h4>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Full Name <span className="required">*</span></label><input type="text" value={form.guest} onChange={(e) => setForm({ ...form, guest: e.target.value })} placeholder="e.g. Juan Dela Cruz" /></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="guest@email.com" /></div>
          </div>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Phone</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+63 9xx xxx xxxx" /></div>
            <div className="form-group"><label>Nationality</label><input type="text" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="e.g. Filipino" /></div>
          </div>
          <div className="form-grid" style={{ marginBottom: '22px' }}>
            <div className="form-group"><label>ID Type</label>
              <select value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })}>
                <option>Passport</option><option>Driver's License</option><option>National ID</option><option>Company ID</option><option>Other</option>
              </select>
            </div>
            <div className="form-group"><label>ID Number</label><input type="text" value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} placeholder="e.g. P12345678" /></div>
          </div>

          {/* STAY DETAILS */}
          <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-dark)', marginBottom: '12px' }}>Stay Details</h4>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Check-in <span className="required">*</span></label><input type="date" value={form.checkIn} onChange={(e) => handleDateChange('checkIn', e.target.value)} /></div>
            <div className="form-group"><label>Check-out <span className="required">*</span></label><input type="date" value={form.checkOut} onChange={(e) => handleDateChange('checkOut', e.target.value)} /></div>
          </div>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Nights</label><input type="number" value={form.nights} readOnly style={{ background: 'var(--bg-body)', cursor: 'not-allowed' }} /></div>
            <div className="form-group"><label>Expected Arrival</label><input type="time" value={form.arrivalTime} onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })} /></div>
          </div>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Adults</label><input type="number" value={form.adults} onChange={(e) => setForm({ ...form, adults: e.target.value })} min="1" max="10" /></div>
            <div className="form-group"><label>Children</label><input type="number" value={form.children} onChange={(e) => setForm({ ...form, children: e.target.value })} min="0" max="10" /></div>
          </div>
          <div className="form-grid" style={{ marginBottom: '22px' }}>
            <div className="form-group"><label>Room Type</label>
              <select value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })}>
                <option>Standard</option><option>Deluxe</option><option>Premium</option><option>Suite</option><option>Presidential</option>
              </select>
            </div>
            <div className="form-group"><label>Room # (assign later if empty)</label><input type="text" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="e.g. 304" /></div>
          </div>
          <div className="form-grid" style={{ marginBottom: '22px' }}>
            <div className="form-group"><label>Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option>Direct</option><option>Walk-in</option><option>Booking.com</option><option>Expedia</option><option>Agoda</option><option>Airbnb</option><option>Phone</option>
              </select>
            </div>
            <div className="form-group"><label>Purpose of Stay</label>
              <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                <option>Leisure</option><option>Business</option><option>Event</option><option>Transit</option><option>Other</option>
              </select>
            </div>
          </div>

          {/* PAYMENT */}
          <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-dark)', marginBottom: '12px' }}>Payment</h4>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Total Amount</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min="0" placeholder="0" /></div>
            <div className="form-group"><label>Payment Status</label>
              <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                <option>Pending</option><option>Paid</option><option>Partial</option><option>OTA Collect</option>
              </select>
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
                <div className="form-group"><label>Cash Received</label><input type="number" value={form.cashReceived || ''} onChange={(e) => setForm({ ...form, cashReceived: e.target.value })} placeholder="0" min="0" /></div>
                <div className="form-group"><label>Change</label><input type="number" value={form.cashReceived && form.amount ? (parseFloat(form.cashReceived) - parseFloat(form.amount)).toFixed(2) : ''} readOnly style={{ background: 'var(--bg-body)', cursor: 'not-allowed' }} /></div>
              </div>
            </div>
          )}

          {/* Card/Online Detail Panel */}
          {form.paymentMethod === 'Card/Online' && (
            <div style={{ background: 'var(--bg-input)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-light)', marginBottom: '22px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Card / Online Payment Details</div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Platform</label>
                <select value={form.onlinePlatform || ''} onChange={(e) => setForm({ ...form, onlinePlatform: e.target.value })}>
                  <option value="">Select...</option>
                  <option>Credit Card (Visa)</option>
                  <option>Credit Card (Mastercard)</option>
                  <option>Debit Card</option>
                  <option>GCash</option>
                  <option>Maya</option>
                  <option>Bank Transfer</option>
                  <option>PayPal</option>
                  <option>OTA Collect</option>
                </select>
              </div>
              <div className="form-grid" style={{ marginBottom: '12px' }}>
                <div className="form-group"><label>Card / Account Holder</label><input type="text" value={form.cardHolder || ''} onChange={(e) => setForm({ ...form, cardHolder: e.target.value })} placeholder="Name on card" /></div>
                <div className="form-group"><label>Last 4 Digits / Ref #</label><input type="text" value={form.onlineRef || ''} onChange={(e) => setForm({ ...form, onlineRef: e.target.value })} placeholder="e.g. 4242 or TXN-REF" /></div>
              </div>
            </div>
          )}

          {/* SPECIAL REQUESTS */}
          <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-dark)', marginBottom: '12px' }}>Additional</h4>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Special Requests / Notes</label>
            <textarea value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })} placeholder="e.g. Extra pillows, late check-in, anniversary setup..." style={{ minHeight: '70px' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gold">Create Booking</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AllBookings;
