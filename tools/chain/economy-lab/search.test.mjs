import test from 'node:test';
import assert from 'node:assert/strict';
import {loadLabRuntime,root} from './runtime.mjs';
import {resolve} from 'node:path';
import {candidates,LEVERS,targetDistances,applyConfig,validConfig,hashConfig} from './search-core.mjs';
const runtime=await loadLabRuntime(resolve(root,'work/economy-lab/tests',String(process.pid)));
test('config identity ignores key insertion order and preserves array order',()=>{
 assert.equal(hashConfig({a:1,b:{x:2,y:3}}),hashConfig({b:{y:3,x:2},a:1}));
 assert.notEqual(hashConfig({a:[1,2]}),hashConfig({a:[2,1]}));
});
test('search explores at least ten independent live levers with unique, valid configs',()=>{
 const base=structuredClone(runtime.ECONOMY_LAB),rows=candidates(base,40,917);assert(LEVERS.length>=10);assert.equal(new Set(rows.map(r=>r.configHash)).size,40);assert(rows.every(r=>validConfig(r.config)));
 assert.deepEqual(base,runtime.ECONOMY_LAB);const reference=runtime.ECONOMY_LAB.sinks;
 applyConfig(runtime.ECONOMY_LAB,rows[0].config);assert.equal(runtime.ECONOMY_LAB.sinks,reference);applyConfig(runtime.ECONOMY_LAB,base);
});
test('the score rejects each requested median miss and never rewards a missing metric',()=>{
 const scenario={demand:1,botShare:.35},q={burnClaims:1.2,starRatio:1,heavyCasualHourlyRatio:1,casualLegendaryDay:13,heavyLegendaryDay:7,botRegularHourlyRatio:.4,topOnePercentWithdrawnShare:.02};
 assert(Object.values(targetDistances(q,scenario)).every(x=>x===0));
 for(const [key,value,target] of [['burnClaims',.9,'T-a'],['burnClaims',1.7,'T-a'],['starRatio',1.2,'T-b'],['heavyCasualHourlyRatio',4,'T-c'],['heavyLegendaryDay',11,'T-d'],['botRegularHourlyRatio',.8,'T-e'],['topOnePercentWithdrawnShare',.09,'T-f'],['starRatio',null,'T-b']])assert(targetDistances({...q,[key]:value},scenario)[target]>0);
});
