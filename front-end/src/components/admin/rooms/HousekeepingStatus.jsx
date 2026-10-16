import React, { useState, useEffect } from 'react';

function HousekeepingStatus() {
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [staff, setStaff] = useState([]);

  // Filters
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { applyFilters(); }, [rooms, filterFloor, filterStatus, filterStaff, showPriorityOnly]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await fetch('http://localhost:8080/api/admin/housekeeping');
      // const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockStaff = [
        { id: 1, name: 'Maria Santos' },
        { id: 2, name: 'Rosa Villanueva' },
        { id: 3, name: 'Elena Cruz' },
        { id: 4, name: 'Carmen Diaz' }
      ];

      const mockRooms = [
        { id: 1, number: '101', floor: 1, type: 'Standard', cleanStatus: 'clean', assignedTo: 'Maria Santos', priority: false, notes: '', lastCleaned: '2026-08-10T08:30:00' },
        { id: 2, number: '102', floor: 1, type: 'Standard', cleanStatus: 'dirty', assignedTo: 'Maria Santos', priority: true, notes: 'Checkout at 11am — arrival at 2pm', lastCleaned: '2026-08-09T09:00:00' },
        { id: 3, number: '103', floor: 1, type: 'Deluxe', cleanStatus: 'in-progress', assignedTo: 'Rosa Villanueva', priority: false, notes: '', lastCleaned: '2026-08-09T10:15:00' },
        { id: 4, number: '104', floor: 1, type: 'Standard', cleanStatus: 'inspected', assignedTo: 'Maria Santos', priority: false, notes: '', lastCleaned: '2026-08-10T09:45:00' },
        { id: 5, number: '201', floor: 2, type: 'Deluxe', cleanStatus: 'dirty', assignedTo: 'Rosa Villanueva', priority: true, notes: 'VIP arrival at 1pm', lastCleaned: '2026-08-09T08:00:00' },
        { id: 6, number: '202', floor: 2, type: 'Deluxe', cleanStatus: 'clean', assignedTo: 'Rosa Villanueva', priority: false, notes: '', lastCleaned: '2026-08-10T10:30:00' },
        { id: 7, number: '203', floor: 2, type: 'Premium', cleanStatus: 'dirty', assignedTo: 'Elena Cruz', priority: false, notes: 'Guest requested no cleaning today', lastCleaned: '2026-08-08T09:00:00' },
        { id: 8, number: '204', floor: 2, type: 'Premium', cleanStatus: 'in-progress', assignedTo: 'Elena Cruz', priority: true, notes: 'Express turnover needed', lastCleaned: '2026-08-09T11:00:00' },
        { id: 9, number: '301', floor: 3, type: 'Suite', cleanStatus: 'clean', assignedTo: 'Carmen Diaz', priority: false, notes: '', lastCleaned: '2026-08-10T07:45:00' },
        { id: 10, number: '302', floor: 3, type: 'Suite', cleanStatus: 'dirty', assignedTo: 'Carmen Diaz', priority: false, notes: '', lastCleaned: '2026-08-09T10:00:00' },
        { id: 11, number: '303', floor: 3, type: 'Premium', cleanStatus: 'inspected', assignedTo: 'Elena Cruz', priority: false, notes: '', lastCleaned: '2026-08-10T08:15:00' },
        { id: 12, number: '304', floor: 3, type: 'Suite', cleanStatus: 'dirty', assignedTo: 'Carmen Diaz', priority: true, notes: 'Checkout + VIP check-in at 3pm', lastCleaned: '2026-08-09T09:30:00' },
        { id: 13, number: '401', floor: 4, type: 'Presidential', cleanStatus: 'clean', assignedTo: 'Carmen Diaz', priority: false, notes: '', lastCleaned: '2026-08-10T06:30:00' },
        { id: 14, number: '402', floor: 4, type: 'Presidential', cleanStatus: 'in-progress', assignedTo: 'Rosa Villanueva', priority: false, notes: 'Deep clean scheduled', lastCleaned: '2026-08-08T07:00:00' },
      ];

      setStaff(mockStaff);
      setRooms(mockRooms);
    } catch (err) {
      console.error('Failed to fetch housekeeping data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...rooms];
    if (filterFloor !== 'all') result = result.filter(r => r.floor === parseInt(filterFloor));
    if (filterStatus !== 'all') result = result.filter(r => r.cleanStatus === filterStatus);
    if (filterStaff !== 'all') result = result.filter(r => r.assignedTo === filterStaff);
    if (showPriorityOnly) result = result.filter(r => r.priority);
    setFilteredRooms(result);
  };

  const markStatus = (roomId, newStatus) => {
    // TODO: PUT to API
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, cleanStatus: newStatus, lastCleaned: newStatus === 'clean' || newStatus === 'inspected' ? new Date().toISOString() : r.lastCleaned } : r));
  };

  const assignStaff = (roomId, staffName) => {
    // TODO: PUT to API
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, assignedTo: staffName } : r));
  };

  const updateNote = (roomId, note) => {
    // TODO: PUT to API
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, notes: note } : r));
  };

  // Stats
  const totalCount = rooms.length;
  const cleanCount = rooms.filter(r => r.cleanStatus === 'clean').length;
  const inspectedCount = rooms.filter(r => r.cleanStatus === 'inspected').length;
  const dirtyCount = rooms.filter(r => r.cleanStatus === 'dirty').length;
  const inProgressCount = rooms.filter(r => r.cleanStatus === 'in-progress').length;
  const priorityCount = rooms.filter(r => r.priority).length;
  const doneCount = cleanCount + inspectedCount;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const floors = [...new Set(rooms.map(r => r.floor))].sort();

  const getStatusColor = (status) => {
    switch (status) {
      case 'clean': return { bg: '#d1fae5', text: '#065f46', dot: '#10b981' };
      case 'inspected': return { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' };
      case 'dirty': return { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' };
      case 'in-progress': return { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' };
      default: return { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'clean': return 'Clean';
      case 'inspected': return 'Inspected';
      case 'dirty': return 'Dirty';
      case 'in-progress': return 'In Progress';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <section className="admin-tab-content active">
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading housekeeping status...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-tab-content active">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Housekeeping Status</h2>
          <p>Real-time cleanliness tracking</p>
        </div>
        <div className="right">
          <button
            className={`btn btn-sm ${showPriorityOnly ? 'btn-gold' : ''}`}
            onClick={() => setShowPriorityOnly(!showPriorityOnly)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Priority ({priorityCount})
          </button>
        </div>
      </div>

      {/* DAILY PROGRESS TRACKER */}
      <div className="panel" style={{ padding: '22px 28px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>

          {/* Progress bar + fraction */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '250px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>Daily Progress</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gold)' }}>{doneCount} / {totalCount} rooms</span>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-input)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--gold) 0%, #4a3728 100%)', borderRadius: '5px', transition: 'width 0.4s ease' }}></div>
              </div>
            </div>
            <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{progressPct}%</span>
          </div>

          {/* Status breakdown pills */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { status: 'clean', count: cleanCount },
              { status: 'inspected', count: inspectedCount },
              { status: 'in-progress', count: inProgressCount },
              { status: 'dirty', count: dirtyCount }
            ].map(item => {
              const colors = getStatusColor(item.status);
              return (
                <button
                  key={item.status}
                  onClick={() => setFilterStatus(filterStatus === item.status ? 'all' : item.status)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '6px',
                    background: filterStatus === item.status ? colors.bg : 'var(--bg-input)',
                    border: filterStatus === item.status ? `1px solid ${colors.dot}` : '1px solid var(--border-light)',
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.dot }}></span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: colors.text }}>{getStatusLabel(item.status)}</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: colors.text }}>{item.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '22px', flexWrap: 'wrap' }}>
        <select className="floor-dropdown" value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}>
          <option value="all">All Floors</option>
          {floors.map(f => <option key={f} value={f}>Floor {f}</option>)}
        </select>
        <select className="floor-dropdown" value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)}>
          <option value="all">All Staff</option>
          {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {/* ROOM GRID */}
      {filteredRooms.length === 0 ? (
        <div className="panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No rooms match the current filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              staff={staff}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
              onMarkStatus={markStatus}
              onAssignStaff={assignStaff}
              onUpdateNote={updateNote}
            />
          ))}
        </div>
      )}

    </section>
  );
}

/* ============================================================
   ROOM CARD
   ============================================================ */
function RoomCard({ room, staff, getStatusColor, getStatusLabel, onMarkStatus, onAssignStaff, onUpdateNote }) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteValue, setNoteValue] = useState(room.notes);
  const colors = getStatusColor(room.cleanStatus);

  const handleSaveNote = () => {
    onUpdateNote(room.id, noteValue);
    setShowNoteInput(false);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: room.priority ? '2px solid var(--gold)' : '1px solid var(--border-light)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow 0.2s ease',
      position: 'relative'
    }}>
      {/* Priority badge */}
      {room.priority && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Priority
        </div>
      )}

      {/* Header: Room number + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: colors.text }}>{room.number}</span>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Room {room.number}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Floor {room.floor} · {room.type}</div>
        </div>
      </div>

      {/* Status pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.dot }}></span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: colors.text }}>{getStatusLabel(room.cleanStatus)}</span>
      </div>

      {/* Assigned staff */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Assigned to</label>
        <select
          className="floor-dropdown"
          style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
          value={room.assignedTo}
          onChange={(e) => onAssignStaff(room.id, e.target.value)}
        >
          <option value="">Unassigned</option>
          {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {/* Notes */}
      {room.notes && !showNoteInput && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', borderLeft: '3px solid var(--gold)', cursor: 'pointer' }} onClick={() => setShowNoteInput(true)}>
          {room.notes}
        </div>
      )}

      {showNoteInput && (
        <div style={{ marginBottom: '12px' }}>
          <textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder="Add a note..."
            style={{ width: '100%', padding: '8px 10px', fontSize: '12px', border: '1px solid var(--border-light)', borderRadius: '6px', background: 'var(--bg-input)', minHeight: '50px', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <button className="btn btn-xs btn-gold" onClick={handleSaveNote}>Save</button>
            <button className="btn btn-xs" onClick={() => setShowNoteInput(false)}>Cancel</button>
          </div>
        </div>
      )}

      {!room.notes && !showNoteInput && (
        <button
          onClick={() => setShowNoteInput(true)}
          style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '12px', padding: 0 }}
        >
          + Add note
        </button>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
        {room.cleanStatus !== 'clean' && (
          <button className="btn btn-xs" style={{ background: '#d1fae5', color: '#065f46', borderColor: '#a7f3d0' }} onClick={() => onMarkStatus(room.id, 'clean')}>
            Mark Clean
          </button>
        )}
        {room.cleanStatus !== 'inspected' && room.cleanStatus === 'clean' && (
          <button className="btn btn-xs" style={{ background: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' }} onClick={() => onMarkStatus(room.id, 'inspected')}>
            Mark Inspected
          </button>
        )}
        {room.cleanStatus === 'dirty' && (
          <button className="btn btn-xs" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }} onClick={() => onMarkStatus(room.id, 'in-progress')}>
            Start Cleaning
          </button>
        )}
        {room.cleanStatus !== 'dirty' && room.cleanStatus !== 'in-progress' && (
          <button className="btn btn-xs" style={{ color: 'var(--text-muted)' }} onClick={() => onMarkStatus(room.id, 'dirty')}>
            Mark Dirty
          </button>
        )}
      </div>
    </div>
  );
}

export default HousekeepingStatus;
