import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Allowance | Student cash-flow planner', description: 'Understand spending, plan essentials and compare a purchase before your next allowance.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en-IN"><body>{children}</body></html>; }
