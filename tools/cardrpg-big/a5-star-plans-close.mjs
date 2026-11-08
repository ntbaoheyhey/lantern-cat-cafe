// REFERENCE: Star plans46. Source-bound closure; no repeats of combat or byte-identical UI samples.
import assert from 'node:assert/strict';
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root='reports/cardrpg-big/a5/e2-star-plans',receipts=[];
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>{const b=await readFile(p);receipts.push({path:p,sha256:sha(b)});return JSON.parse(b);};
const adoption=await json(root+'/adoption.json');
for(const[p,h]of Object.entries(adoption.paths))assert.equal(sha(await readFile(p)),h,p);
const prototype=await json(root+'/prototype-audit.json');
assert.equal(sha(await readFile(root+'/prototype-audit.json')),adoption.prototypeSha256);
for(const r of prototype.receipts)assert.equal(sha(await readFile(r.path)),r.sha256,r.path);
for(const c of prototype.captures)assert.equal(sha(await readFile(c.path)),c.sha256,c.path);
const gates=await json(root+'/gates/checks.json'),source=gates.findLast(r=>r.code===0).head;
for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){
 const r=gates.findLast(r=>r.name===name);assert.equal(r.code,0,name);assert.equal(r.head,source);
}
for(const r of gates)assert.equal(sha(await readFile(r.log)),r.sha256);
execFileSync('git',['merge-base','--is-ancestor',source,'HEAD']);
assert.equal(execFileSync('git',['diff','--name-only',source,'--','apps','packages','assets','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim(),'');
const builds=await json(root+'/adopted-builds/checks.json'),artifacts=[];
for(const row of builds)assert.equal(sha(await readFile(row.log)),row.sha256);
for(const mode of ['on','off']){
 const row=builds.findLast(r=>r.mode===mode);assert.equal(row.code,0);
 const build=await json(row.output+'/build.json'),bytes=await readFile(row.output+'/index.html');
 const original=prototype.artifacts.find(a=>a.mode===mode);
 assert.equal(sha(bytes),build.sha256);assert.equal(build.sha256,original.sha256);assert.equal(build.bytes,original.bytes);
 assert.equal(build.gameplayV4,mode==='on');
 for(const[p,h]of Object.entries(build.sourceHashes))if(/^(apps|packages|assets)\//.test(p))assert.equal(sha(await readFile(p)),h,p);
 await mkdir(root+'/adopted-'+mode,{recursive:true});
 await copyFile(row.output+'/build.json',root+'/adopted-'+mode+'/manifest.json');
 artifacts.push({mode,sha256:build.sha256,bytes:build.bytes,prototypeByteExact:true,path:original.path});
}
const offRoot='reports/cardrpg-big/a5/e1-crew-advice-band/off',off=await json(offRoot+'/checks.json');
assert.deepEqual(off,{offBehavior:'PASS',sha256:'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3',cells:165,routes:8250});
for(const[p,h]of Object.entries(await json(offRoot+'/source.json')))assert.equal(sha(await readFile(p)),h,p);
assert.equal(execFileSync('git',['diff','--name-only','e14d320ed','--','packages'],{encoding:'utf8'}).trim(),'');
const scope=JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/a5-scope.mjs'],{encoding:'utf8'}));
assert.equal(scope.scope,'PASS');assert.equal(scope.baseline,'PASS');assert.equal(scope.historicalSimFiles,13);
const audit={status:'PASS: Home crew choices for job stars; A5 balance acceptance remains open',source,adoption,gates,artifacts,
 off:{...off,reusedFrom:offRoot,reason:'Original rule hashes and full packages diff exact.'},
 browsers:prototype.browsers,captures:prototype.captures,

 minimumScopedContrast:prototype.minimumScopedContrast,receipts,
 limitations:['Original prototype browser receipts reused only after exact ON/OFF artifact byte equality.',
 'Six earned-save UI continuations use x1 automatic fights. No account/combat/save rule changed.',
 'Original Home02 cadence/dead-time MISS remains; this is not a new elapsed sample.',
 'Scoped contrast and targeted captures are not the Z screenshot pack. No startup or retention claim.']};
await writeFile(root+'/audit.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({status:audit.status,source,artifacts,captures:audit.captures.length,minimumScopedContrast:audit.minimumScopedContrast}));
