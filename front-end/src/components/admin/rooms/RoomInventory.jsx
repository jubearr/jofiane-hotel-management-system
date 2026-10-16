import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE, authFetch, readError } from '../../../utils/api';
import { Input, Select, ValidatedForm, SubmitButton } from '../../common/FormControls';
import { PageSkeleton } from '../../common/SkeletonLoader';

function RoomInventory() {
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  // Filters
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rooms, filterFloor, filterType, filterStatus, searchQuery]);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch live data from your Node.js server
      const [roomsRes, typesRes] = await Promise.all([
        fetch(`${API_BASE}/api/rooms`),
        fetch(`${API_BASE}/api/room-types`)
      ]);

      if (!roomsRes.ok || !typesRes.ok) {
        throw new Error('Failed to retrieve inventory data from backend');
      }

      const dbRooms = await roomsRes.json();
      const dbTypes = await typesRes.json();

      // 2. Format room types from database
      const formattedTypes = dbTypes.map((type) => ({
        id: type.type_id,
        name: type.name,
        baseRate: type.base_rate,
        capacity: type.base_capacity
      }));

      // 3. Merge MongoDB room records with corresponding room type details
      const formattedRooms = dbRooms.map((room) => {
        const matchedType = dbTypes.find((t) => t.type_id === room.type_id);
        return {
          id: room._id || room.room_number,
          number: room.room_number ? room.room_number.toString() : '',
          floor: room.floor,
          type: matchedType ? matchedType.name : 'Standard',
          capacity: matchedType ? matchedType.base_capacity : 2,
          rate: matchedType ? matchedType.base_rate : 0,
          status: (room.status || 'vacant').toLowerCase(),
          amenities: matchedType?.amenities || []
        };
      });

      setRoomTypes(formattedTypes);
      setRooms(formattedRooms);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...rooms];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => r.number.includes(q) || r.type.toLowerCase().includes(q));
    }
    if (filterFloor !== 'all') {
      result = result.filter(r => r.floor === parseInt(filterFloor));
    }
    if (filterType !== 'all') {
      result = result.filter(r => r.type === filterType);
    }
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }
    setFilteredRooms(result);
  };

  const handleAddRoom = () => {
    setEditingRoom(null);
    setShowModal(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setShowModal(true);
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Archive Room ${room.number}? An administrator can restore it later.`)) return;
    try {
      const response = await authFetch(`/api/archive/rooms/${encodeURIComponent(room.id)}/archive`, { method: 'POST' });
      if (!response.ok) throw new Error(await readError(response, 'Unable to archive this room.'));
      setRooms(prev => prev.filter(r => r.id !== room.id));
    } catch (error) { alert(error.message); }
  };

  const handleSaveRoom = (roomData) => {
    if (editingRoom) {
      setRooms(prev => prev.map(r => r.id === editingRoom.id ? { ...r, ...roomData } : r));
    } else {
      const newRoom = { ...roomData, id: Math.max(...rooms.map(r => Number(r.id) || 0), 0) + 1 };
      setRooms(prev => [...prev, newRoom]);
    }
    setShowModal(false);
    setEditingRoom(null);
  };

  // Stats
  const totalRooms = rooms.length;
  const occupied = rooms.filter(r => r.status === 'occupied').length;
  const vacant = rooms.filter(r => r.status === 'vacant').length;
  const outOfOrder = rooms.filter(r => r.status === 'out-of-order').length;
  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);

  const getStatusTag = (status) => {
    switch (status) {
      case 'occupied': return <span className="status-tag tag-danger">Occupied</span>;
      case 'vacant': return <span className="status-tag tag-success">Vacant</span>;
      case 'out-of-order': return <span className="status-tag tag-neutral">Out of Order</span>;
      default: return <span className="status-tag tag-neutral">{status}</span>;
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
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Room Inventory</h2>
          <p>Property room catalog and configuration</p>
        </div>
        <div className="right">
        </div>
      </div>

      {/* INVENTORY SUMMARY */}
      <div className="panel" style={{ padding: '22px 28px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Left: Room counts inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1' }}>{totalRooms}</div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Total Rooms</div>
            </div>
            <div style={{ width: '1px', height: '36px', background: 'var(--border-light)' }}></div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-occ)' }}>{occupied}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Occupied</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-vac)' }}>{vacant}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Vacant</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-muted)' }}>{outOfOrder}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Out of Order</div>
              </div>
            </div>
          </div>

          {/* Right: Occupancy bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '120px', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${totalRooms > 0 ? (occupied / totalRooms) * 100 : 0}%`, background: 'var(--gold)', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gold)' }}>{totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0}%</span>
          </div>
        </div>

        {/* Room Types — inline below */}
        <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {roomTypes.map(type => {
            const count = rooms.filter(r => r.type === type.name).length;
            return (
              <button
                key={type.id}
                onClick={() => setFilterType(filterType === type.name ? 'all' : type.name)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: filterType === type.name ? '1px solid var(--gold)' : '1px solid var(--border-light)',
                  background: filterType === type.name ? 'rgba(201,168,76,0.08)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{type.name}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '1px 6px', borderRadius: '10px' }}>{count}</span>
                <span style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: '600' }}>{type.baseRate?.toLocaleString()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ROOM TABLE */}
      <div className="panel">
        <div className="panel-header">
          <h3>Rooms ({filteredRooms.length})</h3>

          {/* SEARCH + FILTERS */}
          <div className="panel-toolbar">
            {/* Search */}
            <div className="panel-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <Input
                type="text"
                placeholder="Search room number or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Floor */}
            <Select className="floor-dropdown" value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}>
              <option value="all">All Floors</option>
              {floors.map(f => <option key={f} value={f}>Floor {f}</option>)}
            </Select>

            {/* Type */}
            <Select className="floor-dropdown" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              {roomTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </Select>

            {/* Status */}
            <Select className="floor-dropdown" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
              <option value="out-of-order">Out of Order</option>
            </Select>
            <button className="btn btn-sm btn-gold" onClick={handleAddRoom}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Room
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Floor</th>
                <th>Type</th>
                <th>Capacity</th>
                <th style={{ textAlign: 'right' }}>Rate/Night</th>
                <th>Amenities</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No rooms found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.id} className="table-row-hover">
                    <td>
                      <span className="guest-name">{room.number}</span>
                    </td>
                    <td>
                      <span className="std-text">Floor {room.floor}</span>
                    </td>
                    <td>
                      <span className="std-text">{room.type}</span>
                    </td>
                    <td>
                      <span className="std-text">{room.capacity} pax</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                      {room.rate?.toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {room.amenities.slice(0, 3).map((a, i) => (
                          <span key={i} style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>{a}</span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>+{room.amenities.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>{getStatusTag(room.status)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-links" style={{ justifyContent: 'center' }}>
                        <button className="action-link link-edit" onClick={() => handleEditRoom(room)}>Edit</button>
                        <button className="action-link link-delete" onClick={() => handleDeleteRoom(room)}>Archive</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROOM MODAL — portaled to <body> so the overlay covers the whole
          viewport (including sidebar) and blurs everything behind it */}
      {showModal && createPortal(
        <RoomModal
          room={editingRoom}
          roomTypes={roomTypes}
          onClose={() => { setShowModal(false); setEditingRoom(null); }}
          onSave={handleSaveRoom}
        />,
        document.body
      )}
    </section>
  );
}

/* ============================================================
   ROOM ADD/EDIT MODAL
   ============================================================ */
function RoomModal({ room, roomTypes, onClose, onSave }) {
  // Lock background scroll while the modal is open; restore on close.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const [formData, setFormData] = useState({
    number: room?.number || '',
    floor: room?.floor || 1,
    type: room?.type || roomTypes[0]?.name || 'Standard',
    capacity: room?.capacity || 2,
    rate: room?.rate || roomTypes[0]?.baseRate || 2500,
    status: room?.status || 'vacant',
    amenities: room?.amenities || ['Wi-Fi', 'TV', 'AC']
  });

  const [amenityInput, setAmenityInput] = useState('');

  const handleTypeChange = (typeName) => {
    const type = roomTypes.find(t => t.name === typeName);
    setFormData(prev => ({
      ...prev,
      type: typeName,
      rate: type ? type.baseRate : prev.rate,
      capacity: type ? type.capacity : prev.capacity
    }));
  };

  const addAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData(prev => ({ ...prev, amenities: [...prev.amenities, amenityInput.trim()] }));
      setAmenityInput('');
    }
  };

  const removeAmenity = (amenity) => {
    setFormData(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== amenity) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.number || !formData.rate) {
      alert('Please fill in required fields.');
      return;
    }
    onSave({ ...formData, floor: parseInt(formData.floor), capacity: parseInt(formData.capacity), rate: parseFloat(formData.rate) });
  };

  return (
    <div className="modal-overlay modal-portal-overlay open" onMouseDown={(e) => e.stopPropagation()}>
      <div className="modal-content" style={{ maxWidth: '560px' }} onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
          {room ? `Edit Room ${room.number}` : 'Add New Room'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          {room ? 'Update room configuration' : 'Add a room to the property inventory'}
        </p>

        <ValidatedForm onSubmit={handleSubmit}>
          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Room Number <span className="required">*</span></label>
              <Input type="text" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} placeholder="e.g. 305" />
            </div>
            <div className="form-group">
              <label>Floor</label>
              <Select value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })}>
                {[1, 2, 3, 4, 5].map(f => <option key={f} value={f}>Floor {f}</option>)}
              </Select>
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Room Type</label>
              <Select value={formData.type} onChange={(e) => handleTypeChange(e.target.value)}>
                {roomTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </Select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="out-of-order">Out of Order</option>
              </Select>
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Rate / Night <span className="required">*</span></label>
              <Input type="number" value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: e.target.value })} min="0" step="100" />
            </div>
            <div className="form-group">
              <label>Capacity (pax)</label>
              <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} min="1" max="10" />
            </div>
          </div>

          {/* Amenities */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Amenities</label>
            <div className="tag-input-container">
              {formData.amenities.map((a, i) => (
                <span key={i} className="amenity-tag">
                  {a}
                  <span className="remove" onClick={() => removeAmenity(a)}>&times;</span>
                </span>
              ))}
              <Input
                type="text"
                className="amenity-input"
                placeholder="Type and press Enter..."
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <SubmitButton type="submit" className="btn btn-gold">{room ? 'Save Changes' : 'Add Room'}</SubmitButton>
          </div>
        </ValidatedForm>
      </div>
    </div>
  );
}

export default RoomInventory;
