// Registered, bounded ABBA comparison prompted by new Clover1 stalls.
// Not a repeat of the completed 860-case matrix or a retry-until-pass loop.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { withTimingLock } from '../../../tools/cardrpg-look/lock.mjs';
const out='reports/cardrpg-look/closure/paired-cast';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const build=JSON.parse(await readFile('docs/cardrpg-look/build.json'));
assert.equal(JSON.parse(await readFile('reports/cardrpg-look/closure/validation-complete.json')).sha256,build.sha256);
const before=execFileSync('git',['show','29699ca45:docs/cardrpg-look/index.html'],{maxBuffer:40*1024*1024});
assert.equal(hash(before),'39645d319c264bac0c1011d0e5370de335281ebf6e1df64de67978e34bcb4133');
const beforePath='/tmp/cardrpg-look-closure-paired-before.html';
await writeFile(beforePath,before);
const afterPath='docs/cardrpg-look/index.html';
assert.equal(hash(await readFile(afterPath)),build.sha256);
let plan={registeredAt:new Date().toISOString(),reason:'New closure Clover1 High/DPR1 first-cast633.3ms gap, with cold trace showing GPU command waits/presentation backpressure. Separate source effect from current environment without discarding failures.',
  order:['before','after','after','before'],skill:'clover-1',config:[1280,720,1,1,'high'],before:hash(before),after:build.sha256,
  method:'Exactly four fresh-context observations in registered ABBA order; first/repeat retained, CPU/GPU profile on. Same current harness, viewport, tier and machine under one shared-lock window. No confidence/causal root-cause or exclusive-device claim from two samples per artifact.'};
if (!process.argv.includes('--audit-only')) {
await mkdir(out,{recursive:true});await writeFile(`${out}/plan.json`,JSON.stringify(plan,null,2),{flag:'wx'});
await withTimingLock('LOOK closure registered Clover1 ABBA',async()=>{
  for(const [i,variant] of plan.order.entries()){
    await new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,['tools/cardrpg-big2/skill-measure.mjs'],{stdio:'inherit',env:{...process.env,
        BIG_ARTIFACT:variant==='before'?beforePath:afterPath,BIG_SKILL_OUT:`${out}/${i+1}-${variant}`,
        BIG_SKILL_IDS:plan.skill,BIG_SKILL_CONFIGS:JSON.stringify([plan.config]),BIG_SKILL_PROFILE:'1'}});
      child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(`ABBA${i+1} exited${code}`)));
    });
  }
});
} else {
  plan=JSON.parse(await readFile(`${out}/plan.json`));
  assert.deepEqual(plan.order,['before','after','after','before']);
  assert.equal(plan.before,hash(before));assert.equal(plan.after,build.sha256);
}
const observations=[];
for(const [i,variant] of plan.order.entries()){
  const path=`${out}/${i+1}-${variant}/summary.json`,summary=JSON.parse(await readFile(path));
  assert.equal(summary.sha256,plan[variant]);assert.ok(Number.isFinite(Date.parse(summary.ended)) && Date.parse(summary.ended)>=Date.parse(summary.started));assert.equal(summary.rows.length,1);
  assert.deepEqual(summary.rows[0].errors,[]);assert.equal(summary.rows[0].name,'1280x720-dpr1-cpu1-high-clover-1');assert.deepEqual(summary.rows[0].casts.map(c=>c.use),['first','repeat']);
  observations.push({order:i+1,variant,path,sha256:hash(await readFile(path)),casts:summary.rows[0].casts.map(c=>({use:c.use,...c.summary})),pageOpen:summary.rows[0].pageOpen});
}
assert.equal(hash(await readFile(afterPath)),build.sha256);
await writeFile(`${out}/comparison.json`,JSON.stringify({plan,observations},null,2));
console.log(JSON.stringify(observations.map(r=>({order:r.order,variant:r.variant,casts:r.casts.map(c=>({use:c.use,max:c.max,p95:c.p95,within20:c.within20}))}))));
