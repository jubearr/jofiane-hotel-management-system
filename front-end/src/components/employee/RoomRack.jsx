import React, { useMemo, useState, useEffect } from 'react';
import { API_BASE, authFetch } from '../../utils/api';
import GuestDetailModal from './GuestDetailModal';
import PortalModal from '../common/PortalModal';
import { PageSkeleton } from '../common/SkeletonLoader';
import { Input, Select } from '../common/FormControls';

// Normalise housekeeping string from DB → RoomRack pill class
const toHKStatus = (s) => {
  if (!s) return 'dirty';
  const l = s.toLowerCase();
  if (l === 'clean')                          return 'clean';
  if (l === 'inspected')                      return 'inspection';
  if (l.includes('progress'))                 return 'dirty';   // in-progress → dirty (turnover)
  if (l === 'maintenance' || l === 'out of order') return 'maintenance';
  return 'dirty';
};

function RoomRack() {
  const [roomsData, setRoomsData]   = useState([]);
  const [bookings, setBookings]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [floor, setFloor]           = useState('all');
  const [status, setStatus]         = useState('all');
  const [query, setQuery]           = useState('');
  const [selectedRoom, setSelectedRoom]   = useState(null);
  const [selectedStay, setSelectedStay]   = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [blockingId, setBlockingId]       = useState(null);

  // Adapt a RoomRack stay (+ its room) into the shape GuestDetailModal expects.
  const stayToBooking = (room, stay) => ({
    guestName:  stay.guest,
    bookingId:  stay.bookingId,
    id:         stay.bookingId,
    roomNumber: room?.number,
    roomType:   room?.type,
    status:     stay.status === 'inhouse' ? 'Checked In' : 'Reserved',
    balance:    parseFloat(String(stay.balance || '0').replace(/,/g, '')) || 0,
    _id:        stay._id,
  });

  // Block a room for maintenance (sets Room.status = "Maintenance").
  const blockRoom = async (room) => {
    if (!room?._id) return;
    if (!window.confirm(`Block Room ${room.number} for maintenance? It will be marked out of service.`)) return;
    setBlockingId(room._id);
    try {
      const res = await authFetch(`/api/rooms/${room._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Maintenance', housekeeping: 'Maintenance' }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setRoomsData(prev => prev.map(r => r._id === room._id ? { ...r, status: 'Maintenance', housekeeping: 'Maintenance' } : r));
      setSelectedRoom(null);
    } catch (err) {
      console.error('Failed to block room:', err);
      alert('Could not block the room. Please try again.');
    } finally {
      setBlockingId(null);
    }
  };

  // 5-day window starting today
  const dates = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return {
      iso:  d.toISOString().slice(0, 10),
      day:  d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  }), []);

  // ── FETCH ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [roomsRes, bookingsRes] = await Promise.all([
          fetch(`${API_BASE}/api/rooms`),
          fetch(`${API_BASE}/api/bookings`),
        ]);
        const [rData, bData] = await Promise.all([
          roomsRes.ok ? roomsRes.json() : [],
          bookingsRes.ok ? bookingsRes.json() : [],
        ]);
        setRoomsData(rData);
        setBookings(bData);
      } catch (err) {
        console.error('RoomRack fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── BUILD ROOMS WITH STAYS ─────────────────────────────────
  // For each room, look at bookings that overlap the 5-day window
  // and generate stay blocks in the same format the original UI used.
  const rooms = useMemo(() => {
    if (!roomsData.length) return [];

    const windowStart = new Date(dates[0].iso);
    const windowEnd   = new Date(dates[4].iso);
    windowEnd.setHours(23, 59, 59);

    return roomsData.map(r => {
      const roomNum = String(r.room_number || '');
      const hk      = toHKStatus(r.housekeeping);

      // Find bookings for this room that overlap our 5-day window
      const roomBookings = bookings.filter(b => {
        if (String(b.room_number || '') !== roomNum) return false;
        const ci = new Date(b.dates?.check_in  || '');
        const co = new Date(b.dates?.check_out || '');
        return ci <= windowEnd && co >= windowStart;
      });

      // Convert each booking to a stay block
      const stays = roomBookings.map(b => {
        const ci = new Date(b.dates?.check_in  || '');
        const co = new Date(b.dates?.check_out || '');

        // start = how many days from windowStart (can be negative → clamp to 0)
        const start = Math.max(0, Math.round((ci - windowStart) / 86400000));
        // span  = how many days the stay covers within the window
        const rawEnd = Math.round((co - windowStart) / 86400000);
        const span  = Math.max(1, Math.min(rawEnd, 5) - start);

        const guestName = b.guest?.full_name || 'Guest';
        let stayStatus  = 'reserved';
        if (b.status === 'Checked In')  stayStatus = 'inhouse';
        if (b.status === 'Checked Out') stayStatus = 'turnover';
        if (b.status === 'Cancelled')   stayStatus = 'available';

        return {
          guest:      guestName,
          start,
          span,
          status:     stayStatus,
          bookingId:  b.booking_id,
          checkIn:    b.dates?.check_in,
          checkOut:   b.dates?.check_out,
          balance:    b.billing?.balance_due || '0.00',
          _id:        b._id,
        };
      });

      // If no bookings → show as available across all 5 days
      if (stays.length === 0) {
        stays.push({ guest: 'Available', start: 0, span: 5, status: 'available' });
      }

      return {
        _id:          r._id,
        number:       roomNum,
        type:         r.room_type_name || `Type ${r.type_id || ''}`,
        floor:        String(r.floor || '1'),
        housekeeping: hk,
        assigned_to:  r.assigned_to || '',
        stays,
      };
    });
  }, [roomsData, bookings, dates]);

  // ── FILTER ────────────────────────────────────────────────
  const counts = useMemo(() => rooms.reduce((acc, r) => {
    acc[r.housekeeping] = (acc[r.housekeeping] || 0) + 1;
    return acc;
  }, {}), [rooms]);

  const visibleRooms = rooms.filter(r =>
    (floor  === 'all' || r.floor        === floor) &&
    (status === 'all' || r.housekeeping === status) &&
    (!query || `${r.number} ${r.type}`.toLowerCase().includes(query.toLowerCase()))
  );

  // ── STAY POSITION (same logic as original) ────────────────
  const getStayPosition = (stay) => {
    const totalHalfDays = dates.length * 2;
    let startHalf = stay.start * 2;
    let halfDaySpan = stay.span * 2;

    if (stay.status === 'reserved')   startHalf += 1;
    else if (stay.status === 'inhouse') halfDaySpan = Math.max(1, halfDaySpan - 1);
    else if (stay.status === 'turnover') halfDaySpan = 1;

    return {
      gridColumn: `${startHalf + 1} / span ${Math.min(halfDaySpan, totalHalfDays - startHalf)}`,
    };
  };

  const openStayPeek = (e, room, stay) => {
    e.stopPropagation();
    if (stay.status === 'inhouse' || stay.status === 'reserved') {
      setSelectedStay({ room, stay });
    } else {
      setSelectedRoom(room);
    }
  };

  if (isLoading) {
    return (
      <section className="admin-tab-content active employee-module roomrack-module">
        <PageSkeleton variant="cards" label="Loading room rack" />
      </section>
    );
  }

  return (
    <section className="admin-tab-content active employee-module roomrack-module">
      <div className="page-header employee-page-header module-title-row">
        <div className="left">
          <span className="eyebrow">Rooms</span>
          <h2>Room Rack / Plan</h2>
          <p>Live room readiness and upcoming stays.</p>
        </div>
        <button
          className="btn btn-gold"
          type="button"
          onClick={() => alert('Select a room from the plan below, then choose “Block room (maintenance)” in its detail panel.')}
        >
          + Block Room
        </button>
      </div>

      {/* KPI ORBs */}
      <div className="roomrack-kpis">
        <div><span className="status-orb clean" /><p><strong>{counts.clean || 0}</strong><span>Clean & ready</span></p></div>
        <div><span className="status-orb dirty" /><p><strong>{counts.dirty || 0}</strong><span>Dirty / turnover</span></p></div>
        <div><span className="status-orb inspection" /><p><strong>{counts.inspection || 0}</strong><span>Needs inspection</span></p></div>
        <div><span className="status-orb maintenance" /><p><strong>{counts.maintenance || 0}</strong><span>Out of service</span></p></div>
      </div>

      <div className="panel roomrack-panel">
        {/* Toolbar */}
        <div className="roomrack-toolbar">
          <div>
            <h3>5-day room plan</h3>
            <p>{visibleRooms.length} rooms shown · Live from database</p>
          </div>
          <div className="roomrack-filters">
            <label className="module-search">
              <i className="fas fa-search" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Room or type" />
            </label>
            <Select value={floor} onChange={e => setFloor(e.target.value)}>
              <option value="all">All floors</option>
              {[...new Set(rooms.map(r => r.floor))].sort().map(f => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </Select>
            <Select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="all">All room status</option>
              <option value="clean">Clean</option>
              <option value="dirty">Dirty</option>
              <option value="inspection">Inspection</option>
              <option value="maintenance">Maintenance</option>
            </Select>
          </div>
        </div>

        {/* Grid */}
        <div className="room-plan-scroll">
          {/* Header row */}
          <div className="room-plan-grid room-plan-header">
            <div>Room / readiness</div>
            {dates.map((item, i) => (
              <div className={i === 0 ? 'today' : ''} key={item.iso}>
                <strong>{item.day}</strong>
                <span>{item.date}</span>
              </div>
            ))}
          </div>

          {/* Room rows */}
          {visibleRooms.map(room => (
            <div
              className="room-plan-grid room-plan-row"
              key={room.number}
              onClick={() => setSelectedRoom(room)}
            >
              <div className="room-identity">
                <p>
                  <span>
                    <strong>{room.number}</strong>
                    <em className={`housekeeping-pill ${room.housekeeping}`}>{room.housekeeping}</em>
                  </span>
                  <small>{room.type}</small>
                </p>
              </div>
              <div className="stay-track">
                {room.stays.map((stay, i) => (
                  <button
                    type="button"
                    key={`${stay.guest}-${i}`}
                    className={`stay-block ${stay.status}`}
                    style={getStayPosition(stay)}
                    onClick={e => openStayPeek(e, room, stay)}
                    title={`${stay.guest} · ${stay.span} day(s)`}
                  >
                    <b>{stay.guest}</b>
                    <small>{stay.status === 'inhouse' ? 'In-house' : stay.status}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {visibleRooms.length === 0 && (
            <div className="roomrack-empty">No rooms match these filters.</div>
          )}
        </div>

        <div className="roomrack-legend">
          <span><i className="inhouse" />In-house</span>
          <span><i className="reserved" />Reserved</span>
          <span><i className="available" />Available</span>
          <span><i className="turnover" />Turnover</span>
          <span><i className="maintenance" />Maintenance</span>
        </div>
      </div>

      {/* Room detail pop-up modal */}
      {selectedRoom && (
        <PortalModal maxWidth={420}>
          <div className="roomrack-modal-body" role="dialog" aria-modal="true" aria-label={`Room ${selectedRoom.number} details`}>
            <button className="drawer-close" onClick={() => setSelectedRoom(null)} aria-label="Close">×</button>
            <span className="eyebrow">Room details</span>
            <h3>Room {selectedRoom.number}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{selectedRoom.type} · Floor {selectedRoom.floor}</p>
            <div className={`drawer-readiness ${selectedRoom.housekeeping}`} style={{ marginTop: '12px' }}>
              <span className={`status-orb ${selectedRoom.housekeeping}`} />
              {selectedRoom.housekeeping}
            </div>
            {selectedRoom.assigned_to && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Assigned to: <strong>{selectedRoom.assigned_to}</strong>
              </p>
            )}
            <h4>Upcoming plan</h4>
            {selectedRoom.stays.map((stay, i) => (
              <div className="drawer-stay" key={i}>
                <span className={stay.status} />
                <div>
                  <strong>{stay.guest}</strong>
                  <small>{stay.span} day{stay.span > 1 ? 's' : ''} · {stay.status}</small>
                </div>
              </div>
            ))}
            {(() => {
              const activeStay = selectedRoom.stays.find(s => s.status !== 'available' && s._id);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '18px' }}>
                  {activeStay && (
                    <button className="btn btn-gold" type="button" onClick={() => { setViewingBooking(stayToBooking(selectedRoom, activeStay)); setSelectedRoom(null); }}>
                      Open room profile
                    </button>
                  )}
                  {selectedRoom.housekeeping !== 'maintenance' && (
                    <button className="btn" type="button" disabled={blockingId === selectedRoom._id} onClick={() => blockRoom(selectedRoom)}>
                      {blockingId === selectedRoom._id ? 'Blocking…' : 'Block room (maintenance)'}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </PortalModal>
      )}

      {/* Stay peek pop-up modal */}
      {selectedStay && (
        <PortalModal maxWidth={420}>
          <div className="stay-peek-card" role="dialog" aria-modal="true" aria-label={`${selectedStay.stay.guest} reservation quick actions`}>
            <div className="stay-peek-heading">
              <div>
                <span className="eyebrow">Quick reservation peek</span>
                <h3>{selectedStay.stay.guest}</h3>
              </div>
              <button className="drawer-close" type="button" onClick={() => setSelectedStay(null)} aria-label="Close">×</button>
            </div>
            <div className="peek-status-row">
              <span className={`peek-status ${selectedStay.stay.status}`}>
                {selectedStay.stay.status === 'inhouse' ? 'In-house' : 'Confirmed'}
              </span>
              <span>{selectedStay.stay.span} night{selectedStay.stay.span > 1 ? 's' : ''}</span>
            </div>
            <div className="peek-room-summary">
              <span>Room</span>
              <strong>{selectedStay.room.number}</strong>
              <small>{selectedStay.room.type}</small>
            </div>
            <dl className="peek-facts">
              <div><dt>Check-in</dt><dd>{selectedStay.stay.checkIn || '—'}</dd></div>
              <div><dt>Check-out</dt><dd>{selectedStay.stay.checkOut || '—'}</dd></div>
              <div>
                <dt>Balance</dt>
                <dd>
                  {parseFloat((selectedStay.stay.balance || '0').replace(/,/g, '')) === 0
                    ? '₱0 · Settled'
                    : `₱${selectedStay.stay.balance} Due`}
                </dd>
              </div>
              <div><dt>Booking</dt><dd>{selectedStay.stay.bookingId || '—'}</dd></div>
            </dl>
            <div className="peek-actions">
              <button className="btn" type="button" onClick={() => { setViewingBooking(stayToBooking(selectedStay.room, selectedStay.stay)); setSelectedStay(null); }}>
                <i className="fas fa-pen" /> Edit stay
              </button>
              <button className="btn" type="button" onClick={() => window.print()}>
                <i className="fas fa-print" /> Print folio
              </button>
              <button className="btn btn-gold" type="button" onClick={() => { setViewingBooking(stayToBooking(selectedStay.room, selectedStay.stay)); setSelectedStay(null); }}>View booking</button>
            </div>
          </div>
        </PortalModal>
      )}

      {viewingBooking && (
        <GuestDetailModal
          booking={viewingBooking}
          title="Booking Details"
          onClose={() => setViewingBooking(null)}
        />
      )}
    </section>
  );
}

export default RoomRack;
