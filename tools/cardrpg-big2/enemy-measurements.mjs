import { existsSync } from 'node:fs';
// Pinned enemy-batch source/browser proof. Execute only under with-timing-lock.mjs.
import {spawn} from 'node:child_process';
import {cp} from 'node:fs/promises';
const phase=process.env.BIG_PHASE;
if(!/^e[1-4]$|^boss$/.test(phase))throw Error('Enemy phase required');
const owners={e1:'button-guard,sock-skipper,spool-ram',e2:'needle-moth,teacup-healer,kettle-knight',e3:'binding-thread,practice-cushion,pollen-scout',e4:'crumb-sentinel',boss:'yarn-giant,rain-spool,pantry-crown'}[phase];
const artifact=`/tmp/cardrpg-big2-${phase}-index.html`,out=`reports/cardrpg-big2/enemies/${phase}`;
async function run(script,args=[],env={},cwd=process.cwd()){
 const exit=await new Promise((done,reject)=>{const c=spawn(process.execPath,[script,...args],{cwd,env:{...process.env,BIG_ARTIFACT:artifact,BIG_OWNERS:owners,...env},stdio:'inherit'});c.once('error',reject);c.once('close',done)});if(exit!==0)throw Error(`${script}: ${exit}`);
}
const validation=`/tmp/cardrpg-big2-${phase}-validation`;
await run('tools/cardrpg-big2/validate.mjs',[`${phase}-e2e`],{BIG_VALIDATE_STEPS:'e2e'},validation);
for(const f of [`${phase}-e2e.json`,`${phase}-e2e-e2e.log`])await cp(`${validation}/reports/cardrpg-big2/validation/${f}`,`reports/cardrpg-big2/validation/${f}`);
await run('tools/cardrpg-big2/gallery-filmstrips.mjs',[],{BIG_NEW_OWNERS:owners,BIG_ENEMY_BATCH:'1',BIG_BEFORE_OUT:`${out}/before`});
await run('tools/cardrpg-big2/motion-measure.mjs',[],{BIG_MOTION_OUT:`${out}/motion`,BIG_FILMSTRIP_OUT:`${out}/filmstrips`,BIG_PROVENANCE:`assets/provenance/cardrpg-big2-motion-${phase}.json`});
if(phase==='boss')await run('tools/cardrpg-big2/boss-measure.mjs');
await run('tools/cardrpg-big2/effect-measure.mjs',[],{BIG_EFFECT_OUT:`${out}/effects`});
await run('tools/cardrpg-big2/measure.mjs',[],{BIG_OUT:`${out}/cold`,BIG_CAPTURE:'0'});
if (!existsSync('/tmp/cardrpg-big2-defer-matrices')) {
await run('tools/cardrpg-big2/skill-measure.mjs',[],{BIG_SKILL_OUT:`${out}/skills`});
await run('tools/cardrpg-big/skill-report.mjs',[`${out}/skills`]);
await run('tools/cardrpg-big/profile-skills.mjs',[`${out}/skills`]);

} else console.log(JSON.stringify({matrixDeferred: true, artifact, out, phase: typeof phase === 'undefined' ? 'b3' : phase}));
