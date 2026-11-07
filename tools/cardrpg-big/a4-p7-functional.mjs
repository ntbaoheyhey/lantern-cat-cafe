// REFERENCE: delivery-functional.mjs. Full ten-group pack on one final artifact; v4-owned adapters.
// REFERENCE: memory/PROMPT.md F7; integration/delivery/run.sh. Non-model sequential checks.
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, open } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
// Short browser windows yield at least 6.5s; CPU-heavy source gates retain 120s.
const handoffMs=Number(process.env.BIG_P7_HANDOFF_MS||30000);
assert(Number.isFinite(handoffMs)&&handoffMs>=6500);
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const out = process.env.BIG_FUNCTIONAL_OUT || 'reports/cardrpg-big/integration/delivery';
const expected = process.env.BIG_FUNCTIONAL_SHA || '9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3';
const hash = async () => createHash('sha256').update(await readFile(artifact)).digest('hex');
const steps = [
 ['studio','tools/cardrpg-big2/studio-check.mjs',{BIG_STUDIO_OUT:`${out}/studio`,BIG_STUDIO_EXPECT_SOUND:'1'}],
 ['gallery','tools/cardrpg-big2/gallery-controls-check.mjs',{BIG_GALLERY_CONTROLS_OUT:`${out}/gallery`,BIG_GALLERY_EXPECT_POLISH:'1',BIG_GALLERY_EXPECT_FIT:'1',BIG_GALLERY_EXPECT_FOCUS:'1',BIG_GALLERY_EXPECT_FOCUS_CONTRAST:'1'}],
 ['comparisons','tools/cardrpg-big/comparison-check.mjs',{BIG_COMPARISON_OUT:`${out}/comparisons`}],
 ['lab','tools/cardrpg-big/lab-check.mjs',{BIG_LAB_OUT:`${out}/lab`}],
 ['meta','tools/cardrpg-big/a4-p7-meta.mjs',{BIG_META_OUT:`${out}/meta`}],
 ['reveal','tools/cardrpg-big/reveal-check.mjs',{BIG_REVEAL_OUT:`${out}/reveal`}],
 ['invitations','tools/cardrpg-big/invitation-check.mjs',{BIG_INVITE_OUT:`${out}/invitations`}],
 ['designs','tools/cardrpg-big/a4-p7-designs.mjs',{BIG_DESIGN_OUT:`${out}/designs`}],
 ['path','tools/cardrpg-big/a4-p7-path.mjs',{BIG_PATH_OUT:`${out}/path`}],
 ['mechanics','tools/cardrpg-big2/mechanics-check.mjs',{BIG_LAB_OUT:`${out}/mechanics`,BIG_LAB_EXPECT_POLISH:'1'}],
];
await mkdir(out,{recursive:true});
while (true) {
 const gates = await readFile(process.env.BIG_FUNCTIONAL_GATES || 'reports/cardrpg-big/validation/delivery-v1.json','utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return [];throw e;});
 if (gates.length===5) { assert(gates.every(g=>g.exit===0),'Combined source gates failed');break; }
 await delay(3000);
}
const progress=JSON.parse(await readFile(`${out}/functional.json`,'utf8').catch(error=>{if(error.code==='ENOENT')return JSON.stringify({artifact,sha256:expected,rows:[]});throw error;}));
assert.equal(progress.sha256,expected,'Cannot resume the pack against a different artifact');
assert.equal(progress.artifact,artifact);
// Resume unfinished groups only. Failed attempts stay separate; never recapture a passed group.

for (const [name,script,env] of steps) {
 assert.equal(await hash(),expected);
 const attempts=progress.rows.filter(row=>row.name===name);
 if(attempts.some(row=>row.exit===0))continue;
 assert(attempts.length<3,`Two correction rounds exhausted for ${name}; retain failure and report`);
 const attempt=attempts.length+1, groupOut=attempt===1?`${out}/${name}`:`${out}/retries/${name}/attempt-${attempt}`;
 const actualEnv=Object.fromEntries(Object.entries(env).map(([key,value])=>[key,value===`${out}/${name}`?groupOut:value]));
 const log=attempt===1?`${out}/${name}.log`:`${out}/${name}-retry${attempt-1}.log`,fd=await open(log,'wx');
 const started=new Date().toISOString();
 const exit=await new Promise((done,reject)=>{
  const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`delivery-${name}`,process.execPath,script],{env:{...process.env,BIG_ARTIFACT:artifact,...actualEnv},stdio:['ignore',fd.fd,fd.fd]});
  child.on('error',reject);child.on('close',done);
 });
 await fd.close();assert.equal(await hash(),expected);
 progress.rows.push({name,script,log,exit,attempt,groupOut,started,ended:new Date().toISOString()});
 await writeFile(`${out}/functional.json`,JSON.stringify(progress,null,2));
 console.log(JSON.stringify(progress.rows.at(-1)));
 await delay(handoffMs);
}
assert(steps.every(([name])=>progress.rows.some(r=>r.name===name&&r.exit===0)),'Pack has incomplete groups; retain failed attempts before focused corrections');
