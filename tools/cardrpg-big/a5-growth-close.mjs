// REFERENCE: PROMPT-A5 C1. Verify receipts on the exact growth-preview source; no combat resampling.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
const root='reports/cardrpg-big/a5/c1-growth-preview',receipts=[],sha=b=>createHash('sha256').update(b).digest('hex');
async function json(p){const b=await readFile(p);receipts.push({path:p,sha256:sha(b)});return JSON.parse(b);}
const gates=await json(root+'/gates/checks.json');const source=gates.findLast(r=>r.code===0).head;
for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){const r=gates.findLast(r=>r.name===name);assert.equal(r.code,0);assert.equal(r.head,source);}
for(const r of gates)assert.equal(sha(await readFile(r.log)),r.sha256);
execFileSync('git',['merge-base','--is-ancestor',source,'HEAD']);
assert.equal(execFileSync('git',['diff','--name-only',source,'--','apps','packages','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim(),'');
const adoption=await json(root+'/source.json');for(const [p,h]of Object.entries(adoption.paths))assert.equal(sha(await readFile(p)),h,p);
const tools=await json(root+'/tool-hashes.json');for(const [p,h]of Object.entries(tools.paths))assert.equal(sha(await readFile(p)),h,p);
const offRoot='reports/cardrpg-big/a5/e1-crew-advice-band/off',off=await json(offRoot+'/checks.json');
assert.deepEqual(off,{offBehavior:'PASS',sha256:'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3',cells:165,routes:8250});
for(const [p,h]of Object.entries(await json(offRoot+'/source.json')))assert.equal(sha(await readFile(p)),h,p);
assert.equal(execFileSync('git',['diff','--name-only','e14d320ed','--','packages'],{encoding:'utf8'}).trim(),'');
const ui=await json(root+'/ui-checks/checks.json'),fixtures=await json(root+'/fixtures/checks.json');assert(fixtures.passed);assert.equal(fixtures.checks.length,10);
for(const f of fixtures.checks)assert.equal(sha(await readFile(f.path)),f.sha256);
for(const r of ui)assert.equal(sha(await readFile(r.log)),r.sha256);
const artifacts=[],browsers=[],captures=[];
for(const mode of ['on','off']){
 assert.equal(ui.findLast(r=>r.name==='build-'+mode).code,0);
 const dir='/tmp/cardrpg-a5-growth-'+mode,build=await json(dir+'/build.json'),bytes=await readFile(dir+'/index.html');
 assert.equal(sha(bytes),build.sha256);assert.equal(build.gameplayV4,mode==='on');
 for(const [p,h]of Object.entries(build.sourceHashes))if(/^(apps|packages|assets)\//.test(p))assert.equal(sha(await readFile(p)),h,p);
 await mkdir(root+'/build-'+mode,{recursive:true});await writeFile(root+'/build-'+mode+'/manifest.json',JSON.stringify(build,null,2)+'\n');
 artifacts.push({mode,sha256:sha(bytes),bytes:bytes.length,path:dir+'/index.html'});
 for(const width of [1280,1440,1024]){
  const row=ui.findLast(r=>r.name===`browser-${mode}-${width}`);assert.equal(row.code,0);
  const b=await json(`${root}/browser-${mode}-${width}-attempt-${row.attempt}/checks.json`);
  assert(b.passed);assert.equal(b.mode,mode);assert.equal(b.width,width);assert.equal(b.sha256,sha(bytes));assert.deepEqual(b.errors,[]);assert.deepEqual(b.remote,[]);
  assert.equal(b.checks.length,10);assert.equal(b.captures.length,6);
  for(const c of b.captures){assert.equal(c.overflow,0);assert(c.controlsVisible);assert(c.contrast.every(r=>r.ratio>=4.5));captures.push({...c,mode,width,sha256:sha(await readFile(c.path))});}
  browsers.push({mode,width,checks:b.checks});
 }
}
const scope=JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/a5-scope.mjs'],{encoding:'utf8'}));assert.equal(scope.scope,'PASS');assert.equal(scope.baseline,'PASS');assert.equal(scope.historicalSimFiles,13);
await mkdir(root+'/artifact',{recursive:true});await copyFile(artifacts[0].path,root+'/artifact/index.html');
const audit={status:'PASS for companion growth previews; A5 acceptance remains open',source,gates,adoption,tools,off:{...off,reusedFrom:offRoot,reason:'Every original rule hash and full package diff are exact.'},artifacts,browsers,captures,minimumScopedContrast:Math.min(...captures.flatMap(c=>c.contrast.map(x=>x.ratio))),receipts,scope:{scope:scope.scope,baseline:scope.baseline,historicalSimFiles:13},limitations:['Public-command UI previews; no prices/stats/saves/combat changes. Rendering never commits the preview.','Synthetic star/cap/poor fixtures are not earned accounts or evidence of improved progression.','Original focused-test errors retained; no gameplay sample or acceptance rerun.','No claim of cadence/startup improvements or a completed Z screenshot pack.']};
await writeFile(root+'/audit.json',JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify({status:audit.status,source,captures:captures.length,minimumScopedContrast:audit.minimumScopedContrast,artifacts}));
