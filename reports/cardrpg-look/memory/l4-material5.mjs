// Targeted review of the observed hollow-lantern and pale-flame issues.
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {withTimingLock} from '../../../tools/cardrpg-look/lock.mjs';
const out='reports/cardrpg-look/rounds/effects/round-5-material';await mkdir(out);
const run=(command,args,env={})=>new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:'inherit',env:{...process.env,...env}});child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${command}: ${code}`)))});
const node=process.execPath,python='/Users/bao/tools/cardrpg-look/venv/bin/python',before='reports/cardrpg-look/rounds/effects/before-all';
await withTimingLock('LOOK L4 lantern and flame targeted build',()=>run(node,['tools/cardrpg-look/build.mjs']));
const artifact='/tmp/cardrpg-look-l4-material5.html';await copyFile('docs/cardrpg-look/index.html',artifact);await copyFile('docs/cardrpg-look/build.json',`${out}/build.json`);
const data=JSON.parse(await readFile(`${before}/captures.json`));
const ids=data.rows.filter(r=>/^(mochi|soot|clover)-[1-4]$/.test(r.id)||r.recipe.layers.some(l=>['lantern','flame','ember'].includes(l.primitive))).map(r=>r.id);
await writeFile(`${out}/targets.json`,JSON.stringify({reason:'All12hero skills plus every captured recipe using the changed lantern/flame/ember primitives',ids},null,2)+'\n');
await run(node,['tools/cardrpg-look/l4-check.mjs'],{BIG_ARTIFACT:artifact,LOOK_OUT:`${out}/gpu`});
await run(node,['tools/cardrpg-look/l4-loading-check.mjs'],{BIG_ARTIFACT:artifact,LOOK_OUT:`${out}/cancellation`});
await run(node,['tools/cardrpg-look/effect-series.mjs'],{BIG_ARTIFACT:artifact,LOOK_EFFECT_OUT:out,LOOK_EFFECT_IDS:ids.join(',')});
await run(python,['tools/cardrpg-look/metrics/effect-review.py',out,'--before',before]);
await writeFile(`${out}/pilot-complete.json`,JSON.stringify({at:new Date().toISOString(),reviewed:false,notPhaseAcceptance:true},null,2)+'\n');
