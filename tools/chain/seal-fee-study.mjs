// Same cohort, source, earning window and finite catalog; change only the seal fee.
// Offline experiment. Never writes a deployed or signed price.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {loadRules,root} from '../cardrpg-sim/load.mjs';
import {loadC2Inputs,reconcileC2,c2Scenario} from './c2-supply.mjs';
import {simulate,summarize,mixes} from './token-sim.mjs';
const loaded=await loadRules();
const source=reconcileC2(loadC2Inputs(),loaded.rules.TRADE_BY_ID);
await loaded.vite.close();
const seeds=[1320023,1320047,1320073],demands=[1,.5,.1],fees=[1000,750,500,250],orders=[true,false];
const options={earningEndWeek:13,entitlementBps:2500,stylePlan:{adoptionBps:5000,maxStyles:3,openWeek:1}};
const files=['seal-fee-study.mjs','token-sim.mjs','c2-supply.mjs','season-budget.mjs','grant-headroom.mjs',
  'allocation-envelope.mjs','feature-plan.mjs','forge-preparation.mjs','../../packages/chain/src/forge.ts','../../packages/chain/src/cosmetics.ts'];
const hash=createHash('sha256').update(JSON.stringify({source,seeds,demands,fees,orders,options}));
for(const file of files)hash.update(readFileSync(resolve(root,'tools/chain',file)));
const modelHash=hash.digest('hex'),path=resolve(root,'docs/chain/seal-fee-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(path,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'Fee study source/model changed; regenerate');
function run(mix,sealFeeBps,demand,first,extra={}){
  const scenario=c2Scenario(source,{tail:extra.tail??'mean',botScale:extra.botScale??1,authority:extra.authority??false});
  const s=simulate(mix,{...scenario,...options,sealFeeBps,demand,
    forgePlan:{interestBps:5000,maxDesigns:3,first,reserveCompletion:true},...extra});
  const r=s.rows.at(-1),timing=s.forgeTiming.filter(t=>t.enrolled),interested=s.forgeOutcomes.interested;
  assert(s.rows.slice(13).every(w=>w.bossEmission===0));
  assert(s.rows.slice(26).every(w=>w.emission===0&&w.rankPending===0));
  return {...summarize(s),sealFeeBps,first,selfSourceForge:3+sealFeeBps/50,weeks:s.weeks,
    claims:r.inclusiveEmission,burn:r.cumulativeBurn,retained:r.playerCirculating,treasury:r.treasury,
    ...s.forgeOutcomes,completion:interested?s.forgeOutcomes.completed/interested:null,
    completionAt13:interested?timing.reduce((n,t)=>n+t.byWeek[13],0)/interested:null,
    crafts:r.crafts,consumed:r.consumed,styleBurn:r.styleBurn,forgeBurn:r.forgeBurn,
    healthySeasons:s.seasons.filter(q=>q.healthTargetMet).length,
    activeTail:s.seasons.slice(-4).every(q=>q.routine>=1&&q.burn>=1),forgeTiming:s.forgeTiming,
    finalClaimsAfterBurn:r.inclusiveEmission-r.cumulativeBurn};
}
const rows=cached?.rows??[];
if(!cached)for(const sealFeeBps of fees)for(const demand of demands){
  for(const first of orders)for(const mix of mixes)for(const seed of seeds)
    rows.push(run({...mix,seed},sealFeeBps,demand,first));
  console.log(`Fee ${sealFeeBps}bps / participation ${demand} complete`);
}
const stressSpecs=[{name:'source-authority-zero',authority:true},{name:'no-adopters',demand:0},
  {name:'collapse-week7',demandShockWeek:7,demandAfterShock:0},
  {name:'fee-bypass',paidMarketShare:0},{name:'bot-heavy3-hoard',botScale:3,botsHoard:true},
  {name:'observed-source-only',tail:'stop'},{name:'mature-source',tail:'week4'},
  {name:'no-routine',entitlementBps:0},{name:'free-resale',marketPriceYarn:0},
  {name:'sample-price1',marketPriceYarn:1},{name:'expensive-price100',marketPriceYarn:100},
  {name:'five-year-finite',weeks:260}];
const stresses=cached?.stresses??mixes.flatMap(mix=>stressSpecs.map(({name,demand=.5,...extra})=>
  ({name,...run({...mix,seed:1321091},500,demand,true,extra)})));
const min=xs=>xs.every(n=>n!==null)?Math.min(...xs):null;
const max=xs=>xs.every(n=>n!==null)?Math.max(...xs):null;
const groups=fees.flatMap(sealFeeBps=>demands.flatMap(demand=>orders.map(first=>{
  const rs=rows.filter(r=>r.sealFeeBps===sealFeeBps&&r.demand===demand&&r.first===first);
  return {sealFeeBps,demand,first,runs:rs.length,passes:rs.filter(r=>r.flowPass&&r.farmingPass).length,
    worstRatio:max(rs.map(r=>r.emissionBurn)),minCompletion:min(rs.map(r=>r.completion)),
    minCompletionAt13:min(rs.map(r=>r.completionAt13)),minCrafts:min(rs.map(r=>r.crafts)),maxCrafts:max(rs.map(r=>r.crafts)),
    minBurn:min(rs.map(r=>r.burn)),maxBurn:max(rs.map(r=>r.burn)),
    healthyAll:rs.filter(r=>r.healthySeasons===4).length};
})));
const paired=rows.filter(r=>r.sealFeeBps!==1000).map(r=>{
  const base=rows.find(b=>b.sealFeeBps===1000&&b.seed===r.seed&&b.mix===r.mix&&b.demand===r.demand&&b.first===r.first);
  return {sealFeeBps:r.sealFeeBps,mix:r.mix,seed:r.seed,demand:r.demand,first:r.first,
    additionalCompleted:r.completed-base.completed,additionalCrafts:r.crafts-base.crafts,
    burnDelta:r.burn-base.burn,retainedDelta:r.retained-base.retained,
    completionAt13Delta:r.completionAt13-base.completionAt13,claimsDelta:r.claims-base.claims};
});
const data={version:1,modelHash,source,seeds,demands,fees,orders,options,rows,stresses,groups,paired,
  runs:rows.length,stressRuns:stresses.length,observedPeople:0,activation:false,
  assumptions:{source:'Pinned C2 gross creation, before use/salvage; mean extrapolation after30 observed days. Actual ordinary authority stays zero.',
    behavior:'Same persistent participation at every fee;50% finite style/forge interest. These are structural sensitivities, NOT estimated demand elasticity. Both spending orders retained.',
    economics:'Grant20, sale5%, forge3, style4 and allocation unchanged. Boss1.5 for13 weeks, closed rank settled under actual cap; no renewed routine entitlement.',
    metric:'All claims including grants; original2x flow and3x farmer gates, separate seasonal1x target. Actual recipes and the ORIGINAL interested cohort retained, not only successful buyers.',
    basket:'5% is the exact upper seal rate fitting2 Epic seals+3 forge+4 style+one Star Thread seal+2 reserve in20. Fee reduction cannot burn money retained by absent recipients.',
    scope:'No signed seal policy, production fee, contract, source authority, combat stat, grant or deployment is changed.'}};
if(!cached){
  writeFileSync(path,JSON.stringify(data,null,2)+'\n');
  const csv=rs=>{const keys=Object.keys(rs[0]).filter(k=>k!=='forgeTiming');return keys.join(',')+'\n'+rs.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n';};
  writeFileSync(resolve(root,'docs/chain/seal-fee-study.csv'),csv(rows));
  writeFileSync(resolve(root,'docs/chain/seal-fee-paired.csv'),csv(paired));
}
const f=(n,d=3)=>n===null?'n/a':n.toFixed(d);
const lines=groups.map(g=>`<tr data-demand="${g.demand}"><td>${g.sealFeeBps/100}%</td><td>${g.demand*100}%</td><td>${g.first?'Forge trước':'Style trước'}</td><td>${g.passes}/${g.runs}</td><td>${f(g.worstRatio)}</td><td>${f(100*g.minCompletionAt13,1)}%</td><td>${f(100*g.minCompletion,1)}%</td><td>${g.minCrafts}–${g.maxCrafts}</td><td>${g.healthyAll}/${g.runs}</td></tr>`).join('');
const chosen=groups.filter(g=>g.first&&g.demand===.5).sort((a,b)=>a.sealFeeBps-b.sealFeeBps);
const chart=`<svg xmlns="http://www.w3.org/2000/svg" width="780" height="340" viewBox="0 0 780 340" role="img" aria-labelledby="title desc"><title id="title">50% tham gia, forge trước</title><desc id="desc">Cùng9 lượt cho mỗi mức phí. Cột là tỷ lệ hoàn thành forge thấp nhất ở tuần13; nhãn nêu tỷ lệ phát trên đốt xấu nhất.</desc><rect width="780" height="340" rx="18" fill="#15263b"/><g fill="#edf4ff" font-family="system-ui"><text x="28" y="35" font-size="20">50% tham gia · Forge trước · 9 lượt/mức phí</text><text x="28" y="63" font-size="15">Hoàn thành ở tuần 13 (thấp nhất) và phát/đốt (xấu nhất)</text>${chosen.map((g,i)=>{const x=72+i*180,h=g.minCompletionAt13*150;return `<rect x="${x}" y="${250-h}" width="100" height="${h}" rx="5" fill="#62d5b1"/><text x="${x+50}" y="${235-h}" text-anchor="middle" font-size="19">${f(g.minCompletionAt13*100,1)}%</text><text x="${x+50}" y="278" text-anchor="middle" font-size="18">Phí ${g.sealFeeBps/100}%</text><text x="${x+50}" y="308" text-anchor="middle" font-size="16">Phát/đốt ${f(g.worstRatio)}</text>`;}).join('')}</g></svg>`;
writeFileSync(resolve(root,'docs/chain/seal-fee-study.svg'),chart);
const mobileCards=chosen.map(g=>`<article><strong>Phí ${g.sealFeeBps/100}%</strong><span>Hoàn thành ${f(g.minCompletionAt13*100,1)}%</span><span>Phát/đốt ${f(g.worstRatio)}</span></article>`).join('');
writeFileSync(resolve(root,'docs/chain/seal-fee-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN — phí seal và vật phẩm hoàn thành</title><style>body{max-width:1100px;margin:32px auto;padding:0 20px;background:#101b2b;color:#e7edf7;font:17px/1.6 system-ui}h1{font-size:clamp(30px,5vw,48px);line-height:1.15}section{border-top:1px solid #40506b;padding:22px 0}svg{width:100%;height:auto}.mobile-stats{display:none}.mobile-stats article{padding:14px;background:#15263b;border-radius:10px;display:grid;gap:5px;font-size:14px}.mobile-stats strong{font-size:19px}@media(max-width:600px){.chart{display:none}.mobile-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}}.scroll{overflow:auto}table{border-collapse:collapse;min-width:1000px;width:100%}td,th{padding:10px;text-align:left;border-bottom:1px solid #40506b}a{color:#72d9bd}select{font:inherit;padding:8px;background:#20324a;color:inherit;border-radius:6px}.warning{color:#ffd58d}</style><p>Fuji 43113 · Testnet — no real value</p><h1>Giảm phí, hoàn thành được gì?</h1><p>216 kịch bản ghép cùng seed + 36 stress. Grant 20; pilot chỉ 1 mùa 13 tuần; 3 style và 3 forge trọn đời. 0 người chơi thật được quan sát.</p><p class="warning">Đây là so sánh thiết kế. Phí seal công khai vẫn 10%; chưa thay mức thưởng hoặc bật nguồn mint chiến dịch.</p><section><h2>Chi phí cả công thức</h2><p>Hai Epic tự seal + forge 3: phí 10% → 23 YARN; 7,5% → 18; 5% → 13; 2,5% → 8. Ở 5%, một forge 13 + style 4 + seal Star Thread 1 để lại 2 trong grant 20. Nguồn Epic phải tồn tại và hợp lệ; giá rẻ không tạo quyền mint.</p><div class="chart">${chart}</div><div class="mobile-stats">${mobileCards}</div><p>Nhóm giả định 50% tham gia, forge trước: hoàn thành thấp nhất ở tuần 13; phát/đốt xấu nhất trong 9 lượt mỗi mức phí.</p><p>Giữ tỷ lệ tham gia như nhau để xem tác động cơ học của giá. Chưa có bằng chứng rằng giảm phí sẽ thu hút thêm người mua. Tiền đốt, số món hoàn thành và nhu cầu có thể đi khác hướng.</p></section><section><h2>Tất cả mức phí, cả hai thứ tự mua</h2><label for="demand">Tỷ lệ tham gia giả định </label><select id="demand"><option value="all">Tất cả</option value="1">100%</option><option value="0.5">50%</option><option value="0.1">10%</option></select><div class="scroll"><table><thead><tr><th>Phí seal</th><th>Tham gia</th><th>Ưu tiên</th><th>Đạt 2×/3×</th><th>Phát/đốt max</th><th>Forge tuần 13 min</th><th>Forge tuần 52 min</th><th>Số món</th><th>4 mùa ≥1</th></tr></thead><tbody>${lines}</tbody></table></div><p>Mỗi hàng 9 lượt: 3 mix × 3 seed. Tỷ lệ hoàn thành lấy toàn bộ nhóm quan tâm ban đầu làm mẫu số, kể cả người bỏ cuộc. Mỗi người có thể làm tối đa 3 món; không có thưởng do giao dịch.</p></section><section><h2>Giới hạn và quyết định</h2><p>Nhóm tham gia thấp vẫn giữ tiền chưa chi; tăng số công thức hoàn thành không tự giải quyết khoản đó. Tất cả hàng thất bại được giữ. 5% là ứng viên thử giá có lý do về ngân sách, chưa là mức cân bằng được xác nhận. Thưởng định kỳ vẫn tắt.</p><p>C2 đo nguồn gross trước salvage/use, cùng lịch bắt đầu; bot và sau 30 ngày là giả định. 36 stress kiểm tra nguồn quyền 0, bỏ cuộc, bot giữ tiền, bỏ phí bán, nguồn dừng, giá bán 0/1/100 và 5 năm. Không sàn/trần giá P2P.</p><p><a href="seal-fee-study.json">Dữ liệu và 36 stress</a> · <a href="seal-fee-study.csv">216 lượt CSV</a> · <a href="seal-fee-paired.csv">Chênh lệch so với 10%</a> · <a href="catalog-budget-study.html">Giỏ hàng chính xác</a> · <a href="../design/chain/TOKENOMICS-RESEARCH.md">Nguồn nghiên cứu</a></p></section><script>document.querySelector('#demand').addEventListener('change',e=>document.querySelectorAll('tr[data-demand]').forEach(r=>r.hidden=e.target.value!=='all'&&r.dataset.demand!==e.target.value));</script></html>`);
console.log(JSON.stringify({runs:rows.length,stressRuns:stresses.length,groups},null,2));
