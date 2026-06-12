export type LoanStatus = 'pending' | 'active' | 'overdue' | 'settled';

export type LoanDirection = 'lending' | 'borrowing';

export interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'creation' | 'reminder' | 'payment_partial' | 'settlement_initiated' | 'settled';
}

export interface Loan {
  id: string;
  name: string;
  amountBTC: number;
  amountKES: number;
  amountUSD: number; // Support multiple currency views for premium demo realism
  direction: LoanDirection;
  status: LoanStatus;
  dueDate: string;
  createdAt: string;
  note?: string;
  timeline: TimelineEntry[];
  remindersSent: number;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  description: string;
  amountBTC?: number;
  txId?: string;
  type: 'create' | 'settle' | 'reminder' | 'partial_pay';
  loanId: string;
  loanName: string;
  direction: LoanDirection;
}

export interface LightningInvoice {
  invoice: string;
  amount: string;
  createdAt: string;
  expiresAt: string;
  paymentHash: string;
}
