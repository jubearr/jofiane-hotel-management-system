import React, { useState, useRef } from 'react';
import { usePolling } from '../../hooks/usePolling';
import PortalModal from '../common/PortalModal';
import { PageSkeleton } from '../common/SkeletonLoader';
import { authFetch, readError } from '../../utils/api';
import { Input, Textarea, ValidatedForm, SubmitButton } from '../common/FormControls';
const API = '/api/lost-and-found';

function LostAndFound() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    room_number: '',
    location_found: '',
    found_by: '',
    notes: '',
  });

  const firstLoad = useRef(true);

  // ── FETCH ──────────────────────────────────────────
  const fetchItems = async () => {
    if (firstLoad.current) setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(API);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setItems(await res.json());
    } catch (e) {
      console.error(e);
      setError('Failed to load lost and found records.');
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  usePolling(fetchItems, 10000);

  // ── CREATE ─────────────────────────────────────────
  const addItem = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name:      formData.item_name,
          description:    formData.description,
          room_number:    parseInt(formData.room_number) || null,
          location_found: formData.location_found,
          found_by:       formData.found_by,
          notes:          formData.notes,
          status:         'UNCLAIMED',
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await fetchItems();
      setFormData({ item_name: '', description: '', room_number: '', location_found: '', found_by: '', notes: '' });
      setShowForm(false);
    } catch (e) {
      console.error(e);
      alert('Failed to save item. Please try again.');
    }
  };

  // ── UPDATE STATUS ──────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    setSavingId(id);
    try {
      const body = { status: newStatus };
      if (newStatus === 'RETURNED' || newStatus === 'CLAIMED') body.claimed_date = new Date();
      const res = await authFetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setItems(prev => prev.map(i => i._id === id ? updated : i));
    } catch (e) {
      console.error(e);
      alert('Failed to update status.');
    } finally {
      setSavingId(null);
    }
  };

  // ── DELETE ─────────────────────────────────────────
  const deleteItem = async (id) => {
    if (!window.confirm('Archive this Lost & Found record? An administrator can restore it later.')) return;
    try {
      const response = await authFetch(`${API}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await readError(response, 'Unable to archive this record.'));
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (e) {
      console.error(e);
      setError(e.message || 'Unable to archive this record. The record has been kept.');
    }
  };

  // ── HELPERS ────────────────────────────────────────
  const getStatusClass = (s) => {
    if (s === 'RETURNED' || s === 'CLAIMED') return 'status-tag tag-success';
    if (s === 'UNCLAIMED') return 'status-tag tag-warning';
    return 'status-tag tag-neutral';
  };

  const storedCount   = items.filter(i => i.status === 'STORED').length;
  const returnedCount = items.filter(i => i.status === 'RETURNED' || i.status === 'CLAIMED').length;
  const unclaimedCount = items.filter(i => i.status === 'UNCLAIMED').length;

  return (
    <div className="employee-module lost-found-module">
      <section className="admin-tab-content active housekeeping-module">

        <div className="employee-dashboard-header" style={{ marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>Lost & Found</h2>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Record and track items found inside hotel rooms.</p>
          </div>
          <button className="btn btn-gold" onClick={() => setShowForm(true)}>+ Report Found Item</button>
        </div>

        {/* KPIs */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px' }}>
          <div className="kpi-card"><span className="lbl">TOTAL ITEMS</span><span className="val">{items.length}</span><span className="sub">Recorded items</span></div>
          <div className="kpi-card"><span className="lbl">STORED</span><span className="val">{storedCount}</span><span className="sub">In hotel storage</span></div>
          <div className="kpi-card"><span className="lbl">UNCLAIMED</span><span className="val">{unclaimedCount}</span><span className="sub">Waiting for owner</span></div>
          <div className="kpi-card"><span className="lbl">RETURNED</span><span className="val">{returnedCount}</span><span className="sub">Returned to guests</span></div>
        </div>

        {/* TABLE */}
        <div className="panel">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '18px' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>Lost & Found Records</h3>
          </div>
          <div className="table-wrap">
            {isLoading ? (
              <PageSkeleton rows={4} label="Loading records" />
            ) : error ? (
              <div style={{ padding: '20px', color: '#dc2626' }}>{error}</div>
            ) : items.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No lost & found records yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Room</th><th>Item</th><th>Found Location</th>
                    <th>Found By</th><th>Date</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item._id} className="table-row-hover">
                      <td><strong style={{ color: 'var(--text-primary)' }}>LF-{String(item.item_id).padStart(3,'0')}</strong></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{item.room_number ? `Room ${item.room_number}` : '—'}</td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{item.item_name}</strong>
                        {item.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{item.notes}</div>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{item.location_found}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{item.found_by}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {item.found_date ? new Date(item.found_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td><span className={getStatusClass(item.status)}>{item.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {savingId === item._id ? (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>saving…</span>
                          ) : (
                            <>
                              {item.status === 'UNCLAIMED' && (
                                <button className="btn btn-xs" onClick={() => updateStatus(item._id, 'STORED')}>Store</button>
                              )}
                              {item.status !== 'RETURNED' && item.status !== 'CLAIMED' && (
                                <button className="btn btn-xs btn-gold" onClick={() => updateStatus(item._id, 'RETURNED')}>Return</button>
                              )}
                              <button className="btn btn-xs" style={{ color: 'var(--status-occ)' }} onClick={() => deleteItem(item._id)}>Delete</button>
                            </>
                          )}
                        </div>
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
              <h3 style={{ color: 'var(--text-primary)' }}>Report Found Item</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Record an item found during room cleaning.</p>
              <ValidatedForm onSubmit={addItem}>
                <div className="form-grid" style={{ marginBottom: '14px' }}>
                  <div className="form-group">
                    <label>Room Number</label>
                    <Input type="number" value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} placeholder="e.g. 304" />
                  </div>
                  <div className="form-group">
                    <label>Item Name <span className="required">*</span></label>
                    <Input type="text" value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} placeholder="e.g. Black Wallet" required />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Location Found <span className="required">*</span></label>
                  <Input type="text" value={formData.location_found} onChange={e => setFormData({...formData, location_found: e.target.value})} placeholder="e.g. Under the bed" required />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Found By <span className="required">*</span></label>
                  <Input type="text" value={formData.found_by} onChange={e => setFormData({...formData, found_by: e.target.value})} placeholder="Employee name" required />
                </div>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label>Notes</label>
                  <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Optional notes..." style={{ minHeight: '70px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
                  <SubmitButton type="submit" className="btn btn-gold">Save Item</SubmitButton>
                </div>
              </ValidatedForm>
          </PortalModal>
        )}

      </section>
    </div>
  );
}

export default LostAndFound;
