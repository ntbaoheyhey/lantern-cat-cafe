// Continue only the uncompleted steps after the preserved legacy idle-loop timeout.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,writeFile,open,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {withTimingLock} from '../../../tools/cardrpg-look/lock.mjs';
const out='reports/cardrpg-look/validation/l5';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const build=JSON.parse(await readFile(`${out}/phase-source.json`)).build;
const verify=async()=>{
 assert.equal(hash(await readFile('docs/cardrpg-look/index.html')),build.sha256);
 for(const [path,want]of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(path)),want,path);
};
await verify();
assert(!await access(`${out}/flag-off/checks.json`).then(()=>true,()=>false),'Do not duplicate completed phase measurements');
const run=(command,args,options={})=>new Promise((resolve,reject)=>{
 const child=spawn(command,args,{stdio:'inherit',env:process.env,...options});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${command}: ${code}`)));
});
const gates=JSON.parse(await readFile(`${out}/source-gates.json`));
assert(gates.slice(0,4).every(row=>row.code===0));assert.equal(gates[4].code,1);
const originalLog=await readFile(`${out}/attempts/e2e-1/e2e-resume.log`,'utf8');
assert(originalLog.includes('420 passed')&&originalLog.includes('1 failed'));
assert(originalLog.includes('s3-walkthrough.spec.ts:52:63'));
const logPath=`${out}/e2e-focused-retry.log`,startedAt=new Date().toISOString();
await withTimingLock('LOOK L5 retry one legacy idle-loop XP case',async()=>{
 const log=await open(logPath,'wx');
 try{await run('caffeinate',['-dimsu','pnpm','--filter','@taskbar-hero/web','exec','playwright','test','e2e/qa/s3-walkthrough.spec.ts','--project=stage-layout','--grep','idle loop accrues fish and XP across claims without double-pay','--workers=1'],{
  stdio:['ignore',log.fd,log.fd],env:{...process.env,E2E_PORT_CLASSIC:'5920',E2E_PORT_V2:'5921',E2E_PORT_SERVER:'5922',E2E_PORT_API:'5923'}
 });}finally{await log.close();}
});
await verify();
const retryLog=await readFile(logPath,'utf8');assert(retryLog.includes('1 passed'));
const closure={source:build.head,artifact:build.sha256,code:0,singleRunPass:false,
 method:'Source and timeout unchanged. Original suite420 passed/1legacy idle-loop timeout; exactly that case passes a focused single-worker retry. Aggregate421-case coverage, not a clean421-case single run.',
 attempts:[{log:`${out}/attempts/e2e-1/e2e-resume.log`,sha256:hash(originalLog),code:1,passed:420,failed:1},
  {log:logPath,sha256:hash(retryLog),code:0,passed:1,failed:0,startedAt,endedAt:new Date().toISOString()}]};
await writeFile(`${out}/e2e-acceptance.json`,JSON.stringify(closure,null,2)+'\n',{flag:'wx'});
gates[4]={...gates[4],code:0,log:`${out}/e2e-acceptance.json`,singleRunPass:false,attempts:closure.attempts};
await writeFile(`${out}/source-gates.json`,JSON.stringify(gates,null,2)+'\n');console.log(JSON.stringify(closure));
await run('caffeinate',['-dimsu',process.execPath,'tools/cardrpg-look/phase-measure.mjs','l5']);
await verify();
await run(process.execPath,['tools/cardrpg-look/l5-audit.mjs']);
