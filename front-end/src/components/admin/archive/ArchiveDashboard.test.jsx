import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ArchiveDashboard from './ArchiveDashboard';
import { authFetch } from '../../../utils/api';
import { PortalThemeProvider } from '../../common/ThemePortal';

jest.mock('../../../utils/api', () => ({ authFetch: jest.fn(), readError: async response => (await response.json()).error }));
const id = '507f1f77bcf86cd799439011';
const categories = [{ key: 'bookings', label: 'Reservations', hasStatus: true }, { key: 'employees', label: 'Employees', hasStatus: true }];
const columns = [{ key: 'booking_id', label: 'Booking ID' }, { key: 'guest.full_name', label: 'Guest' }, { key: 'status', label: 'Status' }];
const row = { _id: id, booking_id: 'BKG-SAMPLE', 'guest.full_name': 'Sample Guest', status: 'Cancelled', deleted_at: '2026-10-03T12:30:00Z' };
const response = (data, ok = true) => ({ ok, json: async () => data });
let mutation;
beforeEach(() => {
  authFetch.mockReset();
  mutation = async () => response({ success: true });
  authFetch.mockImplementation(async (path, options = {}) => options.method ? mutation(path, options) : response(path === '/api/archive/categories' ? categories : { records: [row], columns, total: 1, page: 1, limit: 25 }));
});
const renderPage = () => render(<PortalThemeProvider theme="dark"><ArchiveDashboard /></PortalThemeProvider>);
const loaded = () => screen.findByText('BKG-SAMPLE');

test('loads category records, original fields, and Date Deleted using the protected API', async () => {
  renderPage(); await loaded();
  expect(screen.getByRole('columnheader', { name: 'Date Deleted' })).toBeInTheDocument();
  expect(screen.getByText('Sample Guest')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('bookings');
  expect(screen.getByText(/Admin access only/)).toBeInTheDocument();
});
test('changing categories clears stale records and requests the selected category', async () => {
  renderPage(); await loaded();
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'employees' } });
  expect(screen.queryByText('BKG-SAMPLE')).not.toBeInTheDocument();
  await waitFor(() => expect(authFetch).toHaveBeenCalledWith(expect.stringContaining('/api/archive/employees?'), expect.anything()));
});
test('search/status/date filters are server-side and invalid ranges do not fetch', async () => {
  renderPage(); await loaded();
  fireEvent.change(screen.getByLabelText('Search archived records'), { target: { value: 'Sample' } });
  fireEvent.change(screen.getByLabelText('Original status'), { target: { value: 'Cancelled' } });
  fireEvent.change(screen.getByLabelText('Deleted from'), { target: { value: '2026-10-01' } });
  await waitFor(() => expect(authFetch).toHaveBeenCalledWith(expect.stringMatching(/search=Sample&status=Cancelled&from=2026-10-01/), expect.anything()));
  fireEvent.change(screen.getByLabelText('Deleted through'), { target: { value: '2026-09-01' } });
  expect(screen.getByRole('alert')).toHaveTextContent('start date');
});
test('restore failure keeps the dialog and record available with a helpful error', async () => {
  mutation = async () => response({ error: 'Restore the related Room record first.' }, false);
  renderPage(); await loaded();
  fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
  const dialog = within(screen.getByRole('dialog'));
  fireEvent.click(dialog.getByRole('button', { name: 'Restore record' }));
  expect(await dialog.findByRole('alert')).toHaveTextContent('related Room');
  expect(screen.getByText('BKG-SAMPLE')).toBeInTheDocument();
});
test('permanent deletion stays disabled until password, reason, and exact reference are provided', async () => {
  renderPage(); await loaded();
  fireEvent.click(screen.getByRole('button', { name: 'Delete Permanently' }));
  const dialog = within(screen.getByRole('dialog'));
  const submit = dialog.getByRole('button', { name: 'Delete Permanently' });
  expect(submit).toBeDisabled();
  fireEvent.change(dialog.getByLabelText(/exact record confirmation/), { target: { value: `bookings:${id}` } });
  fireEvent.change(dialog.getByLabelText('Reason for permanent deletion'), { target: { value: 'Duplicate test entry' } });
  expect(submit).toBeDisabled();
  fireEvent.change(dialog.getByLabelText('Your administrator password'), { target: { value: 'Test-Only9!' } });
  expect(submit).toBeEnabled();
  fireEvent.click(submit);
  await waitFor(() => expect(authFetch).toHaveBeenCalledWith(`/api/archive/bookings/${id}`, expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ password: 'Test-Only9!', confirmation: `bookings:${id}`, reason: 'Duplicate test entry' }) })));
  expect(await screen.findByText('Record permanently deleted. This action was logged.')).toBeInTheDocument();
});
test('double click submits only one restore while saving', async () => {
  let finish;
  mutation = () => new Promise(resolve => { finish = resolve; });
  renderPage(); await loaded();
  fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
  const button = within(screen.getByRole('dialog')).getByRole('button', { name: 'Restore record' });
  fireEvent.click(button); fireEvent.click(button);
  expect(authFetch.mock.calls.filter(([, options]) => options?.method === 'PATCH')).toHaveLength(1);
  finish(response({ success: true }));
  expect(await screen.findByText('Record restored to its original module.')).toBeInTheDocument();
});
