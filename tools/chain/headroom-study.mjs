// Dynamic comparison of the offline grant-inclusive budget bound.
// Simulated demand is never promoted to observed demand or activation approval.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {simulate,summarize,mixes} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),supply=loadSourceSupply();
const seeds=[990001,990013,990017],demands=[1,.5,.25,.1];
const policies=['closed-burn','grant-headroom'];
const environments=[
  {name:'styles-without-campaign',options:{supply:{rarePerActiveWeek:0,epicPerActiveWeek:0,source:'No authoritative recurring campaign source; finite style-only counterfactual'},stylePlan:{adoptionBps:5000,maxStyles:3,openWeek:1}}},
  {name:'conditional-campaign-and-forge',options:{supply,stylePlan:{adoptionBps:5000,maxStyles:3,openWeek:1},forgePlan:{interestBps:5000,maxDesigns:3,first:true}}},
];
const common={weeks:260,entitlementBps:2500,burnBudgetBps:5000};
const hash=createHash('sha256').update(JSON.stringify({seeds,demands,policies,environments,common}));
for(const f of ['headroom-study.mjs','token-sim.mjs','grant-headroom.mjs','forge-preparation.mjs','season-budget.mjs','allocation-envelope.mjs','feature-plan.mjs','supply-snapshot.mjs','../../packages/chain/src/cosmetics.ts','../../packages/chain/src/forge.ts'])hash.update(readFileSync(resolve(root,'tools/chain',f)));
const modelHash=hash.digest('hex'),path=resolve(root,'docs/chain/headroom-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(path,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'Stale headroom study; regenerate');
function record(s,extra){
  const y=summarize({...s,rows:s.rows.slice(0,52)}),full=summarize(s),last=s.rows.at(-1);
  const first=s.budgets.find(b=>b.committed>0),tail=s.seasons.slice(-4);
  // Compare both policies to the SAME conservative reviewed-burn bound. A
  // positive old deficit with zero new promises is blocked, not a policy error.
  const unsafe=s.budgets.filter(b=>b.committed>0&&20000+b.paidBefore+b.committed>2*b.cumulativeOrganicBurn+1e-8);
  return {...extra,policy:s.rewardPolicy,mix:s.name,seed:s.seed,demand:s.demand,
    yearRatio:y.emissionBurn,yearPass:y.flowPass&&y.farmingPass,fiveYearRatio:full.emissionBurn,
    fiveYearPass:full.flowPass&&full.farmingPass,unsafeCommitments:unsafe.length,
    firstBudgetWeek:first?.week??null,routine:last.cumulativeEmission,claims:last.inclusiveEmission,
    burn:last.cumulativeBurn,reviewedModelBurn:last.cumulativeOrganicBurn,
    playerBalance:last.playerCirculating,treasury:last.treasury,
    remainingReviewedDeficit:Math.max(0,last.inclusiveEmission/2-last.cumulativeOrganicBurn),
    activeTail:tail.every(q=>q.routine>=1&&q.burn>=1),healthyTail:tail.every(q=>q.healthTargetMet),
    casualRoutineMedian:s.affordability.find(p=>p.type==='casual').routineMedian,
    casualCanSave4:s.affordability.find(p=>p.type==='casual').features[4].share,
    farmerCasual:y.farmerCasual,botRewardShare:y.botShare,top1:y.top1,quotes:s.budgets};
}
const rows=cached?.rows??[];
if(!cached)for(const environment of environments)for(const policy of policies)for(const demand of demands){
  for(const mix of mixes)for(const seed of seeds)rows.push(record(simulate({...mix,seed},
    {...common,...environment.options,demand,rewardPolicy:policy}),{environment:environment.name}));
  console.log(`completed ${environment.name}/${policy}/${demand}`);
}
const stressSpecs=[{name:'zero-demand',demand:0},{name:'no-fees',paidMarketShare:0},
  {name:'zero-price',marketPriceYarn:0},{name:'no-buyers',collectionTarget:0},
  {name:'collapse-week14',demandShockWeek:14,demandAfterShock:0},
  {name:'late-recovery',demand:0,demandShockWeek:27,demandAfterShock:1},
  {name:'bots-hoard',botsHoard:true},{name:'bot-rank10',botRankBoost:10}];
const stresses=cached?.stresses??mixes.flatMap(mix=>stressSpecs.map(({name,...options})=>record(simulate({...mix,seed:991027},
  {...common,...environments[1].options,rewardPolicy:'grant-headroom',...options}),{environment:environments[1].name,name})));
assert([...rows,...stresses].filter(r=>r.policy==='grant-headroom').every(r=>r.unsafeCommitments===0),'Grant headroom policy oversubscribed');
const groups=environments.flatMap(e=>policies.flatMap(policy=>demands.map(demand=>{
  const rs=rows.filter(r=>r.environment===e.name&&r.policy===policy&&r.demand===demand);
  return {environment:e.name,policy,demand,runs:rs.length,yearPass:rs.filter(r=>r.yearPass).length,
    fiveYearPass:rs.filter(r=>r.fiveYearPass).length,unsafeRuns:rs.filter(r=>r.unsafeCommitments>0).length,
    activeTail:rs.filter(r=>r.activeTail).length,healthyTail:rs.filter(r=>r.healthyTail).length,
    maxRoutine:Math.max(...rs.map(r=>r.routine)),worstRatio:Math.max(...rs.map(r=>r.yearRatio??Infinity)),
    minCasualCanSave4:Math.min(...rs.map(r=>r.casualCanSave4)),
    maxRemainingDeficit:Math.max(...rs.map(r=>r.remainingReviewedDeficit))};
})));
const result={version:1,modelHash,seeds,demands,policies,environments,common,runs:rows.length,stressRuns:stresses.length,
  activation:false,observedPlayers:0,assumptions:{
    grant:'All1000 accounts receive20 at enrollment. Existing grant/fees/allocations and deployed zero-cap behavior are unchanged.',
    policy:'Commit min(50% prior closed-season reviewed burn, max(0,2*cumulative reviewed burn-all gross claims)). Allocated weekly boss remains equal regardless of personal spending. Future burns are never borrowed.',
    liabilities:'No signed carry-over claims or new tester arrivals in this closed-cohort model. Every allocated seasonal promise is charged before its first payment. Unused unsigned requests expire at season close. Offline live planner additionally reserves disjoint outstanding liabilities and planned tester slots.',
    funding:'Hypothetical funded allocation envelope, not the current live pool. Actual pool/nonce/source/rules evidence still required by the planner.',
    behavior:'Interest50% in each finite catalog is assumed, not measured. Three lifetime styles/forge outputs, same wallet budget and fixed three disjoint seeds for both policies. Bot labels are an optimistic model oracle.',
    source:'Conditional campaign applies measured drop functions to assumed successful routes. Style-only environment has no campaign item issuance or forge input. Neither is a human pilot.',
    acceptance:'Original gross claims/burn<=2 retained. Unsafe budgets, quiet tails, seasonal health and affordability reported separately; a blocked zero reward is not proof of a healthy economy.'},groups,rows,stresses};
if(!cached){writeFileSync(path,JSON.stringify(result,null,2)+'\n');
  const keys=Object.keys(rows[0]).filter(k=>k!=='quotes');
  writeFileSync(resolve(root,'docs/chain/headroom-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');}
const f=n=>n===null||!Number.isFinite(n)?'n/a':n.toFixed(2);
const table=groups.map(g=>`<tr><td>${g.environment}</td><td>${g.policy}</td><td>${g.demand*100}%</td><td>${g.yearPass}/${g.runs}</td><td>${f(g.worstRatio)}</td><td>${g.unsafeRuns}/${g.runs}</td><td>${g.activeTail}/${g.runs}</td><td>${f(g.maxRoutine)}</td><td>${f(100*g.minCasualCanSave4)}%</td></tr>`).join('');
writeFileSync(resolve(root,'docs/chain/headroom-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN — ngân sách sau trợ cấp</title><style>body{max-width:1150px;margin:32px auto;padding:0 20px;background:#101b2b;color:#e7edf7;font:17px/1.6 system-ui}h1{font-size:clamp(30px,5vw,48px);line-height:1.15}a{color:#72d9bd}.scroll{overflow:auto}table{border-collapse:collapse;min-width:1000px;width:100%}td,th{padding:10px;text-align:left;border-bottom:1px solid #40506b}section{border-top:1px solid #40506b;padding:20px 0}.status{color:#ffbc83}code{overflow-wrap:anywhere}</style><p>Fuji43113 · Testnet — no real value</p><h1>Thưởng mới phải tính cả trợ cấp cũ</h1><p>${rows.length} trường hợp5 năm +${stresses.length} stress. Công thức dùng chung với công cụ ngân sách. Đây là mô phỏng;0 người chơi được quan sát.</p><p class="status">Giữ an toàn ngân sách không chứng minh nhu cầu. Thưởng định kỳ vẫn tắt.</p><section><h2>So sánh giữ nguyên giá và ngưỡng</h2><p>Mỗi hàng9 trường hợp từ3 nhóm ×3 seed. “Vượt dư địa” là số lượt chạy có ít nhất một ngân sách mới vượt mức2× đốt đã có. “Còn hoạt động” yêu cầu cả đốt và thưởng≥1 YARN trong từng mùa của4 mùa cuối. “Tiết kiệm4” chỉ tính thưởng định kỳ, bỏ trợ cấp và tiền bán.</p><div class="scroll"><table><tr><th>Nguồn vật phẩm</th><th>Ngân sách</th><th>Tham gia</th><th>52tuần đạt</th><th>Tỷ lệ xấu nhất</th><th>Vượt dư địa</th><th>Còn hoạt động</th><th>Thưởng tối đa</th><th>Casual tiết kiệm4</th></tr>${table}</table></div></section><section><h2>Điều được bảo đảm</h2><p><code>thưởng mới ≤ max(0,2×đốt đã xác minh − toàn bộ thưởng đã trả − nghĩa vụ chưa trả − trợ cấp sắp phát)</code>. Mô phỏng vẫn giữ lời hứa trong mùa khi cầu giảm; mùa tiếp theo mới giảm ngân sách. Không dựa vào chi tiêu tương lai, không thưởng riêng người đã mua.</p><p>Ít người dùng token vẫn để lại trợ cấp nằm yên. Công thức không thể xóa số dư đó. Nếu controller đã về0 thì nhu cầu quay lại không tự phục hồi trần. Điều này được giữ đúng theo hợp đồng đã triển khai.</p></section><section><h2>Giới hạn còn mở</h2><p>Ý thích cosmetic và thành công khi chơi là giả định. Bộ chỉ có styles không phát Epic giả để tạo nguyên liệu forge. Bộ conditional cần nguồn chiến dịch có thẩm quyền. Ngân sách thực còn phải có quỹ và chứng cứ nhận thưởng; các con số này không bật chức năng phát thưởng.</p><p><a href="headroom-study.json">Mọi lượt chạy và giả định</a> · <a href="headroom-study.csv">CSV</a> · <a href="recycle-study.html">Tái dùng phí</a> · <a href="../design/chain/FEATURE-BUDGETS.md">Ngân sách từng tính năng</a></p></section></html>`);
console.log(JSON.stringify({runs:rows.length,stressRuns:stresses.length,activation:false,groups},null,2));
