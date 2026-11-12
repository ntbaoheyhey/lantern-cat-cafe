// Deterministic sensitivity analysis, not a demand forecast. No network or credentials.
import {mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

export const UNIT = 10n ** 18n;
const GENESIS = 1_000_000_000n * UNIT;
const THRESHOLD = 8n * UNIT / 10n;
const TYPES = ['casual', 'regular', 'farmer', 'bot'];
const root = fileURLToPath(new URL('../../', import.meta.url));
export const mixes = [
  {name: 'casual-heavy', shares: [.75, .2, .05, 0], seed: 43113},
  {name: 'balanced', shares: [.45, .35, .2, 0], seed: 43114},
  {name: 'farmer-heavy', shares: [.2, .2, .4, .2], seed: 43115},
];
export const provisionalSupply = {
  rarePerActiveWeek: .4, epicPerActiveWeek: .08,
  source: 'PROVISIONAL: C2 has not supplied weekly campaign issuance',
};
export function validateSupply(supply) {
  for (const key of ['rarePerActiveWeek', 'epicPerActiveWeek']) {
    assert(Number.isFinite(supply[key]) && supply[key] >= 0 && supply[key] <= 21, `Invalid ${key}`);
  }
  assert(typeof supply.source === 'string' && supply.source.trim(), 'Supply provenance required');
  return supply;
}
const min = (a, b) => a < b ? a : b;
const units = n => Number(n) / Number(UNIT);
const ratio = (a, b) => b === 0 ? null : a / b;
const rng = seed => () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32;};

// Integer operations match SeasonRewards._nextMultiplier (including order of floors).
export function nextMultiplier(previous, emission, burned) {
  if (emission === 0n) return previous;
  const health = burned * UNIT / emission;
  if (health >= THRESHOLD) return previous;
  return previous * min(THRESHOLD, health * UNIT / THRESHOLD) / UNIT;
}
export const routineBudget = multiplier => 12n * UNIT * multiplier / UNIT;

export function simulate(mix, {
  profile = 'implemented-sinks', controlled = true, demand = 1, paidMarketShare = 1,
  supply = provisionalSupply,
} = {}) {
  validateSupply(supply);
  assert(['demo', 'implemented-sinks', 'roadmap'].includes(profile), 'Invalid profile');
  assert(demand >= 0 && demand <= 1 && paidMarketShare >= 0 && paidMarketShare <= 1, 'Invalid demand');
  assert.equal(mix.shares.length, 4);
  assert(Math.abs(mix.shares.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  const random = rng(mix.seed);
  const players = mix.shares.flatMap((share, type) => Array.from({length: Math.round(share * 1000)}, () => ({
    type: TYPES[type], hours: [3, 10, 30, 70][type], requested: BigInt([6, 12, 12, 12][type]) * UNIT,
    balance: 20n * UNIT, rewards: 20n * UNIT, routine: 0n, h: 0, stock: 0,
    // Demo cohort assumes all signed up and completed the fixed boss: 2 pass Relics + 1 boss Relic.
    relics: profile === 'demo' ? 3 : 0, material: profile === 'demo' ? 1 : 0,
  })));
  const buyers = players.filter(p => p.type !== 'bot'); // Bots supply; no invented cosmetic buyer utility.
  const grant = BigInt(players.length) * 20n * UNIT;
  let emitted = 0n, burned = 0n, treasury = 0n, seasonE = 0n, seasonB = 0n, multiplier = UNIT;
  let sealed = 0, consumed = 0, sealBurn = 0n, saleBurn = 0n, cosmeticBurn = 0n, trades = 0;
  const rows = [];
  for (let week = 1; week <= 52; week++) {
    let weekE = 0n, weekB = 0n;
    for (const p of players) {
      if (random() > .9) continue;
      p.h += p.hours;
      // The contract caps claims. It does not multiply every requested entitlement by the policy.
      const reward = profile === 'demo' ? 0n : min(p.requested, routineBudget(multiplier));
      p.balance += reward; p.rewards += reward; p.routine += reward; emitted += reward; weekE += reward;
      const spend = (amount, kind) => {
        if (p.balance < amount) return false;
        p.balance -= amount; burned += amount; weekB += amount;
        if (kind === 'seal') sealBurn += amount; else cosmeticBurn += amount;
        return true;
      };
      let playerSeals = 0;
      const rates = profile === 'demo' ? [[p.material, 2n * UNIT]] : [
        [supply.rarePerActiveWeek, 2n * UNIT], [supply.epicPerActiveWeek, 10n * UNIT],
      ];
      for (const [rate, fee] of rates) {
        const desired = rate * demand;
        const count = Math.min(21 - playerSeals, Math.floor(desired) + (random() < desired % 1 ? 1 : 0));
        for (let i = 0; i < count; i++) if (spend(fee, 'seal')) {
          p.stock++; sealed++; playerSeals++;
          if (profile === 'demo') p.material--;
        }
      }
      // These sinks do not exist in the live game. Only the explicitly labelled roadmap uses them.
      const forgeDraw = random(), cosmeticDraw = random();
      if (profile === 'roadmap' && p.type !== 'bot') {
        if (forgeDraw < .35 * demand && p.stock > 0 && spend(3n * UNIT, 'cosmetic')) {p.stock--; consumed++;}
        if (cosmeticDraw < .3 * demand) spend(2n * UNIT, 'cosmetic');
      }
    }
    // Price 20 is a scenario assumption, never a floor. AVAX transfers do not burn YARN.
    for (const seller of players) {
      const buyer = buyers[Math.floor(random() * buyers.length)];
      const tradeDraw = random(), venueDraw = random();
      if (!buyer || seller === buyer || seller.stock + seller.relics < 1 || tradeDraw > .2 * demand || buyer.balance < 20n * UNIT) continue;
      const fee = venueDraw < paidMarketShare ? UNIT : 0n;
      const burn = fee * 4000n / 10000n;
      buyer.balance -= 20n * UNIT; seller.balance += 20n * UNIT - fee;
      if (seller.stock) {seller.stock--; buyer.stock++;} else {seller.relics--; buyer.relics++;}
      treasury += fee - burn; burned += burn; saleBurn += burn; weekB += burn; trades++;
    }
    const weeklyGrant = week === 1 ? grant : 0n;
    seasonE += weekE + weeklyGrant; seasonB += weekB;
    const balances = players.reduce((s, p) => s + p.balance, 0n);
    assert.equal(balances + treasury + burned, grant + emitted, 'Player YARN conservation');
    assert(players.every(p => p.balance >= 0n && p.stock >= 0 && p.material >= 0), 'No negative balances');
    assert.equal(players.reduce((s, p) => s + p.stock, 0), sealed - consumed, 'Sealed item conservation');
    assert.equal(players.reduce((s, p) => s + p.relics, 0), profile === 'demo' ? 3 * players.length : 0, 'Relic conservation');
    // Hypothetical maximum allocation unlocks, not measured circulation or contract-enforced vesting.
    const external = 65_000_000n * UNIT - grant + 45_000_000n * UNIT * BigInt(Math.min(week, 26)) / 26n
      + 100_000_000n * UNIT * BigInt(week) / 208n + 2_400_000n * UNIT * BigInt(Math.floor(week / 13))
      + (week >= 26 ? 20_000_000n * UNIT : 0n);
    const reserved = GENESIS - external - grant - emitted;
    assert(reserved >= 0n, 'Reserved allocation must remain funded');
    assert.equal(external + balances + treasury + reserved + burned, GENESIS, 'Global YARN conservation');
    const perHour = Object.fromEntries(TYPES.map(type => {
      const group = players.filter(p => p.type === type), hours = group.reduce((s, p) => s + p.h, 0);
      return [type, hours ? units(group.reduce((s, p) => s + p.routine, 0n)) / hours : 0];
    }));
    const top = [...players].sort((a, b) => a.rewards === b.rewards ? 0 : a.rewards > b.rewards ? -1 : 1)
      .slice(0, Math.ceil(players.length / 100)).reduce((s, p) => s + p.rewards, 0n);
    const botRewards = players.filter(p => p.type === 'bot').reduce((s, p) => s + p.rewards, 0n);
    rows.push({week, multiplier: units(multiplier), routineBudget: units(routineBudget(multiplier)),
      emission: units(weekE), burn: units(weekB), testerEmission: units(weeklyGrant), seasonEmission: units(seasonE), seasonBurn: units(seasonB),
      cumulativeEmission: units(emitted), cumulativeBurn: units(burned), inclusiveEmission: units(grant + emitted),
      burnEmission: Number(burned) / Number(grant + emitted), circulatingScenario: units(external + balances + treasury),
      unlockedExternal: units(external), totalSupply: units(GENESIS - burned), reserved: units(reserved),
      playerCirculating: units(balances), treasury: units(treasury), sealed, consumed, sealedStock: sealed - consumed,
      freeRelics: profile === 'demo' ? players.length * 3 : 0, sealBurn: units(sealBurn), saleBurn: units(saleBurn),
      cosmeticBurn: units(cosmeticBurn), trades, yarnPerHour: units(emitted) / players.reduce((s, p) => s + p.h, 0),
      farmerPerHour: perHour.farmer, casualPerHour: perHour.casual, botPerHour: perHour.bot,
      topOnePercent: Number(top) / Number(grant + emitted), botRewardShare: Number(botRewards) / Number(grant + emitted)});
    if (week % 13 === 0) {
      if (controlled) multiplier = nextMultiplier(multiplier, seasonE, seasonB);
      seasonE = 0n; seasonB = 0n;
    }
  }
  return {name: mix.name, profile, controlled, demand, paidMarketShare, rows};
}

export function summarize(s) {
  const r = s.rows.at(-1);
  return {mix: s.name, profile: s.profile, demand: s.demand, paidMarketShare: s.paidMarketShare,
    emissionBurn: ratio(r.inclusiveEmission, r.cumulativeBurn), routineEmissionBurn: ratio(r.cumulativeEmission, r.cumulativeBurn),
    farmerCasual: ratio(r.farmerPerHour, r.casualPerHour), top1: r.topOnePercent, botShare: r.botRewardShare,
    sealedStock: r.sealedStock, finalWeeklyCap: r.routineBudget,
    flowPass: r.inclusiveEmission <= 2 * r.cumulativeBurn,
    farmingPass: r.farmerPerHour <= 3 * r.casualPerHour};
}

const escape = text => String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = (n, suffix = '') => n === null ? 'n/a (zero denominator)' : n.toFixed(2) + suffix;
const colors = ['#75dbd0', '#faab72', '#a99eff'];
function chart(scenarios, field, title, target) {
  const max = Math.max(...scenarios.flatMap(s => s.rows.map(r => r[field])), target || 0, .01);
  return `<section><h2>${title}</h2><svg role="img" aria-label="${title}" viewBox="0 0 840 300"><text x="0" y="20" fill="#bac6d6">${max.toLocaleString('en', {maximumFractionDigits: 2})}</text><path d="M60 30V260H810" fill="none" stroke="#67758b"/>${target ? `<path d="M60 ${260 - target / max * 220}H810" stroke="#e8c562" stroke-dasharray="6 6"/><text x="65" y="${252 - target / max * 220}" fill="#e8c562">minimum ${target}</text>` : ''}${scenarios.map((s, i) => `<polyline fill="none" stroke="${colors[i]}" stroke-width="3" points="${s.rows.map((r, j) => `${60 + j * 750 / 51},${260 - r[field] / max * 220}`).join(' ')}"/>`).join('')}<text x="60" y="285" fill="#bac6d6">week 1</text><text x="755" y="285" fill="#bac6d6">week 52</text></svg></section>`;
}

function main() {
  const supplyPath = process.argv.find(x => x.startsWith('--supply='))?.slice(9);
  const supply = validateSupply(supplyPath ? JSON.parse(readFileSync(supplyPath, 'utf8')) : provisionalSupply);
  const out = resolve(root, 'docs/chain'); mkdirSync(out, {recursive: true});
  const scenarios = mixes.map(m => simulate(m, {supply}));
  const demo = mixes.map(m => simulate(m, {supply, profile: 'demo'}));
  const roadmap = mixes.map(m => simulate(m, {supply, profile: 'roadmap'}));
  const uncontrolled = mixes.map(m => simulate(m, {supply, controlled: false}));
  const stress = [
    simulate({...mixes[2], name: 'low-demand'}, {supply, demand: .1}),
    simulate({...mixes[2], name: 'zero-demand'}, {supply, demand: 0}),
    simulate({name: 'half-bots', shares: [.2, .1, .2, .5], seed: 43116}, {supply}),
    simulate({...mixes[2], name: 'fee-bypass'}, {supply, paidMarketShare: .2}),
  ];
  const all = [...scenarios, ...demo, ...roadmap, ...uncontrolled, ...stress];
  const summary = all.map(summarize);
  const acceptance = scenarios.every(s => {const r = summarize(s); return r.flowPass && r.farmingPass;});
  const data = {modelVersion: 2, supply, assumptions: {
    cohort: '1000 pre-enrolled accounts; one 20-YARN tester grant each; no growth or attrition',
    demo: 'One Star Thread and three free Relics after fixed boss/pass, no routine reward or future sinks',
    implementedSinks: 'Counterfactual recurring C2 supply/routine issuer; only existing seal and YARN sale burns',
    roadmap: 'Counterfactual plus unshipped forge and cosmetic sinks; not acceptance evidence',
    demand: '90% weekly activity; seal uptake rate*demand; 20% trade chance*demand; price 20 YARN; non-bot buyers only',
    policy: 'SeasonRewards integer arithmetic; all claims incl tester grants; routine min(entitlement, weekly cap)',
    unlocks: 'Maximum hypothetical external unlocks, not deployed vesting or observed circulation',
    funding: 'Allocation envelope, not the live 9960-YARN reward pool; demo cohort alone needs 20000 YARN',
    scarcity: '21 seals/week approximates 3/day; does not simulate daily scheduling or stock valuation',
    adversary: 'Bots are wallets, not verified humans; correlated wallet ownership is unmeasured',
  }, acceptance: {standardImplementedSinksPass: acceptance, economicStatus: acceptance ? 'PASS UNDER ASSUMPTIONS ONLY' : 'NOT MET', integrity: 'PASS'},
  summary, scenarios, demo, roadmap, uncontrolled, stress};
  for (const s of all) {
    const keys = Object.keys(s.rows[0]);
    const name = `${s.name}-${s.profile}-${s.controlled ? 'controlled' : 'uncontrolled'}`;
    writeFileSync(resolve(out, `token-${name}.csv`), keys.join(',') + '\n' + s.rows.map(r => keys.map(k => r[k]).join(',')).join('\n') + '\n');
  }
  writeFileSync(resolve(out, 'tokenomics.json'), JSON.stringify(data, null, 2) + '\n');
  const table = list => `<div class="table"><table><thead><tr><th>Mix</th><th>Emission / burn¹</th><th>Farmer / casual per hour²</th><th>Bot reward share</th><th>Flow gate</th></tr></thead><tbody>${list.map(s => {const r = summarize(s); return `<tr><td>${escape(s.name)}</td><td>${fmt(r.emissionBurn, '×')}</td><td>${fmt(r.farmerCasual, '×')}</td><td>${fmt(r.botShare * 100, '%')}</td><td>${r.flowPass ? 'PASS assumptions' : 'NOT MET'}</td></tr>`;}).join('')}</tbody></table></div>`;
  const legend = `<p>${mixes.map((s, i) => `<span style="color:${colors[i]}">● ${s.name}</span>`).join(' &nbsp; ')}</p>`;
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN · evidence and 52-week stress tests</title><style>body{background:#101b2b;color:#eef4ff;font:16px/1.6 system-ui;max-width:1080px;margin:40px auto;padding:0 24px}h1{font-size:clamp(28px,5vw,44px);line-height:1.2}h2{line-height:1.3}table{border-collapse:collapse;width:100%;min-width:650px}td,th{padding:10px;border-bottom:1px solid #34435b;text-align:left}.table{overflow:auto}svg{width:100%;height:auto}a{color:#75dbd0}section{border:1px solid #34435b;border-radius:16px;padding:20px;margin:20px 0}small{color:#bac6d6}.status{color:#ffd29a;font-weight:700}</style><p>FUJI 43113 · Testnet — no real value</p><h1>The demo works. Sustainable demand is unproven.</h1><p class="status">Current-sink economic acceptance: ${data.acceptance.economicStatus}. Model accounting checks: PASS.</p><p>52 weeks · 1,000 pre-enrolled accounts · fixed seeds · no growth. Routine issuance and C2 campaign supply are not shipped. This cohort needs 20,000 YARN for tester grants alone; it is not a forecast for the live reward pool.</p><section><h2>1. Current judge demo only</h2><p>One 20-YARN grant, one Star Thread and three free Relics per account after the starter pass/boss. No recurring reward, Epic issuance, forge or cosmetic burn. Repeated sales still assume buyers; no measured retention or liquidity.</p>${table(demo)}</section><section><h2>2. Proposed routine rewards, implemented sinks</h2><p>Only sealing and YARN market fees burn. Campaign supply is provisional: ${supply.rarePerActiveWeek} rare + ${supply.epicPerActiveWeek} Epic per active account/week. Provenance: ${escape(supply.source)}. A 20-YARN sale price and uptake are hypotheses; players can use any price or a fee-free venue.</p>${table(scenarios)}</section><small>¹ All reward claims, including initial grants; not gross token minting. Zero burn is undefined, never a hidden pass. ² Routine reward/hour. Top 1% in CSV/JSON is account reward share including grants, not human ownership concentration.</small>${legend}${chart(scenarios, 'burnEmission', 'Implemented sinks: cumulative burn / all claims', .5)}${chart(scenarios, 'routineBudget', 'Deployed policy: maximum routine YARN per account/week')}${chart(scenarios, 'sealedStock', 'Sealed inventory: no deployed item sink')}${chart(scenarios, 'circulatingScenario', 'Hypothetical maximum unlocks, not measured circulation')}<section><h2>3. Unshipped roadmap sensitivity</h2><p>Add optional forge (3 YARN + one sealed item) and cosmetics (2 YARN). These burns must not be counted as current demand. Passing this table would not close the implementation or calibration gap.</p>${table(roadmap)}</section><section><h2>4. Failure and abuse cases</h2><p>Low demand is 10% of assumed uptake; half-bots has 50% bot wallets; fee-bypass routes 80% of trades away from V2 fees. Bots can earn/hoard but are not invented cosmetic buyers. Zero-demand stops routine rewards after week 13, while new tester grants remain possible in the actual contract. Wallet caps do not cap rewards per human.</p>${table(stress)}<p>Without policy reductions, routine emission/burn: ${uncontrolled.map(s => `${s.name}: ${fmt(summarize(s).routineEmissionBurn, '×')}`).join('; ')}.</p></section><p>Integer wei accounting matches the deployed reduction formula; the first season includes tester grants. The policy can reduce rewards but cannot create buyers. Distributor burns count on chain, so burn ratios alone do not prove organic demand. Budget reaches zero permanently unless contracts change; a 0.8 healthy boundary does not guarantee the 1.0 target.</p><p><a href="tokenomics.json">All weekly data and assumptions</a> · <a href="../design/chain/TOKENOMICS.md">Design</a> · <a href="../design/chain/TOKENOMICS-RESEARCH.md">Research</a> · <a href="../../reports/chain/TOKENOMICS-AUDIT.md">Audit and decisions</a></p></html>`;
  writeFileSync(resolve(out, 'tokenomics.html'), html);
  writeFileSync(resolve(out, 'tokenomics.svg'), chart(scenarios, 'burnEmission', 'Implemented sinks: burn / all claims', .5).match(/<svg[\s\S]*<\/svg>/)[0].replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" style="background:#101b2b" '));
  writeFileSync(resolve(root, 'docs/design/chain/TOKENOMICS-VI.md'), `# YARN — Fuji, không có giá trị thật\n\n1 tỷ YARN tạo một lần; tiền mềm nằm ngoài blockchain.\n\n| Phân bổ | % |\n|---|---:|\n| Người chơi / đội ngũ | 35 / 15 |\n| Kho bạc / nhà đầu tư | 12 / 12 |\n| Hệ sinh thái / thử nghiệm sớm | 10 / 6 |\n| Thanh khoản / cố vấn / dự phòng | 5 / 3 / 2 |\n\nDemo đã chạy trên Fuji: tặng 20 YARN một lần; chưa phát thưởng chiến dịch định kỳ.\nPhí seal 10% giá tham chiếu, đốt toàn bộ; Star Thread tốn 2 YARN.\nPhí bán 5%: 2% giá bán đốt, 3% kho bạc. AVAX không tính là đốt YARN.\nGiá bán tự chọn, không sàn/trần. V1/chuyển trực tiếp có thể bỏ qua phí V2.\nHợp đồng tự giảm trần thưởng mùa sau nếu đốt/phát hành dưới 0,8; tính cả trợ cấp.\nTrần ban đầu 12 YARN định kỳ/tuần, tổng 32 gồm trợ cấp; chưa có nguồn ký thưởng định kỳ.\nVesting là lịch dự kiến, chưa được khóa bởi hợp đồng phân phối.\n\n![Đốt/phát hành với nguồn đốt đã có](../../chain/tokenomics.svg)\n\nBa nhóm 1.000 ví, 52 tuần; nhóm nhiều người farm có 20% bot.\nChỉ nguồn đốt đã có: phát hành/đốt ${scenarios.map(s => fmt(summarize(s).emissionBurn)).join(' / ')}; ngưỡng <=2: ${acceptance ? 'đạt theo giả định' : 'CHƯA ĐẠT'}.\nForge/mỹ phẩm chưa triển khai được tách sang kịch bản riêng.\nNguồn C2 ${supply.rarePerActiveWeek}/${supply.epicPerActiveWeek} và nhu cầu là giả định; chưa hiệu chỉnh từ người chơi.\nÍt người mua, 50% bot và bỏ qua phí đều được kiểm tra; không có cam kết thu nhập.\n1.000 trợ cấp cần 20.000 YARN, không phải dự báo cho quỹ demo hiện có.\n[CSV, biểu đồ và giới hạn](../../chain/tokenomics.html) · [Nguồn nghiên cứu](TOKENOMICS-RESEARCH.md).\n`);
  console.log(JSON.stringify({integrity: 'PASS', economicAcceptance: data.acceptance.economicStatus, standard: scenarios.map(summarize), stress: stress.map(summarize)}, null, 2));
  if (process.argv.includes('--require-sustainability') && !acceptance) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
