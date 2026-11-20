/** Throwaway study of two gate-selection and timing methods on existing evidence. */
import {readFileSync, writeFileSync, mkdirSync, statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {checkFeel} from '../../../scripts/v3feel/check-feel.mjs';
const base = 'reports/v3-feel/';
const data = JSON.parse(readFileSync(base+'measurements.json', 'utf8'));
const q1 = checkFeel(data).filter(g => g.item === 'Q1');
const counts = rows => Object.fromEntries(['PASS','FAIL','OPEN'].map(state => [state,rows.filter(r=>r.state===state).length]));
const scope = {legacyAllQ1:counts(q1), ownRowsOnly:counts(q1.filter(g=>!g.key.startsWith('craft.'))),
  laterCraftRows:q1.filter(g=>g.key.startsWith('craft.')).length};
const timing = ['wave1','wave3','boss'].map(fixture => {
  const capture = JSON.parse(gunzipSync(readFileSync(`${base}REVIEW/Q1/${fixture}/capture.json.gz`)));
  const ultimates = capture.plans.filter(p=>p.tier==='ultimate');
  const postDrawOverlaps = capture.plans.slice(1).map((p,i)=>{
    const prev=capture.plans[i];return Math.max(0,(prev.clockStart-p.clockStart)*1000+prev.duration);
  });
  const durations = ultimates.map(p=>p.duration);
  return {fixture,actions:capture.plans.length,ultimateCount:ultimates.length,
    scheduleDurationMinMs:Math.min(...durations),scheduleDurationMaxMs:Math.max(...durations),
    scheduleImpactOffsetsMs:[...new Set(ultimates.map(p=>p.impact))],
    postDrawInferredOverlapMaxMs:Math.max(...postDrawOverlaps),
    note:'Configured plan timings are exact; inferred starts include render latency. Neither alone proves video contact.'};
});
const tracked=execFileSync('git',['ls-files','-z','reports/v3-feel'],{encoding:'utf8'}).split('\0').filter(Boolean);
const byteSize=path=>{try{return statSync(path).size;}catch{return 0;}};
const removable=tracked.filter(path=>path.endsWith('.wav')||path.endsWith('/capture.json.gz'));
const evidence={trackedBytes:tracked.reduce((s,p)=>s+byteSize(p),0),ignoreOnlyTrackedByteReduction:0,
  untrackRawCapturesAndWavsByteReduction:removable.reduce((s,p)=>s+byteSize(p),0),removableFiles:removable.length};
const result={at:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope,timing,evidence};
mkdirSync('tools/v3craft-lab/c0',{recursive:true});
writeFileSync('tools/v3craft-lab/c0/results.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
