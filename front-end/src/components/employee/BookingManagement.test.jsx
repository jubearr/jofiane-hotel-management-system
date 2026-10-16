import { fireEvent, render, screen, within } from '@testing-library/react';
import BookingManagement from './BookingManagement';
import { authFetch } from '../../utils/api';
import { todayISO } from '../../utils/dateUtils';

jest.mock('../../utils/api', () => ({ authFetch: jest.fn() }));
const bookings = [
  { _id: '1', booking_id: 'BKG-100', guest: { full_name: 'Alex Rivera' }, room_number: 304, dates: { check_in: todayISO(), check_out: '2027-01-01', nights: '1' }, billing: { expected_total: 2000, balance_due: '500.00', total_paid: '1,500.00' }, status: 'Confirmed', source: 'Walk-in' },
  { _id: '2', booking_id: 'BKG-200', guest: { full_name: 'Jamie Cruz' }, room_number: '118', dates: { check_in: '2020-01-01', check_out: '2020-01-02', nights: '1' }, billing: { expected_total: '5,800.00', balance_due: '0', total_paid: '5,800.00' }, status: 'Checked Out', source: 'Walk-in' },
];
beforeEach(() => { authFetch.mockReset(); authFetch.mockResolvedValue({ ok: true, json: async () => bookings }); });

test('shows skeletons while loading and one initial request, then an accurate all-date summary', async () => {
  render(<BookingManagement />);
  expect(screen.getByRole('status', { name: 'Loading reservation summary' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'BKG-100' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'BKG-200' })).not.toBeInTheDocument();
  expect(screen.getByText('₱7,800.00')).toBeInTheDocument();
  expect(authFetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
});

test('filters reservations by date scope, trimmed search, room and status', async () => {
  render(<BookingManagement />);
  await screen.findByRole('button', { name: 'BKG-100' });
  fireEvent.click(screen.getByRole('button', { name: 'All dates' }));
  expect(screen.getByRole('button', { name: 'BKG-200' })).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search reservations' }), { target: { value: ' 304 ' } });
  expect(screen.getByRole('button', { name: 'BKG-100' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'BKG-200' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Reservation status'), { target: { value: 'Checked Out' } });
  expect(screen.getByText('No matching reservations')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByRole('button', { name: 'BKG-200' })).toBeInTheDocument();
});

test('invalid date range is explained inline and walk-in submission waits for valid fields', async () => {
  render(<BookingManagement />);
  await screen.findByRole('button', { name: 'BKG-100' });
  fireEvent.change(screen.getByLabelText('Check-in from'), { target: { value: '2026-10-10' } });
  fireEvent.change(screen.getByLabelText('Check-in to'), { target: { value: '2026-10-09' } });
  expect(screen.getByLabelText('Check-in to')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText('Check your date range')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'New Walk-In' }));
  const dialog = within(screen.getByRole('dialog', { name: 'New Walk-In' }));
  expect(dialog.getByRole('button', { name: 'Register Walk-In' })).toBeDisabled();
});
