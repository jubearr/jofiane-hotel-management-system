import React from 'react';
import PortalModal from './PortalModal';

/**
 * ConfirmModal — a small styled confirmation pop-up to replace the browser's
 * native window.confirm(). Centered via PortalModal.
 *
 * Props:
 *  - title       : heading (e.g. "Confirm Check-In")
 *  - message     : body text / node explaining what will happen
 *  - confirmLabel: primary button text (default "Confirm")
 *  - cancelLabel : secondary button text (default "Cancel")
 *  - busy        : when true, disables buttons and shows a busy label
 *  - onConfirm   : called when the primary button is clicked
 *  - onCancel    : called when cancel / backdrop dismiss is clicked
 *  - tone        : "primary" (gold) or "danger" (red) for the confirm button
 */
export default function ConfirmModal({
  title = 'Please confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
  tone = 'primary',
}) {
  const confirmBg = tone === 'danger' ? '#dc2626' : 'var(--gold, #c5a059)';

  return (
    <PortalModal maxWidth={400} onClose={onCancel} busy={busy}>
      <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>
        {title}
      </h3>
      <div style={{ margin: '0 0 22px', fontSize: '14px', lineHeight: 1.5, color: 'var(--text-muted, #4b5563)' }}>
        {message}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          type="button"
          className="btn"
          onClick={onCancel}
          disabled={busy}
          style={{ padding: '9px 18px', borderRadius: '8px', fontWeight: 600 }}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="btn"
          onClick={onConfirm}
          disabled={busy}
          style={{ padding: '9px 18px', borderRadius: '8px', fontWeight: 700, border: 'none', background: confirmBg, color: '#fff' }}
        >
          {busy ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </PortalModal>
  );
}
