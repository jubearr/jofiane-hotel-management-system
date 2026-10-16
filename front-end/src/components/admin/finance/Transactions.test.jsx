import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import Transactions from './Transactions';
import { PortalThemeProvider } from '../../common/ThemePortal';
import { authFetch } from '../../../utils/api';

jest.mock('../../../utils/api', () => ({
  authFetch: jest.fn(),
  readError: async (response, fallback) => (await response.json()).error || fallback,
}));

const response = data => ({ ok: true, json: async () => data });
const transaction = { txn_id: 'TXN-100', datetime: '2026-09-24T10:00:00', guest_name: 'Alex Rivera', room_number: 304, description: 'Room payment', amount: '2,000.00', payment_method: 'Cash', status: 'COMPLETED', booking_object_id: 'booking-1' };
const data = { kpis: { totalIncome: 2000, totalExpenses: 0, netRevenue: 2000, outstanding: 0 }, transactions: [transaction] };
beforeEach(() => {
  authFetch.mockReset();
  authFetch.mockImplementation(async path => path.startsWith('/api/transactions') ? response(data) : response([{ _id: 'booking-1', room_number: '304', guest: { full_name: 'Alex Rivera' } }]));
});

async function openPayment() {
  render(<PortalThemeProvider theme="dark"><Transactions /></PortalThemeProvider>);
  fireEvent.click(await screen.findByRole('button', { name: /record payment/i }));
  return within(screen.getByRole('dialog', { name: 'Record Payment' }));
}
function fillPayment(dialog) {
  fireEvent.change(dialog.getByLabelText(/guest name/i), { target: { value: 'Alex Rivera' } });
  fireEvent.change(dialog.getByLabelText(/room number/i), { target: { value: '304' } });
  fireEvent.change(dialog.getByLabelText(/description/i), { target: { value: 'Room payment' } });
  fireEvent.change(dialog.getByLabelText(/amount/i), { target: { value: '1500.50' } });
}

test('payment requires guest, room, description, and a positive amount', async () => {
  const dialog = await openPayment();
  const submit = dialog.getByRole('button', { name: 'Record Payment' });
  expect(submit).toBeDisabled();
  fillPayment(dialog);
  expect(submit).toBeEnabled();
  fireEvent.change(dialog.getByLabelText(/amount/i), { target: { value: '0' } });
  expect(submit).toBeDisabled();
  expect(dialog.getByLabelText(/amount/i)).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('dialog').closest('.portal-theme')).toHaveClass('theme-dark');
});

test('failed payment keeps the draft, surfaces the error, and blocks duplicate submissions', async () => {
  let finish;
  const dialog = await openPayment();
  fillPayment(dialog);
  authFetch.mockImplementation(path => path.startsWith('/api/bookings?') ? Promise.resolve(response([{ _id: 'booking-1', room_number: '304', guest: { full_name: 'Alex Rivera' } }])) : new Promise(resolve => { finish = resolve; }));
  fireEvent.click(dialog.getByRole('button', { name: 'Record Payment' }));
  await waitFor(() => expect(finish).toBeDefined());
  expect(dialog.getByRole('button', { name: /recording/i })).toBeDisabled();
  expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  fireEvent.submit(dialog.getByLabelText(/guest name/i).closest('form'));
  expect(authFetch.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1);
  await act(async () => finish({ ok: false, json: async () => ({ error: 'Payment service unavailable' }) }));
  expect(dialog.getByRole('alert')).toHaveTextContent('Payment service unavailable');
  expect(dialog.getByLabelText(/guest name/i)).toHaveValue('Alex Rivera');
  expect(dialog.getByRole('button', { name: 'Record Payment' })).toBeEnabled();
});

test('payment is not posted when the guest does not match the checked-in room', async () => {
  const dialog = await openPayment();
  fillPayment(dialog);
  fireEvent.change(dialog.getByLabelText(/guest name/i), { target: { value: 'Wrong Guest' } });
  fireEvent.click(dialog.getByRole('button', { name: 'Record Payment' }));
  expect(await dialog.findByRole('alert')).toHaveTextContent('does not match');
  expect(authFetch.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
});

test('transaction reference opens full metadata; refund amount and reason are validated', async () => {
  render(<Transactions />);
  fireEvent.click(await screen.findByRole('button', { name: 'TXN-100' }));
  const detail = within(screen.getByRole('dialog', { name: 'Transaction Details' }));
  expect(detail.getByText('₱2,000.00')).toBeInTheDocument();
  expect(detail.getByText('Alex Rivera')).toBeInTheDocument();
  fireEvent.click(detail.getByRole('button', { name: /issue refund/i }));
  const refund = within(screen.getByRole('dialog', { name: 'Issue Refund' }));
  expect(refund.getByRole('button', { name: 'Issue Refund' })).toBeDisabled();
  fireEvent.change(refund.getByLabelText(/reason/i), { target: { value: 'Overcharge correction' } });
  expect(refund.getByRole('button', { name: 'Issue Refund' })).toBeEnabled();
  fireEvent.change(refund.getByLabelText(/refund amount/i), { target: { value: '2001' } });
  expect(refund.getByRole('button', { name: 'Issue Refund' })).toBeDisabled();
  fireEvent.change(refund.getByLabelText(/refund amount/i), { target: { value: '0' } });
  expect(refund.getByRole('button', { name: 'Issue Refund' })).toBeDisabled();
});

test('void requires a separate confirmation and cancelling never calls the API', async () => {
  render(<Transactions />);
  fireEvent.click(await screen.findByRole('button', { name: 'TXN-100' }));
  fireEvent.click(screen.getByRole('button', { name: /void transaction/i }));
  const confirmation = within(screen.getByRole('dialog', { name: 'Void transaction?' }));
  expect(confirmation.getByText(/cannot be undone/i)).toBeInTheDocument();
  fireEvent.click(confirmation.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByRole('dialog', { name: 'Transaction Details' })).toBeInTheDocument();
  expect(authFetch.mock.calls.some(([, options]) => options?.method === 'PATCH')).toBe(false);
});

test('search trims whitespace and handles numeric API room numbers', async () => {
  render(<Transactions />);
  await screen.findByRole('button', { name: 'TXN-100' });
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search transactions' }), { target: { value: ' 304 ' } });
  expect(screen.getByRole('button', { name: 'TXN-100' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Payment method filter'), { target: { value: 'bank-transfer' } });
  expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
});
