// REFERENCE: Star plans46. Audit retained source-bound prototypes; no combat resampling.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='reports/cardrpg-big/a5/e2-star-plans',draft='tools/cardrpg-big/a5-drafts/star-plans-46';
const sha=b=>createHash('sha256').update(b).digest('hex'),receipts=[];
const json=async p=>{const b=await readFile(p);receipts.push({path:p,sha256:sha(b)});return JSON.parse(b);};
const unit=await readFile(root+'/unit-mode-revision-attempt-2.log');
assert.match(unit.toString(),/Tests\s+8 passed/);receipts.push({path:root+'/unit-mode-revision-attempt-2.log',sha256:sha(unit)});
const original=await json(root+'/ui-checks/checks.json');
for(const r of original)assert.equal(sha(await readFile(r.log)),r.sha256);
const browserRevision=await json(root+'/browser-revision-1.json');assert.equal(sha(await readFile(browserRevision.path)),browserRevision.sha256);
const inputs=await json(draft+'/inputs.json');
for(const[p,h]of Object.entries(inputs))assert.equal(sha(await readFile(p)),h,p);
const fixtures=await json(root+'/fixtures/checks.json');assert(fixtures.passed);
assert.equal(sha(await readFile(fixtures.input)),fixtures.inputSha256);
for(const f of fixtures.fixtures){assert.equal(sha(await readFile(f.path)),f.sha256);assert.equal(sha(await readFile(f.statePath)),f.stateSha256);}
const reg=await json(draft+'/registration-revision.json'),copy=await json(draft+'/registration-copy-revision.json'),modeRevision=await json(draft+'/registration-mode-revision.json');
for(const[p,h]of Object.entries({...reg.paths,...copy.paths,...modeRevision.paths}))assert.equal(sha(await readFile(p)),h,p);
const steps=await json(root+'/ui-checks-mode-revision/checks.json');
for(const r of steps)assert.equal(sha(await readFile(r.log)),r.sha256);
const latest=name=>{const row=steps.findLast(r=>r.name===name);assert(row&&row.code===0,name);return row;};
const artifacts=[],browsers=[],captures=[];
for(const mode of ['on','off']){
 latest(mode+'-build');const original='/tmp/cardrpg-a5-star-plans-'+mode;
 const build=await json(original+'/build.json'),bytes=await readFile(original+'/index.html');assert.equal(sha(bytes),build.sha256);assert.equal(bytes.length,build.bytes);
 const overlay=await json('/tmp/cardrpg-a5-star-plans-46/overlay-'+mode+'.json');
 for(const row of Object.values(overlay.overlay))assert.equal(sha(await readFile(row.path)),row.sha256);
 for(const[p,h]of Object.entries(build.sourceHashes))if(/^(apps|packages|assets)\//.test(p))assert.equal(sha(await readFile(p)),h,p);
 await mkdir(root+'/prototype-'+mode,{recursive:true});await copyFile(original+'/index.html',root+'/prototype-'+mode+'/index.html');
 await copyFile(original+'/build.json',root+'/prototype-'+mode+'/manifest.json');
 artifacts.push({mode,path:root+'/prototype-'+mode+'/index.html',sha256:build.sha256,bytes:build.bytes});
 for(const width of [1280,1440,1024]){
  const row=latest(mode+'-'+width),p=await json(`${root}/${mode}-${width}-attempt-${row.attempt+2}/checks.json`);
  assert(p.passed);assert.equal(p.sha256,build.sha256);assert.equal(p.width,width);assert.equal(p.mode,mode);
  assert.deepEqual(p.errors,[]);assert.deepEqual(p.remote,[]);
  assert.equal(p.checks.length,mode==='on'?6:2);assert.equal(p.captures.length,mode==='on'?12:4);
  for(const c of p.captures){assert.equal(c.overflow,0);if(c.primaryVisible!==null)assert(c.primaryVisible);assert(c.contrast.every(r=>r.ratio>=4.5));captures.push({...c,width,mode,sha256:sha(await readFile(c.path))});}
  if(mode==='on')for(const c of p.checks.filter(r=>r.receipt)){assert.deepEqual(c.receipt.conditions,[true,true,true]);assert(c.noSkip&&c.currenciesExact);}
  browsers.push({width,mode,checks:p.checks});
 }
}
const audit={status:'PASS: isolated Home crew choices; cadence and balance remain open',artifacts,browsers,captures,receipts,
 minimumScopedContrast:Math.min(...captures.flatMap(c=>c.contrast.map(r=>r.ratio))),
 limitations:['Targeted original earned-save continuation, not a fresh cadence sample.','OFF source and controls unchanged. Alternate Look explicitly uses dev=1.','All original source/harness failure logs retained. No combat/economy/save/dependency change.']};
await writeFile(root+'/prototype-audit.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({status:audit.status,artifacts,captures:captures.length,checks:browsers.reduce((n,r)=>n+r.checks.length,0),contrast:audit.minimumScopedContrast}));
