// Falsifiable, finite-content recipe comparison. No live config, key or signing.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {simulate,summarize,mixes} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';
import {featureQuote} from './feature-plan.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),supply=loadSourceSupply();
const seeds=[300017,330037,360053],demands=[1,.5,.1],scales=[10000,5000,2500];
const plans=['sealed','unsealed'].flatMap(input=>[4,20].map(catalogSeasons=>({
 name:`${input}-${catalogSeasons===4?'1year':'5years'}`,
 options:{input,catalogSeasons,recipesPerSeason:2,forgePriceYarn:3,renewalBps:5000}})));
const hash=createHash('sha256').update(JSON.stringify({supply,seeds,demands,scales,plans}));
for(const path of ['token-sim.mjs','feature-plan.mjs','utility-study.mjs','season-budget.mjs','grant-headroom.mjs','forge-preparation.mjs','allocation-envelope.mjs','supply-snapshot.mjs','../../packages/chain/src/cosmetics.ts','../../packages/chain/src/forge.ts'])
 hash.update(readFileSync(resolve(root,'tools/chain',path)));
const modelHash=hash.digest('hex'),file=resolve(root,'docs/chain/utility-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(file,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'Stale utility study; rerun');
const record=(s,extra)=>{
 const tail=s.seasons.slice(-4),r=s.rows.at(-1),c=s.affordability[0];
 const annual=summarize({...s,rows:s.rows.slice(0,52)}),full=summarize(s);
 const utility=c.features[2].reachByWeek[13]>=.75&&c.features[10].reachByWeek[26]>=.5;
 const activeTail=tail.every(q=>q.routine>=1&&q.burn>=1);
 return {...extra,mix:s.name,seed:s.seed,demand:s.demand,bossCeiling:6*s.entitlementBps/10000,
  firstYearRatio:annual.emissionBurn,firstYearPass:annual.flowPass&&annual.farmingPass,
  fiveYearRatio:full.emissionBurn,fiveYearPass:full.flowPass&&full.farmingPass,
  cheapReach:c.features[2].reachByWeek[13],epicReach:c.features[10].reachByWeek[26],utility,activeTail,
  tailRoutine:tail.reduce((n,q)=>n+q.routine,0),tailBurn:tail.reduce((n,q)=>n+q.burn,0),
  tailCasualMinimum:Math.min(...tail.map(q=>q.casualRoutineMedian)),
  healthyTailSeasons:tail.filter(q=>q.healthTargetMet).length,
  crafts:r.crafts,unsealedConsumed:r.unsealedConsumed,sealedConsumed:r.consumed,
  sealBurn:r.sealBurn,forgeBurn:r.forgeBurn,saleBurn:r.saleBurn,
  allModelTargetsMet:annual.flowPass&&annual.farmingPass&&full.flowPass&&full.farmingPass&&utility&&activeTail};
};
const rows=cached?.rows??[];
if(!cached)for(const plan of plans)for(const entitlementBps of scales)for(const demand of demands){
 for(const mix of mixes)for(const seed of seeds){
  const s=simulate({...mix,seed},{supply,profile:'roadmap',featurePlan:plan.options,weeks:260,entitlementBps,demand});
  rows.push(record(s,{plan:plan.name}));
 }
 console.log(`Recipe ${plan.name}, boss ceiling ${6*entitlementBps/10000}, adoption ${demand}`);
}
const stressSpecs=[
 {name:'no-renewal',plan:{renewalBps:0}},
 {name:'ten-percent-renewal',plan:{renewalBps:1000}},
 {name:'one-hundred-percent-renewal',plan:{renewalBps:10000}},
 {name:'low-fee1',plan:{forgePriceYarn:1}},
 {name:'high-fee6',plan:{forgePriceYarn:6}},
 {name:'content-ends-after-first-season',plan:{catalogSeasons:1}},
 {name:'collapse-week53',options:{demandShockWeek:53,demandAfterShock:0}},
 {name:'no-market-fees',options:{paidMarketShare:0}},
 {name:'bots-hoard',options:{botsHoard:true}},
 {name:'no-epic-source',options:{supply:{rarePerActiveWeek:0,epicPerActiveWeek:0,source:'Absent authoritative source stress'}}},
];
const stresses=cached?.stresses??['sealed','unsealed'].flatMap(input=>stressSpecs.map(spec=>{
 const featurePlan={input,catalogSeasons:20,recipesPerSeason:2,forgePriceYarn:3,renewalBps:5000,...spec.plan};
 const s=simulate({...mixes[2],seed:390073},{supply,profile:'roadmap',featurePlan,weeks:260,entitlementBps:2500,...spec.options});
 return record(s,{name:spec.name,input,featurePlan});
}));
const groups=plans.flatMap(p=>scales.flatMap(scale=>demands.map(demand=>{
 const rs=rows.filter(r=>r.plan===p.name&&r.bossCeiling===6*scale/10000&&r.demand===demand);
 return {plan:p.name,bossCeiling:6*scale/10000,demand,runs:rs.length,
  originalGate:rs.filter(r=>r.firstYearPass).length,utility:rs.filter(r=>r.utility).length,
  activeTail:rs.filter(r=>r.activeTail).length,allTargets:rs.filter(r=>r.allModelTargetsMet).length,
  healthyTail:rs.filter(r=>r.healthyTailSeasons===4).length,
  worstFirstYearRatio:Math.max(...rs.map(r=>r.firstYearRatio??Infinity)),
  minimumTailCasual:Math.min(...rs.map(r=>r.tailCasualMinimum)),
  minCrafts:Math.min(...rs.map(r=>r.crafts)),maxCrafts:Math.max(...rs.map(r=>r.crafts))};
})));
const result={version:1,modelHash,supply,seeds,demands,scales,plans:plans.map(p=>({...p,quote:featureQuote(p.options)})),
 runs:rows.length,stressRuns:stresses.length,
 assumptions:{implementation:'All recipe variants are counterfactual. None is live or counted as an implemented sink. Current52-week and360 five-year controls remain separate.',
  content:'Two distinct bound cosmetic unlocks per season, finite8 or40 outputs over1 or5years. Ownership is retained; no expiry or repurchase of the same cosmetic. Content ends at the stated horizon.',
  willingness:'Persistent adoption10/50/100%; independently50% of adopting human accounts want each season catalog. This is an assumption, not measured retention. Bots have zero cosmetic utility.',
  inputs:'Two Epic units exactly. Sealed path irreversibly consumes2 sealed Epics; source path consumes2 authenticated unsealed Epics, avoiding an unnecessary20-YARN seal preparation. No power, XP or token rebate. Ordinary source authority remains unavailable.',
  money:'Universal20-YARN grant, unchanged deployed caps/fees/allocation, no growth or external buyers, conditional source supply. Market scenario price20 for all item tiers is a simplification, never a floor or forecast.',
  thresholds:'Original52-week claims/burn<=2 and farmer/hour<=3x casual remain required. Additional tests:75% casuals save2 by13;50% save10 by26; each last4 seasons has>=1 aggregate routine and burn. Savings exclude grants, resale and other spending; this is an upper affordability bound.',
  health:'Tail health>=1 burn/claim is reported separately; the weaker2x original acceptance is never equated with this health target. Tail casual median exposes tiny individual payouts.',
  statistics:'Three fresh scenario seeds per mix; sensitivity evidence only, not population inference or measured utility.'},
 activation:false,productionCalibration:false,groups,rows,stresses};
if(!cached){
 writeFileSync(file,JSON.stringify(result,null,2)+'\n');
 const keys=Object.keys(rows[0]);writeFileSync(resolve(root,'docs/chain/utility-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');
}
const f=n=>n===null?'n/a':Number(n).toFixed(2);
const table=groups.map(g=>`<tr><td>${g.plan}</td><td>${g.bossCeiling}</td><td>${g.demand*100}%</td><td>${g.originalGate}/${g.runs}</td><td>${g.utility}/${g.runs}</td><td>${g.activeTail}/${g.runs}</td><td>${g.allTargets}/${g.runs}</td><td>${g.healthyTail}/${g.runs}</td><td>${f(g.worstFirstYearRatio)}</td><td>${f(g.minimumTailCasual)}</td></tr>`).join('');
writeFileSync(resolve(root,'docs/chain/utility-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Chi phí forge và nhu cầu hữu hạn</title><style>body{max-width:1100px;margin:32px auto;padding:0 20px;background:#101b2b;color:#e7edf7;font:17px/1.6 system-ui}h1{font-size:clamp(30px,5vw,48px);line-height:1.15}a{color:#72d9bd}.scroll{overflow:auto}table{border-collapse:collapse;min-width:1000px;width:100%}td,th{padding:10px;text-align:left;border-bottom:1px solid #40506b}.status{color:#ffbc83}section{border-top:1px solid #40506b;padding:20px 0}</style><p>Fuji43113 · Testnet — no real value</p><h1>Forge rẻ hơn không tự tạo ra người mua</h1><p>${rows.length} mô phỏng5 năm và${stresses.length} tình huống xấu;${seeds.length} seed mới mỗi nhóm. Tất cả recipe là phương án chưa triển khai. Nhu cầu thực tế chưa được đo.</p><p class="status">Thưởng định kỳ vẫn tắt. Không thay hợp đồng, phí, grant hoặc luật drop hiện tại.</p><section><h2>Hai đường nguyên liệu, cùng một cosmetic</h2><p>Sealed:2 Epic đã seal +3 YARN, tổng tự chuẩn bị23. Unsealed:2 Epic từ nguồn server xác thực +3 YARN, tổng token3. Cả hai mất2 vật phẩm và nhận1 cosmetic không chuyển nhượng, tăng0 Power. Tránh ép người chơi seal rồi hủy đồ chỉ để tạo số liệu đốt token.</p><p>Mỗi mùa có2 cosmetic khác nhau; catalog chỉ có8 hoặc40 món. Mua một lần, giữ vĩnh viễn.50% người đã chọn tham gia muốn catalog mỗi mùa là giả định để thử, không phải tỷ lệ đo được. Không tính rename, pass hoặc decor phụ để làm đẹp kết quả.</p></section><section><h2>Từng ngưỡng được báo riêng</h2><p>52 tuần:phát/đốt≤2, farmer/giờ≤3×casual. Khả năng dùng:75%casual để dành2 trước tuần13,50%để dành10 trước tuần26. Cuối kỳ:4 mùa cuối đều có ít nhất1 YARN thưởng và1 YARN đốt toàn nhóm. Mục tiêu sức khỏe đốt/phát≥1 và thưởng trung vị của casual được báo thêm; dòng tiền nhỏ không chứng minh trải nghiệm tốt.</p><div class="scroll"><table><tr><th>Recipe/catalog</th><th>Boss tối đa</th><th>Tham gia</th><th>52tuần</th><th>Đủ tiền</th><th>Cuối kỳ</th><th>Cả bộ</th><th>4mùa≥1</th><th>Tỷ lệ52tuần xấu nhất</th><th>Casual/mùa thấp nhất</th></tr>${table}</table></div></section><section><h2>Giới hạn phải giữ</h2><p>Không có người mới, mua hỗ trợ hay dòng tiền nhà đầu tư. Nguồn Epic là đo có điều kiện từ code, chưa có biên nhận campaign server. Cần cả40 cosmetic khác nhau nếu thử nội dung5 năm. Ba seed kiểm tra độ ổn định mô phỏng; không xác nhận bất kỳ ai muốn mua. Ngưỡng tiết kiệm tính trước chi tiêu khác, không phải thời gian hoàn thành dự báo.</p></section><p><a href="utility-study.json">Giả định và20 tình huống xấu</a> · <a href="utility-study.csv">Dữ liệu</a> · <a href="durability-study.html">Đối chứng không thêm nội dung</a> · <a href="tokenomics.html">Ngưỡng gốc52tuần</a></p></html>`);
console.log(JSON.stringify({runs:rows.length,stressRuns:stresses.length,activation:false,groups},null,2));
