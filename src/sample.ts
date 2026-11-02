import type { Plan } from './forecast.ts';

// Fictional, fixed-date fixture. It never represents a connected bank account.
export const samplePlan: Plan = {
  startDate: '2026-11-03',
  endDate: '2026-11-15',
  openingBalancePaise: 640000,
  dailyEssentialsPaise: 15000,
  entries: [
    { id: 'rent', date: '2026-11-05', label: 'Rent contribution', kind: 'expense', amountPaise: 250000 },
    { id: 'travel', date: '2026-11-08', label: 'Planned travel', kind: 'expense', amountPaise: 120000 },
    { id: 'allowance', date: '2026-11-13', label: 'Expected allowance', kind: 'income', amountPaise: 500000 }
  ]
};
