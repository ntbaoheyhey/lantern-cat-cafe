import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifiedConfig,verifiedConfirmation,frontier} from './evidence.mjs';
import {hashConfig} from './search-core.mjs';

const scenario=(id,distances={})=>({id,seeds:40,distances:Object.fromEntries(['T-a','T-b','T-c','T-d','T-e','T-f','T-g'].map(k=>[k,distances[k]??0])),quantiles:Object.fromEntries(['median','p10','p90'].map(k=>[k,{burnClaims:1.2,starRatio:1.05,casualLegendaryDay:12,heavyLegendaryDay:8,botRegularHourlyRatio:.9}]))});
test('evidence rejects swapped policies and missing or duplicated scenario rows',()=>{
  const config={z:1,a:2},row={config,configHash:hashConfig(config),seeds:40,scenarioScores:Array.from({length:18},(_,i)=>scenario(String(i)))};
  assert.equal(verifiedConfig(row).configHash,hashConfig(config));
  const legacy=createHash('sha256').update(JSON.stringify(config)).digest('hex');
  assert.equal(verifiedConfig({...row,configHash:legacy}).configHash,hashConfig(config));
  assert.throws(()=>verifiedConfig({...row,config:{z:2,a:2}}),/hash mismatch/);
  assert.throws(()=>verifiedConfig({...row,scenarioScores:row.scenarioScores.slice(1)}),/Incomplete/);
  assert.throws(()=>verifiedConfig({...row,scenarioScores:Array(18).fill(row.scenarioScores[0])}),/Repeated/);
});
test('Pareto membership retains a real conflict and labels dominated alternatives',()=>{
  const rows=[{'T-a':0,'T-b':1},{'T-a':1,'T-b':0},{'T-a':1,'T-b':1}].map(distances=>({scenarioScores:[scenario('x',distances)]}));
  assert.deepEqual(frontier(rows).map(r=>r.dominated),[false,false,true]);
});
test('confirmation resume rejects changed seeds, native data, or frozen worker code',()=>{
 const config={a:2},row={config,configHash:hashConfig(config),seeds:200,firstSeed:53113,score:0,modelSnapshot:{sha256:'model'},bank:{sha256:'bank'},scenarioScores:Array.from({length:18},(_,i)=>({...scenario(String(i)),seeds:200}))};
 const expected={configHash:row.configHash,seeds:200,firstSeed:53113,modelSha256:'model',bankSha256:'bank'};
 assert.equal(verifiedConfirmation(row,expected),row);
 for(const patch of [{seeds:40},{firstSeed:43113},{modelSnapshot:{sha256:'new'}},{bank:{sha256:'new'}}])assert.throws(()=>verifiedConfirmation({...row,...patch},expected));
});
