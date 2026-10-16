import React, { useState, useEffect } from 'react';

const SHIFT_TYPES = [
  { id: 'morning', label: 'Morning', time: '6am–2pm', color: '#fef3c7', textColor: '#92400e', dot: '#f59e0b' },
  { id: 'afternoon', label: 'Afternoon', time: '2pm–10pm', color: '#dbeafe', textColor: '#1e40af', dot: '#3b82f6' },
  { id: 'night', label: 'Night', time: '10pm–6am', color: '#ede9fe', textColor: '#5b21b6', dot: '#8b5cf6' },
  { id: 'off', label: 'Off', time: '', color: '#f3f4f6', textColor: '#6b7280', dot: '#9ca3af' }
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ShiftSchedules() {
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [swapRequests, setSwapRequests] = useState([]);
  const [filterDept, setFilterDept] = useState('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingCell, setEditingCell] = useState(null);

  const departments = ['Front Desk', 'Housekeeping', 'Maintenance', 'F&B'];
  // Minimum staff per shift
  const minCoverage = { morning: 3, afternoon: 3, night: 2 };

  useEffect(() => { fetchSchedule(); }, [weekOffset]);

  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + (weekOffset * 7));
    return DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();
  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await fetch(`http://localhost:8080/api/admin/shifts?weekOffset=${weekOffset}`);
      // const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 400));

      const mockEmployees = [
        { id: 1, name: 'Ana Buenaflor', department: 'Front Desk', role: 'Concierge' },
        { id: 2, name: 'Marco Diaz', department: 'Front Desk', role: 'Night Auditor' },
        { id: 3, name: 'Liza Fernandez', department: 'Housekeeping', role: 'Lead' },
        { id: 4, name: 'Maria Santos', department: 'Housekeeping', role: 'Housekeeper' },
        { id: 5, name: 'Rosa Villanueva', department: 'Housekeeping', role: 'Housekeeper' },
        { id: 6, name: 'Ronnie Cruz', department: 'Maintenance', role: 'Technician' },
        { id: 7, name: 'Carlo Aquino', department: 'Maintenance', role: 'Technician' },
        { id: 8, name: 'Jessie Ramos', department: 'Maintenance', role: 'Supervisor' },
        { id: 9, name: 'Carmen Diaz', department: 'F&B', role: 'Attendant' },
        { id: 10, name: 'Elena Cruz', department: 'Housekeeping', role: 'Housekeeper' },
      ];

      // Generate schedule: { "empId-dayIndex": shiftId }
      const mockSchedule = {};
      mockEmployees.forEach(emp => {
        DAYS.forEach((_, dayIdx) => {
          const key = `${emp.id}-${dayIdx}`;
          if (emp.name === 'Marco Diaz') {
            mockSchedule[key] = dayIdx === 5 || dayIdx === 6 ? 'off' : 'night';
          } else if (dayIdx === 6) {
            mockSchedule[key] = 'off';
          } else if (dayIdx === 5) {
            mockSchedule[key] = Math.random() > 0.5 ? 'morning' : 'off';
          } else {
            const shifts = ['morning', 'afternoon', 'morning'];
            mockSchedule[key] = shifts[emp.id % 3];
          }
        });
      });

      const mockSwaps = [
        { id: 1, from: 'Maria Santos', to: 'Rosa Villanueva', day: 'Thu', shift: 'Morning', reason: 'Medical appointment', status: 'pending' },
        { id: 2, from: 'Carlo Aquino', to: 'Ronnie Cruz', day: 'Fri', shift: 'Morning', reason: 'Family event', status: 'pending' },
      ];

      setEmployees(mockEmployees);
      setSchedule(mockSchedule);
      setSwapRequests(mockSwaps);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const assignShift = (empId, dayIdx, shiftId) => {
    // TODO: PUT to API
    const key = `${empId}-${dayIdx}`;
    setSchedule(prev => ({ ...prev, [key]: shiftId }));
    setEditingCell(null);
  };

  const handleSwapAction = (swapId, action) => {
    // TODO: PUT to API
    setSwapRequests(prev => prev.map(s => s.id === swapId ? { ...s, status: action } : s));
  };

  // Coverage calculation per day
  const getCoverage = (dayIdx, shiftId) => {
    return employees.filter(emp => {
      const key = `${emp.id}-${dayIdx}`;
      return schedule[key] === shiftId;
    }).length;
  };

  const filteredEmployees = filterDept === 'all' ? employees : employees.filter(e => e.department === filterDept);
  const pendingSwaps = swapRequests.filter(s => s.status === 'pending');

  if (isLoading) {
    return (
      <section className="admin-tab-content active">
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading shift schedules...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-tab-content active">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Shift Schedules</h2>
          <p>Weekly staff scheduling board</p>
        </div>
        <div className="right">
          {pendingSwaps.length > 0 && (
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '5px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '20px' }}>
              {pendingSwaps.length} swap request{pendingSwaps.length > 1 ? 's' : ''}
            </span>
          )}
          <button className="btn btn-sm btn-outline-gold" onClick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print
          </button>
        </div>
      </div>

      {/* WEEK NAVIGATION + FILTERS */}
      <div className="panel" style={{ padding: '16px 24px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>

          {/* Week nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-xs" onClick={() => setWeekOffset(prev => prev - 1)}>← Prev</button>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', minWidth: '180px', textAlign: 'center' }}>{weekLabel}</span>
            <button className="btn btn-xs" onClick={() => setWeekOffset(prev => prev + 1)}>Next →</button>
            {weekOffset !== 0 && (
              <button className="btn btn-xs" style={{ color: 'var(--gold)' }} onClick={() => setWeekOffset(0)}>Today</button>
            )}
          </div>

          {/* Department filter + Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select className="floor-dropdown" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              {SHIFT_TYPES.map(s => (
                <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: s.textColor }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.dot }}></span>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COVERAGE ALERTS */}
      {(() => {
        const alerts = [];
        DAYS.forEach((day, dayIdx) => {
          Object.entries(minCoverage).forEach(([shiftId, min]) => {
            const count = getCoverage(dayIdx, shiftId);
            if (count < min) {
              const shift = SHIFT_TYPES.find(s => s.id === shiftId);
              alerts.push({ day, shift: shift.label, count, min });
            }
          });
        });
        if (alerts.length === 0) return null;
        return (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#991b1b' }}>Understaffed:</span>
            {alerts.map((a, i) => (
              <span key={i} style={{ fontSize: '11px', padding: '3px 10px', background: '#fff', borderRadius: '10px', border: '1px solid #fecaca', color: '#991b1b' }}>
                {a.day} {a.shift} ({a.count}/{a.min})
              </span>
            ))}
          </div>
        );
      })()}

      {/* SCHEDULE GRID */}
      <div className="panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 2, width: '140px' }}>Employee</th>
                {DAYS.map((day, i) => {
                  const date = weekDates[i];
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <th key={day} style={{ padding: '14px 6px', borderBottom: '1px solid var(--border-light)', textAlign: 'center', background: isToday ? 'rgba(201,168,76,0.06)' : 'var(--bg-card)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700' }}>{day}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '400' }}>{date.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-light)', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1, width: '140px', overflow: 'hidden' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{emp.department}</div>
                    </div>
                  </td>
                  {DAYS.map((_, dayIdx) => {
                    const key = `${emp.id}-${dayIdx}`;
                    const shiftId = schedule[key] || null;
                    const shift = SHIFT_TYPES.find(s => s.id === shiftId);
                    const isToday = new Date().toDateString() === weekDates[dayIdx].toDateString();
                    const isEditing = editingCell === key;

                    return (
                      <td key={dayIdx} style={{ padding: '4px', borderBottom: '1px solid var(--border-light)', textAlign: 'center', background: isToday ? 'rgba(201,168,76,0.03)' : 'transparent', verticalAlign: 'middle', overflow: 'hidden' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {SHIFT_TYPES.map(s => (
                              <button
                                key={s.id}
                                onClick={() => assignShift(emp.id, dayIdx, s.id)}
                                style={{ fontSize: '9px', fontWeight: '700', padding: '3px 4px', borderRadius: '4px', background: s.color, color: s.textColor, border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                              >
                                {s.label}
                              </button>
                            ))}
                            <button onClick={() => setEditingCell(null)} style={{ fontSize: '9px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingCell(key)}
                            style={{ width: '90%', margin: '0 auto', display: 'block', padding: '6px 4px', borderRadius: '6px', background: shift ? shift.color : 'var(--bg-input)', border: shift ? `1px solid ${shift.dot}30` : '1px dashed var(--border-light)', cursor: 'pointer', transition: 'all 0.15s' }}
                          >
                            {shift ? (
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: '700', color: shift.textColor }}>{shift.label}</div>
                                {shift.time && <div style={{ fontSize: '8px', color: shift.textColor, opacity: 0.7 }}>{shift.time}</div>}
                              </div>
                            ) : (
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>—</div>
                            )}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SWAP REQUESTS */}
      {swapRequests.length > 0 && (
        <div className="panel" style={{ padding: '24px 28px', marginTop: '22px' }}>
          <div className="panel-header" style={{ marginBottom: '16px' }}>
            <h3>Shift Swap Requests</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pendingSwaps.length} pending</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {swapRequests.map(swap => (
              <div key={swap.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {swap.from} → {swap.to}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {swap.day} · {swap.shift} shift · "{swap.reason}"
                  </div>
                </div>
                {swap.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-xs" style={{ background: '#d1fae5', color: '#065f46', borderColor: '#a7f3d0' }} onClick={() => handleSwapAction(swap.id, 'approved')}>Approve</button>
                    <button className="btn btn-xs" style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }} onClick={() => handleSwapAction(swap.id, 'rejected')}>Reject</button>
                  </div>
                ) : (
                  <span className={`status-tag ${swap.status === 'approved' ? 'tag-success' : 'tag-danger'}`}>
                    {swap.status === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}

export default ShiftSchedules;
