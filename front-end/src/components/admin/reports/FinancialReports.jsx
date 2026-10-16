import { Select } from '../../common/FormControls';
import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../../utils/api';
import { PageSkeleton } from '../../common/SkeletonLoader';
import { exportToCSV } from '../../../utils/exportUtils';

function FinancialReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/financial`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setData(await res.json());
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (<section className="admin-tab-content active"><PageSkeleton rows={6} /></section>);
  }

  const { kpis, revenueTrend, revenueBySource, expenses, adrTrend, paymentMethods, outstanding } = data;
  const maxRevTrend = Math.max(...revenueTrend.map(r => Math.max(r.current, r.previous)));
  const sourceColors = ['#4a3728', '#C9A84C', '#3b82f6', '#059669', '#8b5cf6', '#ef4444'];
  const expenseColors = ['#ef4444', '#f59e0b', '#3b82f6', '#6b7280', '#8b5cf6'];

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      { section: 'KPI Summary', item: 'Total Revenue', amount: kpis.totalRevenue, share: '100%', detail: `Period: ${period}` },
      { section: 'KPI Summary', item: 'Total Expenses', amount: kpis.totalExpenses, share: `${((kpis.totalExpenses / (kpis.totalRevenue || 1)) * 100).toFixed(1)}%`, detail: '' },
      { section: 'KPI Summary', item: 'Net Profit', amount: kpis.netProfit, share: `${kpis.profitMargin}%`, detail: 'Margin' },
      { section: 'KPI Summary', item: 'Outstanding Balance', amount: outstanding.total, share: `${outstanding.count} folios`, detail: 'Unsettled' },
      ...(revenueBySource || []).map(r => ({ section: 'Revenue by Source', item: r.source, amount: r.amount, share: `${r.percentage}%`, detail: '' })),
      ...(expenses || []).map(e => ({ section: 'Operating Expenses', item: e.category, amount: e.amount, share: `${e.percentage}%`, detail: '' })),
      ...(paymentMethods || []).map(p => ({ section: 'Payment Methods', item: p.method, amount: p.amount, share: `${p.percentage}%`, detail: `${p.count} txns` })),
    ];

    const columns = [
      { header: 'Section', key: 'section' },
      { header: 'Item / Category', key: 'item' },
      { header: 'Amount (PHP)', accessor: r => Number(r.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) },
      { header: 'Share / Ratio', key: 'share' },
      { header: 'Notes / Details', key: 'detail' },
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    exportToCSV(rows, columns, `jofiane-financial-report-${period}-${todayStr}`);
  };

  return (
    <section className="admin-tab-content active">
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Financial Reports</h2>
          <p>Revenue, expenses, and profit summary</p>
        </div>
        <div className="right">
        </div>
      </div>

      {/* KPIs */}
      <div className="panel" style={{ padding: '20px 28px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--status-vac)' }}>{kpis.totalRevenue.toLocaleString()}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Revenue</div></div>
          <div style={{ width: '1px', height: '40px', background: 'var(--border-light)' }}></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--status-occ)' }}>{kpis.totalExpenses.toLocaleString()}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Expenses</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700' }}>{kpis.netProfit.toLocaleString()}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Net Profit</div></div>
          <div><div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gold)' }}>{kpis.profitMargin}%</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Margin</div></div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Outstanding: <span style={{ fontWeight: '700', color: '#b45309' }}>{outstanding.total.toLocaleString()}</span> ({outstanding.count} folios)</div>
            <Select className="floor-dropdown" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </Select>
            <button className="btn btn-sm" onClick={handleExportCSV}>Export CSV</button>
            <button className="btn btn-sm btn-outline-gold" onClick={() => window.print()}>Print</button>
          </div>
        </div>
      </div>

      {/* ROW 1: Revenue Trend + Revenue by Source */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '22px', marginBottom: '22px' }}>
        <div className="panel" style={{ padding: '24px 28px' }}>
          <div className="panel-header" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Revenue by Period</h3>
            <div style={{ display: 'flex', gap: '14px', fontSize: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '4px', background: 'var(--gold)', borderRadius: '2px' }}></span> Current</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '4px', background: '#4a3728', opacity: 0.4, borderRadius: '2px' }}></span> Previous</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '150px', paddingBottom: '28px', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
            {revenueTrend.map((item, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
                  <div style={{ width: '18px', height: `${(item.previous / maxRevTrend) * 120}px`, background: '#4a3728', opacity: 0.3, borderRadius: '3px 3px 0 0' }}></div>
                  <div style={{ width: '18px', height: `${(item.current / maxRevTrend) * 120}px`, background: 'var(--gold)', borderRadius: '3px 3px 0 0' }}></div>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', position: 'absolute', bottom: '6px' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>Revenue by Source</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {revenueBySource.map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600' }}>{item.source}</span>
                  <span style={{ fontSize: '11px', fontWeight: '700' }}>{item.amount.toLocaleString()}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: sourceColors[i], borderRadius: '3px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 2: Expenses + ADR/RevPAR + Payment Methods */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '22px' }}>
        {/* Expenses */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>Expenses</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {expenses.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: expenseColors[i], flexShrink: 0 }}></span>
                <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)' }}>{item.category}</span>
                <span style={{ fontSize: '11px', fontWeight: '700' }}>{item.amount.toLocaleString()}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '35px', textAlign: 'right' }}>{item.pct}%</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: '700' }}>Total</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--status-occ)' }}>{kpis.totalExpenses.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ADR / RevPAR */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <div className="panel-header" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ADR / RevPAR</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {adrTrend.map((item, i) => (
              <div key={i}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>{item.label}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden', marginBottom: '3px' }}>
                      <div style={{ height: '100%', width: `${(item.adr / 6000) * 100}%`, background: 'var(--gold)', borderRadius: '3px' }}></div>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(item.revpar / 6000) * 100}%`, background: '#3b82f6', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '50px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--gold-dark)' }}>{item.adr.toLocaleString()}</div>
                    <div style={{ fontSize: '9px', color: '#3b82f6' }}>{item.revpar.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '9px', color: 'var(--text-muted)', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '4px', background: 'var(--gold)', borderRadius: '2px' }}></span> ADR</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '4px', background: '#3b82f6', borderRadius: '2px' }}></span> RevPAR</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>Payment Methods</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paymentMethods.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)' }}>{item.method}</span>
                <span style={{ fontSize: '11px', fontWeight: '700' }}>{item.pct}%</span>
              </div>
            ))}
          </div>
          {/* Mini stacked bar */}
          <div style={{ height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex', marginTop: '16px' }}>
            {paymentMethods.map((item, i) => (
              <div key={i} style={{ width: `${item.pct}%`, background: sourceColors[i], height: '100%' }}></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinancialReports;
