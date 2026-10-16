import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PortalModal from './PortalModal';
import { PortalThemeProvider } from './ThemePortal';

function Harness({ suspended = false, busy = false }) {
  const [open, setOpen] = useState(false);
  return <PortalThemeProvider theme="dark" suspended={suspended}>
    <button onClick={() => setOpen(true)}>Open dialog</button>
    {open && <PortalModal title="Test dialog" onClose={() => setOpen(false)} busy={busy}>
      <button>First action</button><button onClick={() => setOpen(false)}>Last action</button>
    </PortalModal>}
  </PortalThemeProvider>;
}

test('contains focus, closes with Escape and restores the trigger', () => {
  const view = render(<Harness />);
  view.container.id = 'root';
  const trigger = screen.getByText('Open dialog');
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByRole('dialog')).toHaveFocus();
  expect(view.container).toHaveAttribute('inert');
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  expect(screen.getByText('Last action')).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(screen.getByText('First action')).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(trigger).toHaveFocus();
  expect(view.container).not.toHaveAttribute('inert');
});

test('busy dialog ignores Escape and AFK suspension releases scrolling', () => {
  const view = render(<Harness busy />);
  fireEvent.click(screen.getByText('Open dialog'));
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  view.rerender(<Harness busy suspended />);
  expect(document.querySelector('.portal-theme')).toHaveAttribute('hidden');
  expect(document.body.style.overflow).not.toBe('hidden');
});
