import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {requiredCallouts,validateCalloutCoverage} from './callout-roster.mjs';
const root=resolve(import.meta.dirname,'../..'),dir=resolve(root,'reports/v3-shell/b2');
const required=await requiredCallouts();
const metadata=JSON.parse(readFileSync(resolve(root,'apps/web/src/audio/voice-callouts.json'),'utf8'));
const manifest=JSON.parse(readFileSync(resolve(root,'apps/web/public/audio/manifest.json'),'utf8'));
const errors=validateCalloutCoverage(required,metadata,manifest);
if(errors.length)throw new Error(errors.join('\n'));
const p=JSON.parse(readFileSync(resolve(dir,'VOICE-CALLOUTS-PRODUCTION.json'),'utf8'));
// Reprocessing changes the audio even when its filename is unchanged. A hash
// of the recognition JSON alone cannot establish that the current take was
// recognised. Reject stale audio/log links before emitting gate evidence.
for(const unit of p.units)for(const row of unit.lines){
 const hash=createHash('sha256').update(readFileSync(resolve(root,row.path))).digest('hex');
 const logBytes=readFileSync(resolve(root,row.recogniserLog.path));
 const log=JSON.parse(logBytes);
 if(hash!==row.sha256||log.audio?.sha256!==hash||log.audio?.path!==row.path||
    createHash('sha256').update(logBytes).digest('hex')!==row.recogniserLog.sha256||
    log.expected!==row.text||log.wordAccuracy!==row.wordAccuracy)
  throw new Error(`Stale recognition evidence: ${row.path}`);
}
const cats=p.units.filter(u=>required.roster.find(r=>r.unitId===u.unitId).tier==='playable').map(u=>{
 const probes=u.lines.filter(r=>r.take===1&&(r.slot===1||r.slot===2||r.phase==='release'));
 return {id:u.unitId,sourceRecording:`freesound:${u.lines[0].production.profile.source}`,measurementLines:probes.map(p=>({path:p.path,sha256:p.sha256})),
  mfcc:probes[0].mfcc.map((_,i)=>probes.reduce((s,p)=>s+p.mfcc[i],0)/probes.length),
  medianF0:probes.map(p=>p.medianF0).sort((a,b)=>a-b)[1]};
});
for(const a of cats){
 const ds=cats.filter(b=>b!==a).map(b=>({b,d:Math.hypot(...a.mfcc.map((x,i)=>x-b.mfcc[i]))})).sort((a,b)=>a.d-b.d);
 const {b,d}=ds[0];Object.assign(a,{nearestCat:b.id,nearestMfccDistance:d,nearestSourceRecording:b.sourceRecording,nearestF0Semitones:Math.abs(12*Math.log2(Math.max(a.medianF0,1)/Math.max(b.medianF0,1)))});
}
let battle;try{battle=JSON.parse(readFileSync(resolve(dir,'VOICE-CALLOUTS-BATTLE.json'),'utf8'));}catch{}
const iterationPath='reports/v3-shell/b2/VOICE-ITERATIONS.md';
const iterationBytes=readFileSync(resolve(root,iterationPath));
const processingIterations=new Set([...iterationBytes.toString().matchAll(/^\| V(\d+)\b/gm)].map(m=>Number(m[1]))).size;
const result={roster:required.roster,coverageErrors:errors,ultimates:p.recognised.filter(r=>r.kind==='ultimate'),skills:p.recognised.filter(r=>r.kind==='skill'),cats,files:p.files,battle,
 processingIterations,iterationEvidence:{path:iterationPath,sha256:createHash('sha256').update(iterationBytes).digest('hex')}};
writeFileSync(resolve(dir,'VOICE-CALLOUTS-VALIDATION.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({units:result.roster.length,skills:result.skills.length,ultimates:result.ultimates.length,
 skillMisses:result.skills.filter(r=>r.wordAccuracy<.5).map(r=>({id:r.cueId,accuracy:r.wordAccuracy})),
 ultimateMisses:result.ultimates.filter(r=>r.wordAccuracy<.7).map(r=>({id:r.cueId,accuracy:r.wordAccuracy})),
 distinct:cats.map(r=>({id:r.id,distance:r.nearestMfccDistance}))},null,2));
