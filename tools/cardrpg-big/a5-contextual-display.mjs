// REFERENCE: A5 B1 display-context40. Read-only TRAIN diagnostic; never changes a build score or combat.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRules} from './a4-load.mjs';
import {fixtures} from './a5-drafts/b1-prep/a5-candidate-fixtures.mjs';
const out='reports/cardrpg-big/a5/b1/display-context-40';
const sha=b=>createHash('sha256').update(b).digest('hex');
const reg=JSON.parse(await readFile(out+'/REGISTERED-METHOD.json'));
assert.equal(process.env.BIG_RULES_ROOT,reg.sourceRoot);
for(const[p,h]of Object.entries(reg.source))assert.equal(sha(await readFile(reg.sourceRoot+'/'+p)),h,p);
for(const[p,h]of Object.entries(reg.scripts))assert.equal(sha(await readFile(p)),h,p);
const controlBytes=await readFile(reg.control);assert.equal(sha(controlBytes),reg.controlSha256);
const control=JSON.parse(controlBytes);assert.equal(control.count,50);assert.equal(control.offset,0);assert.equal(control.rows.length,384);
const digest=sha(JSON.stringify(reg));
const previous=JSON.parse(await readFile(out+'/partial.json','utf8').catch(e=>{if(e.code==='ENOENT')return '{}';throw e;}));
if(previous.registrationSha256)assert.equal(previous.registrationSha256,digest);
const rows=previous.rows??[],cache=new Map(previous.cache??[]),start=Date.now(),pause=new Error('checkpoint');
const save=()=>writeFile(out+'/partial.json',JSON.stringify({registrationSha256:digest,rows,cache:[...cache]}));
const {load,rules:C,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const{setups}=fixtures(R,C);
try{
 for(const old of control.rows){
  let row=rows.find(r=>r.key===old.key);if(!row){row={key:old.key,chapter:old.chapter,items:[],controlOutcomes:old.outcomes};rows.push(row);}
  for(let seed=row.items.length+1;seed<=50;seed++){
   const fixture=setups(JSON.parse(old.key),seed),result={seed,share:fixture.share};
   for(const side of ['none','all']){
    const setup=fixture.setups[side],key=R.forecastKeyV4(setup);let prediction=cache.get(key);
    if(!prediction){const initial=JSON.stringify(setup),forecast=R.forecastV4(setup);assert.equal(JSON.stringify(setup),initial);prediction={band:forecast.band,wins:forecast.wins,firstFallen:forecast.firstFallen,risk:forecast.risk};cache.set(key,prediction);}
    result[side]={key,...prediction};
   }
   result.predictedGainPp=5*(result.all.wins-result.none.wins);row.items.push(result);
   if(Date.now()-start>=110000){await save();process.exitCode=75;throw pause;}
  }
  row.complete=true;await save();console.log(JSON.stringify({completed:rows.filter(r=>r.complete).length,forecasts:cache.size}));
 }
 assert(rows.every(r=>r.complete));
 await writeFile(out+'/results.json',JSON.stringify({registrationSha256:digest,rows,uniqueForecasts:cache.size,forecastCombatSamples:cache.size*20,method:reg.method},null,2)+'\n');
}catch(error){if(error!==pause)throw error;}finally{await vite.close();}
