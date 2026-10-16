import React from 'react';

function Payments() {
  return (
    <section className="admin-tab-content active">
      {/* UPDATED HEADER */}
      <div className="page-header">
        <div className="left">
          <h2>Payments Ledger</h2>
        </div>
        <div className="right">
          <span className="date-badge"><i className="fas fa-calendar-alt"></i> Month-to-Date</span>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-card">
          <span className="lbl"><i className="fas fa-chart-line"></i> Total Revenue (MTD)</span>
          <span className="val">₱482,500</span>
          <span className="sub"><i className="fas fa-arrow-up trend-up"></i> 8% vs last month</span>
        </div>
        <div className="kpi-card">
          <span className="lbl"><i className="fas fa-hourglass-half"></i> Pending Receivables</span>
          <span className="val">₱24,600</span>
          <span className="sub">4 Invoices awaiting payment</span>
        </div>
        <div className="kpi-card">
          <span className="lbl"><i className="fas fa-arrow-rotate-left"></i> Refunds Processed</span>
          <span className="val">₱4,200</span>
          <span className="sub"><i className="fas fa-arrow-down trend-down"></i> 2% vs last month</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Transaction History</h3>
          <div className="panel-actions">
            <button className="btn btn-sm"><i className="fas fa-file-export"></i> Export CSV</button>
            <button className="btn btn-sm btn-primary"><i className="fas fa-plus"></i> New</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ paddingLeft: 0 }}>TXN ID</th>
                <th>Guest / Ref</th>
                <th>Date</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-row-hover">
                <td style={{ paddingLeft: 0 }}>
                  <span className="guest-name">TXN-9021</span>
                  <span className="guest-sub">RSV-2081</span>
                </td>
                <td>
                  <span className="guest-name">Marisol Reyes</span>
                  <span className="guest-sub">Veranda Suite</span>
                </td>
                <td>
                  <span className="std-text">Aug 6, 2026</span>
                  <span className="guest-sub">09:14 AM</span>
                </td>
                <td>
                  <span className="std-text">Credit Card</span>
                  <span className="guest-sub">Visa ····4242</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>₱14,700</td>
                <td><span className="status-tag tag-success">Paid</span></td>
              </tr>
              <tr className="table-row-hover">
                <td style={{ paddingLeft: 0 }}>
                  <span className="guest-name">TXN-9022</span>
                  <span className="guest-sub">RSV-2082</span>
                </td>
                <td>
                  <span className="guest-name">Daniel Kho</span>
                  <span className="guest-sub">Garden Room</span>
                </td>
                <td>
                  <span className="std-text">Aug 6, 2026</span>
                  <span className="guest-sub">10:30 AM</span>
                </td>
                <td>
                  <span className="std-text">Bank Transfer</span>
                  <span className="guest-sub">BDO Unibank</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>₱4,200</td>
                <td><span className="status-tag tag-warning">Pending</span></td>
              </tr>
              <tr className="table-row-hover">
                <td style={{ paddingLeft: 0 }}>
                  <span className="guest-name">TXN-9023</span>
                  <span className="guest-sub">RSV-2079</span>
                </td>
                <td>
                  <span className="guest-name">Fam. Villanueva</span>
                  <span className="guest-sub">Amber Loft</span>
                </td>
                <td>
                  <span className="std-text">Aug 5, 2026</span>
                  <span className="guest-sub">03:45 PM</span>
                </td>
                <td>
                  <span className="std-text">Cash</span>
                  <span className="guest-sub">Front Desk</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>₱31,500</td>
                <td><span className="status-tag tag-success">Paid</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Payments;