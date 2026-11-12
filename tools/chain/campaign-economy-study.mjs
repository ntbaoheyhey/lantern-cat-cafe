// Predeclared source correction and price/reward sensitivity, not human demand.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {loadCampaignEvidence,campaignCohort} from './campaign-cohort.mjs';
import {simulate,summarize,mixes} from './token-sim.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const evidence=loadCampaignEvidence();
const seeds=[1470119,1470137,1470161],demands=[1,.5,.1];
const policies=['starter-only','equip-earned'],fees=[1000,500],scales=[0,500,1000,2500];
const common={earningEndWeek:13,entitlementBps:2500,
  hoursByType:{casual:3.5,regular:7,farmer:21,bot:70},
  stylePlan:{adoptionBps:5000,maxStyles:3,openWeek:1},
  forgePlan:{interestBps:5000,maxDesigns:3,first:true,reserveCompletion:true}};
const fingerprint=createHash('sha256').update(JSON.stringify({evidenceHash:evidence.evidenceHash,seeds,demands,policies,fees,scales,common}));
for(const f of ['tools/chain/campaign-economy-study.mjs','tools/chain/campaign-cohort.mjs','tools/chain/token-sim.mjs',
  'tools/chain/season-budget.mjs','tools/chain/grant-headroom.mjs','tools/chain/forge-preparation.mjs',
  'tools/chain/allocation-envelope.mjs','tools/chain/feature-plan.mjs','packages/chain/src/rank.ts',
  'packages/chain/src/forge.ts','packages/chain/src/cosmetics.ts'])fingerprint.update(f).update(readFileSync(resolve(root,f)));
const modelHash=fingerprint.digest('hex'),path=resolve(root,'docs/chain/campaign-economy-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(path,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'Campaign economy inputs changed; regenerate');
function run(mix,policy,sealFeeBps,demand,extra={}){
  const {tail='repeat-two-weeks',botProfile='heavy',...options}=extra;
  const s=simulate(mix,{...common,campaign:campaignCohort(evidence,{policy,tail,botProfile}),sealFeeBps,demand,...options});
  const r=s.rows.at(-1);
  assert(s.rows.slice(13).every(w=>w.bossEmission===0));
  assert(s.rows.slice(26).every(w=>w.emission===0));
  return {policy,sealFeeBps,tail,botProfile,...summarize(s),claims:r.inclusiveEmission,burn:r.cumulativeBurn,
    additionalBurnToTwoX:Math.max(0,r.inclusiveEmission/2-r.cumulativeBurn),
    claimsAt13:s.rows[12].inclusiveEmission,burnAt13:s.rows[12].cumulativeBurn,
    firstSeasonHealthy:s.seasons[0].healthTargetMet,healthySeasons:s.seasons.filter(x=>x.healthTargetMet).length,
    rankEarnedAt13:s.rows[12].rankPending,sourceOffered:r.acquired,sealed:r.sealed,itemConsumed:r.consumed,
    forgeCompleted:s.forgeOutcomes.completed,forgeInterested:s.forgeOutcomes.interested,
    styleBurn:r.styleBurn,forgeBurn:r.forgeBurn,treasury:r.treasury,playerBalances:r.playerCirculating,
    farmerPerHour:r.farmerPerHour,casualPerHour:r.casualPerHour,botPerHour:r.botPerHour,
    // Per-hour values use assumed exposure; deterministic steps are separate evidence.
    earnedSourceHash:evidence.evidenceHash};
}
const rows=cached?.rows??[];
if(!cached)for(const policy of policies)for(const fee of fees)for(const demand of demands){
  for(const mix of mixes)for(const seed of seeds)rows.push(run({...mix,seed},policy,fee,demand));
  console.log(`campaign economy ${policy}/${fee}/${demand}`);
}
const sensitivity=cached?.sensitivity??demands.flatMap(demand=>scales.flatMap(entitlementBps=>
  mixes.flatMap(mix=>seeds.map(seed=>run({...mix,seed},'equip-earned',500,demand,{entitlementBps})))));
const stressSpecs=[{name:'source-stops-at-two-weeks',tail:'stop-source'},
  {name:'no-demand',demand:0},{name:'demand-dies-week7',demandShockWeek:7,demandAfterShock:0},
  {name:'all-fees-bypassed',paidMarketShare:0},{name:'bots-minimum-effort',botProfile:'casual',hoursByType:{casual:3.5,regular:7,farmer:21,bot:.35}},
  {name:'five-year-finite',weeks:260}];
const stresses=cached?.stresses??mixes.flatMap(mix=>stressSpecs.map(({name,demand=.5,...extra})=>
  ({name,...run({...mix,seed:1471217},'equip-earned',500,demand,extra)})));
const group=(rs,extra)=>({...extra,runs:rs.length,passes:rs.filter(r=>r.flowPass&&r.farmingPass).length,
  worstRatio:rs.every(r=>r.emissionBurn!==null)?Math.max(...rs.map(r=>r.emissionBurn)):null,
  maxClaims:Math.max(...rs.map(r=>r.claims)),minBurn:Math.min(...rs.map(r=>r.burn)),
  maxAdditionalBurn:Math.max(...rs.map(r=>r.additionalBurnToTwoX)),
  maxFarmerCasual:Math.max(...rs.map(r=>r.farmerCasual??0)),
  firstSeasonHealthy:rs.filter(r=>r.firstSeasonHealthy).length,
  minForgeCompletion:Math.min(...rs.map(r=>r.forgeInterested?r.forgeCompleted/r.forgeInterested:0))});
const groups=policies.flatMap(policy=>fees.flatMap(sealFeeBps=>demands.map(demand=>group(
  rows.filter(r=>r.policy===policy&&r.sealFeeBps===sealFeeBps&&r.demand===demand),{policy,sealFeeBps,demand}))));
const rewardGroups=demands.flatMap(demand=>scales.map(entitlementBps=>group(
  sensitivity.filter(r=>r.demand===demand&&r.entitlementBps===entitlementBps),{demand,bossMaximum:6*entitlementBps/10000})));
const data={version:1,modelHash,evidence:{rulesHash:evidence.rulesHash,modelHash:evidence.modelHash,evidenceHash:evidence.evidenceHash,
  accounts:evidence.accounts,measuredDays:evidence.days},seeds,demands,policies,fees,scales,common,
  rows,sensitivity,stresses,groups,rewardGroups,activation:false,observedPeople:0,
  assumptions:[
    '144 synthetic server-rule accounts, two Monday-aligned weeks. Entire seed traces are sampled per account; paired wins and exported surplus stay together. Chapter1 only; no injected victory.',
    'The same two source weeks repeat through the horizon only as a conditional supply bound. Stop-source stress creates no later input/wins. This is not a52-week gameplay observation.',
    'All sampled schedules are present every week. The old90% activity filter and50/90/95% boss eligibility are removed for this explicit campaign mode. Historical controls are unchanged.',
    'Rank uses the SAME integer tie allocator as the server. Best chapter1 per successful week yields at most13; chapter2/3 ability and player choice are not measured.',
    'Source is only unused exported gear, capped3 per actual active day. It becomes a seal opportunity, never assumed paid consumption. Inventory equipped for gameplay is excluded.',
    'Human3.5/7/21 hours and bot70 hours/week are sensitivity assumptions borrowed from the C2 exposure grid, not measured here. A0.35-hour bot stress exposes the identity/time limit.',
    '100/50/10% persistent adoption,50% style/forge interest and20-YARN resale price are assumptions. Same balance funds every competing purchase.20 grant, sale fee5%, finite3 styles/3 forge designs remain.',
    'No source study proves organic demand or Sybil resistance. A failed scenario stays failed. A one-season pilot is not an indefinitely sustainable reward economy.'
  ]};
if(!cached){
  writeFileSync(path,JSON.stringify(data,null,2)+'\n');
  for(const [name,list] of [['campaign-economy-study',rows],['campaign-reward-sensitivity',sensitivity],['campaign-economy-stress',stresses]]){
    const fields=Object.keys(list[0]);writeFileSync(resolve(root,`docs/chain/${name}.csv`),fields.join(',')+'\n'+list.map(r=>fields.map(k=>r[k]??'').join(',')).join('\n')+'\n');
  }
}
const f=n=>n===null?'∞':n.toFixed(3);
const table=groups.map(g=>`<tr><td>${g.policy}</td><td>${g.sealFeeBps/100}%</td><td>${g.demand*100}%</td><td>${g.passes}/${g.runs}</td><td>${f(g.worstRatio)}</td><td>${f(g.minForgeCompletion*100)}%</td><td>${g.firstSeasonHealthy}/${g.runs}</td></tr>`).join('');
const rewardTable=rewardGroups.map(g=>`<tr><td>${g.demand*100}%</td><td>${g.bossMaximum}</td><td>${g.passes}/${g.runs}</td><td>${f(g.worstRatio)}</td><td>${f(g.maxAdditionalBurn)}</td></tr>`).join('');
writeFileSync(resolve(root,'docs/chain/campaign-economy-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN — hiệu chỉnh theo campaign</title><style>body{max-width:1100px;margin:32px auto;padding:0 20px;background:#101b2b;color:#e7edf7;font:17px/1.6 system-ui}h1{font-size:clamp(30px,5vw,48px);line-height:1.15}.scroll{overflow:auto}table{border-collapse:collapse;min-width:760px;width:100%}td,th{padding:10px;text-align:left;border-bottom:1px solid #40506b}a{color:#72d9bd}section{border-top:1px solid #40506b;padding:20px 0}.bar{height:12px;background:#72d9bd;border-radius:4px}.bars{display:grid;gap:12px}.warn{color:#ffbc94}</style><p>Fuji43113 · Testnet — no real value</p><h1>Thưởng theo chiến thắng thật của mô phỏng campaign</h1><p>144 tài khoản giả lập ×14 ngày;108 kịch bản kinh tế +108 ngân sách +18 stress.0 người chơi thật được quan sát. Thưởng định kỳ vẫn tắt.</p><section><h2>Sửa hai giả định quan trọng</h2><p>Giữ đồ để trang bị làm giảm nguồn dư; đường đầu dễ thắng khiến ngân sách boss cao hơn giả định cũ. Mô hình dùng cùng thuật toán chia đồng hạng của server. Thưởng1,5/tuần chỉ trong13 tuần; settlement mùa kế tiếp giữ nguyên.</p><p class="warn">Hai tuần nguồn được lặp lại theo giả định; có stress dừng nguồn sau tuần2. Thời gian chơi, ý muốn mua và giá bán20 chưa được đo. Không tăng thưởng để ép hấp thụ đồ dư.</p></section><section><h2>Đường đạt ngưỡng2×</h2><p>Độ dài thanh là phát/đốt, giới hạn hiển thị15; con số là giá trị đầy đủ. Các hàng dùng đồ đã giữ cho trang bị và phí thử5%.</p><div class="bars">${groups.filter(g=>g.policy==='equip-earned'&&g.sealFeeBps===500).map(g=>`<div>${g.demand*100}% tham gia: ${f(g.worstRatio)}×<div class="bar" style="width:${Math.min(g.worstRatio??15,15)/15*100}%"></div></div>`).join('')}</div></section><section><h2>Giá và hoàn thành forge</h2><div class="scroll"><table><tr><th>Loadout</th><th>Seal</th><th>Tham gia</th><th>Đạt2×/3×</th><th>Phát/đốt xấu nhất</th><th>Forge hoàn thành thấp nhất</th><th>Mùa1 đốt≥phát</th></tr>${table}</table></div></section><section><h2>Giảm ngân sách có đủ không?</h2><p>Cùng nguồn equip-earned, phí thử5%,3 mix ×3 seed/hàng. Cột thiếu burn giữ grant20 trong mẫu số; không coi thưởng0 là kinh tế khỏe.</p><div class="scroll"><table><tr><th>Tham gia</th><th>Boss tối đa/tuần</th><th>Đạt2×/3×</th><th>Phát/đốt xấu nhất</th><th>Burn bổ sung còn thiếu</th></tr>${rewardTable}</table></div></section><section><h2>Toàn bộ giả định</h2><ul>${data.assumptions.map(s=>`<li>${s}</li>`).join('')}</ul><p><a href="campaign-economy-study.json">Kết quả và fingerprints</a> · <a href="campaign-economy-study.csv">108 kịch bản</a> · <a href="campaign-reward-sensitivity.csv">108 ngân sách</a> · <a href="campaign-economy-stress.csv">18 stress</a></p></section></html>`);
console.log(JSON.stringify({runs:rows.length,rewardRuns:sensitivity.length,stressRuns:stresses.length,groups,rewardGroups},null,2));
