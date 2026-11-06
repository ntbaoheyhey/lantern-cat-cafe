import { loadRules } from '../cardrpg-sim/load.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const phase = process.argv[2] || 'before';
if (!/^[a-z0-9-]+$/.test(phase)) throw Error('Use a simple phase name');
const count = Number(process.env.BIG_SEEDS || 50);
const offset = Number(process.env.BIG_OFFSET || 0);
const scope = process.env.BIG_SCOPE || 'all';
if (!['all', 'tiers', 'power'].includes(scope)) throw Error('BIG_SCOPE must be all, tiers or power');
const { load, vite, rules: legacy } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const { playRun } = await load('packages/game-rules/src/cardrpg/depth/run-bot.ts');
const mainScale = Number(process.env.BIG_MAIN_SCALE || 1);
if (!(mainScale > 0 && mainScale <= 1)) throw Error('BIG_MAIN_SCALE must be in (0, 1]');
const affixScale = Number(process.env.BIG_AFFIX_SCALE || 1);
if (!(affixScale > 0 && affixScale <= 1)) throw Error('BIG_AFFIX_SCALE must be in (0, 1]');
const affixValues = R.AFFIXES.map(affix => ({ id: affix.id, before: affix.tiers,
  after: affix.tiers.map(range => range.map(value => Math.max(1, Math.round(value * affixScale)))) }));
for (const [index, affix] of R.AFFIXES.entries()) affix.tiers = affixValues[index].after;
const templateValues = R.GEAR.map(template => ({ id: template.id, before: template.value,
  after: Math.max(1, Math.round(template.value * mainScale)) }));
// A tuning-only override of existing main-stat knobs. Every value is retained
// in the receipt, and production source remains unchanged by this driver.
for (const [index, template] of R.GEAR.entries()) template.value = templateValues[index].after;
const power = state => state.team.reduce((total, id) => {
  const stats = R.depthStats(state, id);
  return total + Math.round(stats.hp / 5 + stats.attack * 2 + stats.defense * 1.5);
}, 0);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const paths = execFileSync('git', ['ls-files', 'packages/game-rules/src/cardrpg'], { encoding: 'utf8' }).trim().split('\n');
const sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, createHash('sha256').update(await readFile(path)).digest('hex')])));
const tiers = ['none', ...legacy.RARITY_ORDER];
const thematic = { guardian: 'hearthloom', witch: 'moonwick', alchemist: 'mossbrew' };
const fixture = (seed, level, rarity, setId, team = ['mochi', 'soot', 'clover']) => {
  const state = R.createDepthAccount(seed);
  state.account.cards = legacy.CARDS.map(card => ({ id: card.id, cardId: card.id, level, stars: 1, shards: 0, soulbound: true }));
  state.team = [...team];
  state.gear = [];
  state.equipment = {};
  state.cleared = [1, 2];
  state.account.chapter = 3;
  for (const id of team) {
    const cat = R.CAT_BY_ID[id];
    state.rows[id] = cat.row;
    state.skills[id] = R.availableSkills(state, id).map(skill => skill.id);
    if (rarity === 'none') continue;
    state.equipment[id] = {};
    for (const slot of legacy.EQUIPMENT_SLOTS) {
      const item = R.makeGear(state, `${setId || thematic[legacy.CARD_BY_ID[id].role]}-${slot}-${rarity}`, seed + legacy.EQUIPMENT_SLOTS.indexOf(slot) * 7919);
      state.gear.push(item);
      state.equipment[id][slot] = item.id;
    }
  }
  if (!team.some(id => state.rows[id] === 'front')) state.rows[team[0]] = 'front';
  return state;
};
const rows = [], sets = [], teams = [], singleItems = [], powerBounds = [];
try {
  if (scope !== 'power') for (const level of [1, 6]) for (const chapter of [1, 2, 3]) for (const rarity of tiers) {
    const runs = [];
    for (let index = 1; index <= count; index++) {
      const seed = offset + index;
      const initial = fixture(seed, level, rarity);
      const begin = R.startRun(initial, chapter, seed);
      if (!begin.ok) throw Error(begin.error);
      const encounters = [];
      const end = playRun(begin.state, 'auto', battle => encounters.push({ won: battle.result === 'party',
        actions: battle.choices.length, rounds: battle.round, logHash: hash(battle.log) }));
      runs.push({ seed, won: end.run.won, power: power(initial), encounters });
    }
    const row = { level, chapter, rarity, count, wins: runs.filter(run => run.won).length, runs };
    rows.push(row);
    console.log(JSON.stringify({ ...row, runs: undefined }));
  }
  if (scope === 'all') for (const level of [1, 6]) for (const chapter of [1, 2, 3]) for (const set of R.SETS) {
    const runs = [];
    for (let index = 1; index <= count; index++) {
      const seed = offset + index;
      const initial = fixture(seed, level, 'epic', set.id);
      const begin = R.startRun(initial, chapter, seed);
      if (!begin.ok) throw Error(begin.error);
      const end = playRun(begin.state, 'auto');
      runs.push({ seed, won: end.run.won, power: power(initial), runHash: hash(end.run) });
    }
    sets.push({ chapter, setId: set.id, level, rarity: 'epic', count, wins: runs.filter(run => run.won).length, runs });
  }
  if (scope === 'all') for (let first = 0; first < R.CATS.length - 2; first++) {
    for (let second = first + 1; second < R.CATS.length - 1; second++) {
      for (let third = second + 1; third < R.CATS.length; third++) {
        const team = [R.CATS[first].id, R.CATS[second].id, R.CATS[third].id];
        for (const chapter of [1, 2, 3]) {
          const runs = [];
          for (let index = 1; index <= 20; index++) {
            const seed = offset + 50000 + index;
            const state = fixture(seed, 6, 'none', null, team);
            const battle = R.playBattle(R.createBattle({ seed, chapter, cats: R.battleCats(state), enemies: [R.CHAPTERS[chapter - 1].boss] }), 'auto');
            runs.push({ seed, won: battle.result === 'party', actions: battle.choices.length, logHash: hash(battle.log) });
          }
          teams.push({ team, chapter, count: runs.length, wins: runs.filter(run => run.won).length, runs });
        }
      }
    }
  }
  if (scope === 'all') for (const template of R.GEAR.filter(item => item.rarity === 'legendary')) for (const cardId of ['mochi', 'soot', 'clover']) {
    const state = fixture(offset + 101, 1, 'none');
    const before = power(state);
    const item = R.makeGear(state, template.id, offset + 101);
    state.gear.push(item);
    state.equipment[cardId] = { [template.slot]: item.id };
    const after = power(state);
    const outcomes = [];
    for (const level of [1, 6]) for (const chapter of [1, 2, 3]) {
      const runs = [];
      for (let index = 1; index <= count; index++) {
        const seed = offset + index;
        const baseline = fixture(seed, level, 'none');
        const improved = structuredClone(baseline);
        const piece = R.makeGear(improved, template.id, seed);
        improved.gear.push(piece);
        improved.equipment[cardId] = { [template.slot]: piece.id };
        const results = [baseline, improved].map(account => {
          const battle = R.playBattle(R.createBattle({ seed, chapter, cats: R.battleCats(account),
            enemies: [R.CHAPTERS[chapter - 1].boss] }), 'auto');
          return { won: battle.result === 'party', actions: battle.choices.length, logHash: hash(battle.log) };
        });
        runs.push({ seed, before: results[0], after: results[1] });
      }
      outcomes.push({ level, chapter, count, beforeWins: runs.filter(run => run.before.won).length,
        afterWins: runs.filter(run => run.after.won).length,
        changedToWin: runs.filter(run => !run.before.won && run.after.won).length,
        changedToLoss: runs.filter(run => run.before.won && !run.after.won).length, runs });
    }
    singleItems.push({ templateId: template.id, unique: template.unique, cardId, before, after,
      contributionFraction: (after - before) / after, stats: R.depthStats(state, cardId), outcomes });
  }
  if (scope !== 'tiers') {
    const weight = { hp: .2, attack: 2, defense: 1.5 };
    for (const template of R.GEAR.filter(item => item.rarity === 'legendary')) {
      for (const cardId of ['mochi', 'soot', 'clover']) for (const enhancement of [0, 12]) {
        const state = fixture(offset + 101, 1, 'none');
        const before = power(state);
        const item = R.makeGear(state, template.id, offset + 101);
        const compatible = R.AFFIXES.filter(affix => affix.slots.includes(template.slot));
        const score = affix => (weight[affix.stat] || 0) * affix.tiers[item.tier - 1][1];
        const strongest = compatible.sort((left, right) => score(right) - score(left)).slice(0, item.affixes.length);
        item.affixes = strongest.map(affix => affix.id);
        item.rolls = Object.fromEntries(strongest.map(affix => [affix.id, affix.tiers[item.tier - 1][1]]));
        item.enhancement = enhancement;
        state.gear.push(item);
        state.equipment[cardId] = { [template.slot]: item.id };
        const after = power(state);
        powerBounds.push({ templateId: template.id, cardId, enhancement, rolls: item.rolls,
          before, after, contributionFraction: (after - before) / after });
      }
    }
  }
  const cats = R.CATS.map(cat => {
    const context = teams.filter(row => row.team.includes(cat.id));
    const denominator = context.reduce((sum, row) => sum + row.count, 0);
    return { id: cat.id, count: denominator, wins: context.reduce((sum, row) => sum + row.wins, 0) };
  });
  await mkdir('reports/cardrpg-big/sim', { recursive: true });
  await writeFile(`reports/cardrpg-big/sim/gear-${phase}.json`, JSON.stringify({ phase, count, offset, scope, mainScale,
    templateValues, affixScale, affixValues, sourceHashes,
    fixture: 'Actual campaigns, phase-A auto controller. Level1/6, stars1, enhancements0, deterministic affixes. Thematic sets for tier rows, one uniform set for set rows. All220 distinct three-cat teams versus each boss at level6 with20 seeds, ordinary gear absent. At least one front-row cat. One-piece display-score attribution uses a bare level1 starter team. No outcomes invented.',
    powerMethod: 'Power bounds use each legendary at +0 and +12 with the maximum compatible affix rolls and highest display-score affix combination, on each member of a bare level1 starter team. Utility is evaluated separately by paired boss outcomes in full runs. Partial scopes leave unrelated arrays empty.',
    rows, sets, teams, cats, singleItems, powerBounds }, null, 2));
} finally { await vite.close(); }
