import React, { useState, useRef, useEffect } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { authFetch } from '../../utils/api';
import { todayISO, shiftISODate } from '../../utils/dateUtils';
import GuestDetailModal from './GuestDetailModal';
import ConfirmModal from '../common/ConfirmModal';
import { Input, Select } from '../common/FormControls';
import { TableSkeletonRows, SkeletonBlock } from '../common/SkeletonLoader';

function Arrivals() {
  // 1. UI FILTERS STATE
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roomTypeFilter, setRoomTypeFilter] = useState('All');

  // 2. BACKEND-READY NETWORK STATES
  const [arrivals, setArrivals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [viewingArrival, setViewingArrival] = useState(null);
  const [confirmingArrival, setConfirmingArrival] = useState(null);
  const firstLoad = useRef(true);   // full loader only on first load / date change

  // 3. FETCH DATA
  const fetchArrivals = async () => {
    // Show the loader on the first load (and after a date change); background
    // polls refresh silently so the table doesn't flicker every 10 seconds.
    if (firstLoad.current) setIsLoading(true);
    try {
      const response = await authFetch(`/api/arrivals?date=${selectedDate}`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      const normalized = data.map(a => ({
        id: a.booking_id || a._id,
        guestName: a.guest?.full_name || '',
        adults: a.adults || 0,
        children: a.children || 0,
        nights: parseInt(a.dates?.nights) || 0,
        roomType: a.room_number || '',
        roomNumber: a.room_number || null,
        status: a.status === 'Confirmed' ? 'Pending' : a.status,
        arrivalTime: '—',
        flight: '',
        balance: parseFloat((a.billing?.balance_due || '0').replace(/,/g, '')) || 0,
        prepaid: parseFloat((a.billing?.balance_due || '0').replace(/,/g, '')) === 0,
        requests: '',
        isVIP: false,
        _id: a._id,
      }));
      setArrivals(normalized);
    } catch (err) {
      console.error('Failed to fetch arrivals', err);
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  // Re-arm the full loader when the viewed date changes (the next fetch will
  // show it once), then polling continues silently.
  useEffect(() => { firstLoad.current = true; }, [selectedDate]);

  usePolling(fetchArrivals, 10000, [selectedDate]);

  // 4. ASYNC ACTION HANDLERS
  // Clicking "Check-In" opens a confirmation modal; the actual request runs
  // only after the user confirms.
  const requestCheckIn = (bookingId) => {
    const arrival = arrivals.find(a => a.id === bookingId);
    if (arrival) setConfirmingArrival(arrival);
  };

  const confirmCheckIn = async () => {
    const arrival = confirmingArrival;
    if (!arrival) return;
    setProcessingId(arrival.id);
    try {
      const res = await authFetch(`/api/bookings/${arrival._id}/checkin`, { method: 'POST' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      // Update status locally for instant UI feedback
      setArrivals(prev => prev.map(a => a.id === arrival.id ? { ...a, status: 'Checked-In' } : a));
      setConfirmingArrival(null);
    } catch (error) {
      console.error('Check-in failed:', error);
      alert('Error checking in guest.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (bookingId) => {
    const arrival = arrivals.find(a => a.id === bookingId);
    if (arrival) setViewingArrival(arrival);
  };

  // Filter Logic (Runs on the fetched data)
  const filteredArrivals = arrivals.filter((a) => {
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (roomTypeFilter !== 'All' && a.roomType !== roomTypeFilter) return false;
    if (searchQuery && !a.guestName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusTag = (status) => {
    switch (status) {
      case 'Checked-In': return 'tag-success';
      case 'Pending': return 'tag-danger';
      case 'No-Show': return 'tag-neutral';
      case 'Cancelled': return 'tag-neutral';
      default: return 'tag-neutral';
    }
  };

 
  return (
    <section className="admin-tab-content active employee-module arrivals-module">
      
      {/* PAGE HEADER */}
      <div className="page-header employee-page-header" style={{ marginBottom: '24px' }}>
        <div className="left">
          <h2>Arrivals & Check-Ins</h2>
          <p>Manage today's expected arrivals, VIPs, and room assignments.</p>
        </div>
        <div className="right employee-page-actions" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="date-navigator" style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => setSelectedDate(prev => shiftISODate(prev, -1))}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button
              type="button"
              aria-label="Next day"
              onClick={() => setSelectedDate(prev => shiftISODate(prev, 1))}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <button className="btn btn-sm btn-gold" style={{ borderRadius: '8px', padding: '8px 16px' }} onClick={() => setSelectedDate(todayISO())}>
            Today
          </button>
        </div>
      </div>

      {/* KPI METRICS GRID  */}
      <div className="kpi-grid operational-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>TOTAL EXPECTED</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0' }}>{isLoading ? <SkeletonBlock style={{ width: 50, height: 32 }} /> : arrivals.length}</span>
          <span className="sub" style={{ color: '#6b7280' }}>Arrivals for selected date</span>
        </div>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>PENDING CHECK-IN</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0' }}>{isLoading ? <SkeletonBlock style={{ width: 50, height: 32 }} /> : arrivals.filter(a => a.status === 'Pending').length}</span>
          <span className="sub" style={{ color: '#6b7280' }}>Requires Action</span>
        </div>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>CHECKED-IN</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0' }}>{isLoading ? <SkeletonBlock style={{ width: 50, height: 32 }} /> : arrivals.filter(a => a.status === 'Checked-In').length}</span>
          <span className="sub" style={{ color: '#6b7280' }}>Successfully arrived</span>
        </div>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>VIP ARRIVALS</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0' }}>{isLoading ? <SkeletonBlock style={{ width: 50, height: 32 }} /> : arrivals.filter(a => a.isVIP).length}</span>
          <span className="sub" style={{ color: '#6b7280' }}>Special handling required</span>
        </div>
      </div>

      {/* MAIN ARRIVALS LIST PANEL */}
      <div className="panel manifest-panel" style={{ borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        
        <div className="panel-header manifest-toolbar" style={{ padding: '20px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>Arrival Manifest</h3>
          <div className="manifest-filters" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#4b5563', cursor: 'pointer' }}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Checked-In">Checked-In</option>
            </Select>
            <Select value={roomTypeFilter} onChange={(e) => setRoomTypeFilter(e.target.value)} style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#4b5563', cursor: 'pointer' }}>
              <option value="All">All Room Types</option>
              <option value="Veranda Suite">Veranda Suite</option>
              <option value="Presidential Suite">Presidential Suite</option>
              <option value="Garden Room">Garden Room</option>
            </Select>
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <Input type="text" placeholder="Search guest..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '8px 12px 8px 32px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', width: '220px' }} />
            </div>
          </div>
        </div>

        <div className="table-wrap manifest-table" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eaeaea' }}>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center', width: '60px' }}>Alert</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Guest Information</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>ETA / Flight</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Room Assignment</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Balance</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              
              {/* IF LOADING, SHOW SPINNER. IF EMPTY, SHOW "NOT FOUND". ELSE, SHOW DATA. */}
              {isLoading ? (
                <TableSkeletonRows columns={7} label="Loading arrivals" />
              ) : filteredArrivals.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No arrivals match the current filters.
                  </td>
                </tr>
              ) : (
                filteredArrivals.map((arrival) => (
                  <tr className={arrival.isVIP ? 'priority-row' : ''} key={arrival.id} style={{ borderBottom: '1px solid #f3f4f6', background: arrival.isVIP ? '#fffdf0' : 'transparent', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      {arrival.isVIP && <i className="fas fa-star" style={{ color: '#c5a059', fontSize: 14 }} title="VIP Guest"></i>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className="primary-table-text" style={{ fontWeight: '600', display: 'block', color: '#111827', fontSize: '14px' }}>{arrival.guestName}</span>
                      <span className="secondary-table-text" style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', display: 'block' }}>{arrival.id} • {arrival.adults}A {arrival.children > 0 ? `${arrival.children}C` : ''} • {arrival.nights} Nights</span>
                      {arrival.requests && <div className="guest-request" style={{ fontSize: '12px', color: '#0ea5e9', marginTop: '4px' }}>{arrival.requests}</div>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div className="primary-table-text" style={{ fontWeight: '500', color: '#111827', fontSize: '13px' }}>{arrival.arrivalTime}</div>
                      <div className="secondary-table-text" style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{arrival.flight ? `Flight: ${arrival.flight}` : 'No flight details'}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {arrival.roomNumber ? (
                        <div>
                          <span className="room-number" style={{ color: '#c5a059', fontWeight: '600', fontSize: '14px' }}>Rm {arrival.roomNumber}</span>
                          <div className="secondary-table-text" style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{arrival.roomType}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="secondary-table-text" style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{arrival.roomType}</div>
                          <button onClick={() => handleViewDetails(arrival.id)} style={{ background: '#f3f4f6', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', color: '#4b5563', fontWeight: '600', cursor: 'pointer' }}>Assign Room</button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {arrival.prepaid ? <span className="balance-settled" style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>Prepaid</span> : <span className="balance-warning" style={{ color: '#ef4444', fontWeight: '600', fontSize: '13px' }}>₱{arrival.balance.toLocaleString()} Due</span>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className={`status-tag ${getStatusTag(arrival.status)}`} style={{ textTransform: 'uppercase', fontSize: '10px', padding: '4px 8px' }}>{arrival.status}</span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button title="View Details" onClick={() => handleViewDetails(arrival.id)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', border: 'none', borderRadius: '6px', color: '#6b7280', cursor: 'pointer' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        {arrival.status === 'Pending' ? (
                          <button className="btn btn-gold" onClick={() => requestCheckIn(arrival.id)} disabled={processingId === arrival.id} style={{ padding: '0 16px', height: '32px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: 'none' }}>
                            {processingId === arrival.id ? 'Processing...' : 'Check-In'}
                          </button>
                        ) : <div style={{ width: '85px' }}></div>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingArrival && (
        <GuestDetailModal
          booking={viewingArrival}
          title="Guest Details"
          onClose={() => setViewingArrival(null)}
        />
      )}

      {confirmingArrival && (
        <ConfirmModal
          title="Confirm Check-In"
          message={
            <>Check in <strong>{confirmingArrival.guestName}</strong>
            {confirmingArrival.roomNumber ? <> to Room <strong>{confirmingArrival.roomNumber}</strong></> : ''}?</>
          }
          confirmLabel="Check In"
          busy={processingId === confirmingArrival.id}
          onConfirm={confirmCheckIn}
          onCancel={() => setConfirmingArrival(null)}
        />
      )}
    </section>
  );
}

export default Arrivals;
