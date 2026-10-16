import React, { useState, useRef } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { authFetch } from '../../utils/api';
import GuestDetailModal from './GuestDetailModal';
import { TableSkeletonRows } from '../common/SkeletonLoader';


function InHouseGuests() {
  // BACKEND-READY STATES
  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [viewingGuest, setViewingGuest] = useState(null);
  const firstLoad = useRef(true);   // only show the full loader on the first fetch

  // FILTERS
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('All');

  // DATA FETCHING
  const fetchGuests = async () => {
    // Only blank the screen on the very first load; polling refreshes silently
    // so the table doesn't flicker every 10 seconds.
    if (firstLoad.current) setIsLoading(true);
    try {
      const res = await authFetch('/api/guests/in-house');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const normalized = data.map(g => ({
        id: g._id,
        guestName: g.guest?.full_name || '',
        roomNumber: g.room_number || '',
        roomType: g.room_number || '',
        checkIn: g.dates?.check_in || '',
        expectedDeparture: g.dates?.check_out || '',
        nights: parseInt(g.dates?.nights) || 0,
        balance: parseFloat((g.billing?.balance_due || '0').replace(/,/g, '')) || 0,
        deposit: parseFloat((g.billing?.total_paid || '0').replace(/,/g, '')) || 0,
        status: 'In-House',
        housekeeping: 'Unknown',
        _id: g._id,
      }));
      setGuests(normalized);
    } catch (error) {
      console.error('Failed to fetch in-house guests:', error);
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  usePolling(fetchGuests, 10000);

  // ASYNC CHECKOUT
  const handleCheckOut = async (id) => {
    const guest = guests.find(g => g.id === id);
    if (!guest) return;
    setProcessingId(id);
    try {
      const res = await authFetch(`/api/bookings/${guest._id}/checkout`, { method: 'POST' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      // Remove guest from the in-house list after successful checkout
      setGuests(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Guest checkout failed. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // FILTER LOGIC
  const filteredGuests = guests.filter((g) => {
    if (balanceFilter === 'Balance Due' && g.balance <= 0) return false;
    if (balanceFilter === 'Settled' && g.balance > 0) return false;
    if (searchQuery
      && !g.guestName.toLowerCase().includes(searchQuery.toLowerCase())
      && !String(g.roomNumber).includes(searchQuery)) return false;
    return true;
  });

  return (
    <section className="admin-tab-content active employee-module inhouse-module">

      {/* PAGE HEADER */}
      <div className="page-header employee-page-header" style={{ marginBottom: '24px' }}>
        <div className="left">
          <h2>In-House Guests</h2>
          <p>Manage currently occupied rooms, post charges, and process check-outs.</p>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="kpi-grid operational-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>TOTAL IN-HOUSE</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0', display: 'block' }}>{isLoading ? '-' : guests.length}</span>
          <span className="sub" style={{ color: '#6b7280' }}>Currently occupied rooms</span>
        </div>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>BALANCE DUE</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0', display: 'block' }}>{isLoading ? '-' : guests.filter(g => g.balance > 0).length}</span>
          <span className="sub" style={{ color: '#dc3545', fontWeight: '500' }}>Unsettled folios</span>
        </div>
        <div className="kpi-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span className="lbl" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px' }}>SETTLED</span>
          <span className="val" style={{ fontSize: '28px', color: '#111827', margin: '8px 0', display: 'block' }}>{isLoading ? '-' : guests.filter(g => g.balance === 0).length}</span>
          <span className="sub" style={{ color: '#6b7280' }}>Fully paid</span>
        </div>
      </div>

      {/* MAIN LIST PANEL */}
      <div className="panel manifest-panel guest-directory-panel" style={{ borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>

        {/* TOOLBAR */}
        <div className="panel-header manifest-toolbar" style={{ padding: '20px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>Guest Directory</h3>

          <div className="manifest-filters" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', color: '#4b5563', cursor: 'pointer' }}
            >
              <option value="All">All Balances</option>
              <option value="Balance Due">Balance Due</option>
              <option value="Settled">Settled</option>
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

        {/* TABLE */}
        <div className="table-wrap manifest-table" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eaeaea' }}>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Room</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Guest Information</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Stay</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Balance</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows columns={6} label="Loading in-house guests" />
              ) : filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No in-house guests match
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}>
                    {/* ROOM */}
                    <td style={{ padding: '16px 20px' }}>
                      <span className="room-number" style={{ color: 'var(--gold, #c5a059)', fontWeight: 'bold', fontSize: '16px' }}>{guest.roomNumber}</span>
                      <div className="secondary-table-text" style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{guest.roomType}</div>
                    </td>

                    {/* GUEST INFO */}
                    <td style={{ padding: '16px 20px' }}>
                      <span className="primary-table-text" style={{ fontWeight: '600', display: 'block', color: '#111827', fontSize: '14px' }}>{guest.guestName}</span>
                    </td>

                    {/* STAY */}
                    <td style={{ padding: '16px 20px' }}>
                      <div className="primary-table-text" style={{ fontSize: '13px', color: '#111827' }}>{guest.checkIn || '—'} → {guest.expectedDeparture || '—'}</div>
                      <div className="secondary-table-text" style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{guest.nights} night{guest.nights === 1 ? '' : 's'}</div>
                    </td>

                    {/* BALANCE */}
                    <td style={{ padding: '16px 20px' }}>
                      {guest.balance === 0 ? (
                        <span className="balance-settled" style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>Settled</span>
                      ) : (
                        <span className="balance-warning" style={{ color: '#ef4444', fontWeight: '600', fontSize: '13px' }}>₱{guest.balance.toLocaleString()} Due</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td style={{ padding: '16px 20px' }}>
                      <span className="status-tag tag-success" style={{ textTransform: 'uppercase', fontSize: '10px', padding: '4px 8px' }}>{guest.status}</span>
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          title="View Details"
                          onClick={() => setViewingGuest(guest)}
                          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', border: 'none', borderRadius: '6px', color: '#6b7280', cursor: 'pointer' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button
                          onClick={() => handleCheckOut(guest.id)}
                          disabled={processingId === guest.id}
                          className="btn"
                          style={{ padding: '0 16px', height: '32px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: 'none', background: '#dc3545', color: '#fff' }}
                        >
                          {processingId === guest.id ? 'Processing...' : 'Check-Out'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingGuest && (
        <GuestDetailModal
          booking={viewingGuest}
          title="Guest Details"
          onClose={() => setViewingGuest(null)}
        />
      )}
    </section>
  );
}

export default InHouseGuests;
