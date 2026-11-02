import { comparePurchase } from './forecast.ts';
import type { Plan } from './forecast.ts';
export function delayIncome(plan: Plan, days: number): Plan {
  if(!Number.isInteger(days)||days<0||days>30)throw new Error('Income delay must be a whole number from 0 to 30 days.');
  return {...plan,entries:plan.entries.map(entry=>entry.kind==='income'?{...entry,date:new Date(Date.parse(`${entry.date}T00:00:00Z`)+days*86400000).toISOString().slice(0,10)}:{...entry})};
}
export function evidenceFor(plan:Plan,purchase:{date:string;amountPaise:number},days=3){
  const comparison=comparePurchase(plan,purchase);const delayed=comparePurchase(delayIncome(plan,days),purchase);
  return {comparison,delayed,facts:[
    {id:'opening',label:'Opening balance',value:plan.openingBalancePaise,type:'money'},
    {id:'essentials',label:'Daily essentials',value:plan.dailyEssentialsPaise,type:'money'},
    {id:'baseline-min',label:'Lowest balance without purchase',value:comparison.baseline.minimumBalancePaise,type:'money'},
    {id:'purchase',label:'Proposed purchase',value:purchase.amountPaise,type:'money'},
    {id:'purchase-min',label:'Lowest balance with purchase',value:comparison.proposed.minimumBalancePaise,type:'money'},
    {id:'shortfall',label:'First shortfall with purchase',value:comparison.proposed.firstShortfallDate??'None in this period',type:'date'},
    {id:'delayed-min',label:`Lowest balance if income is delayed by ${days} days`,value:delayed.proposed.minimumBalancePaise,type:'money'}]};
}
