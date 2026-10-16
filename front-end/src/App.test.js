import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { IDLE_HOME_DELAY, IDLE_LOGOUT_DELAY } from './hooks/useIdleSession';

// These integration tests exercise routing/session state, not dashboard APIs.
jest.mock('./components/admin/Overview', () => () => <div>Operations monitor</div>);

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.scrollTo = jest.fn();
  global.fetch = jest.fn(async (url, options) => ({
    ok: true,
    json: async () => url.includes('/auth/login') ? {
      token: 'test-session-token',
      role: JSON.parse(options.body).username === 'admin@example.com' ? 'admin' : 'employee',
      module: JSON.parse(options.body).username === 'admin@example.com' ? 'admin' : 'frontdesk',
      employee: { name: 'Test Employee', email: 'staff@example.com' },
    } : url.includes('/dashboard/overview') ? {
      arrivals: { pending: 0, total: 0, checkedIn: 0, vip: 0 },
      departures: { pending: 0, total: 0, checkedOut: 0, balanceDue: 0 },
      inHouse: { total: 0, balanceOutstanding: 0 },
      rooms: { total: 0, occupied: 0, vacant: 0, cleaning: 0, maintenance: 0 },
      bookings: { thisWeek: [0,0,0,0,0,0,0], lastWeek: [0,0,0,0,0,0,0] },
      recentActivity: [],
    } : [],
  }));
});
afterEach(() => jest.useRealTimers());

function openLogin() {
  window.history.replaceState(null, '', '#login');
  render(<App />);
}

test('opens the employee portal after employee sign in', async () => {
  window.localStorage.clear();
  openLogin();

  fireEvent.change(screen.getByLabelText(/username or email/i), { target: { value: 'staff@example.com' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'test-password' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByRole('button', { name: /account menu/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /switch to admin view/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
  fireEvent.click(screen.getByRole('button', { name: /^settings$/i }));
  fireEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }));
  expect(document.querySelector('.employee-portal-shell')).toHaveClass('theme-dark');
  expect(window.localStorage.getItem('jofiane-employee-theme')).toBe('dark');
});

test('opens the redesigned admin portal and persists its theme', async () => {
  window.localStorage.clear();
  openLogin();

  fireEvent.change(screen.getByLabelText(/username or email/i), { target: { value: 'admin@example.com' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByText('Admin Console')).toBeInTheDocument();
  expect(document.querySelector('.admin-portal-shell')).toHaveClass('theme-light');

  fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
  fireEvent.click(screen.getByRole('button', { name: /^settings$/i }));
  fireEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }));
  expect(document.querySelector('.admin-portal-shell')).toHaveClass('theme-dark');
  expect(window.localStorage.getItem('jofiane-admin-theme')).toBe('dark');
});

test('idle showcase preserves drafts, then 30-minute expiry removes the workspace and credentials', async () => {
  jest.useFakeTimers();
  openLogin();
  fireEvent.change(screen.getByLabelText(/username or email/i), { target: { value: 'staff@example.com' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'test-password' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /sign in/i })); });
  fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
  fireEvent.click(screen.getByRole('button', { name: /^settings$/i }));
  fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
  const name = screen.getByLabelText(/full name/i);
  fireEvent.change(name, { target: { value: 'Unsaved draft' } });
  act(() => jest.advanceTimersByTime(IDLE_HOME_DELAY));
  expect(document.querySelector('.app-workspace')).toHaveAttribute('hidden');
  expect(document.querySelector('.portal-theme')).toHaveAttribute('hidden');
  fireEvent.click(screen.getByRole('button', { name: /return to employee portal/i }));
  expect(screen.getByLabelText(/full name/i)).toHaveValue('Unsaved draft');
  expect(window.localStorage.getItem('jofiane-token')).toBe('test-session-token');
  act(() => jest.advanceTimersByTime(IDLE_LOGOUT_DELAY));
  expect(screen.getByRole('alert')).toHaveTextContent('You have been logged out due to 30 minutes of inactivity for security purposes.');
  expect(document.querySelector('.app-workspace')).toBeNull();
  expect(document.querySelector('.portal-theme')).toBeNull();
  expect(window.localStorage.getItem('jofiane-token')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /return to employee portal/i }));
  expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
});
