import React, { useEffect, useRef, useState } from 'react';
import { authFetch, readError } from '../../../utils/api';
import { TableSkeletonRows } from '../../common/SkeletonLoader';
import PortalModal from '../../common/PortalModal';
import './ArchiveDashboard.css';

const empty = { records: [], total: 0, columns: [], note: '' };
const formatValue = value => value == null || value === '' ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value);
const deletedDate = value => value ? new Date(value).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function ArchiveDashboard() {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('bookings');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [action, setAction] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('');
  const lock = useRef(false);
  const request = useRef(0);
  const current = categories.find(item => item.key === category);
  const invalidDates = Boolean(from && to && from > to);
  const totalPages = Math.max(1, Math.ceil(data.total / 25));

  useEffect(() => {
    const controller = new AbortController();
    setCategoryError('');
    authFetch('/api/archive/categories', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error(await readError(response, 'Unable to load archive categories.'));
      const result = await response.json();
      if (!controller.signal.aborted) setCategories(result);
    }).catch(err => { if (err.name !== 'AbortError' && !controller.signal.aborted) setCategoryError(err.message); });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    const version = ++request.current;
    const controller = new AbortController();
    setData(empty); setLoading(!invalidDates); setError('');
    if (invalidDates) return () => controller.abort();
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ page: String(page), limit: '25', search, status, from, to });
        const response = await authFetch(`/api/archive/${category}?${query}`, { signal: controller.signal });
        if (!response.ok) throw new Error(await readError(response, 'Unable to load archived records.'));
        const result = await response.json();
        if (version === request.current && !controller.signal.aborted) {
          const lastPage = Math.max(1, Math.ceil(result.total / 25));
          if (page > lastPage) setPage(lastPage);
          else setData(result);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && version === request.current && !controller.signal.aborted) setError(err.message);
      } finally {
        if (version === request.current && !controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [category, search, status, from, to, page, revision, invalidDates]);

  const filter = setter => event => { setter(event.target.value); setPage(1); setNotice(''); };
  const openAction = (type, row) => {
    setAction({ type, row, category }); setActionError(''); setPassword(''); setConfirmation(''); setReason('');
  };
  const closeAction = () => { if (!lock.current) { setAction(null); setPassword(''); } };
  const confirmAction = async event => {
    event.preventDefault();
    if (lock.current || !action) return;
    const purge = action.type === 'purge';
    if (purge && (!password || confirmation !== `${action.category}:${action.row._id}` || reason.trim().length < 5)) return;
    lock.current = true; setBusy(true); setActionError('');
    try {
      const suffix = purge ? '' : '/restore';
      const response = await authFetch(`/api/archive/${action.category}/${encodeURIComponent(action.row._id)}${suffix}`, {
        method: purge ? 'DELETE' : 'PATCH',
        ...(purge ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, confirmation, reason: reason.trim() }) } : {}),
      });
      if (!response.ok) throw new Error(await readError(response, 'Unable to change this record.'));
      setNotice(purge ? 'Record permanently deleted. This action was logged.' : 'Record restored to its original module.');
      setPassword(''); setAction(null); setRevision(value => value + 1);
    } catch (err) { setActionError(err.message); setPassword(''); }
    finally { lock.current = false; setBusy(false); }
  };

  return <section className="admin-tab-content active archive-dashboard" aria-labelledby="archive-title">
    <header className="archive-heading"><div><p className="archive-eyebrow">ADMINISTRATION · DATA RECOVERY</p><h1 id="archive-title">Archive</h1><p>Recover deleted records. Review carefully before removing anything permanently.</p></div><span className="archive-access">Admin access only</span></header>
    <div className="archive-policy"><strong>Archived, not lost.</strong><span>Normal Delete actions now move records here. Restore keeps the original ID and data. Financial safeguards still apply.</span></div>
    <div className="panel archive-panel">
      <div className="archive-filters">
        <label>Category<select value={category} onChange={event => { setCategory(event.target.value); setStatus(''); setSearch(''); setPage(1); setNotice(''); }}>{categories.length ? categories.map(item => <option key={item.key} value={item.key}>{item.label}</option>) : <option value="bookings">Reservations</option>}</select></label>
        <label className="archive-search">Search archived records<input type="search" maxLength={120} value={search} onChange={filter(setSearch)} placeholder="Search original names, references, or descriptions…" /></label>
        {current?.hasStatus && <label>Original status<input value={status} maxLength={80} onChange={filter(setStatus)} placeholder="Any status" list="archive-status-options" /><datalist id="archive-status-options">{['Cancelled', 'Checked Out', 'No Show', 'VOIDED', 'COMPLETED', 'PENDING', 'ACTIVE', 'INACTIVE', 'PUBLISHED', 'DRAFT', 'CLAIMED', 'UNCLAIMED'].map(value => <option key={value} value={value} />)}</datalist></label>}
        <label>Deleted from<input type="date" value={from} onChange={filter(setFrom)} aria-invalid={invalidDates} /></label>
        <label>Deleted through<input type="date" value={to} min={from || undefined} onChange={filter(setTo)} aria-invalid={invalidDates} /></label>
        <button className="btn" onClick={() => { setSearch(''); setStatus(''); setFrom(''); setTo(''); setPage(1); }}>Clear filters</button>
      </div>
      {invalidDates && <p role="alert" className="archive-error">The start date must be on or before the end date.</p>}
      {(current?.note || data.note) && <p className="archive-category-note">{current?.note || data.note}</p>}
      {notice && <p className="archive-success" role="status">{notice}</p>}
      {(error || categoryError) && <div className="archive-error" role="alert">{error || categoryError} <button className="btn" onClick={() => setRevision(value => value + 1)}>Retry</button></div>}
      <div className="archive-table-caption"><h2>{current?.label || 'Reservations'}</h2><span>{loading ? 'Loading records…' : `${data.total} archived records`} · deletion dates in Philippine time</span></div>
      <div className="archive-table-scroll" role="region" aria-label="Archived records" tabIndex="0" aria-busy={loading}>
        <table><thead><tr>{data.columns.map(column => <th key={column.key}>{column.label}</th>)}<th>Date Deleted</th><th>Actions</th></tr></thead><tbody>
          {loading ? <TableSkeletonRows rows={5} columns={Math.max(4, data.columns.length + 2)} label="Loading archived records" /> : data.records.map(row => <tr key={row._id}>
            {data.columns.map(column => <td key={column.key}><span className="archive-cell" title={formatValue(row[column.key])}>{formatValue(row[column.key])}</span></td>)}
            <td className="archive-date">{deletedDate(row.deleted_at)}</td><td><div className="archive-row-actions"><button className="btn btn-gold" onClick={() => openAction('restore', row)}>Restore</button><button className="btn" onClick={() => setDetail(row)}>Details</button><button className="archive-delete" onClick={() => openAction('purge', row)}>Delete Permanently</button></div></td>
          </tr>)}
          {!loading && !error && <>{!data.records.length && <tr><td colSpan={data.columns.length + 2} className="archive-empty"><strong>No archived records found</strong><p>Deleted records appear here. Try another category or clear your filters.</p></td></tr>}</>}
        </tbody></table>
      </div>
      <footer className="archive-pagination"><span>Page {page} of {totalPages}</span><button className="btn" disabled={loading || page === 1} onClick={() => setPage(value => value - 1)}>Previous</button><button className="btn" disabled={loading || page >= totalPages} onClick={() => setPage(value => value + 1)}>Next</button></footer>
    </div>
    {detail && <PortalModal title="Archived record details" maxWidth={760} onClose={() => setDetail(null)} className="archive-dialog"><h2>Archived record details</h2><p>Original stored fields · credentials are never displayed.</p><dl className="archive-details">{Object.entries(detail).map(([key, value]) => <div key={key}><dt>{key === 'deleted_at' ? 'Date Deleted' : key.replace(/[._]/g, ' ')}</dt><dd>{key === 'deleted_at' ? deletedDate(value) : formatValue(value)}</dd></div>)}</dl><button className="btn" onClick={() => setDetail(null)}>Close</button></PortalModal>}
    {action && <PortalModal title={action.type === 'purge' ? 'Delete permanently?' : 'Restore record?'} maxWidth={560} onClose={closeAction} busy={busy} className="archive-dialog">
      <form onSubmit={confirmAction}><p className="archive-eyebrow">{current?.label}</p><h2>{action.type === 'purge' ? 'Delete permanently?' : 'Restore this record?'}</h2>
        <p>{action.type === 'purge' ? 'This cannot be undone. The stored record will be removed from the database. Restore is the safer option if you still need it.' : 'The record will return to its original module with its original data. Related records must exist and identifiers must not conflict.'}</p>
        {current?.note && <p className="archive-category-note">{current.note}</p>}
        <code className="archive-record-id">{action.category}:{action.row._id}</code>
        {action.type === 'purge' && <><label>Type the exact record confirmation above<input required autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} /></label><label>Reason for permanent deletion<textarea required minLength={5} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} disabled={busy} /></label><label>Your administrator password<input required type="password" autoComplete="current-password" maxLength={128} value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></label></>}
        {actionError && <p className="archive-error" role="alert">{actionError}</p>}
        <div className="archive-dialog-actions"><button type="button" className="btn" disabled={busy} onClick={closeAction}>Cancel</button><button className={`btn ${action.type === 'purge' ? 'archive-danger' : 'btn-gold'}`} disabled={busy || (action.type === 'purge' && (!password || reason.trim().length < 5 || confirmation !== `${action.category}:${action.row._id}`))}>{busy ? 'Saving…' : action.type === 'purge' ? 'Delete Permanently' : 'Restore record'}</button></div>
      </form>
    </PortalModal>}
  </section>;
}
