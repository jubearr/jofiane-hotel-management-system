import React, { useState, useEffect } from 'react';

function Cancellations() {
  const [isLoading, setIsLoading] = useState(true);
  const [cancellations, setCancellations] = useState([]);
  const [filteredList, setFilteredList] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReason, setFilterReason] = useState('all');
  const [filterPenalty, setFilterPenalty] = useState('all');

  useEffect(() => { fetchCancellations(); }, []);
  useEffect(() => { applyFilters(); }, [cancellations, searchQuery, filterReason, filterPenalty]);

  const fetchCancellations = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await fetch('http://localhost:8080/api/admin/cancellations');
      // const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockData = [
        { id: 'BKG-8010', guest: 'Maria Clara', room: '203', roomType: 'Premium', checkIn: '2026-08-09', checkOut: '2026-08-10', nights: 1, amount: 5500, reason: 'Guest request', cancelledBy: 'Guest', cancelledDate: '2026-08-07T14:00:00', penaltyApplied: false, penaltyAmount: 0, source: 'Agoda' },
        { id: 'BKG-8015', guest: 'Kim Tan', room: '105', roomType: 'Standard', checkIn: '2026-08-10', checkOut: '2026-08-11', nights: 1, amount: 2500, reason: 'No-show', cancelledBy: 'System', cancelledDate: '2026-08-10T23:00:00', penaltyApplied: true, penaltyAmount: 2500, source: 'Agoda' },
        { id: 'BKG-7998', guest: 'Paolo Reyes', room: '302', roomType: 'Suite', checkIn: '2026-08-05', checkOut: '2026-08-08', nights: 3, amount: 25500, reason: 'OTA cancellation', cancelledBy: 'Booking.com', cancelledDate: '2026-08-03T09:30:00', penaltyApplied: true, penaltyAmount: 8500, source: 'Booking.com' },
        { id: 'BKG-7995', guest: 'Sarah Lim', room: '110', roomType: 'Standard', checkIn: '2026-08-04', checkOut: '2026-08-06', nights: 2, amount: 5000, reason: 'Guest request', cancelledBy: 'Guest', cancelledDate: '2026-08-02T16:00:00', penaltyApplied: false, penaltyAmount: 0, source: 'Direct' },
        { id: 'BKG-7990', guest: 'Chen Wei', room: '401', roomType: 'Presidential', checkIn: '2026-08-06', checkOut: '2026-08-09', nights: 3, amount: 45000, reason: 'Flight cancelled', cancelledBy: 'Guest', cancelledDate: '2026-08-05T11:00:00', penaltyApplied: true, penaltyAmount: 15000, source: 'Expedia' },
        { id: 'BKG-7985', guest: 'Amy Torres', room: '205', roomType: 'Deluxe', checkIn: '2026-08-03', checkOut: '2026-08-05', nights: 2, amount: 8400, reason: 'Overbooking', cancelledBy: 'Hotel', cancelledDate: '2026-08-02T08:00:00', penaltyApplied: false, penaltyAmount: 0, source: 'Direct' },
        { id: 'BKG-7980', guest: 'Jake Mendoza', room: '104', roomType: 'Standard', checkIn: '2026-08-01', checkOut: '2026-08-02', nights: 1, amount: 2500, reason: 'No-show', cancelledBy: 'System', cancelledDate: '2026-08-01T23:00:00', penaltyApplied: true, penaltyAmount: 2500, source: 'Walk-in' },
      ];

      setCancellations(mockData);
    } catch (err) {
      console.error('Failed to fetch cancellations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...cancellations];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.id.toLowerCase().includes(q) || c.guest.toLowerCase().includes(q));
    }
    if (filterReason !== 'all') result = result.filter(c => c.reason === filterReason);
    if (filterPenalty !== 'all') {
      if (filterPenalty === 'applied') result = result.filter(c => c.penaltyApplied);
      else result = result.filter(c => !c.penaltyApplied);
    }
    setFilteredList(result);
  };

  const handleRebook = (cancellation) => {
    // TODO: Navigate or open create booking with pre-filled data
    alert(`Re-booking for ${cancellation.guest} — ${cancellation.roomType}, ${cancellation.nights} night(s)`);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'Short', day: 'numeric' });
  const formatDateTime = (dateStr) => new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Stats
  const totalLost = cancellations.reduce((sum, c) => sum + c.amount, 0);
  const totalPenalties = cancellations.reduce((sum, c) => sum + c.penaltyAmount, 0);
  const netLoss = totalLost - totalPenalties;
  const reasons = [...new Set(cancellations.map(c => c.reason))];

  if (isLoading) {
    return (<section className="admin-tab-content active"><div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading cancellations...</div></section>);
  }

  return (
    <section className="admin-tab-content active">
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Cancellations</h2>
          <p>Tracking lost revenue and cancellation reasons</p>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="panel" style={{ padding: '20px 28px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{cancellations.length}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Cancelled</div></div>
          <div style={{ width: '1px', height: '36px', background: 'var(--border-light)' }}></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-occ)' }}>{totalLost.toLocaleString()}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Revenue Lost</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gold)' }}>{totalPenalties.toLocaleString()}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Penalties Collected</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-muted)' }}>{netLoss.toLocaleString()}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Net Loss</div></div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="panel" style={{ padding: '16px 24px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search by guest or booking ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', fontSize: '13px' }} />
          </div>
          <select className="floor-dropdown" value={filterReason} onChange={(e) => setFilterReason(e.target.value)}>
            <option value="all">All Reasons</option>
            {reasons.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="floor-dropdown" value={filterPenalty} onChange={(e) => setFilterPenalty(e.target.value)}>
            <option value="all">All Penalties</option>
            <option value="applied">Penalty Applied</option>
            <option value="waived">No Penalty</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="panel">
        <div className="panel-header"><h3>Cancelled Bookings ({filteredList.length})</h3></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Cancelled By</th>
                <th>Cancelled On</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Penalty</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No cancellations found.</td></tr>
              ) : (
                filteredList.map(c => (
                  <tr key={c.id} className="table-row-hover">
                    <td><span className="guest-name">{c.id}</span></td>
                    <td><span className="guest-name">{c.guest}</span></td>
                    <td><span className="std-text">{c.roomType}</span><span className="guest-sub">Rm {c.room}</span></td>
                    <td><span className="std-text">{new Date(c.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(c.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></td>
                    <td>
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '10px', background: c.reason === 'No-show' ? '#fee2e2' : c.reason === 'Overbooking' ? '#fef3c7' : '#f3f4f6', color: c.reason === 'No-show' ? '#991b1b' : c.reason === 'Overbooking' ? '#92400e' : '#4b5563', textTransform: 'uppercase' }}>
                        {c.reason}
                      </span>
                    </td>
                    <td><span className="std-text">{c.cancelledBy}</span></td>
                    <td><span className="std-text">{formatDateTime(c.cancelledDate)}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--status-occ)' }}>{c.amount.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      {c.penaltyApplied ? (
                        <span style={{ fontWeight: '700', color: 'var(--gold)' }}>{c.penaltyAmount.toLocaleString()}</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Waived</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="action-link link-edit" onClick={() => handleRebook(c)}>Re-book</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Cancellations;
