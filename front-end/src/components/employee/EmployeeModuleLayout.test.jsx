import { render, screen } from '@testing-library/react';
import GuestRequests from './GuestRequests';
import LostAndFound from './LostAndFound';
import HousekeepingLogs from './HousekeepingLogs';
import { authFetch } from '../../utils/api';

jest.mock('../../utils/api', () => ({ authFetch: jest.fn(), readError: jest.fn() }));

beforeEach(() => {
  authFetch.mockReset();
  authFetch.mockResolvedValue({ ok: true, json: async () => [] });
});

test.each([
  ['guest requests', GuestRequests],
  ['lost and found', LostAndFound],
  ['housekeeping logs', HousekeepingLogs],
])('%s uses its portal layout without nesting another main container', async (_, Module) => {
  const view = render(<main className="main-content employee-content"><Module isLead employee={{ name: 'Test Staff' }} /></main>);
  expect(screen.getAllByRole('main')).toHaveLength(1);
  expect(view.container.querySelectorAll('.main-content')).toHaveLength(1);
  await screen.findByRole('heading', { level: 2 });
});
