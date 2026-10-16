import React, { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

const PortalTheme = createContext({ theme: 'light', suspended: false });
export const usePortalTheme = () => useContext(PortalTheme);
export function PortalThemeProvider({ theme, suspended = false, children }) {
  return <PortalTheme.Provider value={{ theme, suspended }}>{children}</PortalTheme.Provider>;
}

function ThemePortal({ children, target }) {
  const { theme, suspended } = useContext(PortalTheme);
  return createPortal(<div className={`portal-theme theme-${theme}`} hidden={suspended}>{children}</div>, target);
}

// Keep dialogs in the document layer while retaining their workspace's theme.
export function createThemedPortal(children, target = document.body) {
  return <ThemePortal target={target}>{children}</ThemePortal>;
}
