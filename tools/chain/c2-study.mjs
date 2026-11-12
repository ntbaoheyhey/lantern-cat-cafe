// C2 source integration: preserve evidence, temporal assumptions and failed rows.
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
const seeds=[1310009,1310039,1310053],tails=['mean','week4','stop'],bots=[1,3],demands=[1,.5,.1];
const policies=[
  {name:'original6',rewardPolicy:'fixed',entitlementBps:10000},
  {name:'candidate1.5',rewardPolicy:'fixed',entitlementBps:2500},
  {name:'headroom1.5',rewardPolicy:'grant-headroom',entitlementBps:2500},
];
const features={stylePlan:{adoptionBps:5000,maxStyles:3,openWeek:1},
  forgePlan:{interestBps:5000,maxDesigns:3,first:true,reserveCompletion:true}};
const h=createHash('sha256').update(JSON.stringify({source,seeds,tails,bots,demands,policies,features}));
for(const f of ['c2-study.mjs','c2-supply.mjs','token-sim.mjs','season-budget.mjs','grant-headroom.mjs','forge-preparation.mjs',
  'allocation-envelope.mjs','feature-plan.mjs','../../packages/chain/src/forge.ts','../../packages/chain/src/cosmetics.ts'])
  h.update(readFileSync(resolve(root,'tools/chain',f)));
const modelHash=h.digest('hex'),path=resolve(root,'docs/chain/c2-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(path,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'C2 evidence/model changed; regenerate');
function run(mix,policy,tail,botScale,demand,extra={}){
  const scenario=c2Scenario(source,{tail,botScale,authority:extra.authority??false});
  const {name,...settings}=policy;
  const s=simulate(mix,{...scenario,...settings,...features,demand,...extra});
  const last=s.rows.at(-1),tailSeasons=s.seasons.slice(-4);
  return {policy:name,tail,botScale,...summarize(s),weeks:s.weeks,
    claims:last.inclusiveEmission,burn:last.cumulativeBurn,forgeBurn:last.forgeBurn,styleBurn:last.styleBurn,
    crafts:last.crafts,...s.forgeOutcomes,playerBalance:last.playerCirculating,treasury:last.treasury,
    acquired:last.acquired,overflow:last.shelfOverflow,consumed:last.consumed,
    activeTail:tailSeasons.every(q=>q.routine>=1&&q.burn>=1),healthyTail:tailSeasons.every(q=>q.healthTargetMet),
    hours:s.hoursByType,authority:scenario.assumptions.authority};
}
const rows=cached?.rows??[];
if(!cached)for(const tail of tails)for(const botScale of bots)for(const policy of policies){
  for(const demand of demands)for(const mix of mixes)for(const seed of seeds)
    rows.push(run({...mix,seed},policy,tail,botScale,demand));
  console.log(`C2 ${tail}/bot${botScale}/${policy.name} complete`);
}
const stressSpecs=[
  {name:'authority-zero',authority:true},
  {name:'demand-zero',demand:0},
  {name:'collapse-week14',demandShockWeek:14,demandAfterShock:0},
  {name:'no-market-fee',paidMarketShare:0},
  {name:'five-year-mean',weeks:260},
  {name:'five-year-source-stops',weeks:260,tail:'stop'},
];
const stresses=cached?.stresses??mixes.flatMap(mix=>stressSpecs.map(({name,tail='mean',demand=.5,...options})=>
  ({name,...run({...mix,seed:1311019},policies[2],tail,3,demand,options)})));
// Pure implemented-seal/market controls retain the original6 proposal without
// assuming interest in the new locally implemented optional catalogs.
const controls=cached?.controls??mixes.map(mix=>run(mix,policies[0],'mean',1,1,{stylePlan:null,forgePlan:null}));
const groups=tails.flatMap(tail=>bots.flatMap(botScale=>policies.flatMap(policy=>demands.map(demand=>{
  const rs=rows.filter(r=>r.tail===tail&&r.botScale===botScale&&r.policy===policy.name&&r.demand===demand);
  return {tail,botScale,policy:policy.name,demand,runs:rs.length,
    passes:rs.filter(r=>r.flowPass&&r.farmingPass).length,
    worstRatio:rs.every(r=>r.emissionBurn!==null)?Math.max(...rs.map(r=>r.emissionBurn)):null,
    worstFarmerCasual:Math.max(...rs.map(r=>r.farmerCasual??0)),
    minCompletion:Math.min(...rs.map(r=>r.interested?r.completed/r.interested:0)),
    maxUnfinished:Math.max(...rs.map(r=>r.interested?r.sealedButNeverForged/r.interested:0)),
    active:rs.filter(r=>r.activeTail).length,healthy:rs.filter(r=>r.healthyTail).length};
}))));
const data={version:1,modelHash,source,seeds,tails,bots,demands,policies,features,
  runs:rows.length,stressRuns:stresses.length,controls,groups,rows,stresses,
  activation:false,observedPeople:0,
  assumptions:{eligibility:'Gross eligible creation is not unconsumed inventory. Canonical CHAIN policy hash matches C2 snapshot; C2 runtime differs from this checkout and is pinned, not falsely remeasured.',
    time:'First4 observed weeks + actual2 days in week5; missing days31-35 have zero new supply. Week6+ explicitly extrapolates overall mean or week4, or stops. No measured calendar variation.',
    humans:'C2 casual3.5, regular7, heavy21 hours/active week map to casual/regular/farmer.90% token-model weekly activity remains an assumption.',
    bots:'No measured C2 bot profile. Heavy yield×1 or×3 at assumed70 hours tests bounds; none is calibrated.',
    stock:'Gross creation before C2 salvage/use is optimistically offered to chain. No replay of ownership, soft-currency budgets or every item history beyond the source experiment.',
    sinks:'Three styles at4 and three forge designs at3+two sealed Epics; both compete for one wallet balance.50% interest and complete-recipe saving are assumptions. Existing fees/grants untouched.',
    inference:'Three fresh seeds quantify conditional simulation variation only. No causal, behavioral or population confidence claim. Preserve original cumulative<=2, farming<=3, seasonal>=1 and completion separately.'}};
if(!cached){
  writeFileSync(path,JSON.stringify(data,null,2)+'\n');
  const keys=Object.keys(rows[0]).filter(k=>k!=='hours');
  writeFileSync(resolve(root,'docs/chain/c2-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');
  writeFileSync(resolve(root,'docs/chain/c2-source-supply.json'),JSON.stringify({source,...c2Scenario(source)},null,2)+'\n');
}
const f=n=>n===null?'n/a':n.toFixed(3);
const table=groups.map(g=>`<tr><td>${g.tail}</td><td>${g.botScale}×</td><td>${g.policy}</td><td>${g.demand*100}%</td><td>${g.passes}/${g.runs}</td><td>${f(g.worstRatio)}</td><td>${f(100*g.minCompletion)}%</td><td>${g.healthy}/${g.runs}</td></tr>`).join('');
writeFileSync(resolve(root,'docs/chain/c2-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN — nguồn cung C2</title><style>body{max-width:1120px;margin:32px auto;padding:0 20px;background:#101b2b;color:#e7edf7;font:17px/1.6 system-ui}h1{font-size:clamp(30px,5vw,48px);line-height:1.15}a{color:#72d9bd}.scroll{overflow:auto}table{border-collapse:collapse;min-width:920px;width:100%}td,th{padding:10px;text-align:left;border-bottom:1px solid #40506b}section{border-top:1px solid #40506b;padding:20px 0}.status{color:#ffbc83}</style><p>Fuji43113 · Testnet — no real value</p><h1>Nguồn cung mới, giả định được tách rõ</h1><p>Đối soát600 tài khoản giả lập ×30 ngày từ C2; ${rows.length} kịch bản52 tuần +${stresses.length} stress +3 đối chứng.0 người chơi được quan sát.</p><section><h2>Đã kiểm chứng gì?</h2><p>Tất cả${source.counts.items} mục thống kê khớp dữ liệu gốc,64 mẫu Epic+ đủ điều kiện theo catalog. Casual/regular/heavy dùng3,5/7/21 giờ; bot70 giờ và hệ số1×/3× là giả định riêng. Epic và Legendary giữ phí seal10/30, nguồn rare định kỳ bằng0.</p><p class="status">Đồ tạo ra chưa trừ salvage hoặc đồ đang dùng. Dữ liệu chung lịch bắt đầu12/11 và chỉ dài30 ngày. Mô hình52 tuần không biến phần kéo dài thành dữ liệu thực.</p><p>Tuần5 chỉ giữ hai ngày đo. Từ tuần6: dùng trung bình tháng, lặp tuần4, hoặc dừng nguồn mới. Trường hợp quyền cấp vật phẩm thực tế bằng0 nằm trong stress; không dùng browser save để mint.</p></section><section><h2>Ngưỡng gốc và sản phẩm hoàn thành</h2><p>Mỗi hàng9 lượt chạy:3 nhóm ×3 seed. Cột hoàn thành là tỷ lệ thấp nhất người giả định thích forge có≥1 ornament. “Mùa≥1” yêu cầu đốt/phát≥1 trong cả4 mùa; không coi im lặng0/0 là khỏe. Hai catalog là tùy chọn đã viết cục bộ; nhu cầu50% chưa được đo.</p><div class="scroll"><table><tr><th>Nguồn sau ngày30</th><th>Bot</th><th>Thưởng</th><th>Tham gia</th><th>Đạt ngưỡng gốc</th><th>Tỷ lệ xấu nhất</th><th>Hoàn thành forge</th><th>Mùa≥1</th></tr>${table}</table></div></section><section><h2>Quyết định</h2><p>Giữ nguyên grant20, phí, phân bổ và thưởng định kỳ tắt. Kết quả có nguồn cung mới không thay thế bằng chứng người chơi tự nguyện dùng tính năng. Nguồn quyền cấp server vẫn bằng0. Giữ toàn bộ kết quả không đạt để đối chiếu lần tích hợp sau.</p><p><a href="c2-study.json">Giả định và stress</a> · <a href="c2-study.csv">CSV</a> · <a href="c2-source-supply.json">Nguồn đã đối soát</a> · <a href="completion-study.html">Seal và hoàn thành forge</a></p></section></html>`);
console.log(JSON.stringify({runs:rows.length,stressRuns:stresses.length,controls,groups,stresses},null,2));
