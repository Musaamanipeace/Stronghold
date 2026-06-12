import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Loan, ActivityEvent, LoanStatus, LoanDirection, TimelineEntry, LightningInvoice } from '../types';

interface LendingContextProps {
  loans: Loan[];
  activities: ActivityEvent[];
  createLoan: (loanData: {
    name: string;
    amountBTC: number;
    amountKES: number;
    direction: LoanDirection;
    note?: string;
    dueDate: string;
    status: LoanStatus;
  }) => string;
  settleLoan: (id: string, simulateDelay?: boolean, onComplete?: () => void) => void;
  sendReminder: (id: string) => void;
  currentRates: {
    USD_PER_BTC: number;
    KES_PER_BTC: number;
  };
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const LendingContext = createContext<LendingContextProps | undefined>(undefined);

// Rates: 1 BTC = $66,666 = ~9,000,000 KES (or standard conversions requested: total owed $280 approx 0.0042 btc)
// Let's use clean fixed rates for consistency: 
// 1 BTC = 66,666.67 USD
// 1 BTC = 10,000,000 KES (1 KES = 0.0000001 BTC or 10 Sats)
const CURRENT_RATES = {
  USD_PER_BTC: 66666.67,
  KES_PER_BTC: 10000000,
};

const INITIAL_LOANS: Loan[] = [
  {
    id: 'loan-1',
    name: 'Grace Wanjiku',
    amountBTC: 0.0018,
    amountKES: 18000,
    amountUSD: 120,
    direction: 'lending',
    status: 'overdue',
    dueDate: '2026-06-08',
    createdAt: '2026-05-08',
    note: 'Group savings (Chama) contribution payout balance.',
    remindersSent: 1,
    timeline: [
      {
        id: 't-1-1',
        title: 'Loan Created',
        description: 'Agreement signed and funds transferred to Grace Wanjiku.',
        timestamp: '2026-05-08 14:32',
        type: 'creation',
      },
      {
        id: 't-1-2',
        title: 'First Reminder Sent',
        description: 'In-app notification sent regarding upcoming due date.',
        timestamp: '2026-06-06 09:15',
        type: 'reminder',
      },
    ],
  },
  {
    id: 'loan-2',
    name: 'Brian Otieno',
    amountBTC: 0.0012,
    amountKES: 12000,
    amountUSD: 80,
    direction: 'lending',
    status: 'active',
    dueDate: '2026-06-25',
    createdAt: '2026-05-25',
    note: 'Short term credit for high-speed internet installation.',
    remindersSent: 0,
    timeline: [
      {
        id: 't-2-1',
        title: 'Loan Created',
        description: 'Lent 0.0012 BTC for home workspace internet setup.',
        timestamp: '2026-05-25 11:05',
        type: 'creation',
      },
    ],
  },
  {
    id: 'loan-3',
    name: 'Sipho Ndlovu',
    amountBTC: 0.0008,
    amountKES: 8000,
    amountUSD: 53.33,
    direction: 'lending',
    status: 'pending',
    dueDate: '2026-07-01',
    createdAt: '2026-06-10',
    note: 'Funding for solar lamp starter kit purchase.',
    remindersSent: 0,
    timeline: [
      {
        id: 't-3-1',
        title: 'Loan Initiated',
        description: 'Pending Lightning receipt confirm for 0.0008 BTC.',
        timestamp: '2026-06-10 16:40',
        type: 'creation',
      },
    ],
  },
  {
    id: 'loan-4',
    name: 'Amina Hassan',
    amountBTC: 0.0008,
    amountKES: 8000,
    amountUSD: 53.33,
    direction: 'borrowing',
    status: 'overdue',
    dueDate: '2026-06-05',
    createdAt: '2026-05-05',
    note: 'Seed funds for vegetable market stall inventory in Nairobi.',
    remindersSent: 2,
    timeline: [
      {
        id: 't-4-1',
        title: 'Loan Borrowed',
        description: 'Received seed funds from Amina.',
        timestamp: '2026-05-05 08:30',
        type: 'creation',
      },
      {
        id: 't-4-2',
        title: 'Reminder Received',
        description: 'Amina sent a friendly nudge via WhatsApp callback link.',
        timestamp: '2026-06-04 18:10',
        type: 'reminder',
      },
    ],
  },
  {
    id: 'loan-5',
    name: 'David Mwangi',
    amountBTC: 0.0010,
    amountKES: 10000,
    amountUSD: 66.67,
    direction: 'borrowing',
    status: 'active',
    dueDate: '2026-07-07',
    createdAt: '2026-06-01',
    note: 'Borrowed to cover emergency motorcycle maintenance fees.',
    remindersSent: 0,
    timeline: [
      {
        id: 't-5-1',
        title: 'Loan Received',
        description: 'Received 0.0010 BTC from David with thanks.',
        timestamp: '2026-06-01 10:20',
        type: 'creation',
      },
    ],
  },
  {
    id: 'loan-6',
    name: 'Fatuma Ali',
    amountBTC: 0.0015,
    amountKES: 15000,
    amountUSD: 100,
    direction: 'lending',
    status: 'settled',
    dueDate: '2026-06-11',
    createdAt: '2026-05-11',
    note: 'Repayment of water tank repair loan.',
    remindersSent: 1,
    timeline: [
      {
        id: 't-6-1',
        title: 'Loan Created',
        description: 'Lent 0.0015 BTC to Fatuma.',
        timestamp: '2026-05-11 15:00',
        type: 'creation',
      },
      {
        id: 't-6-2',
        title: 'Reminder Sent',
        description: 'Automatic system notice on 2026-06-09.',
        timestamp: '2026-06-09 12:00',
        type: 'reminder',
      },
      {
        id: 't-6-3',
        title: 'Lightning Settle Initiated',
        description: 'Drafted Bitcoin Lightning settlement invoice.',
        timestamp: '2026-06-11 17:30',
        type: 'settlement_initiated',
      },
      {
        id: 't-6-4',
        title: 'Loan Settled',
        description: 'Received full payment of 0.0015 BTC on Lightning Network.',
        timestamp: '2026-06-11 17:33',
        type: 'settled',
      },
    ],
  },
];

const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    timestamp: '2026-06-11 17:33',
    description: 'Received lighting payment of 0.0015 BTC from Fatuma Ali. Loan settled.',
    amountBTC: 0.0015,
    txId: 'tx_7af3e9d2c11',
    type: 'settle',
    loanId: 'loan-6',
    loanName: 'Fatuma Ali',
    direction: 'lending',
  },
  {
    id: 'act-2',
    timestamp: '2026-06-10 16:40',
    description: 'Created active pending loan request of 0.0008 BTC to Sipho Ndlovu.',
    amountBTC: 0.0008,
    txId: 'tx_e4da1b8c2d9',
    type: 'create',
    loanId: 'loan-3',
    loanName: 'Sipho Ndlovu',
    direction: 'lending',
  },
  {
    id: 'act-3',
    timestamp: '2026-06-09 12:00',
    description: 'Sent standard friendly balance reminder to Fatuma Ali.',
    type: 'reminder',
    loanId: 'loan-6',
    loanName: 'Fatuma Ali',
    direction: 'lending',
  },
  {
    id: 'act-4',
    timestamp: '2026-06-06 09:15',
    description: 'Sent alert due reminder to Grace Wanjiku.',
    type: 'reminder',
    loanId: 'loan-1',
    loanName: 'Grace Wanjiku',
    direction: 'lending',
  },
  {
    id: 'act-5',
    timestamp: '2026-06-01 10:20',
    description: 'Borrowed 0.0010 BTC from David Mwangi for emergency repairs.',
    amountBTC: 0.0010,
    txId: 'tx_8fa291b3cd4',
    type: 'create',
    loanId: 'loan-5',
    loanName: 'David Mwangi',
    direction: 'borrowing',
  },
];

export const LendingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITIES);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('deni-theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('deni-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const formatNow = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const createLoan = (loanData: {
    name: string;
    amountBTC: number;
    amountKES: number;
    direction: LoanDirection;
    note?: string;
    dueDate: string;
    status: LoanStatus;
  }) => {
    const id = `loan-${Date.now()}`;
    const now = formatNow();
    const usd = loanData.amountBTC * CURRENT_RATES.USD_PER_BTC;
    const txId = 'tx_' + Math.random().toString(36).substring(2, 13);

    const newTimeline: TimelineEntry[] = [
      {
        id: `t-${id}-1`,
        title: loanData.direction === 'lending' ? 'Loan Created' : 'Loan Borrowed',
        description: loanData.direction === 'lending' 
          ? `Lent ${loanData.amountBTC} BTC (~Sh${loanData.amountKES.toLocaleString()}) to ${loanData.name}.`
          : `Borrowed ${loanData.amountBTC} BTC (~Sh${loanData.amountKES.toLocaleString()}) from ${loanData.name}.`,
        timestamp: now,
        type: 'creation',
      },
    ];

    const newLoan: Loan = {
      id,
      name: loanData.name,
      amountBTC: loanData.amountBTC,
      amountKES: loanData.amountKES,
      amountUSD: Number(usd.toFixed(2)),
      direction: loanData.direction,
      status: loanData.status,
      dueDate: loanData.dueDate,
      createdAt: now.split(' ')[0],
      note: loanData.note,
      timeline: newTimeline,
      remindersSent: 0,
    };

    setLoans((prev) => [newLoan, ...prev]);

    const newActivity: ActivityEvent = {
      id: `act-${Date.now()}`,
      timestamp: now,
      description: loanData.direction === 'lending'
        ? `Lent ${loanData.amountBTC} BTC to ${loanData.name}.`
        : `Borrowed ${loanData.amountBTC} BTC from ${loanData.name}.`,
      amountBTC: loanData.amountBTC,
      txId,
      type: 'create',
      loanId: id,
      loanName: loanData.name,
      direction: loanData.direction,
    };

    setActivities((prev) => [newActivity, ...prev]);

    return id;
  };

  const settleLoan = (id: string, simulateDelay = false, onComplete?: () => void) => {
    const now = formatNow();
    const txId = 'tx_' + Math.random().toString(36).substring(2, 13);

    const performSettlement = () => {
      setLoans((prev) =>
        prev.map((loan) => {
          if (loan.id === id) {
            // Appends settled timelines
            const updatedTimeline = [
              ...loan.timeline,
              {
                id: `t-settle-${Date.now()}-1`,
                title: 'Lightning Settle Initiated',
                description: 'Prepared Lightning invoice for fast settlement clearance.',
                timestamp: formatNow(),
                type: 'settlement_initiated' as const,
              },
              {
                id: `t-settle-${Date.now()}-2`,
                title: 'Loan Settled',
                description: `Successfully cleared debt of ${loan.amountBTC} BTC via Lightning.`,
                timestamp: formatNow(),
                type: 'settled' as const,
              },
            ];

            return {
              ...loan,
              status: 'settled' as const,
              timeline: updatedTimeline,
            };
          }
          return loan;
        })
      );

      // Find the loan name/amount for the activity log
      const targetLoan = loans.find((l) => l.id === id);
      if (targetLoan) {
        const activityDesc = targetLoan.direction === 'lending'
          ? `Received full settlement of ${targetLoan.amountBTC} BTC from ${targetLoan.name} via Lightning Node.`
          : `Paid off full loan of ${targetLoan.amountBTC} BTC to ${targetLoan.name} via outbound Lightning invoice.`;

        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          timestamp: formatNow(),
          description: activityDesc,
          amountBTC: targetLoan.amountBTC,
          txId,
          type: 'settle',
          loanId: targetLoan.id,
          loanName: targetLoan.name,
          direction: targetLoan.direction,
        };
        setActivities((prev) => [newActivity, ...prev]);
      }

      if (onComplete) onComplete();
    };

    if (simulateDelay) {
      setTimeout(() => {
        performSettlement();
      }, 3000);
    } else {
      performSettlement();
    }
  };

  const sendReminder = (id: string) => {
    const now = formatNow();
    setLoans((prev) =>
      prev.map((loan) => {
        if (loan.id === id) {
          const updatedTimeline = [
            ...loan.timeline,
            {
              id: `t-remind-${Date.now()}`,
              title: 'Reminder Dispatched',
              description: `Sent visual reminder nudge. Total alerts: ${loan.remindersSent + 1}`,
              timestamp: now,
              type: 'reminder' as const,
            },
          ];
          return {
            ...loan,
            remindersSent: loan.remindersSent + 1,
            timeline: updatedTimeline,
          };
        }
        return loan;
      })
    );

    const targetLoan = loans.find((l) => l.id === id);
    if (targetLoan) {
      const isLending = targetLoan.direction === 'lending';
      const description = isLending 
        ? `Sent smart ledger warning reminder to ${targetLoan.name} to settle balance.`
        : `Acknowledged notification alert from lender ${targetLoan.name}.`;

      const newActivity: ActivityEvent = {
        id: `act-${Date.now()}`,
        timestamp: now,
        description,
        type: 'reminder',
        loanId: id,
        loanName: targetLoan.name,
        direction: targetLoan.direction,
      };
      setActivities((prev) => [newActivity, ...prev]);
    }
  };

  return (
    <LendingContext.Provider value={{ loans, activities, createLoan, settleLoan, sendReminder, currentRates: CURRENT_RATES, theme, toggleTheme }}>
      {children}
    </LendingContext.Provider>
  );
};

export const useLending = () => {
  const context = useContext(LendingContext);
  if (context === undefined) {
    throw new Error('useLending must be used within a LendingProvider');
  }
  return context;
};
