'use client';
import {Dashboard,Planner,Transactions,Budgets} from './budget-pages';
import {Investing,Markets,Tax,Safety,Business,Settings} from './finance-pages';
export function PageContent({section}:{section:string}){switch(section){case 'dashboard':return <Dashboard/>;case 'planner':return <Planner/>;case 'transactions':return <Transactions/>;case 'budgets':return <Budgets/>;case 'investing':return <Investing/>;case 'markets':return <Markets/>;case 'tax':return <Tax/>;case 'safety':return <Safety/>;case 'business':return <Business/>;case 'settings':return <Settings/>;default:return null;}}
