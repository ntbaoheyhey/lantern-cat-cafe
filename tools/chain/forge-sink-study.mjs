// Finite deployed-code counterfactuals. Local feature != measured human demand.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {simulate,summarize,mixes} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),supply=loadSourceSupply();
const seeds=[810013,810017,810019],demands=[1,.5,.1],scales=[10000,2500];
const style={adoptionBps:5000,maxStyles:3,openWeek:1},forge={interestBps:5000,maxDesigns:3,first:true};
const plans=[{name:'styles-control',options:{stylePlan:style}},{name:'forge-only',options:{forgePlan:forge}},
 {name:'joint-forge-first',options:{stylePlan:style,forgePlan:forge}},
 {name:'joint-styles-first',options:{stylePlan:style,forgePlan:{...forge,first:false}}}];
const hash=createHash('sha256').update(JSON.stringify({supply,seeds,demands,scales,plans}));
for(const file of ['tools/chain/token-sim.mjs','tools/chain/forge-sink-study.mjs','tools/chain/supply-snapshot.mjs',
 'tools/chain/season-budget.mjs','tools/chain/grant-headroom.mjs','tools/chain/forge-preparation.mjs','tools/chain/allocation-envelope.mjs','tools/chain/feature-plan.mjs',
 'packages/chain/src/cosmetics.ts','packages/chain/src/forge.ts','contracts/src/RelicForge.sol'])hash.update(readFileSync(resolve(root,file)));
const modelHash=hash.digest('hex'),path=resolve(root,'docs/chain/forge-sink-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(path,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'Stale forge study: regenerate');
const record=(s,extra)=>{
 const y=summarize({...s,rows:s.rows.slice(0,52)}),full=summarize(s),last=s.rows.at(-1),tail=s.seasons.slice(-4);
 return {...extra,mix:s.name,seed:s.seed,demand:s.demand,bossCeiling:6*s.entitlementBps/10000,
  yearRatio:y.emissionBurn,yearPass:y.flowPass&&y.farmingPass,fiveYearRatio:full.emissionBurn,
  fiveYearPass:full.flowPass&&full.farmingPass,farmerCasual:y.farmerCasual,
  crafts:last.crafts,itemsConsumed:last.consumed,remainingSealed:last.sealedStock,
  forgeBurn:last.forgeBurn,styleBurn:last.styleBurn,sealBurn:last.sealBurn,saleBurn:last.saleBurn,
  activeTail:tail.every(q=>q.routine>=1&&q.burn>=1),healthyTail:tail.every(q=>q.healthTargetMet),
  minimumTailCasual:Math.min(...tail.map(q=>q.casualRoutineMedian)),finalWeeklyCap:last.routineBudget};
};
const rows=cached?.rows??[];
if(!cached)for(const plan of plans)for(const entitlementBps of scales)for(const demand of demands){
 for(const mix of mixes)for(const seed of seeds)rows.push(record(simulate({...mix,seed},
  {supply,weeks:260,entitlementBps,demand,...plan.options}),{plan:plan.name}));
 console.log(`completed ${plan.name}/${entitlementBps}/${demand}`);
}
const stressOptions=[{name:'zero-interest',forgePlan:{...forge,interestBps:0}},
 {name:'all-interested',forgePlan:{...forge,interestBps:10000}},
 {name:'no-Epic-source',supply:{rarePerActiveWeek:0,epicPerActiveWeek:0,source:'No authoritative Epic source stress'}},
 {name:'zero-adoption',demand:0},{name:'zero-routine',entitlementBps:0},
 {name:'no-V2-fees',paidMarketShare:0},{name:'demand-collapse',demandShockWeek:53,demandAfterShock:0},
 {name:'bots-hoard',botsHoard:true}];
const stresses=cached?.stresses??mixes.flatMap(mix=>stressOptions.map(({name,...options})=>record(
 simulate({...mix,seed:820037},{supply,weeks:260,entitlementBps:2500,stylePlan:style,forgePlan:forge,...options}),{name})));
const groups=plans.flatMap(plan=>scales.flatMap(scale=>demands.map(demand=>{
 const rs=rows.filter(r=>r.plan===plan.name&&r.bossCeiling===6*scale/10000&&r.demand===demand);
 return {plan:plan.name,boss:6*scale/10000,demand,runs:rs.length,yearPass:rs.filter(r=>r.yearPass).length,
  fiveYearPass:rs.filter(r=>r.fiveYearPass).length,activeTail:rs.filter(r=>r.activeTail).length,
  healthyTail:rs.filter(r=>r.healthyTail).length,worstYearRatio:Math.max(...rs.map(r=>r.yearRatio??Infinity)),
  minCrafts:Math.min(...rs.map(r=>r.crafts)),maxCrafts:Math.max(...rs.map(r=>r.crafts))};
})));
const result={version:1,modelHash,runs:rows.length,stressRuns:stresses.length,seeds,supply,plans,
 activation:false,organicEvidence:false,
 assumptions:{catalog:'Exactly3 permanent3-YARN ornaments; at most6 Epics consumed/player. No repeated sales, XP, stronger items or tradable output. Local implementation; not public deployment.',
  demand:'50% independent persistent interest in each optional feature among chain adopters; no bot cosmetic utility. Independent style/forge interests are an assumption, not human telemetry.',
  budgets:'Universal20 grant, existing caps/fees, same shared balance. All seal preparation costs counted. Styles/forge ordering varied; no fiat inflow, growth or forced purchase.',
  source:'Conditional C2 drop-code study, not authoritative campaign receipts or empirical player supply.',
  threshold:'52-week claims/burn<=2 and farmer/hour<=3x;5-year cumulative gate and final4-season activity/health reported separately. A quiet tail never passes health.',
  interpretation:'Fresh seeds measure model variation. A local receipt proves execution only. No result authorizes routine rewards.'},groups,rows,stresses};
if(!cached){writeFileSync(path,JSON.stringify(result,null,2)+'\n');const keys=Object.keys(rows[0]);
 writeFileSync(resolve(root,'docs/chain/forge-sink-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');}
const table=groups.map(g=>`<tr><td>${g.plan}</td><td>${g.boss}</td><td>${g.demand*100}%</td><td>${g.yearPass}/${g.runs}</td><td>${g.fiveYearPass}/${g.runs}</td><td>${g.activeTail}/${g.runs}</td><td>${g.healthyTail}/${g.runs}</td><td>${g.worstYearRatio.toFixed(2)}</td><td>${g.minCrafts}–${g.maxCrafts}</td></tr>`).join('');
writeFileSync(resolve(root,'docs/chain/forge-sink-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Forge: tiêu hao thật, nhu cầu hữu hạn</title><style>body{max-width:1100px;margin:32px auto;padding:0 20px;background:#101b2b;color:#e7edf7;font:17px/1.6 system-ui}h1{font-size:clamp(30px,5vw,48px);line-height:1.15}a{color:#72d9bd}.scroll{overflow:auto}table{border-collapse:collapse;min-width:900px;width:100%}td,th{padding:10px;text-align:left;border-bottom:1px solid #40506b}.status{color:#ffbc83}section{border-top:1px solid #40506b;padding:20px 0}</style><p>Fuji43113 · Testnet — no real value</p><h1>Forge tiêu hao vật phẩm thật</h1><p>2 Epic đã seal +3 YARN →1 ornament vĩnh viễn. Tổng tự chuẩn bị23 YARN; mỗi ví chỉ3 mẫu. Vật phẩm nằm trong kho không có đường rút, ERC1155 không bị burn. Chỉ YARN giảm totalSupply.</p><p class="status">${rows.length} mô phỏng5 năm +${stresses.length} tình huống xấu. Kiểm chứng local không xác nhận nhu cầu thật hoặc cho phép bật thưởng định kỳ.</p><section><h2>Cùng một ví tiền</h2><p>Cosmetic và forge cạnh tranh cùng số dư. Mua3 style hết12 trên grant20, còn8 không đủ seal một Epic giá10. Forge-first cũng có thể dùng hết20 để seal2 Epic và chưa đủ3 để forge. Thứ tự chi tiêu được kiểm tra riêng, không cộng đốt của hai mô hình độc lập.</p></section><section><h2>Các ngưỡng riêng biệt</h2><div class="scroll"><table><tr><th>Phương án</th><th>Boss/mục</th><th>Tham gia</th><th>52tuần</th><th>5năm</th><th>Còn hoạt động</th><th>4mùa≥1</th><th>Tỷ lệ52tuần xấu nhất</th><th>Lần forge</th></tr>${table}</table></div></section><section><h2>Giới hạn dữ liệu</h2><p>50% hứng thú với từng tính năng là giả định. Nguồn Epic dựa trên code dưới điều kiện chơi thành công; C2 chưa có biên nhận campaign. Không có người mới hay tiền từ nhà đầu tư. Mỗi trường hợp dùng1.000 ví và seed cố định; số mô phỏng không phải số người thử. Mẫu thứ4, người mua tưởng tượng và việc mua lại ornament đã sở hữu không được thêm để ép kết quả đạt.</p><p><a href="forge-sink-study.json">Giả định và tình huống xấu</a> · <a href="forge-sink-study.csv">Dữ liệu</a> · <a href="cosmetic-pilot-study.html">Đối chứng styles</a> · <a href="tokenomics.html">Ngưỡng gốc</a></p></section></html>`);
console.log(JSON.stringify({runs:rows.length,stressRuns:stresses.length,activation:false,groups},null,2));
