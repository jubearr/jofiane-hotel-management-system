import React, { useState, useEffect, useRef, memo } from 'react';
import { usePolling } from '../../../hooks/usePolling';
import { authFetch } from '../../../utils/api';
import { Input, Select, Textarea } from '../../common/FormControls';
import { PageSkeleton } from '../../common/SkeletonLoader';

function HousekeepingStatus() {
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const firstLoad = useRef(true);
  const roomsSignature = useRef('');   // cheap change-detection fingerprint

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);

  useEffect(() => { applyFilters(); }, [rooms, searchQuery, filterFloor, filterStatus, filterStaff, showPriorityOnly]);

  const fetchData = async () => {
    // Only show the full loader on the very first fetch — polls refresh silently
    if (firstLoad.current) setIsLoading(true);
    try {
      const [roomsRes, empRes] = await Promise.all([
        authFetch('/api/rooms'),
        authFetch('/api/employees?department=Housekeeping'),
      ]);
      if (!roomsRes.ok) throw new Error(`Server error: ${roomsRes.status}`);

      const [roomsData, empData] = await Promise.all([
        roomsRes.json(),
        empRes.ok ? empRes.json() : [],
      ]);

      // Normalise rooms collection → component shape
      const normalized = roomsData.map(r => ({
        id:          r._id,
        _id:         r._id,
        number:      String(r.room_number || ''),
        floor:       r.floor || 1,
        type:        r.room_type_name || `Type ${r.type_id || ''}`,
        cleanStatus: normalizeHKStatus(r.housekeeping),
        assignedTo:  r.assigned_to || '',
        priority:    r.priority || false,
        notes:       r.notes || '',
        lastCleaned: r.last_cleaned || r.updatedAt || null,
      }));

      // Build a fingerprint of just the fields the UI shows.
      // If nothing changed since the last poll, skip setRooms entirely —
      // this stops the whole grid from re-rendering / flickering.
      const signature = JSON.stringify(
        normalized.map(r => `${r._id}:${r.cleanStatus}:${r.assignedTo}:${r.priority}:${r.notes}`)
      );
      if (signature !== roomsSignature.current) {
        roomsSignature.current = signature;
        setRooms(normalized);
      }

      // Staff list (only update if changed too)
      const staffList = empData.map(e => ({ id: e._id, name: e.full_name || '' }));
      const finalStaff = staffList.length ? staffList : [
        { id: 1, name: 'Maria Santos' },
        { id: 2, name: 'Rosa Villanueva' },
        { id: 3, name: 'Elena Cruz' },
        { id: 4, name: 'Carmen Diaz' },
      ];
      setStaff(prev =>
        JSON.stringify(prev) === JSON.stringify(finalStaff) ? prev : finalStaff
      );
    } catch (err) {
      console.error('Failed to fetch housekeeping data:', err);
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  usePolling(fetchData, 12000);

  // Normalise DB housekeeping string → component cleanStatus key
  // Handles all casing variants: "CLEAN", "Clean", "clean", "In Progress", "IN PROGRESS"
  const normalizeHKStatus = (s) => {
    if (!s) return 'dirty';
    const l = s.toLowerCase().trim();
    if (l === 'clean')                              return 'clean';
    if (l === 'inspected')                          return 'inspected';
    if (l === 'in progress' || l === 'in-progress') return 'in-progress';
    if (l === 'dirty')                              return 'dirty';
    return 'dirty';
  };

  const applyFilters = () => {
    let result = [...rooms];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.number.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        (r.assignedTo || '').toLowerCase().includes(q)
      );
    }
    if (filterFloor !== 'all') result = result.filter(r => r.floor === parseInt(filterFloor));
    if (filterStatus !== 'all') result = result.filter(r => r.cleanStatus === filterStatus);
    if (filterStaff !== 'all') result = result.filter(r => r.assignedTo === filterStaff);
    if (showPriorityOnly) result = result.filter(r => r.priority);
    setFilteredRooms(result);
  };

  const updateRoom = async (roomId, patch) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room?._id) {
      console.error('updateRoom: room not found for id', roomId);
      return;
    }

    // Build UI-side optimistic patch — map DB field names to component field names
    const uiPatch = { ...patch };
    if (patch.housekeeping !== undefined) {
      uiPatch.cleanStatus = normalizeHKStatus(patch.housekeeping);
    }
    if (patch.assigned_to !== undefined) {
      uiPatch.assignedTo = patch.assigned_to;
    }
    if (patch.notes !== undefined) {
      uiPatch.notes = patch.notes;
    }

    // Optimistic update using UI field names
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...uiPatch } : r));

    try {
      const res = await authFetch(`/api/rooms/${room._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
    } catch (err) {
      console.error('Failed to update room:', err);
      alert('Failed to save change. Please try again.');
      fetchData(); // revert by re-fetching
    }
  };

  const markStatus = (roomId, newStatus) => {
    const dbStatus = {
      clean:         'Clean',
      inspected:     'Inspected',
      'in-progress': 'In Progress',
      dirty:         'Dirty',
    }[newStatus] || newStatus;
    const patch = { housekeeping: dbStatus };
    if (newStatus === 'clean' || newStatus === 'inspected') patch.last_cleaned = new Date();
    updateRoom(roomId, patch);
  };

  const assignStaff = (roomId, staffName) => {
    updateRoom(roomId, { assigned_to: staffName });
  };

  const updateNote = (roomId, note) => {
    updateRoom(roomId, { notes: note });
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
          <PageSkeleton rows={6} />
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

      {/* ROOM GRID */}
      <div className="panel-header">
        <h3>Room Status ({filteredRooms.length})</h3>

        {/* SEARCH + FILTERS */}
        <div className="panel-toolbar">
          <div className="panel-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <Input
              type="text"
              placeholder="Search room, type, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select className="floor-dropdown" value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}>
            <option value="all">All Floors</option>
            {floors.map(f => <option key={f} value={f}>Floor {f}</option>)}
          </Select>
          <Select className="floor-dropdown" value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)}>
            <option value="all">All Staff</option>
            {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </Select>
          <label className="panel-toggle">
            <Input
              type="checkbox"
              checked={showPriorityOnly}
              onChange={() => setShowPriorityOnly(!showPriorityOnly)}
            />
            Priority only ({priorityCount})
          </label>
        </div>
      </div>

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
const RoomCard = memo(function RoomCard({ room, staff, getStatusColor, getStatusLabel, onMarkStatus, onAssignStaff, onUpdateNote }) {
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
        <Select
          className="floor-dropdown"
          style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
          value={room.assignedTo}
          onChange={(e) => onAssignStaff(room.id, e.target.value)}
        >
          <option value="">Unassigned</option>
          {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </Select>
      </div>

      {/* Notes */}
      {room.notes && !showNoteInput && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', borderLeft: '3px solid var(--gold)', cursor: 'pointer' }} onClick={() => setShowNoteInput(true)}>
          {room.notes}
        </div>
      )}

      {showNoteInput && (
        <div style={{ marginBottom: '12px' }}>
          <Textarea
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
});

export default HousekeepingStatus;
