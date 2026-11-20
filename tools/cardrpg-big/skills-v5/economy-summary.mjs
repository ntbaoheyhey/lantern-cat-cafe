// REFERENCE: PROMPT-A5 E2/B3. Compute progression gates from the post-stars actual-command receipts.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.argv[2],bytes=await readFile(out+'/results.json'),data=JSON.parse(bytes);
const median=xs=>{const a=[...xs].sort((a,b)=>a-b);return a.length?(a[(a.length-1)>>1]+a[a.length>>1])/2:null;};
assert.equal(data.accounts.length,90);
const rows=['casual','regular','heavy'].map(style=>{
 const accounts=data.accounts.filter(a=>a.style===style);assert.equal(accounts.length,30);assert.deepEqual(accounts.map(a=>a.index),Array.from({length:30},(_,i)=>i));
 for(const a of accounts){assert.equal(a.days.length,45);const claims=a.events.filter(e=>e.kind==='star-reward');assert.equal(new Set(claims.map(c=>c.id)).size,claims.length);
  for(const [index,d]of a.days.entries()){assert.equal(d.day,index+1);for(const [id,cap]of Object.entries({fish:420,threads:90,stamps:360,essence:6}))assert(d.earned[id]<=cap,`${style}/${a.index}/${d.day}/${id}`);if(index)assert(d.stars>=a.days[index-1].stars);}}
 const row={style};for(const field of ['firstLegendary','firstAnyLegendary','firstChosen']){const observations=accounts.map(a=>a[field]?.day??null),observed=observations.filter(n=>n!==null);row[field]={observations,medianDay:median(observations.map(n=>n??Infinity)),byDay7:observed.filter(n=>n<=7).length/30,byDay14:observed.filter(n=>n<=14).length/30,censored:30-observed.length};}
 row.starsByDay7=accounts.map(a=>a.days[6].stars);row.starClaims=accounts.map(a=>a.events.filter(e=>e.kind==='star-reward'));
 return row;
});
const averages=['casual','regular','heavy'].map(style=>{const accounts=data.accounts.filter(a=>a.style===style),avg=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;return{style,paidPulls:avg(accounts.map(a=>a.days.at(-1).paidPulls)),earned:Object.fromEntries(['fish','threads','stamps','essence'].map(id=>[id,avg(accounts.map(a=>a.days.reduce((n,d)=>n+d.earned[id],0)))]))};});
const ratios={paidPulls:averages[2].paidPulls/averages[0].paidPulls,...Object.fromEntries(['fish','threads','stamps','essence'].map(id=>[id,averages[2].earned[id]/averages[0].earned[id]]))};assert.deepEqual(data.ratios,ratios);
const [casual,regular,heavy]=rows,gates={regularLegendaryDay7:regular.firstAnyLegendary.byDay7>=.35,regularLegendaryDay14:regular.firstAnyLegendary.byDay14>=.70,heavyEarlierThanCasual:heavy.firstAnyLegendary.medianDay<casual.firstAnyLegendary.medianDay,regularSelectorBy21:regular.firstChosen.medianDay<=21,casualSelectorBy35:casual.firstChosen.medianDay<=35,heavySelectorNotCensored:heavy.firstChosen.censored===0,ratiosAtMost3:Object.values(ratios).every(x=>x<=3)};
const result={sourceSha256:createHash('sha256').update(bytes).digest('hex'),accountDays:4050,rows,averages,ratios,gates,scope:'Actual earned commands including available capped star claims; Registered V5 shipping/fallback combat. Synthetic time, not human playtesting, elapsed45days or fresh combat acceptance.'};
await writeFile(out+'/summary.json',JSON.stringify(result,null,2));console.log(JSON.stringify({accountDays:4050,rows:rows.map(({starClaims,starsByDay7,...row})=>row),ratios,gates}));
