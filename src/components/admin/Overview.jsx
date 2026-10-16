import React from 'react';

function Overview() {
  return (
    <section className="admin-tab-content active">
      
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="left">
          <h2 style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Executive KPI Summary</h2>
          <p>Today's Snapshot</p>
        </div>
        <div className="right">
          <span className="date-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', color: 'var(--gold)'}}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Aug 09, 2026
          </span>
          <button className="btn btn-sm btn-outline-gold">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="overview-wrapper" style={{ flexDirection: 'column' }}>
        
        {/* =======================================
            TOP ROW: KPI SUMMARY
            ======================================= */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px' }}>
          <div className="kpi-card">
            <span className="lbl">TOTAL REVENUE</span>
            <span className="val">$18,420.00</span>
            <span className="sub"><span className="trend-up" style={{fontWeight: 'bold'}}>▲</span> +12% vs last wk</span>
          </div>
          <div className="kpi-card">
            <span className="lbl">OCCUPANCY RATE</span>
            <span className="val">88.5%</span>
            <span className="sub">106 / 120 Rooms</span>
          </div>
          <div className="kpi-card">
            <span className="lbl">ADR (AVG RATE)</span>
            <span className="val">$165.00</span>
            <span className="sub"><span className="trend-up" style={{fontWeight: 'bold'}}>▲</span> +$12 vs target</span>
          </div>
          <div className="kpi-card">
            <span className="lbl">RevPAR</span>
            <span className="val">$146.02</span>
            <span className="sub"><span className="trend-up" style={{fontWeight: 'bold'}}>▲</span> +8% MTD</span>
          </div>
        </div>

        {/* =======================================
            MIDDLE ROW: TRENDS & CONTROLS
            ======================================= */}
        <div className="dashboard-split" style={{ marginBottom: '22px' }}>
          
          {/* Revenue & Occupancy Trends Chart */}
          <div className="panel">
            <div className="panel-header">
              <h3 style={{ textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.05em' }}>Revenue & Occupancy Trends (This Month)</h3>
            </div>
            
            {/* Custom SVG Line Chart matching the peak/valley from the reference */}
            <div style={{ position: 'relative', height: '160px', marginTop: '20px', padding: '0 10px' }}>
              <svg viewBox="0 0 400 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <line x1="0" y1="20" x2="400" y2="20" stroke="var(--border-light)" strokeDasharray="4 4" />
                <line x1="0" y1="50" x2="400" y2="50" stroke="var(--border-light)" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="400" y2="80" stroke="var(--border-light)" strokeDasharray="4 4" />
                
                <text x="-5" y="24" fontSize="10" fill="var(--text-muted)" textAnchor="end">$25k</text>
                <text x="-5" y="54" fontSize="10" fill="var(--text-muted)" textAnchor="end">$15k</text>
                <text x="-5" y="84" fontSize="10" fill="var(--text-muted)" textAnchor="end">$5k</text>

                {/* The Line */}
                <polyline points="0,80 70,50 140,15 210,60 280,80 400,80" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinejoin="round" />
                
                {/* Data Points */}
                <circle cx="70" cy="50" r="4" fill="var(--bg-card)" stroke="var(--gold)" strokeWidth="2" />
                <circle cx="140" cy="15" r="4" fill="var(--bg-card)" stroke="var(--gold)" strokeWidth="2" />
                <circle cx="210" cy="60" r="4" fill="var(--bg-card)" stroke="var(--gold)" strokeWidth="2" />
                
                {/* X-Axis */}
                <text x="70" y="110" fontSize="11" fill="var(--text-muted)" textAnchor="middle">Aug 1</text>
                <text x="140" y="110" fontSize="11" fill="var(--text-muted)" textAnchor="middle">Aug 3</text>
                <text x="210" y="110" fontSize="11" fill="var(--text-muted)" textAnchor="middle">Aug 5</text>
                <text x="280" y="110" fontSize="11" fill="var(--text-muted)" textAnchor="middle">Aug 7</text>
                <text x="350" y="110" fontSize="11" fill="var(--text-muted)" textAnchor="middle">Aug 9</text>
              </svg>
            </div>
          </div>

          {/* Yield / Rate Controls */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '25px' }}>
              <h3 style={{ textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.05em' }}>Yield / Rate Controls</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>SEASONAL PRICING</span>
                <span className="status-tag tag-success">Active</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Mode:</span>
                <select className="floor-dropdown" style={{ width: '160px', background: 'var(--bg-input)' }}>
                  <option>High Season</option>
                  <option>Low Season</option>
                  <option>Event Weekend</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Base Rate:</span>
                <input type="text" defaultValue="$150.00" style={{ width: '160px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', fontFamily: 'monospace' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Multiplier:</span>
                <input type="text" defaultValue="1.2x" style={{ width: '160px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', fontFamily: 'monospace' }} />
              </div>

              <button className="btn btn-gold" style={{ marginTop: '10px', padding: '12px', borderRadius: '6px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Update Rates
              </button>
            </div>
          </div>
        </div>

        {/* =======================================
            BOTTOM ROW: ALERTS & OTA
            ======================================= */}
        <div className="dashboard-split">
          
          {/* Departmental Health & Alerts */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.05em' }}>Departmental Health & Alerts</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#FFC107', flexShrink: 0, boxShadow: '0 0 8px rgba(255, 193, 7, 0.4)' }}></span>
                <div>
                  <span style={{ fontWeight: 600 }}>Front Desk:</span> <span style={{ color: 'var(--text-muted)' }}>2 Late Checkouts</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#4CAF50', flexShrink: 0, boxShadow: '0 0 8px rgba(76, 175, 80, 0.4)' }}></span>
                <div>
                  <span style={{ fontWeight: 600 }}>Housekeeping:</span> <span style={{ color: 'var(--text-muted)' }}>92% Rooms Cleaned</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#F44336', flexShrink: 0, boxShadow: '0 0 8px rgba(244, 67, 54, 0.4)' }}></span>
                <div>
                  <span style={{ fontWeight: 600 }}>Maintenance:</span> <span style={{ color: 'var(--text-muted)' }}>3 Critical Work Orders</span>
                </div>
              </div>

            </div>
          </div>

          {/* Online Channel Sync */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.05em' }}>Online Channel Sync (OTA)</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#4CAF50', flexShrink: 0 }}></span>
                  <span style={{ fontWeight: 600 }}>Booking.com</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Syncing (100%)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#4CAF50', flexShrink: 0 }}></span>
                  <span style={{ fontWeight: 600 }}>Expedia</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Syncing (100%)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#FFC107', flexShrink: 0 }}></span>
                  <span style={{ fontWeight: 600 }}>Agoda</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>1 Pending Sync</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Overview;