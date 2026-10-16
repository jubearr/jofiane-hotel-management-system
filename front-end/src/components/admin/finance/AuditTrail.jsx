import React, { useState, useEffect } from 'react';

function AuditTrail() {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('week');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

  useEffect(() => {
    fetchAuditLogs();
  }, [filterPeriod]);

  useEffect(() => {
    applyFilters();
  }, [auditLogs, searchQuery, filterCategory, filterStatus, filterUser]);

  const fetchAuditLogs = async () => {
    if (!summaryStats) {
      setIsInitialLoad(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      // TODO: Replace with actual API call
      // const res = await fetch(`http://localhost:8080/api/admin/audit-trail?period=${filterPeriod}`);
      // const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockLogs = [
        { id: 'AUD-001', timestamp: '2026-08-10T22:05:00', user: 'System', category: 'day-close', action: 'Day Close Executed', description: 'End-of-day process completed. All folios posted.', status: 'balanced', details: { revenuePosted: 57820, roomsProcessed: 106 } },
        { id: 'AUD-002', timestamp: '2026-08-10T22:03:00', user: 'Marco Diaz', category: 'rate-change', action: 'Rate Override', description: 'Room 304 rate changed from 5,200 to 4,800. Reason: Loyalty discount.', status: 'approved', details: { room: '304', oldRate: 5200, newRate: 4800 } },
        { id: 'AUD-003', timestamp: '2026-08-10T21:50:00', user: 'System', category: 'no-show', action: 'No-Show Charge Applied', description: 'BKG-8015 (Guest: Kim Tan) marked as no-show. One-night penalty posted.', status: 'completed', details: { booking: 'BKG-8015', penalty: 4500 } },
        { id: 'AUD-004', timestamp: '2026-08-10T21:45:00', user: 'Marco Diaz', category: 'adjustment', action: 'Folio Adjustment', description: 'Room 212 minibar charge reversed (duplicate entry). Amount: 620.', status: 'approved', details: { room: '212', amount: -620 } },
        { id: 'AUD-005', timestamp: '2026-08-10T21:30:00', user: 'System', category: 'day-close', action: 'Variance Detected', description: 'Cash drawer short by 150. Logged for review.', status: 'variance', details: { expected: 24500, actual: 24350, difference: -150 } },
        { id: 'AUD-006', timestamp: '2026-08-09T22:10:00', user: 'System', category: 'day-close', action: 'Day Close Executed', description: 'End-of-day process completed. All folios posted.', status: 'balanced', details: { revenuePosted: 62100, roomsProcessed: 108 } },
        { id: 'AUD-007', timestamp: '2026-08-09T18:20:00', user: 'Ana Buenaflor', category: 'refund', action: 'Refund Issued', description: 'TXN-9027 refund of 2,100 to Roberto Santos. Reason: Overcharge.', status: 'approved', details: { txnId: 'TXN-9027', amount: 2100 } },
        { id: 'AUD-008', timestamp: '2026-08-09T15:00:00', user: 'Admin', category: 'void', action: 'Transaction Voided', description: 'TXN-9030 voided. Duplicate room charge for Room 318.', status: 'approved', details: { txnId: 'TXN-9030', amount: 8400 } },
        { id: 'AUD-009', timestamp: '2026-08-09T10:30:00', user: 'System', category: 'rate-change', action: 'Seasonal Rate Applied', description: 'High season multiplier (1.2x) activated for all room types.', status: 'completed', details: { multiplier: 1.2 } },
        { id: 'AUD-010', timestamp: '2026-08-08T22:00:00', user: 'System', category: 'day-close', action: 'Day Close Executed', description: 'End-of-day balanced. No variances.', status: 'balanced', details: { revenuePosted: 55400, roomsProcessed: 104 } },
        { id: 'AUD-011', timestamp: '2026-08-08T14:45:00', user: 'Liza Fernandez', category: 'adjustment', action: 'Late Checkout Waived', description: 'Room 410 late checkout penalty waived per GM approval.', status: 'approved', details: { room: '410', waived: 1500 } },
        { id: 'AUD-012', timestamp: '2026-08-07T22:05:00', user: 'System', category: 'day-close', action: 'Variance Detected', description: 'Outstanding balance of 3,200 rolled forward (Room 115, 220).', status: 'variance', details: { rooms: ['115', '220'], outstanding: 3200 } },
      ];

      const mockSummary = {
        totalEntries: 12,
        balanced: 3,
        variances: 2,
        adjustments: 4,
        pendingReview: 1
      };

      setAuditLogs(mockLogs);
      setSummaryStats(mockSummary);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  };

  const applyFilters = () => {
    let result = [...auditLogs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(log =>
        log.id.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q)
      );
    }

    if (filterCategory !== 'all') {
      result = result.filter(log => log.category === filterCategory);
    }

    if (filterStatus !== 'all') {
      result = result.filter(log => log.status === filterStatus);
    }

    if (filterUser !== 'all') {
      result = result.filter(log => log.user === filterUser);
    }

    setFilteredLogs(result);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'balanced': return <span className="status-tag tag-success">Balanced</span>;
      case 'approved': return <span className="status-tag tag-gold">Approved</span>;
      case 'completed': return <span className="status-tag tag-success">Completed</span>;
      case 'variance': return <span className="status-tag tag-warning">Variance</span>;
      case 'pending': return <span className="status-tag tag-warning">Pending Review</span>;
      default: return <span className="status-tag tag-neutral">{status}</span>;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'day-close':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
      case 'rate-change':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
      case 'refund':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>;
      case 'void':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
      case 'no-show':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><line x1="2" y1="2" x2="22" y2="22"></line></svg>;
      case 'adjustment':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
      default:
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
    }
  };

  const uniqueUsers = [...new Set(auditLogs.map(l => l.user))];

  if (isInitialLoad || !summaryStats) {
    return (
      <section className="admin-tab-content active">
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading audit trail...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-tab-content active">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Audit Trail</h2>
          <p>Reconciliation logs, corrections, and system actions</p>
        </div>
        <div className="right">
          <button className="btn btn-sm" onClick={() => alert('Exporting audit trail...')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px', opacity: isRefreshing ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
        <div className="kpi-card">
          <span className="lbl">TOTAL ENTRIES</span>
          <span className="val">{summaryStats.totalEntries}</span>
          <span className="sub">This {filterPeriod}</span>
        </div>
        <div className="kpi-card">
          <span className="lbl">DAYS BALANCED</span>
          <span className="val" style={{ color: 'var(--status-vac)' }}>{summaryStats.balanced}</span>
          <span className="sub">Closed without issues</span>
        </div>
        <div className="kpi-card">
          <span className="lbl">VARIANCES</span>
          <span className="val" style={{ color: '#b45309' }}>{summaryStats.variances}</span>
          <span className="sub">Discrepancies flagged</span>
        </div>
        <div className="kpi-card">
          <span className="lbl">ADJUSTMENTS</span>
          <span className="val">{summaryStats.adjustments}</span>
          <span className="sub">Rate changes, voids, refunds</span>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="panel" style={{ padding: '16px 24px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>

          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Search by action, description, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', fontSize: '13px' }}
            />
          </div>

          {/* Period */}
          <select className="floor-dropdown" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Category */}
          <select className="floor-dropdown" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="day-close">Day Close</option>
            <option value="rate-change">Rate Changes</option>
            <option value="refund">Refunds</option>
            <option value="void">Voids</option>
            <option value="no-show">No-Shows</option>
            <option value="adjustment">Adjustments</option>
          </select>

          {/* Status */}
          <select className="floor-dropdown" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="balanced">Balanced</option>
            <option value="variance">Variance</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </select>

          {/* User */}
          <select className="floor-dropdown" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
            <option value="all">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
      </div>

      {/* AUDIT LOG TIMELINE */}
      <div className="panel" style={{ padding: '28px 32px', opacity: isRefreshing ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
        <div className="panel-header" style={{ marginBottom: '20px' }}>
          <h3>Activity Log</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{filteredLogs.length} entries</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No audit entries found matching your filters.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredLogs.map((log, index) => (
              <div key={log.id} style={{ display: 'flex', gap: '16px', padding: '16px 0', borderBottom: index < filteredLogs.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                
                {/* Icon */}
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>
                  {getCategoryIcon(log.category)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{log.action}</span>
                    {getStatusTag(log.status)}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: '1.5' }}>{log.description}</p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>{formatDate(log.timestamp)} at {formatTime(log.timestamp)}</span>
                    <span style={{ fontWeight: '600' }}>By: {log.user}</span>
                    <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{log.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
  );
}

export default AuditTrail;
