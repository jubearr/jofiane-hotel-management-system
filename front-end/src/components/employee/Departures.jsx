import React, { useState, useEffect } from 'react';

// Mock data 
const MOCK_DEPARTURES = [
  {
    id: 102,
    guestName: 'John Smith',
    vip: true,
    adults: 2,
    children: 0,
    bookingId: 'BK-102',
    roomNumber: '304',
    roomType: 'Deluxe King',
    scheduledDeparture: '2026-08-08T11:00:00',
    status: 'Pending', 
    balance: 0.00,
    prepaid: true,
    deposit: 200.00,
    depositType: 'Credit Card',
    housekeeping: 'Clean',
    alerts: ['Wake-up call 06:30', 'Taxi 08:00'],
    nightsStayed: 3,
    totalNights: 3,
    lateRequest: false,
  },
  {
    id: 105,
    guestName: 'Jane Doe',
    vip: false,
    adults: 1,
    children: 0,
    bookingId: 'BK-105',
    roomNumber: '507',
    roomType: 'Suite',
    scheduledDeparture: '2026-08-08T12:00:00',
    status: 'Checked-Out',
    balance: 150.00,
    prepaid: false,
    deposit: 300.00,
    depositType: 'Cash',
    housekeeping: 'Dirty',
    alerts: ['Minibar not checked'],
    nightsStayed: 2,
    totalNights: 2,
    lateRequest: false,
  },
  {
    id: 108,
    guestName: 'Robert Chen',
    vip: false,
    adults: 2,
    children: 1,
    bookingId: 'BK-108',
    roomNumber: '212',
    roomType: 'Standard',
    scheduledDeparture: '2026-08-08T10:00:00',
    status: 'Overdue', 
    balance: 80.00,
    prepaid: false,
    deposit: 0.00,
    depositType: null,
    housekeeping: 'Dirty',
    alerts: ['Overdue: not checked out'],
    nightsStayed: 1,
    totalNights: 1,
    lateRequest: false,
  },
  {
    id: 110,
    guestName: 'Maria Santos',
    vip: true,
    adults: 2,
    children: 2,
    bookingId: 'BK-110',
    roomNumber: '420',
    roomType: 'Deluxe King',
    scheduledDeparture: '2026-08-08T14:00:00',
    status: 'Late Requested',
    balance: 0.00,
    prepaid: true,
    deposit: 500.00,
    depositType: 'Credit Card',
    housekeeping: 'Clean',
    alerts: ['Late checkout 14:00', 'Extra towel request'],
    nightsStayed: 4,
    totalNights: 4,
    lateRequest: true,
  },
];

function Departures() {
  // 1. UI FILTERS STATE
  const [selectedDate, setSelectedDate] = useState('2026-08-08'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roomTypeFilter, setRoomTypeFilter] = useState('All');

  // 2. BACKEND-READY NETWORK STATES
  const [departures, setDepartures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);

  // 3. FETCH DATA 
  useEffect(() => {
    const fetchDepartures = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // BACKEND CONNECTION
        // const response = await fetch(`http://localhost:8080/api/departures?date=${selectedDate}`);
        // const data = await response.json();
        
        // Simulate network delay for now
        await new Promise(resolve => setTimeout(resolve, 800)); 
        setDepartures(MOCK_DEPARTURES); // Replace this with `setDepartures(data)`
      } catch (err) {
        console.error('Failed to fetch departures', err);
        setError('Failed to connect to the server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepartures();
  }, [selectedDate]);

  // 4. ASYNC ACTION HANDLERS
  const handleCheckOut = async (id) => {
    setProcessingId(id);
    try {
      // await fetch(`http://localhost:8080/api/bookings/${id}/checkout`, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log('Successfully checked out booking:', id);
      // You would typically refetch the data here, or update local state
    } catch (err) {
      alert("Error checking out guest.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewFolio = (id) => console.log('View folio for:', id);
  const handlePostCharge = (id) => console.log('Post charge for', id);

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
    <section className="admin-tab-content active">
      
      {/* PAGE HEADER[cite: 11] */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="left">
          <h2>Departures & Check-Outs</h2>
          <p>Manage today's expected departures, final billing, and room turnovers.</p>
        </div>
        <div className="right" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '4px', alignItems: 'center' }}>
            <button 
              className="btn btn-sm" 
              style={{ background: 'transparent', border: 'none', boxShadow: 'none', color: '#4b5563' }}
              onClick={() => setSelectedDate(prev => {
                const d = new Date(prev); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10);
              })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '13px', border: 'none', background: 'transparent', outline: 'none', fontWeight: '600', color: '#111827' }}
            />
            <button 
              className="btn btn-sm" 
              style={{ background: 'transparent', border: 'none', boxShadow: 'none', color: '#4b5563' }}
              onClick={() => setSelectedDate(prev => {
                const d = new Date(prev); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10);
              })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <button className="btn btn-sm btn-gold" style={{ borderRadius: '8px', padding: '8px 16px' }} onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}>
            Today
          </button>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '15px' }}>{error}</div>}

      {/* KPI METRICS GRID */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>TOTAL EXPECTED</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0' }}>{isLoading ? '-' : departures.length}</span>
          <span className="sub" style={{ color: '#6b7280' }}>Departures for selected date</span>
        </div>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>PENDING / OVERDUE</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0' }}>{isLoading ? '-' : departures.filter(d => d.status === 'Pending' || d.status === 'Overdue').length}</span>
          <span className="sub" style={{ color: '#dc3545', fontWeight: '500' }}>Requires Check-Out</span>
        </div>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>CHECKED-OUT</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0' }}>{isLoading ? '-' : departures.filter(d => d.status === 'Checked-Out').length}</span>
          <span className="sub" style={{ color: '#6b7280' }}>Successfully departed</span>
        </div>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>BALANCE DUE</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0' }}>{isLoading ? '-' : departures.filter(d => d.balance > 0).length}</span>
          <span className="sub" style={{ color: '#6b7280' }}>Unsettled folios</span>
        </div>
      </div>

      {/* MAIN LIST PANEL */}
      <div className="panel" style={{ borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        
        {/* FILTERS[cite: 11] */}
        <div className="panel-header" style={{ padding: '20px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>Departure Manifest</h3>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#4b5563', cursor: 'pointer' }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="Checked-Out">Checked-Out</option>
            </select>

            <select 
              value={roomTypeFilter} 
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#4b5563', cursor: 'pointer' }}
            >
              <option value="All">All Room Types</option>
              <option value="Deluxe King">Deluxe King</option>
              <option value="Suite">Suite</option>
              <option value="Standard">Standard</option>
            </select>

            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
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
        <div className="table-wrap" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eaeaea' }}>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', width: '40px' }}><input type="checkbox" /></th>
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
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Fetching departures from server...
                  </td>
                </tr>
              ) : filteredDepartures.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No departures match your current filters.
                  </td>
                </tr>
              ) : (
                filteredDepartures.map((d) => {
                  const depDate = new Date(d.scheduledDeparture);
                  const isCheckedOut = d.status === 'Checked-Out';

                  return (
                    <tr key={d.id} style={{ 
                      borderBottom: '1px solid #f3f4f6', 
                      background: d.vip ? '#fffdf0' : 'transparent', 
                      opacity: isCheckedOut ? 0.6 : 1, // Dim row if checked out[cite: 11]
                      transition: 'background 0.2s' 
                    }}>
                      
                      {/* CHECKBOX */}
                      <td style={{ padding: '16px 20px' }}>
                        <input type="checkbox" disabled={isCheckedOut}/>
                      </td>

                      {/* ROOM[cite: 11] */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ color: 'var(--gold, #c5a059)', fontWeight: 'bold', fontSize: '16px' }}>{d.roomNumber}</span>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{d.roomType}</div>
                      </td>

                      {/* GUEST INFO[cite: 11] */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', color: '#111827', fontSize: '14px' }}>
                          {d.vip && <i className="fas fa-star" style={{ color: '#c5a059', fontSize: 12 }} title="VIP Guest"></i>}
                          {d.guestName}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                          {d.bookingId} • {d.adults}A {d.children > 0 ? `${d.children}C` : ''} 
                        </span>
                        {d.alerts.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="fas fa-exclamation-circle"></i> {d.alerts[0]} {d.alerts.length > 1 ? `(+${d.alerts.length - 1})` : ''}
                          </div>
                        )}
                      </td>

                      {/* TIME & BALANCE[cite: 11] */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: '500', color: '#111827', fontSize: '13px' }}>
                           {depDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                           {d.lateRequest && <span style={{ color: '#ea580c', fontSize: '11px', marginLeft: '6px' }}>(Late Request)</span>}
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          {d.balance === 0 ? (
                            <span style={{ color: '#10b981', fontWeight: '600', fontSize: '12px' }}>Settled</span>
                          ) : (
                            <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '12px' }}>₱{d.balance.toLocaleString()} Due</span>
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
    </section>
  );
}

export default Departures;