// REFERENCE: A5 B2 suppression15. Focused semantic regression, independent of win-rate gates.
import assert from 'node:assert/strict';
import { loadRules } from './a4-load.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const { load, vite, rules: C } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const checks = [];
try {
  for (const id of ['teacup-healer', 'button-guard']) for (const mode of [false, true])
    for (const scenario of ['quiet-signature', 'ordinary-signature', 'quiet-basic', 'drowsy-signature']) {
      const label = `${id}/${mode ? 'V4' : 'OFF'}/${scenario}`;
      try {
        const cat = R.CAT_BY_ID.mochi;
        const b = R.createBattle({ seed: 5, chapter: 1, gameplayV4: mode,
          cats: [{ id: cat.id, stats: { ...C.CARD_BY_ID.mochi.baseStats, hp: 10000 }, row: 'front', skills: cat.skills.slice(0,3).map(s=>s.id) }],
          enemies: [id] });
        while (R.currentActor(b)?.side === 'party') assert(R.act(b, R.legalChoices(b).find(c=>c.skillId==='defend')));
        const enemy = R.currentActor(b), intent = b.intents.find(i=>i.actorId===enemy.id);
        intent.signature = scenario !== 'quiet-basic'; enemy.hp -= 100; enemy.shield = 0;
        const quiet = scenario !== 'ordinary-signature';
        if (quiet) enemy.statuses.push({ id:'hush', stacks:1, remaining:2, source:'mochi', appliedRound:b.round });
        if (scenario === 'drowsy-signature') enemy.statuses.push({ id:'drowsy', stacks:1, remaining:2, source:'mochi', appliedRound:b.round });
        const turns = enemy.turns, offset = b.log.length;
        assert(R.enemyAct(b)); assert.equal(enemy.turns, turns+1);
        const events = b.log.slice(offset).filter(e=>e.actorId===enemy.id);
        const hits = events.filter(e=>['damage','absorbed'].includes(e.kind));
        if (scenario === 'quiet-signature' && mode) {
          assert.equal(hits.length, 0, 'Suppressed utility must not become a replacement attack');
          assert.equal(events.filter(e=>['heal','shield'].includes(e.kind)).length, 0);
          assert(events.some(e=>e.kind==='suppressed'));
        } else if (scenario === 'ordinary-signature') {
          assert.equal(hits.length, 0);
          assert(events.some(e=>e.kind===(id==='teacup-healer'?'heal':'shield')&&e.amount>0));
        } else {
          // OFF does not emit absorbed events; a shielded hit can log zero HP damage.
          assert(hits.length > 0, 'Ordinary/legacy/Drowsy attack must remain');
        }
        assert(events.some(e=>e.kind==='enemy-action'));
        checks.push({ label, passed:true });
      } catch (error) { checks.push({ label, passed:false, message:error.message }); }
    }
} finally { await vite.close(); }
const sourcePath = process.env.BIG_RULES_ROOT+'/packages/game-rules/src/cardrpg/depth/battle.ts';
const output = { sourcePath, sourceSha256:createHash('sha256').update(await readFile(sourcePath)).digest('hex'), checks };
if (process.env.A5_REGRESSION_OUT) await writeFile(process.env.A5_REGRESSION_OUT,JSON.stringify(output,null,2));
console.log(JSON.stringify(output));
if (checks.some(c=>!c.passed)) process.exitCode=1;
