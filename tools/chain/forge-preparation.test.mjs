import test from 'node:test';
import assert from 'node:assert/strict';
import {forgePreparation} from './forge-preparation.mjs';
import {simulate,summarize,mixes,UNIT} from './token-sim.mjs';

test('complete recipe arithmetic counts only missing inputs and preserves wei boundaries',()=>{
  for(const [owned,total] of [[0,23],[1,13],[2,3],[8,3]]){
    const base={sealedEpics:owned,unsealedEpics:2,balance:BigInt(total)*UNIT,sealFee:10n*UNIT};
    const q=forgePreparation(base);assert.equal(q.total,base.balance);assert(q.canComplete);
    assert.equal(forgePreparation({...base,balance:base.balance-1n}).shortfall,1n);
    assert(!forgePreparation({...base,balance:base.balance-1n}).canComplete);
  }
  assert(!forgePreparation({sealedEpics:0,unsealedEpics:1,balance:100n*UNIT,sealFee:10n*UNIT}).canComplete);
  for(const sealedEpics of [-1,.5,NaN])assert.throws(()=>forgePreparation({sealedEpics,unsealedEpics:2,balance:20n*UNIT,sealFee:10n*UNIT}));
});

const supply={rarePerActiveWeek:0,epicPerActiveWeek:8,source:'Abundant synthetic source, no human observation'};
const forgePlan={interestBps:10000,maxDesigns:3,first:true};
test('burning the whole grant into unfinished inputs is not cosmetic completion',()=>{
  const common={supply,forgePlan,entitlementBps:0,collectionTarget:0};
  const eager=simulate(mixes[0],common);
  const saved=simulate(mixes[0],{...common,forgePlan:{...forgePlan,reserveCompletion:true}});
  assert.equal(eager.rows.at(-1).cumulativeBurn,20000);
  assert.equal(eager.forgeOutcomes.sealedButNeverForged,1000);
  assert(summarize(eager).flowPass,'The original ratio alone admits this synthetic failure');
  assert.equal(saved.rows.at(-1).cumulativeBurn,0);
  assert.equal(saved.rows.at(-1).playerCirculating,20000);
  assert.equal(saved.forgeOutcomes.sealedButNeverForged,0);
  assert.equal(saved.forgeOutcomes.nextRecipeUnaffordable,1000);
  assert(!summarize(saved).flowPass);
  assert.equal(saved.rows.at(-1).crafts,0);
});

test('saving for completion does not manufacture inputs, rewards, or more than three designs',()=>{
  const common={supply,forgePlan:{...forgePlan,reserveCompletion:true},controlled:false,collectionTarget:0,weeks:104};
  const funded=simulate(mixes[2],common),last=funded.rows.at(-1);
  assert.equal(last.crafts,800*3);assert.equal(last.consumed,2*last.crafts);
  assert.equal(funded.forgeOutcomes.allCompleted,800);
  assert.equal(last.inclusiveEmission,last.cumulativeBurn+last.treasury+last.playerCirculating);
  const absent=simulate(mixes[0],{...common,supply:{...supply,epicPerActiveWeek:0}});
  assert.equal(absent.rows.at(-1).crafts,0);assert.equal(absent.rows.at(-1).sealBurn,0);
  assert.throws(()=>simulate(mixes[0],{forgePlan:{...forgePlan,reserveCompletion:'yes'}}));
});

test('completion reservation is opt-in and leaves the historical controls numerically intact',()=>{
  const a=simulate(mixes[2],{supply,forgePlan});
  const b=simulate(mixes[2],{supply,forgePlan:{...forgePlan,reserveCompletion:false}});
  assert.deepEqual(a.rows,b.rows);assert.deepEqual(a.budgets,b.budgets);
});

test('a competing market purchase cannot spend the last recipe reserve',()=>{
  const result=simulate(mixes[0],{supply,entitlementBps:0,forgePlan:{...forgePlan,reserveCompletion:true},
    stylePlan:{adoptionBps:10000,maxStyles:3,openWeek:1}});
  assert.equal(result.rows.at(-1).cumulativeBurn,0);
  assert.equal(result.rows.at(-1).trades,0);
  assert.equal(result.rows.at(-1).playerCirculating,20000);
  assert.equal(result.forgeOutcomes.sealedButNeverForged,0);
});

test('demand collapse retains the original completion cohort and its past outcomes',()=>{
  const result=simulate(mixes[0],{supply,forgePlan:{...forgePlan,reserveCompletion:true},controlled:false,
    demand:1,demandShockWeek:14,demandAfterShock:0});
  assert.equal(result.forgeOutcomes.interested,1000);
  assert(result.forgeOutcomes.completed>0);
  assert(result.rows.at(-1).crafts>=result.forgeOutcomes.completed);
});
