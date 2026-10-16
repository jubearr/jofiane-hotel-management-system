import React, { useEffect, useId, useRef } from 'react';
import { createThemedPortal, usePortalTheme } from './ThemePortal';

const openDialogs = [];
let restorePage = null;
const focusable = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';

// Keep the active theme and keyboard focus; release the page while AFK.
export default function PortalModal({ maxWidth = 440, children, className = '', title, onClose, busy = false }) {
  const { suspended } = usePortalTheme();
  const panel = useRef(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  const titleId = useId();
  closeRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    if (suspended) return;
    const node = panel.current;
    const previousFocus = document.activeElement;
    const heading = node.querySelector('h2, h3');
    if (!title && heading) {
      heading.id ||= titleId;
      node.setAttribute('aria-labelledby', heading.id);
    }
    if (!openDialogs.length) {
      const previousOverflow = document.body.style.overflow;
      const root = document.getElementById('root');
      const wasInert = root?.hasAttribute('inert');
      root?.setAttribute('inert', '');
      document.body.style.overflow = 'hidden';
      restorePage = () => {
        document.body.style.overflow = previousOverflow;
        if (!wasInert) root?.removeAttribute('inert');
      };
    }
    openDialogs.push(node);
    node.focus({ preventScroll: true });
    const onKeyDown = (event) => {
      if (openDialogs[openDialogs.length - 1] !== node) return;
      if (event.key === 'Escape' && closeRef.current && !busyRef.current) {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key !== 'Tab') return;
      const items = [...node.querySelectorAll(focusable)].filter(el => !el.closest('[hidden]') && el.type !== 'hidden');
      const first = items[0], last = items[items.length - 1];
      if (!items.length) { event.preventDefault(); node.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === node)) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      openDialogs.splice(openDialogs.indexOf(node), 1);
      if (!openDialogs.length) { restorePage?.(); restorePage = null; }
      if (previousFocus?.isConnected && !previousFocus.closest('[hidden], [inert]')) previousFocus.focus({ preventScroll: true });
    };
  }, [suspended, title, titleId]);

  return createThemedPortal(
    <div className="modal-overlay modal-portal-overlay open" onMouseDown={event => event.stopPropagation()}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} aria-busy={busy || undefined}
        tabIndex={-1} className={`modal-content ${className}`} style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}
