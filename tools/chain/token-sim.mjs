// Deterministic, price-free inventory/flow model. No network and no credentials.
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=resolve(root,'docs/chain');mkdirSync(out,{recursive:true});
const source=resolve('/Users/bao/taskbar-hero-cardrpg-a6/reports/cardrpg-c2/OUTBOX.md');
const supplyFile=process.argv.find(x=>x.startsWith('--supply='))?.slice(9);
const supply=supplyFile?JSON.parse(readFileSync(supplyFile,'utf8')):{rarePerActiveWeek:.4,epicPerActiveWeek:.08,source:'PROVISIONAL: C2 weekly supply not provided'};
for(const k of ['rarePerActiveWeek','epicPerActiveWeek'])assert(Number.isFinite(supply[k])&&supply[k]>=0&&supply[k]<=21,`Invalid ${k}`);
const c2Read=existsSync(source)?readFileSync(source,'utf8').includes('weekly'):'unavailable';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const mixes=[{name:'casual-heavy',shares:[.75,.2,.05,0],seed:43113},{name:'balanced',shares:[.45,.35,.2,0],seed:43114},{name:'farmer-heavy',shares:[.2,.2,.4,.2],seed:43115}];
function simulate(mix,{controlled=true,demand=1}={}){
  const random=rng(mix.seed),types=['casual','regular','farmer','bot'];
  const players=mix.shares.flatMap((share,t)=>Array.from({length:Math.round(share*1000)},()=>({type:types[t],hours:[3,10,30,70][t],requested:[6,12,12,12][t],balance:20,rewards:0,h:0,stock:0})));
  let emitted=0,burned=0,treasury=0,sealed=0,consumed=0,seasonE=0,seasonB=0,multiplier=1,sealBurn=0,saleBurn=0,cosmeticBurn=0;
  const grant=20*players.length,rows=[];
  for(let week=1;week<=52;week++){
    let weekE=0,weekB=0,activeHours=0,weekSealed=0,weekConsumed=0;
    for(const p of players){
      if(random()>.9)continue;
      p.h+=p.hours;activeHours+=p.hours;
      const reward=Math.floor(p.requested*multiplier*1000)/1000;
      p.balance+=reward;p.rewards+=reward;emitted+=reward;weekE+=reward;
      const spend=(amount,kind)=>{if(p.balance+1e-9<amount)return false;p.balance-=amount;burned+=amount;weekB+=amount;if(kind==='seal')sealBurn+=amount;else cosmeticBurn+=amount;return true;};
      // At most 21/week from 3/day; issuance isn't multiplied by hours or wallet wealth.
      let playerSeals=0;
      for(const [rate,fee] of [[supply.rarePerActiveWeek,2],[supply.epicPerActiveWeek,10]]){
        const desired=rate*demand;let n=Math.floor(desired)+(random()<desired%1?1:0);
        n=Math.min(21-playerSeals,n);
        for(let i=0;i<n;i++)if(spend(fee,'seal')){p.stock++;sealed++;weekSealed++;playerSeals++;}
      }
      // Optional, explicitly hypothetical cosmetic forge and seasonal pass demand.
      if(p.type!=='bot'&&random()<.35*demand&&p.stock>0&&spend(3,'cosmetic')){p.stock--;consumed++;weekConsumed++;}
      if(p.type!=='bot'&&random()<.3*demand)spend(2,'cosmetic');
    }
    // Secondary transfers conserve player funds; fees alone leave circulation.
    for(let i=0;i<players.length;i++){
      const seller=players[i],buyer=players[Math.floor(random()*players.length)];
      if(seller===buyer||seller.stock<1||random()>.2*demand||buyer.balance<20)continue;
      buyer.balance-=20;seller.balance+=19;seller.stock--;buyer.stock++;treasury+=.6;burned+=.4;saleBurn+=.4;weekB+=.4;
    }
    seasonE+=weekE;seasonB+=weekB;
    const balances=players.reduce((s,p)=>s+p.balance,0),playerTotal=players.reduce((s,p)=>s+p.rewards,0);
    assert(Math.abs(balances+treasury+burned-(grant+emitted))<.01,'Player flow must conserve YARN');
    assert(players.every(p=>p.balance>=-1e-8&&p.stock>=0),'No debt or negative items');
    assert.equal(players.reduce((s,p)=>s+p.stock,0),sealed-consumed,'Item stock must conserve');
    // Conservative schedule scenario: maximum unlocked external allocations, separately from player flow.
    const unlocked=50e6+15e6-grant+45e6*Math.min(week/26,1)+100e6*Math.min(week/208,1)+2.4e6*Math.floor(week/13)+(week>=26?20e6:0);
    const byType=Object.fromEntries(types.map(type=>{const group=players.filter(p=>p.type===type);return [type,group.reduce((s,p)=>s+p.rewards,0)/Math.max(1,group.reduce((s,p)=>s+p.h,0))];}));
    const top=[...players].sort((a,b)=>b.rewards-a.rewards).slice(0,10).reduce((s,p)=>s+p.rewards,0)/Math.max(1,playerTotal);
    assert(Math.abs((unlocked+balances+treasury)+(1e9-unlocked-grant-emitted)+burned-1e9)<.01,'Global supply must conserve, tester unlocks exclude the player grant');
    rows.push({week,multiplier,emission:weekE,burn:weekB,cumulativeEmission:emitted,cumulativeBurn:burned,inclusiveEmission:grant+emitted,burnEmission:burned/(grant+emitted),circulatingScenario:unlocked+balances+treasury,unlockedExternal:unlocked,totalSupply:1e9-burned,reserved:1e9-unlocked-grant-emitted,playerCirculating:balances,treasury,sealed,consumed,sealedStock:sealed-consumed,sealBurn,saleBurn,cosmeticBurn,yarnPerHour:emitted/players.reduce((s,p)=>s+p.h,0),farmerPerHour:byType.farmer,casualPerHour:byType.casual,botPerHour:byType.bot,topOnePercent:top});
    if(week%13===0){if(controlled&&seasonE>0&&seasonB/seasonE<.8)multiplier*=Math.min(.8,(seasonB/seasonE)/.8);seasonE=0;seasonB=0;}
  }
  return {name:mix.name,controlled,demand,rows};
}
const scenarios=mixes.map(m=>simulate(m)),raw=mixes.map(m=>simulate(m,{controlled:false})),stress=simulate(mixes[2],{demand:0});
for(const s of scenarios){const r=s.rows.at(-1);assert(r.cumulativeEmission<=2*r.cumulativeBurn,`${s.name}: routine flow fails`);assert(r.inclusiveEmission<=2*r.cumulativeBurn,`${s.name}: subsidy-inclusive flow fails`);assert(r.farmerPerHour<=3*r.casualPerHour,`${s.name}: farming advantage`);}
assert.equal(stress.rows[13].emission,0,'Zero demand must stop routine rewards after the first season');
for(const s of [...scenarios,...raw,stress]){const keys=Object.keys(s.rows[0]),name=`${s.name}-${s.demand===0?'zero-demand':s.controlled?'controlled':'uncontrolled'}`;writeFileSync(resolve(out,`token-${name}.csv`),keys.join(',')+'\n'+s.rows.map(r=>keys.map(k=>r[k]).join(',')).join('\n')+'\n');}
const data={supply,c2WeeklyTextFound:c2Read,scenarios,uncontrolled:raw,zeroDemand:stress};writeFileSync(resolve(out,'tokenomics.json'),JSON.stringify(data,null,2));
const colors=['#75dbd0','#faab72','#a99eff'];
function chart(field,title){const all=scenarios.flatMap(s=>s.rows.map(r=>r[field])),max=Math.max(...all,1),W=760,H=240;return `<section><h2>${title}</h2><svg role="img" aria-label="${title}" viewBox="0 0 820 290"><text x="0" y="20" fill="#bac6d6">${max.toLocaleString('en',{maximumFractionDigits:2})}</text><path d="M50 20V260H810" fill="none" stroke="#67758b"/>${scenarios.map((s,i)=>`<polyline fill="none" stroke="${colors[i]}" stroke-width="3" points="${s.rows.map((r,j)=>`${50+j*W/51},${260-r[field]/max*H}`).join(' ')}"/>`).join('')}<text x="50" y="282" fill="#bac6d6">week 1</text><text x="755" y="282" fill="#bac6d6">week 52</text></svg></section>`;}
const summary=scenarios.map(s=>{const r=s.rows.at(-1);return {mix:s.name,emissionBurn:r.inclusiveEmission/r.cumulativeBurn,farmerCasual:r.farmerPerHour/r.casualPerHour,top1:r.topOnePercent,sealedStock:r.sealedStock};});
writeFileSync(resolve(out,'tokenomics.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN · 52 weeks</title><style>body{background:#101b2b;color:#eef4ff;font:16px/1.6 system-ui;max-width:1000px;margin:40px auto;padding:0 24px}h1{font-size:44px}table{border-collapse:collapse;width:100%}td,th{padding:10px;border-bottom:1px solid #34435b;text-align:left}svg{width:100%}a{color:#75dbd0}section{border:1px solid #34435b;border-radius:16px;padding:20px;margin:20px 0}small{color:#bac6d6}</style><p>FUJI 43113 · Testnet — no real value</p><h1>A budget, not a price prediction.</h1><p>52 weeks · 1,000 accounts · fixed seeds · no growth. Provisional C2 supply: ${supply.rarePerActiveWeek} rare materials + ${supply.epicPerActiveWeek} Epic pieces per active account/week. Demand and cosmetics are assumptions; no claim of live calibration.</p><p>${scenarios.map((s,i)=>`<span style="color:${colors[i]}">● ${s.name}</span>`).join(' &nbsp; ')}</p><table><tr><th>Mix</th><th>Emission / burn¹</th><th>Farmer / casual per hour</th><th>Top 1%²</th></tr>${summary.map(s=>`<tr><td>${s.mix}</td><td>${s.emissionBurn.toFixed(2)}×</td><td>${s.farmerCasual.toFixed(2)}×</td><td>${(s.top1*100).toFixed(2)}%</td></tr>`).join('')}</table><small>¹ Includes the 20-YARN tester subsidy. ² Player reward share; excludes distributor and insiders.</small>${chart('circulatingScenario','Circulation with maximum scheduled external unlocks')}${chart('burnEmission','Cumulative burn / player emission, including grant')}${chart('yarnPerHour','YARN earned per active hour')}${chart('sealedStock','Sealed items remaining after hypothetical forge sinks')}<section><h2>Failure remains visible</h2><p>Without demand, rewards stop after week 13; the initial grant and first season still create an unfunded overhang. The zero-demand scenario fails sustainability. A controller limits damage; it cannot create buyers.</p><p>Uncontrolled cumulative routine emission/burn at week 52: ${raw.map(s=>`${s.name}: ${(s.rows.at(-1).cumulativeEmission/s.rows.at(-1).cumulativeBurn).toFixed(2)}×`).join('; ')}.</p></section><p>CSV and JSON alongside this page contain every week, separate seal/sale/cosmetic burns, treasury, stock, hours and external unlocks. <a href="../design/chain/TOKENOMICS.md">Design and limitations</a> · <a href="../design/chain/TOKENOMICS-RESEARCH.md">Sources</a>.</p></html>`);
const svg=chart('burnEmission','Burn / emission').match(/<svg[\s\S]*<\/svg>/)[0].replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" style="background:#101b2b" ');writeFileSync(resolve(out,'tokenomics.svg'),svg);
writeFileSync(resolve(root,'docs/design/chain/TOKENOMICS-VI.md'),`# YARN — Fuji, không có giá trị thật\n\n1 tỷ YARN, tạo đúng một lần; không có quyền in thêm. Tiền mềm nằm ngoài blockchain.\n\n| Phân bổ | % |\n|---|---:|\n| Người chơi / đội ngũ | 35 / 15 |\n| Kho bạc / nhà đầu tư | 12 / 12 |\n| Hệ sinh thái / thử nghiệm sớm | 10 / 6 |\n| Thanh khoản / cố vấn / dự phòng | 5 / 3 / 2 |\n\nKhông thưởng theo trận. Demo tặng 20 YARN; trần hợp đồng 32 YARN/người/tuần.\nPhí niêm phong 10% giá tham chiếu, đốt toàn bộ. Giá bán do người chơi chọn, không sàn/trần.\nPhí bán 5%: 2% giá bán vào đốt/sink, 3% kho bạc. AVAX sink không phải đốt YARN.\nVật phẩm on-chain không tăng sức mạnh; trang bị dùng mẫu có thể kiếm trong game.\nMục tiêu đốt/phát hành >=1 mỗi mùa; dưới0,8 giảm ngân sách mùa sau.\nVesting là chính sách dự kiến, chưa được khóa bởi hợp đồng phân phối genesis.\n\n![Đốt/phát hành qua 52 tuần](../../chain/tokenomics.svg)\n\nMô hình 52 tuần, 1.000 tài khoản, ba nhóm; nhóm nông dân có20% bot.\nTỷ lệ phát hành/đốt gồm trợ cấp: ${summary.map(s=>s.emissionBurn.toFixed(2)).join(' / ')}; đều <=2 theo giả định.\nNguồn cung C2 chưa có: dùng giả định ${supply.rarePerActiveWeek} nguyên liệu hiếm + ${supply.epicPerActiveWeek} Epic/tuần hoạt động.\nNhu cầu bằng0: mô hình thất bại, thưởng dừng sau mùa1; không cam kết thu nhập.\nNghị định147 hạn chế giao dịch vật phẩm; demo testnet không đồng nghĩa được phép kinh doanh.\n[Chi tiết, CSV và biểu đồ](../../chain/tokenomics.html) · [Nguồn nghiên cứu](TOKENOMICS-RESEARCH.md).\n`);
console.log(JSON.stringify({status:'PASS under disclosed assumptions',summary,zeroDemand:'FAIL sustainability; rewards stop after week13',supply}));
