import React, { useState, useRef } from 'react';
import { usePolling } from '../../hooks/usePolling';
import PortalModal from '../common/PortalModal';
import { PageSkeleton } from '../common/SkeletonLoader';
import { authFetch } from '../../utils/api';
import { Input, Select, Textarea, ValidatedForm, SubmitButton } from '../common/FormControls';

const API = '/api/guest-requests';

function GuestRequests({ isLead = false, employee = null }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const [formData, setFormData] = useState({
    room_number: '',
    request_type: '',
    priority: 'NORMAL',
    assigned_to: '',
    description: '',
  });

  const firstLoad = useRef(true);

  // ── FETCH ──────────────────────────────────────────
  const fetchRequests = async () => {
    if (firstLoad.current) setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(API);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setRequests(await res.json());
    } catch (e) {
      console.error(e);
      setError('Failed to load guest requests.');
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  usePolling(fetchRequests, 10000);

  // ── CREATE ─────────────────────────────────────────
  const addRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_number:  parseInt(formData.room_number) || 0,
          request_type: formData.request_type,
          description:  formData.description,
          priority:     formData.priority,
          assigned_to:  formData.assigned_to || null,
          status:       'PENDING',
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await fetchRequests();
      setFormData({ room_number: '', request_type: '', priority: 'NORMAL', assigned_to: '', description: '' });
      setShowForm(false);
    } catch (e) {
      console.error(e);
      alert('Failed to create request. Please try again.');
    }
  };

  // ── UPDATE STATUS ──────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    setSavingId(id);
    try {
      const res = await authFetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const updated = await res.json();
      setRequests(prev => prev.map(r => r._id === id ? updated : r));
    } catch (e) {
      console.error(e);
      alert('Failed to update status.');
    } finally {
      setSavingId(null);
    }
  };

  // ── ASSIGN STAFF ───────────────────────────────────
  const assignStaff = async (id, staffName) => {
    try {
      const res = await authFetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: staffName }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRequests(prev => prev.map(r => r._id === id ? updated : r));
    } catch (e) {
      console.error(e);
    }
  };

  // ── HELPERS ────────────────────────────────────────
  const getStatusClass = (status) => {
    if (status === 'COMPLETED') return 'status-tag tag-success';
    if (status === 'IN PROGRESS') return 'status-tag tag-gold';
    return 'status-tag tag-warning';
  };

  // A lead sees all requests; a cleaner sees only the ones assigned to them.
  const myName = (employee?.name || '').trim().toLowerCase();
  const visibleRequests = isLead
    ? requests
    : requests.filter(r => myName && (r.assigned_to || '').trim().toLowerCase() === myName);

  const pendingCount    = visibleRequests.filter(r => r.status === 'PENDING').length;
  const inProgressCount = visibleRequests.filter(r => r.status === 'IN PROGRESS').length;
  const completedCount  = visibleRequests.filter(r => r.status === 'COMPLETED').length;

  return (
    <div className="employee-module guest-requests-module">
      <section className="admin-tab-content active housekeeping-module">

        <div className="employee-dashboard-header" style={{ marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Guest Requests
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
              Manage housekeeping requests from guests and the front desk.
            </p>
          </div>
          {isLead && (
            <button className="btn btn-gold" onClick={() => setShowForm(true)}>+ New Request</button>
          )}
        </div>

        {/* KPIs */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px' }}>
          <div className="kpi-card"><span className="lbl">TOTAL</span><span className="val">{visibleRequests.length}</span><span className="sub">Today's requests</span></div>
          <div className="kpi-card"><span className="lbl">PENDING</span><span className="val">{pendingCount}</span><span className="sub">Waiting for action</span></div>
          <div className="kpi-card"><span className="lbl">IN PROGRESS</span><span className="val">{inProgressCount}</span><span className="sub">Currently handled</span></div>
          <div className="kpi-card"><span className="lbl">COMPLETED</span><span className="val">{completedCount}</span><span className="sub">Finished</span></div>
        </div>

        {/* TABLE */}
        <div className="panel">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '18px' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>Request Queue</h3>
          </div>
          <div className="table-wrap">
            {isLoading ? (
              <PageSkeleton rows={4} label="Loading records" />
            ) : error ? (
              <div style={{ padding: '20px', color: '#dc2626' }}>{error}</div>
            ) : visibleRequests.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{isLead ? 'No requests yet.' : 'You have no assigned requests.'}</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Room</th><th>Request</th><th>Priority</th>
                    <th>Assigned To</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.map(r => (
                    <tr key={r._id} className="table-row-hover">
                      <td><strong style={{ color: 'var(--text-primary)' }}>REQ-{String(r.request_id).padStart(3,'0')}</strong></td>
                      <td style={{ color: 'var(--text-secondary)' }}>Room {r.room_number}</td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{r.request_type}</strong>
                        {r.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{r.description}</div>}
                      </td>
                      <td>
                        <span className={r.priority === 'HIGH' || r.priority === 'URGENT' ? 'status-tag tag-danger' : 'status-tag tag-neutral'}>
                          {r.priority}
                        </span>
                      </td>
                      <td>
                        <select
                          className="floor-dropdown"
                          value={r.assigned_to || ''}
                          onChange={e => assignStaff(r._id, e.target.value)}
                          style={{ color: 'var(--text-primary)' }}
                        >
                          <option value="">Unassigned</option>
                          <option>Maria Santos</option>
                          <option>Rosa Villanueva</option>
                          <option>Elena Cruz</option>
                          <option>Carmen Diaz</option>
                          <option>Liza Fernandez</option>
                        </select>
                      </td>
                      <td><span className={getStatusClass(r.status)}>{r.status}</span></td>
                      <td>
                        {savingId === r._id ? (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>saving…</span>
                        ) : r.status === 'PENDING' ? (
                          <button className="btn btn-xs btn-gold" onClick={() => updateStatus(r._id, 'IN PROGRESS')}>Start</button>
                        ) : r.status === 'IN PROGRESS' ? (
                          <button className="btn btn-xs" onClick={() => updateStatus(r._id, 'COMPLETED')}>Complete</button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#79c996', fontWeight: '700' }}>Done</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ADD MODAL */}
        {showForm && (
          <PortalModal maxWidth={440}>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
              <h3 style={{ color: 'var(--text-primary)' }}>New Guest Request</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Record a new housekeeping request.</p>
              <ValidatedForm onSubmit={addRequest}>
                <div className="form-grid" style={{ marginBottom: '14px' }}>
                  <div className="form-group">
                    <label>Room Number</label>
                    <Input type="number" value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} placeholder="e.g. 203" required />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <Select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </Select>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Request Type</label>
                  <Input type="text" value={formData.request_type} onChange={e => setFormData({...formData, request_type: e.target.value})} placeholder="e.g. Extra Towels" required />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Assign To</label>
                  <Select value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})}>
                    <option value="">Unassigned</option>
                    <option>Maria Santos</option>
                    <option>Rosa Villanueva</option>
                    <option>Elena Cruz</option>
                    <option>Carmen Diaz</option>
                    <option>Liza Fernandez</option>
                  </Select>
                </div>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label>Notes (optional)</label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Additional details..." style={{ minHeight: '70px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
                  <SubmitButton type="submit" className="btn btn-gold">Create Request</SubmitButton>
                </div>
              </ValidatedForm>
          </PortalModal>
        )}

      </section>
    </div>
  );
}

export default GuestRequests;
