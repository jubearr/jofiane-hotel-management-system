import React, { useState, useEffect } from 'react';

function Transactions() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [kpis, setKpis] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('today');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [filterPeriod]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchQuery, filterMethod, filterStatus, filterType]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await fetch(`http://localhost:8080/api/admin/transactions?period=${filterPeriod}`);
      // const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockTransactions = [
        { id: 'TXN-9021', date: '2026-08-10T09:14:00', guest: 'Marisol Reyes', room: '304', description: 'Room Charge - Veranda Suite', amount: 14700, method: 'Credit Card', methodDetail: 'Visa ····4242', type: 'charge', status: 'completed' },
        { id: 'TXN-9022', date: '2026-08-10T10:30:00', guest: 'Daniel Kho', room: '208', description: 'Room Charge - Garden Room', amount: 4200, method: 'Bank Transfer', methodDetail: 'BDO Unibank', type: 'charge', status: 'pending' },
        { id: 'TXN-9023', date: '2026-08-10T11:05:00', guest: 'Fam. Villanueva', room: '412', description: 'Room Charge - Amber Loft', amount: 31500, method: 'Cash', methodDetail: 'Front Desk', type: 'charge', status: 'completed' },
        { id: 'TXN-9024', date: '2026-08-10T12:20:00', guest: 'Marisol Reyes', room: '304', description: 'F&B - Room Service Lunch', amount: 1850, method: 'Room Charge', methodDetail: 'Folio #304', type: 'charge', status: 'completed' },
        { id: 'TXN-9025', date: '2026-08-10T13:45:00', guest: 'Carlos Mendoza', room: '115', description: 'Minibar Consumption', amount: 620, method: 'Room Charge', methodDetail: 'Folio #115', type: 'charge', status: 'completed' },
        { id: 'TXN-9026', date: '2026-08-10T14:00:00', guest: 'Lena Park', room: '220', description: 'Spa Treatment - Full Body', amount: 3500, method: 'Credit Card', methodDetail: 'MC ····8891', type: 'charge', status: 'completed' },
        { id: 'TXN-9027', date: '2026-08-09T16:30:00', guest: 'Roberto Santos', room: '305', description: 'Refund - Overcharge Correction', amount: -2100, method: 'Credit Card', methodDetail: 'Visa ····3310', type: 'refund', status: 'completed' },
        { id: 'TXN-9028', date: '2026-08-09T08:00:00', guest: 'Angela Cruz', room: '410', description: 'Late Checkout Penalty', amount: 1500, method: 'Cash', methodDetail: 'Front Desk', type: 'charge', status: 'completed' },
        { id: 'TXN-9029', date: '2026-08-09T09:15:00', guest: 'Mark Rivera', room: '102', description: 'Laundry Service', amount: 450, method: 'Room Charge', methodDetail: 'Folio #102', type: 'charge', status: 'pending' },
        { id: 'TXN-9030', date: '2026-08-08T17:00:00', guest: 'Jun Aquino', room: '318', description: 'Void - Duplicate Entry', amount: -8400, method: 'System', methodDetail: 'Auto-correction', type: 'void', status: 'voided' },
      ];

      const mockKpis = {
        totalIncome: 57820,
        totalExpenses: 10500,
        netRevenue: 47320,
        outstanding: 4650
      };

      setTransactions(mockTransactions);
      setKpis(mockKpis);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...transactions];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.guest.toLowerCase().includes(q) ||
        t.room.includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    // Method filter
    if (filterMethod !== 'all') {
      result = result.filter(t => t.method.toLowerCase().replace(' ', '-') === filterMethod);
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    setFilteredTransactions(result);
  };

  const handleExport = (format) => {
    // TODO: Implement actual export
    alert(`Exporting ${filteredTransactions.length} transactions as ${format.toUpperCase()}`);
  };

  const handleRecordPayment = (paymentData) => {
    // TODO: POST to API
    const newTxn = {
      id: `TXN-${9030 + transactions.length + 1}`,
      date: new Date().toISOString(),
      guest: paymentData.guest,
      room: paymentData.room,
      description: paymentData.description,
      amount: parseFloat(paymentData.amount),
      method: paymentData.method,
      methodDetail: paymentData.methodDetail || '',
      type: 'charge',
      status: 'completed'
    };
    setTransactions(prev => [newTxn, ...prev]);
    setShowPaymentModal(false);
  };

  const handleRefund = (refundData) => {
    // TODO: POST to API
    const newTxn = {
      id: `TXN-${9030 + transactions.length + 1}`,
      date: new Date().toISOString(),
      guest: selectedTransaction.guest,
      room: selectedTransaction.room,
      description: `Refund - ${refundData.reason}`,
      amount: -Math.abs(parseFloat(refundData.amount)),
      method: selectedTransaction.method,
      methodDetail: selectedTransaction.methodDetail,
      type: 'refund',
      status: 'completed'
    };
    setTransactions(prev => [newTxn, ...prev]);
    setShowRefundModal(false);
    setSelectedTransaction(null);
  };

  const handleVoid = (transaction) => {
    if (!window.confirm(`Void transaction ${transaction.id}? This cannot be undone.`)) return;
    // TODO: PUT to API
    setTransactions(prev => prev.map(t =>
      t.id === transaction.id ? { ...t, status: 'voided', type: 'void' } : t
    ));
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatAmount = (amount) => {
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString();
    if (amount < 0) return `(${formatted})`;
    return formatted;
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'completed': return <span className="status-tag tag-success">Completed</span>;
      case 'pending': return <span className="status-tag tag-warning">Pending</span>;
      case 'voided': return <span className="status-tag tag-neutral">Voided</span>;
      case 'refunded': return <span className="status-tag tag-danger">Refunded</span>;
      default: return <span className="status-tag tag-neutral">{status}</span>;
    }
  };

  if (isLoading || !kpis) {
    return (
      <section className="admin-tab-content active">
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading transactions...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-tab-content active">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Transactions</h2>
          <p>Daily operational ledger</p>
        </div>
        <div className="right">
          <button className="btn btn-sm" onClick={() => handleExport('csv')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export CSV
          </button>
          <button className="btn btn-sm" onClick={() => handleExport('pdf')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            Export PDF
          </button>
          <button className="btn btn-sm btn-gold" onClick={() => setShowPaymentModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Record Payment
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px' }}>
        <div className="kpi-card">
          <span className="lbl">TOTAL INCOME</span>
          <span className="val">{kpis.totalIncome.toLocaleString()}</span>
          <span className="sub">This {filterPeriod}</span>
        </div>
        <div className="kpi-card">
          <span className="lbl">TOTAL EXPENSES</span>
          <span className="val">{kpis.totalExpenses.toLocaleString()}</span>
          <span className="sub">Refunds & adjustments</span>
        </div>
        <div className="kpi-card">
          <span className="lbl">NET REVENUE</span>
          <span className="val" style={{ color: 'var(--status-vac)' }}>{kpis.netRevenue.toLocaleString()}</span>
          <span className="sub">After deductions</span>
        </div>
        <div className="kpi-card">
          <span className="lbl">OUTSTANDING</span>
          <span className="val" style={{ color: '#b45309' }}>{kpis.outstanding.toLocaleString()}</span>
          <span className="sub">Pending collection</span>
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
              placeholder="Search by guest, room, or TXN ID..."
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
            <option value="year">This Year</option>
          </select>

          {/* Method */}
          <select className="floor-dropdown" value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="credit-card">Credit Card</option>
            <option value="bank-transfer">Bank Transfer</option>
            <option value="room-charge">Room Charge</option>
          </select>

          {/* Status */}
          <select className="floor-dropdown" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="voided">Voided</option>
          </select>

          {/* Type */}
          <select className="floor-dropdown" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="charge">Charge</option>
            <option value="refund">Refund</option>
            <option value="void">Void</option>
          </select>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="panel">
        <div className="panel-header">
          <h3>Transaction History</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{filteredTransactions.length} records</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>TXN ID</th>
                <th>Date</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Description</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="table-row-hover">
                    <td>
                      <span className="guest-name">{txn.id}</span>
                    </td>
                    <td>
                      <span className="std-text">{formatDate(txn.date)}</span>
                      <span className="guest-sub">{formatTime(txn.date)}</span>
                    </td>
                    <td>
                      <span className="guest-name">{txn.guest}</span>
                    </td>
                    <td>
                      <span className="std-text">{txn.room}</span>
                    </td>
                    <td>
                      <span className="std-text">{txn.description}</span>
                    </td>
                    <td>
                      <span className="std-text">{txn.method}</span>
                      <span className="guest-sub">{txn.methodDetail}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: txn.amount < 0 ? 'var(--status-occ)' : 'var(--text-primary)' }}>
                        {formatAmount(txn.amount)}
                      </span>
                    </td>
                    <td>{getStatusTag(txn.status)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-links" style={{ justifyContent: 'center' }}>
                        {txn.status === 'completed' && txn.type === 'charge' && (
                          <button
                            className="action-link link-edit"
                            onClick={() => { setSelectedTransaction(txn); setShowRefundModal(true); }}
                          >
                            Refund
                          </button>
                        )}
                        {txn.status !== 'voided' && (
                          <button
                            className="action-link link-delete"
                            onClick={() => handleVoid(txn)}
                          >
                            Void
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <RecordPaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSave={handleRecordPayment}
        />
      )}

      {/* REFUND MODAL */}
      {showRefundModal && selectedTransaction && (
        <RefundModal
          transaction={selectedTransaction}
          onClose={() => { setShowRefundModal(false); setSelectedTransaction(null); }}
          onRefund={handleRefund}
        />
      )}
    </section>
  );
}

/* ============================================================
   RECORD PAYMENT MODAL
   ============================================================ */
function RecordPaymentModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    guest: '',
    room: '',
    description: '',
    amount: '',
    method: 'Cash',
    methodDetail: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.guest || !formData.amount || !formData.description) {
      alert('Please fill in required fields.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Record Payment</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Manually log a payment received</p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Guest Name <span className="required">*</span></label>
              <input type="text" value={formData.guest} onChange={(e) => setFormData({ ...formData, guest: e.target.value })} placeholder="e.g. Juan Dela Cruz" />
            </div>
            <div className="form-group">
              <label>Room Number</label>
              <input type="text" value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} placeholder="e.g. 304" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label>Description <span className="required">*</span></label>
            <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Room Charge, F&B, Spa" />
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-group">
              <label>Amount <span className="required">*</span></label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })}>
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Bank Transfer</option>
                <option>Room Charge</option>
                <option>GCash</option>
                <option>Maya</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Reference / Detail</label>
            <input type="text" value={formData.methodDetail} onChange={(e) => setFormData({ ...formData, methodDetail: e.target.value })} placeholder="e.g. Visa ····4242, Receipt #123" />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gold">Record Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   REFUND MODAL
   ============================================================ */
function RefundModal({ transaction, onClose, onRefund }) {
  const [formData, setFormData] = useState({
    amount: Math.abs(transaction.amount),
    reason: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reason) {
      alert('Please provide a reason for the refund.');
      return;
    }
    if (parseFloat(formData.amount) > Math.abs(transaction.amount)) {
      alert('Refund amount cannot exceed original transaction amount.');
      return;
    }
    onRefund(formData);
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Issue Refund</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Refund for {transaction.id} — {transaction.guest}</p>

        <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Original Amount</span>
            <span style={{ fontWeight: '700' }}>{Math.abs(transaction.amount).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Method</span>
            <span>{transaction.method}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label>Refund Amount <span className="required">*</span></label>
            <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} max={Math.abs(transaction.amount)} min="0" step="0.01" />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Reason <span className="required">*</span></label>
            <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g. Overcharge correction, Guest complaint resolution" style={{ minHeight: '80px' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn" style={{ background: 'var(--status-occ)', color: '#fff', borderColor: 'var(--status-occ)' }}>Issue Refund</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Transactions;
