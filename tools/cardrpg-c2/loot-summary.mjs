/** Aggregate a declared player-policy projection, preserving censored rarity times
 * and partial-week exposure. Gross creation is distinct from final inventory. */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { currencies, materialIds } from './economy-ledger.mjs';
export const quantile = (values, p) => {
 const xs = [...values].sort((a, b) => a - b);
 return xs.length ? xs[Math.min(xs.length - 1, Math.floor(xs.length * p))] : null;
};
const average = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
export function rarityCurve(reports, field, days) {
 const times = reports.map(r => r[field] ?? Infinity);
 const bounded = p => { const n = quantile(times, p); return Number.isFinite(n) ? n : null; };
 return { medianDay: bounded(.5), p90Day: bounded(.9), censored: times.filter(t => t === Infinity).length,
  cdf: Array.from({ length: days }, (_, i) => ({ day: i + 1, fraction: times.filter(t => t <= i + 1).length / times.length })) };
}
export function summarizeEconomy(reports, days, gearCatalog) {
 if (!reports.length || reports.some(r => r.days !== days || r.daily.length !== days)) throw Error('Incomplete economy projection');
 const profiles = [...new Set(reports.map(r => r.profile.id))];
 const result = {};
 for (const id of profiles) {
  const rows = reports.filter(r => r.profile.id === id), minutes = rows[0].profile.minutes;
  if (rows.some(r => r.profile.minutes !== minutes)) throw Error('Mixed player policies');
  const gearIds = [...new Set(rows.flatMap(r => Object.keys(r.gearCreated)))].sort();
  const perItem = Object.fromEntries([...gearIds, ...materialIds].map(item => {
   const gear = !!gearCatalog[item], field = gear ? 'gear' : 'materials', totalField = gear ? 'gearCreated' : 'materialsCreated';
   if (!gear && !materialIds.includes(item)) throw Error('Unknown item: ' + item);
   const created = rows.map(r => r[totalField][item] ?? 0);
   const weeks = Array.from({ length: Math.ceil(days / 7) }, (_, i) => ({
    week: i + 1, observedDays: Math.min(7, days - i * 7),
    meanCreated: average(rows.map(r => r.weeks[i + 1]?.[field]?.[item] ?? 0)),
   }));
   return [item, { kind: field, rarity: gear ? gearCatalog[item].rarity : null, meanCreated: average(created),
    perActiveWeek: average(created) * 7 / days, perActiveHour: average(created) / (minutes * days / 60), weeks }];
  }));
  const currency = Object.fromEntries(currencies.map(c => {
   const income = rows.reduce((n, r) => n + r.income[c], 0), spent = rows.reduce((n, r) => n + r.spending[c], 0);
   return [c, { meanInitial: average(rows.map(r => r.initialCurrencies[c])), meanIncome: income / rows.length,
    meanSpent: spent / rows.length, meanFinal: average(rows.map(r => r.balances[c])), sinkRatio: income ? spent / income : null }];
  }));
  result[id] = { seeds: rows.length, days, minutesPerDay: minutes, activeHours: minutes * days / 60,
   epic: rarityCurve(rows, 'firstEpicDay', days), legendary: rarityCurve(rows, 'firstLegendaryDay', days),
   bag: { medianFinal: quantile(rows.map(r => r.finalBag), .5), p90Final: quantile(rows.map(r => r.finalBag), .9), maximum: Math.max(...rows.map(r => r.maxBag)) },
   currencies: currency, perItem,
   progression: { meanFinalPower: average(rows.map(r => r.daily.at(-1).power)),
    xpPerHour: average(rows.map(r => r.daily.at(-1).accountXp)) / (minutes * days / 60),
    gearPerHour: Object.values(perItem).filter(r => r.kind === 'gear').reduce((n, r) => n + r.perActiveHour, 0),
    masteryPerHour: perItem['mastery-material'].perActiveHour },
   duplicates: { meanShards: average(rows.map(r => r.duplicateShards)) } };
 }
 const casual = result.casual, heavy = result.heavy;
 return { profiles: result, heavyToCasualPerHour: casual && heavy ? Object.fromEntries(['xpPerHour', 'gearPerHour', 'masteryPerHour'].map(k =>
  [k, casual.progression[k] ? heavy.progression[k] / casual.progression[k] : null])) : null };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
 const arg = (key, fallback) => process.argv.find(a => a.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
 const dir = arg('dir'); if (!dir) throw Error('Use --dir=<completed projection directory>');
 const index = JSON.parse(await readFile(resolve(dir, 'index.json')));
 const { R } = await import(pathToFileURL(resolve(dir, 'runtime/runtime.mjs')).href);
 const reports = await Promise.all(index.reports.map(r => readFile(resolve(dir, `${r.profile}-${r.seed}.json`)).then(JSON.parse)));
 if (reports.length !== index.count * index.profiles.length) throw Error('Missing profile/seed');
 const result = { source: index.source, ...summarizeEconomy(reports, index.days, R.GEAR_BY_ID) };
 await writeFile(resolve(arg('out', resolve(dir, 'summary.json'))), JSON.stringify(result, null, 2));
 console.table(Object.entries(result.profiles).map(([profile, r]) => ({ profile, seeds: r.seeds, epicDay: r.epic.medianDay,
  legendaryDay: r.legendary.medianDay, legendaryCensored: r.legendary.censored, bag: r.bag.medianFinal,
  ...Object.fromEntries(Object.entries(r.currencies).map(([id, v]) => [id, v.sinkRatio])) })));
 console.log(JSON.stringify({ heavyToCasualPerHour: result.heavyToCasualPerHour }));
}
