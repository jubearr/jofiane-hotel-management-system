import { Input, Select } from '../../common/FormControls';
import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../../utils/api';
import { PageSkeleton } from '../../common/SkeletonLoader';
import { exportToCSV } from '../../../utils/exportUtils';

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
      const res = await fetch(`${API_BASE}/api/bookings?status=Cancelled`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      const parseAmount = (str) => parseFloat((str || '0').replace(/,/g, '')) || 0;

      const normalized = data.map(b => ({
        id: b.booking_id || b._id,
        guest: b.guest?.full_name || '',
        room: b.room_number || '',
        roomType: b.room_number || '',
        checkIn: b.dates?.check_in || '',
        checkOut: b.dates?.check_out || '',
        nights: parseInt(b.dates?.nights) || 0,
        amount: parseAmount(b.billing?.expected_total),
        reason: b.cancellation?.reason || 'Guest request',
        cancelledBy: b.cancellation?.cancelled_by || 'Staff',
        cancelledDate: b.cancellation?.cancelled_at || b.updatedAt || '',
        penaltyApplied: b.cancellation?.penalty_applied || false,
        penaltyAmount: parseAmount(b.cancellation?.penalty_amount),
        source: b.source || '',
        _id: b._id,
      }));

      setCancellations(normalized);
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

  const handleExportCSV = () => {
    const columns = [
      { header: 'Booking ID', key: 'id' },
      { header: 'Guest Name', key: 'guest' },
      { header: 'Room Number', key: 'room' },
      { header: 'Check-In', key: 'checkIn' },
      { header: 'Check-Out', key: 'checkOut' },
      { header: 'Nights', key: 'nights' },
      { header: 'Original Amount (PHP)', accessor: c => Number(c.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) },
      { header: 'Reason', key: 'reason' },
      { header: 'Cancelled By', key: 'cancelledBy' },
      { header: 'Cancellation Date', accessor: c => c.cancelledDate ? new Date(c.cancelledDate).toLocaleDateString('en-US') : '' },
      { header: 'Penalty Applied', accessor: c => c.penaltyApplied ? 'Yes' : 'No' },
      { header: 'Penalty Amount (PHP)', accessor: c => Number(c.penaltyAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) },
      { header: 'Source', key: 'source' },
    ];
    const todayStr = new Date().toISOString().slice(0, 10);
    exportToCSV(filteredList, columns, `jofiane-cancellations-${todayStr}`);
  };

  const handleRebook = (cancellation) => {
    // Open AllBookings with pre-filled data is out of scope here
    // For now just show key info the front desk needs to manually re-book
    alert(`Re-book for:\nGuest: ${cancellation.guest}\nRoom: ${cancellation.room}\nDates: ${cancellation.checkIn} → ${cancellation.checkOut} (${cancellation.nights}N)\nSource: ${cancellation.source}\n\nOpen All Bookings and use "New Booking" to re-create this reservation.`);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    // Handle "2026-08-10 22:05:00" format from DB as well as ISO strings
    const d = new Date(dateStr.replace(' ', 'T'));
    return isNaN(d) ? dateStr : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Stats
  const totalLost = cancellations.reduce((sum, c) => sum + c.amount, 0);
  const totalPenalties = cancellations.reduce((sum, c) => sum + c.penaltyAmount, 0);
  const netLoss = totalLost - totalPenalties;
  const reasons = [...new Set(cancellations.map(c => c.reason))];

  if (isLoading) {
    return (<section className="admin-tab-content active"><PageSkeleton rows={6} /></section>);
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

      {/* TABLE */}
      <div className="panel">
        <div className="panel-header">
          <h3>Cancelled Bookings ({filteredList.length})</h3>

          {/* SEARCH + FILTERS */}
          <div className="panel-toolbar">
            <div className="panel-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <Input type="text" placeholder="Search by guest or booking ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select className="floor-dropdown" value={filterReason} onChange={(e) => setFilterReason(e.target.value)}>
              <option value="all">All Reasons</option>
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
            <Select className="floor-dropdown" value={filterPenalty} onChange={(e) => setFilterPenalty(e.target.value)}>
              <option value="all">All Penalties</option>
              <option value="applied">Penalty Applied</option>
              <option value="waived">No Penalty</option>
            </Select>
            <button className="btn btn-sm" onClick={handleExportCSV}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export CSV
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
