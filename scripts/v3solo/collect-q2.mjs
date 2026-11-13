/** Preserve portable Q2 evidence from B's isolated A+B audio review build. */
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {checkSolo,format} from './check-solo.mjs';
const root=resolve(import.meta.dirname,'../..');
const b=resolve(process.env.V3SOLO_B_ROOT??'/Users/bao/taskbar-hero-chain');
const trial=process.argv[2];
if(!trial||!/^[a-zA-Z0-9-]+$/.test(trial))throw Error('Supply a measured mix trial.');
const out=resolve(root,'reports/v3-solo/Q2');
mkdirSync(resolve(out,'playback',trial),{recursive:true});
mkdirSync(resolve(out,'trials'),{recursive:true});
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const matrixPath=resolve(b,'reports/v3-shell/b2/q2/voice-matrix.json');
const matrix=JSON.parse(readFileSync(matrixPath));
if(matrix.trial!==trial)throw Error('Matrix belongs to another trial: '+matrix.trial);
for(const source of matrix.runtimeSources){
 const owner=source.path.startsWith('apps/web/src/game/')?root:b;
 if(hash(resolve(owner,source.path))!==source.sha256)throw Error('Capture no longer matches its owning lane: '+source.path);
}
const copy=(source,name,expected)=>{
 if(expected&&hash(source)!==expected)throw Error('Evidence hash changed: '+source);
 const path=resolve(out,'playback',trial,name);
 if(existsSync(path)&&hash(path)!==hash(source))throw Error('Preserve prior trial evidence: '+path);
 copyFileSync(source,path);
 return {path:relative(root,path),sha256:hash(path)};
};
const matrixEvidence=copy(matrixPath,'voice-matrix.json');
const rows=matrix.rows.map(row=>({...row,raw:copy(resolve(b,row.raw.path),`voice-${row.fixture}-x${row.speed}.json.gz`,row.raw.sha256)}));
const mixes=['battle','boss'].map(name=>{
 const path=resolve(b,`reports/v3-shell/b2/mix/${trial}-${name}.json`);
 const data=JSON.parse(readFileSync(path));
 if(data.diagnostic||data.errors?.length)throw Error('Diagnostic or failed render cannot be acceptance evidence.');
 if(data.algorithmSha256!==hash(resolve(b,'scripts/audio/analyse.py')))throw Error('Capture analyser differs from current reference method.');
 for(const file of ['apps/web/src/audio/engine.ts','apps/web/public/audio/manifest.json','apps/web/src/game/cardrpg/depth/model.ts']){
  const matrixHash=matrix.runtimeSources?.find(s=>s.path===file)?.sha256;
  const renderHash=data.runtimeSources?.find(s=>s.path===file)?.sha256;
  if(!matrixHash||matrixHash!==renderHash)throw Error('Playback and mix used different or unidentified source: '+file);
 }
 for(const source of matrix.runtimeSources){
  if(data.runtimeSources.find(s=>s.path===source.path)?.sha256!==source.sha256)throw Error('Playback and mix used different encoded audio or code: '+source.path);
 }
 const audioPath=resolve(b,data.path);
 if(hash(audioPath)!==data.sha256)throw Error('Rendered audio changed: '+audioPath);
 return {name,voiceContoursPerMinute:data.voiceContoursPerMinute,durationSeconds:data.durationSeconds,
  evidence:copy(path,`${trial}-${name}.json`),runtime:copy(resolve(b,data.runtime.path),`${trial}-${name}-runtime.json.gz`,data.runtime.sha256),
  audio:{lane:'B',path:data.path,sha256:data.sha256},algorithmSha256:data.algorithmSha256};
});
const metrics={generatedAt:new Date().toISOString(),trial,integration:matrix.integration,runtimeSources:matrix.runtimeSources,method:matrix.method,matrixEvidence,rows,mixes};
writeFileSync(resolve(out,'trials',trial+'.json'),JSON.stringify(metrics,null,2)+'\n');
writeFileSync(resolve(out,'metrics.json'),JSON.stringify(metrics,null,2)+'\n');
const gates=checkSolo('Q2',metrics),lines=gates.map(format);
lines.push(`TOTAL ${gates.filter(g=>g.pass).length} PASS / ${gates.filter(g=>!g.pass).length} FAIL / ${gates.length} gates`);
writeFileSync(resolve(out,'check-current.log'),lines.join('\n')+'\n');
writeFileSync(resolve(out,'trials',trial+'-gates.log'),lines.join('\n')+'\n');
console.log(lines.filter(line=>line.startsWith('FAIL')||line.startsWith('TOTAL')).join('\n'));
process.exitCode=gates.every(g=>g.pass)?0:1;
