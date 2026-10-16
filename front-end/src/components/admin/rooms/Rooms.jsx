import { Input, Select, ValidatedForm, SubmitButton } from '../../common/FormControls';
import React, { useState } from 'react';

// Initial sample data 
const initialRooms = [
  { id: '101', type: 'Veranda Suite', rate: 4900, occStatus: 'Occupied', hkStatus: 'Clean', floor: 1, amenities: ['High-Speed Wi-Fi', 'Mini Bar', 'Private Balcony'] },
  { id: '102', type: 'Garden Room', rate: 3200, occStatus: 'Vacant', hkStatus: 'Clean', floor: 1, amenities: ['Smart TV', 'King Size Bed'] },
  { id: '103', type: 'Garden Room', rate: 3200, occStatus: 'Vacant', hkStatus: 'Dirty', floor: 1, amenities: ['Smart TV'] },
  { id: '201', type: 'Amber Loft', rate: 6300, occStatus: 'Vacant', hkStatus: 'Maintenance', floor: 2, amenities: ['Private Balcony', 'Smart TV'] },
  { id: '202', type: 'Presidential Suite', rate: 12500, occStatus: 'Occupied', hkStatus: 'Clean', floor: 2, amenities: ['High-Speed Wi-Fi', 'Mini Bar', 'King Size Bed'] },
];

function Rooms() {
  // State management
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedRoomId, setSelectedRoomId] = useState('101');
  const [viewMode, setViewMode] = useState('grid'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for selected room editing
  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  const [amenities, setAmenities] = useState(activeRoom ? activeRoom.amenities : []);
  const [newAmenity, setNewAmenity] = useState('');

  // Form state for new room modal
  const [newRoomData, setNewRoomData] = useState({
    id: '',
    type: 'Garden Room',
    rate: 3500,
    floor: 1,
  });

  // Amenity handlers
  const addAmenity = (e) => {
    if (e.key === 'Enter' && newAmenity.trim()) {
      e.preventDefault();
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity('');
    }
  };

  const removeAmenity = (index) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  // Add Room Submit Handler
  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!newRoomData.id) return;

    const createdRoom = {
      ...newRoomData,
      rate: Number(newRoomData.rate),
      floor: Number(newRoomData.floor),
      occStatus: 'Vacant',
      hkStatus: 'Clean',
      amenities: ['High-Speed Wi-Fi'],
    };

    setRooms([...rooms, createdRoom]);
    setSelectedRoomId(createdRoom.id);
    setShowAddModal(false);
    setNewRoomData({ id: '', type: 'Garden Room', rate: 3500, floor: 1 });
  };

  // Status helper for CSS styling
  const getCardStatusColor = (occ, hk) => {
    if (hk === 'Maintenance') return { border: '#6c757d', bg: '#f8f9fa', label: 'Out of Order' };
    if (occ === 'Occupied') return { border: '#dc3545', bg: '#fff5f5', label: 'Occupied' };
    if (hk === 'Dirty') return { border: '#ffc107', bg: '#fffdf0', label: 'Needs Cleaning' };
    return { border: '#28a745', bg: '#f4fbf7', label: 'Vacant & Clean' };
  };

  // Filtered rooms search
  const filteredRooms = rooms.filter(
    (room) => room.id.includes(searchQuery) || room.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group rooms by floor for Grid View
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort();

  return (
    <section className="admin-tab-content active">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="left">
          <h2>Room Operation</h2>
        </div>
        <div className="right">
          <button className="btn btn-sm btn-gold" onClick={() => setShowAddModal(true)}>
            <i className="fas fa-plus"></i> Add Room
          </button>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card">
          <span className="lbl"><i className="fas fa-hotel"></i> Total Units</span>
          <span className="val">{rooms.length}</span>
          <span className="sub">Across inventory</span>
        </div>
        <div className="kpi-card">
          <span className="lbl"><i className="fas fa-check-circle"></i> Vacant &amp; Clean</span>
          <span className="val">{rooms.filter((r) => r.occStatus === 'Vacant' && r.hkStatus === 'Clean').length}</span>
          <span className="sub">Ready for check-in</span>
        </div>
        <div className="kpi-card">
          <span className="lbl"><i className="fas fa-broom"></i> Housekeeping Needed</span>
          <span className="val">{rooms.filter((r) => r.hkStatus === 'Dirty').length}</span>
          <span className="sub">Dirty / Turnover</span>
        </div>
        <div className="kpi-card">
          <span className="lbl"><i className="fas fa-tools"></i> Out of Order</span>
          <span className="val">{rooms.filter((r) => r.hkStatus === 'Maintenance').length}</span>
          <span className="sub"><i className="fas fa-arrow-down trend-down"></i> Maintenance</span>
        </div>
      </div>

      {/* MAIN SPLIT VIEW LAYOUT*/}
      <div className="dashboard-split dashboard-split-13">
        {/* LEFT PANEL: GRID OR TABLE */}
        <div className="panel">
          {}
          <div className="panel-header" style={{ marginBottom: 15 }}>
            <h3>Room Inventory</h3>

            {/* SEARCH + VIEW SWITCH */}
            <div className="panel-toolbar">
              {}
              <div className="btn-group" style={{ display: 'flex', background: '#eee', borderRadius: 6, padding: 2 }}>
                <button
                  className={`btn btn-sm ${viewMode === 'grid' ? 'btn-gold' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <i className="fas fa-th-large"></i> Grid View
                </button>
                <button
                  className={`btn btn-sm ${viewMode === 'table' ? 'btn-gold' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  <i className="fas fa-list"></i> Table View
                </button>
              </div>

              {/* SEARCH INPUT */}
              <div className="panel-search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <Input
                  type="text"
                  placeholder="Search unit or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* MODE 1: VISUAL FLOOR PLAN GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="floor-plan-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {floors.map((floorNum) => (
                <div key={floorNum} className="floor-section">
                  <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                    Floor {floorNum}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                    {filteredRooms
                      .filter((r) => r.floor === floorNum)
                      .map((room) => {
                        const status = getCardStatusColor(room.occStatus, room.hkStatus);
                        const isSelected = room.id === selectedRoomId;

                        return (
                          <div
                            key={room.id}
                            onClick={() => {
                              setSelectedRoomId(room.id);
                              setAmenities(room.amenities);
                            }}
                            style={{
                              borderLeft: `4px solid ${status.border}`,
                              backgroundColor: status.bg,
                              borderRadius: 6,
                              padding: 10,
                              cursor: 'pointer',
                              boxShadow: isSelected ? '0 0 0 2px var(--gold-color, #c5a059)' : '0 1px 3px rgba(0,0,0,0.1)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div style={{ fontWeight: 'bold', fontSize: 14 }}>#{room.id}</div>
                            <div style={{ fontSize: 11, color: '#666', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {room.type}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: status.border, marginTop: 6 }}>
                              {status.label}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODE 2: TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Room / Type</th>
                    <th>Rate</th>
                    <th>Occupancy</th>
                    <th>Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room) => (
                    <tr
                      key={room.id}
                      className={`table-row-hover ${selectedRoomId === room.id ? 'active-row' : ''}`}
                      onClick={() => {
                        setSelectedRoomId(room.id);
                        setAmenities(room.amenities);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span className="guest-name">#{room.id}</span>
                        <span className="guest-sub">{room.type}</span>
                      </td>
                      <td>₱{room.rate.toLocaleString()}/nt</td>
                      <td>
                        <span className={`status-tag ${room.occStatus === 'Occupied' ? 'tag-danger' : 'tag-success'}`}>
                          {room.occStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag ${room.hkStatus === 'Clean' ? 'tag-success' : 'tag-neutral'}`}>
                          {room.hkStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: DETAILS EDITOR*/}
        <div className="panel">
          <div className="panel-header" style={{ marginBottom: 12 }}>
            <h3>Room Details</h3>
            <span className="text-muted" style={{ fontSize: 11 }}>#{activeRoom.id}</span>
          </div>

          <ValidatedForm onSubmit={(e) => e.preventDefault()}>
            <div className="form-grid" style={{ marginTop: 0 }}>
              <div className="form-group" style={{ marginTop: 0 }}>
                <label>Room Number</label>
                <Input type="text" value={activeRoom.id} readOnly />
              </div>
              <div className="form-group" style={{ marginTop: 0 }}>
                <label>Room Type</label>
                <Select value={activeRoom.type} onChange={(e) => {
                  setRooms(rooms.map(r => r.id === activeRoom.id ? { ...r, type: e.target.value } : r));
                }}>
                  <option>Garden Room</option>
                  <option>Veranda Suite</option>
                  <option>Amber Loft</option>
                  <option>Presidential Suite</option>
                </Select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group" style={{ marginTop: 0 }}>
                <label>Occupancy Status</label>
                <Select
                  value={activeRoom.occStatus}
                  onChange={(e) => setRooms(rooms.map(r => r.id === activeRoom.id ? { ...r, occStatus: e.target.value } : r))}
                >
                  <option>Vacant</option>
                  <option>Occupied</option>
                  <option>Reserved</option>
                </Select>
              </div>
              <div className="form-group" style={{ marginTop: 0 }}>
                <label>Housekeeping Condition</label>
                <Select
                  value={activeRoom.hkStatus}
                  onChange={(e) => setRooms(rooms.map(r => r.id === activeRoom.id ? { ...r, hkStatus: e.target.value } : r))}
                >
                  <option>Clean</option>
                  <option>Dirty</option>
                  <option>Maintenance</option>
                </Select>
              </div>
            </div>

            <div className="form-group">
              <label>Base Rate (₱)</label>
              <Input
                type="number"
                value={activeRoom.rate}
                min="0"
                step="0.01"
                onChange={(e) => setRooms(rooms.map(r => r.id === activeRoom.id ? { ...r, rate: Number(e.target.value) } : r))}
              />
            </div>

            {/* TAG INPUT FOR AMENITIES[cite: 2] */}
            <div className="form-group">
              <label>Room Amenities</label>
              <div className="tag-input-container">
                {amenities.map((item, index) => (
                  <span key={index} className="amenity-tag">
                    {item} <span className="remove" onClick={() => removeAmenity(index)}>×</span>
                  </span>
                ))}
                <Input
                  type="text"
                  className="amenity-input"
                  placeholder="+ Add amenity…"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={addAmenity}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" className="btn" style={{ flex: 1 }}>Reset</button>
              <button type="button" className="btn btn-gold" style={{ flex: 2 }}><i className="fas fa-save"></i> Save Changes</button>
            </div>
          </ValidatedForm>
        </div>
      </div>

      {/* NEW ROOM MODAL POPUP */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="panel" style={{ width: 400, maxWidth: '90%' }}>
            <div className="panel-header">
              <h3>Create New Unit</h3>
              <span style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setShowAddModal(false)}>×</span>
            </div>

            <ValidatedForm onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label>Room Number / Code</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. 104"
                  value={newRoomData.id}
                  onChange={(e) => setNewRoomData({ ...newRoomData, id: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Floor Level</label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={newRoomData.floor}
                  onChange={(e) => setNewRoomData({ ...newRoomData, floor: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Room Category</label>
                <Select
                  value={newRoomData.type}
                  onChange={(e) => setNewRoomData({ ...newRoomData, type: e.target.value })}
                >
                  <option>Garden Room</option>
                  <option>Veranda Suite</option>
                  <option>Amber Loft</option>
                  <option>Presidential Suite</option>
                </Select>
              </div>

              <div className="form-group">
                <label>Nightly Rate (₱)</label>
                <Input
                  type="number"
                  required
                  value={newRoomData.rate}
                  min="0"
                  step="0.01"
                  onChange={(e) => setNewRoomData({ ...newRoomData, rate: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <SubmitButton  className="btn btn-gold" style={{ flex: 1 }}>Create Unit</SubmitButton>
              </div>
            </ValidatedForm>
          </div>
        </div>
      )}
    </section>
  );
}

export default Rooms;
