import React, { useState, useEffect } from 'react';
import employee1 from '../../../assets/employee1.jpeg';

function StaffList() {
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const departments = ['Front Desk', 'Housekeeping', 'Maintenance', 'F&B', 'Admin'];

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { applyFilters(); }, [employees, searchQuery, filterDept, filterStatus]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await fetch('http://localhost:8080/api/admin/employees');
      // const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockEmployees = [
        { id: 1, name: 'Ana Buenaflor', email: 'ana@jofiane.com', phone: '+63 917 123 4567', role: 'Front Desk Concierge', department: 'Front Desk', salary: 18000, shift: '06:00 - 14:00', status: 'Active', hireDate: '2024-03-15', photo: employee1, portalAccess: true, username: 'ana.buenaflor' },
        { id: 2, name: 'Marco Diaz', email: 'marco@jofiane.com', phone: '+63 918 234 5678', role: 'Night Auditor', department: 'Front Desk', salary: 22000, shift: '22:00 - 06:00', status: 'Active', hireDate: '2023-11-01', photo: employee1, portalAccess: true, username: 'marco.diaz' },
        { id: 3, name: 'Liza Fernandez', email: 'liza@jofiane.com', phone: '+63 919 345 6789', role: 'Housekeeping Lead', department: 'Housekeeping', salary: 19500, shift: '07:00 - 15:00', status: 'On Leave', hireDate: '2024-01-10', photo: employee1, portalAccess: true, username: 'liza.fernandez' },
        { id: 4, name: 'Ronnie Cruz', email: 'ronnie@jofiane.com', phone: '+63 920 456 7890', role: 'Maintenance Technician', department: 'Maintenance', salary: 20000, shift: '09:00 - 17:00', status: 'Active', hireDate: '2023-08-20', photo: employee1, portalAccess: true, username: 'ronnie.cruz' },
        { id: 5, name: 'Maria Santos', email: 'maria@jofiane.com', phone: '+63 921 567 8901', role: 'Housekeeper', department: 'Housekeeping', salary: 16000, shift: '06:00 - 14:00', status: 'Active', hireDate: '2024-05-01', photo: employee1, portalAccess: true, username: 'maria.santos' },
        { id: 6, name: 'Carlo Aquino', email: 'carlo@jofiane.com', phone: '+63 922 678 9012', role: 'Maintenance Technician', department: 'Maintenance', salary: 20000, shift: '09:00 - 17:00', status: 'Active', hireDate: '2025-02-15', photo: employee1, portalAccess: true, username: 'carlo.aquino' },
        { id: 7, name: 'David Reyes', email: 'david@jofiane.com', phone: '+63 923 789 0123', role: 'Bellhop', department: 'Front Desk', salary: 15000, shift: '', status: 'Terminated', hireDate: '2023-06-01', photo: employee1, portalAccess: false, username: 'david.reyes' },
        { id: 8, name: 'Rosa Villanueva', email: 'rosa@jofiane.com', phone: '+63 924 890 1234', role: 'Housekeeper', department: 'Housekeeping', salary: 16000, shift: '06:00 - 14:00', status: 'Active', hireDate: '2024-07-20', photo: employee1, portalAccess: true, username: 'rosa.villanueva' },
        { id: 9, name: 'Jessie Ramos', email: 'jessie@jofiane.com', phone: '+63 925 901 2345', role: 'Maintenance Supervisor', department: 'Maintenance', salary: 25000, shift: '08:00 - 16:00', status: 'Active', hireDate: '2022-09-10', photo: employee1, portalAccess: true, username: 'jessie.ramos' },
        { id: 10, name: 'Carmen Diaz', email: 'carmen@jofiane.com', phone: '+63 926 012 3456', role: 'F&B Attendant', department: 'F&B', salary: 16500, shift: '10:00 - 18:00', status: 'Active', hireDate: '2025-01-05', photo: employee1, portalAccess: true, username: 'carmen.diaz' },
      ];

      setEmployees(mockEmployees);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...employees];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
    }
    if (filterDept !== 'all') result = result.filter(e => e.department === filterDept);
    if (filterStatus !== 'all') result = result.filter(e => e.status === filterStatus);
    setFilteredEmployees(result);
  };

  const handleAdd = () => { setEditingEmployee(null); setShowAddEdit(true); };
  const handleEdit = (emp) => { setEditingEmployee(emp); setShowAddEdit(true); setSelectedEmployee(null); };

  const handleDelete = (emp) => {
    if (!window.confirm(`Delete ${emp.name}? This cannot be undone.`)) return;
    // TODO: DELETE to API
    setEmployees(prev => prev.filter(e => e.id !== emp.id));
    setSelectedEmployee(null);
  };

  const handleSave = (empData) => {
    if (editingEmployee) {
      // TODO: PUT to API
      setEmployees(prev => prev.map(e => e.id === editingEmployee.id ? { ...e, ...empData } : e));
    } else {
      // TODO: POST to API
      const newEmp = { ...empData, id: Math.max(...employees.map(e => e.id), 0) + 1, photo: employee1 };
      setEmployees(prev => [...prev, newEmp]);
    }
    setShowAddEdit(false);
    setEditingEmployee(null);
  };

  const handleStatusChange = (empId, newStatus) => {
    // TODO: PUT to API
    const portalAccess = newStatus === 'Active';
    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, status: newStatus, portalAccess } : e));
    if (selectedEmployee?.id === empId) {
      setSelectedEmployee(prev => ({ ...prev, status: newStatus, portalAccess }));
    }
  };

  // Stats
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const onLeaveCount = employees.filter(e => e.status === 'On Leave').length;
  const terminatedCount = employees.filter(e => e.status === 'Terminated').length;

  const getStatusTag = (status) => {
    switch (status) {
      case 'Active': return <span className="status-tag tag-success">Active</span>;
      case 'On Leave': return <span className="status-tag tag-warning">On Leave</span>;
      case 'Terminated': return <span className="status-tag tag-danger">Terminated</span>;
      default: return <span className="status-tag tag-neutral">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <section className="admin-tab-content active">
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading staff list...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-tab-content active">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Staff List</h2>
          <p>Employee directory and HR management</p>
        </div>
        <div className="right">
          <button className="btn btn-sm btn-gold" onClick={handleAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Employee
          </button>
        </div>
      </div>

      {/* SUMMARY BAR */}
      <div className="panel" style={{ padding: '20px 28px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)' }}>{employees.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total<br/>Staff</div>
          </div>
          <div style={{ width: '1px', height: '36px', background: 'var(--border-light)' }}></div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-vac)' }}>{activeCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>{onLeaveCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>On Leave</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-occ)' }}>{terminatedCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Terminated</div>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {departments.map(dept => {
              const count = employees.filter(e => e.department === dept).length;
              return (
                <button
                  key={dept}
                  onClick={() => setFilterDept(filterDept === dept ? 'all' : dept)}
                  style={{
                    padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                    background: filterDept === dept ? 'rgba(201,168,76,0.1)' : 'var(--bg-input)',
                    border: filterDept === dept ? '1px solid var(--gold)' : '1px solid var(--border-light)',
                    color: filterDept === dept ? 'var(--gold-dark)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {dept} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="panel" style={{ padding: '16px 24px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Search by name, role, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', fontSize: '13px' }}
            />
          </div>
          <select className="floor-dropdown" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* EMPLOYEE TABLE */}
      <div className="panel">
        <div className="panel-header">
          <h3>Employees ({filteredEmployees.length})</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Shift</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No employees found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="table-row-hover" onClick={() => setSelectedEmployee(emp)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={emp.photo} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <span className="guest-name">{emp.name}</span>
                          <span className="guest-sub">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="std-text">{emp.role}</span></td>
                    <td><span className="std-text">{emp.department}</span></td>
                    <td><span className="std-text">{emp.phone}</span></td>
                    <td><span className="std-text">{emp.shift || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>}</span></td>
                    <td>{getStatusTag(emp.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMPLOYEE PROFILE MODAL */}
      {selectedEmployee && (
        <ProfileModal
          employee={selectedEmployee}
          getStatusTag={getStatusTag}
          onEdit={() => handleEdit(selectedEmployee)}
          onDelete={() => handleDelete(selectedEmployee)}
          onStatusChange={(status) => handleStatusChange(selectedEmployee.id, status)}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {/* ADD/EDIT MODAL */}
      {showAddEdit && (
        <EmployeeFormModal
          employee={editingEmployee}
          departments={departments}
          onClose={() => { setShowAddEdit(false); setEditingEmployee(null); }}
          onSave={handleSave}
        />
      )}
    </section>
  );
}

/* ============================================================
   EMPLOYEE PROFILE MODAL
   ============================================================ */
function ProfileModal({ employee, getStatusTag, onEdit, onDelete, onStatusChange, onClose }) {
  const [showCredentials, setShowCredentials] = useState(false);

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <img src={employee.photo} alt={employee.name} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-light)' }} />
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 4px 0' }}>{employee.name}</h3>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{employee.role} · {employee.department}</div>
            <div style={{ marginTop: '6px' }}>{getStatusTag(employee.status)}</div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <DetailItem label="Email" value={employee.email} />
          <DetailItem label="Phone" value={employee.phone} />
          <DetailItem label="Shift" value={employee.shift || 'Unassigned'} />
          <DetailItem label="Salary" value={`${employee.salary.toLocaleString()} /mo`} />
          <DetailItem label="Hire Date" value={new Date(employee.hireDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
          <DetailItem label="Employee ID" value={`EMP-${employee.id.toString().padStart(4, '0')}`} />
        </div>

        {/* Portal Access */}
        <div style={{ background: 'var(--bg-input)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCredentials ? '12px' : '0' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Portal Access</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: employee.portalAccess ? 'var(--status-vac)' : 'var(--status-occ)' }}>
                {employee.portalAccess ? 'Granted' : 'Revoked'}
              </div>
            </div>
            <button className="btn btn-xs" onClick={() => setShowCredentials(!showCredentials)}>
              {showCredentials ? 'Hide' : 'Show'} Credentials
            </button>
          </div>
          {showCredentials && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Username</div>
                <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{employee.username}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Password</div>
                <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>••••••••</div>
              </div>
            </div>
          )}
        </div>

        {/* Status Management */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Change Status</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Active', 'On Leave', 'Terminated'].map(status => (
              <button
                key={status}
                className={`btn btn-xs ${employee.status === status ? 'btn-gold' : ''}`}
                onClick={() => onStatusChange(status)}
                disabled={employee.status === status}
                style={{ opacity: employee.status === status ? 0.6 : 1 }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <hr className="modal-divider" />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
          <button className="btn btn-sm" style={{ color: 'var(--status-occ)' }} onClick={onDelete}>Delete Employee</button>
          <button className="btn btn-sm btn-gold" onClick={onEdit}>Edit Profile</button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

/* ============================================================
   ADD / EDIT EMPLOYEE MODAL
   ============================================================ */
function EmployeeFormModal({ employee, departments, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    role: employee?.role || '',
    department: employee?.department || departments[0],
    salary: employee?.salary || '',
    shift: employee?.shift || '',
    status: employee?.status || 'Active',
    hireDate: employee?.hireDate || new Date().toISOString().split('T')[0],
    portalAccess: employee?.portalAccess ?? true,
    username: employee?.username || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      alert('Please fill in required fields (Name, Email, Role).');
      return;
    }
    onSave({ ...formData, salary: parseFloat(formData.salary) || 0 });
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
          {employee ? `Edit ${employee.name}` : 'Add New Employee'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          {employee ? 'Update employee information' : 'Add an employee to the directory'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Juan Dela Cruz" />
            </div>
            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="e.g. juan@jofiane.com" />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+63 9xx xxx xxxx" />
            </div>
            <div className="form-group">
              <label>Role / Position <span className="required">*</span></label>
              <input type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} placeholder="e.g. Front Desk Concierge" />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Department</label>
              <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Salary (monthly)</label>
              <input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} placeholder="0" min="0" />
            </div>
            <div className="form-group">
              <label>Shift</label>
              <input type="text" value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} placeholder="e.g. 06:00 - 14:00" />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Hire Date</label>
              <input type="date" value={formData.hireDate} onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Portal Username</label>
              <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="e.g. juan.delacruz" />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
              <input type="checkbox" checked={formData.portalAccess} onChange={(e) => setFormData({ ...formData, portalAccess: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--gold)' }} />
              Grant Employee Portal access
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gold">{employee ? 'Save Changes' : 'Add Employee'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StaffList;
