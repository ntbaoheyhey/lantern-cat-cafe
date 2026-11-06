import { existsSync } from 'node:fs';
// REFERENCE: tools/cardrpg-big2/{with-timing-lock,measure,skill-measure}.mjs
import {spawn} from 'node:child_process';
import {cp} from 'node:fs/promises';
const artifact='/tmp/cardrpg-big2-b3-index.html', out='reports/cardrpg-big2/stage';
async function run(script,args=[],env={},cwd=process.cwd()) {
 const code=await new Promise((resolve,reject)=>{const c=spawn(process.execPath,[script,...args],{cwd,env:{...process.env,BIG_ARTIFACT:artifact,...env},stdio:'inherit'});c.once('error',reject);c.once('close',resolve)});
 if(code!==0)throw Error(`${script}: ${code}`);
}
const validation='/tmp/cardrpg-big2-stage-validation';
await run('tools/cardrpg-big2/validate.mjs',['b3-e2e'],{BIG_VALIDATE_STEPS:'e2e'},validation);
for(const file of ['b3-e2e.json','b3-e2e-e2e.log'])await cp(`${validation}/reports/cardrpg-big2/validation/${file}`,`reports/cardrpg-big2/validation/${file}`);
await run('tools/cardrpg-big/inspect.mjs',[],{BIG_ARTIFACT:'/tmp/cardrpg-big2-b2c-index.html',BIG_CROP_OUT:`${out}/before`});
await run('tools/cardrpg-big/inspect.mjs',[],{BIG_CROP_OUT:`${out}/after`});
await run('tools/cardrpg-big2/sharpness-check.mjs');
await new Promise((done,reject)=>{const c=spawn('/tmp/cardrpg-big-tools/bin/python',['tools/cardrpg-big2/sharpness-report.py'],{stdio:'inherit'});c.once('error',reject);c.once('close',code=>code===0?done():reject(Error('Sharpness metric failed')));});
await run('tools/cardrpg-big2/layout-measure.mjs',[],{BIG_LAYOUT_OUT:`${out}/layout`});
await run('tools/cardrpg-big2/stage-life-check.mjs');
await run('tools/cardrpg-big2/measure.mjs',[],{BIG_OUT:`${out}/cold`,BIG_CAPTURE:'0'});
await run('tools/cardrpg-big2/lifecycle.mjs',[],{BIG_LIFECYCLE_OUT:`${out}/lifecycle`});
await run('tools/cardrpg-big/meta-lifecycle.mjs',[],{BIG_LIFECYCLE_OUT:`${out}/navigation`});
if (!existsSync('/tmp/cardrpg-big2-defer-matrices')) {
await run('tools/cardrpg-big2/skill-measure.mjs',[],{BIG_SKILL_OUT:`${out}/skills`});
await run('tools/cardrpg-big/skill-report.mjs',[`${out}/skills`]);
await run('tools/cardrpg-big/profile-skills.mjs',[`${out}/skills`]);

} else console.log(JSON.stringify({matrixDeferred: true, artifact, out, phase: typeof phase === 'undefined' ? 'b3' : phase}));
