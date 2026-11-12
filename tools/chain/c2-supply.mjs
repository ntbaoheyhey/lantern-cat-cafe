// Pinned C2 simulation evidence. No mint authority and no claim of observed demand.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
export const C2_INPUT_HASHES=Object.freeze({
  'WEEKLY-SUPPLY.json':'0c7696edc5ed3f5b51a843829e6280cc490eeb8149bced411f375b86223e91fe',
  'ECONOMY.json':'da13a95c6253fc140b0bb8a51ced7dbf72ed4ca0547714009bdd14279c13fb32',
});
const profiles=['casual','regular','heavy'];
const rateKeys=['rarePerActiveWeek','epicPerActiveWeek','legendaryPerActiveWeek'];
const zero=()=>Object.fromEntries(rateKeys.map(k=>[k,0]));
const close=(a,b,message)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8,message);
const nonnegative=n=>assert(Number.isFinite(n)&&n>=0,'Invalid source count');
export function loadC2Inputs(){
  const values={};
  for(const [name,expected] of Object.entries(C2_INPUT_HASHES)){
    const bytes=readFileSync(resolve(root,'reports/chain/c2-inputs',name));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,`Changed C2 evidence: ${name}; review and repin both inputs`);
    values[name]=JSON.parse(bytes);
  }
  const tradeHash=createHash('sha256').update(readFileSync(resolve(root,'packages/game-rules/src/cardrpg/trade.ts'))).digest('hex');
  return {weekly:values['WEEKLY-SUPPLY.json'],economy:values['ECONOMY.json'],tradeHash};
}
export function reconcileC2({weekly,economy,tradeHash},catalog){
  assert.equal(weekly.tradeSourceSha256,tradeHash,'C2 eligibility policy differs; review item classification');
  assert.deepEqual(weekly.economySource,economy.source,'C2 source manifests disagree');
  for(const key of ['runtimeSha256','driverSha256'])assert(/^[a-f0-9]{64}$/.test(economy.source[key]),'Source hash required');
  assert.equal(economy.source.calendar.independentDailySamples,false,'Review changed calendar sampling');
  assert.equal(weekly.specialOneTimeRewards['star-thread'].recurringPerWeek,0,'Judge item cannot become recurring');
  assert.equal(weekly.specialOneTimeRewards['star-thread'].maximumPerAccount,1);
  const byProfile=Object.fromEntries(profiles.map(p=>[p,zero()]));
  const weeks=Array.from({length:5},()=>Object.fromEntries(profiles.map(p=>[p,zero()])));
  const counts={items:0,eligible:0,accounts:0};
  for(const p of profiles){
    const data=economy.profiles[p];
    assert.equal(data.days,30,'Review a new measurement horizon');
    assert(Number.isSafeInteger(data.seeds)&&data.seeds>0,'Account count required');counts.accounts+=data.seeds;
    close(data.minutesPerDay*7/60,weekly.activeHoursPerWeek[p],'Profile hours disagree');
    close(data.activeHours,data.days*data.minutesPerDay/60,'Active exposure differs');
    assert.deepEqual(Object.keys(data.perItem).sort(),Object.keys(weekly.items).sort(),'Item coverage differs');
  }
  close(Object.values(weekly.mix).reduce((a,b)=>a+b,0),1,'Mixture must sum to one');
  for(const [id,item] of Object.entries(weekly.items)){
    counts.items++;
    assert.equal(item.authoritativeIssuancePerWeek,0,'Nonzero authority needs a separate receipt audit');
    // C2 has extra bound accounting counters. Unknown tradable IDs fail closed.
    const rule=catalog[id];
    assert.equal(item.tradable,rule?.tradable??false,`Eligibility mismatch: ${id}`);
    if(item.tradable){assert.equal(item.rarity,rule.rarity,`Rarity mismatch: ${id}`);counts.eligible++;}
    let weighted=0;
    for(const p of profiles){
      const detail=economy.profiles[p].perItem[id];
      nonnegative(detail.meanCreated);nonnegative(item.perProfile[p]);
      close(detail.meanCreated*7/30,item.perProfile[p],`Weekly exposure mismatch: ${id}/${p}`);
      close(detail.perActiveWeek,item.perProfile[p],`Item rate mismatch: ${id}/${p}`);
      close(detail.perActiveHour*weekly.activeHoursPerWeek[p],detail.perActiveWeek,`Hour denominator mismatch: ${id}/${p}`);
      assert.equal(detail.weeks.length,5);
      close(detail.weeks.reduce((s,w)=>s+w.meanCreated,0),detail.meanCreated,`Partial week lost: ${id}/${p}`);
      detail.weeks.forEach((w,i)=>{assert.equal(w.week,i+1);assert.equal(w.observedDays,i===4?2:7);nonnegative(w.meanCreated);});
      weighted+=item.perProfile[p]*weekly.mix[p];
      if(item.tradable){
        const key=item.kind==='material'?'rarePerActiveWeek':item.rarity==='epic'?'epicPerActiveWeek':item.rarity==='legendary'?'legendaryPerActiveWeek':null;
        assert(key,`Unsupported tradable kind: ${id}`);
        byProfile[p][key]+=detail.perActiveWeek;
        detail.weeks.forEach((w,i)=>{weeks[i][p][key]+=w.meanCreated;});
      }
    }
    close(weighted,item.grossPerActiveWeek,`Mixture mismatch: ${id}`);
    close(item.eligiblePerActiveWeek,item.tradable?weighted:0,`Eligible source mismatch: ${id}`);
  }
  for(const key of rateKeys)close(profiles.reduce((n,p)=>n+byProfile[p][key]*weekly.mix[p],0),weekly[key],`Mixed ${key} differs`);
  return {byProfile,weeks,hours:weekly.activeHoursPerWeek,counts,source:weekly.source,hashes:C2_INPUT_HASHES,
    provenance:weekly.economySource,authoritativeIssuance:0,
    limitation:'Gross template creation before salvage/equipment use; shared calendar, first30 days only. No behavior, bot profile, server authority or mature-year observation.'};
}
export function c2Scenario(data,{tail='mean',botScale=1,authority=false}={}){
  assert(['mean','week4','stop'].includes(tail),'Unknown extrapolation');
  assert([0,1,3].includes(botScale),'Explicit bot bound required');
  const source=`C2 pinned30-day source; ${authority?'ACTUAL ordinary campaign authority=0':`conditional ${tail} tail, bot heavy×${botScale}`}; ${data.source}`;
  const make=profileRates=>{
    const byType={casual:{...profileRates.casual},regular:{...profileRates.regular},farmer:{...profileRates.heavy},
      bot:Object.fromEntries(rateKeys.map(k=>[k,profileRates.heavy[k]*botScale]))};
    if(authority)for(const rates of Object.values(byType))for(const key of rateKeys)rates[key]=0;
    return {...zero(),source,byType};
  };
  const supply=make(data.byProfile);
  // Week5 includes only observed days29/30; do NOT multiply it by7/2.
  // Extrapolation begins week6. A conservative missing-days window remains.
  const tailRates=tail==='mean'?data.byProfile:tail==='week4'?data.weeks[3]:Object.fromEntries(profiles.map(p=>[p,zero()]));
  return {supply,supplySchedule:{initial:data.weeks.map(make),tail:make(tailRates)},
    hoursByType:{casual:data.hours.casual,regular:data.hours.regular,farmer:data.hours.heavy,bot:70},
    assumptions:{tail,botScale,authority,botHours:'70 assumed, not C2 measured',
      activity:'Token model retains90% active weeks; C2 rates are per active week. No measured retention curve.',
      stock:'All gross eligible creations are optimistically available until the model shelf fills; C2 salvage/use not replayed.'}};
}
