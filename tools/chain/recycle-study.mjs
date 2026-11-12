// Revenue recycling counterfactual. Original gross-claim acceptance is retained.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {simulate,summarize,mixes} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),supply=loadSourceSupply();
const seeds=[970003,970031,970043],demands=[1,.5,.25,.1];
const policies=[{name:'fixed1.5',options:{entitlementBps:2500}},
 {name:'closed-burn50',options:{rewardPolicy:'closed-burn',entitlementBps:2500,burnBudgetBps:5000}},
 {name:'recycle50',options:{rewardPolicy:'treasury-closed',entitlementBps:2500,burnBudgetBps:5000}},
 {name:'recycle100',options:{rewardPolicy:'treasury-closed',entitlementBps:2500,burnBudgetBps:10000}}];
const common={supply,weeks:260,stylePlan:{adoptionBps:5000,maxStyles:3,openWeek:1},forgePlan:{interestBps:5000,maxDesigns:3,first:true}};
const hasher=createHash('sha256').update(JSON.stringify({seeds,demands,policies,common}));
for(const file of ['tools/chain/recycle-study.mjs','tools/chain/token-sim.mjs','tools/chain/season-budget.mjs','tools/chain/grant-headroom.mjs','tools/chain/forge-preparation.mjs',
 'tools/chain/allocation-envelope.mjs','tools/chain/feature-plan.mjs','tools/chain/supply-snapshot.mjs',
 'packages/chain/src/cosmetics.ts','packages/chain/src/forge.ts'])hasher.update(readFileSync(resolve(root,file)));
const modelHash=hasher.digest('hex'),path=resolve(root,'docs/chain/recycle-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(path,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'Stale recycling study; regenerate');
const record=(s,extra)=>{
 const y=summarize({...s,rows:s.rows.slice(0,52)}),full=summarize(s),r=s.rows.at(-1),yr=s.rows[51],tail=s.seasons.slice(-4);
 return {...extra,mix:s.name,seed:s.seed,demand:s.demand,yearOriginalRatio:y.emissionBurn,
  yearOriginalPass:y.flowPass&&y.farmingPass,fiveYearOriginalRatio:full.emissionBurn,
  fiveYearOriginalPass:full.flowPass&&full.farmingPass,yearFreshRelease:yr.inclusiveFreshRelease,
  yearGrossClaims:yr.inclusiveEmission,yearBurn:yr.cumulativeBurn,yearRecycled:yr.recycledRewards,
  fiveYearFreshRelease:r.inclusiveFreshRelease,fiveYearGrossClaims:r.inclusiveEmission,
  fiveYearBurn:r.cumulativeBurn,recycled:r.recycledRewards,treasury:r.treasury,treasuryRevenue:r.treasuryRevenue,
  freshRoutine:r.freshRoutineRelease,farmerCasual:y.farmerCasual,botRewardShare:y.botShare,top1:y.top1,
  activeTail:tail.every(q=>q.routine>=1&&q.burn>=1),healthyTail:tail.every(q=>q.healthTargetMet),
  casualRoutineMedian:s.affordability.find(p=>p.type==='casual').routineMedian,quotes:s.budgets};
};
const rows=cached?.rows??[];
if(!cached)for(const policy of policies)for(const demand of demands){
 for(const mix of mixes)for(const seed of seeds)rows.push(record(simulate({...mix,seed},{...common,demand,...policy.options}),{policy:policy.name}));
 console.log(`completed ${policy.name}/${demand}`);
}
const stressSpecs=[{name:'no-fees',paidMarketShare:0},{name:'no-demand',demand:0},
 {name:'price-zero',marketPriceYarn:0},{name:'no-buyers',collectionTarget:0},
 {name:'collapse-week14',demandShockWeek:14,demandAfterShock:0},
 {name:'recovery-week27',demand:0,demandShockWeek:27,demandAfterShock:1},
 {name:'bots-hoard',botsHoard:true},{name:'no-Epics',supply:{rarePerActiveWeek:0,epicPerActiveWeek:0,source:'No authoritative item source stress'}}];
const stresses=cached?.stresses??mixes.flatMap(mix=>stressSpecs.map(({name,...opts})=>record(simulate({...mix,seed:980027},
 {...common,...policies[3].options,...opts}),{name,policy:'recycle100'})));
const groups=policies.flatMap(policy=>demands.map(demand=>{
 const rs=rows.filter(r=>r.policy===policy.name&&r.demand===demand);
 return {policy:policy.name,demand,runs:rs.length,yearPass:rs.filter(r=>r.yearOriginalPass).length,
  fiveYearPass:rs.filter(r=>r.fiveYearOriginalPass).length,activeTail:rs.filter(r=>r.activeTail).length,
  healthyTail:rs.filter(r=>r.healthyTail).length,worstYearRatio:Math.max(...rs.map(r=>r.yearOriginalRatio??Infinity)),
  maxFreshRoutine:Math.max(...rs.map(r=>r.freshRoutine)),maxRecycled:Math.max(...rs.map(r=>r.recycled))};
}));
const result={version:1,modelHash,runs:rows.length,stressRuns:stresses.length,seeds,policies,common,
 activation:false,organicEvidence:false,assumptions:{
  controls:'Same universal20 grant, prices, exact fixed-source supply, finite styles/forge and existing SeasonRewards policy. No external purchases or new users.',
  recycling:'At season open commit at most50%/100% of cash already in treasury. Reuse remaining cash once; exclude future receipts. Equal boss amounts and closed rank are independent of personal spending. Current contract still counts every payment as emission.',
  accounting:'Gross claims include reissued treasury tokens and are the ORIGINAL <=2 acceptance denominator. Fresh release is reported separately and NEVER substitutes for that test. Wallets+retained treasury+burns=fresh release. Recirculation creates neither new token supply nor buyer utility.',
  execution:'Treasury transfer/withdrawal/funding is hypothetical and not automatic in deployed contracts. No operator action, new token mint or mainnet support.',
  behavior:'50% style and forge interest among adopters is unmeasured. Bot labels and conditional successful routes are modelling assumptions. No bot is invented as a cosmetic buyer.',
  evidence:'Source-backed mechanism comparison, not a demand forecast. 144 simulations are not144 observed people. All failure rows retained.'},groups,rows,stresses};
if(!cached){writeFileSync(path,JSON.stringify(result,null,2)+'\n');const keys=Object.keys(rows[0]).filter(k=>k!=='quotes');
 writeFileSync(resolve(root,'docs/chain/recycle-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');}
const f=n=>n===null?'n/a':n.toFixed(2);
const table=groups.map(g=>`<tr><td>${g.policy}</td><td>${g.demand*100}%</td><td>${g.yearPass}/${g.runs}</td><td>${f(g.worstYearRatio)}</td><td>${g.fiveYearPass}/${g.runs}</td><td>${g.activeTail}/${g.runs}</td><td>${g.healthyTail}/${g.runs}</td><td>${f(g.maxFreshRoutine)}</td><td>${f(g.maxRecycled)}</td></tr>`).join('');
writeFileSync(resolve(root,'docs/chain/recycle-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN — tái sử dụng doanh thu</title><style>body{max-width:1100px;margin:32px auto;padding:0 20px;background:#101b2b;color:#e7edf7;font:17px/1.6 system-ui}h1{font-size:clamp(30px,5vw,48px);line-height:1.15}a{color:#72d9bd}.scroll{overflow:auto}table{border-collapse:collapse;min-width:950px;width:100%}td,th{padding:10px;text-align:left;border-bottom:1px solid #40506b}section{border-top:1px solid #40506b;padding:20px 0}.status{color:#ffbc83}</style><p>Fuji43113 · Testnet — no real value</p><h1>Doanh thu có thể trả thưởng; không tự tạo nhu cầu</h1><p class="status">144 trường hợp5 năm +24 stress. Chưa triển khai hoặc chứng minh nhu cầu thật.</p><p>Mỗi mùa chỉ dành50% hoặc100% tiền kho bạc đã thu trước đó để trả thưởng. Trợ cấp20 vẫn tính đầy đủ. Mọi lượt trả lại token đều tính vào chỉ số phát/đốt gốc; tiền mới rời quỹ được báo cáo riêng.</p><section><h2>Kết quả giữ nguyên ngưỡng</h2><div class="scroll"><table><tr><th>Chính sách</th><th>Tham gia</th><th>52tuần đạt</th><th>Tỷ lệ xấu nhất</th><th>5năm đạt</th><th>Còn hoạt động</th><th>4mùa≥1</th><th>Routine mới tối đa</th><th>Tái dùng tối đa</th></tr>${table}</table></div></section><section><h2>Không đổi định nghĩa để đạt</h2><p>Chỉ số gốc = (trợ cấp + toàn bộ thưởng đã trả)/đốt. Nguồn ròng = trợ cấp + thưởng từ quỹ chưa lưu thông. Thưởng lấy từ phí đã thu tăng vế đầu, không tăng vế sau. Cả hai đều cần trình bày; con số ròng nhỏ không chứng minh người chơi muốn sản phẩm.</p><p>Tiền phí không được trả lại theo khối lượng mua bán. Quyền thưởng vẫn từ boss/rank đã xác thực. V1 hoặc chuyển trực tiếp không thu phí, nên không tạo quỹ tái dùng. Thu nhập kho bạc chưa thu, AVAX và khoản phải trả khác đều không phải YARN có sẵn.</p></section><section><h2>Giới hạn</h2><p>Nguồn Epic và ý thích cosmetic vẫn là giả định. Danh mục chỉ3 styles,3 ornaments; không tạo lượt mua vô hạn. Controller đã triển khai vẫn giảm trần và không tự phục hồi từ0. Tái dùng100% doanh thu không giữ ngân sách vận hành; đây là biên trên, không phải đề xuất sản xuất.</p><p><a href="recycle-study.json">Mọi giả định và stress</a> · <a href="recycle-study.csv">CSV</a> · <a href="forge-sink-study.html">Đối chứng forge</a> · <a href="../design/chain/TOKENOMICS-RESEARCH.md">Nguồn và ngày đọc</a></p></section></html>`);
console.log(JSON.stringify({runs:rows.length,stressRuns:stresses.length,activation:false,groups},null,2));
