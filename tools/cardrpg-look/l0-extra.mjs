import { spawn } from 'node:child_process';
import { withTimingLock } from './lock.mjs';
const run=(script,env={},args=[])=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[script,...args],{stdio:'inherit',env:{...process.env,BIG_ARTIFACT:process.cwd()+'/docs/cardrpg3/index.html',...env}});child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(`${script}: ${code}`)))});
await withTimingLock('LOOK L0 flag-off build',()=>run('tools/cardrpg-look/flag-off-check.mjs',{},['--prepare']));
await withTimingLock('LOOK L0 flag-off browser',()=>run('tools/cardrpg-look/flag-off-check.mjs'));
await run('tools/cardrpg-look/capture.mjs',{LOOK_KINDS:'hub',LOOK_OUT:'reports/cardrpg-look/baseline/hub-ready'});
await withTimingLock('LOOK L0 cold7',()=>run('tools/cardrpg-big2/measure.mjs',{BIG_OUT:'reports/cardrpg-look/validation/l0/cold7',BIG_CAPTURE:'0'}));
for(const owner of ['mochi','soot','clover'])await withTimingLock(`LOOK L0 ${owner} casts`,()=>run('tools/cardrpg-big2/skill-measure.mjs',{BIG_SKILL_OUT:`reports/cardrpg-look/validation/l0/casts-${owner}`,BIG_SKILL_OWNERS:owner,BIG_SKILL_IDS:[1,2,3,4].map(n=>`${owner}-${n}`).join(','),BIG_SKILL_CONFIGS:'[[1280,720,1,1,"high"]]'}));
