// Seven cold opens split6+1; per-owner four-skill windows. No exhaustive matrix.
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { withTimingLock } from './lock.mjs';
const phase=process.argv[2]||'l1',out=`reports/cardrpg-look/validation/${phase}`;
await mkdir(out,{recursive:true});
const run=(script,env={},args=[])=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[script,...args],{stdio:'inherit',env:{...process.env,BIG_ARTIFACT:process.cwd()+'/docs/cardrpg-look/index.html',...env}});
 child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(`${script}: ${code}`)));
});
if(process.env.LOOK_FLAG_CHECK!=='0'){
 const env={BIG_FLAG_OFF_OUT:`${out}/flag-off`,BIG_FLAG_OFF_DIST:`/tmp/cardrpg-look-${phase}-flag-off`};
 await withTimingLock(`LOOK ${phase} flag-off build`,()=>run('tools/cardrpg-look/flag-off-check.mjs',env,['--prepare']));
 await withTimingLock(`LOOK ${phase} flag-off browser`,()=>run('tools/cardrpg-look/flag-off-check.mjs',env));
}
const scenarios=[[1280,720,1,1],[1280,720,2,1],[1440,900,1,1],[1440,900,2,1],[1280,720,1,4],[1280,720,2,4],[2560,1440,1,1]];
for(const [index,rows] of [scenarios.slice(0,6),scenarios.slice(6)].entries())await withTimingLock(`LOOK ${phase} cold batch${index+1}`,()=>run('tools/cardrpg-big2/measure.mjs',{BIG_OUT:`${out}/cold-batch-${index+1}`,BIG_SCENARIOS:JSON.stringify(rows),BIG_CAPTURE:'0'}));
for(const cat of ['mochi','soot','clover'])await withTimingLock(`LOOK ${phase} ${cat} first/repeat`,()=>run('tools/cardrpg-big2/skill-measure.mjs',{BIG_SKILL_OUT:`${out}/casts-${cat}`,BIG_SKILL_OWNERS:cat,BIG_SKILL_IDS:[1,2,3,4].map(n=>`${cat}-${n}`).join(','),BIG_SKILL_CONFIGS:'[[1280,720,1,1,"high"]]'}));
const cold=[],casts=[],artifacts=new Set();
for(const name of ['cold-batch-1','cold-batch-2','casts-mochi','casts-soot','casts-clover']){
 const r=JSON.parse(await readFile(`${out}/${name}/summary.json`,'utf8'));artifacts.add(r.sha256);
 (name.startsWith('cold')?cold:casts).push(...r.rows);
}
if(artifacts.size!==1)throw Error('Source artifact changed between measurement batches');
const castRows=casts.flatMap(r=>r.casts),receipt={artifact:[...artifacts][0],coldRuns:cold.length,castWindows:castRows.length,coldInteractiveMs:cold.map(r=>r.loadToInteractiveMs),battleReadyMs:cold.map(r=>r.battleReadyMs),coldMaxMs:Math.max(...cold.map(r=>r.max)),castMaxMs:Math.max(...castRows.map(r=>r.summary.max)),castP95MaxMs:Math.max(...castRows.map(r=>r.summary.p95)),castWithin20Min:Math.min(...castRows.map(r=>r.summary.within20)),errors:cold.concat(casts).flatMap(r=>r.errors)};
await writeFile(`${out}/measurement-summary.json`,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
