import React, { useState, useEffect, useRef } from 'react';
import { usePolling } from '../../../hooks/usePolling';
import { authFetch, readError } from '../../../utils/api';
import { PageSkeleton, LoadingError } from '../../common/SkeletonLoader';
import { Input, Select, Textarea, ValidatedForm, SubmitButton } from '../../common/FormControls';
import PortalModal from '../../common/PortalModal';
import ConfirmModal from '../../common/ConfirmModal';
import { money, parseMoney } from '../../../utils/formatters';
import { exportToCSV, printReportDocument } from '../../../utils/exportUtils';

function Transactions({ allowArchive = false }) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [kpis, setKpis] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('today');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Transaction detail modal (replaces inline row actions)
  const [viewingTxn, setViewingTxn] = useState(null);
  const [voidingTxn, setVoidingTxn] = useState(null);
  const [archivingTxn, setArchivingTxn] = useState(null);
  const [savingAction, setSavingAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const actionLock = useRef(false);
  const requestVersion = useRef(0);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Export Dropdown State
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => { applyFilters(); }, [transactions, searchQuery, filterMethod, filterStatus, filterType]);

  const fetchTransactions = async () => {
    const version = ++requestVersion.current;
    setLoadError(false);
    if (!kpis) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const res = await authFetch(`/api/transactions?period=${filterPeriod}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.transactions) || !data.kpis) throw new Error('Incomplete transaction response');

      if (version !== requestVersion.current) return;
      // Normalize aggregated transaction fields from embedded booking.transactions
      const normalized = data.transactions.map(t => ({
        id: t.txn_id || String(t.booking_object_id),
        date: t.datetime || new Date().toISOString(),
        guest: t.guest_name || '',
        room: String(t.room_number || ''),
        description: t.description || '',
        amount: parseMoney(t.amount),
        method: t.payment_method || '',
        methodDetail: t.payment_details || '',
        type: parseMoney(t.amount) < 0 ? 'refund' : 'charge',
        status: (t.status || '').toLowerCase(),   // "COMPLETED" → "completed"
        _bookingObjectId: t.booking_object_id,    // MongoDB _id of the parent booking
        _bookingId: t.booking_id,
      }));

      setTransactions(normalized);
      setKpis(data.kpis);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      if (version === requestVersion.current) setLoadError(true);
    } finally {
      if (version === requestVersion.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  usePolling(fetchTransactions, 10000, [filterPeriod]);

  const applyFilters = () => {
    let result = [...transactions];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
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
      result = result.filter(t => filterType === 'void' ? t.status === 'voided' : t.type === filterType);
    }

    setFilteredTransactions(result);
  };

  const handleExport = (format) => {
    const columns = [
      { header: 'Transaction ID', key: 'id' },
      { header: 'Date', accessor: t => new Date(t.date).toLocaleString('en-US') },
      { header: 'Booking ID', accessor: t => t._bookingId || '' },
      { header: 'Guest', key: 'guest' },
      { header: 'Room', key: 'room' },
      { header: 'Description', key: 'description' },
      { header: 'Type', accessor: t => (t.type || '').toUpperCase() },
      { header: 'Method', key: 'method' },
      { header: 'Amount', accessor: t => money(t.amount) },
      { header: 'Status', accessor: t => (t.status || '').toUpperCase() },
    ];

    const todayStr = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      exportToCSV(filteredTransactions, columns, `jofiane-transactions-${filterPeriod}-${todayStr}`);
    } else if (format === 'pdf') {
      const meta = [
        { label: 'Timeframe', value: filterPeriod.toUpperCase() },
        { label: 'Payment Method', value: filterMethod === 'all' ? 'All Methods' : filterMethod },
        { label: 'Status', value: filterStatus === 'all' ? 'All Statuses' : filterStatus },
        { label: 'Transaction Type', value: filterType === 'all' ? 'All Types' : filterType },
      ];
      const kpisList = kpis ? [
        { label: 'Total Revenue', value: money(kpis.totalRevenue) },
        { label: 'Total Payments', value: money(kpis.totalPayments) },
        { label: 'Pending Processing', value: String(kpis.pendingCount) },
        { label: 'Refunds / Voids', value: String(kpis.refundCount) },
      ] : [];

      printReportDocument({
        title: 'Transaction Audit & Revenue Report',
        subtitle: `Period: ${filterPeriod.toUpperCase()}`,
        meta,
        kpis: kpisList,
        columns,
        rows: filteredTransactions,
        orientation: 'landscape',
      });
    }
  };

  // Keep a failed form open, and prevent repeated clicks from posting twice.
  const runAction = async (action) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setSavingAction(true);
    setActionError('');
    try { await action(); }
    catch (error) { setActionError(error.message || 'Unable to save. Please try again.'); }
    finally { actionLock.current = false; setSavingAction(false); }
  };

  const handleRecordPayment = (payment) => runAction(async () => {
    const bookingsRes = await authFetch('/api/bookings?status=Checked%20In');
    if (!bookingsRes.ok) throw new Error('Could not verify the booking. Please try again.');
    const bookings = await bookingsRes.json();
    const match = bookings.find(b => String(b.room_number).trim() === payment.room.trim());
    if (!match) throw new Error(`No checked-in booking found for room ${payment.room}. Verify the room number.`);
    const guestKey = value => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    if (guestKey(match.guest?.full_name || '') !== guestKey(payment.guest)) {
      throw new Error('The guest name does not match the checked-in booking for this room. Please verify both fields.');
    }
    const txn = {
      txn_id: `TXN-${Date.now()}`,
      datetime: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', ''),
      description: payment.description.trim(),
      amount: Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      payment_method: payment.method,
      payment_details: payment.methodDetail.trim(),
      status: 'COMPLETED',
    };
    const res = await authFetch(`/api/bookings/${match._id}/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(txn),
    });
    if (!res.ok) throw new Error(await readError(res, 'Payment was not saved. Please try again.'));
    setShowPaymentModal(false);
    await fetchTransactions();
  });

  const handleRefund = (refund) => runAction(async () => {
    if (!selectedTransaction?._bookingObjectId) throw new Error('Cannot find the booking for this transaction.');
    const res = await authFetch(
      `/api/bookings/${selectedTransaction._bookingObjectId}/refunds`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.abs(parseFloat(refund.amount)),
          reason: refund.reason.trim(),
          payment_method: selectedTransaction.method,
          reference: selectedTransaction.methodDetail || '',
        }),
      }
    );
    if (!res.ok) throw new Error(await readError(res, 'Failed to issue refund.'));
    setShowRefundModal(false);
    setSelectedTransaction(null);
    await fetchTransactions();
  });

  const handleVoid = () => runAction(async () => {
    const transaction = voidingTxn;
    if (!transaction?._bookingObjectId) throw new Error('Cannot find the booking for this transaction.');
    const res = await authFetch(`/api/bookings/${transaction._bookingObjectId}/transactions/${transaction.id}/void`, { method: 'PATCH' });
    if (!res.ok) throw new Error(await readError(res, 'Failed to void transaction.'));
    setTransactions(prev => prev.map(t => t.id === transaction.id ? { ...t, status: 'voided' } : t));
    setVoidingTxn(null);
    await fetchTransactions();
  });

  const handleArchive = () => runAction(async () => {
    const id = `${archivingTxn._bookingObjectId}:${archivingTxn.id}`;
    const response = await authFetch(`/api/archive/transactions/${encodeURIComponent(id)}/archive`, { method: 'POST' });
    if (!response.ok) throw new Error(await readError(response, 'Unable to archive this transaction.'));
    setArchivingTxn(null);
    await fetchTransactions();
  });

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
      case 'completed': return <span className="status-tag tag-success">Completed</span>;
      case 'pending': return <span className="status-tag tag-warning">Pending</span>;
      case 'voided': return <span className="status-tag tag-neutral">Voided</span>;
      case 'refunded': return <span className="status-tag tag-danger">Refunded</span>;
      default: return <span className="status-tag tag-neutral">{status}</span>;
    }
  };

  if (loadError && !kpis) return <section className="admin-tab-content active"><LoadingError onRetry={fetchTransactions} /></section>;
  if (isLoading || !kpis) {
    return (
      <section className="admin-tab-content active">
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <PageSkeleton rows={6} />
        </div>
      </section>
    );
  }

  return (
    <section className="admin-tab-content active transaction-module">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Transactions</h2>
          <p>Payments, refunds, and guest balances in one clear view.</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid txn-kpi-grid" aria-label="Financial summary">
        <div className="kpi-card txn-kpi income">
          <span className="lbl">TOTAL INCOME</span>
          <span className="val">{money(kpis.totalIncome)}</span>
          <span className="sub">{filterPeriod === 'today' ? 'Today' : `This ${filterPeriod}`}</span>
        </div>
        <div className="kpi-card txn-kpi expenses">
          <span className="lbl">TOTAL EXPENSES</span>
          <span className="val">{money(kpis.totalExpenses)}</span>
          <span className="sub">Refunds & adjustments</span>
        </div>
        <div className="kpi-card txn-kpi net">
          <span className="lbl">NET REVENUE</span>
          <span className="val" style={{ color: 'var(--status-vac)' }}>{money(kpis.netRevenue)}</span>
          <span className="sub">After deductions</span>
        </div>
        <div className="kpi-card txn-kpi outstanding">
          <span className="lbl">OUTSTANDING</span>
          <span className="val" style={{ color: '#b45309' }}>{money(kpis.outstanding)}</span>
          <span className="sub">Pending collection</span>
        </div>
      </div>

      {loadError && <div className="workspace-notice" role="alert">The ledger could not refresh. Showing the last loaded records. <button className="btn btn-sm" onClick={fetchTransactions}>Retry</button></div>}
      {/* TRANSACTIONS TABLE */}
      <div className="panel txn-panel">
        
        {/* REDESIGNED HEADER TOOLBAR */}
        <div className="panel-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '10px', padding: '16px 24px', margin: 0, borderBottom: '1px solid var(--border-light)' }}>
          
          {/* ROW 1: Title */}
          <div className="ledger-heading">
            <h3>Transaction History <span className="record-count">{filteredTransactions.length}</span></h3>
            <span className="ledger-sync" role="status">{isRefreshing ? 'Updating…' : 'Select a reference to view details'}</span>
          </div>

          {/* ROW 2: Tools (Search, Filters, Actions) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            
            {/* LEFT CLUSTER: Search Bar */}
            <div className="panel-search txn-search" style={{ flex: '1 1 260px', maxWidth: '340px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <Input
                type="search"
                aria-label="Search transactions"
                placeholder="Search guest, room, or reference…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px' }}
              />
            </div>

            {/* RIGHT CLUSTER: Filters + Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
              
              <Select aria-label="Date period" className="floor-dropdown" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </Select>

              <Select aria-label="Payment method filter" className="floor-dropdown" value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="credit-card">Credit Card</option>
                <option value="bank-transfer">Bank Transfer</option>
                <option value="room-charge">Room Charge</option>
                <option value="gcash">GCash</option>
                <option value="maya">Maya</option>
              </Select>

              <Select aria-label="Transaction status" className="floor-dropdown" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="voided">Voided</option>
              </Select>

              <Select aria-label="Transaction type" className="floor-dropdown" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="charge">Charge</option>
                <option value="refund">Refund</option>
                <option value="void">Void</option>
              </Select>

              <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 4px' }}></div>

              {/* Dropdown Export Button */}
              <div style={{ position: 'relative' }}>
                <button className="btn btn-sm" onClick={() => setShowExportMenu(!showExportMenu)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Export
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>

                {showExportMenu && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                    background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
                    zIndex: 50, display: 'flex', flexDirection: 'column', minWidth: '130px',
                    overflow: 'hidden'
                  }}>
                    <button
                      style={{ padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-light)', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                      onClick={() => { handleExport('csv'); setShowExportMenu(false); }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(201, 168, 76, 0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      Export as CSV
                    </button>
                    <button
                      style={{ padding: '10px 14px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                      onClick={() => { handleExport('pdf'); setShowExportMenu(false); }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(201, 168, 76, 0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      Export as PDF
                    </button>
                  </div>
                )}
              </div>

              <button className="btn btn-sm btn-gold" onClick={() => { setActionError(''); setShowPaymentModal(true); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Record Payment
              </button>
            </div>
          </div>
        </div>
        
        <div className="table-wrap ledger-table-scroll" role="region" aria-label="Transaction history" tabIndex={0}>
          <table className="txn-table">
            <colgroup>
              <col style={{ width: '104px' }} />
              <col style={{ width: '112px' }} />
              <col style={{ width: '152px' }} />
              <col style={{ width: '68px' }} />
              <col />
              <col style={{ width: '140px' }} />
              <col style={{ width: '104px' }} />
              <col style={{ width: '112px' }} />
            </colgroup>
            <thead>
              <tr>
                <th>TXN ID</th>
                <th>Date</th>
                <th>Guest</th>
                <th style={{ textAlign: 'center' }}>Room</th>
                <th>Description</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="table-row-hover txn-row"
                    onClick={() => setViewingTxn(txn)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <button type="button" className="table-reference" onClick={event => { event.stopPropagation(); setViewingTxn(txn); }}>{txn.id}</button>
                    </td>
                    <td>
                      <span className="std-text">{formatDate(txn.date)}</span>
                      <span className="guest-sub">{formatTime(txn.date)}</span>
                    </td>
                    <td>
                      <span className="guest-name">{txn.guest}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
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
                      <span className={`txn-amount ${txn.amount < 0 ? 'negative' : 'positive'}`}>
                        {money(txn.amount)}
                      </span>
                    </td>
                    <td>{getStatusTag(txn.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPaymentModal && <RecordPaymentModal busy={savingAction} error={actionError}
        onClose={() => { if (!savingAction) setShowPaymentModal(false); }} onSave={handleRecordPayment} />}
      {showRefundModal && selectedTransaction && <RefundModal transaction={selectedTransaction}
        busy={savingAction} error={actionError} onRefund={handleRefund}
        onClose={() => { if (!savingAction) { setShowRefundModal(false); setSelectedTransaction(null); } }} />}
      {viewingTxn && <TransactionDetailModal transaction={viewingTxn} onClose={() => setViewingTxn(null)}
        onArchive={allowArchive ? txn => { setActionError(''); setViewingTxn(null); setArchivingTxn(txn); } : null}
        onRefund={txn => { setActionError(''); setViewingTxn(null); setSelectedTransaction(txn); setShowRefundModal(true); }}
        onVoid={txn => { setActionError(''); setViewingTxn(null); setVoidingTxn(txn); }}
        formatDate={formatDate} formatTime={formatTime} getStatusTag={getStatusTag} />}
      {archivingTxn && <ConfirmModal title="Archive transaction?" busy={savingAction} confirmLabel="Archive transaction" onConfirm={handleArchive}
        onCancel={() => { setViewingTxn(archivingTxn); setArchivingTxn(null); }}
        message={<><p>This voided entry will move to Archive. Its original data will be kept and can be restored by an administrator.</p>{actionError && <p role="alert" className="form-submit-error">{actionError}</p>}</>} />}
      {voidingTxn && <ConfirmModal title="Void transaction?" tone="danger" busy={savingAction}
        confirmLabel="Void Transaction" onConfirm={handleVoid}
        onCancel={() => { setViewingTxn(voidingTxn); setVoidingTxn(null); }}
        message={<><p>This will void <strong>{voidingTxn.id}</strong> for <strong>{money(voidingTxn.amount)}</strong>. This action cannot be undone.</p>
          {actionError && <p className="form-submit-error" role="alert">{actionError}</p>}</>} />}
    </section>
  );
}

export default Transactions;

function ModalClose({ onClose, busy }) {
  return <button type="button" className="modal-close" aria-label="Close dialog" disabled={busy} onClick={onClose}>×</button>;
}

function RecordPaymentModal({ onClose, onSave, busy, error }) {
  const [form, setForm] = useState({ guest: '', room: '', description: '', amount: '', method: 'Cash', methodDetail: '' });
  const change = key => event => setForm(prev => ({ ...prev, [key]: event.target.value }));
  return (
    <PortalModal title="Record Payment" maxWidth={560} className="finance-modal" onClose={onClose} busy={busy}>
      <ModalClose onClose={onClose} busy={busy} />
      <p className="dialog-eyebrow">FRONT DESK · PAYMENTS</p>
      <h3>Record Payment</h3>
      <p className="dialog-intro">Manually log a payment received for a checked-in guest.</p>
      <ValidatedForm onSubmit={event => { event.preventDefault(); if (!busy) onSave(form); }}>
        <fieldset disabled={busy} className="dialog-fields">
          <div className="form-grid">
            <div className="form-group"><label>Guest Name <span className="required">*</span></label>
              <Input required value={form.guest} onChange={change('guest')} placeholder="e.g. Juan Dela Cruz" autoComplete="off" /></div>
            <div className="form-group"><label>Room Number <span className="required">*</span></label>
              <Input required value={form.room} onChange={change('room')} placeholder="e.g. 304" maxLength={20} /></div>
          </div>
          <div className="form-group"><label>Description <span className="required">*</span></label>
            <Input required value={form.description} onChange={change('description')} placeholder="e.g. Room charge, dining, spa" /></div>
          <div className="form-grid">
            <div className="form-group"><label>Amount (₱) <span className="required">*</span></label>
              <Input required type="number" inputMode="decimal" min="0.01" step="0.01" value={form.amount} onChange={change('amount')} placeholder="0.00" /></div>
            <div className="form-group"><label>Payment Method</label>
              <Select value={form.method} onChange={change('method')}>
                {['Cash', 'Credit Card', 'Bank Transfer', 'Room Charge', 'GCash', 'Maya'].map(method => <option key={method}>{method}</option>)}
              </Select></div>
          </div>
          <div className="form-group"><label>Reference / Detail <span className="optional-label">Optional</span></label>
            <Input value={form.methodDetail} onChange={change('methodDetail')} placeholder="e.g. Receipt #123 or card ending 4242" />
            <small className="field-hint">Use a receipt reference or last four digits only. Never enter full card details.</small></div>
        </fieldset>
        {error && <p className="form-submit-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn" disabled={busy} onClick={onClose}>Cancel</button>
          <SubmitButton className="btn btn-gold" disabled={busy}>{busy ? 'Recording…' : 'Record Payment'}</SubmitButton>
        </div>
      </ValidatedForm>
    </PortalModal>
  );
}

function RefundModal({ transaction, onClose, onRefund, busy, error }) {
  const [form, setForm] = useState({ amount: Math.abs(transaction.amount), reason: '' });
  return (
    <PortalModal title="Issue Refund" maxWidth={540} className="finance-modal" onClose={onClose} busy={busy}>
      <ModalClose onClose={onClose} busy={busy} />
      <p className="dialog-eyebrow">TRANSACTION ADJUSTMENT</p>
      <h3>Issue Refund</h3>
      <p className="dialog-intro">Refund for {transaction.id} · {transaction.guest}</p>
      <dl className="refund-summary">
        <div><dt>Original amount</dt><dd>{money(transaction.amount)}</dd></div>
        <div><dt>Payment method</dt><dd>{transaction.method}</dd></div>
      </dl>
      <ValidatedForm onSubmit={event => { event.preventDefault(); if (!busy) onRefund(form); }}>
        <fieldset disabled={busy} className="dialog-fields">
          <div className="form-group"><label>Refund Amount (₱) <span className="required">*</span></label>
            <Input type="number" required inputMode="decimal" min="0.01" step="0.01" max={Math.abs(transaction.amount)}
              value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} />
            <small className="field-hint">Up to {money(transaction.amount)} for this transaction.</small></div>
          <div className="form-group"><label>Reason <span className="required">*</span></label>
            <Textarea required maxLength={500} rows={3} value={form.reason} onChange={event => setForm({ ...form, reason: event.target.value })}
              placeholder="e.g. Overcharge correction or guest complaint resolution" /></div>
        </fieldset>
        {error && <p className="form-submit-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn" disabled={busy} onClick={onClose}>Cancel</button>
          <SubmitButton className="btn finance-danger" disabled={busy}>{busy ? 'Issuing refund…' : 'Issue Refund'}</SubmitButton>
        </div>
      </ValidatedForm>
    </PortalModal>
  );
}

function TransactionDetailModal({ transaction: txn, onClose, onRefund, onVoid, onArchive, formatDate, formatTime, getStatusTag }) {
  const facts = [
    ['Reference', txn.id], ['Date & Time', `${formatDate(txn.date)} · ${formatTime(txn.date)}`],
    ['Guest', txn.guest], ['Room', txn.room], ['Description', txn.description],
    ['Payment Method', txn.method], ['Detail', txn.methodDetail || '—'],
    ['Type', txn.type], ['Status', txn.status],
  ];
  return (
    <PortalModal title="Transaction Details" maxWidth={620} className="finance-modal txn-detail-modal" onClose={onClose}>
      <ModalClose onClose={onClose} />
      <p className="dialog-eyebrow">PAYMENT RECORD</p>
      <div className="txn-modal-header"><h3>Transaction Details</h3>{getStatusTag(txn.status)}</div>
      <div className={`txn-modal-amount ${txn.amount < 0 ? 'negative' : 'positive'}`}>{money(txn.amount)}</div>
      <dl className="txn-modal-grid">
        {facts.map(([label, value]) => <div key={label} className={`txn-modal-field ${label === 'Description' ? 'full-width' : ''}`}>
          <dt className="txn-modal-label">{label}</dt><dd className="txn-modal-value">{value || '—'}</dd>
        </div>)}
      </dl>
      <div className="txn-modal-actions">
        {txn.status === 'completed' && txn.amount > 0 && <button className="ledger-btn" onClick={() => onRefund(txn)}>↶ Issue Refund</button>}
        {txn.status !== 'voided' && <button className="ledger-btn btn-danger" onClick={() => onVoid(txn)}>⊘ Void Transaction</button>}
        {txn.status === 'voided' && onArchive && <button className="ledger-btn" onClick={() => onArchive(txn)}>Archive transaction</button>}
        <button className="ledger-btn dialog-close-action" onClick={onClose}>Close</button>
      </div>
    </PortalModal>
  );
}
