// REFERENCE: PROMPT-A5 B2/C1. Copy-only regression on TRAIN1,11,50; no balance sampling.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const out = 'reports/cardrpg-big/a5/c1-specialties/replay';
await mkdir(out, { recursive: true });
const sha = data => createHash('sha256').update(data).digest('hex');
const reg = JSON.parse(await readFile('reports/cardrpg-big/a5/b2/hush-eligibility-22/REGISTERED-METHOD.json', 'utf8'));
const draft = JSON.parse(await readFile('tools/cardrpg-big/a5-drafts/specialties-23/manifest.json', 'utf8'));
for (const [path, expected] of Object.entries(reg.combatSource)) {
  assert.equal(sha(await readFile(`${reg.sourceRoot}/${path}`)), expected);
  assert.equal(sha(await readFile(path)), draft.outputs[path] ?? expected, path);
}
process.env.BIG_RULES_ROOT = reg.sourceRoot;
const beforeLoader = await import('./a4-load.mjs?specialties-before');
const before = await beforeLoader.loadRules();
delete process.env.BIG_RULES_ROOT;
const afterLoader = await import('./a4-load.mjs?specialties-after');
const after = await afterLoader.loadRules();
const rows = [];
try {
  const B = await before.load('packages/game-rules/src/cardrpg/depth/index.ts');
  const A = await after.load('packages/game-rules/src/cardrpg/depth/index.ts');
  const oldLine = `Lantern team: ${B.CREW_JOBS.find(job => job.id === 'lantern').full}.`;
  const newLine = `Lantern team: ${A.CREW_JOBS.find(job => job.id === 'lantern').full}.`;
  let copyEvents = 0;
  for (const cat of B.CATS) for (const seed of [1, 11, 50]) for (const chapter of [1, 2, 3]) for (const v4 of [false, true]) {
    const team = [cat.id, ...['mochi', 'velvet', 'inkcap'].filter(id => id !== cat.id).slice(0, 2)];
    // Explicit level-six synthetic battle fixture; no resource or earned-route claim.
    const state = B.setGameplayV4(B.createDepthAccount(seed, 0), v4);
    state.account.cards = team.map(id => ({ id, cardId: id, level: 6, stars: 1, shards: 0, soulbound: true }));
    state.team = team; state.gear = []; state.equipment = {};
    for (const id of team) { state.rows[id] = B.CAT_BY_ID[id].row; state.skills[id] = B.defaultSkills(state, id); }
    if (!team.some(id => state.rows[id] === 'front')) state.rows[team[0]] = 'front';
    const setup = { seed, chapter, cats: B.battleCats(state), enemies: [B.CHAPTERS[chapter - 1].boss],
      gameplayV4: v4, challengeLevel: 6 };
    const old = B.playBattle(B.createBattle(setup), 'auto');
    const next = A.playBattle(A.createBattle(setup), 'auto');
    const normalized = structuredClone(next);
    for (const event of normalized.v4?.events ?? []) {
      if (event.kind === 'crew-active' && event.crew === 'lantern' && event.threshold === 4) {
        assert.equal(event.text, newLine); event.text = oldLine; copyEvents++;
      }
    }
    assert.deepEqual(normalized, old, JSON.stringify({ cat: cat.id, seed, chapter, v4 }));
    rows.push({ cat: cat.id, seed, chapter, v4, result: next.result,
      normalizedSha256: sha(JSON.stringify(normalized)), originalSha256: sha(JSON.stringify(old)) });
  }
  assert.equal(rows.length, 216);
  assert(copyEvents > 0, 'Exercise full-Lantern crews as well as other thresholds');
  assert.equal(A.CAT_SPECIALTIES_V4 && Object.keys(A.CAT_SPECIALTIES_V4).length, 12);
  await writeFile(`${out}/checks.json`, JSON.stringify({ passed: true,
    method: '216 paired complete automatic battle objects; only the exact full-Lantern crew description may differ. TRAIN1,11,50. Synthetic fixtures, not balance or earned progression.',
    beforeSource: reg.combatSource, afterSource: { ...reg.combatSource, ...Object.fromEntries(Object.entries(draft.outputs).filter(([p]) => p in reg.combatSource)) },
    allowedText: { before: oldLine, after: newLine, events: copyEvents }, rows }, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, battles: rows.length, copyEvents }));
} finally { await before.vite.close(); await after.vite.close(); }
