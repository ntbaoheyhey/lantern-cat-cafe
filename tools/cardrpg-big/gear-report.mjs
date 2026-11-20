import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const paths = {
  before: 'reports/cardrpg-big/sim/gear-complete-before.json',
  train: 'reports/cardrpg-big/sim/gear-after-train.json',
  held: 'reports/cardrpg-big/sim/gear-after-heldout.json',
  economyBefore: 'reports/cardrpg-big/sim/economy-before.json',
  economyAfter: 'reports/cardrpg-big/sim/economy-after.json',
};
const encounterBalance = process.argv.includes('--encounter');
if (encounterBalance) {
  Object.assign(paths, {
    before: 'reports/cardrpg-big/sim/gear-after-train.json',
    train: 'reports/cardrpg-big/sim/gear-encounter-train.json',
    held: 'reports/cardrpg-big/sim/gear-encounter-heldout.json',
    economyBefore: 'reports/cardrpg-big/sim/economy-after.json',
    economyAfter: 'reports/cardrpg-big/sim/economy-encounter.json',
  });
}
const data = {}, hashes = {};
for (const [name, path] of Object.entries(paths)) {
  const bytes = await readFile(path);
  data[name] = JSON.parse(bytes);
  hashes[path] = createHash('sha256').update(bytes).digest('hex');
}
const percent = value => (value * 100).toFixed(2) + '%';
const rate = row => row.wins / row.count;
const maximum = (rows, field) => rows.reduce((best, row) => row[field] > best[field] ? row : best);
const tiers = ['none', 'common', 'rare', 'epic', 'legendary'];
const lines = ['# I automatic-battle equipment balance',
  'REFERENCE: PLAN.md, ../sim/gear-complete-before.json, ../sim/gear-after-train.json, ../sim/gear-after-heldout.json', '',
  'Main-stat values use 75% of their previous values. Affix ranges use 25%, rounded to integers with a floor of one. Existing saved rolls are read within the current range in combat and the equipment panel. The original roll remains in the save.', '',
  'Selection used training seeds only. Main-only probes and seven combined probes remain under ../sim/gear-pilot-*.json. The selected candidate keeps the starter weapon’s first enhancement positive under the existing 6% formula and meets the proposed single-piece display-power ceiling. Heldout seeds were opened after selecting these values.', '',
  '## Full campaign outcomes',
  'REFERENCE: ../sim/gear-complete-before.json, ../sim/gear-after-train.json, ../sim/gear-after-heldout.json', '',
  'Each cell contains wins out of 50 complete routes. Training uses seeds 1–50. Heldout uses 10001–10050. Level, stars, equipment and route policy are recorded in each receipt.', '',
  '| Sample | Level | Chapter | Bare | Common | Rare | Epic | Legendary |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'];
for (const [label, sample] of [['Before', data.before], ['After training', data.train], ['After heldout', data.held]]) {
  for (const level of [1, 6]) for (const chapter of [1, 2, 3]) {
    const rows = tiers.map(rarity => sample.rows.find(row => row.level === level && row.chapter === chapter && row.rarity === rarity));
    lines.push(`| ${label} | ${level} | ${chapter} | ${rows.map(row => `${row.wins}/${row.count}`).join(' | ')} |`);
  }
}
const tierSteps = [];
for (const [sample, results] of [['train', data.train], ['held', data.held]]) {
  for (const level of [1, 6]) for (const chapter of [1, 2, 3]) {
    const rows = tiers.map(rarity => results.rows.find(row => row.level === level && row.chapter === chapter && row.rarity === rarity));
    for (let index = 1; index < rows.length; index++) {
      tierSteps.push({ sample, level, chapter, from: rows[index - 1].rarity, to: rows[index].rarity,
        delta: rate(rows[index]) - rate(rows[index - 1]), saturated: rows[index - 1].wins === rows[index - 1].count });
    }
  }
}
lines.push('', `${tierSteps.filter(step => step.delta > 0).length}/${tierSteps.length} adjacent tier steps increase sampled wins. ${tierSteps.filter(step => step.delta === 0).length} tie and ${tierSteps.filter(step => step.delta < 0).length} decline. The all-tier meaningful-increase gate remains open wherever the table ties, declines or reaches its ceiling.`, '',
  '## Single-piece power and actual boss outcomes',
  'REFERENCE: ../sim/gear-complete-before.json, ../sim/gear-after-train.json, ../sim/gear-after-heldout.json', '');
const powerBounds = Object.fromEntries(['before', 'train', 'held'].map(name => [name, maximum(data[name].powerBounds, 'contributionFraction')]));
lines.push('| Sample | Maximum contribution | Template | Enhancement |', '| --- | ---: | --- | ---: |');
for (const [name, row] of Object.entries(powerBounds)) lines.push(`| ${name} | ${percent(row.contributionFraction)} | ${row.templateId} | +${row.enhancement} |`);
lines.push('', 'The 10% criterion applies to the added share of displayed power on a bare level-1 starter team, at +0 and +12 with the strongest compatible affix rolls. The score is HP/5 + 2×ATK + 1.5×DEF, rounded per cat. Paired boss fights separately measure utility.', '');
const singleOutcomes = {};
for (const name of ['before', 'train', 'held']) {
  singleOutcomes[name] = data[name].singleItems.flatMap(item => item.outcomes.map(outcome => ({
    templateId: item.templateId, unique: item.unique, cardId: item.cardId, ...outcome,
    delta: (outcome.afterWins - outcome.beforeWins) / outcome.count,
  }))).sort((left, right) => right.delta - left.delta);
}
lines.push('| Sample | Largest single-piece win increase | Item / wearer | Level / chapter | Boss wins before → after |',
  '| --- | ---: | --- | --- | --- |');
for (const [name, rows] of Object.entries(singleOutcomes)) {
  const row = rows[0];
  lines.push(`| ${name} | ${(row.delta * 100).toFixed(2)} pp | ${row.templateId} / ${row.cardId} | ${row.level} / ${row.chapter} | ${row.beforeWins}/${row.count} → ${row.afterWins}/${row.count} |`);
}
lines.push('', '## Set and companion spreads',
  'REFERENCE: ../sim/gear-after-train.json, ../sim/gear-after-heldout.json', '',
  '| Sample | Level | Chapter | Lowest set win rate | Highest set win rate | Sets at 100% |',
  '| --- | ---: | ---: | ---: | ---: | ---: |');
for (const name of ['before', 'train', 'held']) for (const level of [1, 6]) for (const chapter of [1, 2, 3]) {
  const rows = data[name].sets.filter(row => row.level === level && row.chapter === chapter);
  lines.push(`| ${name} | ${level} | ${chapter} | ${percent(Math.min(...rows.map(rate)))} | ${percent(Math.max(...rows.map(rate)))} | ${rows.filter(row => row.wins === row.count).length}/8 |`);
}
lines.push('', 'Companion participation covers all 220 distinct teams, three bosses and 20 seeds per team. These bare level-6 fixtures describe team context. The item adjustment leaves their inputs equal between before and training.', '',
  '| Companion | Training wins / fights | Heldout wins / fights |', '| --- | ---: | ---: |');
for (const cat of data.train.cats) {
  const held = data.held.cats.find(row => row.id === cat.id);
  lines.push(`| ${cat.id} | ${cat.wins}/${cat.count} (${percent(rate(cat))}) | ${held.wins}/${held.count} (${percent(rate(held))}) |`);
}
lines.push('', '## 45-day earned economy',
  'REFERENCE: ../sim/economy-before.json, ../sim/economy-after.json', '',
  '| Earned measure | Before heavy/casual | After heavy/casual | ≤3× |', '| --- | ---: | ---: | --- |');
for (const [name, value] of Object.entries(data.economyAfter.heavyCasual45)) {
  lines.push(`| ${name} | ${data.economyBefore.heavyCasual45[name].toFixed(4)}× | ${value.toFixed(4)}× | ${value <= 3 ? 'PASS' : 'MISS'} |`);
}
lines.push('', '| Cohort | All 12 cards by day 45 | Card collection | Gear-template collection | Awakening ranks |',
  '| --- | ---: | ---: | ---: | ---: |');
for (const row of data.economyAfter.summary) {
  const end = row.checkpoints.find(point => point.day === 45);
  lines.push(`| ${row.style} | ${row.saturatedBy45}/30 accounts | ${end.cardPercent.toFixed(2)}% | ${end.gearPercent.toFixed(2)}% | ${end.awakening.toFixed(2)} |`);
}
const runtimeChanges = Object.keys(data.train.sourceHashes).filter(path => !path.endsWith('.test.ts')
  && data.before.sourceHashes[path] !== data.train.sourceHashes[path]);
const expectedChanges = encounterBalance
  ? ['battle.ts', 'catalog.ts', 'contract.ts', 'run.ts', 'save.ts'].map(name => `packages/game-rules/src/cardrpg/depth/${name}`)
  : ['packages/game-rules/src/cardrpg/depth/equipment.ts'];
if (runtimeChanges.slice().sort().join() !== expectedChanges.slice().sort().join()) {
  throw Error('Unexpected runtime rules diff: ' + runtimeChanges.join(', '));
}
const summary = { paths, hashes, runtimeChanges, powerBounds, tierSteps,
  topSingleOutcomes: Object.fromEntries(Object.entries(singleOutcomes).map(([name, rows]) => [name,
    rows.slice(0, 12).map(({ runs, ...row }) => row)])),
  heavyCasual45: data.economyAfter.heavyCasual45 };
await mkdir('reports/cardrpg-big/items', { recursive: true });
let report = lines.join('\n') + '\n';
if (encounterBalance) {
  report = report
    .replace('# I automatic-battle equipment balance', '# I encounter balance with equipment')
    .replaceAll('gear-complete-before.json', 'gear-after-train.json')
    .replaceAll('gear-after-heldout.json', 'gear-encounter-heldout.json')
    .replaceAll('../sim/gear-after-train.json, ../sim/gear-after-train.json', '../sim/gear-after-train.json, ../sim/gear-encounter-train.json')
    .replaceAll('../sim/gear-after-train.json, ../sim/gear-encounter-heldout.json', '../sim/gear-encounter-train.json, ../sim/gear-encounter-heldout.json')
    .replaceAll('economy-before.json', 'economy-after.json')
    .replaceAll('../sim/economy-after.json, ../sim/economy-after.json', '../sim/economy-after.json, ../sim/economy-encounter.json')
    .replace('The item adjustment leaves their inputs equal between before and training.', 'The enemy adjustment changes the boss inputs. Enemy-stat snapshots preserve earlier saves and replays.')
    .replace('Heldout seeds were opened after selecting these values.', 'Enemy values come from the frozen pilot-five-b candidate. See ENCOUNTERS.md for the separate duration holdout and existing-knob table.');
}
await writeFile(`reports/cardrpg-big/items/${encounterBalance ? 'encounter-summary' : 'summary'}.json`, JSON.stringify(summary, null, 2));
await writeFile(`reports/cardrpg-big/items/${encounterBalance ? 'ENCOUNTER-BALANCE' : 'BALANCE'}.md`, report);
console.log(JSON.stringify({ runtimeChanges, powerBound: powerBounds.train.contributionFraction,
  positiveTierSteps: tierSteps.filter(row => row.delta > 0).length, tierSteps: tierSteps.length,
  heavyCasual45: summary.heavyCasual45 }));
