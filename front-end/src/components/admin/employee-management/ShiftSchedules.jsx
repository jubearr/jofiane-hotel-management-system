import { Select } from '../../common/FormControls';
import React, { useState, useEffect } from 'react';
import { authFetch } from '../../../utils/api';
import { PageSkeleton } from '../../common/SkeletonLoader';
import { exportToCSV } from '../../../utils/exportUtils';
import { toLocalISODate } from '../../../utils/dateUtils';

const SHIFT_TYPES = [
  { id: 'morning',   label: 'Morning',   time: '6am–2pm',   color: '#fef3c7', textColor: '#92400e', dot: '#f59e0b' },
  { id: 'day',       label: 'Day',       time: '7am–5pm',   color: '#dcfce7', textColor: '#166534', dot: '#22c55e' },
  { id: 'night',     label: 'Night',     time: '10pm–6am',  color: '#ede9fe', textColor: '#5b21b6', dot: '#8b5cf6' },
  { id: 'off',       label: 'Off',       time: '',           color: '#f3f4f6', textColor: '#6b7280', dot: '#9ca3af' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

let cachedShiftSchedule = null;

function ShiftSchedules() {
  const [isLoading, setIsLoading]       = useState(() => !cachedShiftSchedule);
  const [isNavigating, setIsNavigating] = useState(false);
  const [employees, setEmployees]       = useState(() => cachedShiftSchedule?.employees || []);
  const [schedule, setSchedule]         = useState(() => cachedShiftSchedule?.schedule || {});
  const [assignmentIds, setAssignmentIds] = useState(() => cachedShiftSchedule?.assignmentIds || {});
  const [dbShifts, setDbShifts]         = useState(() => cachedShiftSchedule?.dbShifts || []);
  const [swapRequests, setSwapRequests] = useState([]);
  const [filterDept, setFilterDept]     = useState('all');
  const [weekOffset, setWeekOffset]     = useState(0);
  const [editingCell, setEditingCell]   = useState(null);
  const [savingCell, setSavingCell]     = useState(null);  // shows saving spinner per cell

  const departments   = ['Front Desk', 'Housekeeping', 'Maintenance', 'F&B'];
  const minCoverage   = { morning: 3, day: 3, night: 2 };

  useEffect(() => { fetchSchedule(); }, [weekOffset]);

  const getWeekDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);
    return DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();
  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Map a DB shift_id number → SHIFT_TYPES id string
  // Your DB shifts: 1=Morning Shift, 2=Day Shift, 3=Mid Day Shift,
  //                 4=Regular Office Shift, 5=Night Shift, 6=Unassigned
  const dbShiftToType = (shiftId, shiftsData) => {
    const found = shiftsData.find(s => s.shift_id === shiftId);
    if (!found) return null;
    const n = (found.shift_name || '').toLowerCase();
    if (n.includes('morning'))                                        return 'morning';
    if (n.includes('night'))                                          return 'night';
    if (n.includes('day') || n.includes('mid') || n.includes('office') || n.includes('regular')) return 'day';
    return null;
  };

  // Map a SHIFT_TYPES id string → DB shift_id number (picks the best match)
  const typeToDbShiftId = (typeId, shiftsData) => {
    if (typeId === 'off') return null;
    const scored = shiftsData
      .filter(s => (s.shift_name || '').toLowerCase() !== 'unassigned')
      .map(s => {
        const n = (s.shift_name || '').toLowerCase();
        let score = 0;
        if (typeId === 'morning' && n.includes('morning'))            score = 10;
        if (typeId === 'night'   && n.includes('night'))              score = 10;
        if (typeId === 'day'     && n.includes('day'))                score = 10;
        if (typeId === 'day'     && n.includes('mid'))                score = 8;
        if (typeId === 'day'     && (n.includes('office') || n.includes('regular'))) score = 6;
        return { shift_id: s.shift_id, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored[0]?.shift_id ?? null;
  };

  const fetchSchedule = async () => {
    (employees.length || cachedShiftSchedule) ? setIsNavigating(true) : setIsLoading(true);
    try {
      const startDate = toLocalISODate(weekDates[0]);
      const endDate   = toLocalISODate(weekDates[6]);

      const [empRes, shiftsRes, assignRes] = await Promise.all([
        authFetch('/api/employees'),
        authFetch('/api/shifts'),
        authFetch(`/api/shift-assignments?startDate=${startDate}&endDate=${endDate}`),
      ]);
      if (!empRes.ok || !shiftsRes.ok || !assignRes.ok) throw new Error('API request failed');

      const [empData, shiftsData, assignData] = await Promise.all([
        empRes.json(), shiftsRes.json(), assignRes.json(),
      ]);

      setDbShifts(shiftsData);

      const normalizedEmployees = empData.map(e => ({
        id:         e.employee_id,   // numeric id used as schedule key
        _id:        e._id,
        name:       e.full_name || '',
        department: e.employment_details?.department || '',
        role:       e.employment_details?.role?.title || '',
      }));

      const newSchedule    = {};
      const newAssignIds   = {};

      assignData.forEach(a => {
        const assignDateStr = String(a.shift_date).slice(0, 10);
        const dayIdx = weekDates.findIndex(d => toLocalISODate(d) === assignDateStr);
        if (dayIdx === -1) return;
        const key = `${a.employee_id}-${dayIdx}`;
        newSchedule[key]  = dbShiftToType(a.shift_id, shiftsData) || 'morning';
        newAssignIds[key] = a._id;   // remember MongoDB _id for updates
      });

      setEmployees(normalizedEmployees);
      setSchedule(newSchedule);
      setAssignmentIds(newAssignIds);
      setSwapRequests([]);
      cachedShiftSchedule = {
        employees: normalizedEmployees,
        schedule: newSchedule,
        assignmentIds: newAssignIds,
        dbShifts: shiftsData,
      };
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setIsLoading(false);
      setIsNavigating(false);
    }
  };

  // Called when an admin clicks a shift option in the inline picker
  const assignShift = async (empId, dayIdx, shiftTypeId) => {
    const key         = `${empId}-${dayIdx}`;
    const targetDate  = weekDates[dayIdx];
    const dateStr     = toLocalISODate(targetDate);

    // Optimistic UI update
    setSchedule(prev => ({ ...prev, [key]: shiftTypeId }));
    setEditingCell(null);
    setSavingCell(key);

    try {
      if (shiftTypeId === 'off') {
        // If there's a saved assignment, delete it; otherwise nothing to do
        const existingId = assignmentIds[key];
        if (existingId) {
          const res = await authFetch(`/api/shift-assignments/${existingId}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
          setAssignmentIds(prev => { const next = { ...prev }; delete next[key]; return next; });
          setSchedule(prev => { const next = { ...prev }; delete next[key]; return next; });
        }
      } else {
        const dbShiftId = typeToDbShiftId(shiftTypeId, dbShifts);
        if (dbShiftId === null) {
          alert(`No matching shift found in the database for "${shiftTypeId}". Please add it to the shifts collection first.`);
          setSavingCell(null);
          return;
        }

        const res = await authFetch('/api/shift-assignments/upsert', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: empId,
            shift_date:  dateStr,
            shift_id:    dbShiftId,
            status:      'PUBLISHED',
          }),
        });
        if (!res.ok) throw new Error(`Upsert failed: ${res.status}`);
        const saved = await res.json();
        // Update the local assignment ID so future edits target the right document
        setAssignmentIds(prev => ({ ...prev, [key]: saved._id }));
      }
    } catch (err) {
      console.error('Failed to save shift assignment:', err);
      alert('Failed to save. Please try again.');
      // Revert optimistic update
      await fetchSchedule();
    } finally {
      setSavingCell(null);
    }
  };

  const handleSwapAction = (swapId, action) => {
    setSwapRequests(prev => prev.map(s => s.id === swapId ? { ...s, status: action } : s));
  };

  const getCoverage = (dayIdx, shiftId) =>
    employees.filter(emp => schedule[`${emp.id}-${dayIdx}`] === shiftId).length;

  const filteredEmployees = filterDept === 'all'
    ? employees
    : employees.filter(e => e.department === filterDept);

  const pendingSwaps = swapRequests.filter(s => s.status === 'pending');

  const handleExportCSV = () => {
    const formatShift = (typeId) => {
      const type = SHIFT_TYPES.find(s => s.id === typeId);
      if (!type || type.id === 'off') return 'Off';
      return `${type.label} (${type.time})`;
    };

    const columns = [
      { header: 'Employee ID', key: 'id' },
      { header: 'Full Name', key: 'name' },
      { header: 'Department', key: 'department' },
      { header: 'Role', key: 'role' },
      ...DAYS.map((day, idx) => ({
        header: `${day} (${weekDates[idx].toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })})`,
        accessor: emp => formatShift(schedule[`${emp.id}-${idx}`]),
      })),
    ];

    const startStr = toLocalISODate(weekDates[0]);
    const endStr = toLocalISODate(weekDates[6]);
    exportToCSV(filteredEmployees, columns, `jofiane-shifts-${startStr}_to_${endStr}`);
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
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Shift Schedules</h2>
          <p>Weekly staff scheduling board</p>
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

        {/* REDESIGNED HEADER TOOLBAR */}
        <div className="panel-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '16px', padding: '20px 24px', margin: 0, borderBottom: '1px solid var(--border-light)' }}>
          
          {/* ROW 1: Title */}
          <div style={{ textAlign: 'left', width: '100%' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Weekly Schedule</h3>
          </div>

          {/* ROW 2: Tools (Navigation, Filters, Actions) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* LEFT CLUSTER: Nav + Filters + Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              
              {/* Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button className="btn btn-xs" onClick={() => setWeekOffset(prev => prev - 1)}>← Prev</button>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', minWidth: '150px', textAlign: 'center', whiteSpace: 'nowrap' }}>{weekLabel}</span>
                <button className="btn btn-xs" onClick={() => setWeekOffset(prev => prev + 1)}>Next →</button>
                {weekOffset !== 0 && (
                  <button className="btn btn-xs" style={{ color: 'var(--gold)' }} onClick={() => setWeekOffset(0)}>Today</button>
                )}
              </div>

              {/* Subtle Divider */}
              <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>

              {/* Filters & Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Select className="floor-dropdown" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                  <option value="all">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {SHIFT_TYPES.map(s => (
                    <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: s.textColor, fontWeight: '500' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.dot }}></span>
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT CLUSTER: Swap requests + Print button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
              {pendingSwaps.length > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: '700', padding: '6px 14px', background: '#fef3c7', color: '#92400e', borderRadius: '20px' }}>
                  {pendingSwaps.length} swap request{pendingSwaps.length > 1 ? 's' : ''}
                </span>
              )}
              <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px' }} onClick={handleExportCSV}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Export CSV
              </button>
              <button className="btn btn-sm btn-outline-gold" style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px' }} onClick={() => window.print()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print
              </button>
            </div>
          </div>

        </div>

        <div style={{ overflowX: 'auto', width: '100%', opacity: isNavigating ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
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
                    const isSaving = savingCell === key;

                    return (
                      <td key={dayIdx} style={{ padding: '4px', borderBottom: '1px solid var(--border-light)', textAlign: 'center', background: isToday ? 'rgba(201,168,76,0.03)' : 'transparent', verticalAlign: 'middle', overflow: 'hidden' }}>
                        {isSaving ? (
                          <div style={{ padding: '6px 4px', fontSize: '10px', color: 'var(--text-muted)' }}>saving…</div>
                        ) : isEditing ? (
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
