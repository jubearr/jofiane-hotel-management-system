import React, { useState, useEffect } from 'react';

function OtaChannels() {
  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState([]);

  useEffect(() => { fetchChannels(); }, []);

  const fetchChannels = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await fetch('http://localhost:8080/api/admin/ota-channels');
      // const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockChannels = [
        { id: 1, name: 'Booking.com', status: 'connected', enabled: true, lastSync: '2026-08-10T14:30:00', pendingUpdates: 0, errors: 0, bookingsThisMonth: 28, revenueThisMonth: 186000, commission: 15, avgRate: 4800, hotelRate: 4800, parity: true },
        { id: 2, name: 'Expedia', status: 'connected', enabled: true, lastSync: '2026-08-10T14:28:00', pendingUpdates: 0, errors: 0, bookingsThisMonth: 15, revenueThisMonth: 112000, commission: 18, avgRate: 5200, hotelRate: 5200, parity: true },
        { id: 3, name: 'Agoda', status: 'warning', enabled: true, lastSync: '2026-08-10T12:00:00', pendingUpdates: 2, errors: 1, bookingsThisMonth: 10, revenueThisMonth: 68000, commission: 17, avgRate: 4500, hotelRate: 4800, parity: false },
        { id: 4, name: 'Airbnb', status: 'connected', enabled: true, lastSync: '2026-08-10T14:25:00', pendingUpdates: 0, errors: 0, bookingsThisMonth: 5, revenueThisMonth: 42000, commission: 14, avgRate: 5500, hotelRate: 5500, parity: true },
        { id: 5, name: 'Trip.com', status: 'disconnected', enabled: false, lastSync: '2026-08-05T09:00:00', pendingUpdates: 0, errors: 3, bookingsThisMonth: 0, revenueThisMonth: 0, commission: 16, avgRate: 0, hotelRate: 4800, parity: false },
        { id: 6, name: 'Traveloka', status: 'connected', enabled: true, lastSync: '2026-08-10T14:20:00', pendingUpdates: 0, errors: 0, bookingsThisMonth: 8, revenueThisMonth: 52000, commission: 15, avgRate: 4800, hotelRate: 4800, parity: true },
      ];

      setChannels(mockChannels);
    } catch (err) {
      console.error('Failed to fetch OTA channels:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChannel = (channelId) => {
    // TODO: PUT to API
    setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, enabled: !ch.enabled, status: !ch.enabled ? 'connected' : 'disconnected' } : ch));
  };

  const syncChannel = (channelId) => {
    // TODO: POST to API
    setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, lastSync: new Date().toISOString(), pendingUpdates: 0, errors: 0, status: 'connected' } : ch));
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.round((now - d) / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Stats
  const activeChannels = channels.filter(ch => ch.enabled).length;
  const totalBookings = channels.reduce((sum, ch) => sum + ch.bookingsThisMonth, 0);
  const totalRevenue = channels.reduce((sum, ch) => sum + ch.revenueThisMonth, 0);
  const totalCommission = channels.reduce((sum, ch) => sum + (ch.revenueThisMonth * ch.commission / 100), 0);
  const parityIssues = channels.filter(ch => !ch.parity && ch.enabled).length;

  if (isLoading) {
    return (<section className="admin-tab-content active"><div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading OTA channels...</div></section>);
  }

  return (
    <section className="admin-tab-content active">
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>OTA Channels</h2>
          <p>Third-party booking platform management</p>
        </div>
        <div className="right">
          {parityIssues > 0 && (
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '5px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '20px' }}>
              {parityIssues} parity issue{parityIssues > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* SUMMARY */}
      <div className="panel" style={{ padding: '20px 28px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '22px', fontWeight: '700' }}>{activeChannels}/{channels.length}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Active Channels</div></div>
          <div style={{ width: '1px', height: '36px', background: 'var(--border-light)' }}></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700' }}>{totalBookings}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Bookings (MTD)</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-vac)' }}>{totalRevenue.toLocaleString()}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Revenue (MTD)</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-occ)' }}>{Math.round(totalCommission).toLocaleString()}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Commission Paid</div></div>
        </div>
      </div>

      {/* CHANNEL CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
        {channels.map(ch => (
          <div key={ch.id} className="panel" style={{ padding: '22px 24px', opacity: ch.enabled ? 1 : 0.6, transition: 'opacity 0.2s' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusDot(ch.status), boxShadow: `0 0 6px ${getStatusDot(ch.status)}40` }}></span>
                <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{ch.name}</h4>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>{ch.enabled ? 'On' : 'Off'}</span>
                <input
                  type="checkbox"
                  checked={ch.enabled}
                  onChange={() => toggleChannel(ch.id)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--gold)' }}
                />
              </label>
            </div>

            {/* Sync status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Last Synced</div>
                <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>{formatTime(ch.lastSync)}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {ch.pendingUpdates > 0 && <span style={{ fontSize: '10px', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '10px', fontWeight: '700' }}>{ch.pendingUpdates} pending</span>}
                {ch.errors > 0 && <span style={{ fontSize: '10px', padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: '10px', fontWeight: '700' }}>{ch.errors} error{ch.errors > 1 ? 's' : ''}</span>}
                <button className="btn btn-xs" onClick={() => syncChannel(ch.id)} disabled={!ch.enabled}>Sync</button>
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{ch.bookingsThisMonth}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bookings</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{ch.revenueThisMonth > 0 ? `${(ch.revenueThisMonth / 1000).toFixed(0)}k` : '—'}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--status-occ)' }}>{ch.commission}%</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Commission</div>
              </div>
            </div>

            {/* Rate Parity */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '6px', background: ch.parity ? '#f0fdf4' : '#fef2f2', border: ch.parity ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: ch.parity ? '#065f46' : '#991b1b' }}>
                Rate Parity: {ch.parity ? 'Matched' : 'Mismatch'}
              </div>
              {!ch.parity && ch.enabled && (
                <div style={{ fontSize: '10px', color: '#991b1b' }}>
                  OTA: {ch.avgRate.toLocaleString()} vs Hotel: {ch.hotelRate.toLocaleString()}
                </div>
              )}
              {ch.parity && (
                <div style={{ fontSize: '10px', color: '#065f46' }}>{ch.avgRate.toLocaleString()} /night</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default OtaChannels;
