// REFERENCE: A5 B1/B2. Registered TRAIN diagnostic of eligible single-carrier set contexts.
import { loadRules } from './a4-load.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const out = process.env.A5_CARRIERS_OUT;
assert(out);
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const sha = data => createHash('sha256').update(data).digest('hex');
const method = await read(out + '/REGISTERED-METHOD.json');
assert.equal(method.seedOffset, 0);
assert.equal(method.count, 50);
for (const [path, hash] of Object.entries(method.source))
  assert.equal(sha(await readFile(process.env.BIG_RULES_ROOT + '/' + path)), hash, path);
for (const [path, hash] of Object.entries(method.scripts)) assert.equal(sha(await readFile(path)), hash, path);
const { load, vite, rules: C } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const themes = { guardian: 'hearthloom', witch: 'moonwick', alchemist: 'mossbrew' };
const baseCache = new Map();
function fixture(seed, context, setId) {
  const s = R.setGameplayV4(R.createDepthAccount(seed), true);
  s.account.cards = context.team.map(id => ({ id, cardId: id, level: 6, stars: 1, shards: 0, soulbound: true }));
  s.team = [...context.team]; s.gear = []; s.equipment = {}; s.cleared = [1, 2, 3];
  s.v4.plan = { ...context.plan };
  for (const id of context.team) {
    s.rows[id] = context.rows[id]; s.skills[id] = R.defaultSkills(s, id);
    for (const slot of C.EQUIPMENT_SLOTS) {
      const theme = id === context.carrier && setId ? setId : themes[C.CARD_BY_ID[id].role];
      const item = R.makeGear(s, `${theme}-${slot}-epic`, seed + C.EQUIPMENT_SLOTS.indexOf(slot) * 7919);
      s.gear.push(item); (s.equipment[id] ??= {})[slot] = item.id;
    }
  }
  return s;
}
function setup(seed, context, setId, mode) {
  const key = context.id + '/' + seed;
  if (!baseCache.has(key)) {
    const state = fixture(seed, context);
    baseCache.set(key, { state, cats: R.battleCats(state), power: R.powerV4(state, context.carrier) });
  }
  const baseline = baseCache.get(key), state = fixture(seed, context, setId), cats = R.battleCats(state);
  const carrier = cats.find(cat => cat.id === context.carrier), reference = baseline.cats.find(cat => cat.id === context.carrier);
  for (const cat of cats.filter(cat => cat.id !== context.carrier))
    assert.deepEqual(cat, baseline.cats.find(base => base.id === cat.id), 'Allied build must stay exact across sets');
  const utility = R.powerV4(state, context.carrier).utility, target = baseline.power.total;
  if (mode === 'matched-utility') {
    const factor = (target - utility) / R.rawPowerV4(carrier.stats);
    assert(factor > 0);
    for (const key of ['hp', 'attack', 'defense']) carrier.stats[key] = Math.max(1, Math.round(carrier.stats[key] * factor));
  } else {
    assert.equal(mode, 'fixed-core');
    for (const key of ['hp', 'attack', 'defense']) carrier.stats[key] = reference.stats[key];
  }
  const ratio = (R.rawPowerV4(carrier.stats) + utility) / target;
  if (mode === 'matched-utility') assert(Math.abs(ratio - 1) <= .02, 'Carrier matched power tolerance');
  return { cats, ratio, utility, referenceUtility: baseline.power.utility };
}
function battle(seed, context, scene, setId, mode) {
  const input = setup(seed, context, setId, mode), scenario = method.scenarios[scene];
  const b = R.playBattle(R.createBattle({ seed, chapter: scenario.chapter, cats: input.cats,
    enemies: scenario.enemies, gameplayV4: true, challengeLevel: 6, enemyStats: scenario.enemyStats,
    plan: context.plan }), 'auto');
  assert.deepEqual(b.initial.plan, context.plan);
  if (seed === 1) assert.deepEqual(R.replayBattle(b.initial, b.choices), b);
  const actor = b.actors.find(cat => cat.id === context.carrier);
  const scald = b.log.filter(event => event.actorId === context.carrier && event.kind === 'status' && event.text === R.STATUS_BY_ID.scald.name).length;
  const gear = b.v4.events.filter(event => event.kind === 'gear-trigger' && event.actorId === context.carrier);
  const actions = b.choices.filter(choice => choice.actorId === context.carrier);
  return { won: b.result === 'party', rounds: b.round, scald, gear, actions, ratio: input.ratio,
    utility: input.utility, referenceUtility: input.referenceUtility, carrierHp: actor.hp,
    skills: input.cats.find(cat => cat.id === context.carrier).skills };
}

const methodHash = sha(JSON.stringify(method));
const cp = await read(out + '/partial.json').catch(error => { if (error.code === 'ENOENT') return {}; throw error; });
if (cp.methodHash) assert.equal(cp.methodHash, methodHash);
const rows = cp.rows ?? [], byKey = new Map(rows.map(row => [row.key, row]));
const started = Date.now(), pause = new Error('checkpoint');
const save = () => writeFile(out + '/partial.json', JSON.stringify({ methodHash, rows }));
async function cell(meta, context) {
  const key = JSON.stringify(meta);
  let row = byKey.get(key);
  if (!row) {
    row = { key, ...meta, outcomes: '', scald: 0, rounds: 0, carrierHp: 0, skills: null, actions: {}, gear: {},
      minPowerRatio: Infinity, maxPowerRatio: 0, utility: 0, referenceUtility: 0 };
    rows.push(row); byKey.set(key, row);
  }
  for (let seed = row.outcomes.length + 1; seed <= method.count; seed++) {
    const result = battle(seed, context, meta.scene, meta.setId, meta.mode);
    row.outcomes += result.won ? '1' : '0';
    row.scald += result.scald; row.rounds += result.rounds; row.carrierHp += result.carrierHp;
    row.utility += result.utility; row.referenceUtility += result.referenceUtility;
    row.skills ??= result.skills; assert.deepEqual(row.skills, result.skills);
    row.minPowerRatio = Math.min(row.minPowerRatio, result.ratio); row.maxPowerRatio = Math.max(row.maxPowerRatio, result.ratio);
    for (const choice of result.actions) row.actions[choice.skillId] = (row.actions[choice.skillId] ?? 0) + 1;
    for (const event of result.gear) {
      const bucket = row.gear[event.effect] ??= { count: 0, amount: 0 };
      bucket.count++; bucket.amount += event.amount;
    }
    if (Date.now() - started >= 110000) { await save(); process.exitCode = 75; throw pause; }
  }
  row.complete = true; row.digest = sha(row.outcomes);
  row.wins = [...row.outcomes].filter(code => code === '1').length;
}
try {
  for (const context of method.contexts) for (let scene = 0; scene < method.scenarios.length; scene++)
    for (const mode of method.modes) for (const set of R.SETS)
      await cell({ context: context.id, scene, mode, setId: set.id }, context);
  assert.equal(rows.length, method.contexts.length * method.scenarios.length * method.modes.length * R.SETS.length);
  await save();
  await writeFile(out + '/results.json', JSON.stringify({ registration: method, methodHash, rows }, null, 2));
  console.log(JSON.stringify({ complete: true, cells: rows.length, samples: method.count }));
} catch (error) { if (error !== pause) throw error; } finally { await vite.close(); }
