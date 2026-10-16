import React, { useState, useRef } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { authFetch } from '../../utils/api';
import { PageSkeleton, LoadingError } from '../common/SkeletonLoader';

const API = '/api/dashboard/admin-operations';

function Overview({ setActiveTab, adminProfile }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);
  const [data, setData]           = useState(null);
  const firstLoad = useRef(true);

  const fetchData = async () => {
    if (firstLoad.current) setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(API);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setData(await res.json());
    } catch (err) {
      console.error('Failed to fetch operations data:', err);
      setError('Unable to reach the server. Make sure the back-end is running on port 5000.');
    } finally {
      setIsLoading(false);
      firstLoad.current = false;
    }
  };

  // Live monitoring — refresh every 10s without blanking the screen
  usePolling(fetchData, 10000);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (error && !data) return <LoadingError onRetry={fetchData} />;
  if (isLoading || !data) {
    return (
      <section className="admin-tab-content active">
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <PageSkeleton rows={6} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-tab-content active">
        <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>{error}</div>
      </section>
    );
  }

  const { kpis, roomStatus, ops, revenueTrend, bookingsTrend, departmentHealth, recentActivity, counts } = data;
  const peso = (n) => `₱${Number(n || 0).toLocaleString()}`;
  const levelColors = { good: '#22c55e', warning: '#f59e0b', critical: '#ef4444' };

  // Revenue chart geometry
  const maxRev = Math.max(...revenueTrend.map(d => d.value), 1);
  const pts = revenueTrend.map((d, i) => ({
    x: 50 + i * ((500) / (revenueTrend.length - 1)),
    y: 115 - (d.value / maxRev) * 95,
    ...d,
  }));
  const linePts = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M${pts[0].x},${pts[0].y} ${pts.map(p => `L${p.x},${p.y}`).join(' ')} L${pts[pts.length-1].x},120 L${pts[0].x},120 Z`;

  const maxBooking = Math.max(...bookingsTrend.map(d => d.count), 1);

  // Donut percentages
  const rp = {
    occupied:    roomStatus.total ? (roomStatus.occupied    / roomStatus.total) * 100 : 0,
    vacant:      roomStatus.total ? (roomStatus.vacant      / roomStatus.total) * 100 : 0,
    maintenance: roomStatus.total ? (roomStatus.maintenance / roomStatus.total) * 100 : 0,
    cleaning:    roomStatus.total ? (roomStatus.cleaning    / roomStatus.total) * 100 : 0,
  };

  return (
    <section className="admin-tab-content active">

      {/* HEADER */}
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>
            Good Day, {adminProfile?.fullName?.split(' ')[0] || 'Admin'}
          </h2>
          <p>{today} · Updated {nowTime}</p>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px' }}>
        <MonitorKpi label="TODAY'S REVENUE" value={peso(kpis.todayRevenue)} sub="Completed transactions today" accent="#22c55e" />
        <MonitorKpi label="OCCUPANCY RATE" value={`${kpis.occupancyRate}%`} sub={`${roomStatus.occupied} / ${roomStatus.total} rooms occupied`} accent="#3b82f6" />
        <MonitorKpi label="OUTSTANDING BALANCE" value={peso(kpis.outstanding)} sub="Unsettled guest folios" accent="#f59e0b" />
        <MonitorKpi label="IN-HOUSE GUESTS" value={ops.inHouse.total} sub={`${ops.inHouse.balanceDue} with balance due`} accent="#8b5cf6" />
      </div>

      {/* TODAY'S FLOW — live operational counters */}
      <div className="panel" style={{ padding: '20px 26px', marginBottom: '22px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>Today's Guest Flow</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <FlowCard
            title="Arrivals"
            total={ops.arrivals.total}
            items={[
              { label: 'Pending check-in', value: ops.arrivals.pending, color: '#f59e0b' },
              { label: 'Checked in', value: ops.arrivals.checkedIn, color: '#22c55e' },
            ]}
            onClick={() => setActiveTab && setActiveTab('all-bookings')}
          />
          <FlowCard
            title="Departures"
            total={ops.departures.total}
            items={[
              { label: 'Pending check-out', value: ops.departures.pending, color: '#f59e0b' },
              { label: 'Checked out', value: ops.departures.checkedOut, color: '#6b7280' },
            ]}
            onClick={() => setActiveTab && setActiveTab('all-bookings')}
          />
          <FlowCard
            title="Operations Queue"
            total={counts.cleaningPending + counts.guestReqPending + counts.maintPending}
            items={[
              { label: 'Cleaning tasks', value: counts.cleaningPending, color: '#3b82f6' },
              { label: 'Guest requests', value: counts.guestReqPending, color: '#8b5cf6' },
              { label: 'Maintenance', value: counts.maintPending, color: counts.maintCritical > 0 ? '#ef4444' : '#f59e0b' },
            ]}
            onClick={() => setActiveTab && setActiveTab('maintenance')}
          />
        </div>
      </div>

      {/* REVENUE TREND (full width) */}
      <div className="panel" style={{ marginBottom: '22px', padding: '24px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>Revenue — Last 7 Days</h3>
            <div style={{ position: 'relative', height: '190px' }}>
              <svg viewBox="0 0 560 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {[10, 45, 80, 115].map((y, i) => (
                  <line key={i} x1="40" y1={y} x2="550" y2={y} stroke="var(--border-light)" strokeDasharray="3 3" />
                ))}
                <text x="34" y="14" fontSize="9" fill="var(--text-muted)" textAnchor="end">{compact(maxRev)}</text>
                <text x="34" y="84" fontSize="9" fill="var(--text-muted)" textAnchor="end">{compact(maxRev * 0.33)}</text>
                <text x="34" y="119" fontSize="9" fill="var(--text-muted)" textAnchor="end">0</text>
                <path d={areaPath} fill="rgba(201,168,76,0.12)" />
                <polyline points={linePts} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {pts.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-card)" stroke="var(--gold)" strokeWidth="2" />
                    <text x={p.x} y="134" fontSize="9" fill="var(--text-muted)" textAnchor="middle">{p.day}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
          <div style={{ width: '180px', paddingLeft: '28px', borderLeft: '1px solid var(--border-light)', marginLeft: '28px', display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '6px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>7-Day Total</span>
              <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>{peso(revenueTrend.reduce((s, d) => s + d.value, 0))}</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>All-Time Revenue</span>
              <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px', color: 'var(--gold-dark, #9f7f2e)' }}>{peso(kpis.totalRevenue)}</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Today</span>
              <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '4px', color: '#059669' }}>{peso(kpis.todayRevenue)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW — Dept Health · Room Status · Bookings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '22px', marginBottom: '22px' }}>

        {/* Department Health */}
        <div className="panel" style={{ padding: '22px 24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '18px' }}>Department Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {departmentHealth.map((d, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-light)', borderLeft: `3px solid ${levelColors[d.level]}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: levelColors[d.level] }} />
                  <span style={{ fontWeight: '700', fontSize: '13px' }}>{d.dept}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginLeft: '16px' }}>{d.status}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '16px', marginTop: '2px' }}>{d.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Status Donut */}
        <div className="panel" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '18px', alignSelf: 'flex-start' }}>Room Status</h3>
          <div style={{ position: 'relative', width: '150px', height: '150px', marginBottom: '20px' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#4a3728" strokeWidth="4" strokeDasharray={`${rp.occupied} ${100 - rp.occupied}`} strokeDashoffset="0" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#C9A84C" strokeWidth="4" strokeDasharray={`${rp.vacant} ${100 - rp.vacant}`} strokeDashoffset={`-${rp.occupied}`} />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray={`${rp.maintenance} ${100 - rp.maintenance}`} strokeDashoffset={`-${rp.occupied + rp.vacant}`} />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#E65100" strokeWidth="4" strokeDasharray={`${rp.cleaning} ${100 - rp.cleaning}`} strokeDashoffset={`-${rp.occupied + rp.vacant + rp.maintenance}`} />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700' }}>{roomStatus.total}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>rooms</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', width: '100%' }}>
            <LegendDot color="#4a3728" label="Occupied" value={roomStatus.occupied} />
            <LegendDot color="#C9A84C" label="Vacant" value={roomStatus.vacant} />
            <LegendDot color="#3b82f6" label="Maintenance" value={roomStatus.maintenance} />
            <LegendDot color="#E65100" label="Needs Cleaning" value={roomStatus.cleaning} />
          </div>
        </div>

        {/* Bookings Trend */}
        <div className="panel" style={{ padding: '22px 24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '18px' }}>Check-ins — Last 7 Days</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', gap: '8px', paddingBottom: '24px', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
            {bookingsTrend.map((b, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '6px', position: 'relative', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-primary)' }}>{b.count > 0 ? b.count : ''}</span>
                <div style={{ width: '100%', maxWidth: '26px', height: `${(b.count / maxBooking) * 105}px`, minHeight: b.count > 0 ? '4px' : '0', background: 'linear-gradient(180deg, var(--gold) 0%, #4a3728 100%)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }} />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', position: 'absolute', bottom: '-20px' }}>{b.day}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>7-Day Total</div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>{bookingsTrend.reduce((s, b) => s + b.count, 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Avg / Day</div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>{(bookingsTrend.reduce((s, b) => s + b.count, 0) / 7).toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE ACTIVITY FEED */}
      <div className="panel" style={{ padding: '22px 26px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No recent activity logged.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentActivity.map((a, i) => (
              <div key={a.id || i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '13px' }}>{activityIcon(a.type)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{a.type}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.text}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {a.status && (
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                      background: a.status === 'BALANCED' ? '#d1fae5' : a.status === 'VARIANCE' ? '#fef3c7' : '#f3f4f6',
                      color: a.status === 'BALANCED' ? '#065f46' : a.status === 'VARIANCE' ? '#92400e' : '#4b5563' }}>
                      {a.status}
                    </span>
                  )}
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>{a.time} · {a.user}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
  );
}

/* ── HELPERS ── */
function compact(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}
function activityIcon(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('close') || t.includes('day')) return '🌙';
  if (t.includes('refund')) return '↩️';
  if (t.includes('void')) return '✖️';
  if (t.includes('rate')) return '💲';
  if (t.includes('no-show') || t.includes('no show')) return '🚫';
  return '📋';
}

/* ── SUB-COMPONENTS ── */
function MonitorKpi({ label, value, sub, accent }) {
  return (
    <div className="kpi-card" style={{ borderTop: `3px solid ${accent}` }}>
      <span className="lbl">{label}</span>
      <span className="val">{value}</span>
      <span className="sub">{sub}</span>
    </div>
  );
}

function FlowCard({ title, total, items, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-input)', border: '1px solid var(--border-light)',
        borderRadius: '10px', padding: '18px 20px', cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{title}</span>
        <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{total}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: it.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{it.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendDot({ color, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export default Overview;
