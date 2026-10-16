import React, { useState, useRef } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { API_BASE } from '../../utils/api';
import { PageSkeleton } from '../common/SkeletonLoader';

function HousekeepingDashboard({ employee, setActiveTab, isLead = false }) {
  const [todayDate] = useState(
    new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  );
  const [rooms, setRooms]       = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [requests, setRequests] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const firstLoad = useRef(true);   // only show full loader on the very first fetch

  const loadDashboard = async () => {
    // Only blank the screen on the first load; polls refresh silently
    if (firstLoad.current) setIsLoading(true);
    try {
      const [roomsRes, tasksRes, reqRes] = await Promise.all([
        fetch(`${API_BASE}/api/rooms`),
        fetch(`${API_BASE}/api/cleaning-tasks?status=PENDING`),
        fetch(`${API_BASE}/api/guest-requests?status=PENDING`),
      ]);
      const [roomsData, tasksData, reqData] = await Promise.all([
        roomsRes.ok ? roomsRes.json() : [],
        tasksRes.ok ? tasksRes.json() : [],
        reqRes.ok   ? reqRes.json()   : [],
      ]);
      const normRooms = roomsData.map(r => ({
        id:         r._id,
        room:       String(r.room_number || ''),
        type:       r.room_type_name || `Type ${r.type_id || ''}`,
        status:     normalizeStatus(r.housekeeping),
        assignedTo: r.assigned_to || '',
        priority:   r.priority || false,
        note:       r.notes || '',
      }));
      const normTasks = tasksData.slice(0, 3).map(t => ({
        id:         t._id,
        room:       String(t.room_number || ''),
        task:       t.task_type || '',
        assignedTo: t.assigned_name || '',
        status:     t.status === 'IN PROGRESS' ? 'In Progress' : 'Pending',
      }));
      setRooms(normRooms);
      setTasks(normTasks);
      setRequests(reqData);
      setActivities([]);
    } catch (err) {
      console.error('HousekeepingDashboard fetch error:', err);
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  usePolling(loadDashboard, 12000);

  const normalizeStatus = (s) => {
    if (!s) return 'Dirty';
    const l = s.toLowerCase();
    if (l === 'clean')       return 'Clean';
    if (l === 'inspected')   return 'Inspected';
    if (l.includes('progress')) return 'In Progress';
    return 'Dirty';
  };

  if (isLoading) return <main className="main-content employee-content"><PageSkeleton variant="cards" label="Loading housekeeping overview" /></main>;

  const dirtyRooms      = rooms.filter(r => r.status === 'Dirty').length;
  const inProgressRooms = rooms.filter(r => r.status === 'In Progress').length;
  const readyRooms      = rooms.filter(r => r.status === 'Clean' || r.status === 'Inspected').length;
  const priorityRooms   = rooms.filter(r => r.priority);
  const completedRooms  = readyRooms;
  const progress        = rooms.length > 0 ? Math.round((completedRooms / rooms.length) * 100) : 0;
  const pendingRequests = requests.length; // already filtered to PENDING on fetch

  const getStatusStyle = (status) => {
    if (status === 'Clean') {
      return {
        background: '#d1fae5',
        color: '#065f46'
      };
    }

    if (status === 'Inspected') {
      return {
        background: '#dbeafe',
        color: '#1e40af'
      };
    }

    if (status === 'Dirty') {
      return {
        background: '#fee2e2',
        color: '#991b1b'
      };
    }

    return {
      background: '#fef3c7',
      color: '#92400e'
    };
  };

  return (
    <main className="main-content employee-content">
      <section className="admin-tab-content active">

        {/* Page Header — adapts to Lead vs Cleaner */}
        <div className="employee-dashboard-header" style={{ marginBottom: '32px' }}>
          <div>
            <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isLead ? 'Housekeeping Management' : 'My Housekeeping Tasks'}
              <span style={{
                fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                background: isLead ? 'rgba(201,168,76,0.15)' : 'rgba(59,130,246,0.12)',
                color: isLead ? 'var(--gold-dark, #9f7f2e)' : '#1e40af',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {isLead ? 'Lead' : 'Cleaner'}
              </span>
            </span>

            <h2
              style={{
                fontSize: '30px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: '0 0 6px 0'
              }}
            >
              Good day, {employee?.name?.split(' ')[0] || 'there'}
            </h2>

            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
              {isLead
                ? `Oversee today's housekeeping operations · ${todayDate}`
                : `Here are your tasks for today · ${todayDate}`}
            </p>
          </div>

          <div className="shift-status" aria-label="Current shift status">
            <span className="shift-status-dot" />
            <span>
              <strong>{employee?.role || (isLead ? 'Housekeeping Lead' : 'Housekeeper')}</strong>
              <small>Morning shift · 06:00 – 14:00</small>
            </span>
          </div>
        </div>

        <div
          className="kpi-grid"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
            marginBottom: '22px'
          }}
        >

          <div
            className="kpi-card"
            onClick={isLead ? () => setActiveTab('housekeeping') : undefined}
            style={{ cursor: isLead ? 'pointer' : 'default' }}
          >
            <span className="lbl" style={{ color: 'var(--text-muted)' }}>
              DIRTY ROOMS
            </span>

            <span className="val" style={{ color: 'var(--text-primary)' }}>
              {dirtyRooms}
            </span>

            <span className="sub" style={{ color: 'var(--text-secondary)' }}>
              Waiting for cleaning
            </span>
          </div>

          <div
            className="kpi-card"
            onClick={isLead ? () => setActiveTab('housekeeping') : undefined}
            style={{ cursor: isLead ? 'pointer' : 'default' }}
          >
            <span className="lbl" style={{ color: 'var(--text-muted)' }}>
              IN PROGRESS
            </span>

            <span className="val" style={{ color: 'var(--text-primary)' }}>
              {inProgressRooms}
            </span>

            <span className="sub" style={{ color: 'var(--text-secondary)' }}>
              Currently being cleaned
            </span>
          </div>

          <div
            className="kpi-card"
            onClick={isLead ? () => setActiveTab('housekeeping') : undefined}
            style={{ cursor: isLead ? 'pointer' : 'default' }}
          >
            <span className="lbl" style={{ color: 'var(--text-muted)' }}>
              READY / CLEAN
            </span>

            <span className="val" style={{ color: 'var(--text-primary)' }}>
              {readyRooms}
            </span>

            <span className="sub" style={{ color: 'var(--text-secondary)' }}>
              Clean or inspected rooms
            </span>
          </div>

          <div
            className="kpi-card"
            onClick={() => setActiveTab('guest-requests')}
            style={{ cursor: 'pointer' }}
          >
            <span className="lbl" style={{ color: 'var(--text-muted)' }}>
              GUEST REQUESTS
            </span>

            <span className="val" style={{ color: 'var(--text-primary)' }}>
              {pendingRequests}
            </span>

            <span className="sub" style={{ color: 'var(--text-secondary)' }}>
              Pending requests
            </span>
          </div>

        </div>

        <div
          className="panel"
          style={{
            padding: '22px 26px',
            marginBottom: '22px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}
          >
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                Today's Progress
              </h3>

              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '4px'
                }}
              >
                Rooms ready for guests
              </p>
            </div>

            <strong
              style={{
                fontSize: '22px',
                color: 'var(--gold-light)'
              }}
            >
              {progress}%
            </strong>
          </div>

          <div
            style={{
              width: '100%',
              height: '10px',
              background: 'var(--bg-input)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--gold)',
                borderRadius: '10px'
              }}
            />
          </div>

          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '8px'
            }}
          >
            {completedRooms} of {rooms.length} rooms ready
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '22px',
            marginBottom: '22px'
          }}
        >

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3 style={{ color: 'var(--text-primary)' }}>Priority Rooms</h3>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                  }}
                >
                  Rooms that require immediate attention
                </p>
              </div>

              {isLead && (
                <button
                  className="btn btn-sm"
                  onClick={() => setActiveTab('housekeeping')}
                >
                  View Rooms
                </button>
              )}
            </div>

            <div>
              {priorityRooms.map((room) => (
                <div
                  key={room.id}
                  style={{
                    padding: '14px 0',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '15px'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      Room {room.room}
                    </strong>

                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginTop: '4px'
                      }}
                    >
                      {room.note}
                    </div>
                  </div>

                  <span
                    style={{
                      ...getStatusStyle(room.status),
                      padding: '4px 9px',
                      fontSize: '10px',
                      fontWeight: '700',
                      borderRadius: '20px',
                      height: 'fit-content'
                    }}
                  >
                    {room.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3 style={{ color: 'var(--text-primary)' }}>Cleaning Tasks</h3>

                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                  }}
                >
                  Current housekeeping assignments
                </p>
              </div>

              <button
                className="btn btn-sm"
                onClick={() => setActiveTab('cleaning-tasks')}
              >
                View Tasks
              </button>
            </div>

            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom: '1px solid var(--border-light)'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    Room {task.room}
                  </strong>

                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '3px'
                    }}
                  >
                    {task.task}
                  </div>

                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      marginTop: '3px'
                    }}
                  >
                    {task.assignedTo}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color:
                      task.status === 'Pending'
                        ? '#e7be58'
                        : '#7fa8ff'
                  }}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>

        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '22px'
          }}
        >

          <div className="panel">
            <div className="panel-header">
              <h3 style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }}
            >
              {isLead && (
                <button
                  className="btn"
                  onClick={() => setActiveTab('housekeeping')}
                >
                  Room Status
                </button>
              )}

              <button
                className="btn"
                onClick={() => setActiveTab('cleaning-tasks')}
              >
                Cleaning Tasks
              </button>

              <button
                className="btn"
                onClick={() => setActiveTab('guest-requests')}
              >
                Guest Requests
              </button>

              {isLead && (
                <button
                  className="btn"
                  onClick={() => setActiveTab('maintenance')}
                >
                  Maintenance
                </button>
              )}

              <button
                className="btn"
                onClick={() => setActiveTab('lost-found')}
              >
                Lost & Found
              </button>

              {isLead && (
                <button
                  className="btn"
                  onClick={() => setActiveTab('housekeeping-logs')}
                >
                  Shift Log
                </button>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 style={{ color: 'var(--text-primary)' }}>Recent Housekeeping Activity</h3>

              {isLead && (
                <button
                  className="btn btn-sm"
                  onClick={() => setActiveTab('housekeeping-logs')}
                >
                  Open Log
                </button>
              )}
            </div>

            {activities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border-light)'
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}
                >
                  {activity.text}
                </div>

                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginTop: '4px'
                  }}
                >
                  {activity.time}
                </div>
              </div>
            ))}
          </div>

        </div>

      </section>
    </main>
  );
}

export default HousekeepingDashboard;
