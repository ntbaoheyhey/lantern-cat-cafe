// Run only after art review, owned source commit and accepted-A reconciliation.
// A single immutable runtime artifact; final L7 matrix is intentionally absent.
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {withTimingLock} from '../../../tools/cardrpg-look/lock.mjs';
const out='reports/cardrpg-look/validation/l4';
const run=(command,args=[],env={})=>new Promise((resolve,reject)=>{
 const child=spawn(command,args,{stdio:'inherit',env:{...process.env,...env}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${command} ${args.join(' ')}: ${code}`)));
});
const node=process.execPath,python='/Users/bao/tools/cardrpg-look/venv/bin/python';
await withTimingLock('LOOK L4 committed phase build',()=>run(node,['tools/cardrpg-look/build.mjs']));
const build=JSON.parse(await readFile('docs/cardrpg-look/build.json'));
if(build.runtimeDirty)throw Error('Commit runtime inputs before final phase validation');
const before='reports/cardrpg-look/rounds/effects/before-all';
const ids=JSON.parse(await readFile(`${before}/captures.json`)).rows.map(r=>r.id);
if(ids.length!==67||new Set(ids).size!==67)throw Error('Expected67unique L4 targets');
await run(node,['tools/cardrpg-look/effect-series.mjs'],{LOOK_EFFECT_OUT:`${out}/captures`,LOOK_EFFECT_IDS:ids.join(',')});
await run(python,['tools/cardrpg-look/metrics/effect-review.py',`${out}/captures`,'--before',before]);
await run(node,['tools/cardrpg-look/l3-check.mjs'],{LOOK_OUT:`${out}/functional`});
await run(node,['tools/cardrpg-look/l4-check.mjs']);
await run(node,['tools/cardrpg-look/post-check.mjs'],{LOOK_OUT:`${out}/post`});
await run(python,['tools/cardrpg-look/metrics/post.py',`${out}/post`]);
await run(node,['tools/cardrpg-look/l4-loading-check.mjs']);
await run(node,['tools/cardrpg-look/gates.mjs','l4']);
await run(node,['tools/cardrpg-look/phase-measure.mjs','l4']);
await run(node,['tools/cardrpg-look/l4-audit.mjs']);
