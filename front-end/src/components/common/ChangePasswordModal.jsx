import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { authFetch, readError, validatePassword } from '../../utils/api';

/* ============================================================
   CHANGE PASSWORD MODAL  (shared by admin + employee settings)
   Standalone flow: current → new (policy + must differ from
   current) → confirm (must match new). Each error is inline
   under its own field. Portaled to <body>.

   Props:
   - isDarkMode : boolean  (theme the popup)
   - shellClass : string   (portal shell classes for theming)
   - onClose    : () => void
   ============================================================ */
export default function ChangePasswordModal({ isDarkMode, shellClass = 'admin-portal-shell', onClose }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const setField = (key) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [key]: val }));

    setErrors((prev) => {
      const next = { ...prev, [key]: '' };
      if (key === 'next') {
        if (val) {
          const policy = validatePassword(val);
          if (policy) next.next = policy;
          else if (form.current && val === form.current) next.next = 'New password must be different from the current password.';
        }
        if (form.confirm) next.confirm = val !== form.confirm ? 'Passwords do not match.' : '';
      }
      if (key === 'confirm') {
        next.confirm = val && val !== form.next ? 'Passwords do not match.' : '';
      }
      if (key === 'current' && form.next && form.next === val) {
        next.next = 'New password must be different from the current password.';
      }
      return next;
    });
  };

  const validateAll = () => {
    const e = { current: '', next: '', confirm: '' };
    if (!form.current) e.current = 'Enter your current password.';
    const policy = validatePassword(form.next);
    if (policy) e.next = policy;
    else if (form.next === form.current) e.next = 'New password must be different from the current password.';
    if (form.confirm !== form.next) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return !e.current && !e.next && !e.confirm;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!validateAll()) return;
    setSubmitting(true);
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      if (!res.ok) {
        const msg = await readError(res, 'Failed to change password.');
        if (/current password/i.test(msg)) setErrors((prev) => ({ ...prev, current: msg }));
        else setErrors((prev) => ({ ...prev, next: msg }));
        setSubmitting(false);
        return;
      }
      setSuccess(true);   // show the in-modal success view instead of a native alert
    } catch (err) {
      console.error('Change password failed:', err);
      setErrors((prev) => ({ ...prev, current: 'Cannot reach the server. Please try again.' }));
      setSubmitting(false);
    }
  };

  const errText = { fontSize: '11px', color: 'var(--status-occ)', fontWeight: 600, marginTop: '5px' };
  const eyeBtn = { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 };

  const field = (label, keyName, placeholder) => (
    <div className="form-group" style={{ marginBottom: '16px' }}>
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show[keyName] ? 'text' : 'password'}
          value={form[keyName]}
          onChange={setField(keyName)}
          placeholder={placeholder}
          style={{ paddingRight: '54px', borderColor: errors[keyName] ? 'var(--status-occ)' : undefined }}
        />
        <button type="button" style={eyeBtn} onClick={() => setShow((s) => ({ ...s, [keyName]: !s[keyName] }))}>
          {show[keyName] ? 'Hide' : 'Show'}
        </button>
      </div>
      {errors[keyName] && <div style={errText}>{errors[keyName]}</div>}
    </div>
  );

  return createPortal(
    <div className={`portal-shell ${shellClass} settings-edit-modal ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="modal-overlay open" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-content" style={{ maxWidth: '440px' }} onMouseDown={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>&times;</button>

          {success ? (
            /* ── In-modal success view (replaces the native alert) ── */
            <div style={{ textAlign: 'center', padding: '12px 4px 4px' }}>
              <div style={{
                width: '58px', height: '58px', borderRadius: '50%', margin: '0 auto 16px',
                display: 'grid', placeItems: 'center',
                background: 'rgba(46, 160, 87, 0.14)', border: '2px solid rgba(46, 160, 87, 0.5)',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2ea057" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Password Changed</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>
                Your password has been updated successfully.
              </p>
              <button
                type="button"
                className="btn btn-gold"
                style={{ minWidth: '120px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
                onClick={onClose}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Change Password</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                New password must be 5–8 characters with an uppercase letter, a lowercase letter, a number, and a special character.
              </p>

              <form onSubmit={handleSubmit}>
                {field('Current Password', 'current', 'Enter current password')}
                {field('New Password', 'next', 'Enter new password')}
                {field('Confirm New Password', 'confirm', 'Re-enter new password')}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" className="btn" onClick={onClose}>Cancel</button>
                  <button type="submit" className="btn btn-gold" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Update Password'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
