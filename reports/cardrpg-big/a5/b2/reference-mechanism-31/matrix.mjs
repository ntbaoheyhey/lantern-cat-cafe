// REFERENCE: A5 B2. Same TRAIN-only scenarios and fixed enemy stats for every set and crew.
import { loadRules } from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const out = process.env.A5_COMMON_OUT;
assert(out, 'A registered output directory is required.');
const read = async p => JSON.parse(await readFile(p, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const method = await read(out + '/REGISTERED-METHOD.json');
assert.equal(method.seedOffset, 0, 'This diagnostic may only sample TRAIN.');
assert([50, 500].includes(method.count));
for (const [path, hash] of Object.entries(method.source))
  assert.equal(sha(await readFile(process.env.BIG_RULES_ROOT + '/' + path)), hash, path);
const { load, vite, rules: C } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const rng = await load('packages/game-rules/src/rng.ts');
const starter = ['mochi', 'soot', 'clover'];
const themes = { guardian: 'hearthloom', witch: 'moonwick', alchemist: 'mossbrew' };
const teams = [];
for (let a = 0; a < C.CARDS.length - 2; a++) for (let b = a + 1; b < C.CARDS.length - 1; b++)
  for (let c = b + 1; c < C.CARDS.length; c++) teams.push([C.CARDS[a].id, C.CARDS[b].id, C.CARDS[c].id]);
assert.equal(teams.length, 220);
function fixture(seed, team, setId) {
  const s = R.setGameplayV4(R.createDepthAccount(seed), true);
  s.account.cards = team.map(id => ({ id, cardId: id, level: 6, stars: 1, shards: 0, soulbound: true }));
  s.team = [...team]; s.gear = []; s.equipment = {}; s.cleared = [1, 2, 3];
  for (const id of team) {
    s.rows[id] = R.CAT_BY_ID[id].row; s.skills[id] = R.defaultSkills(s, id);
    for (const slot of C.EQUIPMENT_SLOTS) {
      const item = R.makeGear(s, `${setId ?? themes[C.CARD_BY_ID[id].role]}-${slot}-epic`, seed + C.EQUIPMENT_SLOTS.indexOf(slot) * 7919);
      s.gear.push(item); (s.equipment[id] ??= {})[slot] = item.id;
    }
  }
  if (!team.some(id => s.rows[id] === 'front')) s.rows[team[0]] = 'front';
  return s;
}
const budgets = new Map();
function battle(seed, scene, team, setId) {
  const state = fixture(seed, team, setId), cats = R.battleCats(state);
  if (!budgets.has(seed)) budgets.set(seed, R.teamPowerV4(fixture(seed, starter)));
  const target = budgets.get(seed), utility = team.reduce((n, id) => n + R.powerV4(state, id).utility, 0);
  const raw = cats.reduce((n, c) => n + R.rawPowerV4(c.stats), 0), scale = (target - utility) / raw;
  assert(scale > 0);
  for (const cat of cats) for (const key of ['hp', 'attack', 'defense']) cat.stats[key] = Math.max(1, Math.round(cat.stats[key] * scale));
  const ratio = (utility + cats.reduce((n, c) => n + R.rawPowerV4(c.stats), 0)) / target;
  assert(Math.abs(ratio - 1) <= .02);
  const scenario = method.scenarios[scene];
  const b = R.playBattle(R.createBattle({ seed, chapter: scenario.chapter, cats, enemies: scenario.enemies,
    gameplayV4: true, challengeLevel: 6, enemyStats: scenario.enemyStats }), 'auto');
  if (seed === 1) assert.deepEqual(R.replayBattle(b.initial, b.choices), b);
  return { won: b.result === 'party', ratio, battle: b };
}
const methodHash = sha(JSON.stringify(method));
const cp = await read(out + '/partial.json').catch(e => { if (e.code === 'ENOENT') return {}; throw e; });
if (cp.methodHash) assert.equal(cp.methodHash, methodHash);
const rows = cp.rows ?? [], byKey = new Map(rows.map(r => [r.key, r])), start = Date.now(), pause = new Error('checkpoint');
const save = () => writeFile(out + '/partial.json', JSON.stringify({ methodHash, rows }));
async function cell(meta, run) {
  const key = JSON.stringify(meta);
  let row = byKey.get(key);
  if (!row) { row = { key, ...meta, outcomes: '', minPowerRatio: 1, maxPowerRatio: 1 }; rows.push(row); byKey.set(key, row); }
  for (let seed = row.outcomes.length + 1; seed <= method.count; seed++) {
    const r = run(seed); row.outcomes += r.code;
    row.minPowerRatio = Math.min(row.minPowerRatio, r.ratio); row.maxPowerRatio = Math.max(row.maxPowerRatio, r.ratio);
    if (Date.now() - start >= 110000) { await save(); process.exitCode = 75; throw pause; }
  }
  if (!row.complete) {
    row.complete = true; row.digest = sha(row.outcomes);
    row.wins = [...row.outcomes].filter(c => Number(c) % 2).length;
    row.rate = row.wins / method.count;
    if (meta.kind === 'crew') {
      row.beforeWins = [...row.outcomes].filter(c => Number(c) >= 2).length;
      row.gainPp = 100 * (row.wins - row.beforeWins) / method.count;
    }
  }
}
try {
  for (let scene = 0; scene < method.scenarios.length; scene++) await cell({ kind: 'reference', scene }, seed => {
    const r = battle(seed, scene, starter); return { won:r.won, ratio:r.ratio, code: r.won ? 1 : 0 };
  });
  assert.equal(rows.length,8);
  await save();
  await writeFile(out+'/results.json',JSON.stringify({methodHash,registration:method,rows},null,2)+'\n');
  console.log(JSON.stringify({complete:true,cells:rows.length,samples:method.count}));
} catch (error) { if (error !== pause) throw error; } finally { await vite.close(); }
