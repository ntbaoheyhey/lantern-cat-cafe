// REFERENCE: PROMPT-A5 B3. Assemble existing receipts; do not rerun or replace observations.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='reports/cardrpg-big/a5/b3',hash=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8')),receipts=[];
async function receipt(path){const bytes=await readFile(path);receipts.push({path,sha256:hash(bytes)});return JSON.parse(bytes);}
const source='06dc9d3baffe56b633cf8f8290ccbbce1c727aed';
const gates=await receipt('reports/cardrpg-big/a5/b3-reviewed/gates/checks.json');
for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){const row=gates.findLast(g=>g.name===name);assert(row&&row.code===0,name);assert.equal(row.head,source);}
for(const path of ['reports/cardrpg-big/a5/b3-adopted/gates/checks.json',base+'/ui-checks/checks.json',base+'/reviewed/ui-checks/checks.json']){
 const rows=await receipt(path);for(const r of rows)assert.equal(hash(await readFile(r.log)),r.sha256,r.log);
}
for(const g of gates)assert.equal(hash(await readFile(g.log)),g.sha256,g.log);
const build=await json('/tmp/cardrpg-a5-b3-reviewed/build.json'),artifact=await readFile('/tmp/cardrpg-a5-b3-reviewed/index.html');
assert.equal(build.head,source);assert.equal(hash(artifact),build.sha256);assert.equal(artifact.length,build.bytes);
for(const [p,h] of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(p)),h,p);
await mkdir(base+'/artifact',{recursive:true});await copyFile('/tmp/cardrpg-a5-b3-reviewed/index.html',base+'/artifact/index.html');await copyFile('/tmp/cardrpg-a5-b3-reviewed/build.json',base+'/reviewed/offline-build.json');
const off=await receipt(base+'/off/checks.json'),offSource=await receipt(base+'/off/source.json');
assert.equal(off.sha256,'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');assert.equal(off.cells,165);assert.equal(off.routes,8250);
for(const [p,h] of Object.entries(offSource))assert.equal(hash(await readFile(p)),h,p);
const earned=await receipt(base+'/earned-selector/checks.json');assert.equal(earned.timeline.at(-1).marks,24);assert.equal(earned.timeline.at(-1).day,11);
const browser=[];
for(const width of [1280,1440,1024]){
 const r=await receipt(base+`/reviewed/browser-${width}/checks.json`);assert(r.passed);assert.equal(r.sha256,build.sha256);assert.equal(r.captures.length,4);assert.deepEqual(r.errors,[]);assert.deepEqual(r.remote,[]);
 assert(r.captures.every(c=>c.overflow===0&&c.contrast.every(x=>x.ratio>=4.5)));
 assert(r.checks.includes('public-command-earned24marks choose once; pity unchanged'));
 browser.push({width,captures:4,checks:r.checks,minimumScopedContrast:Math.min(...r.captures.flatMap(c=>c.contrast.map(x=>x.ratio)))});
}
const summary=await receipt(base+'/reward-validation-02/summary.json');assert.equal(summary.matchedDays,4050);assert(Object.values(summary.gates).every(Boolean));
const original=await receipt(base+'/reward-confirmation-01/summary.json');
const invitation=await receipt(base+'/invitations-01/gacha.json');assert.equal(invitation.rows.length,3);
assert(invitation.summaries.every(r=>r.accounts===10000&&r.maxDeviationPp<=1));
const scope=JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/a5-scope.mjs'],{encoding:'utf8'}));
const audit={status:'PARTIAL: reward pacing and functional checks pass on A4 combat; earned day7 retry and combat gates remain open.',source,
 artifact:{path:base+'/artifact/index.html',sha256:build.sha256,bytes:build.bytes},gates,off,offSource,browser,
 earnedSelector:{day:11,marks:24,method:earned.method},rewardGates:summary.gates,ratios:original.ratios,
 maximumConditionalCdfDeviationPp:Math.max(...invitation.summaries.map(r=>r.maxDeviationPp)),scope,receipts,
 limitations:['Bot proxies, not human playtesting or elapsed45days.','A4 combat remains in the economy; repeat after combat adoption.','Targeted UI/contrast only; full screenshot pack remains Z.','Original1024 capture showed a selector heading behind sticky odds; scroll clearance corrected and separate reviewed captures retained.','Offline build attempts1 retained missing temporaryPython; retry uses existing verifiedPillow11.3.0 environment.','Public demo unchanged; fresh20001–20500 acceptance unused.']};
await writeFile(base+'/reviewed/audit.json',JSON.stringify(audit,null,2));
const report='reports/cardrpg-big/a5/B3-PROGRESSION.md';let text=await readFile(report,'utf8');text=text.replace('Status: reward implementation in review; source/browser/OFF checks pending.','Status: reward source and targeted UI checks PASS; B3 overall remains PARTIAL.');
text+='\n## Reviewed implementation checks\n\n';
text+=`Source ${source}; measured offline [artifact](b3/artifact/index.html): ${build.bytes} bytes, SHA-256 ${build.sha256}. Public demo is unchanged until Z.\n\n`;
text+='Typecheck, lint,1739 web tests,1113 rules tests (+2 expected failures/11 skipped),421 E2E checks and build PASS. Original typecheck failure (test clone portability) and missing temporary-Python build attempts remain in the original logs; the corrected source passes all six gates.\n\n';
text+='A public-command account earned24 marks on day11 without injected currency/levels. Real clicks import that earned save, choose once, spend exactly24→0 and leave all pity counters unchanged. Fresh welcome and paid150-stamp draw also pass. Twelve reviewed captures across1280/1440/1024 have zero horizontal overflow, scoped contrast≥4.5 and no page errors or remote requests. The selector heading clears sticky odds; original obscured1024 capture is retained.\n\n';
text+='Fresh OFF165cells/8250routes matches47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3. Reviewed CSS-only correction reuses that receipt with exact63 rule-input hashes. Baseline-v1,13 historical sims, author and protected/B-path guards PASS. See [audit](b3/reviewed/audit.json). No combat or full-acceptance PASS is implied.\n';
await writeFile(report,text);console.log(JSON.stringify({source,artifact:audit.artifact,browser:browser.map(r=>({width:r.width,minContrast:r.minimumScopedContrast})),status:audit.status}));
