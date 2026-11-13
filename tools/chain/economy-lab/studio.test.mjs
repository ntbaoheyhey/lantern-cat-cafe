import test from 'node:test';
import assert from 'node:assert/strict';
import {loadLabRuntime,root} from './runtime.mjs';
import {resolve} from 'node:path';
import {buyStudioRecipe} from './studio.mjs';
const runtime=await loadLabRuntime(resolve(root,'work/economy-lab/tests',String(process.pid))),config=runtime.ECONOMY_LAB;
const account=()=>({stars:30,yarn:100,studio:{gear:[{id:'owned',template:'hearthloom-weapon-epic',quality:0}],styles:[]}});
const spend=(a,cost)=>{if(a.yarn<cost)return false;a.yarn-=cost;return true;};
test('each simulated studio purchase spends the live quote and keeps its finite benefit',()=>{
 for(const id of runtime.ECONOMY_SINK_IDS){
  const a=account(),quote=runtime.economySinkQuote(id,a.studio,'owned',config.startEpoch);
  const result=buyStudioRecipe(runtime,a,id,config.startEpoch,spend);
  assert.deepEqual(result,quote);assert.equal(a.yarn,100-quote.yarn);assert.equal(a.stars,30-quote.starThread);
  if(id==='polish')assert.equal(a.studio.gear[0].quality,quote.quality);
  else assert(a.studio.styles.includes(quote.style));
 }
});
test('finite loadout and cosmetics cannot invent endless demand or unfunded burns',()=>{
 const a=account();
 assert(buyStudioRecipe(runtime,a,'polish',config.startEpoch,spend));assert(buyStudioRecipe(runtime,a,'polish',config.startEpoch,spend));
 assert.equal(buyStudioRecipe(runtime,a,'polish',config.startEpoch,spend),null);
 assert(buyStudioRecipe(runtime,a,'decor',config.startEpoch,spend));assert.equal(buyStudioRecipe(runtime,a,'decor',config.startEpoch,spend),null);
 for(let n=0;n<config.sinks.display.maxLevel;n++)assert(buyStudioRecipe(runtime,a,'display',config.startEpoch,spend));
 assert.equal(buyStudioRecipe(runtime,a,'display',config.startEpoch,spend),null);
 const poor=account();poor.yarn=0;const before=structuredClone(poor);
 assert.equal(buyStudioRecipe(runtime,poor,'decor',config.startEpoch,spend),null);assert.deepEqual(poor,before);
});
test('simulation recipe prices are the production rule object, including parameter changes',()=>{
 const original=config.sinks.decor.yarn;
 try{config.sinks.decor.yarn=original+7;assert.equal(buyStudioRecipe(runtime,account(),'decor',config.startEpoch,spend).yarn,original+7);}
 finally{config.sinks.decor.yarn=original;}
});
