// REFERENCE: PROMPT-A5 B1. Read-only, TRAIN-only counterfactuals at the six saved cliff replays.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadRules } from './a4-load.mjs';

const out = 'reports/cardrpg-big/a5/b1/fatal-choices-32';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const method = JSON.parse(await readFile(`${out}/REGISTERED-METHOD.json`));
assert.equal(process.env.BIG_RULES_ROOT, method.sourceRoot);
for (const [path, digest] of Object.entries(method.source))
  assert.equal(sha(await readFile(`${method.sourceRoot}/${path}`)), digest, path);
assert.equal(sha(await readFile('tools/cardrpg-big/a5-fatal-choice-audit.mjs')), method.runnerSha256);
const { load, vite } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const examples = [];
try {
  for (const input of method.inputs) {
    const bytes = await readFile(input.path);
    assert.equal(sha(bytes), input.sha256);
    const saved = JSON.parse(bytes), original = saved.before;
    assert(saved.seed >= 1 && saved.seed <= 50);
    assert.deepEqual(JSON.parse(JSON.stringify(R.replayBattle(original.initial, original.choices))), original);
    const firstDeath = original.log.find(e => e.kind === 'defeat' && original.initial.cats.some(c => c.id === e.targetId));
    assert(firstDeath);
    const battle = R.createBattle(original.initial), decisions = [];
    let cursor = 0;
    while (!battle.result) {
      if (R.currentActor(battle)?.side === 'enemy') {
        assert(R.enemyAct(battle));
        if (battle.log.some(e => e.kind === 'defeat' && e.targetId === firstDeath.targetId)) break;
        continue;
      }
      const chosen = R.chooseAction(battle, 'auto');
      assert.deepEqual(chosen, original.choices[cursor]);
      if (battle.round === firstDeath.round) {
        const initialDigest = sha(JSON.stringify(battle)), alternatives = [];
        for (const choice of R.legalChoices(battle)) {
          const next = structuredClone(battle), round = battle.round;
          assert(R.act(next, choice));
          while (!next.result && next.round === round) {
            if (R.currentActor(next)?.side === 'enemy') assert(R.enemyAct(next));
            else assert(R.act(next, R.chooseAction(next, 'auto')));
          }
          const endRound = next.actors.filter(a => a.side === 'party').map(a => ({id:a.id,hp:a.hp,shield:a.shield}));
          R.playBattle(next, 'auto');
          assert.deepEqual(R.replayBattle(next.initial, next.choices), next);
          alternatives.push({choice, selected: JSON.stringify(choice) === JSON.stringify(chosen), endRound,
            firstVictimSurvivesRound: endRound.find(a => a.id === firstDeath.targetId).hp > 0,
            won: next.result === 'party', rounds: next.round, choiceCount: next.choices.length,
            replaySha256: sha(JSON.stringify(next)), choices: next.choices});
        }
        assert.equal(sha(JSON.stringify(battle)), initialDigest, 'Counterfactuals mutated their input');
        const selected = alternatives.find(a => a.selected);
        assert(selected); assert.equal(selected.replaySha256, sha(JSON.stringify(original)));
        decisions.push({index:cursor, actorId:chosen.actorId, round:battle.round, initialDigest,
          chosen, alternatives, canPreventDeath:alternatives.some(a => a.firstVictimSurvivesRound),
          canWin: alternatives.some(a => a.won)});
      }
      assert(R.act(battle, chosen)); cursor++;
    }
    assert(decisions.length);
    examples.push({path:input.path, key:saved.key, seed:saved.seed, firstDeath, decisions});
  }
} finally { await vite.close(); }
const summary = examples.map(e => ({key:e.key, seed:e.seed, death:e.firstDeath.targetId, round:e.firstDeath.round,
  decisions:e.decisions.length, alternatives:e.decisions.reduce((n,d) => n+d.alternatives.length,0),
  preventable:e.decisions.some(d => d.canPreventDeath), winnable:e.decisions.some(d => d.canWin),
  alternativesWinning:e.decisions.flatMap(d => d.alternatives).filter(a => a.won).length}));
await writeFile(`${out}/results.json`, JSON.stringify({methodSha256:sha(JSON.stringify(method)), summary, examples},null,2));
console.log(JSON.stringify(summary));
