// Run after personally reviewing all six round3 atlases and focused source checks.
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {withTimingLock} from '../../../tools/cardrpg-look/lock.mjs';
const out='reports/cardrpg-look/rounds/effects/round-4-material';
const reviewed=JSON.parse(await readFile('reports/cardrpg-look/rounds/flipbooks/round-3/packed.json'));
if(!reviewed.reviewed)throw Error('Review all six original atlases before building this pilot');
await mkdir(out); // Existing output means a retry needs its own preserved directory.
const run=(command,args,env={})=>new Promise((resolve,reject)=>{
 const child=spawn(command,args,{stdio:'inherit',env:{...process.env,...env}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${command}: ${code}`)));
});
const node=process.execPath,python='/Users/bao/tools/cardrpg-look/venv/bin/python';
await withTimingLock('LOOK L4 material4 pilot build',()=>run(node,['tools/cardrpg-look/build.mjs']));
const artifact='/tmp/cardrpg-look-l4-material4.html';
await copyFile('docs/cardrpg-look/index.html',artifact);await copyFile('docs/cardrpg-look/build.json',`${out}/build.json`);
const before='reports/cardrpg-look/rounds/effects/before-all';
const ids=JSON.parse(await readFile(`${before}/captures.json`)).rows.map(row=>row.id);
await run(node,['tools/cardrpg-look/l4-check.mjs'],{BIG_ARTIFACT:artifact,LOOK_OUT:`${out}/gpu`});
await run(node,['tools/cardrpg-look/l4-loading-check.mjs'],{BIG_ARTIFACT:artifact,LOOK_OUT:`${out}/cancellation`});
await run(node,['tools/cardrpg-look/effect-series.mjs'],{BIG_ARTIFACT:artifact,LOOK_EFFECT_OUT:out,LOOK_EFFECT_IDS:ids.join(',')});
await run(python,['tools/cardrpg-look/metrics/effect-review.py',out,'--before',before]);
await writeFile(`${out}/pilot-complete.json`,JSON.stringify({at:new Date().toISOString(),reviewed:false,notPhaseAcceptance:true},null,2)+'\n');
