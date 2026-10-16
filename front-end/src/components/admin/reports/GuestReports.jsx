import { Select } from '../../common/FormControls';
import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../../utils/api';
import { PageSkeleton } from '../../common/SkeletonLoader';
import { exportToCSV } from '../../../utils/exportUtils';

function GuestReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/guests`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setData(await res.json());
    } catch (err) {
      console.error('Failed to fetch guest data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (<section className="admin-tab-content active"><PageSkeleton rows={6} /></section>);
  }

  const { kpis, bookingSource, topGuests } = data;
  const nationalities = data.nationalities || [];
  const purpose = data.purpose || [];
  const feedback = data.feedback;
  const sourceColors = ['#C9A84C', '#4a3728', '#3b82f6', '#059669', '#8b5cf6', '#9ca3af'];

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ...(topGuests || []).map((g, idx) => ({
        category: 'Top Guest',
        name: g.name,
        visits: g.visits,
        revenue: g.totalSpent,
        detail: `Rank #${idx + 1}, Last Visit: ${new Date(g.lastVisit).toLocaleDateString('en-US')}`,
      })),
      ...(bookingSource || []).map(b => ({
        category: 'Booking Source',
        name: b.source,
        visits: b.count,
        revenue: '',
        detail: `Share: ${b.percentage}%`,
      })),
      ...(nationalities || []).map(n => ({
        category: 'Guest Nationality',
        name: n.country,
        visits: n.count,
        revenue: '',
        detail: `Share: ${n.percentage}%`,
      })),
    ];

    const columns = [
      { header: 'Category', key: 'category' },
      { header: 'Guest / Segment', key: 'name' },
      { header: 'Visits / Count', key: 'visits' },
      { header: 'Total Spend (PHP)', accessor: r => r.revenue ? Number(r.revenue).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '' },
      { header: 'Details / Share', key: 'detail' },
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    exportToCSV(rows, columns, `jofiane-guest-report-${period}-${todayStr}`);
  };

  return (
    <section className="admin-tab-content active">
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Guest Reports</h2>
          <p>Guest demographics, behavior, and loyalty</p>
        </div>
        <div className="right">
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
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Select className="floor-dropdown" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </Select>
            <button className="btn btn-sm btn-outline-gold" onClick={handleExportCSV}>Export CSV</button>
          </div>
        </div>
      </div>

      {/* ROW 1: Nationality + Booking Source */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px', marginBottom: '22px' }}>
        {/* Nationality */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>Guest Nationality</h3>
          {nationalities.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
              Nationality data is not collected at booking. Add a nationality field to guest records to populate this.
            </div>
          ) : (
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
          )}
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
          {purpose.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
              Purpose of stay is not collected at booking.
            </div>
          ) : (
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
          )}
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
          {!feedback ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
              No guest review system is connected yet.
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '42px', fontWeight: '700', color: 'var(--gold)' }}>{feedback.avgRating}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>out of 5.0 · {feedback.totalReviews} reviews</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <FeedbackBar label="Positive" count={feedback.positive} total={feedback.totalReviews} color="#10b981" />
                <FeedbackBar label="Neutral" count={feedback.neutral} total={feedback.totalReviews} color="#f59e0b" />
                <FeedbackBar label="Negative" count={feedback.negative} total={feedback.totalReviews} color="#ef4444" />
              </div>
            </>
          )}
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
