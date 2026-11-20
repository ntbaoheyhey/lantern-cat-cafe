/** Accounting for the 30-day economy projection. Only observe public rule
 * transitions: no invented income, drop rolls, rarity, or currency spending. */
export const currencies = ['fish', 'threads', 'stamps', 'essence'];
export const materialIds = ['mastery-material', 'boss-seal', 'pantry-key', 'cafe-ribbon', 'boss-proof'];
const zero = () => Object.fromEntries(currencies.map(id => [id, 0]));
const stock = state => ({
  'mastery-material': state.materials, 'boss-seal': state.seals,
  ...Object.fromEntries(materialIds.slice(2).map(id => [id, state.account.inventory.stacks[id] ?? 0])),
});
const increment = (object, key, value = 1) => { object[key] = (object[key] ?? 0) + value; };

export function createEconomyLedger(initial, gearCatalog) {
  const initialCurrencies = { ...initial.account.currencies };
  const report = { initialCurrencies, income: zero(), spending: zero(), sources: {},
    gearCreated: {}, materialsCreated: {}, materialsConsumed: {}, weeks: {},
    firstEpicDay: null, firstLegendaryDay: null, duplicateShards: 0,
    maxBag: initial.gear.length, actions: 0, daily: [] };

  function record(before, after, { day, source }) {
    if (!Number.isInteger(day) || day < 1 || !source) throw Error('Every transition needs a day and a source');
    const bucket = report.sources[source] ??= { actions: 0, income: zero(), spending: zero(), gear: {}, materials: {} };
    report.actions++; bucket.actions++;
    for (const id of currencies) {
      const delta = after.account.currencies[id] - before.account.currencies[id];
      if (!Number.isFinite(delta)) throw Error('Non-finite currency transition: ' + id);
      const key = delta < 0 ? 'spending' : 'income';
      report[key][id] += Math.abs(delta); bucket[key][id] += Math.abs(delta);
    }
    const week = report.weeks[Math.floor((day - 1) / 7) + 1] ??= { gear: {}, materials: {} };
    const previousIds = new Set(before.gear.map(g => g.id));
    for (const item of after.gear.filter(g => !previousIds.has(g.id))) {
      const template = gearCatalog[item.templateId];
      if (!template) throw Error('Unknown minted gear: ' + item.templateId);
      increment(report.gearCreated, template.id); increment(bucket.gear, template.id); increment(week.gear, template.id);
      if (template.rarity === 'epic') report.firstEpicDay ??= day;
      if (template.rarity === 'legendary') report.firstLegendaryDay ??= day;
    }
    const beforeStock = stock(before), afterStock = stock(after);
    for (const id of materialIds) {
      const delta = afterStock[id] - beforeStock[id];
      if (!Number.isFinite(delta)) throw Error('Non-finite material transition: ' + id);
      if (delta > 0) {
        increment(report.materialsCreated, id, delta); increment(bucket.materials, id, delta); increment(week.materials, id, delta);
      } else if (delta < 0) increment(report.materialsConsumed, id, -delta);
    }
    for (const cat of after.account.cards) {
      const old = before.account.cards.find(c => c.cardId === cat.cardId);
      if (old && cat.shards > old.shards) report.duplicateShards += cat.shards - old.shards;
    }
    report.maxBag = Math.max(report.maxBag, after.gear.length);
  }

  function finish(final) {
    const balances = { ...final.account.currencies };
    const sinkRatios = Object.fromEntries(currencies.map(id => [id, report.income[id] ? report.spending[id] / report.income[id] : null]));
    for (const id of currencies) {
      if (initialCurrencies[id] + report.income[id] - report.spending[id] !== balances[id]) throw Error('Currency accounting does not reconcile: ' + id);
    }
    return { ...report, balances, sinkRatios, finalBag: final.gear.length, finalMaterials: stock(final) };
  }
  return { report, record, finish };
}
