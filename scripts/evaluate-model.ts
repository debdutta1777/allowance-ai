import { predictCategory,TRAINING_DATA } from '../src/category-model.ts';
import { writeFile,mkdir } from 'node:fs/promises';
import type { Category } from '../src/imports.ts';
const cases:[string,Category][]=[
  ['College canteen breakfast','Food'],['Weekend grocery delivery','Food'],['Bakery evening snack','Food'],
  ['City metro pass','Transport'],['Taxi station trip','Transport'],['Railway commute','Transport'],
  ['Student room rent','Housing'],['Hostel water bill','Housing'],['Accommodation deposit','Housing'],
  ['Semester textbook purchase','Education'],['University exam registration','Education'],['Library stationery supplies','Education'],
  ['Pharmacy consultation','Health'],['Dentist medical appointment','Health'],['Chemist prescription','Health'],
  ['Retail shoes order','Shopping'],['Gadget headphones shop','Shopping'],['Apparel backpack purchase','Shopping'],
  ['Music streaming renewal','Subscriptions'],['Cloud software membership','Subscriptions'],['Broadband recharge','Subscriptions'],
  ['Unknown merchant XYZ','Other'],['Unlabelled payment abc','Other']
];
const results=cases.map(([description,expected])=>({description,expected,...predictCategory(description,'debit')}));
const correct=results.filter(row=>row.category===row.expected).length;
const report={dataset:'Authored synthetic holdout descriptions, distinct from training strings',trainingExamples:TRAINING_DATA.length,total:results.length,correct,accuracy:correct/results.length,limitations:'Small English-only synthetic evaluation. Not evidence of real-bank accuracy. Confidence is an uncalibrated score-margin label; all suggestions remain editable.',results};
await mkdir('docs',{recursive:true});await writeFile('docs/model-evaluation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({correct,total:results.length,syntheticOnly:true}));
