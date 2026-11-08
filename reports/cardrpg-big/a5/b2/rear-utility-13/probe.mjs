// REFERENCE: A5 B1/B2. Registered TRAIN diagnostic of eligible single-carrier set contexts.
import { loadRules } from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs';
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
function battle(seed, context, scene, setId, mode, variant) {
  const input = setup(seed, context, setId, mode), scenario = method.scenarios[scene];
  const carrier = input.cats.find(cat => cat.id === context.carrier);
  if (['no-reach', 'neither'].includes(variant)) carrier.effects = carrier.effects.filter(effect => effect !== 'pierce-row');
  if (['no-four', 'shield-only', 'neither'].includes(variant)) carrier.effects = carrier.effects.filter(effect => effect !== 'opening-decoy');
  if (variant === 'shield-only') carrier.bonuses.openingShield = (carrier.bonuses.openingShield ?? 0) + 12;
  if (variant === 'no-spores') carrier.skills = carrier.skills.filter(skill => skill !== 'inkcap-2');
  const b = R.playBattle(R.createBattle({ seed, chapter: scenario.chapter, cats: input.cats,
    enemies: scenario.enemies, gameplayV4: true, challengeLevel: 6, enemyStats: scenario.enemyStats,
    plan: context.plan }), 'auto');
  assert.deepEqual(b.initial.plan, context.plan);
  if (seed === 1) assert.deepEqual(R.replayBattle(b.initial, b.choices), b);
  const actor = b.actors.find(cat => cat.id === context.carrier);
  const scald = b.log.filter(event => event.actorId === context.carrier && event.kind === 'status' && event.text === R.STATUS_BY_ID.scald.name).length;
  const gear = b.v4.events.filter(event => event.kind === 'gear-trigger' && event.actorId === context.carrier);
  const actions = b.choices.filter(choice => choice.actorId === context.carrier);
  return { battle: b, won: b.result === 'party', rounds: b.round, scald, gear, actions, ratio: input.ratio,
    utility: input.utility, referenceUtility: input.referenceUtility, carrierHp: actor.hp,
    skills: input.cats.find(cat => cat.id === context.carrier).skills };
}


const originalBytes = await readFile(method.original.path);
assert.equal(sha(originalBytes), method.original.sha256);
const original = new Map(JSON.parse(originalBytes).rows.map(row => [row.key, row]));
const rows = [], examples = [];
try {
  const context = method.contexts.find(context => context.id === 'rear-suppression');
  for (const mode of method.modes) for (const variant of method.variants) {
    const row = { mode, variant, outcomes: '', actions: {}, rounds: 0, suppressed: 0, traces: [] };
    for (let seed = 1; seed <= method.count; seed++) {
      const result = battle(seed, context, 5, 'velvetrim', mode, variant);
      row.outcomes += result.won ? '1' : '0'; row.rounds += result.rounds;
      for (const action of result.actions) {
        const key = action.skillId + '/' + action.targetId;
        row.actions[key] = (row.actions[key] ?? 0) + 1;
      }
      row.suppressed += result.battle.log.filter(event => event.kind === 'suppressed').length;
      if (variant === 'full') {
        const key = JSON.stringify({ context:context.id, scene:5, mode, setId:'velvetrim' });
        assert.equal(row.outcomes.at(-1), original.get(key).outcomes[seed-1], 'Full arm exact previous outcome');
      }
      if (seed === 1) examples.push({ mode, variant, battle: result.battle });
    }
    row.wins = [...row.outcomes].filter(code => code === '1').length;
    row.digest = sha(row.outcomes); rows.push(row);
  }
  await writeFile(out + '/results.json', JSON.stringify({ registration:method, methodHash:sha(JSON.stringify(method)), rows },null,2));
  await writeFile(out + '/seed1-replays.json', JSON.stringify(examples,null,2));
  console.log(JSON.stringify(rows.map(({ mode,variant,wins,rounds,suppressed }) => ({ mode,variant,wins,rounds,suppressed }))));
} finally { await vite.close(); }
