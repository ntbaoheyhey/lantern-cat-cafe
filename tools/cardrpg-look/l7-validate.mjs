// Final presentation acceptance, before freezing the one exhaustive matrix.
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,open,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withTimingLock} from './lock.mjs';
const out='reports/cardrpg-look/validation/l7';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const run=(script,args=[],env={})=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[script,...args],{stdio:'inherit',env:{...process.env,...env}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${script}: ${code}`)));
});
await mkdir(out,{recursive:true});
assert(!await access(`${out}/phase-source.json`).then(()=>true,()=>false),'Inspect and preserve any previous acceptance attempt before an explicit continuation');
await withTimingLock('LOOK L7 committed offline build',()=>run('tools/cardrpg-look/build.mjs'));
const build=JSON.parse(await readFile('docs/cardrpg-look/build.json'));
assert.equal(build.runtimeDirty,false,'Commit all runtime inputs first');
assert(build.bytes<=32000000,'Do not exceed the authorized 32MB ceiling');
await writeFile(`${out}/phase-source.json`,JSON.stringify({build},null,2)+'\n',{flag:'wx'});
const verify=async()=>{
 assert.equal(hash(await readFile('docs/cardrpg-look/index.html')),build.sha256);
 for(const [path,want]of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(path)),want,path);
};
await verify();
await withTimingLock('LOOK L7 demo tools typecheck',async()=>{
 const logPath=`${out}/demo-types.log`,log=await open(logPath,'wx'),startedAt=new Date().toISOString();
 let code;
 try{code=await new Promise((resolve,reject)=>{
  const child=spawn('pnpm',['--filter','@taskbar-hero/web','exec','tsc','--noEmit','--project','../../tools/cardrpg-look/tsconfig.json'],{stdio:['ignore',log.fd,log.fd]});
  child.once('error',reject);child.once('close',resolve);
 });}finally{await log.close();}
 await writeFile(`${out}/demo-types.json`,JSON.stringify({code,startedAt,endedAt:new Date().toISOString(),log:logPath,logSha256:hash(await readFile(logPath))},null,2)+'\n');
 assert.equal(code,0,'Demo tools typecheck');
});
await run('tools/cardrpg-look/art-gallery.mjs');
await run('tools/cardrpg-look/art-browser-check.mjs',[],{LOOK_ART_BROWSER_OUT:`${out}/art-browser`});
await run('tools/cardrpg-look/atelier-check.mjs');
await verify();
await run('tools/cardrpg-look/gates.mjs',['l7']);
await verify();
console.log(JSON.stringify({phase:'L7',source:build.head,artifact:build.sha256,bytes:build.bytes,status:'UI/source checks complete; personal review and explicit freeze still required before measurements'}));
