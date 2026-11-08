// REFERENCE: A5 B2/C1. Explicit UI fixtures, never earned-path or balance evidence.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { loadRules } from './a4-load.mjs';
const out = 'reports/cardrpg-big/a5/c1-specialties/fixtures';
await mkdir(out, { recursive: true });
const { load, vite } = await loadRules();
try {
  const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
  let state = R.createDepthAccount(11, 0);
  const slots = ['weapon', 'outfit', 'charm', 'relic'];
  // Two starter cats hold one piece from each set to exercise every Team tooltip.
  for (const [i, set] of R.SETS.entries()) {
    const template = R.GEAR.find(item => item.setId === set.id && item.slot === slots[i % 4] && item.rarity === 'common');
    assert(template);
    const item = R.makeGear(state, template.id, i + 1);
    state.gear.push(item);
    const equipped = R.equipGear(state, state.team[Math.floor(i / 4)], item.id);
    assert(equipped.ok);
    state = equipped.state;
  }
  assert.equal(state.gameplayV4, undefined);
  const save = R.exportSave(state);
  assert(save.startsWith('THC7.'), 'The OFF fixture must exercise the original THC7 schema');
  await writeFile(`${out}/all-set-tooltips.save`, save);
  const oldPath = 'reports/cardrpg-big/a4/p6/economy/day7.save';
  const old = R.importSave(await readFile(oldPath, 'utf8'), 0);
  assert(!old.run || old.run.complete, 'Historical import must be outside a committed route');
  await writeFile(`${out}/checks.json`, JSON.stringify({
    method: 'UI-only synthetic gear via makeGear/equipGear. No battle, economy, rarity or earned-progress claim.',
    saveSha256: createHash('sha256').update(save).digest('hex'),
    cats: R.CATS.map(cat => ({ id: cat.id, name: cat.name, job: R.CAT_SPECIALTIES_V4[cat.id] })),
    team: state.team,
    tooltips: R.SETS.map(set => ({ id: set.id, name: set.name,
      on: `2 pieces · ${R.SET_TEXT_V4[set.id].two} 4 pieces · ${R.SET_TEXT_V4[set.id].four}`,
      off: `2 pieces · ${set.two} 4 pieces · ${set.four}` })),
    historical: { path: oldPath, prefix: (await readFile(oldPath, 'utf8')).split('.')[0],
      day: old.account.day, team: old.team, currencies: old.account.currencies },
  }, null, 2) + '\n');
} finally { await vite.close(); }
