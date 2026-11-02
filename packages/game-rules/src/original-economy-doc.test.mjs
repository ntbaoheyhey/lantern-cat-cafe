import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { CONFIG } from './config';

const doc = readFileSync(new URL('../../../docs/design/original-economy.md', import.meta.url), 'utf8');
const table = CONFIG.originalEconomy;
const row = (values) => `| ${values.join(' | ')} |`;

it('keeps every original stat, item, quality, skill and price table in sync with config', () => {
  for (const [id, stat] of Object.entries(table.stats))
    expect(doc).toContain(row([id, stat.name, stat.base, stat.cap ?? 'none', stat.unit, stat.description]));
  for (const [id, item] of Object.entries(table.gear.items))
    expect(doc).toContain(row([id, item.name, item.slot, 'weaponType' in item ? item.weaponType : '—', Object.entries(item.stats).map(([stat, value]) => `${stat}=${value}`).join(', '), item.description]));
  for (const [id, quality] of Object.entries(table.gear.qualities))
    expect(doc).toContain(row([id, quality.name, quality.multiplier, quality.costMultiplier, quality.weightBp]));
  for (const [id, skill] of Object.entries(table.skills.entries))
    expect(doc).toContain(row([id, skill.name, skill.weaponType, skill.trigger, skill.every, skill.effect, skill.hits, skill.perRank.join(' / '), skill.description]));
  table.gear.upgradeFish.forEach((fish, index) => expect(doc).toContain(row([`${index + 1} → ${index + 2}`, fish])));
  table.skills.rankFish.forEach((fish, index) => expect(doc).toContain(row([index + 1, table.skills.unlockLevels[index], fish])));
  for (const [id, value] of Object.entries(table.rewards)) expect(doc).toContain(`| ${id} | ${value} |`);
});
