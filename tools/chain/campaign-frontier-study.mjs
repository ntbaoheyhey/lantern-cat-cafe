// Fixed before this run: grid, training seeds, held-out simulation seeds and
// nomination criterion. The same measured synthetic source traces are reused;
// this is NOT a holdout of human behavior or independent gameplay telemetry.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {loadCampaignEvidence,campaignCohort} from './campaign-cohort.mjs';
import {simulate,summarize,mixes} from './token-sim.mjs';
import {campaignEnvelope,affordableCampaignScale,farmingExposure,nominateCampaign,UNIT} from './campaign-budget.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),evidence=loadCampaignEvidence();
const grid={fees:[1000,500],demands:[.1,.5,.6,.75,1],scales:Array.from({length:11},(_,i)=>i*250),
  training:[1472027,1472051],holdout:[1472081,1472099,1472113]};
assert(new Set([...grid.training,...grid.holdout]).size===5);
const common={earningEndWeek:13,hoursByType:{casual:3.5,regular:7,farmer:21,bot:70},
  stylePlan:{adoptionBps:5000,maxStyles:3,openWeek:1},forgePlan:{interestBps:5000,maxDesigns:3,first:true,reserveCompletion:true}};
const hash=createHash('sha256').update(JSON.stringify({grid,common,evidenceHash:evidence.evidenceHash}));
for(const f of ['campaign-frontier-study.mjs','campaign-budget.mjs','campaign-cohort.mjs','token-sim.mjs',
  'forge-preparation.mjs','allocation-envelope.mjs','season-budget.mjs','grant-headroom.mjs','feature-plan.mjs'])hash.update(f).update(readFileSync(resolve(root,'tools/chain',f)));
for(const f of ['rank.ts','cosmetics.ts','forge.ts'])hash.update(f).update(readFileSync(resolve(root,'packages/chain/src',f)));
const modelHash=hash.digest('hex'),path=resolve(root,'docs/chain/campaign-frontier-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(path,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'Frontier inputs changed; regenerate without overriding provenance');
function run(mix,{split='stress',sealFeeBps=500,demand=.75,entitlementBps=1000,tail='repeat-two-weeks',botProfile='heavy',...extra}={}){
  const s=simulate(mix,{...common,campaign:campaignCohort(evidence,{tail,botProfile}),sealFeeBps,demand,entitlementBps,...extra});
  const r=s.rows.at(-1),first=s.forgeTiming.reduce((n,g)=>n+g.byWeek[13],0),interested=s.forgeOutcomes.interested;
  const exposure=farmingExposure(r);
  return {split,sealFeeBps,tail,botProfile,...summarize(s),...exposure,
    bossMaximum:6*entitlementBps/10000,claims:r.inclusiveEmission,burn:r.cumulativeBurn,
    firstForgeBy13:interested?first/interested:0,crafts:r.crafts,interested,
    craftsPerInterested:interested?r.crafts/interested:0,
    unmetTwoXBurn:Math.max(0,r.inclusiveEmission/2-r.cumulativeBurn),
    firstSeasonHealthy:s.seasons[0].healthTargetMet,firstSeasonHealth:s.seasons[0].burnClaimRatio,
    farmerPerHour:r.farmerPerHour,casualPerHour:r.casualPerHour,botPerHour:r.botPerHour,
    rankExpired:r.rankExpired,rankPending:r.rankPending,playerBalances:r.playerCirculating,treasury:r.treasury};
}
const rows=cached?.rows??[];
if(!cached)for(const split of ['training','holdout'])for(const fee of grid.fees)for(const demand of grid.demands){
  for(const bps of grid.scales)for(const mix of mixes)for(const seed of grid[split])
    rows.push(run({...mix,seed},{split,sealFeeBps:fee,demand,entitlementBps:bps}));
  console.log(`frontier ${split}/${fee}/${demand}: ${rows.length} complete`);
}
const groups=grid.fees.flatMap(sealFeeBps=>grid.demands.map(demand=>{
  const training=rows.filter(r=>r.split==='training'&&r.sealFeeBps===sealFeeBps&&r.demand===demand);
  assert.equal(training.length,grid.scales.length*mixes.length*grid.training.length);
  const candidate=nominateCampaign(training);
  const control=rows.filter(r=>r.split==='holdout'&&r.sealFeeBps===sealFeeBps&&r.demand===demand&&r.entitlementBps===2500);
  const validation=candidate?rows.filter(r=>r.split==='holdout'&&r.sealFeeBps===sealFeeBps&&r.demand===demand&&r.entitlementBps===candidate.bps):[];
  return {sealFeeBps,demand,candidateBoss:candidate?6*candidate.bps/10000:null,candidateBps:candidate?.bps??null,
    trainingWorst:candidate?.trainingWorst??null,holdoutRuns:validation.length,
    holdoutPasses:validation.filter(r=>r.flowPass&&r.allFarmPass&&r.firstForgeBy13>=.95).length,
    holdoutWorst:validation.length?Math.max(...validation.map(r=>r.emissionBurn??Infinity)):null,
    holdoutFirstSeasonHealthy:validation.filter(r=>r.firstSeasonHealthy).length,
    controlWorst:Math.max(...control.map(r=>r.emissionBurn??Infinity)),controlPasses:control.filter(r=>r.flowPass&&r.allFarmPass).length,
    minCrafts:validation.length?Math.min(...validation.map(r=>r.craftsPerInterested)):null};
}));
const stresses=cached?.stresses??[];
if(!cached){
  const cases=[{name:'no-demand',demand:0},{name:'source-stops',tail:'stop-source'},
    {name:'demand-stops-week7',demandShockWeek:7,demandAfterShock:0},{name:'no-sale-fees',paidMarketShare:0},
    {name:'five-years',weeks:260}];
  for(const mix of mixes)for(const entitlementBps of [1000,2500])for(const {name,...extra} of cases)
    stresses.push({name,...run({...mix,seed:1472201},{entitlementBps,...extra})});
  for(const botHours of [70,7,1.1666666666666667,.35])for(const entitlementBps of [0,1000,2500])
    stresses.push({name:'bot-time-'+botHours,...run({...mixes[2],seed:1472227},{entitlementBps,botProfile:'casual',
      hoursByType:{...common.hoursByType,bot:botHours}})});
}
const funding=[50,100,200,250,1000].map(accounts=>({accounts,historicalAvailable:'9960000000000000000000',
  envelope:campaignEnvelope({accounts,bossMaximum:15n*UNIT/10n,rankMaximum:15n*UNIT/10n}),
  affordable:affordableCampaignScale({accounts,available:9960n*UNIT})}));
const data={version:1,modelHash,grid,common,evidenceHash:evidence.evidenceHash,rows,groups,stresses,funding,
  observedPeople:0,activation:false,
  interpretation:'1650 conditional52-week runs. Grid and nomination fixed in source before run. Holdout seeds resample the SAME144 synthetic campaign traces; not independent gameplay or organic demand. Original2x flow,3x farmer and >=1 seasonal thresholds are retained. Added bot3x exposure guard and95% first-forge-by13 among assumed interested users. Full season health and zero/weak-demand failures cannot be waived by nomination.'};
const stringify=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n';
if(!cached){
  writeFileSync(path,stringify(data));
  for(const [name,list] of [['campaign-frontier-study',rows],['campaign-frontier-stress',stresses]]){
    const keys=Object.keys(list[0]);writeFileSync(resolve(root,`docs/chain/${name}.csv`),keys.join(',')+'\n'+list.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');
  }
}
const fmt=n=>n===null?'—':Number(n).toFixed(3);
const chart=groups.filter(g=>g.sealFeeBps===500).map(g=>`<div>${g.demand*100}% tham gia ·1,5 YARN: ${fmt(g.controlWorst)}×<div class="bar" style="width:${Math.min(g.controlWorst,15)/15*100}%"></div></div>`).join('');
const table=groups.map(g=>`<tr><td>${g.sealFeeBps/100}%</td><td>${g.demand*100}%</td><td>${fmt(g.candidateBoss)}</td><td>${g.holdoutPasses}/${g.holdoutRuns}</td><td>${fmt(g.holdoutWorst)}</td><td>${g.holdoutFirstSeasonHealthy}/${g.holdoutRuns}</td><td>${fmt(g.minCrafts)}</td></tr>`).join('');
const bots=stresses.filter(r=>r.name.startsWith('bot-time')&&r.entitlementBps===1000).map(r=>`<tr><td>${r.name.slice(9)}</td><td>${fmt(r.farmerCasual)}</td><td>${fmt(r.botCasual)}</td><td>${r.allFarmPass?'Đạt':'Chưa đạt'}</td></tr>`).join('');
writeFileSync(resolve(root,'docs/chain/campaign-frontier-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN — ngân sách và kiểm chứng</title><style>body{margin:32px auto;padding:0 20px;max-width:1100px;background:#101b2b;color:#edf4ff;font:17px/1.6 system-ui}h1{font-size:clamp(30px,5vw,48px);line-height:1.2}h2{line-height:1.3}section{border-top:1px solid #40506b;margin-top:26px;padding-top:16px}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;min-width:740px}td,th{padding:10px;border-bottom:1px solid #40506b;text-align:left}.bar{height:12px;background:#73d9bd;border-radius:4px;margin:4px 0 14px}.warn{color:#ffbc94}a{color:#73d9bd}</style><p>Fuji43113 · Testnet — no real value</p><h1>Thưởng ít hơn chưa chắc cân bằng hơn</h1><p>1.650 kịch bản52 tuần +42 stress.11 mức boss0–1,5, hai mức seal, năm giả định tham gia.2 seed chọn mức và3 seed kiểm chứng. Dữ liệu nguồn vẫn là144 tài khoản giả lập ×14 ngày;0 người chơi thật.</p><p class="warn">Không bật thưởng định kỳ. Seed kiểm chứng đo biến thiên mô phỏng, không xác nhận nhu cầu. Không đổi grant20, phí hiện hành, phân bổ hoặc chỉ số chiến đấu.</p><section><h2>Mức1,5 dưới phí thử5%</h2><p>Thanh biểu diễn phát/đốt, tối đa hiển thị15. Ngưỡng gốc là≤2×; số in giữ nguyên toàn bộ giá trị.</p>${chart}</section><section><h2>Chọn bằng tập đầu, kiểm chứng bằng seed riêng</h2><p>Trong mỗi điều kiện, chọn mức khác0 có tỷ lệ xấu nhất thấp nhất qua mọi mix của tập chọn, đồng thời qua2× phát/đốt,3× thu nhập/giờ và95% người giả định muốn forge hoàn thành một mẫu trước tuần13. Đồng hạng chọn mức thưởng thấp hơn. Không dùng seed kiểm chứng để đổi mức. Dấu— nghĩa là không có ứng viên.</p><div class="scroll"><table><tr><th>Seal</th><th>Tham gia</th><th>Boss/tuần chọn</th><th>Kiểm chứng đạt</th><th>Phát/đốt xấu nhất</th><th>Mùa1 đốt≥phát</th><th>Mẫu/người muốn forge</th></tr>${table}</table></div></section><section><h2>Bot cũng phải qua kiểm tra</h2><p>Cùng hành động hợp lệ, bot nhận thu nhập mỗi giờ khác nhau khi giả định thời gian vận hành thay đổi. Bảng dùng20% tài khoản bot và mức0,6. Giới hạn mỗi ví không chứng minh mỗi người chỉ có một ví.</p><div class="scroll"><table><tr><th>Giờ bot/tuần giả định</th><th>Farmer/casual</th><th>Bot/casual</th><th>Cả hai≤3×</th></tr>${bots}</table></div></section><section><h2>Ngân sách phải dành cả thưởng cuối mùa</h2><p>1.000 tài khoản ở mức1,5 cần20.000 grant +19.500 boss +242,5 rank =39.742,5 YARN. Để đạt2× cần ít nhất19.871,25 được đốt; chỉ đủ tiền không chứng minh có nhu cầu. Rank dự trữ theo tổng slot, không trả mức cao nhất cho mọi người đồng hạng.</p><p>Snapshot9.960 trong bảng JSON chỉ là ví dụ lịch sử. Không đọc số dư mới, không tạo chương trình và không ký voucher từ công cụ này.</p></section><p><a href="campaign-frontier-study.json">Tất cả dữ liệu và ngân sách</a> · <a href="campaign-frontier-study.csv">1.650 dòng CSV</a> · <a href="campaign-frontier-stress.csv">42 stress</a> · <a href="../design/chain/TOKENOMICS-RESEARCH.md">Nguồn nghiên cứu</a></p></html>`);
console.log(JSON.stringify({runs:rows.length,stresses:stresses.length,groups,botFailures:stresses.filter(r=>r.name.startsWith('bot-time')&&!r.allFarmPass).length,activation:false},null,2));
