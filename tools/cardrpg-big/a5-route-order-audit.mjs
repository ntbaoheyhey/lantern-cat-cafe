// REFERENCE: Route53 prospective prototype. Bind source, geometry and actual worker checks without rerunning them.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='reports/cardrpg-big/a5/c1-route-order',draft='tools/cardrpg-big/a5-drafts/route-order-53';
const sha=b=>createHash('sha256').update(b).digest('hex'),receipts=[];
const json=async p=>{const b=await readFile(p);receipts.push({path:p,sha256:sha(b)});return JSON.parse(b);};
const reg=await json(draft+'/tools.json');
for(const[p,h]of Object.entries(reg))assert.equal(sha(await readFile(p)),h,p);
for(const[p,h]of Object.entries(await json(draft+'/inputs.json')))assert.equal(sha(await readFile(p)),h,p);
const rows=await json(root+'/prototype-checks/checks.json');
for(const r of rows)assert.equal(sha(await readFile(r.log)),r.sha256,r.log);
const latest=name=>{const row=rows.findLast(r=>r.name===name);assert.equal(row?.code,0,name);return row;};
latest('before');
const before=await json(root+'/before-on-1280-attempt-'+latest('before').attempt+'/checks.json');
assert(before.passed&&before.before);assert.equal(sha(await readFile(before.artifact)),before.sha256);
assert(before.captures.find(c=>c.name==='reward').decisionVisible===false);
const artifacts=[],browsers=[],captures=[];
for(const mode of ['on','off']){
 latest('build-'+mode);
 const dir='/tmp/cardrpg-a5-route-order-'+mode,build=await json(dir+'/build.json'),bytes=await readFile(dir+'/index.html');
 assert.equal(sha(bytes),build.sha256);assert.equal(bytes.length,build.bytes);assert.equal(build.gameplayV4,mode==='on');
 const overlay=await json('/tmp/cardrpg-a5-route-order-53/overlay-'+mode+'.json');
 for(const[p,row]of Object.entries(overlay.overlay)){assert.equal(sha(await readFile(row.path)),row.sha256,p);}
 for(const[p,h]of Object.entries(build.sourceHashes))if(/^(apps|packages|assets)\//.test(p))assert.equal(sha(await readFile(p)),h,p);
 await mkdir(root+'/prototype-'+mode,{recursive:true});
 await copyFile(dir+'/index.html',root+'/prototype-'+mode+'/index.html');
 await copyFile(dir+'/build.json',root+'/prototype-'+mode+'/manifest.json');
 artifacts.push({mode,path:root+'/prototype-'+mode+'/index.html',bytes:bytes.length,sha256:build.sha256});
 for(const width of [1280,1440,1024]){
  const r=latest(mode+'-'+width),p=await json(`${root}/${mode}-${width}-attempt-${r.attempt}/checks.json`);
  assert(p.passed&&!p.before);assert.equal(p.sha256,build.sha256);assert.equal(p.mode,mode);assert.equal(p.width,width);
  assert.deepEqual(p.errors,[]);assert.deepEqual(p.remote,[]);assert.equal(p.checks.length,14);assert.equal(p.captures.length,14);
  for(const c of p.captures){
   assert.equal(c.overflow,0);
   if(mode==='on'){assert(c.decisionVisible);assert(c.mapBeforeScouting);assert(c.contrast.length&&c.contrast.every(r=>r.ratio>=4.5));if(c.name!=='route')assert(c.activityBeforeMap);}else if(c.name!=='route')assert(c.mapBeforeActivity);
   captures.push({...c,width,mode,sha256:sha(await readFile(c.path))});
  }
  browsers.push({width,mode,checks:p.checks});
 }
}
const audit={status:'PASS: Route53 isolated route decision visibility; not cadence or balance acceptance',artifacts,browsers,captures,before:{sha256:before.sha256,checks:before.checks,captures:before.captures},minimumScopedContrast:Math.min(...captures.filter(c=>c.mode==='on').flatMap(c=>c.contrast.map(r=>r.ratio))),receipts,limitations:['Targeted layout checks, not the Z screenshot pack.','Original earned Home02 account, public commands and automatic fixture battles; no injected browser state.','Alternate Look is explicitly entered with dev=1; reviewer buttons are expected.','OFF DOM order is preserved. ON decisions are visible before the map.','These checks do not measure reward cadence, startup or human engagement.']};
await writeFile(root+'/prototype-audit.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({status:audit.status,artifacts,captures:captures.length,checks:browsers.reduce((n,r)=>n+r.checks.length,0),contrast:audit.minimumScopedContrast}));
