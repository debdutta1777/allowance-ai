import { parseDatedAlert } from './alert-parser.js';
import { rupeesToPaise } from './money.ts';
export const CATEGORIES = ['Food', 'Transport', 'Housing', 'Education', 'Health', 'Shopping', 'Subscriptions', 'Income', 'Refunds', 'Transfers', 'Other'] as const;
export type Category = typeof CATEGORIES[number];
export type Transaction = { id: string; date: string; description: string; amountPaise: number; direction: 'debit' | 'credit' | 'transfer'; reference: string; category: Category };
export type Draft = { id: string; date: string; description: string; amount: string; direction: string; reference: string; category: Category; included: boolean; duplicate: boolean; issue: string };
export const SAMPLE_CSV = `date,description,amount,direction,reference\n2026-10-29,Campus Canteen,180.00,debit,DEMO001\n2026-10-30,Metro commute,80.00,debit,DEMO002\n2026-10-31,Textbook store,450.00,debit,DEMO003\n2026-11-01,Family allowance,5000.00,credit,DEMO004\n2026-11-01,Own savings transfer,1000.00,transfer,DEMO005\n2026-11-02,Refund from bookshop,100.00,credit,DEMO006\n2026-10-29,Campus Canteen,180.00,debit,DEMO001`;
export const SAMPLE_MESSAGES = `2026-10-29 INR 180.00 debited to Campus Canteen ref DEMO001\n2026-10-30 INR 80.00 debited to Metro commute ref DEMO002\n2026-11-01 INR 5000.00 credited from Family allowance ref DEMO004`;
export function validDate(value: string): boolean {
  const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(value) ? Date.parse(`${value}T00:00:00Z`) : NaN;
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0,10) === value;
}
export function suggestCategory(label: string, direction: string): Category {
  if (direction === 'transfer') return 'Transfers';
  if (direction === 'credit') return /refund|reversal/i.test(label) ? 'Refunds' : 'Income';
  const rules: [RegExp, Category][] = [[/canteen|cafe|coffee|food|grocery|swiggy|zomato|restaurant/i,'Food'],[/metro|bus|train|uber|ola|commute|travel/i,'Transport'],[/rent|hostel/i,'Housing'],[/book|college|tuition|course|exam/i,'Education'],[/pharmacy|clinic|hospital|medicine/i,'Health'],[/netflix|spotify|subscription/i,'Subscriptions'],[/shop|clothing|amazon|flipkart/i,'Shopping']];
  return rules.find(([pattern]) => pattern.test(label))?.[1] ?? 'Other';
}
export function csvRows(text: string): string[][] {
  if (text.length > 65536) throw new Error('Use a file or pasted text under 64 KB.');
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false; let closed = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i+1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else field += char;
    } else if (char === '"') {
      if (field || closed) throw new Error('Invalid CSV quote. Use the sample format.');
      quoted = true;
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(field); field = ''; closed = false;
      if (char !== ',') {
        if (row.some(cell => cell.trim())) rows.push(row);
        row = [];
        if (char === '\r' && input[i+1] === '\n') i++;
      }
    } else {
      if (closed) { if (!/\s/.test(char)) throw new Error('Unexpected text after CSV quote.'); }
      else field += char;
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote.');
  row.push(field); if (row.some(cell => cell.trim())) rows.push(row);
  if (rows.length > 201) throw new Error('Import up to 200 transactions at a time.');
  return rows;
}
function normalize(value: string): string { return value.trim().toLowerCase().replace(/\s+/g, ' '); }
export function transactionKey(transaction: Pick<Transaction,'reference'|'date'|'description'|'amountPaise'|'direction'>): string {
  return transaction.reference.trim() ? `ref:${normalize(transaction.reference)}` : `row:${transaction.date}|${normalize(transaction.description)}|${transaction.amountPaise}|${transaction.direction}`;
}
export function validateDraft(draft: Draft): Transaction {
  if (!validDate(draft.date)) throw new Error('Use a valid YYYY-MM-DD date.');
  if (!draft.description.trim() || draft.description.length > 120) throw new Error('Description must contain 1 to 120 characters.');
  if (!['debit','credit','transfer'].includes(draft.direction)) throw new Error('Choose debit, credit or transfer.');
  if (!CATEGORIES.includes(draft.category)) throw new Error('Choose a supported category.');
  if (draft.reference.length > 80) throw new Error('Reference is too long.');
  const amountPaise = rupeesToPaise(draft.amount);
  if (amountPaise === 0) throw new Error('Transaction amount must be greater than zero.');
  return { id:draft.id,date:draft.date,description:draft.description.trim(),amountPaise,direction:draft.direction as Transaction['direction'],reference:draft.reference.trim(),category:draft.direction==='transfer'?'Transfers':draft.category };
}
export function parseImport(text: string, format: 'csv'|'messages', existing: Transaction[] = []): Draft[] {
  if (!text.trim()) throw new Error('Paste transactions or choose a CSV file first.');
  if (text.length > 65536) throw new Error('Use text under 64 KB.');
  let values: {date:string;description:string;amount:string;direction:string;reference:string}[];
  if (format === 'csv') {
    const rows=csvRows(text); const header=rows.shift()?.map(cell=>cell.trim().toLowerCase())??[];
    if (new Set(header).size!==header.length || ['date','description','amount','direction'].some(name=>!header.includes(name))) throw new Error('CSV needs date,description,amount,direction headers. reference is optional.');
    values=rows.map((row,index)=>{
      if(row.length!==header.length) throw new Error(`CSV row ${index+2} has the wrong number of columns.`);
      const get=(key:string)=>(row[header.indexOf(key)]??'').trim();
      return {date:get('date'),description:get('description'),amount:get('amount'),direction:get('direction').toLowerCase(),reference:get('reference')};
    });
  } else {
    const lines=text.split(/\r?\n/).filter(line=>line.trim());
    if(lines.length>200) throw new Error('Import up to 200 messages at a time.');
    values=lines.map((line,index)=>{
      const parsed=parseDatedAlert(line);
      if(!parsed) throw new Error(`Message ${index+1} is unsupported. Use a supported dated debit/credit alert or the sample format; missing dates are never guessed.`);
      return parsed;
    });
  }
  if(!values.length) throw new Error('No transaction rows were found.');
  const keys=new Set(existing.map(transactionKey));
  return values.map((value,index)=>{
    const draft: Draft={...value,id:`import-${index}`,category:suggestCategory(value.description,value.direction),included:true,duplicate:false,issue:''};
    try {
      const key=transactionKey(validateDraft(draft));
      if(keys.has(key)){draft.duplicate=true;draft.included=false;draft.issue='Possible duplicate. Excluded unless you choose to keep it.';}
      keys.add(key);
    } catch(issue){draft.issue=(issue as Error).message;}
    return draft;
  });
}
export function summarizeTransactions(transactions: Transaction[]) {
  let spendingPaise=0,incomePaise=0,refundsPaise=0,transfersPaise=0; const categories:Record<string,number>={};
  for(const transaction of transactions){
    if(transaction.direction==='transfer')transfersPaise+=transaction.amountPaise;
    else if(transaction.direction==='debit'){spendingPaise+=transaction.amountPaise;categories[transaction.category]=(categories[transaction.category]??0)+transaction.amountPaise;}
    else if(transaction.category==='Refunds')refundsPaise+=transaction.amountPaise;
    else incomePaise+=transaction.amountPaise;
    if(![spendingPaise,incomePaise,refundsPaise,transfersPaise,...Object.values(categories)].every(Number.isSafeInteger))throw new Error('Imported total is too large.');
  }
  return {spendingPaise,incomePaise,refundsPaise,transfersPaise,categories};
}
