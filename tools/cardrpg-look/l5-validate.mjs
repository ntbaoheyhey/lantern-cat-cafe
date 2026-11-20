// Phase acceptance only after all reviewed L5 models/portraits are committed.
// Pilot captures remain separate. The full timing matrix belongs to L7.
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withTimingLock} from './lock.mjs';
const out='reports/cardrpg-look/validation/l5';
const cats='panko,mallow,cinnamon,biscuit,inkcap,sorrel,brioche,velvet,marigold';
const opponents='button-guard,sock-skipper,spool-ram,needle-moth,teacup-healer,crumb-sentinel,pollen-scout,rain-spool,binding-thread,practice-cushion,yarn-giant,kettle-knight,pantry-crown';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const run=(script,args=[],env={})=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[script,...args],{stdio:'inherit',env:{...process.env,...env}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${script}: ${code}`)));
});
await mkdir(out,{recursive:true});
assert(!await access(`${out}/phase-source.json`).then(()=>true,()=>false),'Preserve existing phase evidence; use an explicit continuation after inspecting any failure');
// Review inventory must describe the exact raw and packed sources before any
// acceptance workload is queued. No existence-only visual approval.
const selection=JSON.parse(await readFile(`${out}/selection.json`));
assert.equal(selection.rows.length,22);
assert.deepEqual(selection.rows.map(r=>r.owner).sort(),`${cats},${opponents}`.split(',').sort());
for(const row of selection.rows){
 assert.equal(row.reviewed,true,row.owner);
 assert.equal(hash(await readFile(row.raw)),row.rawSha256,row.raw);
 assert.equal(hash(await readFile(row.packed)),row.packedSha256,row.packed);
 assert(row.reviews.length>=2,row.owner);
 for(const path of row.reviews)assert((await readFile(path,'utf8')).trim().length>100,path);
}
await withTimingLock('LOOK L5 committed offline build',()=>run('tools/cardrpg-look/build.mjs'));
const build=JSON.parse(await readFile('docs/cardrpg-look/build.json'));
assert.equal(build.runtimeDirty,false,'Commit all runtime inputs before phase acceptance');
assert.equal(hash(await readFile('docs/cardrpg-look/index.html')),build.sha256);
await writeFile(`${out}/phase-source.json`,JSON.stringify({build,selectionSha256:hash(await readFile(`${out}/selection.json`))},null,2)+'\n',{flag:'wx'});
const verify=async()=>{
 assert.equal(hash(await readFile('docs/cardrpg-look/index.html')),build.sha256,'Phase artifact changed');
 for(const [path,expected] of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(path)),expected,path);
};
for(const [kind,directory] of [['raw','models'],['packed','game-models']]){
 await run('tools/cardrpg-look/rig-audit.mjs',[],{LOOK_OWNERS:`${cats},${opponents}`,LOOK_MODEL_DIR:`assets/cardrpg-look/${directory}`,LOOK_AUDIT_OUT:`${out}/phase-rig-${kind}.json`});
}
await run('tools/cardrpg-look/motion-rig-probe.mjs',[],{BIG_OWNERS:cats,BIG_RIG_OUT:`${out}/phase-motion-rig`});
await verify();
await run('tools/cardrpg-look/capture.mjs',[],{LOOK_ARTIFACT:'docs/cardrpg-look/index.html',LOOK_OUT:`${out}/phase-stills`,LOOK_OWNERS:`${cats},${opponents}`,LOOK_KINDS:'unit',LOOK_SIZES:'[[1024,600],[1280,720],[1440,900]]',LOOK_TIME:'3.2'});
await run('tools/cardrpg-look/pose-capture.mjs',[],{LOOK_ARTIFACT:'docs/cardrpg-look/index.html',LOOK_OUT:`${out}/phase-cat-poses`,LOOK_OWNERS:cats});
await run('tools/cardrpg-look/opponent-pose-capture.mjs',[],{LOOK_ARTIFACT:'docs/cardrpg-look/index.html',LOOK_OUT:`${out}/phase-opponent-poses`,LOOK_OWNERS:opponents});
for(const kind of ['cat','opponent']){
 const poses=JSON.parse(await readFile(`${out}/phase-${kind}-poses/poses.json`));
 assert.equal(poses.sha256,build.sha256);
 for(const sample of poses.rows){
  assert.equal(sample.actualClip,sample.id);
  assert.equal(sample.model.lookV2,true);
  assert.equal(sample.framingPass,true,`${sample.id}@${sample.progress}: gallery framing`);
  assert.deepEqual(sample.errors,[]);
 }
}
await run('tools/cardrpg-look/art-gallery.mjs');
await run('tools/cardrpg-look/art-browser-check.mjs',[],{LOOK_ART_BROWSER_OUT:`${out}/art-browser`});
for(const [width,height] of [[1024,600],[1280,720],[1440,900]])for(const dpr of [1,2]){
 await withTimingLock(`LOOK L5 portraits ${width}/DPR${dpr}`,()=>run('tools/cardrpg-look/art-runtime-check.mjs',[],{
  BIG_ARTIFACT:'docs/cardrpg-look/index.html',LOOK_PORTRAIT_SHA:build.sha256,
  LOOK_PORTRAIT_CONFIG:`${width},${height},${dpr}`,LOOK_PORTRAIT_OUT:`${out}/portraits-${width}-dpr${dpr}`
 }));
}
await verify();
await run('tools/cardrpg-look/gates.mjs',['l5']);
await verify();
await run('tools/cardrpg-look/phase-measure.mjs',['l5']);
await verify();
console.log(JSON.stringify({phase:'L5',artifact:build.sha256,bytes:build.bytes,status:'Measurements complete; personal phase capture review and independent audit required'}));
