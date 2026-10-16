/**
 * Jo Fiane Hotel Management System — Export & Reporting Utilities
 * 
 * Provides client-side, zero-dependency CSV generation and formatted
 * printable PDF reports with luxury brand styling.
 */

// Format individual cells for CSV compliance (handles quotes, commas, newlines)
function formatCSVCell(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Escape internal double quotes by doubling them
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Download an array of objects or rows as a CSV file.
 * 
 * @param {Array<Object>} rows - Data objects to export
 * @param {Array<{ header: string, key?: string, accessor?: Function }>} columns - Column definitions
 * @param {string} filename - Output filename (e.g. 'jofiane-transactions')
 */
export function exportToCSV(rows = [], columns = [], filename = 'export') {
  if (!rows || rows.length === 0) {
    alert('No data available to export with current filters.');
    return;
  }

  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  // Build header row
  const headerRow = columns.map(c => formatCSVCell(c.header)).join(',');

  // Build data rows
  const dataRows = rows.map(row => {
    return columns.map(col => {
      let val;
      if (typeof col.accessor === 'function') {
        val = col.accessor(row);
      } else if (col.key) {
        val = row[col.key];
      } else {
        val = '';
      }
      return formatCSVCell(val);
    }).join(',');
  });

  // Prepend UTF-8 Byte Order Mark (BOM) so Microsoft Excel opens special characters (₱, etc.) correctly
  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Trigger browser download via temporary anchor element
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Print or Save as PDF a formatted luxury report document.
 * Opens a clean printable window with hotel branding, KPIs, and styled tables.
 * 
 * @param {Object} options
 * @param {string} options.title - Report title (e.g. 'Transaction History')
 * @param {string} options.subtitle - Optional subtitle
 * @param {Array<{ label: string, value: string }>} options.meta - Metadata badges (e.g. Period, Filter)
 * @param {Array<{ label: string, value: string, sub?: string }>} options.kpis - KPI metric summaries
 * @param {Array<{ header: string, key?: string, accessor?: Function, align?: string }>} options.columns - Table headers
 * @param {Array<Object>} options.rows - Table rows
 * @param {'portrait'|'landscape'} options.orientation - Page orientation
 */
export function printReportDocument({
  title = 'Report',
  subtitle = '',
  meta = [],
  kpis = [],
  columns = [],
  rows = [],
  orientation = 'portrait',
}) {
  if (!rows || rows.length === 0) {
    alert('No data available to print with current filters.');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=980,height=750');
  if (!printWindow) {
    // Popup was blocked by browser, fallback to standard window.print()
    window.print();
    return;
  }

  const now = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const kpisHtml = kpis.length > 0 ? `
    <div class="kpi-grid">
      ${kpis.map(k => `
        <div class="kpi-card">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value">${k.value}</div>
          ${k.sub ? `<div class="kpi-sub">${k.sub}</div>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  const metaHtml = meta.length > 0 ? `
    <div class="meta-row">
      ${meta.map(m => `<span><strong>${m.label}:</strong> ${m.value}</span>`).join(' &nbsp;·&nbsp; ')}
    </div>
  ` : '';

  const tableHeaders = columns.map(c => `<th>${c.header}</th>`).join('');
  const tableRows = rows.map((r) => {
    const cells = columns.map(c => {
      const val = typeof c.accessor === 'function' ? c.accessor(r) : (r[c.key] ?? '');
      const align = c.align ? `style="text-align: ${c.align};"` : '';
      return `<td ${align}>${val}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} · Jo Fiane Hotel</title>
  <style>
    @page {
      size: A4 ${orientation};
      margin: 14mm 12mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e1e1e;
      background: #fff;
      padding: 24px;
      font-size: 11px;
      line-height: 1.4;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #C9A84C;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 1.2px;
      color: #1a140e;
      text-transform: uppercase;
      font-family: Georgia, serif;
    }
    .brand-subtitle {
      font-size: 10px;
      color: #8a7a60;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .report-title-block {
      text-align: right;
    }
    .report-title {
      font-size: 16px;
      font-weight: 700;
      color: #2b231a;
    }
    .report-subtitle {
      font-size: 11px;
      color: #666;
      margin-top: 2px;
    }
    .report-date {
      font-size: 10px;
      color: #888;
      margin-top: 3px;
    }
    .meta-row {
      margin-bottom: 14px;
      font-size: 11px;
      color: #555;
      padding: 6px 10px;
      background: #faf8f5;
      border-radius: 4px;
      border: 1px solid #ede7dc;
    }
    .kpi-grid {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .kpi-card {
      flex: 1;
      min-width: 120px;
      padding: 8px 12px;
      border: 1px solid #e5dec9;
      border-radius: 6px;
      background: #faf8f5;
    }
    .kpi-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 600;
      color: #8c764f;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 16px;
      font-weight: 700;
      color: #1a140e;
      margin-top: 2px;
    }
    .kpi-sub {
      font-size: 9px;
      color: #888;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 10.5px;
    }
    th {
      background: #f4efe4;
      color: #4a3b2c;
      font-weight: 700;
      text-align: left;
      padding: 7px 8px;
      border-bottom: 2px solid #C9A84C;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 7px 8px;
      border-bottom: 1px solid #eee;
      color: #222;
    }
    tr:nth-child(even) td {
      background: #fdfcf9;
    }
    .footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #888;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div>
      <div class="brand-title">Jo Fiane Hotel</div>
      <div class="brand-subtitle">Luxury Resort & Hospitality System</div>
    </div>
    <div class="report-title-block">
      <h1 class="report-title">${title}</h1>
      ${subtitle ? `<div class="report-subtitle">${subtitle}</div>` : ''}
      <div class="report-date">Generated: ${now}</div>
    </div>
  </div>

  ${metaHtml}
  ${kpisHtml}

  <table>
    <thead>
      <tr>${tableHeaders}</tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    <span>Jo Fiane Hotel Management System · Confidential</span>
    <span>Total records: ${rows.length}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
