// Verify published-document inputs and reviewed images. No battle/browser samples.
import {readFile,writeFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5',out=root+'/s6';
const json=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const [reg,audit,delivery,z,guide,manifest,review,score]=await Promise.all([
 json(root+'/REGISTERED-METHOD.json'),json(out+'/audit.json'),json(out+'/delivery.json'),json(out+'/z/summary.json'),
 json(out+'/guide/checks.json'),json(out+'/visual-review/manifest.json'),json(out+'/visual-review/review.json'),json(out+'/self-score.json'),
]);
assert.equal(audit.status,'PASS');assert.equal(reg.offset,20000);
for(const [p,h]of Object.entries({...reg.source,...reg.tools}))assert.equal(sha(await readFile(p)),h,p);
assert.equal(sha(await readFile(root+'/PRE-S6-REVISIT.md')),reg.repairReviewSha256);
assert.equal(sha(await readFile('docs/cardrpg3/skills-v5.html')),delivery.sha256);
assert.equal(sha(await readFile('docs/cardrpg3/index.html')),delivery.mainArtifactSha256);
assert.equal(z.artifactSha256,delivery.sha256);assert(z.complete);assert.equal(z.captures,126);
assert(guide.complete);assert.equal(guide.rows.length,3);assert.equal(guide.a5Rows.length,3);
assert.equal(sha(await readFile(guide.path)),guide.sha256);
for(const row of guide.a5Rows)assert.equal(sha(await readFile(row.path)),row.sha256);
assert.equal(manifest.artifactSha256,delivery.sha256);
assert.equal(review.manifestSha256,sha(await readFile(out+'/visual-review/manifest.json')));
assert.equal(review.reviewedContactSheets.length,manifest.groups.length);
assert.equal(new Set(review.reviewedContactSheets).size,manifest.groups.length);
assert(review.scope.includes('self-review'));
let images=0;
for(const group of manifest.groups){
 assert(review.reviewedContactSheets.includes(group.path),group.path);
 assert.equal(sha(await readFile(group.path)),group.sha256);
 for(const capture of group.captures){assert.equal(sha(await readFile(capture.path)),capture.sha256);images++;}
}
assert.equal(images,147);
for(const path of review.fullSizeInspections)assert(manifest.groups.some(g=>g.captures.some(c=>c.path===path)),path);
assert.equal(score.lines.reduce((n,r)=>n+r.weight*r.score,0),score.total);assert.equal(score.target,8);
const modes={};
for(const mode of ['on','off']){
 const receipt=await json(`${out}/${mode}/receipt-audit.json`),gates=await json(`${out}/${mode}/numeric-gates.json`);
 assert.equal(receipt.status,'PASS');assert.equal(receipt.offset,20000);assert.equal(receipt.rows.length,10);
 assert.equal(receipt.sourceDigest,reg.sourceDigest);assert.equal(gates.sourceDigest,reg.sourceDigest);
 for(const row of receipt.rows)assert.equal(sha(await readFile(row.source)),row.sha256,row.source);
 modes[mode]={counts:gates.counts,receiptSha256:sha(await readFile(`${out}/${mode}/receipt-audit.json`))};
}
const reports=[root+'/V5A-REPORT.md','reports/cardrpg-big/a5/A5-REPORT.md','reports/cardrpg-big/CARDRPG-BIG-REPORT.md'];
const documents=[...reports,root+'/PLAYTEST-KIT.md',root+'/FRESH-EYES.md',root+'/S6-SELF-SCORE.md',out+'/visual-review/REVIEW.md',...['BARE-ITEM','ELITE','BOSS-CREW','EQUIPMENT','SET','TIER','PROGRESSION'].map(s=>`${out}/${s}-REVIEW.md`)];
const docs=[];let localLinks=0;
for(const path of documents){
 const body=await readFile(path,'utf8'),lines=body.trimEnd().split('\n').length;
 if(reports.includes(path)){assert(lines<=90,path);assert(body.startsWith('Đã triển khai Skills V5:'),path);}
 for(const match of body.matchAll(/\]\(([^)]+)\)/g)){
  const target=match[1];if(/^[a-z]+:\/\//.test(target)||target.startsWith('#'))continue;
  await access(resolve(dirname(path),decodeURIComponent(target.split('#')[0])));localLinks++;
 }
 docs.push({path,sha256:sha(body),lines});
}
const scope=JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/skills-v5/scope.mjs'],{encoding:'utf8'}));
assert.equal(scope.scope,'PASS');assert.equal(scope.baseline,'PASS');
const receipt={status:'PASS',meaning:'Delivery evidence integrity only. Numeric misses, visual findings and unverified human recognition remain independent.',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),at:new Date().toISOString(),artifactSha256:delivery.sha256,sourceDigest:reg.sourceDigest,registeredFiles:Object.keys(reg.source).length+Object.keys(reg.tools).length,modes,reviewManifestSha256:review.manifestSha256,reviewSha256:sha(await readFile(out+'/visual-review/review.json')),reviewedImages:images,localLinks,documents:docs,score:score.total};
await writeFile(out+'/delivery-audit.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,reviewedImages:images,localLinks,score:score.total,modes}));
