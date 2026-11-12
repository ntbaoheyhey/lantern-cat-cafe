import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,mixes} from './token-sim.mjs';
import {FORGE_DESIGNS,FORGE_COST} from '../../packages/chain/src/forge.ts';
const supply={rarePerActiveWeek:0,epicPerActiveWeek:8,source:'Synthetic abundant Epic control'};
const forgePlan={interestBps:10000,maxDesigns:3,first:true};
test('finite forge consumes exactly two Epics and3 YARN per permanent design',()=>{
 const result=simulate(mixes[2],{supply,forgePlan,controlled:false,weeks:260});
 const last=result.rows.at(-1);
 assert.equal(FORGE_DESIGNS.length,3);
 assert.equal(last.crafts,800*3,'Bots get no invented cosmetic utility');
 assert.equal(last.consumed,last.crafts*2);
 assert.equal(last.forgeBurn,last.crafts*Number(FORGE_COST)/1e18);
 assert.equal(last.sealed,last.sealedStock+last.consumed);
 assert.equal(last.forgeBurn,result.rows[103].forgeBurn,'Owned designs never renew');
});
test('no interest, no adoption or no Epics cannot fabricate forge demand',()=>{
 for(const opts of [{demand:0},{forgePlan:{...forgePlan,interestBps:0}},{supply:{...supply,epicPerActiveWeek:0}}])
  assert.equal(simulate(mixes[0],{supply,forgePlan,...opts}).rows.at(-1).forgeBurn,0);
 assert.throws(()=>simulate(mixes[0],{forgePlan:{...forgePlan,maxDesigns:4}}));
 assert.throws(()=>simulate(mixes[0],{profile:'roadmap',forgePlan}));
});
test('a20 grant cannot self-seal two Epics and pay the3-YARN fee without other inflow',()=>{
 const base={supply,entitlementBps:0,collectionTarget:0,weeks:52};
 const result=simulate(mixes[0],{...base,forgePlan});
 assert.equal(result.rows.at(-1).forgeBurn,0);
 assert.equal(result.rows.at(-1).sealBurn,20000);
 const competed=simulate(mixes[0],{...base,forgePlan,stylePlan:{adoptionBps:10000,maxStyles:3,openWeek:1}});
 const last=competed.rows.at(-1);
 assert.equal(last.forgeBurn,0);
 assert(last.cumulativeBurn<=last.inclusiveEmission);
 assert.equal(last.styleBurn,0,'Forge-first sealer spends20, leaving none for decor');
 const stylesFirst=simulate(mixes[0],{...base,forgePlan:{...forgePlan,first:false},stylePlan:{adoptionBps:10000,maxStyles:3,openWeek:1}}).rows.at(-1);
 assert.equal(stylesFirst.styleBurn,12000);assert.equal(stylesFirst.sealBurn,0);
});
