import React, { useState, useRef } from 'react';
import { usePolling } from '../../hooks/usePolling';
import PortalModal from '../common/PortalModal';
import { PageSkeleton } from '../common/SkeletonLoader';
import { authFetch } from '../../utils/api';
import { Input, Select, Textarea, ValidatedForm, SubmitButton } from '../common/FormControls';
const API = '/api/maintenance-requests';

const Maintenance = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const [formData, setFormData] = useState({
    room_number: '',
    issue_type: '',
    description: '',
    priority: 'NORMAL',
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
      setError('Failed to load maintenance requests.');
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  usePolling(fetchRequests, 12000);

  // ── CREATE ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_number:  parseInt(formData.room_number) || 0,
          issue_type:   formData.issue_type,
          description:  formData.description,
          priority:     formData.priority,
          status:       'PENDING',
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await fetchRequests();
      setFormData({ room_number: '', issue_type: '', description: '', priority: 'NORMAL' });
      setShowForm(false);
    } catch (e) {
      console.error(e);
      alert('Failed to submit request. Please try again.');
    }
  };

  // ── UPDATE STATUS ──────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    setSavingId(id);
    try {
      const body = { status: newStatus };
      if (newStatus === 'COMPLETED') body.completed_at = new Date();
      const res = await authFetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRequests(prev => prev.map(r => r._id === id ? updated : r));
    } catch (e) {
      console.error(e);
      alert('Failed to update status.');
    } finally {
      setSavingId(null);
    }
  };

  // ── HELPERS ────────────────────────────────────────
  const getPriorityClass = (p) => p === 'HIGH' || p === 'URGENT' ? 'status-tag tag-danger' : p === 'NORMAL' ? 'status-tag tag-warning' : 'status-tag tag-success';
  const getStatusClass   = (s) => s === 'COMPLETED' ? 'status-tag tag-success' : s === 'IN PROGRESS' ? 'status-tag tag-gold' : 'status-tag tag-warning';

  const totalRequests     = requests.length;
  const pendingRequests   = requests.filter(r => r.status === 'PENDING').length;
  const inProgressRequests = requests.filter(r => r.status === 'IN PROGRESS').length;
  const completedRequests = requests.filter(r => r.status === 'COMPLETED').length;

  return (
    <section className="admin-tab-content active housekeeping-module">

      <div className="employee-dashboard-header" style={{ marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>Maintenance Requests</h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Report and monitor room maintenance issues.</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowForm(true)}>+ Report Maintenance</button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px' }}>
        <div className="kpi-card"><span className="lbl">TOTAL REQUESTS</span><span className="val">{totalRequests}</span><span className="sub">Maintenance reports</span></div>
        <div className="kpi-card"><span className="lbl">PENDING</span><span className="val">{pendingRequests}</span><span className="sub">Waiting for action</span></div>
        <div className="kpi-card"><span className="lbl">IN PROGRESS</span><span className="val">{inProgressRequests}</span><span className="sub">Currently being repaired</span></div>
        <div className="kpi-card"><span className="lbl">COMPLETED</span><span className="val">{completedRequests}</span><span className="sub">Resolved requests</span></div>
      </div>

      {/* TABLE */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="panel-header" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid var(--border-light)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Maintenance Requests</h3>
        </div>
        <div className="table-wrap">
          {isLoading ? (
            <PageSkeleton rows={4} label="Loading records" />
          ) : error ? (
            <div style={{ padding: '20px', color: '#dc2626' }}>{error}</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No maintenance requests yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Room</th><th>Issue Type</th><th>Description</th>
                  <th>Priority</th><th>Reported</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r._id} className="table-row-hover">
                    <td><strong style={{ color: 'var(--text-primary)' }}>MNT-{String(r.maintenance_id).padStart(3,'0')}</strong></td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>Room {r.room_number}</strong></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.issue_type}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px', maxWidth: '200px' }}>{r.description}</td>
                    <td><span className={getPriorityClass(r.priority)}>{r.priority}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {r.reported_at ? new Date(r.reported_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
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
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#79c996' }}>Done</span>
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
            <h3 style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>Report Maintenance</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Record a room maintenance issue.</p>
            <ValidatedForm onSubmit={handleSubmit}>
              <div className="form-grid" style={{ marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Room Number</label>
                  <Input type="number" value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} placeholder="e.g. 205" required />
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
                <label>Issue Type</label>
                <Select value={formData.issue_type} onChange={e => setFormData({...formData, issue_type: e.target.value})} required>
                  <option value="">Select issue type...</option>
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Air Conditioning</option>
                  <option>Furniture</option>
                  <option>Door / Lock</option>
                  <option>TV / Electronics</option>
                  <option>Housekeeping Supply</option>
                  <option>Other</option>
                </Select>
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Description</label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the problem in detail..." style={{ minHeight: '80px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
                <SubmitButton type="submit" className="btn btn-gold">Submit Request</SubmitButton>
              </div>
            </ValidatedForm>
        </PortalModal>
      )}

    </section>
  );
};

export default Maintenance;
