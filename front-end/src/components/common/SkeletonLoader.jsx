import React from 'react';
import './SkeletonLoader.css';

export function SkeletonBlock({ className = '', style = {}, ...props }) {
  return <span aria-hidden="true" className={`ui-skeleton ${className}`.trim()} style={style} {...props} />;
}

export function TableSkeletonRows({ rows = 5, columns = 5, label = 'Loading records' }) {
  return <>
    <tr className="ui-loading-announcement"><td colSpan={columns}><span className="ui-loading-sr" role="status">{label}</span></td></tr>
    {Array.from({ length: rows }, (_, row) => (
      <tr className="ui-skeleton-row" key={row} aria-hidden="true">
        {Array.from({ length: columns }, (_, column) => <td key={column}><SkeletonBlock style={{ width: `${60 + ((row + column) % 3) * 15}%` }} /></td>)}
      </tr>
    ))}
  </>;
}

export function CardsSkeleton({ cards = 3, label = 'Loading content' }) {
  return <div className="ui-cards-skeleton" role="status" aria-label={label}>
    {Array.from({ length: cards }, (_, index) => <div className="ui-skeleton-card" key={index} aria-hidden="true">
      <SkeletonBlock style={{ width: '42%', height: 15 }} />
      <SkeletonBlock style={{ width: '72%', height: 25 }} />
      <SkeletonBlock style={{ width: '90%', height: 12 }} />
    </div>)}
  </div>;
}

export function LoadingError({ title = 'Unable to load this section', message = 'Please check your connection and try again.', onRetry }) {
  return <div className="ui-load-error" role="alert">
    <span className="ui-load-error__icon" aria-hidden="true">!</span>
    <div><h3>{title}</h3><p>{message}</p></div>
    {onRetry && <button type="button" className="btn btn-gold" onClick={onRetry}>Try again</button>}
  </div>;
}

export function PageSkeleton({ rows = 5, columns = 5, variant = 'table', label = 'Loading content' }) {
  return (
    <div className="ui-page-skeleton" role="status" aria-label={label}>
      <SkeletonBlock className="ui-page-skeleton__heading" />
      <SkeletonBlock className="ui-page-skeleton__subheading" />
      <div className="ui-page-skeleton__grid">
        {Array.from({ length: 4 }, (_, index) => <SkeletonBlock key={index} className="ui-page-skeleton__kpi" />)}
      </div>
      {variant === 'cards' ? <CardsSkeleton cards={6} /> : <div className="ui-page-skeleton__table">
        <div className="ui-skeleton-table-toolbar"><SkeletonBlock style={{ width: '32%', height: 18 }} /><SkeletonBlock style={{ width: '24%', height: 32 }} /></div>
        <table aria-hidden="true"><tbody>{Array.from({ length: rows }, (_, row) => <tr className="ui-skeleton-row" key={row}>{Array.from({ length: columns }, (_, column) => <td key={column}><SkeletonBlock style={{ width: `${60 + ((row + column) % 3) * 15}%` }} /></td>)}</tr>)}</tbody></table>
      </div>}
    </div>
  );
}

export default SkeletonBlock;
