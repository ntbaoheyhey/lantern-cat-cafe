// REFERENCE: PROMPT-A5 E2/B3. Independently recompute gates from durable measured receipts.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),base='reports/cardrpg-big/a5/e2/';
const bytes=p=>readFileSync(new URL(p,root)),read=p=>JSON.parse(bytes(p)),hash=p=>createHash('sha256').update(bytes(p)).digest('hex');
const median=xs=>{const a=[...xs].sort((a,b)=>a-b);return a.length?(a[(a.length-1)>>1]+a[a.length>>1])/2:null;};

test('E2 artifact, desktop flows and all six gates bind to reviewed source',()=>{
 const audit=read(base+'reviewed/audit.json');
 assert.equal(hash(audit.artifact.path),audit.artifact.sha256);assert.equal(bytes(audit.artifact.path).length,audit.artifact.bytes);
 for(const r of audit.receipts)assert.equal(hash(r.path),r.sha256,r.path);
 for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){
  const g=audit.gates.findLast(g=>g.name===name);assert(g);assert.equal(g.code,0);assert.equal(g.head,audit.source);assert.equal(hash(g.log),g.sha256);
 }
 for(const width of [1280,1440,1024]){
  const r=read(base+`reviewed/browser-${width}/checks.json`);assert(r.passed);assert.equal(r.sha256,audit.artifact.sha256);assert.equal(r.captures.length,9);
  assert.deepEqual(r.errors,[]);assert.deepEqual(r.remote,[]);
  for(const c of r.captures){assert.equal(c.overflow,0);assert(c.contrast.length>0);assert(c.contrast.every(t=>t.ratio>=4.5));}
 }
 assert.equal(audit.off.sha256,'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');
 assert.equal(audit.off.cells,165);assert.equal(audit.off.routes,8250);
});
test('earned star reward deltas equal the actual cap-limited receipt, once',()=>{
 const r=read(base+'rules/checks.json');assert(r.passed);
 const sum=s=>Object.values(s.v4.journey.stars).reduce((n,r)=>n+r.conditions.filter(Boolean).length,0);
 assert.equal(sum(r.beforeClaim),r.stars);assert.equal(sum(r.afterClaim),r.stars);
 assert.deepEqual(r.afterClaim.v4.journey.stars,r.beforeClaim.v4.journey.stars);
 assert.deepEqual(r.afterClaim.v4.journey.claims,r.claims.map(c=>c.id));assert.equal(new Set(r.claims.map(c=>c.id)).size,r.claims.length);
 for(const id of ['fish','threads','stamps','essence']){
  const delta=r.claims.reduce((n,c)=>n+(c.reward[id]??0),0);
  assert.equal(r.afterClaim.account.currencies[id]-r.beforeClaim.account.currencies[id],delta);
  assert.equal(r.afterClaim.account.daily.earned[id]-r.beforeClaim.account.daily.earned[id],delta);
 }
 assert.equal(r.timeline.at(-1).after,r.stars);
});
test('4050 account-days independently establish all seven reward-pacing gates',()=>{
 const data=read(base+'economy/progression.json'),summary=read(base+'economy/summary.json');
 assert.equal(hash(base+'economy/progression.json'),summary.sourceSha256);assert.equal(data.accounts.length,90);
 const styles=['casual','regular','heavy'],averages=[],outcomes=[];
 for(const style of styles){
  const accounts=data.accounts.filter(a=>a.style===style);assert.deepEqual(accounts.map(a=>a.index),Array.from({length:30},(_,i)=>i));
  for(const a of accounts){assert.equal(a.days.length,45);assert.equal(new Set(a.events.filter(e=>e.kind==='star-reward').map(e=>e.id)).size,a.events.filter(e=>e.kind==='star-reward').length);
   for(const [index,d]of a.days.entries()){assert.equal(d.day,index+1);for(const [id,cap]of Object.entries({fish:420,threads:90,stamps:360,essence:6}))assert(d.earned[id]<=cap);if(index)assert(d.stars>=a.days[index-1].stars);}
  }
  const actual={style};
  for(const field of ['firstLegendary','firstAnyLegendary','firstChosen']){
   const observations=accounts.map(a=>a[field]?.day??null),observed=observations.filter(n=>n!==null);
   actual[field]={observations,medianDay:median(observed),byDay7:observed.filter(n=>n<=7).length/30,byDay14:observed.filter(n=>n<=14).length/30,censored:30-observed.length};
   assert.deepEqual(actual[field],summary.rows.find(r=>r.style===style)[field]);
  }
  outcomes.push(actual);
  averages.push(Object.fromEntries(['paidPulls','fish','threads','stamps','essence'].map(id=>[id,accounts.reduce((n,a)=>n+(id==='paidPulls'?a.days.at(-1).paidPulls:a.days.reduce((n,d)=>n+d.earned[id],0)),0)/30])));
 }
 const ratios=Object.fromEntries(Object.keys(averages[0]).map(id=>[id,averages[2][id]/averages[0][id]]));assert.deepEqual(ratios,summary.ratios);
 const [c,r,h]=outcomes,actual={regularLegendaryDay7:r.firstAnyLegendary.byDay7>=.35,regularLegendaryDay14:r.firstAnyLegendary.byDay14>=.7,heavyEarlierThanCasual:h.firstAnyLegendary.medianDay<c.firstAnyLegendary.medianDay,regularSelectorBy21:r.firstChosen.medianDay<=21,casualSelectorBy35:c.firstChosen.medianDay<=35,heavySelectorNotCensored:h.firstChosen.censored===0,ratiosAtMost3:Object.values(ratios).every(x=>x<=3)};
 assert.deepEqual(actual,summary.gates);assert(Object.values(actual).every(Boolean),JSON.stringify(actual));
});
