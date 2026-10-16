import React, { useState, useEffect } from 'react';

function GuestReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await fetch(`http://localhost:8080/api/admin/reports/guests?period=${period}`);
      // const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockData = {
        kpis: { totalGuests: 284, newGuests: 218, returning: 66, avgSpend: 6480, returnRate: 23.2 },
        nationalities: [
          { country: 'Philippines', count: 156, pct: 54.9 },
          { country: 'South Korea', count: 42, pct: 14.8 },
          { country: 'Japan', count: 28, pct: 9.9 },
          { country: 'USA', count: 22, pct: 7.7 },
          { country: 'China', count: 18, pct: 6.3 },
          { country: 'Others', count: 18, pct: 6.3 }
        ],
        bookingSource: [
          { source: 'Direct (Website)', pct: 32, count: 91 },
          { source: 'Booking.com', pct: 25, count: 71 },
          { source: 'Walk-in', pct: 18, count: 51 },
          { source: 'Expedia', pct: 14, count: 40 },
          { source: 'Agoda', pct: 7, count: 20 },
          { source: 'Other OTAs', pct: 4, count: 11 }
        ],
        purpose: [
          { type: 'Leisure', pct: 52, count: 148 },
          { type: 'Business', pct: 28, count: 80 },
          { type: 'Event', pct: 12, count: 34 },
          { type: 'Transit', pct: 8, count: 22 }
        ],
        topGuests: [
          { name: 'Marisol Reyes', visits: 8, totalSpent: 198000, lastVisit: '2026-08-10' },
          { name: 'Daniel Kho', visits: 6, totalSpent: 145000, lastVisit: '2026-08-11' },
          { name: 'Angela Cruz', visits: 5, totalSpent: 225000, lastVisit: '2026-08-14' },
          { name: 'Fam. Villanueva', visits: 4, totalSpent: 112000, lastVisit: '2026-08-09' },
          { name: 'Roberto Santos', visits: 4, totalSpent: 98000, lastVisit: '2026-08-07' }
        ],
        feedback: { avgRating: 4.6, totalReviews: 142, positive: 128, neutral: 10, negative: 4 }
      };

      setData(mockData);
    } catch (err) {
      console.error('Failed to fetch guest data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (<section className="admin-tab-content active"><div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading guest reports...</div></section>);
  }

  const { kpis, nationalities, bookingSource, purpose, topGuests, feedback } = data;
  const sourceColors = ['#C9A84C', '#4a3728', '#3b82f6', '#059669', '#8b5cf6', '#9ca3af'];

  return (
    <section className="admin-tab-content active">
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Guest Reports</h2>
          <p>Guest demographics, behavior, and loyalty</p>
        </div>
        <div className="right">
          <select className="floor-dropdown" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <button className="btn btn-sm btn-outline-gold" onClick={() => alert('Exporting guest report...')}>Export</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="panel" style={{ padding: '20px 28px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '26px', fontWeight: '700' }}>{kpis.totalGuests}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Guests</div></div>
          <div style={{ width: '1px', height: '40px', background: 'var(--border-light)' }}></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700' }}>{kpis.newGuests}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>New</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gold)' }}>{kpis.returning}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Returning</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700' }}>{kpis.avgSpend.toLocaleString()}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Avg Spend</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-vac)' }}>{kpis.returnRate}%</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Return Rate</div></div>
        </div>
      </div>

      {/* ROW 1: Nationality + Booking Source */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px', marginBottom: '22px' }}>
        {/* Nationality */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>Guest Nationality</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {nationalities.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', width: '100px', color: 'var(--text-primary)' }}>{item.country}</span>
                <div style={{ flex: 1, height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: 'var(--gold)', borderRadius: '4px', opacity: 1 - (i * 0.12) }}></div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', width: '30px', textAlign: 'right' }}>{item.count}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '35px', textAlign: 'right' }}>{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Source */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>Booking Source</h3>
          {/* Stacked bar */}
          <div style={{ height: '16px', borderRadius: '8px', overflow: 'hidden', display: 'flex', marginBottom: '20px' }}>
            {bookingSource.map((item, i) => (
              <div key={i} style={{ width: `${item.pct}%`, background: sourceColors[i], height: '100%' }}></div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {bookingSource.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: sourceColors[i], flexShrink: 0 }}></span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1 }}>{item.source}</span>
                <span style={{ fontSize: '11px', fontWeight: '700' }}>{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 2: Purpose + Top Guests + Feedback */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '22px' }}>
        {/* Purpose of Stay */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>Purpose of Stay</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {purpose.map((item, i) => {
              const colors = ['#C9A84C', '#4a3728', '#3b82f6', '#9ca3af'];
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>{item.type}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.count} ({item.pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.pct}%`, background: colors[i], borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Guests */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>Top Guests by Revenue</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th style={{ textAlign: 'center' }}>Visits</th>
                  <th style={{ textAlign: 'right' }}>Total Spent</th>
                  <th>Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {topGuests.map((g, i) => (
                  <tr key={i} className="table-row-hover">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {i < 3 && <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: i === 0 ? 'var(--gold)' : i === 1 ? '#9ca3af' : '#cd7f32', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700' }}>{i + 1}</span>}
                        <span className="guest-name">{g.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="std-text">{g.visits}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>{g.totalSpent.toLocaleString()}</td>
                    <td><span className="std-text">{new Date(g.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feedback Summary */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>Guest Feedback</h3>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '42px', fontWeight: '700', color: 'var(--gold)' }}>{feedback.avgRating}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>out of 5.0 · {feedback.totalReviews} reviews</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <FeedbackBar label="Positive" count={feedback.positive} total={feedback.totalReviews} color="#10b981" />
            <FeedbackBar label="Neutral" count={feedback.neutral} total={feedback.totalReviews} color="#f59e0b" />
            <FeedbackBar label="Negative" count={feedback.negative} total={feedback.totalReviews} color="#ef4444" />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeedbackBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '11px', width: '60px', color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ flex: 1, height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px' }}></div>
      </div>
      <span style={{ fontSize: '10px', fontWeight: '700', width: '25px', textAlign: 'right' }}>{count}</span>
    </div>
  );
}

export default GuestReports;
