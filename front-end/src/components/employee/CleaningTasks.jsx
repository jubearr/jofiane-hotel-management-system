import React, { useState, useRef } from 'react';
import { usePolling } from '../../hooks/usePolling';
import PortalModal from '../common/PortalModal';
import { PageSkeleton } from '../common/SkeletonLoader';
import { authFetch, API_BASE } from '../../utils/api';
import { Input, Select, Textarea, ValidatedForm, SubmitButton } from '../common/FormControls';

const API = '/api/cleaning-tasks';

const CleaningTasks = ({ isLead = false, employee = null }) => {
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);   // housekeeping department staff
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const [formData, setFormData] = useState({
    room_number: '',
    task_type: '',
    employee_id: '',
    assigned_name: '',
    priority: 'NORMAL',
    scheduled_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const firstLoad = useRef(true);

  // ── FETCH ──────────────────────────────────────────
  const fetchTasks = async () => {
    if (firstLoad.current) setIsLoading(true);
    setError(null);
    try {
      const [tasksRes, staffRes] = await Promise.all([
        authFetch(API),
        fetch(`${API_BASE}/api/employees?department=Housekeeping`),
      ]);
      if (!tasksRes.ok) throw new Error(`Server error: ${tasksRes.status}`);
      setTasks(await tasksRes.json());

      // Normalise housekeeping staff for the dropdown
      if (staffRes.ok) {
        const emp = await staffRes.json();
        setStaff(emp.map(e => ({
          id:   e.employee_id,
          name: e.full_name || '',
        })).filter(s => s.name));
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load cleaning tasks.');
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  usePolling(fetchTasks, 10000);

  // ── CREATE ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_number:    parseInt(formData.room_number) || 0,
          task_type:      formData.task_type,
          employee_id:    parseInt(formData.employee_id) || null,
          assigned_name:  formData.assigned_name,
          priority:       formData.priority,
          scheduled_date: formData.scheduled_date,
          notes:          formData.notes,
          status:         'PENDING',
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await fetchTasks();
      setFormData({ room_number: '', task_type: '', employee_id: '', assigned_name: '', priority: 'NORMAL', scheduled_date: new Date().toISOString().slice(0,10), notes: '' });
      setShowForm(false);
    } catch (e) {
      console.error(e);
      alert('Failed to add task. Please try again.');
    }
  };

  // ── COMPLETE ───────────────────────────────────────
  const completeTask = async (id) => {
    setSavingId(id);
    try {
      const res = await authFetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setTasks(prev => prev.map(t => t._id === id ? updated : t));
    } catch (e) {
      console.error(e);
      alert('Failed to update task.');
    } finally {
      setSavingId(null);
    }
  };

  // ── HELPERS ────────────────────────────────────────
  const getPriorityClass = (p) => p === 'HIGH' || p === 'URGENT' ? 'status-tag tag-danger' : p === 'NORMAL' ? 'status-tag tag-warning' : 'status-tag tag-success';
  const getStatusClass   = (s) => s === 'COMPLETED' ? 'status-tag tag-success' : s === 'IN PROGRESS' ? 'status-tag tag-gold' : 'status-tag tag-warning';

  // A lead sees the whole module; a cleaner sees only THEIR OWN assigned tasks.
  const myName = (employee?.name || '').trim().toLowerCase();
  const myId   = employee?.employee_id;
  const visibleTasks = isLead
    ? tasks
    : tasks.filter(t =>
        (myId != null && t.employee_id === myId) ||
        (myName && (t.assigned_name || '').trim().toLowerCase() === myName)
      );

  const totalTasks     = visibleTasks.length;
  const pendingTasks   = visibleTasks.filter(t => t.status === 'PENDING').length;
  const inProgressTasks = visibleTasks.filter(t => t.status === 'IN PROGRESS').length;
  const completedTasks = visibleTasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <section className="admin-tab-content active housekeeping-module">

      <div className="employee-dashboard-header" style={{ marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>Cleaning Tasks</h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Manage and monitor housekeeping cleaning tasks.</p>
        </div>
        {isLead && (
          <button className="btn btn-gold" onClick={() => setShowForm(true)}>+ Add Cleaning Task</button>
        )}
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px' }}>
        <div className="kpi-card"><span className="lbl">TOTAL TASKS</span><span className="val">{totalTasks}</span><span className="sub">Housekeeping assignments</span></div>
        <div className="kpi-card"><span className="lbl">PENDING</span><span className="val">{pendingTasks}</span><span className="sub">Waiting to be started</span></div>
        <div className="kpi-card"><span className="lbl">IN PROGRESS</span><span className="val">{inProgressTasks}</span><span className="sub">Currently being handled</span></div>
        <div className="kpi-card"><span className="lbl">COMPLETED</span><span className="val">{completedTasks}</span><span className="sub">Finished cleaning tasks</span></div>
      </div>

      {/* TABLE */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="panel-header" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid var(--border-light)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Cleaning Task List</h3>
        </div>
        <div className="table-wrap">
          {isLoading ? (
            <PageSkeleton rows={4} label="Loading records" />
          ) : error ? (
            <div style={{ padding: '20px', color: '#dc2626' }}>{error}</div>
          ) : visibleTasks.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{isLead ? 'No cleaning tasks yet.' : 'You have no assigned cleaning tasks.'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Room</th><th>Task</th><th>Assigned To</th>
                  <th>Priority</th><th>Scheduled</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map(task => (
                  <tr key={task._id} className="table-row-hover">
                    <td><strong style={{ color: 'var(--text-primary)' }}>Room {task.room_number}</strong></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{task.task_type}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{task.assigned_name || '—'}</td>
                    <td><span className={getPriorityClass(task.priority)}>{task.priority}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {task.scheduled_date ? new Date(task.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td><span className={getStatusClass(task.status)}>{task.status}</span></td>
                    <td>
                      {savingId === task._id ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>saving…</span>
                      ) : task.status !== 'COMPLETED' ? (
                        <button className="btn btn-xs btn-gold" onClick={() => completeTask(task._id)}>Complete</button>
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
            <h3 style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>Add Cleaning Task</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Create a new housekeeping cleaning assignment.</p>
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
                <label>Cleaning Task</label>
                <Input type="text" value={formData.task_type} onChange={e => setFormData({...formData, task_type: e.target.value})} placeholder="e.g. Checkout Cleaning" required />
              </div>
              <div className="form-grid" style={{ marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Assigned To</label>
                  <Select
                    value={formData.assigned_name}
                    onChange={e => {
                      const name = e.target.value;
                      const picked = staff.find(s => s.name === name);
                      setFormData({
                        ...formData,
                        assigned_name: name,
                        employee_id: picked ? picked.id : '',
                      });
                    }}
                  >
                    <option value="">Select staff…</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="form-group">
                  <label>Scheduled Date</label>
                  <Input type="date" value={formData.scheduled_date} onChange={e => setFormData({...formData, scheduled_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Notes (optional)</label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ minHeight: '70px' }} placeholder="Additional notes..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
                <SubmitButton type="submit" className="btn btn-gold">Add Task</SubmitButton>
              </div>
            </ValidatedForm>
        </PortalModal>
      )}

    </section>
  );
};

export default CleaningTasks;
