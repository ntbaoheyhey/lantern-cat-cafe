// Explicit continuation after the preserved duplicate-name locator failure.
import {spawn} from 'node:child_process';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withTimingLock} from '../../../tools/cardrpg-look/lock.mjs';
const out='reports/cardrpg-look/validation/l7';
const attempt=process.env.LOOK_L7_RESUME_ATTEMPT||'selector-1';
assert(/^selector-\d+$/.test(attempt));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path));
const run=(script,args=[],env={})=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[script,...args],{stdio:'inherit',env:{...process.env,...env}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${script}: ${code}`)));
});
assert(!await access(`${out}/source-gates.json`).then(()=>true,()=>false),'Never repeat completed source gates');
const old=await json(`${out}/attempts/${attempt}/build.json`);
assert.equal(hash(await readFile('docs/cardrpg-look/index.html')),old.sha256);
await writeFile(`${out}/resume-ui-${attempt}-start.json`,JSON.stringify({at:new Date().toISOString(),pid:process.pid,artifact:old.sha256},null,2)+'\n',{flag:'wx'});
await withTimingLock('LOOK L7 selector-only source manifest build',()=>run('tools/cardrpg-look/build.mjs'));
const build=await json('docs/cardrpg-look/build.json');
assert.equal(build.runtimeDirty,false);assert.equal(build.sha256,old.sha256);assert.equal(build.bytes,old.bytes);
assert.deepEqual(Object.keys(build.sourceHashes),Object.keys(old.sourceHashes));
const changed=Object.keys(build.sourceHashes).filter(path=>build.sourceHashes[path]!==old.sourceHashes[path]);
assert.deepEqual(changed,['tools/cardrpg-look/atelier-check.mjs']);
const verify=async()=>{
 assert.equal(hash(await readFile('docs/cardrpg-look/index.html')),build.sha256);
 for(const [path,want]of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(path)),want,path);
};
await verify();
await writeFile(`${out}/phase-source.json`,JSON.stringify({build,continuation:{fromSource:old.head,changed,identicalRuntimeArtifact:true,carriedForward:['demo-types','art-browser','25unit/3chapter windows'],preserved:`attempts/${attempt}`}},null,2)+'\n');
await run('tools/cardrpg-look/atelier-check.mjs',[],{LOOK_ATELIER_RESUME:'units-stages'});
await verify();
await run('tools/cardrpg-look/gates.mjs',['l7']);
await verify();
console.log(JSON.stringify({source:build.head,artifact:build.sha256,complete:true,remaining:'personal UI review then explicit source freeze; no final measurements started'}));
