// REFERENCE: PROMPT-A5 C1. Audit reviewer-only settings without a new combat or timing claim.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
const root='reports/cardrpg-big/a5/c1-review-controls',receipts=[];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function json(path){const bytes=await readFile(path);receipts.push({path,sha256:sha(bytes)});return JSON.parse(bytes);}
const gates=await json(root+'/gates/checks.json'),source=gates.findLast(r=>r.code===0).head;
for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){
 const row=gates.findLast(r=>r.name===name);assert.equal(row?.code,0,name);assert.equal(row.head,source);assert.equal(row.scope,'complete');
}
for(const row of gates)assert.equal(sha(await readFile(row.log)),row.sha256,row.log);
execFileSync('git',['merge-base','--is-ancestor',source,'HEAD']);
assert.equal(execFileSync('git',['diff','--name-only',source,'--','apps','packages','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim(),'');
const offRoot='reports/cardrpg-big/a5/e1-crew-advice-band/off',off=await json(offRoot+'/checks.json');
assert.deepEqual(off,{offBehavior:'PASS',sha256:'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3',cells:165,routes:8250});
for(const [path,hash]of Object.entries(await json(offRoot+'/source.json')))assert.equal(sha(await readFile(path)),hash,path);
assert.equal(execFileSync('git',['diff','--name-only','e14d320ed','--','packages'],{encoding:'utf8'}).trim(),'');
const before=execFileSync('git',['show','a369240f3:apps/web/src/game/cardrpg/depth/Utility.tsx'],{encoding:'utf8'}),after=await readFile('apps/web/src/game/cardrpg/depth/Utility.tsx','utf8');
const adoption=await json(root+'/adoption.json');assert.equal(sha(before),adoption.inputSha256);assert.equal(sha(after),adoption.outputSha256);
assert.equal(before.slice(before.indexOf('export function Relics'),before.indexOf('export function SaveSettings')),after.slice(after.indexOf('export function Relics'),after.indexOf('export function SaveSettings')));
assert.equal(before.slice(before.indexOf('export function Evidence')),after.slice(after.indexOf('export function Evidence')));
const rows=await json(root+'/ui-checks/checks.json'),browsers=[],captures=[],artifacts=[];
for(const row of rows)assert.equal(sha(await readFile(row.log)),row.sha256,row.log);
const home=await json('reports/cardrpg-big/a5/e2-home/audit.json');
for(const mode of ['on','off']){
 const buildRow=rows.findLast(r=>r.name==='build-'+mode);assert.equal(buildRow?.code,0);
 const dir='/tmp/cardrpg-a5-review-controls-'+mode,build=await json(dir+'/build.json'),bytes=await readFile(dir+'/index.html');
 assert.equal(sha(bytes),build.sha256);assert.equal(build.gameplayV4,mode==='on');
 for(const [path,hash]of Object.entries(build.sourceHashes))if(/^(apps|packages|assets)\//.test(path))assert.equal(sha(await readFile(path)),hash,path);
 await mkdir(root+'/build-'+mode,{recursive:true});await writeFile(root+'/build-'+mode+'/manifest.json',JSON.stringify(build,null,2)+'\n');
 artifacts.push({mode,sha256:build.sha256,bytes:bytes.length,path:dir+'/index.html'});
}
for(const [beforeMode,mode,width]of [[true,'on',1280],...['on','off'].flatMap(mode=>[1280,1440,1024].map(width=>[false,mode,width]))]){
 const name=(beforeMode?'before-':'browser-')+mode+'-'+width,row=rows.findLast(r=>r.name===name);assert.equal(row?.code,0,name);
 const browser=await json(`${root}/${beforeMode?'before':'after'}-${mode}-${width}-attempt-${row.attempt}/checks.json`);
 assert.equal(browser.passed,true);assert.equal(browser.width,width);assert.equal(browser.mode,mode);assert.equal(browser.before,beforeMode);
 assert.equal(browser.sha256,beforeMode?home.artifact.sha256:artifacts.find(r=>r.mode===mode).sha256);
 assert.deepEqual(browser.errors,[]);assert.deepEqual(browser.remote,[]);assert.equal(browser.checks.length,3);assert.equal(browser.captures.length,3);
 for(const check of browser.checks){const hasTools=beforeMode||mode==='off'||check.dev;assert.equal(check.hasTools,hasTools);assert.equal(check.grantControls,hasTools?4:0);assert.equal(check.saveRoundtrip,true);assert.equal(check.keyboardDayAdvance,hasTools);}
 for(const capture of browser.captures){assert.equal(capture.overflow,0);assert(capture.contrast.length&&capture.contrast.every(r=>r.ratio>=4.5));captures.push({...capture,mode,width,before:beforeMode,sha256:sha(await readFile(capture.path))});}
 browsers.push({before:beforeMode,mode,width,checks:browser.checks});
}
const scope=JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/a5-scope.mjs'],{encoding:'utf8'}));assert.equal(scope.scope,'PASS');assert.equal(scope.baseline,'PASS');assert.equal(scope.historicalSimFiles,13);
await mkdir(root+'/artifact',{recursive:true});await copyFile(artifacts.find(r=>r.mode==='on').path,root+'/artifact/index.html');
const result={status:'PASS for reviewer-only Settings; A5 acceptance remains open',source,gates,off:{...off,reusedFrom:offRoot,reason:'All original rules source hashes and complete package diff remain exact.'},adoption,artifacts,browsers,captures,minimumScopedContrast:Math.min(...captures.flatMap(r=>r.contrast.map(c=>c.ratio))),receipts,scope:{scope:scope.scope,baseline:scope.baseline,historicalSimFiles:13},limitations:['This change hides offline Settings grants in ordinary GameplayV4. It is not a security boundary or a change to Relic fixtures.','ON/OFF player, reviewer and reviewer-Look checks retain keyboard grants and save roundtrip. This is not the Z full screenshot pack.','Before unit1fail/3pass, typed-query and lazy-loading harness failures are retained. No gameplay seed resampling.','Original 30-minute cadence/dead-time misses remain unchanged; no balance, startup or acceptance claim.']};
await writeFile(root+'/audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,source,captures:captures.length,minimumScopedContrast:result.minimumScopedContrast,artifacts}));
