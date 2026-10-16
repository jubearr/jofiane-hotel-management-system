import React, { useState, useEffect } from 'react';

function OccupancyReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await fetch(`http://localhost:8080/api/admin/reports/occupancy?period=${period}`);
      // const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockData = {
        kpis: { avgOccupancy: 86.2, totalRooms: 120, alos: 2.8, peakDay: 'Saturday', lowDay: 'Tuesday' },
        trend: [
          { label: 'Week 1', rate: 82 },
          { label: 'Week 2', rate: 91 },
          { label: 'Week 3', rate: 85 },
          { label: 'Week 4', rate: 88 }
        ],
        byRoomType: [
          { type: 'Presidential', rate: 95, rooms: 2 },
          { type: 'Suite', rate: 92, rooms: 6 },
          { type: 'Premium', rate: 88, rooms: 12 },
          { type: 'Deluxe', rate: 85, rooms: 30 },
          { type: 'Standard', rate: 78, rooms: 70 }
        ],
        byFloor: [
          { floor: 'Floor 1', rate: 80, rooms: 30 },
          { floor: 'Floor 2', rate: 85, rooms: 30 },
          { floor: 'Floor 3', rate: 90, rooms: 30 },
          { floor: 'Floor 4', rate: 95, rooms: 30 }
        ],
        forecast: [
          { date: 'Aug 11', confirmed: 98, projected: 102 },
          { date: 'Aug 12', confirmed: 104, projected: 108 },
          { date: 'Aug 13', confirmed: 95, projected: 100 },
          { date: 'Aug 14', confirmed: 88, projected: 95 },
          { date: 'Aug 15', confirmed: 75, projected: 85 },
          { date: 'Aug 16', confirmed: 110, projected: 115 },
          { date: 'Aug 17', confirmed: 108, projected: 112 }
        ]
      };

      setData(mockData);
    } catch (err) {
      console.error('Failed to fetch occupancy data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (<section className="admin-tab-content active"><div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading occupancy reports...</div></section>);
  }

  const { kpis, trend, byRoomType, byFloor, forecast } = data;
  const maxForecast = Math.max(...forecast.map(f => Math.max(f.confirmed, f.projected)));

  return (
    <section className="admin-tab-content active">
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Occupancy Reports</h2>
          <p>Room fill rate trends and forecasting</p>
        </div>
        <div className="right">
          <select className="floor-dropdown" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <button className="btn btn-sm btn-outline-gold" onClick={() => alert('Exporting occupancy report...')}>Export</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="panel" style={{ padding: '20px 28px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--gold)' }}>{kpis.avgOccupancy}%</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Avg Occupancy</div>
          </div>
          <div style={{ width: '1px', height: '40px', background: 'var(--border-light)' }}></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700' }}>{kpis.totalRooms}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Rooms</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700' }}>{kpis.alos}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Avg Length of Stay</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-vac)' }}>{kpis.peakDay}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Peak Day</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-occ)' }}>{kpis.lowDay}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Low Day</div></div>
        </div>
      </div>

      {/* ROW 1: Trend + By Room Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '22px', marginBottom: '22px' }}>
        {/* Occupancy Trend */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>Occupancy Trend</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '140px', paddingBottom: '28px', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
            {trend.map((item, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>{item.rate}%</span>
                <div style={{ width: '100%', maxWidth: '40px', height: `${(item.rate / 100) * 110}px`, background: 'linear-gradient(180deg, var(--gold) 0%, #4a3728 100%)', borderRadius: '4px 4px 0 0' }}></div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', position: 'absolute', bottom: '6px' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Room Type */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>By Room Type</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {byRoomType.map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>{item.type}</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gold-dark)' }}>{item.rate}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.rate}%`, background: 'var(--gold)', borderRadius: '3px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 2: By Floor + Forecast */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '22px' }}>
        {/* By Floor */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>By Floor</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {byFloor.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', width: '60px', color: 'var(--text-muted)' }}>{item.floor}</span>
                <div style={{ flex: 1, height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.rate}%`, background: i === byFloor.length - 1 ? 'var(--gold)' : '#4a3728', borderRadius: '4px', opacity: 0.4 + (i * 0.2) }}></div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', width: '40px', textAlign: 'right' }}>{item.rate}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Forecast */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <div className="panel-header" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>7-Day Forecast</h3>
            <div style={{ display: 'flex', gap: '14px', fontSize: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '4px', borderRadius: '2px', background: 'var(--gold)' }}></span> Confirmed</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '4px', borderRadius: '2px', background: '#4a3728', opacity: 0.4 }}></span> Projected</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '140px', paddingBottom: '28px', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
            {forecast.map((item, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: '3px' }}>
                {/* Projected bar (behind) */}
                <div style={{ width: '100%', display: 'flex', gap: '3px', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div style={{ width: '12px', height: `${(item.confirmed / maxForecast) * 110}px`, background: 'var(--gold)', borderRadius: '3px 3px 0 0' }}></div>
                  <div style={{ width: '12px', height: `${(item.projected / maxForecast) * 110}px`, background: '#4a3728', opacity: 0.3, borderRadius: '3px 3px 0 0' }}></div>
                </div>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', position: 'absolute', bottom: '6px' }}>{item.date}</span>
              </div>
            ))}
          </div>
          {/* Capacity line label */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Capacity: {kpis.totalRooms} rooms</span>
            <span>Dates shown are confirmed bookings vs projected demand</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OccupancyReports;
