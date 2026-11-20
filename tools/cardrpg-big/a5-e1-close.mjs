// REFERENCE: PROMPT-A5 E1. Assemble measured receipts; never substitute desired numbers.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='reports/cardrpg-big/a5/e1',source='602587b351165bc1935d612cbed7d109d7c38fc0',hash=b=>createHash('sha256').update(b).digest('hex');
const receipts=[];
async function receipt(path){const b=await readFile(path);receipts.push({path,sha256:hash(b)});return JSON.parse(b);}
const gates=await receipt('reports/cardrpg-big/a5/e1-reviewed/gates/checks.json');
for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){
 const row=gates.findLast(r=>r.name===name);assert(row&&row.code===0,name);assert.equal(row.head,source);}
for(const g of gates)assert.equal(hash(await readFile(g.log)),g.sha256,g.log);
const build=await receipt('/tmp/cardrpg-a5-e1-artifact/build.json'),artifact=await readFile('/tmp/cardrpg-a5-e1-artifact/index.html');
assert.equal(build.head,source);assert.equal(hash(artifact),build.sha256);assert.equal(artifact.length,build.bytes);
for(const [p,h]of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(p)),h,p);
await mkdir(base+'/artifact',{recursive:true});await copyFile('/tmp/cardrpg-a5-e1-artifact/index.html',base+'/artifact/index.html');await copyFile('/tmp/cardrpg-a5-e1-artifact/build.json',base+'/reviewed/offline-build.json');
const browser=[];
for(const width of [1280,1440,1024]){
 const r=await receipt(base+`/reviewed/browser-${width}/checks.json`);
 assert(r.passed);assert.equal(r.sha256,build.sha256);assert.equal(r.captures.length,6);assert.deepEqual(r.errors,[]);assert.deepEqual(r.remote,[]);
 assert(r.captures.every(c=>c.overflow===0&&c.contrast.every(x=>x.ratio>=4.5)));assert(r.forecastBudget400ms);
 browser.push({width,forecastMaxMs:Math.max(...r.forecasts.filter(f=>f.cpu===1&&!f.cached).map(f=>f.elapsedMs)),minimumScopedContrast:Math.min(...r.captures.flatMap(c=>c.contrast.map(x=>x.ratio))),checks:r.checks});
}
const cpu4=await receipt(base+'/reviewed/forecast-cpu4/checks.json');assert(cpu4.passed);assert.equal(cpu4.sha256,build.sha256);assert.equal(cpu4.observations.length,3);
const scouting=await receipt(base+'/reviewed/scouting-route/checks.json');assert(scouting.passed);assert.equal(scouting.sha256,build.sha256);
const off=await receipt(base+'/reviewed/off/checks.json'),offSource=await receipt(base+'/reviewed/off/source.json');
assert.equal(off.sha256,'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');assert.equal(off.routes,8250);assert.equal(off.cells,165);
for(const [p,h]of Object.entries(offSource))assert.equal(hash(await readFile(p)),h,p);
const rules=await receipt(base+'/rules/checks.json');assert(rules.passed);assert.equal(rules.outcome.firstFallen.id,'mochi');assert.deepEqual(rules.outcome.damageByRow,{front:1194,rear:1612});
const scope=JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/a5-scope.mjs'],{encoding:'utf8'}));
const audit={status:'E1 functional checks PASS; day7 victory and balance closure remain open.',source,artifact:{path:base+'/artifact/index.html',sha256:build.sha256,bytes:build.bytes},gates,browser,cpu4,scouting,off,scope,receipts,
 limitations:['Targeted real-click flows use Skip; no human playtest, elapsed engagement or day7 victory claim.',
 'Result amounts are observed contributions, not counterfactual causal effects. Distinct gear receipts use exact version1 grant formats; unknown formats are not guessed.',
 'Advice chooses among affordable owned changes using10 TRAIN seeds. It can help without guaranteeing a win; no acceptance seeds sampled.',
 'Original rule helper rerun overwrote standalone timing fields before archive; original timing log survives, exact H0 battle equality was asserted on both runs.',
 'CPU4 is a Chromium page throttle, not a calibrated four-times-slower worker or hardware claim.',
 'Full screenshot pack and all-text contrast remain Z. Combat remains A4.']};
await writeFile(base+'/reviewed/audit.json',JSON.stringify(audit,null,2));
const report=`# A5 E1 — choices, named results and a useful next try

Kết quả trận đấu đã gọi tên mèo và lượng đóng góp thực tế.
Gợi ý dùng thay đổi đang có, kiểm tra chi phí và chỉ áp dụng một lần.
Dự báo chạy riêng, phản hồi theo đội hình và ghi rõ không đảm bảo chiến thắng.
Đi qua các điểm khác nhau mở từng manh mối của boss.
Boss ngày 7 và cân bằng chiến đấu vẫn chưa đạt nghiệm thu A5.

Status: E1 functional checks PASS. Source ${source}; no combat tuning, save-schema change or new acceptance sampling.

## What a player sees

- Result shows three measured actor/item contributions, row damage and the first fallen cat. Two-piece, four-piece and unique grants cannot be conflated.
- The same earned day7 loss names Clover's790 healing, Soot's707damage and Mochi's244absorbed damage. Rear damage1612/2806=57%; Mochi falls in round6. The full battle is exactly equal to H0.
- Available advice is **${rules.advice.label}**, costing no currency. Applying settles the old route once, rechecks the build and opens the first stop of a fresh route. It never resurrects the old battle or grants an item. Original route settlement rewards stay intact.
- Worker forecast uses20 fixed TRAIN seeds, Risky/Even/Favoured and a named risk. Build changes cancel stale work; returning to an identical build uses a32-entry cache. No win percentage is shown.
- First stop reveals opening; story reveals reach; elite reveals closing. Reviewed real clicks reach boss preparation with3/3known, and the opening clue no longer leaks the closing pattern.

## Measured checks

| Width | Cold build forecast max ms | Scoped minimum contrast |
|---|---:|---:|
${browser.map(r=>`|${r.width}|${r.forecastMaxMs.toFixed(1)}|${r.minimumScopedContrast.toFixed(3)}|`).join('\n')}

CPU4 page-throttle observations: ${cpu4.observations.map(r=>r.elapsedMs.toFixed(1)).join('/')}ms elapsed; worker compute ${cpu4.observations.map(r=>r.computeMs.toFixed(1)).join('/')}ms. These are reported separately from CPU1, not assumed to be calibrated worker slowdown. Boss forecast ${scouting.forecast.elapsedMs.toFixed(1)}ms on the real-click route.

18 reviewed captures across1280/1440/1024: zero horizontal overflow; no page errors/remote requests; exact state/currency assertions after retry. Original18captures and original CPU4 observations remain separate. Full pack is reserved for Z.

Typecheck/lint/1739web/1121rules(+2expectedfail/11skip)/421E2E/build PASS. Original type portability and route-helper failures retained. Original E2E had one unrelated V2 idle-XP fake-clock timeout; unchanged retry passed421. Reviewed results and hashes are in the [audit](e1/reviewed/audit.json).

Fresh OFF165cells/8250routes matches47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3. Baseline-v1,13historical sims, protected/B-path guards, dependencies and author PASS. Old save coverage remains in the rules suite.

Reviewed [offline artifact](e1/artifact/index.html): ${build.bytes}bytes, SHA-256 ${build.sha256}. Public demo remains unchanged until Z. This phase does not re-establish P1 startup gates.

## Limits retained

The retry suggestion improves the fixed10-seed check from${rules.advice.before.wins}/10to${rules.advice.after.wins}/10; this is not the required≥70%day7gate. B1/B2 combat gates, full progression acceptance, E2/E3 engagement and Z remain open. Result contributions are observations, not proof that one item caused the win. Bot/screenshots are proxies, not a human playtest.

No merge, deployment, B renderer adoption, wallet use or on-chain issuance. Existing version1 B contracts stay unchanged.
`;
await writeFile('reports/cardrpg-big/a5/E1-CHOICE-PAYOFF.md',report);console.log(JSON.stringify({status:audit.status,source,artifact:audit.artifact,browser,cpu4:cpu4.observations}));
