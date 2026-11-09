import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const run=(script,args=[],env={})=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[script,...args],{stdio:'inherit',env:{...process.env,...env}});child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(`${script}: ${code}`)))});
const before=JSON.parse(await readFile('docs/cardrpg-look/build.json','utf8')).sha256;
await run('tools/cardrpg-look/capture.mjs',[],{LOOK_ARTIFACT:'docs/cardrpg-look/index.html',LOOK_OUT:'reports/cardrpg-look/validation/l2/after',LOOK_KINDS:'stage',LOOK_TIME:'3.2'});
await run('tools/cardrpg-look/l2-check.mjs');
await run('tools/cardrpg-look/ab-check.mjs',[],{LOOK_OUT:'reports/cardrpg-look/validation/l2/ab'});
await run('tools/cardrpg-look/phase-measure.mjs',['l2']);
if(JSON.parse(await readFile('docs/cardrpg-look/build.json','utf8')).sha256!==before)throw Error('Runtime artifact changed during checks');
