// One sequential coordinator; no model calls, no final matrix.
import {spawn} from 'node:child_process';
const run=(command,args=[],env={})=>new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:'inherit',env:{...process.env,...env}});child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${command} ${args.join(' ')} exited${code}`)))});
await run(process.execPath,['tools/cardrpg-look/build.mjs']);
await run(process.execPath,['tools/cardrpg-look/l3-check.mjs']);
await run(process.execPath,['tools/cardrpg-look/post-check.mjs']);
await run('/Users/bao/tools/cardrpg-look/venv/bin/python',['tools/cardrpg-look/metrics/post.py','reports/cardrpg-look/validation/l3/post']);
await run(process.execPath,['tools/cardrpg-look/loading-check.mjs']);
await run(process.execPath,['tools/cardrpg-look/gates.mjs','l3']);
await run(process.execPath,['tools/cardrpg-look/phase-measure.mjs','l3']);
await run(process.execPath,['tools/cardrpg-look/l3-audit.mjs']);
