import { exportToCSV, printReportDocument } from './exportUtils';

describe('exportUtils', () => {
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let clickSpy;

  beforeEach(() => {
    originalCreateObjectURL = window.URL.createObjectURL;
    originalRevokeObjectURL = window.URL.revokeObjectURL;
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = jest.fn();

    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  describe('exportToCSV', () => {
    test('alerts if no rows provided', () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      exportToCSV([], [{ header: 'ID', key: 'id' }], 'test');
      expect(alertMock).toHaveBeenCalledWith('No data available to export with current filters.');
      expect(clickSpy).not.toHaveBeenCalled();
    });

    test('generates CSV and triggers download', () => {
      const rows = [
        { id: 'TXN-1', guest: 'John Doe, Jr.', amount: 5000 },
        { id: 'TXN-2', guest: 'Jane "VIP" Smith', amount: 8500 },
      ];
      const columns = [
        { header: 'Transaction ID', key: 'id' },
        { header: 'Guest', key: 'guest' },
        { header: 'Amount', accessor: r => `₱${r.amount}` },
      ];

      exportToCSV(rows, columns, 'test-transactions');

      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('printReportDocument', () => {
    test('alerts if no rows provided', () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      printReportDocument({ title: 'Test', rows: [] });
      expect(alertMock).toHaveBeenCalledWith('No data available to print with current filters.');
    });

    test('opens print window and renders document', () => {
      const openMock = jest.spyOn(window, 'open').mockReturnValue({
        document: {
          open: jest.fn(),
          write: jest.fn(),
          close: jest.fn(),
        },
      });

      const rows = [{ id: '1', name: 'Ana' }];
      const columns = [{ header: 'ID', key: 'id' }, { header: 'Name', key: 'name' }];

      printReportDocument({
        title: 'Staff Report',
        columns,
        rows,
        meta: [{ label: 'Department', value: 'Front Desk' }],
        kpis: [{ label: 'Total', value: '1' }],
      });

      expect(openMock).toHaveBeenCalled();
    });
  });
});
