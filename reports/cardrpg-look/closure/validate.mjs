// Targeted closure only. The completed L7 matrix is never repeated.
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { withTimingLock } from '../../../tools/cardrpg-look/lock.mjs';
const out='reports/cardrpg-look/closure';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const build=JSON.parse(await readFile('docs/cardrpg-look/build.json'));
assert.equal(build.head.slice(0,9),'8ba0a3879');assert.equal(build.runtimeDirty,false);
const verify=async()=>{
  assert.equal(hash(await readFile('docs/cardrpg-look/index.html')),build.sha256);
  for(const [path,want] of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(path)),want,path);
};
await verify();
const run=(script,args=[],env={})=>new Promise((done,fail)=>{
  const child=spawn(process.execPath,[script,...args],{stdio:'inherit',env:{...process.env,...env}});
  child.on('error',fail);child.on('close',code=>code===0?done():fail(Error(`${script} exited ${code}`)));
});
await writeFile(`${out}/validation-start.json`,JSON.stringify({at:new Date().toISOString(),pid:process.pid,sha256:build.sha256,source:build.head},null,2),{flag:'wx'});
await withTimingLock('LOOK closure six authored effects',()=>run('tools/cardrpg-look/capture-effects.mjs',[],{
  BIG_ARTIFACT:'docs/cardrpg-look/index.html',BIG_EFFECT_OUT:`${out}/effects/reviewed`,LOOK_EFFECT_IDS:'clover-4,enemy:yarn-giant,mochi-4,panko-4,brioche-4,soot-3'}));
await verify();
await run('tools/cardrpg-look/presentation-check.mjs',[],{LOOK_OUT:`${out}/presentation/reviewed`});
await verify();
await run('tools/cardrpg-look/phase-measure.mjs',['closure']);
await verify();
await withTimingLock('LOOK closure original four missed skills',()=>run('tools/cardrpg-big2/skill-measure.mjs',[],{
  BIG_ARTIFACT:'docs/cardrpg-look/index.html',BIG_SKILL_OUT:`${out}/perf-after`,BIG_SKILL_IDS:'panko-1,cinnamon-4,brioche-4,velvet-1',BIG_SKILL_CONFIGS:'[[1440,900,1,4,"medium"]]',BIG_SKILL_PROFILE:'1'}));
await verify();
await run('tools/cardrpg-look/lifecycle.mjs',[],{BIG_ARTIFACT:'docs/cardrpg-look/index.html',BIG_LIFECYCLE_OUT:`${out}/lifecycle20`});
await verify();
await writeFile(`${out}/validation-complete.json`,JSON.stringify({at:new Date().toISOString(),sha256:build.sha256,source:build.head,sourceInputs:Object.keys(build.sourceHashes).length},null,2));
