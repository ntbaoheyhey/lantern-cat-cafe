// REFERENCE: PROMPT-A5 C1/E1. Verify adopted source and original receipts without new gameplay samples.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='reports/cardrpg-big/a5/c1-decisions',receipts=[];
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=async path=>{const bytes=await readFile(path);receipts.push({path,sha256:sha(bytes)});return JSON.parse(bytes);};
const registration=await json(root+'/registration.json');
for(const [path,digest]of Object.entries(registration.source))assert.equal(sha(await readFile(path)),digest,path);
const gates=await json(root+'/gates/checks.json'),source=gates[0].head;
for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){
 const row=gates.findLast(r=>r.name===name);assert.equal(row?.code,0,name);assert.equal(row.head,source);
}
for(const row of gates)assert.equal(sha(await readFile(row.log)),row.sha256);
execFileSync('git',['merge-base','--is-ancestor',source,'HEAD']);
assert.equal(execFileSync('git',['diff','--name-only',source,'--','apps','packages','assets','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim(),'');
const runs=await json(root+'/ui-checks/checks.json');
for(const row of runs)assert.equal(sha(await readFile(row.log)),row.sha256,row.log);
const requireRun=name=>{const row=runs.findLast(r=>r.name===name);assert.equal(row?.code,0,name);return row;};
requireRun('supplement');requireRun('next-run-advice');await json(root+'/off-preference-settled.json');
const artifacts=[];
for(const mode of ['on','off']){
 requireRun('build-'+mode);
 const build=await json(root+'/artifact-'+mode+'/build.json'),path=root+'/artifact-'+mode+'/index.html',bytes=await readFile(path);
 assert.equal(sha(bytes),build.sha256);assert.equal(bytes.length,build.bytes);assert.equal(build.gameplayV4,mode==='on');
 for(const [p,h]of Object.entries(build.sourceHashes))if(/^(apps|packages|assets)\//.test(p))assert.equal(sha(await readFile(p)),h,p);
 artifacts.push({mode,path,sha256:build.sha256,bytes:bytes.length});
}
const fixturePaths={route:'reports/cardrpg-big/a5/c1-route-order/fixtures/checks.json',home:'reports/cardrpg-big/a5/e2-home-band/fixtures/checks.json',result:root+'/result-fixtures.json'};
const fixtures={};
for(const [flow,path]of Object.entries(fixturePaths)){
 fixtures[flow]=await json(path);
 for(const f of fixtures[flow].fixtures)assert.equal(sha(await readFile(f.path)),f.sha256,f.path);
}
const browsers=[],captures=[];
for(const flow of ['route','home','result'])for(const mode of ['on','off'])for(const width of [1280,1440,1024]){
 const row=requireRun(`${flow}-${mode}-${width}`),path=`${root}/${flow}/${mode}-${width}-attempt-${row.attempt}/checks.json`,b=await json(path);
 assert.equal(b.passed,true,path);assert.equal(b.mode,mode);assert.equal(b.width,width);
 assert.equal(b.sha256,artifacts.find(a=>a.mode===mode).sha256);
 assert.deepEqual(b.errors,[]);assert.deepEqual(b.remote,[]);
 const names=flow==='route'?fixtures.route.fixtures.filter(f=>f.mode===mode).map(f=>f.name)
  :flow==='home'?fixtures.home.fixtures.filter(f=>mode==='off'?f.name==='off':f.name!=='off').map(f=>f.name)
  :fixtures.result.fixtures.filter(f=>mode==='off'?f.name.startsWith('off'):!f.name.startsWith('off')).map(f=>f.name);
 for(const look of ['baseline','look'])for(const name of names)assert(b.checks.some(r=>r.look===look&&r.name===name),`${path}: ${look}/${name}`);
 if(flow==='result'&&mode==='on'){
  for(const look of ['baseline','look'])for(const name of ['replay','csp-fallback'])assert(b.checks.some(r=>r.look===look&&r.name===name));
  assert(b.checks.some(r=>r.name==='tutorial-victory'));
 }
 for(const c of b.captures){
  assert.equal(c.overflow,0,c.path);
  if(mode==='on'){
   assert.equal(flow==='route'?c.decisionVisible:flow==='home'?c.primaryVisible:c.visible,true,c.path);
   assert(c.contrast.length&&c.contrast.every(r=>r.ratio>=4.5),c.path);
  }
  captures.push({...c,flow,mode,width,sha256:sha(await readFile(c.path))});
 }
 browsers.push({flow,mode,width,checks:b.checks.length,captures:b.captures.length,path});
}
const offRoot='reports/cardrpg-big/a5/e1-crew-advice-band/off',off=await json(offRoot+'/checks.json');
assert.deepEqual(off,{offBehavior:'PASS',sha256:'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3',cells:165,routes:8250});
for(const[p,h]of Object.entries(await json(offRoot+'/source.json')))assert.equal(sha(await readFile(p)),h,p);
assert.equal(execFileSync('git',['diff','--name-only','e14d320ed','--','packages'],{encoding:'utf8'}).trim(),'');
const scope=JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/a5-scope.mjs'],{encoding:'utf8',maxBuffer:8*1024*1024}));
assert.equal(scope.scope,'PASS');assert.equal(scope.baseline,'PASS');assert.equal(scope.historicalSimFiles,13);
const audit={status:'PASS for integrated route/home/result decision flows; balance and engagement gates remain open',source,gates,artifacts,browsers,captures,
 minimumScopedContrast:Math.min(...captures.filter(c=>c.mode==='on').flatMap(c=>c.contrast.map(r=>r.ratio))),
 off:{...off,reusedFrom:offRoot,reason:'Every original rule hash and entire packages diff verified; no repeat battles.'},
 scope:{protected:scope.scope,baseline:scope.baseline,historicalSimFiles:scope.historicalSimFiles},receipts,acceptanceSeedsUsed:false,
 limitations:['Targeted UI fixtures and keyboard/click parity; no new win-rate, elapsed cadence, startup or human-retention measurement.',
 'Completed V4 routes respect the OFF preference; an active V4 route retains its committed V4 layout when the next-run preference is OFF.',
 'Original Home03 cadence/dead-time MISS is unchanged; these captures are not the Z screenshot pack.']};
await writeFile(root+'/audit.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({status:audit.status,source,checks:browsers.reduce((n,b)=>n+b.checks,0),captures:captures.length,artifacts,minimumScopedContrast:audit.minimumScopedContrast}));
