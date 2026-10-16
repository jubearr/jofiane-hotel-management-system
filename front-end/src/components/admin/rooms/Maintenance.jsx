import React, { useState, useEffect, useRef } from 'react';
import { usePolling } from '../../../hooks/usePolling';
import { authFetch } from '../../../utils/api';
import { Input, Select, Textarea, ValidatedForm, SubmitButton } from '../../common/FormControls';
import { PageSkeleton } from '../../common/SkeletonLoader';
import { createThemedPortal as createPortal } from '../../common/ThemePortal';

function Maintenance() {
  const [isLoading, setIsLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Filters
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTech, setFilterTech] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { applyFilters(); }, [workOrders, filterPriority, filterStatus, filterTech, searchQuery]);

  const firstLoad = useRef(true);

  const fetchWorkOrders = async () => {
    // Only show the full-page skeleton on the first load; polls refresh silently.
    if (firstLoad.current) setIsLoading(true);
    try {
      const [mainRes, empRes] = await Promise.all([
        authFetch('/api/maintenance-requests'),
        authFetch('/api/employees?department=Maintenance'),
      ]);
      if (!mainRes.ok) throw new Error(`Server error: ${mainRes.status}`);

      const [mainData, empData] = await Promise.all([mainRes.json(), empRes.ok ? empRes.json() : []]);

      // Normalise maintenance_requests → work order shape
      const normalized = mainData.map(r => ({
        id:             `MNT-${String(r.maintenance_id).padStart(3, '0')}`,
        _id:            r._id,
        room:           String(r.room_number || ''),
        issue:          `${r.issue_type || ''}${r.description ? ` — ${r.description}` : ''}`,
        issue_type:     r.issue_type || '',
        description:    r.description || '',
        priority:       (r.priority || 'NORMAL').toLowerCase()
                          .replace('urgent', 'critical')
                          .replace('normal', 'medium'),
        assignedTo:     r.assigned_to_name || '',
        assigned_id:    r.assigned_to || null,
        status:         (r.status || 'PENDING').toLowerCase()
                          .replace('pending', 'open')
                          .replace('in progress', 'in-progress'),
        dateReported:   r.reported_at || r.createdAt || new Date().toISOString(),
        completedAt:    r.completed_at || null,
        roomOutOfOrder: r.room_out_of_order || false,
        notes:          r.notes || '',
        history:        r.history || [{ date: r.reported_at || r.createdAt, action: 'Work order created', by: 'System' }],
      }));

      // Build technician list from maintenance-dept employees
      const techs = empData.map(e => ({ id: e._id, name: e.full_name || '' }));

      setTechnicians(techs.length ? techs : [
        { id: 1, name: 'Ronnie Cruz' },
        { id: 2, name: 'Jessie Ramos' },
        { id: 3, name: 'Carlo Aquino' },
      ]);
      setWorkOrders(normalized);
    } catch (err) {
      console.error('Failed to fetch maintenance data:', err);
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  const applyFilters = () => {
    let result = [...workOrders];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => o.id.toLowerCase().includes(q) || o.room.includes(q) || o.issue.toLowerCase().includes(q));
    }
    if (filterPriority !== 'all') result = result.filter(o => o.priority === filterPriority);
    if (filterStatus !== 'all') result = result.filter(o => o.status === filterStatus);
    if (filterTech !== 'all') result = result.filter(o => o.assignedTo === filterTech);
    setFilteredOrders(result);
  };

  usePolling(fetchWorkOrders, 15000);

  const handleCreateOrder = () => { setEditingOrder(null); setShowModal(true); };

  const handleSaveOrder = async (orderData) => {
    try {
      const priorityMap = { low: 'LOW', medium: 'NORMAL', high: 'HIGH', critical: 'URGENT' };
      const statusMap   = { open: 'PENDING', 'in-progress': 'IN PROGRESS', completed: 'COMPLETED', deferred: 'PENDING' };

      const payload = {
        room_number:      parseInt(orderData.room) || 0,
        issue_type:       orderData.issue_type || orderData.issue,
        description:      orderData.description || orderData.issue,
        priority:         priorityMap[orderData.priority] || 'NORMAL',
        status:           statusMap[orderData.status] || 'PENDING',
        assigned_to_name: orderData.assignedTo || '',
        room_out_of_order: orderData.roomOutOfOrder || false,
        notes:            orderData.notes || '',
      };

      if (editingOrder?._id) {
        const res = await authFetch(`/api/maintenance-requests/${editingOrder._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
      } else {
        const res = await authFetch('/api/maintenance-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
      }
      await fetchWorkOrders();
    } catch (err) {
      console.error('Failed to save work order:', err);
      alert('Failed to save work order. Please try again.');
    }
    setShowModal(false);
    setEditingOrder(null);
  };

  const updateStatus = async (orderId, newStatus) => {
    const order = workOrders.find(o => o.id === orderId);
    if (!order?._id) return;
    const statusMap = { open: 'PENDING', 'in-progress': 'IN PROGRESS', completed: 'COMPLETED', deferred: 'PENDING' };
    try {
      const res = await authFetch(`/api/maintenance-requests/${order._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusMap[newStatus] || 'PENDING' }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      // Update local state immediately for responsive UI
      setWorkOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status.');
    }
  };

  const toggleOutOfOrder = async (orderId) => {
    const order = workOrders.find(o => o.id === orderId);
    if (!order?._id) return;
    const newVal = !order.roomOutOfOrder;
    try {
      const res = await authFetch(`/api/maintenance-requests/${order._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_out_of_order: newVal }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setWorkOrders(prev => prev.map(o => o.id === orderId ? { ...o, roomOutOfOrder: newVal } : o));
    } catch (err) {
      console.error('Failed to toggle OOO:', err);
    }
  };

  // Helpers
  const openCount = workOrders.filter(o => o.status === 'open').length;
  const inProgressCount = workOrders.filter(o => o.status === 'in-progress').length;
  const criticalCount = workOrders.filter(o => o.priority === 'critical' && o.status !== 'completed').length;
  const outOfOrderCount = workOrders.filter(o => o.roomOutOfOrder).length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' };
      case 'high': return { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' };
      case 'medium': return { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' };
      case 'low': return { bg: '#f3f4f6', text: '#4b5563', dot: '#9ca3af' };
      default: return { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'deferred': return 'Deferred';
      default: return status;
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'open': return <span className="status-tag tag-warning">Open</span>;
      case 'in-progress': return <span className="status-tag tag-gold">In Progress</span>;
      case 'completed': return <span className="status-tag tag-success">Completed</span>;
      case 'deferred': return <span className="status-tag tag-neutral">Deferred</span>;
      default: return <span className="status-tag tag-neutral">{status}</span>;
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Maintenance</h2>
          <p>Work orders and repair tracking</p>
        </div>
        <div className="right">
        </div>
      </div>

      {/* SUMMARY BAR */}
      <div className="panel" style={{ padding: '20px 28px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '28px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#f59e0b' }}>{openCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Open</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--gold)' }}>{inProgressCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>In Progress</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#ef4444' }}>{criticalCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Critical</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-muted)' }}>{outOfOrderCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Out of Order</div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {workOrders.length} total work orders
          </div>
        </div>
      </div>

      {/* WORK ORDER TABLE */}
      <div className="panel">
        <div className="panel-header">
          <h3>Work Orders ({filteredOrders.length})</h3>

          {/* SEARCH + FILTERS */}
          <div className="panel-toolbar">
            <div className="panel-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <Input
                type="text"
                placeholder="Search by ID, room, or issue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select className="floor-dropdown" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            <Select className="floor-dropdown" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="deferred">Deferred</option>
            </Select>
            <Select className="floor-dropdown" value={filterTech} onChange={(e) => setFilterTech(e.target.value)}>
              <option value="all">All Technicians</option>
              {technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              <option value="">Unassigned</option>
            </Select>
            <button className="btn btn-sm btn-gold" onClick={handleCreateOrder}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              New Work Order
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Room</th>
                <th>Issue</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Reported</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No work orders match the current filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const pColor = getPriorityColor(order.priority);
                  return (
                    <tr key={order.id} className="table-row-hover" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                      <td><span className="guest-name">{order.id}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="std-text">{order.room}</span>
                          {order.roomOutOfOrder && (
                            <span style={{ fontSize: '9px', padding: '2px 6px', background: '#fee2e2', color: '#991b1b', borderRadius: '10px', fontWeight: '700' }}>OOO</span>
                          )}
                        </div>
                      </td>
                      <td><span className="std-text" style={{ maxWidth: '220px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.issue}</span></td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '10px', background: pColor.bg, fontSize: '10px', fontWeight: '700', color: pColor.text, textTransform: 'uppercase' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pColor.dot }}></span>
                          {order.priority}
                        </span>
                      </td>
                      <td><span className="std-text">{order.assignedTo || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>}</span></td>
                      <td>{getStatusTag(order.status)}</td>
                      <td><span className="std-text">{formatDate(order.dateReported)}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WORK ORDER DETAIL / ACTION POPUP */}
      {selectedOrder && createPortal(
        <OrderDetailModal
          order={selectedOrder}
          technicians={technicians}
          getPriorityColor={getPriorityColor}
          getStatusLabel={getStatusLabel}
          getStatusTag={getStatusTag}
          formatDateTime={formatDateTime}
          onUpdateStatus={(status) => { updateStatus(selectedOrder.id, status); setSelectedOrder({ ...selectedOrder, status }); }}
          onToggleOOO={() => { toggleOutOfOrder(selectedOrder.id); setSelectedOrder({ ...selectedOrder, roomOutOfOrder: !selectedOrder.roomOutOfOrder }); }}
          onAssign={async (tech) => {
              const order = workOrders.find(o => o.id === selectedOrder.id);
              if (order?._id) {
                await authFetch(`/api/maintenance-requests/${order._id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ assigned_to_name: tech }),
                });
              }
              setWorkOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, assignedTo: tech } : o));
              setSelectedOrder({ ...selectedOrder, assignedTo: tech });
            }}
          onClose={() => setSelectedOrder(null)}
        />,
        document.body
      )}

      {/* NEW WORK ORDER MODAL */}
      {showModal && createPortal(
        <WorkOrderModal
          order={editingOrder}
          technicians={technicians}
          onClose={() => { setShowModal(false); setEditingOrder(null); }}
          onSave={handleSaveOrder}
        />,
        document.body
      )}
    </section>
  );
}

/* ============================================================
   ORDER DETAIL / ACTION POPUP
   ============================================================ */
function OrderDetailModal({ order, technicians, getPriorityColor, getStatusLabel, getStatusTag, formatDateTime, onUpdateStatus, onToggleOOO, onAssign, onClose }) {
  const pColor = getPriorityColor(order.priority);

  return (
    <div className="modal-overlay open">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{order.id}</h3>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '10px', background: pColor.bg, fontSize: '10px', fontWeight: '700', color: pColor.text, textTransform: 'uppercase' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pColor.dot }}></span>
            {order.priority}
          </span>
          {getStatusTag(order.status)}
          {order.roomOutOfOrder && (
            <span style={{ fontSize: '9px', padding: '3px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: '10px', fontWeight: '700' }}>OUT OF ORDER</span>
          )}
        </div>

        {/* Room + Issue */}
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>Room {order.room}</p>
        <div style={{ background: 'var(--bg-input)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Issue</div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.5' }}>{order.issue}</div>
        </div>

        {/* Info row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Assigned To</div>
            <Select
              className="floor-dropdown"
              style={{ width: '100%', fontSize: '12px' }}
              value={order.assignedTo}
              onChange={(e) => onAssign(e.target.value)}
            >
              <option value="">Unassigned</option>
              {technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </Select>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Reported</div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', padding: '8px 0' }}>{formatDateTime(order.dateReported)}</div>
          </div>
        </div>

        {/* History Timeline */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>History</div>
          <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '20px', position: 'relative', maxHeight: '180px', overflowY: 'auto' }}>
            <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'var(--border-light)' }}></div>
            {order.history.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', paddingBottom: '14px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-16px', top: '6px', width: '10px', height: '10px', borderRadius: '50%', background: i === order.history.length - 1 ? 'var(--gold)' : 'var(--border-light)', border: '2px solid var(--bg-card)' }}></div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>{entry.action}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatDateTime(entry.date)} · {entry.by}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="modal-divider" />

        {/* ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {order.status === 'open' && (
            <button className="btn btn-sm btn-gold" onClick={() => onUpdateStatus('in-progress')}>
              Start Work
            </button>
          )}
          {order.status === 'in-progress' && (
            <button className="btn btn-sm" style={{ background: '#d1fae5', color: '#065f46', borderColor: '#a7f3d0' }} onClick={() => onUpdateStatus('completed')}>
              Mark Completed
            </button>
          )}
          {order.status !== 'deferred' && order.status !== 'completed' && (
            <button className="btn btn-sm" onClick={() => onUpdateStatus('deferred')}>
              Defer
            </button>
          )}
          {order.status === 'deferred' && (
            <button className="btn btn-sm" onClick={() => onUpdateStatus('open')}>
              Reopen
            </button>
          )}
          <button className="btn btn-sm" style={{ background: order.roomOutOfOrder ? '#d1fae5' : '#fee2e2', color: order.roomOutOfOrder ? '#065f46' : '#991b1b', borderColor: order.roomOutOfOrder ? '#a7f3d0' : '#fecaca' }} onClick={onToggleOOO}>
            {order.roomOutOfOrder ? 'Return to Inventory' : 'Mark Out of Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   WORK ORDER MODAL
   ============================================================ */
function WorkOrderModal({ order, technicians, onClose, onSave }) {
  const [formData, setFormData] = useState({
    room: order?.room || '',
    issue: order?.issue || '',
    priority: order?.priority || 'medium',
    assignedTo: order?.assignedTo || '',
    status: order?.status || 'open',
    roomOutOfOrder: order?.roomOutOfOrder || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.room || !formData.issue) {
      alert('Please fill in room number and issue description.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
          {order ? `Edit ${order.id}` : 'New Work Order'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          {order ? 'Update work order details' : 'Report a maintenance issue'}
        </p>

        <ValidatedForm onSubmit={handleSubmit}>
          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Room Number <span className="required">*</span></label>
              <Input type="text" value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} placeholder="e.g. 204" />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <Select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label>Issue Description <span className="required">*</span></label>
            <Textarea value={formData.issue} onChange={(e) => setFormData({ ...formData, issue: e.target.value })} placeholder="Describe the problem..." style={{ minHeight: '80px' }} />
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Assign Technician</label>
              <Select value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </Select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="deferred">Deferred</option>
              </Select>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
              <Input type="checkbox" checked={formData.roomOutOfOrder} onChange={(e) => setFormData({ ...formData, roomOutOfOrder: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--gold)' }} />
              Mark room as Out of Order (removes from available inventory)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <SubmitButton type="submit" className="btn btn-gold">{order ? 'Save Changes' : 'Create Work Order'}</SubmitButton>
          </div>
        </ValidatedForm>
      </div>
    </div>
  );
}

export default Maintenance;
