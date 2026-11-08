// REFERENCE: PROMPT-A5 E2. Bind the reviewed source, artifact, UI and earned economy to durable evidence.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='reports/cardrpg-big/a5/e2',source='cffa5b878c26f664a8282a53a09a8146c2d1c1ef',hash=b=>createHash('sha256').update(b).digest('hex');
const receipts=[];
async function receipt(path){const b=await readFile(path);receipts.push({path,sha256:hash(b)});return JSON.parse(b);}
const gates=await receipt('reports/cardrpg-big/a5/e2-reviewed/gates/checks.json');
for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){
 const row=gates.findLast(r=>r.name===name);assert(row&&row.code===0,name);assert.equal(row.head,source);
}
for(const g of gates)assert.equal(hash(await readFile(g.log)),g.sha256,g.log);
const artifact=await readFile('/tmp/cardrpg-a5-e2-reviewed-artifact/index.html'),build=JSON.parse(await readFile('/tmp/cardrpg-a5-e2-reviewed-artifact/build.json','utf8'));
assert.equal(build.head,source);assert.equal(hash(artifact),build.sha256);assert.equal(artifact.length,build.bytes);
const harness='tools/cardrpg-big/a5-e2-browser.mjs';
for(const [p,h]of Object.entries(build.sourceHashes)){
 if(p===harness){
  // The artifact predates only the gradient-measurement correction, not a runtime change.
  const original=execFileSync('git',['show',`${source}:${p}`]);assert.equal(hash(original),h,p);
  await writeFile(base+'/original/browser-before-gradient-fix.mjs',original);
  receipts.push({path:p,sha256:hash(await readFile(p))});
 }else assert.equal(hash(await readFile(p)),h,p);
}
await mkdir(base+'/artifact',{recursive:true});
await copyFile('/tmp/cardrpg-a5-e2-reviewed-artifact/index.html',base+'/artifact/index.html');
await copyFile('/tmp/cardrpg-a5-e2-reviewed-artifact/build.json',base+'/reviewed/offline-build.json');
await receipt(base+'/reviewed/offline-build.json');
const browser=[];
for(const width of [1280,1440,1024]){
 const r=await receipt(base+`/reviewed/browser-${width}/checks.json`);
 assert(r.passed);assert.equal(r.sha256,build.sha256);assert.equal(r.captures.length,9);
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.remote,[]);
 assert(r.captures.every(c=>c.overflow===0&&c.contrast.length&&c.contrast.every(x=>x.ratio>=4.5)));
 browser.push({width,captures:r.captures.length,minimumScopedContrast:Math.min(...r.captures.flatMap(c=>c.contrast.map(x=>x.ratio))),checks:r.checks});
}
const off=await receipt(base+'/reviewed/off/checks.json'),offSource=await receipt(base+'/reviewed/off/source.json');
assert.equal(off.sha256,'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');assert.equal(off.cells,165);assert.equal(off.routes,8250);
for(const [p,h]of Object.entries(offSource))assert.equal(hash(await readFile(p)),h,p);
const rules=await receipt(base+'/rules/checks.json');assert(rules.passed);
const count=s=>Object.values(s.v4.journey.stars).reduce((n,r)=>n+r.conditions.filter(Boolean).length,0);
assert.equal(count(rules.beforeClaim),rules.stars);assert.equal(count(rules.afterClaim),rules.stars);
for(const id of ['fish','threads','stamps','essence'])assert.equal(rules.afterClaim.account.currencies[id]-rules.beforeClaim.account.currencies[id],rules.claims.reduce((n,r)=>n+(r.reward[id]??0),0));
assert.deepEqual(rules.afterClaim.v4.journey.claims,rules.claims.map(r=>r.id));
const economy=await receipt(base+'/economy/summary.json');
assert.equal(economy.sourceSha256,hash(await readFile(base+'/economy/progression.json')));assert.equal(economy.accountDays,4050);
const scope=JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/a5-scope.mjs'],{encoding:'utf8'}));
const audit={status:'E2 functional checks PASS; elapsed reward cadence and broader balance remain open.',source,
 artifact:{path:base+'/artifact/index.html',sha256:build.sha256,bytes:build.bytes},gates,browser,off,scope,economy,receipts,
 limitations:['Targeted UI checks use Skip; no elapsed engagement, full screenshot pack or human playtest claim.',
 'The earned demonstration route reaches 15 stars. Rank, set and Legendary discovery kinds use isolated unit fixtures.',
 'Economy uses actual commands and synthetic time. It is not seven/45 elapsed days or fresh combat acceptance.',
 'Exact version1 earned-reveal forwarding is implemented; B renderer is not adopted. Version2 discovery is a separate optional request.',
 'The artifact source manifest contains the original UI harness. Only its gradient-background measurement changed afterward; both harnesses and failed original measurements are retained. Runtime source hashes remain exact.',
 'OFF parity, migration and source checks pass. P1 startup must still be measured on the later delivery artifact.']};
await writeFile(base+'/reviewed/audit.json',JSON.stringify(audit,null,2));
const rows=economy.rows.map(r=>`|${r.style}|${r.firstAnyLegendary.medianDay}|${r.firstChosen.medianDay}|${r.firstChosen.censored}|`).join('\n');
const report=`# A5 E2 — route stars and moments worth keeping

Mỗi điểm trên đường đi có ba mục tiêu rõ ràng để thử lại.
Mốc sao và khám phá mới có thẻ ăn mừng ngắn, có thể bỏ qua.
Nhật ký giữ lại khám phá; phần thưởng chỉ nhận một lần và giữ giới hạn ngày.
Trang nhà làm rõ việc tiếp theo, giờ phục vụ và điều chờ đợi ngày mai.
Nhịp thưởng 30 phút và cân bằng chiến đấu vẫn cần nghiệm thu riêng.

Status: E2 functional checks PASS. Source ${source}; combat remains A4. Acceptance seeds20001–20500 are unused.

## Player behavior

- Combat stars: win, nobody falls, finish within6/8/10rounds for battle/elite/boss. Other stops: finish, all cats at half HP, a four-mark crew job. Best individual badges persist across visits; replay never creates a second identity for the same chapter/band/position/kind.
- First crew threshold, four-piece set, rank, Legendary and star tier record a discovery. The DOM card lasts at most1.2s, skips immediately and respects reduced motion. Journal acknowledgment never grants another reward.
- Stars3/9/18 offer capped30stamps/20threads/40stamps. A reward fully blocked by a cap remains claimable tomorrow; a partial claim clearly previews the actual amount and settles once.
- THC13 persists the journal; prior THC7/THC12 saves migrate quietly without invented earned events. Both modes remain readable.
- One primary Home action remains above the fold. Tonight's goal, next star, service and tomorrow are visible; route and daily-board details stay below.

## Measured evidence

Earned route: ${rules.stars}stars. Actual claims: ${rules.claims.map(r=>r.id+' '+JSON.stringify(r.reward)).join('; ')}. The20thread nominal reward became10 because only10daily allowance remained; the original browser assertion incorrectly expected uncapped140total and is retained. Source currency values were correct.

Three desktop widths, nine captures each, both looks: zero horizontal overflow and scoped contrast>=4.5. Minimums ${browser.map(r=>r.width+':'+r.minimumScopedContrast.toFixed(3)).join(', ')}. New Home action, Prepare goals, skipped/reduced-motion discovery, visited stars, exact capped claims and persistent Journal are real-click checked. Full screenshot pack remains Z.

Typecheck/lint/web1743/rules1130(+2expectedfail/11skip)/E2E421/build PASS. Original import-order failure in gear visuals was fixed by deferring A-owned discovery catalog reads; original logs/artifact remain. All gate logs and provenance: [audit](e2/reviewed/audit.json).

Post-stars economy:90accounts/4050days, actual commands, serialized save roundtrip every day, daily caps and once-only claims checked. All-source first Legendary and selector:

|Style|Legendary median day|Selector median day|Selector censored|
|---|---:|---:|---:|
${rows}

Earned heavy/casual ratios: ${Object.entries(economy.ratios).map(([k,v])=>k+' '+v.toFixed(6)+'x').join('; ')}. Gate results: ${Object.entries(economy.gates).map(([k,v])=>k+' '+(v?'PASS':'MISS')).join('; ')}. Raw daily receipts and independent calculations are retained; this does not establish the separate day7 two-attempt gate.

Fresh OFF165cells/8250routes digest47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3 exact. Baseline-v1 and13historical sims exact; no B/protected edits or new runtime dependency. [Artifact](e2/artifact/index.html): ${build.bytes}bytes; SHA-256 ${build.sha256}. Public demo remains unchanged until Z.

Exact version1 invitation receipt forwarding reaches the existing optional SceneView boundary; B renderer is not adopted, so no3D rendering claim. Version2 discovery request is in A-OUTBOX2026-11-08T08:35:01Z. No merge, deployment, wallet use or on-chain issuance.
`;
await writeFile('reports/cardrpg-big/a5/E2-GOALS-CELEBRATIONS.md',report);
console.log(JSON.stringify({status:audit.status,artifact:audit.artifact,browser,economy: {gates:economy.gates,ratios:economy.ratios}}));
