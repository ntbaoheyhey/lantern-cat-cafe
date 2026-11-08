// REFERENCE: A5 B2. Reproduce the captured TRAIN exception through production public actions.
import { loadRules } from './a4-load.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const path = 'reports/cardrpg-big/a5/b2/scent-policy-crash-07/failure.json';
const bytes = await readFile(path), failure = JSON.parse(bytes), suite = await loadRules();
const R = await suite.load('packages/game-rules/src/cardrpg/depth/index.ts');
const json = value => JSON.parse(JSON.stringify(value));
try {
  assert.equal(failure.seed, 21); assert.equal(failure.scene, 5);
  const replay = R.replayBattle(failure.battle.initial, failure.battle.choices);
  assert.deepEqual(json(replay), failure.battle, 'Every pre-crash battle field must match');
  const before = json(replay), auto = R.chooseAction(replay, 'auto');
  assert.deepEqual(json(replay), before, 'Automatic preview must not mutate or consume RNG');
  assert.deepEqual(R.chooseAction(replay, 'auto'), auto);
  const legal = R.legalChoices(replay), outcomes = [];
  for (const choice of legal) {
    const candidate = structuredClone(replay);
    assert(R.act(candidate, choice));
    assert(candidate.actors.every(actor => Number.isFinite(actor.hp) && Number.isFinite(actor.shield)));
    outcomes.push({ choice, result: candidate.result });
  }
  const bad = failure.failing[0].choice, resolved = structuredClone(replay);
  assert(R.act(resolved, bad)); assert.equal(resolved.result, 'enemy');
  assert.deepEqual(json(R.replayBattle(replay.initial, [...replay.choices, bad])), json(resolved));
  await writeFile('reports/cardrpg-big/a5/b2/fatal-followup/checks.json', JSON.stringify({
    sourceReceipt: { path, sha256: createHash('sha256').update(bytes).digest('hex') },
    exactPrefixReplay: true, automaticPreviewImmutable: true, everyLegalActionResolves: true,
    fatalFollowupResult: resolved.result, fatalFollowupReplayExact: true, auto, outcomes,
  }, null, 2));
  console.log(JSON.stringify({ exactPrefixReplay: true, everyLegalActionResolves: outcomes.length, fatalFollowupResult: resolved.result }));
} finally { await suite.vite.close(); }
