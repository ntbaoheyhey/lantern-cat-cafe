import { loadRules } from '../cardrpg-sim/load.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const policy = process.env.BIG_ECONOMY_POLICY;
if (policy && !['auto', 'smart', 'random'].includes(policy)) throw Error('Unknown economy battle policy');
const output = process.env.BIG_ECONOMY_OUT || 'reports/cardrpg-depth/sim/economy-45.json';
const { load, vite, rules: legacy } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const { firstInvitation } = await load('packages/game-rules/src/cardrpg/depth/onboarding.ts');
const { playRun } = await load('packages/game-rules/src/cardrpg/depth/run-bot.ts');
const accounts = [], styles = [{ id: 'casual', runs: 1, service: 1, policy: 'auto' }, { id: 'regular', runs: 2, service: 2, policy: 'smart' }, { id: 'heavy', runs: 6, service: 2, policy: 'smart' }];
if (policy) for (const style of styles) style.policy = policy;
const paths = execFileSync('git', ['ls-files', 'packages/game-rules/src/cardrpg'], { encoding: 'utf8' }).trim().split('\n');
const sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path =>
  [path, createHash('sha256').update(await readFile(path)).digest('hex')])));
const average = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const totalPulls = state => Object.values(state.account.pity).reduce((sum, pity) => sum + pity.totalPulls, 0);
try {
  for (const style of styles) for (let index = 0; index < 30; index++) {
    let state = firstInvitation(R.createDepthAccount(3001 + index), 4).state;
    let firstEpic = null, firstLegendary = null, firstSet = null, saturation = null;
    const days = [];
    for (let day = 1; day <= 45; day++) {
      if (day > 1) state = R.metaCommand(state, { type: 'advanceLocalDay' }).state;
      state = R.metaCommand(state, { type: 'service', minutes: style.service * 10 }).state;
      for (let run = 0; run < style.runs; run++) {
        const chapter = Math.min(3, state.cleared.length + 1);
        state = R.startRun(state, chapter, 100000 + index * 7919 + day * 71 + run, 'campaign').state;
        state = playRun(state, style.policy);
      }
      for (const quest of legacy.QUESTS) state = R.metaCommand(state, { type: 'claimQuest', questId: quest.id }).state;
      while (state.account.currencies.stamps >= 150) {
        const drawn = R.metaCommand(state, { type: 'pull', bannerId: 'standard', seed: index * 9349 + day * 97 + totalPulls(state) });
        if (!drawn.ok) break;
        state = drawn.state;
      }
      for (const id of state.team) {
        const owned = state.account.cards.find(c => c.cardId === id);
        if (owned.level < 12) state = R.metaCommand(state, { type: 'level', cardId: owned.id }).state;
        state = R.metaCommand(state, { type: 'ascend', cardId: owned.id }).state;
        for (const slot of ['weapon', 'outfit', 'charm', 'relic']) {
          const usedElsewhere = new Set(Object.entries(state.equipment).filter(([cat]) => cat !== id).flatMap(([, equipped]) => Object.values(equipped)));
          const best = state.gear.filter(g => R.GEAR_BY_ID[g.templateId].slot === slot && !usedElsewhere.has(g.id))
            .sort((a, b) => R.GEAR_BY_ID[b.templateId].value * (1 + b.enhancement * .06) - R.GEAR_BY_ID[a.templateId].value * (1 + a.enhancement * .06))[0];
          if (best) state = R.equipGear(state, id, best.id).state;
        }
        if (owned.level >= 10 && owned.stars >= 2) state = R.awakenCat(state, id).state;
      }
      const counts = {};
      for (const gear of state.gear) {
        const template = R.GEAR_BY_ID[gear.templateId];
        if (template.rarity === 'epic' && firstEpic === null) firstEpic = day;
        if (template.rarity === 'legendary' && firstLegendary === null) firstLegendary = day;
        (counts[template.setId] ??= new Set()).add(template.slot);
      }
      if (firstSet === null && Object.values(counts).some(set => set.size === 4)) firstSet = day;
      if (saturation === null && state.account.cards.length === 12) saturation = day;
      // Spend spare materials through actual repeated sinks, retaining one chosen build per cat.
      const equipped = Object.values(state.equipment).flatMap(items => Object.values(items));
      for (const id of equipped) state = R.enhanceGear(state, id).state;
      const tailored = R.craftGear(state, 'bellsteel-relic-epic');
      if (tailored.ok) state = tailored.state;
      days.push({ day, cards: state.account.cards.length, gearTemplates: new Set(state.gear.map(g => g.templateId)).size,
        currencies: { ...state.account.currencies }, earned: { ...state.account.daily.earned }, materials: state.materials,
        totalPulls: totalPulls(state), gear: state.gear.length, seals: state.seals, clear: state.cleared.length,
        awakening: Object.values(state.awakened).reduce((a, b) => a + b, 0) });
    }
    accounts.push({ style: style.id, index, firstEpic, firstLegendary, firstSet, saturation, days });
    if (index === 29) console.log(`${style.id} complete`);
  }
  const summary = styles.map(style => {
    const cohort = accounts.filter(a => a.style === style.id);
    const at = day => cohort.map(a => a.days[day - 1]);
    return { style: style.id, firstEpicMean: average(cohort.map(a => a.firstEpic ?? 46)), firstLegendaryMean: average(cohort.map(a => a.firstLegendary ?? 46)), firstSetMean: average(cohort.map(a => a.firstSet ?? 46)),
      saturatedBy30: cohort.filter(a => a.saturation !== null && a.saturation <= 30).length,
      saturatedBy45: cohort.filter(a => a.saturation !== null).length,
      checkpoints: [8, 30, 45].map(day => ({ day, cardPercent: average(at(day).map(a => a.cards / 12 * 100)), gearPercent: average(at(day).map(a => a.gearTemplates / R.GEAR.length * 100)),
        pulls: average(at(day).map(a => a.totalPulls)), materials: average(at(day).map(a => a.materials)), seals: average(at(day).map(a => a.seals)), awakening: average(at(day).map(a => a.awakening)),
        balances: Object.fromEntries(['fish', 'threads', 'stamps', 'essence'].map(id => [id, average(at(day).map(a => a.currencies[id]))])) })) };
  });
  const weekly = [];
  for (let week = 0; week < 6; week++) {
    const start = week * 7, end = start + 7;
    const values = styles.map(style => {
      const cohort = accounts.filter(a => a.style === style.id);
      return { style: style.id, draws: average(cohort.map(a => a.days[end - 1].totalPulls - (start ? a.days[start - 1].totalPulls : 1))),
        earned: Object.fromEntries(['fish', 'threads', 'stamps', 'essence'].map(id => [id, average(cohort.map(a => a.days.slice(start, end).reduce((sum, day) => sum + day.earned[id], 0)))])) };
    });
    weekly.push({ week: week + 1, values, heavyCasual: Object.fromEntries(['draws', 'fish', 'threads', 'stamps', 'essence'].map(id => [id, id === 'draws' ? values[2].draws / values[0].draws : values[2].earned[id] / values[0].earned[id]])) });
  }
  const totals = styles.map(style => {
    const cohort = accounts.filter(account => account.style === style.id);
    return { style: style.id,
      pulls: average(cohort.map(account => account.days.at(-1).totalPulls - 1)),
      earned: Object.fromEntries(['fish', 'threads', 'stamps', 'essence'].map(id => [id,
        average(cohort.map(account => account.days.reduce((sum, day) => sum + day.earned[id], 0)))])) };
  });
  const heavyCasual45 = { pulls: totals[2].pulls / totals[0].pulls,
    ...Object.fromEntries(['fish', 'threads', 'stamps', 'essence'].map(id => [id, totals[2].earned[id] / totals[0].earned[id]])) };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ method: '90 accounts, 30 per style, 45 days. Actual pure run, draw, daily-cap, enhancement, tailoring and awakening commands. Policies and daily runs are recorded in styles. No live grants. Missing first-drop milestones are censored at day 46. Total earned ratios include all45 days and exclude opening balances. Paid pulls exclude the one welcome invitation.', styles, sourceHashes, summary, weekly, totals, heavyCasual45, accounts }, null, 2));
  console.log(JSON.stringify({ summary, weekly, totals, heavyCasual45 }, null, 2));
} finally { await vite.close(); }
