import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [todayDate] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        // const res = await fetch('http://localhost:8080/api/dashboard/overview');
        // const data = await res.json();
        await new Promise(resolve => setTimeout(resolve, 800));

        setStats({
          arrivals: { total: 3, pending: 2, checkedIn: 1, vip: 1 },
          departures: { total: 4, pending: 2, checkedOut: 1, balanceDue: 2 },
          inHouse: { total: 6, balanceOutstanding: 2 },
          bookings: { total: 12, confirmed: 8, checkedIn: 4 },
          rooms: { total: 50, occupied: 32, vacant: 14, maintenance: 4 },
        });

        setRecentActivity([
          { id: 1, type: 'check-in', text: 'Jane Doe checked into Room 304', time: '12:30 PM', icon: 'fa-arrow-right-to-bracket' },
          { id: 2, type: 'request', text: 'Maria Santos requested late checkout (Room 420)', time: '11:45 AM', icon: 'fa-clock' },
          { id: 3, type: 'maintenance', text: 'AC repair scheduled for Room 212', time: '10:20 AM', icon: 'fa-wrench' },
          { id: 4, type: 'departure', text: 'Robert Chen overdue for check-out (Room 212)', time: '10:05 AM', icon: 'fa-arrow-right-from-bracket' },
          { id: 5, type: 'booking', text: 'New reservation BKG-8010 confirmed', time: '09:30 AM', icon: 'fa-calendar-check' },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <main className="main-content">
        <section className="admin-tab-content active">
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px', marginBottom: '12px', display: 'block' }}></i>
            Loading Overview...
          </div>
        </section>
      </main>
    );
  }

  const occupancyRate = stats ? Math.round((stats.rooms.occupied / stats.rooms.total) * 100) : 0;

  return (
    <main className="main-content">
      <section className="admin-tab-content active">

        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: '700', color: '#1a1917', margin: '0 0 6px 0' }}>Overview</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{todayDate}</p>
        </div>

        {/* Main Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '16px', alignItems: 'start' }}>

          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <KpiCard label="IN-HOUSE GUESTS" value={stats.inHouse.total} sub={`${stats.inHouse.balanceOutstanding} with balance`} subColor="#6b7280" icon="fa-bed" iconBg="#e0e7ff" iconColor="#4338ca" />
              <KpiCard label="OCCUPANCY RATE" value={`${occupancyRate}%`} sub={`${stats.rooms.occupied} of ${stats.rooms.total} rooms`} subColor="#059669" icon="fa-chart-pie" iconBg="#d1fae5" iconColor="#047857" />
            </div>

            {/* Arrivals Card */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #edebe7', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1a1917' }}>Arrivals</h3>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#b45309', background: '#fef3c7', padding: '4px 10px', borderRadius: '20px' }}>{stats.arrivals.pending} pending</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <MiniStat label="Total Expected" value={stats.arrivals.total} />
                <MiniStat label="Checked In" value={stats.arrivals.checkedIn} valueColor="#059669" />
                <MiniStat label="VIP" value={stats.arrivals.vip} valueColor="#b45309" />
              </div>
            </div>

            {/* Departures Card */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #edebe7', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1a1917' }}>Departures</h3>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#b91c1c', background: '#fee2e2', padding: '4px 10px', borderRadius: '20px' }}>{stats.departures.pending} overdue</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <MiniStat label="Total Expected" value={stats.departures.total} />
                <MiniStat label="Checked Out" value={stats.departures.checkedOut} valueColor="#059669" />
                <MiniStat label="Balance Due" value={stats.departures.balanceDue} valueColor="#dc2626" />
              </div>
            </div>

            {/* Reservations Chart */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #edebe7', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1a1917' }}>Reservations</h3>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '9px', color: '#6b7280', marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9A84C' }}></span> This week</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4a3728' }}></span> Last week</span>
              </div>
              <ReservationRadar bookings={stats.bookings} size={180} />
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Top Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Calendar Card */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #edebe7', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <MiniCalendar />
              </div>
              {/* Activity Feed */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #edebe7', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#1a1917' }}>Recent Activity</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recentActivity.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`fas ${item.icon}`} style={{ fontSize: '11px', color: '#6b7280' }}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: '#1a1917', lineHeight: '1.4', marginBottom: '2px' }}>{item.text}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Room Status */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #edebe7', padding: '28px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '29px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1a1917' }}>Room Status</h3>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>{stats.rooms.total} rooms</span>
              </div>
              <RoomGrid rooms={stats.rooms} />
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}

/* Sub-Components */

function KpiCard({ label, value, sub, subColor, icon, iconBg, iconColor }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #edebe7', padding: '22px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
        <span style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: iconBg, color: iconColor, fontSize: '13px' }}>
          <i className={`fas ${icon}`}></i>
        </span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1917', lineHeight: '1', marginBottom: '8px' }}>{value}</div>
      <div style={{ fontSize: '12px', fontWeight: '500', color: subColor }}>{sub}</div>
    </div>
  );
}

function MiniStat({ label, value, valueColor = '#1a1917' }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: valueColor, lineHeight: '1' }}>{value}</div>
    </div>
  );
}

function RoomGrid({ rooms }) {
  const roomCells = [];
  for (let i = 1; i <= rooms.total; i++) {
    let status;
    if (i <= rooms.occupied) status = 'occupied';
    else if (i <= rooms.occupied + rooms.vacant) status = 'vacant';
    else status = 'maintenance';
    roomCells.push({ number: 100 + i, status });
  }

  const getColor = (status) => {
    switch (status) {
      case 'occupied': return { bg: '#4a3728', text: '#fff' };
      case 'vacant': return { bg: '#C9A84C', text: '#fff' };
      case 'maintenance': return { bg: '#3b82f6', text: '#fff' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '8px', marginBottom: '20px' }}>
        {roomCells.map((room, idx) => {
          const colors = getColor(room.status);
          return (
            <div
              key={idx}
              title={`Room ${room.number} - ${room.status}`}
              style={{ padding: '8px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', background: colors.bg, color: colors.text, fontSize: '11px', fontWeight: '600', cursor: 'default' }}
            >
              {room.number}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '20px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#4a3728' }}></span> Occupied
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#C9A84C' }}></span> Vacant
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }}></span> Maintenance
        </div>
      </div>
    </div>
  );
}

function ReservationRadar({ bookings, size = 260 }) {
  const categories = [
    { label: 'Confirmed', value: bookings.confirmed, max: bookings.total },
    { label: 'In-House', value: bookings.checkedIn, max: bookings.total },
    { label: 'Pending', value: bookings.total - bookings.confirmed - bookings.checkedIn, max: bookings.total },
    { label: 'Cancelled', value: 1, max: bookings.total },
    { label: 'No-Show', value: 0, max: bookings.total },
  ];

  const lastWeek = [6, 3, 2, 0, 1];

  const cx = size / 2, cy = size / 2, r = size * 0.365;
  const levels = 4;
  const sides = categories.length;
  const angleStep = (2 * Math.PI) / sides;

  const getPoint = (index, ratio) => {
    const angle = (index * angleStep) - Math.PI / 2;
    return { x: cx + r * ratio * Math.cos(angle), y: cy + r * ratio * Math.sin(angle) };
  };

  const gridPaths = [];
  for (let l = 1; l <= levels; l++) {
    const ratio = l / levels;
    const points = Array.from({ length: sides }, (_, i) => getPoint(i, ratio));
    gridPaths.push(points.map(p => `${p.x},${p.y}`).join(' '));
  }

  const currentPoints = categories.map((cat, i) => getPoint(i, cat.max > 0 ? cat.value / cat.max : 0));
  const lastWeekPoints = lastWeek.map((val, i) => getPoint(i, bookings.total > 0 ? val / bookings.total : 0));

  const currentPath = currentPoints.map(p => `${p.x},${p.y}`).join(' ');
  const lastWeekPath = lastWeekPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridPaths.map((pts, idx) => (
          <polygon key={idx} points={pts} fill="none" stroke="#d6d3d1" strokeWidth="1" />
        ))}
        {categories.map((_, i) => {
          const p = getPoint(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#d6d3d1" strokeWidth="0.8" />;
        })}
        <polygon points={lastWeekPath} fill="rgba(74,55,40,0.12)" stroke="#4a3728" strokeWidth="2" />
        <polygon points={currentPath} fill="rgba(201,168,76,0.25)" stroke="#C9A84C" strokeWidth="2.5" />
        {currentPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="#C9A84C" />
        ))}
        {lastWeekPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#4a3728" />
        ))}
      </svg>
      {categories.map((cat, i) => {
        const labelPoint = getPoint(i, 1.28);
        return (
          <span key={i} style={{ position: 'absolute', left: `${labelPoint.x / size * 100}%`, top: `${labelPoint.y / size * 100}%`, transform: 'translate(-50%, -50%)', fontSize: size > 200 ? '11px' : '9px', fontWeight: '600', color: '#4b5563', whiteSpace: 'nowrap' }}>
            {cat.label}
          </span>
        );
      })}
    </div>
  );
}

function MiniCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1a1917' }}>{monthName}</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={{ fontSize: '9px', fontWeight: '600', color: '#9ca3af', padding: '4px 0' }}>{d}</div>
        ))}
        {cells.map((day, idx) => (
          <div key={idx} style={{ fontSize: '11px', fontWeight: day === today.getDate() ? '700' : '400', color: day === today.getDate() ? '#fff' : day ? '#374151' : 'transparent', background: day === today.getDate() ? '#C9A84C' : 'transparent', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            {day || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
