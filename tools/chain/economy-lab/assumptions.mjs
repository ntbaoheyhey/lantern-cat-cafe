import {get,set,nativePolicy} from './search-core.mjs';

/** Policy prices/odds are decisions; these are the uncertain behavioural inputs. */
export function assumptions(config){
 const rows=[{path:'demand',kind:'token'}];
 for(const [i,p] of config.profiles.entries())for(const key of ['hours','hoursSigma','sessionMinutes','activeDays','upgrades','churnFirst','churnLater','deed','withdraw','sink','market','sell','buy']){
  rows.push({path:`profiles.${i}.${key}`,name:`${p.id}.${key}`,kind:['hours','hoursSigma','sessionMinutes','activeDays','upgrades'].includes(key)?'native':'token',probability:['activeDays','churnFirst','churnLater','deed','withdraw','sink','market','sell','buy'].includes(key),integer:key==='upgrades'});
 }
 for(const key of ['decisionSeconds','battleActionSeconds','minimumEncounterSeconds'])rows.push({path:'timing.'+key,kind:'native'});
 for(const key of ['testerYarn','testerRecipients','marketYarnPerParticipant'])rows.push({path:'initial.'+key,kind:'token',integer:key==='testerRecipients'});
 rows.push({path:'preferences.loadoutItems',kind:'token',integer:true});
 for(const [mix,shares] of Object.entries(config.mixes))for(const [i] of shares.entries())rows.push({path:`mixes.${mix}.${i}`,kind:'token',mix});
 return rows;
}
export function perturb(config,assumption,delta){
 if(![-.2,.2].includes(delta))throw Error('Sensitivity must use the requested ±20%.');
 const result=structuredClone(config);if(assumption.path==='demand')return {config:result,demandScale:1+delta};
 const before=get(config,assumption.path);let after=before*(1+delta);
 if(assumption.probability)after=Math.min(1,Math.max(0,after));
 if(assumption.integer)after=Math.max(1,Math.round(after));
 set(result,assumption.path,after);
 if(assumption.mix){const a=result.mixes[assumption.mix],total=a.reduce((n,x)=>n+x,0);result.mixes[assumption.mix]=a.map(x=>x/total);}
 const nativeChanged=JSON.stringify(nativePolicy(config))!==JSON.stringify(nativePolicy(result));
 if(assumption.kind==='token'&&nativeChanged)throw Error('A native change was misclassified: '+assumption.path);
 return {config:result,before,after:get(result,assumption.path),nativeChanged,discreteNoChange:before===after};
}
