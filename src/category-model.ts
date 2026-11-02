import type { Category } from './imports.ts';

// Authored synthetic examples, not real customer data. Direction overrides are rules;
// debit merchant classification uses multinomial Naive Bayes with Laplace smoothing.
export const TRAINING_DATA: readonly (readonly [Category,string])[] = [
  ['Food','campus canteen lunch'],['Food','cafe coffee breakfast'],['Food','grocery supermarket vegetables'],['Food','restaurant dinner meal'],['Food','swiggy food delivery'],['Food','zomato snack pizza'],['Food','bakery bread milk'],['Food','mess dining food'],
  ['Transport','metro commute ticket'],['Transport','bus student pass'],['Transport','railway train ticket'],['Transport','uber taxi ride'],['Transport','ola cab fare'],['Transport','petrol fuel travel'],['Transport','auto rickshaw trip'],['Transport','bike transport commute'],
  ['Housing','monthly hostel rent'],['Housing','apartment accommodation rent'],['Housing','electricity utility bill'],['Housing','water utility payment'],['Housing','landlord room deposit'],['Housing','hostel maintenance charge'],['Housing','room accommodation fee'],['Housing','cooking gas utility'],
  ['Education','textbook college bookshop'],['Education','tuition course fee'],['Education','exam registration fee'],['Education','library books stationery'],['Education','online learning course'],['Education','university semester tuition'],['Education','notebook pen supplies'],['Education','training workshop education'],
  ['Health','pharmacy medicine prescription'],['Health','clinic doctor consultation'],['Health','hospital medical treatment'],['Health','dental dentist appointment'],['Health','medical laboratory test'],['Health','chemist health supplies'],['Health','eye optician glasses'],['Health','medicine healthcare bill'],
  ['Shopping','clothing apparel store'],['Shopping','amazon electronics order'],['Shopping','flipkart shopping purchase'],['Shopping','shoes footwear shop'],['Shopping','fashion shirt trousers'],['Shopping','headphones gadget electronics'],['Shopping','backpack bag retail'],['Shopping','retail clothing purchase'],
  ['Subscriptions','netflix monthly subscription'],['Subscriptions','spotify music premium'],['Subscriptions','youtube premium streaming'],['Subscriptions','software subscription renewal'],['Subscriptions','cloud storage membership'],['Subscriptions','prime video streaming'],['Subscriptions','mobile data recharge'],['Subscriptions','internet broadband monthly']
];

const stopwords=new Set(['payment','paid','transaction','charge','purchase','order','monthly','student','campus','fee','bill','store','shop','supplies']);
const tokens=(value:string)=>(value.toLowerCase().match(/[a-z]{2,}/g)??[]).filter(token=>!stopwords.has(token));
const vocabulary=new Set(TRAINING_DATA.flatMap(([,text])=>tokens(text)));
const classes=[...new Set(TRAINING_DATA.map(([category])=>category))];
const counts=new Map<Category,Map<string,number>>();const totals=new Map<Category,number>();
for(const [category,text] of TRAINING_DATA){
  if(!counts.has(category))counts.set(category,new Map());
  for(const token of tokens(text)){const bucket=counts.get(category)!;bucket.set(token,(bucket.get(token)??0)+1);totals.set(category,(totals.get(category)??0)+1);}
}
export function predictCategory(description:string,direction:string):{category:Category;confidence:'high'|'low';source:'local-ml'|'direction-rule';tokensUsed:string[]}{
  if(direction==='transfer')return {category:'Transfers',confidence:'high',source:'direction-rule',tokensUsed:[]};
  if(direction==='credit')return {category:/refund|reversal/i.test(description)?'Refunds':'Income',confidence:'high',source:'direction-rule',tokensUsed:[]};
  const known=tokens(description).filter(token=>vocabulary.has(token));
  if(!known.length)return {category:'Other',confidence:'low',source:'local-ml',tokensUsed:[]};
  const scores=classes.map(category=>({category,score:known.reduce((sum,token)=>sum+Math.log(((counts.get(category)?.get(token)??0)+1)/((totals.get(category)??0)+vocabulary.size)),0)})).sort((a,b)=>b.score-a.score);
  const gap=scores[0].score-scores[1].score;
  return {category:scores[0].category,confidence:gap>=1?'high':'low',source:'local-ml',tokensUsed:[...new Set(known)]};
}
