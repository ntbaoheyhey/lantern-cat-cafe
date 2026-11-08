// REFERENCE: PROMPT-A5 B3. Bind existing checks and measured source; no seed/timing reroll.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const base='reports/cardrpg-big/a5/b3/closure';
const source='6c0a045924a591797accd83e334847e5698c3463';
const sha=x=>createHash('sha256').update(x).digest('hex'),receipts=[];
async function read(path){const bytes=await readFile(path);receipts.push({path,sha256:sha(bytes)});return JSON.parse(bytes);}
const build=await read('/tmp/cardrpg-a5-b3-closure-artifact/build.json');
const artifact=await readFile('/tmp/cardrpg-a5-b3-closure-artifact/index.html');
assert.equal(build.head,source);assert.equal(sha(artifact),build.sha256);assert.equal(artifact.length,build.bytes);
for(const [path,hash] of Object.entries(build.sourceHashes))assert.equal(sha(await readFile(path)),hash,path);
const gates=await read('reports/cardrpg-big/a5/b3-closure/gates/checks.json');
for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){
 const row=gates.findLast(r=>r.name===name);assert(row&&row.code===0,name);assert.equal(row.head,source);
}
for(const row of gates)assert.equal(sha(await readFile(row.log)),row.sha256,row.log);
const checks=await read(base+'/checks/checks.json');
for(const name of ['build','day7-x1','paired-route','opening-1280','opening-1440','opening-1024']){
 const row=checks.findLast(r=>r.name===name);assert(row&&row.code===0,name);assert.equal(row.head,source);
}
for(const row of checks)assert.equal(sha(await readFile(row.log)),row.sha256,row.log);
const off=await read(base+'/off/checks.json'),offSource=await read(base+'/off/source.json');
assert.equal(off.sha256,'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');assert.equal(off.cells,165);assert.equal(off.routes,8250);
for(const [path,hash] of Object.entries(offSource))assert.equal(sha(await readFile(path)),hash,path);
const day7=await read(base+'/day7-x1/checks.json'),paired=await read(base+'/day7-x1/paired-route.json');
assert(day7.complete);assert.equal(day7.sha256,build.sha256);assert(Object.values(day7.gates).every(Boolean));
assert.deepEqual(day7.errors,[]);assert.deepEqual(day7.remote,[]);
assert.equal(paired.sourceReceiptSha256,receipts.find(r=>r.path===base+'/day7-x1/checks.json').sha256);
assert(paired.withAdvice.won);
assert.deepEqual(paired.withAdvice.encounters.map(e=>e.battle),day7.encounters.map(e=>e.battle));
const browser=[];
for(const width of [1280,1440,1024]){
 const r=await read(base+`/opening/browser-${width}/checks.json`);
 assert(r.complete);assert.equal(r.sha256,build.sha256);assert(Object.values(r.gates).every(Boolean));
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.remote,[]);
 assert(r.captures.every(c=>c.overflow===0&&c.contrast.length&&c.contrast.every(t=>t.ratio>=4.5)));
 browser.push({width,height:r.height,captures:r.captures.length,practiceMs:r.encounters[0].wallMs,
  equippedMs:r.timeline.find(e=>e.kind==='equipped').atMs,scoutedMs:r.timeline.find(e=>e.kind==='scouted').atMs,
  minimumScopedContrast:Math.min(...r.captures.flatMap(c=>c.contrast.map(t=>t.ratio)))});
}
const earnedRoot='reports/cardrpg-big/a5/b3/anchored-validation-03';
const reg=await read(earnedRoot+'/REGISTERED-METHOD.json');
for(const [path,hash] of Object.entries(reg.runtimeSource))assert.equal(sha(await readFile(path)),hash,path);
const economy=await read(earnedRoot+'/summary.json'),cohort=await read(earnedRoot+'/day7-checks/checks.json');
assert(Object.values(economy.gates).every(Boolean));assert(Object.values(cohort.gates).every(Boolean));
const balance=await read(earnedRoot+'/balance/summary.json');
execFileSync(process.execPath,['--test','tools/cardrpg-big/a5-b3-closure-receipts.test.mjs'],{stdio:'pipe'});
const scope=JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/a5-scope.mjs'],{encoding:'utf8'}));
await mkdir(base+'/artifact',{recursive:true});await writeFile(base+'/artifact/index.html',artifact);
await copyFile('/tmp/cardrpg-a5-b3-closure-artifact/build.json',base+'/offline-build.json');
const boss=day7.encounters.find(e=>e.kind==='boss');
const audit={status:'B3 TRAIN progression/source/x1 checks PASS; A5 overall PARTIAL, B1/B2/fresh acceptance remain open.',source,
 artifact:{path:base+'/artifact/index.html',sha256:build.sha256,bytes:build.bytes},gates,checks,off,browser,
 day7:{result:boss.battle.result,wallMs:boss.wallMs,withAdvice:paired.withAdvice.won,withoutAdvice:paired.withoutAdvice.won,interpretation:paired.interpretation},
 progression:{cohorts:cohort.cohorts,gates:cohort.gates,rewardGates:economy.gates,ratios:economy.ratios},
 balance:{pieces:balance.pieces.misses,worstPiecePp:balance.pieces.worst.gainPp,tiers:balance.tiers,bands:balance.bands.filter(r=>r.spreadPp<15||r.saturated),cats:balance.cats,sets:balance.sets,crew:balance.crew},
 scope,receipts,limitations:['TRAIN bot proxies and one x1 case, not a human playtest or fresh acceptance.','Heavy advised retries0/2 versus2/2 with no advice remain a measured limitation.','Original failed candidates and all50seed balance misses retained.','Targeted desktop captures only; full screenshot pack and30minute engagement still await Z.','Public demo unchanged until Z;20001–20500 UNUSED.']};
await writeFile(base+'/audit.json',JSON.stringify(audit,null,2));
const summary=`\n\n## Adopted anchored progression, reviewed B3 closure\n\nSource ${source}. All six source gates pass; counts and original logs are in [audit](b3/closure/audit.json). The exact registered formula reduces only bands6–9; bands1–5 and10–50 preserve every enemy stat. Old stored enemyStats keep their replay, no new state field or save version. Fresh OFF165cells/8250routes matches the frozen digest; baseline-v1 and13historical sims are exact.\n\nThe same earned H0 day7 loss is imported through the UI, then one available recommendation starts the ordinary retry route. Real x1 boss: VICTORY in ${(boss.wallMs/1000).toFixed(3)}s. ${paired.interpretation} This is one fixture. The independent90account TRAIN replay remains casual26/30, regular28/30 first-two wins, heavy28/30 first wins and24/24available suggestions; the heavy paired advice0/2 versus no-advice2/2 limitation remains.\n\nOpening regression at1280/1440/1024: ${browser.map(b=>`${b.width}: practice${(b.practiceMs/1000).toFixed(3)}s,${b.captures}captures`).join('; ')}. Zero overflow, scoped contrast≥4.5, no page errors or remote requests. The broader screenshot pack is not repeated here.\n\n[Measured offline artifact](b3/closure/artifact/index.html): ${build.bytes}bytes, SHA-256 ${build.sha256}. Public demo replacement waits for Z.\n\nBalance is NOT closed: TRAIN50 fourth-slot68/384misses, worst88pp; cat61.75–86.65%, set76.75–92.25%,23/24positive tiersteps and two bandspread misses. The displayed single-piece shares still understate combat impact. Fresh20001–20500 remains unused. The separate pressure-spread diagnostic is not adopted.\n`;
for(const path of ['reports/cardrpg-big/a5/B3-PROGRESSION.md','reports/cardrpg-big/a5/B3-DAY7-RETRY.md']){
 const text=await readFile(path,'utf8');assert(!text.includes('## Adopted anchored progression, reviewed B3 closure'),'Do not append duplicate closure');await writeFile(path,text+summary);
}
console.log(JSON.stringify({source,artifact:audit.artifact,browser,day7:audit.day7,status:audit.status}));
