import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadRules, root } from './load.mjs';
const { rules: R, vite } = await loadRules();
const dir = resolve(root, 'packages/game-rules/src/cardrpg/fixtures');
mkdirSync(dir, { recursive: true });
const starter = R.createStarterAccount(11), mid = R.createStarterAccount(23);
mid.accountXp = 2000; mid.accountLevel = 11; mid.chapter = 2; mid.clearedChapters = ['cafe-patrol'];
mid.currencies = { fish: 4200, threads: 600, stamps: 1600, essence: 40 };
mid.cards = R.CARDS.map(c => ({ id: c.id, cardId: c.id, level: Math.min(12, c.levelCap), stars: 2, shards: 30, soulbound: true }));
mid.inventory.items = R.ITEMS.map(i => { const x = R.makeItem(mid, i.id, 'forge'); x.enhancement = R.RARITY_ORDER.indexOf(i.rarity) * 2; return x; });
mid.inventory.stacks = { 'boss-proof': 10, 'pantry-key': 3, 'milk-tonic': 2 };
mid.loadouts = {};
for (const [id, set] of [['mochi', 'hearthloom'], ['soot', 'moonwick'], ['clover', 'mossbrew']]) {
  mid.loadouts[id] = Object.fromEntries(R.EQUIPMENT_SLOTS.map(slot => [slot, mid.inventory.items.find(i => i.itemId === `${set}-${slot}-epic`).id]));
}
mid.pity = { 'cats-standard': { sinceLegendary: 59, featuredGuaranteed: false, totalPulls: 59 }, 'cats-featured': { sinceLegendary: 44, featuredGuaranteed: true, totalPulls: 104 } };
mid.quests['first-boss'].progress = 1;
const reward = { id: 'run-1', runId: 1, chapterId: 'cafe-patrol', won: true, wavesCleared: 3, rounds: 35, reward: { currencies: { fish: 90, threads: 12, stamps: 40 }, xp: 60 }, firstClear: true, eligibleRelicDesign: true };
const fixtures = { 'starter-account': starter, 'midgame-account': mid, 'banner-standard': R.BANNERS[0], 'banner-featured': R.BANNERS[1], 'pity-near-hard': { ...starter, pity: mid.pity }, 'battle-reward': reward, 'team-equipped': { team: starter.teams[0], loadouts: starter.loadouts, items: starter.inventory.items } };
// Pretty top-level keys, one generated value per line: review schemas in contract.ts.
for (const [name, value] of Object.entries(fixtures)) writeFileSync(resolve(dir, `${name}.json`), '{\n' + Object.entries(value).map(([k,v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n') + '\n}\n');
await vite.close();
console.log(JSON.stringify({ generated: Object.keys(fixtures), version: R.CONTRACT_VERSION }));
