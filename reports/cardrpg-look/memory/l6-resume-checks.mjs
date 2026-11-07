// Resume after the single unchanged-source legacy Squad timer failure.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,writeFile,open} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {withTimingLock} from '../../../tools/cardrpg-look/lock.mjs';
const out='reports/cardrpg-look/validation/l6';
const hash=b=>createHash('sha256').update(b).digest('hex');
const build=JSON.parse(await readFile('docs/cardrpg-look/build.json'));
assert.equal(hash(await readFile('docs/cardrpg-look/index.html')),build.sha256);
for(const [path,sha] of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(path)),sha,path);
const run=(command,args,options={})=>new Promise((resolve,reject)=>{
 const child=spawn(command,args,{stdio:'inherit',env:process.env,...options});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${command}: ${code}`)));
});
const gates=JSON.parse(await readFile(`${out}/source-gates.json`));
assert(gates.slice(0,4).every(row=>row.code===0));assert.equal(gates[4].code,1);
const originalLog=await readFile(`${out}/attempts/e2e-1/e2e-resume.log`,'utf8');
assert(originalLog.includes('420 passed'));assert(originalLog.includes('1 failed'));
const logPath=`${out}/e2e-focused-retry.log`,startedAt=new Date().toISOString();
await withTimingLock('LOOK L6 retry one legacy Squad timer case',async()=>{
 const log=await open(logPath,'w');
 try{await run('caffeinate',['-dimsu','pnpm','--filter','@taskbar-hero/web','exec','playwright','test','e2e/ui/squad.spec.ts','--project=stage-layout','--grep','a local fight never writes storage or contacts a game API','--workers=1'],{
  stdio:['ignore',log.fd,log.fd],env:{...process.env,E2E_PORT_CLASSIC:'5920',E2E_PORT_V2:'5921',E2E_PORT_SERVER:'5922',E2E_PORT_API:'5923'}
 });}finally{await log.close()}
});
const retryLog=await readFile(logPath,'utf8');assert(retryLog.includes('1 passed'));
const closure={source:build.head,artifact:build.sha256,code:0,
 method:'Unchanged source. Original suite420 passed/1timer timeout; exactly that one case passes focused retry. No timeout increase or test edits. This is aggregate421-case coverage, not a clean421-case single run.',
 attempts:[{log:`${out}/attempts/e2e-1/e2e-resume.log`,sha256:hash(originalLog),code:1,passed:420,failed:1},
  {log:logPath,sha256:hash(retryLog),code:0,passed:1,failed:0,startedAt,endedAt:new Date().toISOString()}]};
await writeFile(`${out}/e2e-acceptance.json`,JSON.stringify(closure,null,2)+'\n');
gates[4]={...gates[4],code:0,log:`${out}/e2e-acceptance.json`,singleRunPass:false,attempts:closure.attempts};
await writeFile(`${out}/source-gates.json`,JSON.stringify(gates,null,2)+'\n');console.log(JSON.stringify(closure));
await run(process.execPath,['reports/cardrpg-look/memory/l6-preview-ready.mjs']);
await run('caffeinate',['-dimsu',process.execPath,'tools/cardrpg-look/phase-measure.mjs','l6']);
await writeFile(`${out}/size-justification.json`,JSON.stringify({artifact:build.sha256,bytes:build.bytes,
 maximumAuthorizedBytes:32000000,originalTargetBytes:24000000,previousL4Bytes:23995962,
 reason:'All12 actual-model portraits now have full-resolution1x/2x exports. 48original skill miniatures and4 static rarity plates are supplied separately for A integration. Nine inherited-model portraits remain labelled; no runtime image resolution was reduced.',
 visualEvidence:['reports/cardrpg-look/rounds/art/before/portraits-dark.png','reports/cardrpg-look/rounds/art/portraits/packed-round-2/portraits-dark.png',
  'reports/cardrpg-look/rounds/art/portraits/packed-round-3/portraits-dark.png',`${out}/art-browser/1280-dark.png`,`${out}/portraits-1280-dpr1/all12-actual-size.png`],assetClasses:build.assetClasses},null,2)+'\n');
await run(process.execPath,['tools/cardrpg-look/l6-audit.mjs']);
