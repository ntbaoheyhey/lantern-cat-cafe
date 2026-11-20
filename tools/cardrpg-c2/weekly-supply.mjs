/** Gross eligible supply is not an authorization to mint from browser saves. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { root, require } from './runtime.mjs';

export function weeklySupply(summary, tradeRules, mix = { casual: .75, regular: .2, heavy: .05 }) {
 const profiles = Object.keys(mix);
 const calendar = { firstDay: '2026-11-12', startSpanDays: 1, ...summary.source?.calendar };
 if (profiles.some(id => !summary.profiles[id] || !Number.isFinite(mix[id]) || mix[id] < 0)
  || Math.abs(Object.values(mix).reduce((n, x) => n + x, 0) - 1) > 1e-9) throw Error('Invalid active-account mix');
 const rules = new Map(tradeRules.map(r => [r.id, r]));
 const ids = [...new Set(Object.values(summary.profiles).flatMap(p => Object.keys(p.perItem)))].sort();
 const items = Object.fromEntries(ids.map(id => {
  const rule = rules.get(id);
  const perProfile = Object.fromEntries(profiles.map(profile => [profile, summary.profiles[profile].perItem[id]?.perActiveWeek ?? 0]));
  const gross = profiles.reduce((n, profile) => n + mix[profile] * perProfile[profile], 0);
  return [id, { rarity: rule?.rarity ?? summary.profiles[profiles[0]].perItem[id]?.rarity ?? null,
   tradable: rule?.tradable === true, kind: rule?.kind ?? 'bound',
   perProfile, grossPerActiveWeek: gross, eligiblePerActiveWeek: rule?.tradable ? gross : 0,
   authoritativeIssuancePerWeek: 0 }];
 }));
 const total = predicate => Object.values(items).filter(predicate).reduce((n, r) => n + r.eligiblePerActiveWeek, 0);
 return { mix, activeHoursPerWeek: Object.fromEntries(profiles.map(id => [id, summary.profiles[id].minutesPerDay * 7 / 60])),
  rarePerActiveWeek: total(r => r.rarity === 'rare'),
  epicPerActiveWeek: total(r => r.rarity === 'epic'),
  legendaryPerActiveWeek: total(r => r.rarity === 'legendary'), items,
  specialOneTimeRewards: { 'star-thread': { maximumPerAccount: 1, recurringPerWeek: 0, authority: 'CHAIN judge fixture; excluded from ordinary campaign model' } },
  authority: 'Eligible template creation only. Ordinary campaign issuance stays zero until trusted earning, inventory and consumed/sealed receipts are integrated.',
  correlation: calendar.startSpanDays === 1
   ? `Daily routes use a shared calendar seed. These account-seed cohorts are conditional on the same ${calendar.firstDay} start date, not independent daily loot rolls; calendar variation and between-date uncertainty are not measured.`
   : `Accounts cycle through ${calendar.startSpanDays} consecutive start dates from ${calendar.firstDay}, matched across player profiles. Daily-route seeds remain shared by calendar date; account count is not independent date count. Variation is measured across this declared start-date window only.`,
  feeModel: 'Rare material, Epic and Legendary are distinct rates. Do not price Legendary seals as Epic seals.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
 const arg = key => process.argv.find(a => a.startsWith(`--${key}=`))?.slice(key.length + 3);
 const dir = arg('dir'); if (!dir) throw Error('Use --dir=<completed 600-account economy projection>');
 const summary = JSON.parse(await readFile(resolve(dir, 'summary.json')));
 if (Object.keys(summary.profiles).length !== 3 || Object.values(summary.profiles).some(p => p.seeds !== 200 || p.days !== 30)) throw Error('Supply requires all three complete 200-seed, 30-day profiles');
 const tradeSource = resolve(arg('trade-source') ?? resolve(root, 'packages/game-rules/src/cardrpg/trade.ts'));
 const scratch = resolve(dir, 'trade-runtime'); await mkdir(scratch, { recursive: true });
 const entry = resolve(scratch, 'entry.ts');
 await writeFile(entry, `export {TRADE_RULES} from ${JSON.stringify(tradeSource)};`);
 const { build } = await import(require.resolve('vite'));
 await build({ configFile: false, root, envDir: false, publicDir: false, logLevel: 'silent', build: {
  emptyOutDir: false, outDir: scratch, minify: false, lib: { entry, formats: ['es'], fileName: () => 'trade.mjs' } } });
 const { TRADE_RULES } = await import(pathToFileURL(resolve(scratch, 'trade.mjs')).href);
 const result = { source: `${summary.source.date}; rules ${summary.source.head}; runtime sha256 ${summary.source.runtimeSha256}`,
  economySource: summary.source, tradeSourceSha256: createHash('sha256').update(await readFile(tradeSource)).digest('hex'),
  ...weeklySupply(summary, TRADE_RULES) };
 await writeFile(resolve(arg('out') ?? resolve(dir, 'weekly-supply.json')), JSON.stringify(result, null, 2) + '\n');
 console.log(JSON.stringify({ source: result.source, rare: result.rarePerActiveWeek, epic: result.epicPerActiveWeek,
  legendary: result.legendaryPerActiveWeek, templates: Object.keys(result.items).length }));
}
