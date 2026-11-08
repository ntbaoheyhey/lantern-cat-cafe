// REFERENCE: A5 B2 hush-signature19. Controlled semantic fixtures, not earned progression.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadRules } from './a4-load.mjs';

const variant = process.argv[2]; assert(['before', 'after'].includes(variant));
const root = 'reports/cardrpg-big/a5/b2/hush-signature-19';
const method = JSON.parse(await readFile(root + '/REGISTERED-METHOD.json'));
const parent = JSON.parse(await readFile(method.parent));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const expected = variant === 'before' ? parent : method;
assert.equal(process.env.BIG_RULES_ROOT, expected.sourceRoot);
for (const [path, hash] of Object.entries(expected.source))
  assert.equal(sha(await readFile(expected.sourceRoot + '/' + path)), hash, path);
const { rules: C, load, vite } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const rows = [];
try {
  for (const enemyId of ['teacup-healer', 'button-guard', 'pollen-scout', 'yarn-giant', 'pantry-crown'])
    for (const gameplayV4 of [false, true]) for (const signature of [false, true])
      for (const control of ['none', 'hush', 'drowsy']) {
        const b = R.createBattle({ seed: 5, chapter: 1, gameplayV4,
          cats: ['inkcap', 'sorrel', 'brioche'].map(id => ({ id,
            stats: { ...C.CARD_BY_ID[id].baseStats, hp: 10000 }, row: R.CAT_BY_ID[id].row,
            skills: R.CAT_BY_ID[id].skills.slice(0, 3).map(skill => skill.id) })), enemies: [enemyId] });
        while (R.currentActor(b)?.side === 'party')
          assert(R.act(b, R.legalChoices(b).find(choice => choice.skillId === 'defend')));
        const enemy = R.currentActor(b), controller = b.actors.find(actor => actor.id === 'inkcap');
        b.intents.find(intent => intent.actorId === enemy.id).signature = signature;
        enemy.hp -= 100; enemy.phase = 2; enemy.shield = 0;
        controller.hp -= 50;
        if (control !== 'none') enemy.statuses.push({ id: control, stacks: 1,
          remaining: 2, source: controller.id, appliedRound: b.round });
        const offset = b.log.length, inputSha256 = sha(JSON.stringify(b));
        assert(R.enemyAct(b));
        const events = b.log.slice(offset);
        const suppressed = events.filter(event => event.kind === 'suppressed').length;
        const crewHeals = events.filter(event => event.kind === 'heal' && event.actorId === controller.id
          && event.targetId === controller.id).reduce((sum, event) => sum + event.amount, 0);
        const expectedSuppression = gameplayV4 && (control === 'drowsy' || control === 'hush' && signature);
        const hits = events.filter(event => event.actorId === enemy.id && ['damage', 'absorbed'].includes(event.kind));
        const silentUtility = gameplayV4 && signature && control === 'hush' && ['teacup-healer', 'button-guard'].includes(enemyId);
        const shouldAttack = silentUtility ? false : control !== 'none' || !['teacup-healer', 'button-guard'].includes(enemyId)
          || gameplayV4 && !signature;
        const checks = { eventMatchesActualSuppression: suppressed === Number(expectedSuppression),
          crewHealOnlyAfterSuppression: crewHeals === (expectedSuppression ? 8 : 0),
          attackBranchPreserved: (hits.length > 0) === shouldAttack };
        rows.push({ enemyId, gameplayV4, signature, control, inputSha256, suppressed, crewHeals,
          hits: hits.map(({ targetId, kind, amount }) => ({ targetId, kind, amount })), checks, events });
      }
} finally { await vite.close(); }
assert.equal(rows.length, 60);
const failures = rows.filter(row => Object.values(row.checks).some(pass => !pass));
const report = { variant, source: expected.source, methodSha256: sha(JSON.stringify(method)),
  scope: '60 controlled seed5 fixtures; no earned-resource, win-rate or acceptance claim.',
  total: rows.length, pass: rows.length - failures.length, failures: failures.map(({ enemyId, gameplayV4, signature, control, checks }) =>
    ({ enemyId, gameplayV4, signature, control, checks })), rows };
await writeFile(`${root}/${variant}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ variant, total: report.total, pass: report.pass, failures: report.failures }));
process.exitCode = failures.length ? 1 : 0;
