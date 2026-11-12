import test from 'node:test';
import assert from 'node:assert/strict';
import {featureQuote} from './feature-plan.mjs';
import {mixes,simulate} from './token-sim.mjs';
const supply={rarePerActiveWeek:0,epicPerActiveWeek:10,legendaryPerActiveWeek:0,source:'Conditional recipe test, not player telemetry'};
const plan={input:'unsealed',catalogSeasons:1,recipesPerSeason:2,forgePriceYarn:3,renewalBps:10000};
const options={supply,profile:'roadmap',controlled:false,featurePlan:plan};

test('recipes expose full self-sourced input cost without implying power or implementation',()=>{
  assert.equal(featureQuote(plan).totalSelfSourcedYarn,3);
  assert.equal(featureQuote({...plan,input:'sealed'}).totalSelfSourcedYarn,23);
  assert.equal(featureQuote(plan).combatPower,0);
  assert.equal(featureQuote(plan).implemented,false);
  for(const change of [{input:'browser-save'},{catalogSeasons:0},{recipesPerSeason:Infinity},{forgePriceYarn:-1},{renewalBps:10001}])
    assert.throws(()=>featureQuote({...plan,...change}));
  assert.throws(()=>simulate(mixes[0],{featurePlan:plan}));
});
test('finite source recipes conserve inventory and cannot relabel repeated ownership as new utility',()=>{
  const s=simulate(mixes[2],options),last=s.rows.at(-1);
  assert(last.crafts>0&&last.crafts<=800*2,'Bots never buy the cosmetic');
  assert.equal(last.unsealedConsumed,last.crafts*2);
  assert.equal(last.forgeBurn,last.crafts*3);
  assert.equal(last.consumed,0);
  assert.equal(last.unsealedStock,last.acquired-last.sealed-last.unsealedConsumed);
  assert.equal(s.rows[12].crafts,last.crafts,'A one-season catalog stops creating sales after season1');
  assert(s.rows.every(r=>r.renameBurn===0&&r.decorBurn===0&&r.passBurn===0),'No invented extra purchases');
});
test('sealed recipe consumes actual Epic units, not cheaper materials or duplicate burned tokens',()=>{
  const s=simulate(mixes[1],{...options,featurePlan:{...plan,input:'sealed'}}),last=s.rows.at(-1);
  assert(last.crafts>0);assert.equal(last.consumed,last.crafts*2);
  assert.equal(last.unsealedConsumed,0);assert.equal(last.sealedStock,last.sealed-last.consumed);
  const noEpic=simulate(mixes[0],{...options,supply:{...supply,epicPerActiveWeek:0,rarePerActiveWeek:30},featurePlan:{...plan,input:'sealed'}});
  assert.equal(noEpic.rows.at(-1).crafts,0,'Rare inputs cannot impersonate Epic recipes');
});
test('renewal refusal, demand collapse and absent sources create no cosmetic sinks',()=>{
  const refuse=simulate(mixes[0],{...options,featurePlan:{...plan,renewalBps:0,catalogSeasons:20}});
  assert(refuse.rows.every(r=>r.crafts===0&&r.forgeBurn===0));
  const none=simulate(mixes[0],{...options,supply:{...supply,epicPerActiveWeek:0}});
  assert(none.rows.every(r=>r.crafts===0));
  const collapse=simulate(mixes[0],{...options,featurePlan:{...plan,catalogSeasons:20},demandShockWeek:14,demandAfterShock:0});
  assert.equal(collapse.rows[12].crafts,collapse.rows.at(-1).crafts);
});
