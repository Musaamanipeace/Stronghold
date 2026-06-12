import { Loan, ActivityEvent } from '../types';

/**
 * Escapes a grid value to be fully compliant with RFC 4180 CSV standard.
 */
function escapeCSVValue(val: any): string {
  if (val === null || val === undefined) {
    return '';
  }
  
  let str = String(val);
  
  // If value contains quotes, commas, or newlines, we must escape quotes and wrap in quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  
  return str;
}

/**
 * Download a string content as a local file in the browser
 */
export function downloadBlob(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Convert and download Loans database into a CSV file
 */
export function exportLoansToCSV(loans: Loan[]) {
  const headers = [
    'Loan ID',
    'Companion Name',
    'Amount (BTC)',
    'Amount (KES)',
    'Amount (USD)',
    'Direction',
    'Status',
    'Created Date',
    'Due Date',
    'Reminders Sent',
    'Notes'
  ];

  const rows = loans.map(loan => [
    loan.id,
    loan.name,
    loan.amountBTC,
    loan.amountKES,
    loan.amountUSD,
    loan.direction === 'lending' ? 'Lending (You Lent)' : 'Borrowing (You Borrowed)',
    loan.status,
    loan.createdAt,
    loan.dueDate,
    loan.remindersSent,
    loan.note || ''
  ]);

  // Join headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSVValue).join(','))
  ].join('\r\n');

  // Trigger download with BOM header to support Excel UTF-8 encoding
  const BOM = '\uFEFF';
  downloadBlob(BOM + csvContent, `deni_loans_ledger_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Convert and download Activities database into a CSV file
 */
export function exportActivitiesToCSV(activities: ActivityEvent[]) {
  const headers = [
    'Event ID',
    'Timestamp',
    'Type',
    'Amount (BTC)',
    'Lightning Transaction ID',
    'Loan ID',
    'Loan Name',
    'Direction',
    'Description'
  ];

  const rows = activities.map(act => [
    act.id,
    act.timestamp,
    act.type,
    act.amountBTC !== undefined ? act.amountBTC : '',
    act.txId || '',
    act.loanId,
    act.loanName,
    act.direction === 'lending' ? 'Lending' : 'Borrowing',
    act.description
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSVValue).join(','))
  ].join('\r\n');

  const BOM = '\uFEFF';
  downloadBlob(BOM + csvContent, `deni_transactions_ledger_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}
