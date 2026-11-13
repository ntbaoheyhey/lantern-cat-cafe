// Test a behavior assumption: preparing inputs is not completing a cosmetic.
// No price changes, human-demand estimates, activation or public transactions.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {simulate,summarize,mixes} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),supply=loadSourceSupply();
const seeds=[1010011,1010033,1010051],demands=[1,.5,.1];
const strategies=[
  {name:'pay-as-you-go',first:true,reserveCompletion:false},
  {name:'save-for-forge',first:true,reserveCompletion:true},
  {name:'styles-then-save',first:false,reserveCompletion:true},
];
const policies=['fixed','grant-headroom'];
const common={supply,weeks:52,entitlementBps:2500,stylePlan:{adoptionBps:5000,maxStyles:3,openWeek:1}};
const hash=createHash('sha256').update(JSON.stringify({seeds,demands,strategies,policies,common}));
for(const f of ['completion-study.mjs','token-sim.mjs','forge-preparation.mjs','grant-headroom.mjs','season-budget.mjs',
  'allocation-envelope.mjs','feature-plan.mjs','supply-snapshot.mjs','../../packages/chain/src/cosmetics.ts','../../packages/chain/src/forge.ts'])
  hash.update(readFileSync(resolve(root,'tools/chain',f)));
const modelHash=hash.digest('hex'),path=resolve(root,'docs/chain/completion-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(path,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'Stale completion study; regenerate');
function record(s,extra){
  const full=summarize(s),last=s.rows.at(-1),tail=s.seasons.slice(-4);
  return {...extra,mix:s.name,seed:s.seed,policy:s.rewardPolicy,demand:s.demand,weeks:s.weeks,
    claimsBurn:full.emissionBurn,flowPass:full.flowPass,farmingPass:full.farmingPass,
    claims:last.inclusiveEmission,burn:last.cumulativeBurn,routine:last.cumulativeEmission,
    forgeBurn:last.forgeBurn,styleBurn:last.styleBurn,sealBurn:last.sealBurn,crafts:last.crafts,
    retainedBalance:last.playerCirculating,treasury:last.treasury,...s.forgeOutcomes,
    activeTail:tail.every(q=>q.routine>=1&&q.burn>=1),healthyTail:tail.every(q=>q.healthTargetMet),
    casualSave4:s.affordability[0].features[4].share,farmerCasual:full.farmerCasual};
}
const rows=cached?.rows??[];
if(!cached)for(const strategy of strategies)for(const policy of policies)for(const demand of demands){
  const {name,...behavior}=strategy;
  for(const mix of mixes)for(const seed of seeds)rows.push(record(simulate({...mix,seed},
    {...common,rewardPolicy:policy,demand,forgePlan:{interestBps:5000,maxDesigns:3,...behavior}}),{strategy:name}));
  console.log(`completed ${name}/${policy}/${demand}`);
}
const stressSpecs=[
  {name:'no-routine-no-buyers',entitlementBps:0,collectionTarget:0},
  {name:'no-epics',supply:{rarePerActiveWeek:0,epicPerActiveWeek:0,source:'No recurring authoritative source'}},
  {name:'no-market-fee',paidMarketShare:0},
  {name:'collapse-week14',demandShockWeek:14,demandAfterShock:0},
  {name:'bot-hoarding',botsHoard:true},
  {name:'five-year-saturation',weeks:260},
];
const stresses=cached?.stresses??mixes.flatMap(mix=>stressSpecs.map(({name,...options})=>record(simulate({...mix,seed:1011011},
  {...common,rewardPolicy:'grant-headroom',forgePlan:{interestBps:5000,maxDesigns:3,first:true,reserveCompletion:true},...options}),
  {strategy:'save-for-forge',name})));
const diagnostic=cached?.diagnostic??[false,true].map(reserveCompletion=>record(simulate(mixes[0],{
  ...common,stylePlan:null,supply:{rarePerActiveWeek:0,epicPerActiveWeek:8,source:'Synthetic abundant source'},
  entitlementBps:0,collectionTarget:0,forgePlan:{interestBps:10000,maxDesigns:3,first:true,reserveCompletion}}),
  {strategy:reserveCompletion?'save-for-forge':'pay-as-you-go',name:'zero-income-completion-control'}));
const groups=strategies.flatMap(strategy=>policies.flatMap(policy=>demands.map(demand=>{
  const rs=rows.filter(r=>r.strategy===strategy.name&&r.policy===policy&&r.demand===demand);
  return {strategy:strategy.name,policy,demand,runs:rs.length,flowPass:rs.filter(r=>r.flowPass&&r.farmingPass).length,
    worstRatio:rs.every(r=>r.claimsBurn!==null)?Math.max(...rs.map(r=>r.claimsBurn)):null,
    minCompletionShare:Math.min(...rs.map(r=>r.interested?r.completed/r.interested:0)),
    maxUnfinishedShare:Math.max(...rs.map(r=>r.interested?r.sealedButNeverForged/r.interested:0)),
    minCrafts:Math.min(...rs.map(r=>r.crafts)),maxCrafts:Math.max(...rs.map(r=>r.crafts))};
})));
const result={version:1,modelHash,seeds,demands,strategies,policies,common,runs:rows.length,stressRuns:stresses.length,
  diagnosticRuns:diagnostic.length,activation:false,observedPeople:0,
  assumptions:{behavior:'Compare original pay-as-you-go sealing with saving the full next23-YARN self-source recipe. Existing owned Epics reduce the remaining need. Forge-first saves ahead of styles; styles-first may exhaust cash. These are behavioral bounds, not telemetry or protocol limits.',
    utility:'Interest50% independently in each finite3-design catalog; no bot cosmetic utility. Same cohort/seed across alternatives; at most3 forge unlocks and3 styles each.',
    denominator:'All20-YARN grants and routine claims stay in the original claims/burn<=2 metric. Sealing still counts as an actual burn even if no forge completes. No retrospective metric change.',
    completion:'Report a separate outcome: interested accounts with at least1 forge. Sealed-but-never-forged is descriptive inventory, not proof of regret, dead money or failed sales. No arbitrary pass threshold is invented.',
    authority:'Recurring Epic supply is conditional on the source-code study; neither it nor this experiment authenticates campaign earning. Routine issuer and public activation remain disabled.'},
  groups,rows,stresses,diagnostic};
if(!cached){writeFileSync(path,JSON.stringify(result,null,2)+'\n');const keys=Object.keys(rows[0]);
  writeFileSync(resolve(root,'docs/chain/completion-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');}
const f=n=>n===null?'n/a':n.toFixed(2);
const table=groups.map(g=>`<tr><td>${g.strategy}</td><td>${g.policy}</td><td>${100*g.demand}%</td><td>${g.flowPass}/${g.runs}</td><td>${f(g.worstRatio)}</td><td>${f(100*g.minCompletionShare)}%</td><td>${f(100*g.maxUnfinishedShare)}%</td></tr>`).join('');
writeFileSync(resolve(root,'docs/chain/completion-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN — đốt token và hoàn thành forge</title><style>body{max-width:1120px;margin:32px auto;padding:0 20px;background:#101b2b;color:#e7edf7;font:17px/1.6 system-ui}h1{font-size:clamp(30px,5vw,48px);line-height:1.15}a{color:#72d9bd}.scroll{overflow:auto}table{border-collapse:collapse;min-width:950px;width:100%}td,th{padding:10px;text-align:left;border-bottom:1px solid #40506b}section{border-top:1px solid #40506b;padding:20px 0}.status{color:#ffbc83}</style><p>Fuji43113 · Testnet — no real value</p><h1>Đốt hết20 vẫn chưa forge được</h1><p>${rows.length} mô phỏng52 tuần +${stresses.length} stress +2 đối chứng. Giá, grant, quyền tự đặt giá và ngưỡng gốc được giữ nguyên.</p><section><h2>Đối chứng về khả năng hoàn thành</h2><p>1.000 ví giả lập, mỗi ví20 YARN, đủ Epic chưa seal, không thưởng thêm hay người mua. Trả từng bước đốt20.000 vào seal, tỷ lệ phát/đốt=1; số forge hoàn thành=0. Người tiết kiệm đủ23 giữ20.000 và chưa tiêu. Cùng một tính năng, kết quả phụ thuộc vào cách ra quyết định.</p><p class="status">Đây là lỗi diễn giải có thể tránh: đạt tỷ lệ token không đồng nghĩa người chơi hoàn thành điều họ muốn làm.</p></section><section><h2>So sánh có nguồn thu và thị trường</h2><p>Mỗi hàng9 lượt chạy từ3 nhóm ×3 seed. Hoàn thành là tỷ lệ thấp nhất trong nhóm người giả định có hứng thú. Ngưỡng gốc vẫn được báo cáo; chỉ số hoàn thành bổ sung chưa có ngưỡng thực nghiệm.</p><div class="scroll"><table><tr><th>Cách chi tiêu</th><th>Chính sách</th><th>Tham gia</th><th>Đạt ngưỡng gốc</th><th>Tỷ lệ xấu nhất</th><th>Đã forge≥1</th><th>Seal rồi chưa forge</th></tr>${table}</table></div></section><section><h2>Quyết định hiện tại</h2><p>Hiển thị đầy đủ chi phí nguyên liệu23 YARN trong phần trợ giúp đã có. Giữ lựa chọn chờ, xem miễn phí và mua vật phẩm với giá tự do. Không hứa khoản thưởng tương lai để khiến một công thức có vẻ vừa túi tiền. Thêm hoàn thành recipe, thời gian chờ và vật phẩm chưa dùng vào kế hoạch pilot; không lấy số burn làm bằng chứng duy nhất về nhu cầu.</p><p>0 người chơi được quan sát. Mức thích50%, nguồn drop và quy tắc tiết kiệm đều là giả định. Không bật thưởng, tăng trợ cấp hay đổi phí từ những số liệu này.</p><p><a href="completion-study.json">Mọi giả định và tình huống</a> · <a href="completion-study.csv">CSV</a> · <a href="headroom-study.html">Ngân sách đã tính trợ cấp</a> · <a href="forge-sink-study.html">Nguồn cung hữu hạn</a></p></section></html>`);
console.log(JSON.stringify({runs:rows.length,stressRuns:stresses.length,diagnostic,groups},null,2));
