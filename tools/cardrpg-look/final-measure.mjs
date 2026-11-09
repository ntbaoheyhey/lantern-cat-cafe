// One coordinator; immutable final artifact. No source acceptance is inferred here.
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withTimingLock} from './lock.mjs';
const out='reports/cardrpg-look/validation/l7',video='reports/cardrpg-look/video';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const freeze=JSON.parse(await readFile(`${out}/freeze.json`));
assert.equal(freeze.sourceAccepted,true);
const verify=async()=>{
 assert.equal(hash(await readFile(freeze.artifact)),freeze.sha256);
 for(const [path,want]of Object.entries(freeze.sourceHashes))assert.equal(hash(await readFile(path)),want,path);
};
const run=(script,args=[],env={})=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[script,...args],{stdio:'inherit',env:{...process.env,...env}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${script}: ${code}`)));
});
await mkdir(out,{recursive:true});await verify();
assert(!await access(`${out}/final-measure-start.json`).then(()=>true,()=>false),'An earlier coordinator exists; inspect progress and continue explicitly, never restart all measurements');
await writeFile(`${out}/final-measure-start.json`,JSON.stringify({at:new Date().toISOString(),pid:process.pid,artifact:freeze.sha256},null,2)+'\n',{flag:'wx'});
await run('tools/cardrpg-look/phase-measure.mjs',['l7']);await verify();
for(const target of ['mochi','soot','clover','yarn-giant','ultimate']){
 await withTimingLock(`LOOK final25second showcase ${target}`,()=>run('tools/cardrpg-look/record-showcase.mjs',[],{BIG_ARTIFACT:freeze.artifact,BIG_VIDEO_OUT:`${video}/${target}`,LOOK_VIDEO_TARGET:target}));
 await verify();
}
await run('tools/cardrpg-look/lifecycle.mjs',[],{BIG_ARTIFACT:freeze.artifact,BIG_LIFECYCLE_OUT:`${out}/lifecycle20`});await verify();
await run('tools/cardrpg-look/final-matrix.mjs');await verify();
await writeFile(`${out}/final-measure-complete.json`,JSON.stringify({at:new Date().toISOString(),artifact:freeze.sha256,note:'Measurements completed. Independent raw-data audit and personal video sample review still required.'},null,2)+'\n',{flag:'wx'});
