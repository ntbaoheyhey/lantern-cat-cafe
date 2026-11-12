// Finite local feature experiment: explicit taste, no inferred organic demand.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {simulate,summarize,mixes} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';
import {YARN_STYLES} from '../../packages/chain/src/cosmetics.ts';
const root=fileURLToPath(new URL('../../',import.meta.url)),supply=loadSourceSupply();
const seeds=[520021,610031,700057],demands=[1,.5,.1],interests=[0,.1,.5,1],catalogSizes=[1,3];
const policies=[{name:'fixed6',options:{}},{name:'fixed1.5',options:{entitlementBps:2500}},
 {name:'closed50',options:{rewardPolicy:'closed-burn',burnBudgetBps:5000}}];
const fingerprint=createHash('sha256').update(JSON.stringify({supply,seeds,demands,interests,catalogSizes,policies,YARN_STYLES}));
for(const file of ['tools/chain/token-sim.mjs','tools/chain/cosmetic-pilot-study.mjs','tools/chain/season-budget.mjs','tools/chain/grant-headroom.mjs','tools/chain/forge-preparation.mjs','tools/chain/allocation-envelope.mjs','tools/chain/feature-plan.mjs','tools/chain/supply-snapshot.mjs','packages/chain/src/cosmetics.ts','packages/chain/src/forge.ts'])fingerprint.update(readFileSync(resolve(root,file)));
const modelHash=fingerprint.digest('hex'),file=resolve(root,'docs/chain/cosmetic-pilot-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(file,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'Stale finite cosmetic study');
const rows=cached?.rows??[];
if(!cached)for(const policy of policies)for(const demand of demands)for(const interest of interests)for(const maxStyles of catalogSizes){
 for(const mix of mixes)for(const seed of seeds){
  const s=simulate({...mix,seed},{supply,...policy.options,weeks:260,demand,stylePlan:{adoptionBps:interest*10000,maxStyles,openWeek:1}});
  const year=summarize({...s,rows:s.rows.slice(0,52)}),full=summarize(s),last=s.rows.at(-1),tail=s.seasons.slice(-4);
  rows.push({policy:policy.name,mix:mix.name,seed,demand,interest,maxStyles,
   yearClaimsBurn:year.emissionBurn,yearPass:year.flowPass&&year.farmingPass,fiveYearClaimsBurn:full.emissionBurn,
   fiveYearPass:full.flowPass&&full.farmingPass,stylePurchases:last.stylePurchases,styleBurn:last.styleBurn,
   sealBurn:last.sealBurn,marketBurn:last.saleBurn,tailBurn:tail.reduce((n,q)=>n+q.burn,0),
   tailRoutine:tail.reduce((n,q)=>n+q.routine,0),activeTail:tail.every(q=>q.routine>=1&&q.burn>=1),
   casualSave4By13:s.affordability[0].features[4].reachByWeek[13],
   minimumTailCasual:Math.min(...tail.map(q=>q.casualRoutineMedian)),
   healthyTail:tail.every(q=>q.healthTargetMet),finalRoutineCap:last.routineBudget});
 }
 console.log(`Finite styles: ${policy.name}, adoption ${demand}, interest ${interest}, lifetime choices ${maxStyles}`);
}
const groups=[];
for(const policy of policies)for(const demand of demands)for(const interest of interests)for(const maxStyles of catalogSizes){
 const cases=rows.filter(r=>r.policy===policy.name&&r.demand===demand&&r.interest===interest&&r.maxStyles===maxStyles);
 groups.push({policy:policy.name,demand,interest,maxStyles,runs:cases.length,yearPass:cases.filter(r=>r.yearPass).length,
  fiveYearPass:cases.filter(r=>r.fiveYearPass).length,activeTail:cases.filter(r=>r.activeTail).length,
  healthyTail:cases.filter(r=>r.healthyTail).length,worstYearClaimsBurn:Math.max(...cases.map(r=>r.yearClaimsBurn??Infinity)),
  minCasualSave4By13:Math.min(...cases.map(r=>r.casualSave4By13)),
  maxLifetimeStyleBurn:Math.max(...cases.map(r=>r.styleBurn))});
}
const result={modelHash,seeds,catalog:YARN_STYLES,runs:rows.length,live:false,activation:false,
 limits:{feature:'Three permanent account-bound room styles,4 YARN each. Local UI/Edge/SQL and real Anvil burn implemented; backend migration/function deployment deferred.',
  demand:'An independent fixed taste draw among human chain adopters; bots do not buy styles. One or three lifetime styles is a sensitivity, not a measured desire. No renewal, expiry or repurchase.',
  budgets:'Competes with sealing and trading for the same grant/reward balances; no external funding or new users. Existing20 grant unchanged.',
  authority:'Source supply remains conditional code measurement. Routine payouts remain disabled. Offline source/routine seams do not establish live eligibility.',
  interpretation:'Three seeds per mix measure model variation only. An original52-week pass does not satisfy the >=1 seasonal health target or prove sustainable end-of-horizon activity.'},groups,rows};
if(!cached){
 writeFileSync(file,JSON.stringify(result,null,2)+'\n');
 const keys=Object.keys(rows[0]);writeFileSync(resolve(root,'docs/chain/cosmetic-pilot-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');
}
const n=x=>x===null?'n/a':Number(x).toFixed(2),view=groups.filter(g=>g.interest===0||g.interest===.5||g.interest===1);
writeFileSync(resolve(root,'docs/chain/cosmetic-pilot-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN: thử cosmetic hữu hạn</title><style>body{margin:32px auto;padding:0 20px;max-width:1100px;background:#101b2b;color:#e7edf7;font:17px/1.6 system-ui}h1{line-height:1.15;font-size:clamp(30px,5vw,46px)}a{color:#72d9bd}.scroll{overflow:auto}table{border-collapse:collapse;min-width:1000px;width:100%}td,th{border-bottom:1px solid #40506b;padding:10px;text-align:left}.notice{color:#ffbc83}section{border-top:1px solid #40506b;padding:22px 0}</style><p>Fuji43113 · Testnet — no real value</p><h1>Cosmetic có thể thử thật; nhu cầu vẫn cần đo</h1><p>${rows.length} mô phỏng5 năm,3 seed mới mỗi nhóm. Ba kiểu trang trí vĩnh viễn:Fern,Tide,Ember. Mỗi kiểu đốt4 YARN một lần, không tăng sức mạnh.</p><p class="notice">Đã kiểm tra local; chưa deploy backend. Không bật thưởng định kỳ hoặc thay20 YARN grant. Những tỷ lệ tham gia dưới đây đều là giả định.</p><section><h2>Chi tiêu cạnh tranh với nhau</h2><p>Người chơi không có thêm tiền khi xuất hiện tính năng mới. Mua3 kiểu hết12 trong20 YARN có thể khiến họ không đủ10 để seal Epic. Vì vậy không cộng thẳng tiền đốt cosmetic vào kết quả mô hình cũ. Người chỉ thích1 kiểu mua tối đa1, người thích3 kiểu mua tối đa3; không mua lại mỗi mùa.</p></section><section><h2>Ngưỡng52tuần và cuối5năm</h2><p>Mỗi hàng gồm9 lượt:3 nhóm×3 seed. “Sống cuối kỳ” đòi4 mùa cuối đều có≥1 YARN thưởng và≥1 YARN đốt toàn nhóm. Mục tiêu đốt/phát≥1 theo mùa được kiểm tra riêng. Đủ4 ở tuần13 là tích lũy thưởng thường, bỏ grant; chưa trừ các chi tiêu khác.</p><div class="scroll"><table><tr><th>Thưởng</th><th>Tham gia chain</th><th>Thích style</th><th>Mua tối đa</th><th>52tuần</th><th>5năm</th><th>Sống cuối kỳ</th><th>4mùa≥1</th><th>Phát/đốt xấu nhất</th><th>Casual đủ4</th></tr>${view.map(g=>`<tr><td>${g.policy}</td><td>${g.demand*100}%</td><td>${g.interest*100}%</td><td>${g.maxStyles}</td><td>${g.yearPass}/9</td><td>${g.fiveYearPass}/9</td><td>${g.activeTail}/9</td><td>${g.healthyTail}/9</td><td>${n(g.worstYearClaimsBurn)}</td><td>${n(g.minCasualSave4By13*100)}%</td></tr>`).join('')}</table></div></section><section><h2>Quyết định</h2><p>Giữ catalog nhỏ, preview miễn phí, sở hữu vĩnh viễn, reset miễn phí. Đo thử mua/khôi phục và ý muốn mua trước khi cân bằng mức thưởng. Không tăng giá hoặc bắt mua cosmetic để làm đẹp tỷ lệ đốt; không tạo FOMO, không bán Power. Catalog hữu hạn chỉ tạo nhu cầu hữu hạn.</p></section><p><a href="cosmetic-pilot-study.json">Toàn bộ giả định/kết quả</a> · <a href="cosmetic-pilot-study.csv">CSV</a> · <a href="calibration-study.html">So sánh ngân sách</a> · <a href="utility-study.html">Thử forge</a></p></html>`);
console.log(JSON.stringify({runs:rows.length,activation:false,fullAdoption:groups.filter(g=>g.demand===1&&g.interest===.5)},null,2));
