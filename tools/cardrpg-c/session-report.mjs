/** Summarize recorded observations only. Never runs or replays combat. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),file=resolve(root,process.argv[2]??'reports/cardrpg-c/first-session-clean.json');
const raw=await readFile(file,'utf8'),run=JSON.parse(raw);
if(!run.endedAt||!run.summary)throw Error('The full observed session must finish before analysis.');
const fights=run.encounters.filter(e=>!e.tutorial),end=e=>e.at+e.seconds;
const median=values=>{const sorted=values.slice().sort((a,b)=>a-b);return sorted.length?sorted[Math.floor(sorted.length/2)]:null;};
const round=value=>value===null?null:Math.round(value*100)/100;
const retries=fights.flatMap((loss,index)=>{
 if(loss.result!=='enemy')return[];
 const later=fights.slice(index+1),next=later.find(e=>e.chapter===loss.chapter&&e.node===loss.node&&!!e.boss===!!loss.boss);
 const advice=run.lossAdvice?.find(a=>a.at>=end(loss)-1&&a.at<(later[0]?.at??Infinity));
 const action=advice&&run.actions.find(a=>a.at>=advice.at&&a.at<advice.at+15&&a.action==='Follow loss advice: '+advice.label);
 const purchase=advice&&!advice.label.startsWith('Apply')?run.hintUpgrades?.find(u=>u.at>=advice.at&&u.at<(later[0]?.at??Infinity)):null;
 const applied=!!action&&(advice.label.startsWith('Apply')||purchase?.applied===true);
 const hintKind=!advice?'unobserved':advice.label.startsWith('Apply')?'completed-comparison':advice.description?.includes('Comparing crew changes')?'fallback-during-comparison':'fallback';
 return[{chapter:loss.chapter,node:loss.node,boss:!!loss.boss,lossSeed:loss.seed,lossAtSeconds:round(end(loss)),advice:advice?.label??null,description:advice?.description??null,hintKind,applied,purchase:purchase??null,retrySeed:next?.seed??null,retryResult:next?.result??null,recovered:applied&&next?next.result==='party':null}];
});
const recoveryFor=rows=>{
 const observed=rows.filter(r=>r.recovered!==null),wins=observed.filter(r=>r.recovered).length;
 return{followed:rows.filter(r=>r.applied).length,observed:observed.length,wins,pending:rows.filter(r=>r.applied&&r.recovered===null).length,rate:observed.length?round(wins/observed.length*100):null};
};
const chapters=[...new Set(fights.map(e=>e.chapter))].map(chapter=>({chapter,...Object.fromEntries([false,true].map(boss=>{const rows=fights.filter(e=>e.chapter===chapter&&!!e.boss===boss);return[boss?'boss':'normal',{samples:rows.length,wins:rows.filter(e=>e.result==='party').length,losses:rows.filter(e=>e.result==='enemy').length,medianSeconds:round(median(rows.map(e=>e.playbackSeconds).filter(s=>s!==null))),maxSeconds:rows.length?round(Math.max(...rows.map(e=>e.playbackSeconds??0))):null}];}))}));
const normalCastObservations=fights.filter(e=>!e.boss).map(e=>{const counts={};for(const cast of run.ultimateCasts??[])if(cast.seed===e.seed)counts[cast.id]=(counts[cast.id]??0)+1;return{seed:e.seed,chapter:e.chapter,result:e.result,observedCasts:counts};});
const report={source:basename(file),sourceSha256:createHash('sha256').update(raw).digest('hex'),sourceHead:run.sourceHead,driverSha256:run.driverSha256,startedAt:run.startedAt,endedAt:run.endedAt,summary:run.summary,
 methods:{duration:'Existing UI observation: sceneReady until visible result; x1, no paused or crossed-lease encounters. Quantiles use the same upper empirical order statistic as the recorder.',recovery:'First later encounter at the same chapter/node/boss kind after a visibly followed hint. A win at an earlier route node is not a recovered boss. Later routes use new encounter seeds; this is not an isolated causal estimate. No replay or counterfactual simulation.',hintKinds:'The captured button and panel text distinguish a completed comparison from the affordable fallback offered while the comparison was still running. These are reported separately.',ultimates:'Counts observed action plans in completed normal encounters only. The recorder does not retain a complete per-fight roster, so missing IDs are not asserted to be zero.',limits:'One conservative UI driver account, one training purchase per completed route plus loss advice. Not a population recovery estimate or an isolated renderer benchmark. The original interrupted account remains separately identified.'},
 chapters,retries,recovery:recoveryFor(retries),recoveryByHint:Object.fromEntries([...new Set(retries.map(r=>r.hintKind))].map(kind=>[kind,recoveryFor(retries.filter(r=>r.hintKind===kind))])),normalCastObservations,
 unfinished:run.liveEncounter??null,errors:run.errors,stalls:run.stalls};
const destination=resolve(root,'reports/cardrpg-c/checks',basename(file,'.json')+'-analysis.json');
await writeFile(destination,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({destination,summary:report.summary,recovery:report.recovery,chapters,unfinished:report.unfinished}));
