import test from 'node:test';
import assert from 'node:assert/strict';
import {seasonBudget} from './season-budget.mjs';
import {simulate,summarize,mixes,UNIT} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';
const base={organicBurn:20000n*UNIT,accounts:1000,bossCeiling:6n*UNIT,
  rankRequests:Array.from({length:1000},(_,i)=>i<10?6n*UNIT:0n),weeklyCap:12n*UNIT};

test('a closed burn budget preserves rank and equal boss promises without oversubscribing',()=>{
 const b=seasonBudget(base);
 assert.equal(b.ceiling,10000n*UNIT);
 assert.equal(b.rankTotal,60n*UNIT);
 assert(b.committed<=b.ceiling);
 assert.equal(b.committed+b.uncommitted,b.ceiling);
 assert.equal(b.rankAwards[0],6n*UNIT);
 assert.equal(b.rankAwards[10],0n);
 assert(b.bossPerWeek+b.rankAwards[0]<=base.weeklyCap);
 assert.equal(seasonBudget({...base,organicBurn:0n}).committed,0n);
 assert.equal(seasonBudget({...base,weeklyCap:0n}).committed,0n);
 assert.equal(seasonBudget({...base,available:0n}).committed,0n);
});

test('randomized budget allocations conserve funds and remain claimable at the shared cap',()=>{
 let seed=43113;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 for(let i=0;i<5000;i++){
   const accounts=1+random()%50,weeklyCap=BigInt(random()%12001)*UNIT/1000n;
   const input={organicBurn:BigInt(random()%200000)*UNIT/100n,accounts,
     bossCeiling:BigInt(random()%6001)*UNIT/1000n,weeklyCap,
     available:BigInt(random()%200000)*UNIT/100n,burnBudgetBps:random()%10001,
     rankRequests:Array.from({length:accounts},()=>BigInt(random()%6001)*UNIT/1000n)};
   const b=seasonBudget(input);
   assert(b.committed<=input.available&&b.committed<=input.organicBurn*BigInt(input.burnBudgetBps)/10000n);
   assert.equal(b.committed,b.rankAwards.reduce((a,v)=>a+v,0n)+13n*BigInt(accounts)*b.bossPerWeek);
   assert(b.rankAwards.every((v,j)=>v<=input.rankRequests[j]&&v+b.bossPerWeek<=weeklyCap));
   assert.equal(seasonBudget({...input,rankRequests:[...input.rankRequests].reverse()}).bossPerWeek,b.bossPerWeek,'Order cannot favor farmers over casuals');
 }
});

test('closed-burn model uses only the prior season and discloses unmet affordability',()=>{
 const supply=loadSourceSupply();
 const s=simulate(mixes[2],{supply,rewardPolicy:'closed-burn'});
 assert(s.rows.slice(0,13).every(r=>r.emission===0));
 for(let i=1;i<s.budgets.length;i++){
   const b=s.budgets[i],prior=s.rows.slice((i-1)*13,i*13).reduce((n,r)=>n+r.organicBurn,0);
   assert(Math.abs(b.closedOrganicBurn-prior)<1e-8);
   assert(b.committed<=prior*.5+1e-8);
   assert(s.rows.slice(i*13,(i+1)*13).reduce((n,r)=>n+r.emission,0)<=b.committed+1e-8);
 }
 assert(summarize(s).flowPass);
 assert(s.affordability[0].features[10].share<.5,'Passing flow must not conceal poor seal affordability');
});

test('opt-in preserves the exact20 grant, exposes leakage and does not identify bots as humans',()=>{
 const supply=loadSourceSupply();
 const s=simulate(mixes[2],{supply,demand:.1,rewardPolicy:'closed-burn',grantPolicy:'opt-in',grantLeakage:.05,botsHoard:true});
 assert(s.grantClaims>=200&&s.grantClaims<1000);
 assert.equal(s.rows[0].testerEmission,s.grantClaims*20);
 assert.equal(s.affordability[3].grants,200);
 assert(!summarize(s).flowPass,'Hoarding bots still break the inclusive ratio');
 const none=simulate(mixes[0],{supply,demand:0,rewardPolicy:'closed-burn',grantPolicy:'opt-in',botsClaimGrant:false});
 assert.equal(none.rows.at(-1).inclusiveEmission,0);
 assert.equal(summarize(none).flowPass,false,'A zero-activity model is not sustainable gameplay');
});

test('a demand collapse cannot retroactively reduce the current announced season',()=>{
 const supply=loadSourceSupply();
 const s=simulate(mixes[2],{supply,rewardPolicy:'closed-burn',demandShockWeek:14,demandAfterShock:0});
 assert(s.budgets[1].committed>0);
 assert(s.rows.slice(13,26).every(r=>r.burn===0));
 assert(s.rows.slice(13,26).some(r=>r.emission>0));
 assert(s.rows.slice(26).every(r=>r.emission===0));
 assert.equal(s.budgets[2].committed,0);
 const recovery=simulate(mixes[2],{supply,rewardPolicy:'closed-burn',demand:0,demandShockWeek:27,demandAfterShock:1});
 assert(recovery.rows.slice(26).some(r=>r.burn>0));
 assert(recovery.rows.slice(13).every(r=>r.emission===0),'Existing on-chain zero cap remains irreversible; do not fake recovery');
});

test('invalid parameters and incomplete allocation cohorts fail closed',()=>{
 for(const burnBudgetBps of [-1,10001,.1,NaN])assert.throws(()=>seasonBudget({...base,burnBudgetBps}));
 assert.throws(()=>seasonBudget({...base,rankRequests:[]}));
 assert.throws(()=>seasonBudget({...base,organicBurn:-1n}));
 assert.throws(()=>simulate(mixes[0],{rewardPolicy:'unlimited'}));
 assert.throws(()=>simulate(mixes[0],{rewardPolicy:'closed-burn',rewardSchedule:'legacy-weekly'}));
});
