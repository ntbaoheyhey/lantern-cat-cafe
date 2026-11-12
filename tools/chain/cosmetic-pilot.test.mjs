import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,mixes} from './token-sim.mjs';
import {YARN_STYLES} from '../../packages/chain/src/cosmetics.ts';
const source={rarePerActiveWeek:0,epicPerActiveWeek:0,source:'Deliberate no-drop control'};
const plan={adoptionBps:10000,maxStyles:3,openWeek:1};
test('finite locally implemented styles burn the shared fixed catalog cost and never renew',()=>{
 const result=simulate(mixes[2],{supply:source,stylePlan:plan,entitlementBps:0,weeks:260});
 const first=result.rows[12],last=result.rows.at(-1);
 assert.equal(YARN_STYLES.length,3);
 assert.equal(last.stylePurchases,2400); // 800 humans; bots have no invented utility.
 assert.equal(last.styleBurn,800*Number(YARN_STYLES.reduce((n,s)=>n+BigInt(s.cost),0n))/1e18);
 assert.equal(last.stylePurchases,first.stylePurchases);
 assert.equal(last.cumulativeBurn,last.styleBurn);
 assert(last.playerCirculating+last.treasury+last.cumulativeBurn===last.inclusiveEmission);
 assert.equal(result.seasons.at(-1).burn,0,'Finite catalog cannot disguise a dead tail');
});
test('zero demand and zero stated interest cause no style burns; fifth style is invalid',()=>{
 for(const options of [{demand:0},{stylePlan:{...plan,adoptionBps:0}}])
  assert.equal(simulate(mixes[0],{supply:source,stylePlan:plan,...options}).rows.at(-1).styleBurn,0);
 assert.throws(()=>simulate(mixes[0],{stylePlan:{...plan,maxStyles:5}}));
 assert.throws(()=>simulate(mixes[0],{profile:'roadmap',stylePlan:plan}));
});
test('style spending crowds out sealing instead of appending fictitious burns to a baseline',()=>{
 const opts={collectionTarget:0,supply:{...source,epicPerActiveWeek:10},entitlementBps:0};
 const control=simulate(mixes[0],opts).rows.at(-1);
 const pilot=simulate(mixes[0],{...opts,stylePlan:plan}).rows.at(-1);
 assert.equal(control.sealBurn,20000);assert.equal(pilot.styleBurn,12000);
 assert.equal(pilot.sealBurn,0,'Remaining8 cannot afford10-YARN seal, so sinks compete');
 assert.equal(pilot.cumulativeBurn,12000);
 assert.equal(pilot.inclusiveEmission,control.inclusiveEmission);
});
