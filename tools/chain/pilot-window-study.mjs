// Match the documented ONE-season proposal; retain the recurring counterfactual.
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
const seeds=[1320023,1320047,1320073],demands=[1,.5,.1];
const policies=[{name:'recurring1.5',earningEndWeek:null},{name:'one-season1.5',earningEndWeek:13}];
const options={entitlementBps:2500,
  stylePlan:{adoptionBps:5000,maxStyles:3,openWeek:1},
  forgePlan:{interestBps:5000,maxDesigns:3,first:true,reserveCompletion:true}};
const hash=createHash('sha256').update(JSON.stringify({source,seeds,demands,policies,options}));
for(const file of ['pilot-window-study.mjs','token-sim.mjs','c2-supply.mjs','season-budget.mjs','grant-headroom.mjs',
  'allocation-envelope.mjs','feature-plan.mjs','forge-preparation.mjs','../../packages/chain/src/forge.ts','../../packages/chain/src/cosmetics.ts'])
  hash.update(readFileSync(resolve(root,'tools/chain',file)));
const modelHash=hash.digest('hex'),path=resolve(root,'docs/chain/pilot-window-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(path,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'Pilot source/model changed; regenerate');
function run(mix,policy,demand,extra={}){
  const scenario=c2Scenario(source,{tail:extra.tail??'mean',botScale:extra.botScale??1,authority:extra.authority??false});
  const s=simulate(mix,{...scenario,...options,earningEndWeek:policy.earningEndWeek,demand,...extra});
  const last=s.rows.at(-1);
  if(policy.earningEndWeek===13){
    assert(s.rows.slice(13).every(r=>r.bossEmission===0));
    assert(s.rows.slice(26).every(r=>r.emission===0&&r.rankPending===0));
    assert(last.cumulativeEmission<=19742.5+1e-8,'13-week pilot envelope');
  }
  return {policy:policy.name,...summarize(s),weeks:s.weeks,
    claims:last.inclusiveEmission,burn:last.cumulativeBurn,treasury:last.treasury,balances:last.playerCirculating,
    claimsAt13:s.rows[12].inclusiveEmission,burnAt13:s.rows[12].cumulativeBurn,
    claimsAt26:s.rows[25].inclusiveEmission,burnAt26:s.rows[25].cumulativeBurn,
    ...s.forgeOutcomes,crafts:last.crafts,styleBurn:last.styleBurn,forgeBurn:last.forgeBurn,
    routineAfter26:s.rows.slice(26).reduce((n,r)=>n+r.emission,0),
    healthySeasons:s.seasons.filter(q=>q.healthTargetMet).length,
    activeTail:s.seasons.slice(-4).every(q=>q.routine>=1&&q.burn>=1),
    casualAffordability:s.affordability.find(p=>p.type==='casual').features};
}
const rows=cached?.rows??[];
if(!cached)for(const policy of policies)for(const demand of demands){
  for(const mix of mixes)for(const seed of seeds)rows.push(run({...mix,seed},policy,demand));
  console.log(`Pilot ${policy.name}/${demand} complete`);
}
const specs=[{name:'source-authority-zero',authority:true},{name:'demand-zero',demand:0},
  {name:'demand-collapse',demandShockWeek:7,demandAfterShock:0},
  {name:'no-market-fees',paidMarketShare:0},{name:'heavy-bot-bound',botScale:3,botsHoard:true},
  {name:'five-year-finite',weeks:260}];
const stresses=cached?.stresses??mixes.flatMap(mix=>specs.map(({name,demand=.5,...extra})=>
  ({name,...run({...mix,seed:1321091},policies[1],demand,extra)})));
const groups=policies.flatMap(policy=>demands.map(demand=>{
  const rs=rows.filter(r=>r.policy===policy.name&&r.demand===demand);
  return {policy:policy.name,demand,runs:rs.length,passes:rs.filter(r=>r.flowPass&&r.farmingPass).length,
    worstRatio:rs.every(r=>r.emissionBurn!==null)?Math.max(...rs.map(r=>r.emissionBurn)):null,
    minCompletion:Math.min(...rs.map(r=>r.interested?r.completed/r.interested:0)),
    maxClaims:Math.max(...rs.map(r=>r.claims)),active:rs.filter(r=>r.activeTail).length,
    healthyAll:rs.filter(r=>r.healthySeasons===4).length};
}));
const data={version:1,modelHash,source,seeds,demands,policies,options,runs:rows.length,stressRuns:stresses.length,
  rows,stresses,groups,activation:false,observedPeople:0,
  assumptions:{schedule:'Only weeks1–13 earn boss/season rank. Already earned rank may claim in weeks14–26 under the deployed cap. No automatic renewal. Historical recurring controls are retained.',
    source:'Pinned C2 simulated gross creation before salvage/use; mean extrapolation after observed30 days. Ordinary authority remains zero; separately tested, never inferred from the source.',
    demand:'50% style/forge interest among assumed human adopters; no observed people. Price20 and market participation remain hypotheses; no price limits.',
    decision:'A bounded pilot is not a recurring sustainable economy. Original cumulative2x, farmer3x and seasonal1x metrics remain separate. A scheduled reward stop is not an active-tail pass.'}};
if(!cached){
  writeFileSync(path,JSON.stringify(data,null,2)+'\n');
  const keys=Object.keys(rows[0]).filter(k=>k!=='casualAffordability');
  writeFileSync(resolve(root,'docs/chain/pilot-window-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');
}
const f=n=>n===null?'n/a':n.toFixed(3);
const table=groups.map(g=>`<tr><td>${g.policy}</td><td>${g.demand*100}%</td><td>${g.passes}/${g.runs}</td><td>${f(g.worstRatio)}</td><td>${f(g.minCompletion*100)}%</td><td>${f(g.maxClaims)}</td><td>${g.healthyAll}/${g.runs}</td></tr>`).join('');
writeFileSync(resolve(root,'docs/chain/pilot-window-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN — pilot một mùa</title><style>body{max-width:1100px;margin:32px auto;padding:0 20px;background:#101b2b;color:#e7edf7;font:17px/1.6 system-ui}h1{font-size:clamp(30px,5vw,48px);line-height:1.15}.scroll{overflow:auto}table{border-collapse:collapse;min-width:860px;width:100%}td,th{padding:10px;text-align:left;border-bottom:1px solid #40506b}a{color:#72d9bd}section{border-top:1px solid #40506b;padding:20px 0}</style><p>Fuji43113 · Testnet — no real value</p><h1>Một mùa thử nghiệm không tự gia hạn</h1><p>Thử nghiệm54 kịch bản52 tuần +18 stress. Cùng dữ liệu C2, giá, grant20 và catalog hữu hạn; chỉ thay thời hạn kiếm thưởng.0 người chơi được quan sát.</p><section><h2>Ngân sách đúng với đề xuất</h2><p>Mỗi tài khoản: tối đa1,5/tuần trong13 tuần; rank tối đa1,5 của mùa đã đóng được nhận trong mùa kế tiếp, chịu mức trần thực. Với1000 tài khoản, trần gộp là19.742,5 routine YARN cộng20.000 grant. Không mở thêm nguồn thưởng sau tuần13.</p><p>Các báo cáo trước vẫn là đối chứng thưởng lặp lại. Kết quả giảm phát thưởng không được gọi là duy trì hoạt động; những mùa0/0 không đạt mục tiêu khỏe≥1.</p></section><section><h2>Kết quả giữ nguyên ngưỡng gốc</h2><p>Mỗi hàng9 lượt:3 mix ×3 seed. Forge hoàn thành dùng toàn bộ người quan tâm ban đầu, kể cả bỏ cuộc. Giả định50% thích style/forge chưa được đo.</p><div class="scroll"><table><tr><th>Thời hạn</th><th>Tham gia</th><th>Đạt2×/3×</th><th>Phát/đốt xấu nhất</th><th>Hoàn thành forge</th><th>Phát tối đa</th><th>Cả4 mùa≥1</th></tr>${table}</table></div></section><section><h2>Giới hạn</h2><p>Nguồn cung C2 là tạo đồ trước salvage/use; nguồn quyền cấp server vẫn0. Thưởng định kỳ vẫn tắt. Pilot hữu hạn không giải quyết nhu cầu thấp hoặc chứng minh cầu dài hạn. Không sửa phí, hợp đồng đã triển khai hay drop C2.</p><p><a href="pilot-window-study.json">Giả định, các tuần và stress</a> · <a href="pilot-window-study.csv">CSV</a> · <a href="c2-study.html">Đối chứng C2</a></p></section></html>`);
console.log(JSON.stringify({runs:rows.length,stressRuns:stresses.length,groups},null,2));
