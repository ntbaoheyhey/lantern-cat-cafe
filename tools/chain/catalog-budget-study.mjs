import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {loadRules,root} from '../cardrpg-sim/load.mjs';
import {formatYarn} from './reward-budget.mjs';
import {catalogBaskets,optimisticCohortBound} from './catalog-budget.mjs';
const {rules,vite}=await loadRules();
const epicReference=BigInt(rules.TRADE_BY_TOKEN[20020].referenceYarn)*10n**18n;
const threadReference=BigInt(rules.TRADE_BY_ID['star-thread'].referenceYarn)*10n**18n;
assert.equal(rules.TRADE_POLICY.sealBps,1000,'Update the control if catalog policy changes');
await vite.close();
const fees=[1000,500,250,0],rows=[],cohorts=[],U=10n**18n;
const json=(v)=>JSON.stringify(v,(_,n)=>typeof n==='bigint'?formatYarn(n):n,2)+'\n';
for(const sealBps of fees)for(const reserveYarn of [0,2])for(const hypotheticalRoutineYarn of [0,3,21])for(const unsealedEpics of [0,6]){
  const q=catalogBaskets({sealBps,reserve:BigInt(reserveYarn)*U,budget:BigInt(20+hypotheticalRoutineYarn)*U,epicReference,threadReference,unsealedEpics});
  rows.push({sealBps,reserveYarn,hypotheticalRoutineYarn,unsealedEpics,firstForge:formatYarn(q.firstForge),
    maxForge:q.maxForge,maximumCompleteSpend:formatYarn(q.maximumCompleteSpend),affordableBaskets:q.baskets.length,
    baskets:q.baskets});
}
for(const sealBps of fees)for(const adoptionBps of [10000,5000,2500,1000])for(const [mix,bots] of [['casual-heavy',0],['balanced',0],['farmer-heavy',200]]){
  const q=catalogBaskets({sealBps,unsealedEpics:6,epicReference,threadReference});
  const activeHumans=Math.floor((1000-bots)*adoptionBps/10000);
  const b=optimisticCohortBound({accounts:1000,activeHumans,maximumCompleteSpend:q.maximumCompleteSpend});
  cohorts.push({sealBps,adoptionBps,mix,bots,activeHumans,claims:formatYarn(b.claims),maximumBurn:formatYarn(b.burn),
    retained:formatYarn(b.retained),necessaryActive:b.minimumActive===null?null:Number(b.minimumActive),canReachTwoX:b.canReachTwoX});
}
const hash=createHash('sha256');
for(const file of ['tools/chain/catalog-budget.mjs','tools/chain/catalog-budget-study.mjs','packages/chain/src/forge.ts',
  'packages/chain/src/cosmetics.ts','packages/game-rules/src/cardrpg/trade.ts'])hash.update(readFileSync(resolve(root,file)));
const data={version:1,modelHash:hash.digest('hex'),rows,cohorts,activation:false,observedPeople:0,
  assumptions:['Exact finite baskets, not players or predicted demand. Current20 grant,3×4 styles and3×3 forge designs.',
    'Only complete self-sourced recipes count. No unfinished Epic sealing, market income, treasury recycling or invented feature.',
    '0 vs6 authenticated unsealed Epics is an explicit authority/input counterfactual; actual ordinary authority is0.',
    '0,3,21 routine income rows are affordability quotes, not earned entitlement, current balance or enabled rewards.',
    'Cohort bounds use2-YARN reserve and assume all active humans maximize completed spending; bots retain grants. This is optimistic, not preference evidence.',
    '5% is the next local price candidate because a13-YARN first forge fits20 while retaining optional purchases and liquidity; it is not a proven optimum. Live policy stays10%.']};
writeFileSync(resolve(root,'docs/chain/catalog-budget-study.json'),json(data));
const keys=Object.keys(cohorts[0]);
writeFileSync(resolve(root,'docs/chain/catalog-budget-study.csv'),keys.join(',')+'\n'+cohorts.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');
const table=rows.filter(r=>r.reserveYarn===2&&r.hypotheticalRoutineYarn===0&&r.unsealedEpics===6).map(r=>{
  const count=cohorts.find(c=>c.sealBps===r.sealBps).necessaryActive;
  return `<tr><td>${r.sealBps/100}%${r.sealBps===1000?' (hiện tại)':''}</td><td>${r.firstForge}</td><td>${r.maxForge}</td><td>${r.maximumCompleteSpend}</td><td>${count??'—'}/1.000</td></tr>`;
}).join('');
writeFileSync(resolve(root,'docs/chain/catalog-budget-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN — ngân sách hoàn thành</title><style>body{max-width:1000px;margin:40px auto;padding:0 20px;font:17px/1.65 system-ui;background:#101b2b;color:#e7edf7}h1{font-size:clamp(30px,5vw,48px);line-height:1.2}section{border-top:1px solid #42516b;padding:20px 0}table{border-collapse:collapse;min-width:680px;width:100%}td,th{padding:12px;text-align:left;border-bottom:1px solid #42516b}.scroll{overflow:auto}a{color:#79ddbe}strong{color:#a6e5cc}</style><p>Fuji 43113 · Testnet — no real value</p><h1>20 YARN mua được trải nghiệm nào?</h1><p>48 bảng ngân sách chính xác và 48 giới hạn theo nhóm. Đây là phép tính, không phải 96 người chơi hoặc dự báo nhu cầu.</p><section><h2>Hoàn thành món, giữ lại 2 YARN</h2><p>Giả định có đủ 6 Epic từ nguồn hợp lệ, một Star Thread, tối đa 3 style và 3 thiết kế forge. Nguồn campaign hợp lệ hiện chưa có. Không tính bán lại đồ hoặc phần thưởng tương lai.</p><div class="scroll"><table><tr><th>Phí seal</th><th>Forge đầu tiên</th><th>Forge tối đa</th><th>Đốt tối đa qua món hoàn thành</th><th>Ít nhất người chi tối đa để đạt 2×</th></tr>${table}</table></div><p>Các giá trị tối đa có thể thuộc những giỏ mua khác nhau. Trên điện thoại, vuốt ngang để xem đủ bảng.</p><p><strong>5% là ứng viên thử tiếp:</strong> 13 YARN cho forge + 4 cho style + 1 cho seal Star Thread, còn 2. Mức 10% hiện tại cần 23 chỉ cho forge. Giảm phí không bảo đảm người chơi muốn mua.</p></section><section><h2>Ngưỡng kinh tế vẫn giữ nguyên</h2><p>Cả 12 nhóm có mức tham gia 50% đều không thể đạt 2× dưới giới hạn lạc quan này; 25% và 10% cũng thất bại. Mỗi người không tham gia vẫn giữ grant 20 trong mẫu số. Đạt phép chặn lạc quan không đồng nghĩa kinh tế đã đạt.</p><p>Chỉ số đốt/phát theo mùa ≥ 1, hoạt động lâu dài và chống farm vẫn cần đánh giá riêng. Không đổi grant, phí live, phần thưởng hoặc drop C2.</p></section><section><h2>Quyết định có thể kiểm tra</h2><p>Giữ thưởng định kỳ tắt. Bảo vệ ngân sách cấp grant hữu hạn và các cam kết cũ. So sánh 10%/5% trong một thử nghiệm tự nguyện sau khi có nguồn vật phẩm xác thực; đo hoàn thành, tồn kho, thanh khoản và người không mua. Không lấy mức đốt cao làm bằng chứng thích sản phẩm.</p><p><a href="catalog-budget-study.json">Toàn bộ giỏ mua và giả định</a> · <a href="catalog-budget-study.csv">48 giới hạn nhóm</a></p></section></html>`);
console.log(JSON.stringify({baskets:rows.length,bounds:cohorts.length,feeCandidateBps:500,activation:false,
  optimisticHalfAdoptionPasses:cohorts.filter(r=>r.adoptionBps===5000&&r.canReachTwoX).length,modelHash:data.modelHash}));
