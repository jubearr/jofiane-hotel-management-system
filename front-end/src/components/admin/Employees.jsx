import React, { useState, useEffect } from 'react';

function Employees({ employees, openModal }) {
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewingEmployee, setViewingEmployee] = useState(null);

  useEffect(() => {
    if (viewingEmployee) {
      const updatedEmp = employees.find(e => e.id === viewingEmployee.id);
      if (updatedEmp) {
        setViewingEmployee(updatedEmp);
      } else {
        setViewingEmployee(null); 
      }
    }
  }, [employees, viewingEmployee]);

  const uniqueRoles = ['All', ...new Set(employees.map(emp => emp.role))];
  const uniqueStatuses = ['All', 'Active', 'On Leave', 'Terminated'];

  const filteredEmployees = employees.filter(emp => {
    const matchRole = roleFilter === 'All' || emp.role === roleFilter;
    const matchStatus = statusFilter === 'All' || emp.status === statusFilter;
    return matchRole && matchStatus;
  });

  const activeCount = employees.filter(e => e.status === 'Active').length;

  return (
    <div className="admin-tab-content active">
      <div className="page-header">
        <div className="left">
          <h2>Employee Management</h2>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-card">
          <span className="lbl">TOTAL STAFF</span>
          <span className="val">{employees.length}</span>
          <span className="sub">Across all departments</span>
        </div>
        <div className="kpi-card">
          <span className="lbl">ACTIVE STAFF</span>
          <span className="val">{activeCount}</span>
          <span className="sub">Currently scheduled</span>
        </div>
        <div className="kpi-card">
          <span className="lbl">PAYROLL (MTD)</span>
          <span className="val">₱145,000</span>
          <span className="sub"><span className="trend-up">Regular Billing Cycle</span></span>
        </div>
      </div>
      
      {viewingEmployee ? (
        <div className="panel animation-fade-in">
          
          {/* Detailed View Header */}
          <div className="panel-header" style={{ 
            flexDirection: 'column', 
            alignItems: 'flex-start', 
            borderBottom: '1px solid var(--border-light)', 
            paddingBottom: '25px', 
            marginBottom: '30px', 
            gap: '20px' 
          }}>
            
            {/* Top Action Row (Updated Edit Profile Button) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button className="ledger-btn" onClick={() => setViewingEmployee(null)} style={{ padding: '6px 12px' }}>
                ← BACK
              </button>
              
              <button 
                className="btn btn-gold" 
                onClick={() => openModal(viewingEmployee)}
                style={{ padding: '10px 20px', fontSize: '13px', fontWeight: '600', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
              >
                Edit Profile
              </button>
            </div>

            {/* Enlarged Profile Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px', paddingLeft: '10px' }}>
              <img 
                src={viewingEmployee.photo} 
                alt={viewingEmployee.name} 
                style={{ 
                  width: '90px', 
                  height: '90px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '3px solid var(--border-light)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                }} 
              />
              <div>
                <h3 style={{ fontSize: '28px', margin: '0 0 6px 0', fontFamily: "'Playfair Display', serif" }}>
                  {viewingEmployee.name}
                </h3>
                <span className="room-type-sub" style={{ fontSize: '14px' }}>
                  {viewingEmployee.email}
                </span>
              </div>
            </div>

          </div>

          <div className="dashboard-split" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '30px' }}>
            <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '15px' }}>Employment Details</h4>
              <table style={{ width: '100%', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>Role</td>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>{viewingEmployee.role}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>Standard Shift</td>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>
                      {viewingEmployee.start && viewingEmployee.end ? `${viewingEmployee.start} - ${viewingEmployee.end}` : 'Unassigned'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>Monthly Salary</td>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>₱{Number(viewingEmployee.salary).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', borderBottom: 'none', color: 'var(--text-muted)' }}>Status</td>
                    <td style={{ padding: '8px 0', borderBottom: 'none' }}>
                      <span className={`status-tag ${viewingEmployee.status === 'Active' ? 'tag-checked-in' : viewingEmployee.status === 'Terminated' ? 'tag-danger' : 'tag-arriving'}`}>
                        {viewingEmployee.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '15px' }}>System Access & Stats</h4>
              <table style={{ width: '100%', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>Employee ID</td>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontWeight: 600, fontFamily: 'monospace' }}>EMP-{viewingEmployee.id.toString().padStart(4, '0')}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>Portal Access</td>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>
                      {viewingEmployee.status === 'Active' ? 'Granted' : 'Revoked'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>Shifts Completed (MTD)</td>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>14</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', borderBottom: 'none', color: 'var(--text-muted)' }}>Last Login</td>
                    <td style={{ padding: '8px 0', borderBottom: 'none', fontWeight: 600 }}>Today, 05:45 AM</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <h4 style={{ fontSize: '18px', fontFamily: "'Playfair Display', serif", fontWeight: 500, marginBottom: '20px' }}>Recent Shift Log</h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 0 }}>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Total Hours</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table-row-hover">
                  <td style={{ paddingLeft: 0 }}><span className="std-text">Aug 6, 2026</span></td>
                  <td><span className="std-text">05:52 AM</span></td>
                  <td><span className="std-text">02:05 PM</span></td>
                  <td><span className="std-text">8h 13m</span></td>
                  <td><span className="status-tag tag-success">On Time</span></td>
                </tr>
                <tr className="table-row-hover">
                  <td style={{ paddingLeft: 0 }}><span className="std-text">Aug 5, 2026</span></td>
                  <td><span className="std-text">05:58 AM</span></td>
                  <td><span className="std-text">02:00 PM</span></td>
                  <td><span className="std-text">8h 02m</span></td>
                  <td><span className="status-tag tag-success">On Time</span></td>
                </tr>
                <tr className="table-row-hover">
                  <td style={{ paddingLeft: 0 }}><span className="std-text">Aug 4, 2026</span></td>
                  <td><span className="std-text">06:15 AM</span></td>
                  <td><span className="std-text">02:30 PM</span></td>
                  <td><span className="std-text">8h 15m</span></td>
                  <td><span className="status-tag tag-danger">Late Arrival</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        <div className="panel animation-fade-in">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '20px', marginBottom: '20px' }}>
            <h3>Staff Roster</h3>
            {}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', background: 'var(--bg-main)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Filter by Position</label>
              <select className="floor-dropdown" style={{ width: '100%' }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Filter by Status</label>
              <select className="floor-dropdown" style={{ width: '100%' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="ledger-btn" onClick={() => { setRoleFilter('All'); setStatusFilter('All'); }}>
                CLEAR FILTERS
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 0 }}>EMPLOYEE / ACCOUNT</th>
                  <th>POSITION / SHIFT</th>
                  <th>SALARY</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="clickable-row table-row-hover" onClick={() => setViewingEmployee(emp)}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: 0 }}>
                        <img 
                          src={emp.photo} 
                          alt={emp.name} 
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                        <div>
                          <span className="guest-name" style={{ marginBottom: 0 }}>{emp.name}</span>
                          <span className="room-type-sub">{emp.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="std-text">{emp.role}</span>
                        <span className="room-type-sub">
                          {emp.start && emp.end ? `${emp.start} - ${emp.end}` : 'Unassigned'}
                        </span>
                      </td>
                      <td><span className="std-text">₱{Number(emp.salary).toLocaleString()}<span className="room-type-sub" style={{ display: 'inline' }}>/mo</span></span></td>
                      <td>
                        <span className={`status-tag ${emp.status === 'Active' ? 'tag-checked-in' : emp.status === 'Terminated' ? 'tag-danger' : 'tag-arriving'}`}>
                          {emp.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <span style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: 'bold' }}>›</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No employees found matching those filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;