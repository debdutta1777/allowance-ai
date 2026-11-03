import type { Metadata } from 'next';
import './service.css';
export const metadata: Metadata = { title: 'Allowance | Personal finance workspace', description: 'A personal workspace for budgeting, investment scenarios, historical market analysis, tax estimates, payment safety and business cash flow.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en-IN"><body>{children}</body></html>; }
