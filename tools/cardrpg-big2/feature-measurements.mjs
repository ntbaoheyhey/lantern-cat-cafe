import { existsSync } from 'node:fs';
// Run only inside the shared timing lock, on a pinned source archive and HTML.
import {spawn} from 'node:child_process';
import {cp,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const phase=process.env.BIG_PHASE;if(!['b5','b4','enemies','delivery'].includes(phase))throw Error('Known phase required');
const artifact=`/tmp/cardrpg-big2-${phase}-index.html`,out=`reports/cardrpg-big2/${phase}`;
async function run(script,args=[],env={},cwd=process.cwd()){
 const code=await new Promise((resolve,reject)=>{const c=spawn(process.execPath,[script,...args],{cwd,env:{...process.env,BIG_ARTIFACT:artifact,...env},stdio:'inherit'});c.once('error',reject);c.once('close',resolve)});if(code!==0)throw Error(`${script}: ${code}`);
}
const validation=`/tmp/cardrpg-big2-${phase}-validation`;
if(process.env.BIG_FEATURE_RESUME==='1'){
 const prior=JSON.parse(await readFile(`${validation}/reports/cardrpg-big2/validation/${phase}-e2e.json`,'utf8'));
 assert.ok(prior.some(r=>r.name==='e2e'&&r.exit===0&&r.counts.some(c=>/421 passed/.test(c))));
}else await run('tools/cardrpg-big2/validate.mjs',[`${phase}-e2e`],{BIG_VALIDATE_STEPS:'e2e'},validation);
for(const f of [`${phase}-e2e.json`,`${phase}-e2e-e2e.log`])await cp(`${validation}/reports/cardrpg-big2/validation/${f}`,`reports/cardrpg-big2/validation/${f}`);
if(phase==='b5')await run('tools/cardrpg-big2/mechanics-check.mjs');
if(phase==='b4')await run('tools/cardrpg-big2/audio-check.mjs');
await run('tools/cardrpg-big2/measure.mjs',[],{BIG_OUT:`${out}/cold`,BIG_CAPTURE:'0'});
if (!existsSync('/tmp/cardrpg-big2-defer-matrices')) {
await run('tools/cardrpg-big2/skill-measure.mjs',[],{BIG_SKILL_OUT:`${out}/skills`});
await run('tools/cardrpg-big/skill-report.mjs',[`${out}/skills`]);
await run('tools/cardrpg-big/profile-skills.mjs',[`${out}/skills`]);

} else console.log(JSON.stringify({matrixDeferred: true, artifact, out, phase: typeof phase === 'undefined' ? 'b3' : phase}));
