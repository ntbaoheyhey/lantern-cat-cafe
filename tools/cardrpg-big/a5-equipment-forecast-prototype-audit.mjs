// REFERENCE: Equipment41. Audit original prototype receipts without repeating a worker or battle.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='reports/cardrpg-big/a5/e1-equipment-forecast',prep='/tmp/cardrpg-a5-equipment-forecast-41';
const sha=b=>createHash('sha256').update(b).digest('hex'),receipts=[];
const json=async path=>{const b=await readFile(path);receipts.push({path,sha256:sha(b)});return JSON.parse(b);};
const ui=await json(root+'/ui-checks/checks.json'),fixtures=await json(root+'/fixtures/checks.json');
assert(fixtures.passed);assert.equal(fixtures.checks.length,6);
for(const f of fixtures.checks)assert.equal(sha(await readFile(f.path)),f.sha256);
for(const r of ui)assert.equal(sha(await readFile(r.log)),r.sha256);
const originalUnit=await readFile(root+'/unit-attempt-1.log','utf8');assert(originalUnit.includes('1 failed | 7 passed'));
const unit=await readFile(root+'/unit-attempt-2.log','utf8');assert(unit.includes('8 passed'));assert(unit.includes('"lock":"released"'));
assert.equal(execFileSync('git',['diff','--name-only','994d84056','--','apps','packages','assets','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim(),'','Production must still equal registered source');
const reg=await json(root+'/REGISTERED-UI.json'),clarification=await json(root+'/test-fixture-clarification.json');
const correction=await json(root+'/source-correction-1.json');
for(const [p,h]of Object.entries(reg.paths))assert.equal(sha(await readFile(p)),correction.paths[p]??(p===clarification.path?clarification.sha256:h),p);
for(const name of ['fixtures.mjs','browser.mjs','build-sandbox.mjs']){
 const executed='tools/cardrpg-big/a5-drafts/equipment-forecast-41/'+name;
 assert.equal(sha(await readFile(executed)),reg.paths[prep+'/'+name],executed);
}
const workerReg=await json(root+'/REGISTERED-WORKER.json');
for(const [p,h]of Object.entries(workerReg.paths))assert.equal(sha(await readFile(p)),h,p);
const artifacts=[],browsers=[],captures=[],timings=[];
for(const mode of ['on','off']) {
 assert.equal(ui.findLast(r=>r.name==='build-'+mode).code,0);
 const dir='/tmp/cardrpg-a5-equipment-forecast-'+mode;
 const build=await json(dir+'/build.json'),bytes=await readFile(dir+'/index.html');
 assert.equal(sha(bytes),build.sha256);assert.equal(bytes.length,build.bytes);assert.equal(build.gameplayV4,mode==='on');
 // The normal build manifest describes the unchanged source tree. The overlay
 // manifest separately identifies the five exact virtual source files used.
 const overlay=await json(prep+'/overlay-'+mode+'.json');
 assert.equal(Object.keys(overlay.overlay).length,5);
 for(const [p,h]of Object.entries(build.sourceHashes))if(/^(apps|packages|assets)\//.test(p))assert.equal(sha(await readFile(p)),h,p);
 for(const [p,h]of Object.entries(overlay.inputs))assert.equal(sha(await readFile(p)),h,p);
 for(const [p,row]of Object.entries(overlay.overlay))assert.equal(sha(await readFile(row.path)),row.sha256,p);
 const archived=root+'/prototype-'+mode;await mkdir(archived,{recursive:true});
 await copyFile(dir+'/index.html',archived+'/index.html');
 await writeFile(archived+'/build.json',JSON.stringify(build,null,2)+'\n');
 await writeFile(archived+'/overlay.json',JSON.stringify(overlay,null,2)+'\n');
 artifacts.push({mode,path:archived+'/index.html',sha256:sha(bytes),bytes:bytes.length});
 for(const width of [1280,1440,1024]) {
  const r=ui.findLast(r=>r.name===`browser-${mode}-${width}`);assert.equal(r.code,0);
  const b=await json(`${root}/browser-${mode}-${width}-attempt-${r.attempt}/checks.json`);
  assert(b.passed);assert.equal(b.mode,mode);assert.equal(b.width,width);assert.equal(b.sha256,sha(bytes));
  assert.deepEqual(b.errors,[]);assert.deepEqual(b.remote,[]);assert.equal(b.checks.length,6);assert.equal(b.captures.length,4);
  for(const c of b.captures){assert.equal(c.overflow,0);assert(c.contrast.length>0&&c.contrast.every(x=>x.ratio>=4.5));captures.push({...c,mode,width,sha256:sha(await readFile(c.path))});}
  timings.push(...b.timings.map(t=>({...t,mode,width})));
  browsers.push({mode,width,checks:b.checks,forecast400ms:b.forecast400ms});
 }
}
const last=ui.findLast(r=>r.name==='worker-lifecycle');assert.equal(last.code,0);
const workers=await json(root+'/worker-attempt-'+last.attempt+'/checks.json');
assert(workers.passed);assert.equal(workers.sha256,artifacts[0].sha256);assert.equal(workers.checks.length,2);assert.deepEqual(workers.errors,[]);assert.deepEqual(workers.remote,[]);
const latency=timings.flatMap(t=>t.rows.filter(r=>!r.cached).map(r=>({look:t.look,width:t.width,cpu:t.cpu,label:t.label,elapsedMs:r.elapsedMs,computeMs:r.computeMs})));
assert(latency.some(r=>r.cpu===1)&&latency.some(r=>r.cpu===4));
const audit={status:'PASS: isolated prototype behavior; not production adoption or balance acceptance',production:'994d84056',artifacts,browsers,captures,workers,latency,
 cpu1Under400ms:latency.filter(r=>r.cpu===1).every(r=>r.elapsedMs<=400),cpu1MaxMs:Math.max(...latency.filter(r=>r.cpu===1).map(r=>r.elapsedMs)),cpu4MaxMs:Math.max(...latency.filter(r=>r.cpu===4).map(r=>r.elapsedMs)),
 minimumScopedContrast:Math.min(...captures.flatMap(c=>c.contrast.map(r=>r.ratio))),receipts,
 limitations:['Synthetic UI fixtures are not earned progression or a balance sample.','Contextual40 remains separate; its overlapping TRAIN samples do not close static display calibration.','CPU4 applies page CDP Emulation.setCPUThrottlingRate. Worker CPU throttling is not independently established; these are page-throttled delivery observations.','No source adoption, full source suite, OFF population rerun, startup improvement, Z screenshot pack or human playtest claim.']};
await writeFile(root+'/prototype-audit.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({status:audit.status,captures:captures.length,cpu1Under400ms:audit.cpu1Under400ms,cpu1MaxMs:audit.cpu1MaxMs,cpu4MaxMs:audit.cpu4MaxMs,minimumScopedContrast:audit.minimumScopedContrast}));
