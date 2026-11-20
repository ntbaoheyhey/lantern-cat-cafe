// REFERENCE: A5 B3. Derive claims from the original corrected 90-account receipts.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a5/b3/reward-validation-02';
const bytes=await readFile(out+'/progression.json'), data=JSON.parse(bytes);
const prior=JSON.parse(await readFile('reports/cardrpg-big/a5/b3/reward-confirmation-01/progression.json','utf8'));
assert.equal(data.accounts.length,90);
let matchedDays=0;
const median=values=>{const s=[...values].sort((a,b)=>a-b);return (s[(s.length-1)>>1]+s[s.length>>1])/2;};
const rows=['casual','regular','heavy'].map(style=>{
 const accounts=data.accounts.filter(a=>a.style===style);assert.equal(accounts.length,30);
 assert.deepEqual(accounts.map(a=>a.index),Array.from({length:30},(_,i)=>i));
 for(const a of accounts){
  const p=prior.accounts.find(p=>p.style===style&&p.index===a.index);assert.equal(a.days.length,45);
  assert.deepEqual(a.days,p.days);matchedDays+=a.days.length;
  assert.deepEqual(a.firstLegendary,p.firstLegendary);assert.deepEqual(a.firstChosen,p.firstChosen);
 }
 const row={style};
 for(const field of ['firstLegendary','firstAnyLegendary','firstChosen']){
  const observations=accounts.map(a=>a[field]?.day??null),observed=observations.filter(x=>x!==null);
  row[field]={observations,medianDay:median(observed),byDay7:observed.filter(d=>d<=7).length/30,
   byDay14:observed.filter(d=>d<=14).length/30,censored:30-observed.length};
 }
 return row;
});
assert.equal(matchedDays,4050);assert.deepEqual(data.totals,prior.totals);assert.deepEqual(data.ratios,prior.ratios);
const [casual,regular,heavy]=rows;
const gates={regularLegendaryDay7:regular.firstAnyLegendary.byDay7>=.35,
 regularLegendaryDay14:regular.firstAnyLegendary.byDay14>=.7,
 heavyEarlierThanCasual:heavy.firstAnyLegendary.medianDay<casual.firstAnyLegendary.medianDay,
 regularSelectorBy21:regular.firstChosen.medianDay<=21,casualSelectorBy35:casual.firstChosen.medianDay<=35,
 heavySelectorNotCensored:heavy.firstChosen.censored===0,ratiosAtMost3:Object.values(data.ratios).every(x=>x<=3)};
await writeFile(out+'/summary.json',JSON.stringify({sourceSha256:createHash('sha256').update(bytes).digest('hex'),matchedDays,
 rows,ratios:data.ratios,gates,scope:'Actual earned commands; original A4 combat. Synthetic days, no human-playtest, day7 retry or post-B1 acceptance claim.'},null,2));
console.log(JSON.stringify({matchedDays,rows,ratios:data.ratios,gates}));
