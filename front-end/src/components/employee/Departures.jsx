import React, { useState, useRef, useEffect } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { authFetch } from '../../utils/api';
import { todayISO, shiftISODate } from '../../utils/dateUtils';
import GuestDetailModal from './GuestDetailModal';
import { Input, Select } from '../common/FormControls';
import { TableSkeletonRows, SkeletonBlock } from '../common/SkeletonLoader';

function Departures() {
  // 1. UI FILTERS STATE
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roomTypeFilter, setRoomTypeFilter] = useState('All');

  // 2. BACKEND-READY NETWORK STATES
  const [departures, setDepartures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);
  const [viewingFolio, setViewingFolio] = useState(null);
  const firstLoad = useRef(true);   // full loader only on first load / date change

  // 3. FETCH DATA
  const fetchDepartures = async () => {
    // Loader on first load / date change; background polls refresh silently
    // so the table doesn't flicker every 10 seconds.
    if (firstLoad.current) setIsLoading(true);
    setError(null);
    try {
      const response = await authFetch(`/api/departures?date=${selectedDate}`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      const normalized = data.map(d => ({
        id: d._id,
        guestName: d.guest?.full_name || '',
        vip: false,
        adults: d.adults || 0,
        children: d.children || 0,
        bookingId: d.booking_id || d._id,
        roomNumber: d.room_number || '',
        roomType: d.room_number || '',
        scheduledDeparture: d.dates?.check_out
          ? `${d.dates.check_out}T12:00:00`
          : new Date().toISOString(),
        status: d.status === 'Checked In' ? 'Pending' : d.status,
        balance: parseFloat((d.billing?.balance_due || '0').replace(/,/g, '')) || 0,
        prepaid: parseFloat((d.billing?.balance_due || '0').replace(/,/g, '')) === 0,
        deposit: parseFloat((d.billing?.total_paid || '0').replace(/,/g, '')) || 0,
        depositType: null,
        housekeeping: 'Unknown',
        alerts: [],
        nightsStayed: parseInt(d.dates?.nights) || 0,
        totalNights: parseInt(d.dates?.nights) || 0,
        lateRequest: false,
        _id: d._id,
      }));
      setDepartures(normalized);
    } catch (err) {
      console.error('Failed to fetch departures', err);
      setError('Failed to connect to the server.');
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  // Re-arm the full loader when the viewed date changes.
  useEffect(() => { firstLoad.current = true; }, [selectedDate]);

  usePolling(fetchDepartures, 10000, [selectedDate]);

  // 4. ASYNC ACTION HANDLERS
  const handleCheckOut = async (id) => {
    const departure = departures.find(d => d.id === id);
    if (!departure) return;
    setProcessingId(id);
    try {
      const res = await authFetch(`/api/bookings/${departure._id}/checkout`, { method: 'POST' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      // Update status locally for instant UI feedback
      setDepartures(prev => prev.map(d => d.id === id ? { ...d, status: 'Checked-Out' } : d));
    } catch (err) {
      console.error('Check-out failed:', err);
      alert('Error checking out guest.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewFolio = (id) => {
    const departure = departures.find(d => d.id === id);
    if (departure) setViewingFolio(departure);
  };

  // Filter Logic (Runs on the fetched data)[cite: 11]
  const filteredDepartures = departures.filter((d) => {
    if (statusFilter !== 'All' && d.status !== statusFilter) return false;
    if (roomTypeFilter !== 'All' && d.roomType !== roomTypeFilter) return false;
    if (searchQuery && !d.guestName.toLowerCase().includes(searchQuery.toLowerCase()) && !d.roomNumber.includes(searchQuery)) return false;
    return true;
  });

  const getStatusTag = (status) => {
    switch (status) {
      case 'Checked-Out': return 'tag-success';
      case 'Overdue': return 'tag-danger';
      case 'Late Requested': return 'tag-neutral';
      case 'Pending': return 'tag-neutral';
      default: return 'tag-neutral';
    }
  };
  
  const getHkTag = (status) => {
    return status === 'Clean' ? 'tag-success' : 'tag-danger';
  };

  return (
    <section className="admin-tab-content active employee-module departures-module">
      
      {/* PAGE HEADER[cite: 11] */}
      <div className="page-header employee-page-header" style={{ marginBottom: '24px' }}>
        <div className="left">
          <h2>Departures & Check-Outs</h2>
          <p>Manage today's expected departures, final billing, and room turnovers.</p>
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

      {error && <div style={{ color: '#ef4444', marginBottom: '15px' }}>{error}</div>}

      {/* KPI METRICS GRID */}
      <div className="kpi-grid operational-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>TOTAL EXPECTED</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0' }}>{isLoading ? <SkeletonBlock style={{ width: 50, height: 32 }} /> : departures.length}</span>
          <span className="sub" style={{ color: '#6b7280' }}>Departures for selected date</span>
        </div>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>PENDING / OVERDUE</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0' }}>{isLoading ? <SkeletonBlock style={{ width: 50, height: 32 }} /> : departures.filter(d => d.status === 'Pending' || d.status === 'Overdue').length}</span>
          <span className="sub" style={{ color: '#dc3545', fontWeight: '500' }}>Requires Check-Out</span>
        </div>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>CHECKED-OUT</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0' }}>{isLoading ? <SkeletonBlock style={{ width: 50, height: 32 }} /> : departures.filter(d => d.status === 'Checked-Out').length}</span>
          <span className="sub" style={{ color: '#6b7280' }}>Successfully departed</span>
        </div>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>BALANCE DUE</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0' }}>{isLoading ? <SkeletonBlock style={{ width: 50, height: 32 }} /> : departures.filter(d => d.balance > 0).length}</span>
          <span className="sub" style={{ color: '#6b7280' }}>Unsettled folios</span>
        </div>
      </div>

      {/* MAIN LIST PANEL */}
      <div className="panel manifest-panel" style={{ borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        
        {/* FILTERS[cite: 11] */}
        <div className="panel-header manifest-toolbar" style={{ padding: '20px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>Departure Manifest</h3>
          
          <div className="manifest-filters" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Select
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#4b5563', cursor: 'pointer' }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="Checked-Out">Checked-Out</option>
            </Select>

            <Select
              value={roomTypeFilter} 
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#4b5563', cursor: 'pointer' }}
            >
              <option value="All">All Room Types</option>
              <option value="Deluxe King">Deluxe King</option>
              <option value="Suite">Suite</option>
              <option value="Standard">Standard</option>
            </Select>

            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <Input
                type="text"
                placeholder="Search guest or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px 8px 32px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', width: '220px' }}
              />
            </div>
          </div>
        </div>

        {/* TABLE[cite: 11] */}
        <div className="table-wrap manifest-table" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eaeaea' }}>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', width: '40px' }}><Input type="checkbox" /></th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Room</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Guest Information</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Time / Balance</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>HK Status</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              
              {/* IF LOADING, SHOW SPINNER. IF EMPTY, SHOW "NOT FOUND". ELSE, SHOW DATA. */}
              {isLoading ? (
                <TableSkeletonRows columns={7} label="Loading departures" />
              ) : filteredDepartures.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No departures match the current filters.
                  </td>
                </tr>
              ) : (
                filteredDepartures.map((d) => {
                  const depDate = new Date(d.scheduledDeparture);
                  const isCheckedOut = d.status === 'Checked-Out';

                  return (
                    <tr className={`${d.vip ? 'priority-row' : ''} ${isCheckedOut ? 'completed-row' : ''}`.trim()} key={d.id} style={{
                      borderBottom: '1px solid #f3f4f6', 
                      background: d.vip ? '#fffdf0' : 'transparent', 
                      opacity: isCheckedOut ? 0.6 : 1, // Dim row if checked out[cite: 11]
                      transition: 'background 0.2s' 
                    }}>
                      
                      {/* CHECKBOX */}
                      <td style={{ padding: '16px 20px' }}>
                        <Input type="checkbox" disabled={isCheckedOut}/>
                      </td>

                      {/* ROOM[cite: 11] */}
                      <td style={{ padding: '16px 20px' }}>
                        <span className="room-number" style={{ color: 'var(--gold, #c5a059)', fontWeight: 'bold', fontSize: '16px' }}>{d.roomNumber}</span>
                        <div className="secondary-table-text" style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{d.roomType}</div>
                      </td>

                      {/* GUEST INFO[cite: 11] */}
                      <td style={{ padding: '16px 20px' }}>
                        <span className="primary-table-text" style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', color: '#111827', fontSize: '14px' }}>
                          {d.vip && <i className="fas fa-star" style={{ color: '#c5a059', fontSize: 12 }} title="VIP Guest"></i>}
                          {d.guestName}
                        </span>
                        <span className="secondary-table-text" style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                          {d.bookingId} • {d.adults}A {d.children > 0 ? `${d.children}C` : ''} 
                        </span>
                        {d.alerts.length > 0 && (
                          <div className="guest-alert" style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="fas fa-exclamation-circle"></i> {d.alerts[0]} {d.alerts.length > 1 ? `(+${d.alerts.length - 1})` : ''}
                          </div>
                        )}
                      </td>

                      {/* TIME & BALANCE[cite: 11] */}
                      <td style={{ padding: '16px 20px' }}>
                        <div className="primary-table-text" style={{ fontWeight: '500', color: '#111827', fontSize: '13px' }}>
                           {depDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                           {d.lateRequest && <span className="late-request" style={{ color: '#ea580c', fontSize: '11px', marginLeft: '6px' }}>(Late Request)</span>}
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          {d.balance === 0 ? (
                            <span className="balance-settled" style={{ color: '#10b981', fontWeight: '600', fontSize: '12px' }}>Settled</span>
                          ) : (
                            <span className="balance-warning" style={{ color: '#ef4444', fontWeight: '600', fontSize: '12px' }}>₱{d.balance.toLocaleString()} Due</span>
                          )}
                        </div>
                      </td>

                      {/* HOUSEKEEPING[cite: 11] */}
                      <td style={{ padding: '16px 20px' }}>
                        <span className={`status-tag ${getHkTag(d.housekeeping)}`} style={{ fontSize: '10px', padding: '3px 6px' }}>
                          {d.housekeeping}
                        </span>
                      </td>

                      {/* STATUS[cite: 11] */}
                      <td style={{ padding: '16px 20px' }}>
                        <span className={`status-tag ${getStatusTag(d.status)}`} style={{ textTransform: 'uppercase', fontSize: '10px', padding: '4px 8px' }}>
                          {d.status}
                        </span>
                      </td>

                      {/* ACTIONS[cite: 11] */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          
                          {/* Post Charge / Folio Button */}
                          <button 
                            title="View Folio / Add Charge"
                            onClick={() => handleViewFolio(d.id)}
                            style={{ 
                              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: '#f3f4f6', border: 'none', borderRadius: '6px',
                              color: '#6b7280', cursor: 'pointer'
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>

                          {/* Primary Check-Out Button */}
                          {!isCheckedOut ? (
                            <button 
                              className="btn" 
                              onClick={() => handleCheckOut(d.id)}
                              disabled={processingId === d.id}
                              style={{ 
                                padding: '0 16px', height: '32px', borderRadius: '6px', fontSize: '12px', 
                                fontWeight: '600', border: 'none', background: '#dc3545', color: '#fff' 
                              }}
                            >
                              {processingId === d.id ? 'Processing...' : 'Check-Out'}
                            </button>
                          ) : (
                            <div style={{ width: '95px' }}></div> 
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingFolio && (
        <GuestDetailModal
          booking={viewingFolio}
          title="Guest Folio"
          onClose={() => setViewingFolio(null)}
        />
      )}
    </section>
  );
}

export default Departures;
