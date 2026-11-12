import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {tiedRankAmounts} from '../../packages/chain/src/rank.ts';
import {campaignEnvelope,UNIT} from './campaign-budget.mjs';
import {operatorExposure,compareOperatorHours} from './operator-exposure.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const grid={accounts:1000,botWallets:200,aliasesPerOperator:[1,5,20,200],
  bossBps:[0,500,1000,2500],botWeeklyMicrohours:[70000000,7000000,350000],
  setupMicrohours:[0,2000000],earningWeeks:13,casualWeeklyMicrohours:3500000};
const hash=createHash('sha256').update(JSON.stringify(grid));
for(const f of ['operator-study.mjs','operator-exposure.mjs','campaign-budget.mjs'])hash.update(readFileSync(resolve(root,'tools/chain',f)));
hash.update(readFileSync(resolve(root,'packages/chain/src/rank.ts')));
const rows=[];
for(const bps of grid.bossBps)for(const aliases of grid.aliasesPerOperator)
for(const weekly of grid.botWeeklyMicrohours)for(const setup of grid.setupMicrohours){
  const maximum=6n*UNIT*BigInt(bps)/10000n;
  // A disclosed legal-action bound: all accounts complete chapter1 in all13
  // earning weeks. Not organic traces, a detection oracle or an observed bot.
  // Full rank settlement is assumed funded and within the on-chain cap; any
  // controller reduction can only reduce this entitlement upper bound.
  const rank=tiedRankAmounts(Array(grid.accounts).fill(13),maximum);
  const wallets=Array.from({length:grid.accounts},(_,i)=>({id:'wallet-'+i,
    operator:i<grid.botWallets?'bot-'+Math.floor(i/aliases):'human-'+i,
    grants:20n*UNIT,routine:maximum*13n+rank[i]}));
  const operators=[...new Set(wallets.map(w=>w.operator))].map(id=>({id,
    microhours:id.startsWith('bot-')?BigInt(setup)+BigInt(aliases*13*weekly):BigInt(13*grid.casualWeeklyMicrohours)}));
  const r=operatorExposure(wallets,operators),bot=r.aggregate.find(a=>a.id==='bot-0'),casual=r.aggregate.find(a=>a.id.startsWith('human-'));
  const exposure=compareOperatorHours(bot,casual),envelope=campaignEnvelope({accounts:1000,bossMaximum:maximum,rankMaximum:maximum});
  assert(r.total<=envelope.claims&&envelope.claims-r.total<1000n,'Tie dust only');
  const botClaims=r.aggregate.filter(a=>a.id.startsWith('bot-')).reduce((n,a)=>n+a.total,0n);
  const grantAttack=Math.min(200,Number(40n*UNIT/(20n*UNIT)));
  rows.push({bossMaximum:Number(maximum)/1e18,aliasesPerOperator:aliases,
    botWeeklyHoursPerWallet:weekly/1e6,sharedSetupHours:setup/1e6,operators:r.operators,
    claimsWei:r.total.toString(),attackerClaimsWei:botClaims.toString(),
    walletTopOnePercent:r.walletTopOnePercent,operatorTopOnePercent:r.operatorTopOnePercent,
    largestOperatorShare:r.largestOperatorShare,
    routineHourlyRatio:exposure.routine.ratio,includingGrantsHourlyRatio:exposure.includingGrants.ratio,
    routineHourPass:exposure.routine.pass,includingGrantsHourPass:exposure.includingGrants.pass,
    // Conditional upper bound if every human burns ALL rewards and bots hoard.
    maximumBurnClaimRatioWithBotHoarding:Number(r.total-botClaims)/Number(r.total),
    finite40GrantMaximumPaid:grantAttack*20,finite40AttackerCaptureShare:1});
}
const data={version:1,modelHash:hash.digest('hex'),grid,rows,activation:false,observedPeople:0,
  limitations:['Synthetic known operator ownership; no address attribution or bot detector.',
    '13-week equal successful chapter1 eligibility is a stress bound, not measured behavior.',
    'Hours are explicit assumptions, summed per wallet plus one setup overhead per operator; no invented parallel-speed discount.',
    'Grant40 example bounds loss but allows one operator to capture100%; no human fairness guarantee.',
    'Rank is a funded entitlement ceiling; reduced on-chain caps may prevent later full settlement.',
    'Gas, external inflows, market profits and real token prices are excluded; Fuji has no real value.']};
writeFileSync(resolve(root,'docs/chain/operator-study.json'),JSON.stringify(data,null,2)+'\n');
const keys=Object.keys(rows[0]);writeFileSync(resolve(root,'docs/chain/operator-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');
const show=rows.filter(r=>r.bossMaximum===.6&&r.botWeeklyHoursPerWallet===.35&&r.sharedSetupHours===0);
const table=show.map(r=>`<tr><td>${r.aliasesPerOperator}</td><td>${r.operators}</td><td>${(r.walletTopOnePercent*100).toFixed(1)}%</td><td>${(r.operatorTopOnePercent*100).toFixed(1)}%</td><td>${r.includingGrantsHourlyRatio.toFixed(1)}×</td></tr>`).join('');
writeFileSync(resolve(root,'docs/chain/operator-study.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN — nhiều ví và giới hạn quỹ</title><style>body{margin:32px auto;padding:0 20px;max-width:1000px;background:#101b2b;color:#edf4ff;font:17px/1.65 system-ui}h1{font-size:clamp(30px,5vw,46px);line-height:1.2}table{border-collapse:collapse;min-width:650px;width:100%}td,th{padding:12px;text-align:left;border-bottom:1px solid #40506b}.scroll{overflow:auto}a{color:#73d9bd}strong{color:#ffbc94}</style><p>Fuji43113 · Testnet — no real value</p><h1>Một người có thể điều khiển nhiều ví</h1><p>${rows.length} phép tính chính xác; 1.000 ví, gồm200 ví bot giả định. Mỗi ví hoàn thành cùng mục tiêu hợp lệ. Đây là phép thử đối kháng, không phải bộ phát hiện bot hoặc dữ liệu người thật.</p><div class="scroll"><table><tr><th>Ví/bot operator</th><th>Số operator</th><th>Top1% ví</th><th>Top1% operator</th><th>Thu nhập/giờ so với casual</th></tr>${table}</table></div><p>Bảng dùng0,6 YARN/boss mỗi tuần,13 tuần, rank đã chia theo slot; grant20 vẫn tính đủ. Giờ bot giả định0,35 mỗi ví/tuần, casual3,5. Thời gian của các ví được cộng, không giả định bot chạy song song miễn phí. CSV cũng thử7 và70 giờ, thêm2 giờ khởi tạo/operator.</p><p><strong>Giảm thưởng không sửa được tỷ lệ giờ khi các ví làm cùng hành động.</strong> Tắt thưởng định kỳ vẫn để lại grant20. Nếu20% số ví giữ nguyên mọi token, ngay cả khi người còn lại đốt toàn bộ, đốt/phát tối đa chỉ0,8.</p><p>Quỹ grant40 có thể giới hạn hai khoản20. Cả hai vẫn có thể thuộc một người; người đến sau bị từ chối. Sổ dự trữ ngăn vượt quỹ, không chứng minh phân phối công bằng. Khi bật thưởng chiến dịch, trợ cấp phải dùng chung sổ này ngay cả khi cờ grant riêng bị bỏ sót.</p><p>Không thêm yêu cầu ví cũ, KYC hoặc điểm lịch sử vào đường thử guest. Nguồn mới chỉ ra ví mới có thể thiếu dữ liệu định danh. Mọi bật thưởng công khai vẫn hoãn; không sửa thông số đã triển khai.</p><p><a href="operator-study.csv">${rows.length} dòng tính toán</a> · <a href="operator-study.json">Giả định và kết quả</a> · <a href="campaign-frontier-study.html">Kiểm chứng mức thưởng</a> · <a href="../design/chain/TOKENOMICS-RESEARCH.md">Nguồn nghiên cứu</a></p></html>`);
console.log(JSON.stringify({cases:rows.length,walletTop1:show[0].walletTopOnePercent,
  operatorTop1:show.at(-1).operatorTopOnePercent,hourRatio:show[0].includingGrantsHourlyRatio,
  unboundedIdentity:false,activation:false}));
