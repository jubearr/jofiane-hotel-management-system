import React, { useState, useRef } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { authFetch, readError } from '../../utils/api';
import PortalModal from '../common/PortalModal';
import { PageSkeleton } from '../common/SkeletonLoader';
import { Input, Select, Textarea, ValidatedForm, SubmitButton } from '../common/FormControls';
const API = '/api/housekeeping-logs';

function HousekeepingLogs() {
  const [logs, setLogs] = useState([]);
  const [staff, setStaff] = useState([]);      // housekeeping staff for the dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    room: '',
    category: 'Room Note',
    description: '',
    employee: '',
  });

  const firstLoad = useRef(true);

  // ── FETCH (live from DB, polled) ──────────────────────
  const fetchLogs = async () => {
    if (firstLoad.current) setIsLoading(true);
    setError(null);
    try {
      const [logsRes, staffRes] = await Promise.all([
        authFetch(`${API}?today=1`),
        authFetch('/api/employees?department=Housekeeping'),
      ]);
      if (!logsRes.ok) throw new Error(`Server error: ${logsRes.status}`);
      setLogs(await logsRes.json());

      if (staffRes.ok) {
        const emp = await staffRes.json();
        setStaff(emp.map(e => e.full_name || '').filter(Boolean));
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load housekeeping logs.');
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  usePolling(fetchLogs, 10000);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ── CREATE (persists to DB) ───────────────────────────
  const addLog = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_number: formData.room,
          category: formData.category,
          description: formData.description,
          employee: formData.employee,
        }),
      });
      if (!res.ok) {
        alert(await readError(res, 'Failed to save log.'));
        setSaving(false);
        return;
      }
      setFormData({ room: '', category: 'Room Note', description: '', employee: '' });
      setShowForm(false);
      await fetchLogs();   // refresh from DB
    } catch (err) {
      console.error('Failed to save housekeeping log:', err);
      alert('Cannot reach the server to save the log.');
    } finally {
      setSaving(false);
    }
  };

  // Format the stored datetime into a readable time.
  const formatTime = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryClass = (category) => {
    if (category === 'Maintenance')   return 'status-tag tag-danger';
    if (category === 'Priority')      return 'status-tag tag-warning';
    if (category === 'DND')           return 'status-tag tag-neutral';
    if (category === 'Lost & Found')  return 'status-tag tag-gold';
    return 'status-tag tag-success';
  };

  const priorityCount    = logs.filter((log) => log.category === 'Priority').length;
  const maintenanceCount = logs.filter((log) => log.category === 'Maintenance').length;
  const dndCount         = logs.filter((log) => log.category === 'DND').length;

  return (
    <div className="employee-module housekeeping-logs-module">
      <section className="admin-tab-content active housekeeping-module">

        <div className="employee-dashboard-header" style={{ marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Housekeeping Log
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
              Daily housekeeping notes and shift handover records.
            </p>
          </div>

          <button className="btn btn-gold" onClick={() => setShowForm(true)}>
            + Add Log
          </button>
        </div>

        <div className="panel" style={{ padding: '22px 26px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', gap: '42px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{logs.length}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TODAY'S LOGS</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{priorityCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PRIORITY</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{maintenanceCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MAINTENANCE</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{dndCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DND</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '18px' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>Shift Activity</h3>
          </div>

          <div style={{ padding: '0 10px' }}>
            {isLoading ? (
              <PageSkeleton rows={4} label="Loading records" />
            ) : error ? (
              <div style={{ padding: '32px 10px', fontSize: '13px', color: 'var(--status-occ)' }}>{error}</div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '32px 10px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No housekeeping logs recorded today.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log._id || log.log_id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 100px 130px 1fr 150px',
                    gap: '15px',
                    alignItems: 'center',
                    padding: '17px 10px',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatTime(log.datetime)}</div>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Room {log.room_number}</strong></div>
                  <div><span className={getCategoryClass(log.category)}>{log.category}</span></div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.description}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.employee}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {showForm && (
          <PortalModal maxWidth={440}>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
              <h3 style={{ color: 'var(--text-primary)' }}>New Housekeeping Log</h3>

              <ValidatedForm onSubmit={addLog}>
                <div className="form-group">
                  <label>Room Number</label>
                  <Input type="text" name="room" value={formData.room} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <Select name="category" value={formData.category} onChange={handleChange}>
                    <option>Room Note</option>
                    <option>Room Status</option>
                    <option>Priority</option>
                    <option>DND</option>
                    <option>Maintenance</option>
                    <option>Lost & Found</option>
                    <option>Shift Handover</option>
                  </Select>
                </div>

                <div className="form-group">
                  <label>Employee</label>
                  <Select name="employee" value={formData.employee} onChange={handleChange} required>
                    <option value="">Select Employee</option>
                    {staff.map((name) => <option key={name} value={name}>{name}</option>)}
                  </Select>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter housekeeping note..."
                    required
                    style={{ minHeight: '100px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
                  <SubmitButton type="submit" className="btn btn-gold" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Log'}
                  </SubmitButton>
                </div>
              </ValidatedForm>
          </PortalModal>
        )}

      </section>
    </div>
  );
}

export default HousekeepingLogs;
