// REFERENCE: Prepare44 prospective prototype. Bind source, geometry and actual worker checks without rerunning them.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='reports/cardrpg-big/a5/c1-prepare-layout',draft='tools/cardrpg-big/a5-drafts/prepare-order-44';
const sha=b=>createHash('sha256').update(b).digest('hex'),receipts=[];
const json=async p=>{const b=await readFile(p);receipts.push({path:p,sha256:sha(b)});return JSON.parse(b);};
const reg=await json(draft+'/registration.json');
for(const[p,h]of Object.entries(reg.paths))assert.equal(sha(await readFile(p)),h,p);
for(const[p,h]of Object.entries(await json(draft+'/inputs.json')))assert.equal(sha(await readFile(p)),h,p);
const rows=await json(root+'/prototype-checks/checks.json');
for(const r of rows)assert.equal(sha(await readFile(r.log)),r.sha256,r.log);
const latest=name=>{const row=rows.findLast(r=>r.name===name);assert.equal(row?.code,0,name);return row;};
latest('before');
const before=await json(root+'/before-on-1280-attempt-'+latest('before').attempt+'/checks.json');
assert(before.passed&&before.before);assert.equal(sha(await readFile(before.artifact)),before.sha256);
assert(before.captures.find(c=>c.name==='earned-route').controls.some(c=>!c.visible));
const artifacts=[],browsers=[],captures=[];
for(const mode of ['on','off']){
 latest('build-'+mode);
 const dir='/tmp/cardrpg-a5-prepare-order-'+mode,build=await json(dir+'/build.json'),bytes=await readFile(dir+'/index.html');
 assert.equal(sha(bytes),build.sha256);assert.equal(bytes.length,build.bytes);assert.equal(build.gameplayV4,mode==='on');
 const overlay=await json('/tmp/cardrpg-a5-prepare-order-44/overlay-'+mode+'.json');
 for(const[p,row]of Object.entries(overlay.overlay)){assert.equal(sha(await readFile(row.path)),row.sha256,p);}
 for(const[p,h]of Object.entries(build.sourceHashes))if(/^(apps|packages|assets)\//.test(p))assert.equal(sha(await readFile(p)),h,p);
 await mkdir(root+'/prototype-'+mode,{recursive:true});
 await copyFile(dir+'/index.html',root+'/prototype-'+mode+'/index.html');
 await copyFile(dir+'/build.json',root+'/prototype-'+mode+'/manifest.json');
 artifacts.push({mode,path:root+'/prototype-'+mode+'/index.html',bytes:bytes.length,sha256:build.sha256});
 for(const width of [1280,1440,1024]){
  const r=latest(mode+'-'+width),p=await json(`${root}/${mode}-${width}-attempt-${r.attempt}/checks.json`);
  assert(p.passed&&!p.before);assert.equal(p.sha256,build.sha256);assert.equal(p.mode,mode);assert.equal(p.width,width);
  assert.deepEqual(p.errors,[]);assert.deepEqual(p.remote,[]);assert.equal(p.checks.length,mode==='on'?4:2);assert.equal(p.captures.length,mode==='on'?4:2);
  for(const c of p.captures){
   assert.equal(c.overflow,0);assert(c.fight.visible);
   if(mode==='on'){assert.equal(c.controls.length,5);assert(c.controls.every(r=>r.visible));assert(c.contrast.length&&c.contrast.every(r=>r.ratio>=4.5));if(width>=1280)assert(c.forecast.visible);}
   captures.push({...c,width,mode,sha256:sha(await readFile(c.path))});
  }
  browsers.push({width,mode,checks:p.checks});
 }
}
const workerReg=await json(root+'/worker-registration.json');assert.equal(sha(await readFile(workerReg.path)),workerReg.sha256);
const workers=await json(root+'/worker-attempt-1/checks.json');assert(workers.passed);assert.equal(workers.sha256,artifacts.find(a=>a.mode==='on').sha256);assert.equal(workers.checks.length,2);assert.deepEqual(workers.errors,[]);assert.deepEqual(workers.remote,[]);
const audit={status:'PASS: Prepare44 isolated layout and worker lifecycle; not cadence or balance acceptance',artifacts,browsers,captures,workers,before:{sha256:before.sha256,checks:before.checks,captures:before.captures},minimumScopedContrast:Math.min(...captures.filter(c=>c.mode==='on').flatMap(c=>c.contrast.map(r=>r.ratio))),receipts,limitations:['Targeted layout checks, not the Z screenshot pack.','The earned route uses the original Home43 public-command fixture. No injected browser state.','Alternate Look is explicitly entered with dev=1; reviewer buttons are expected.','OFF controls and actual estimate are tested; only V4 has new layout.','These checks do not measure reward cadence, startup or human engagement.']};
await writeFile(root+'/prototype-audit.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({status:audit.status,artifacts,captures:captures.length,checks:browsers.reduce((n,r)=>n+r.checks.length,0),workers:workers.checks.length,contrast:audit.minimumScopedContrast}));
