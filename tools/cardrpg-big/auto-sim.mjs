import { loadRules } from '../cardrpg-sim/load.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
const { load, vite } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const { playRun } = await load('packages/game-rules/src/cardrpg/depth/run-bot.ts');
const phase = process.argv[2] || 'before';
const count = Number(process.env.BIG_SEEDS || 50);
const offset = Number(process.env.BIG_OFFSET || 0);
const rows = [];
try {
  for (const chapter of [1, 2, 3]) {
    const runs = [];
    for (let index = 1; index <= count; index++) {
      const seed = index + offset;
      let state = R.createDepthAccount(seed);
      state.cleared = Array.from({ length: chapter - 1 }, (_, i) => i + 1);
      if (R.automaticLoadouts) state.skills = R.automaticLoadouts(state);
      const begin = R.startRun(state, chapter, seed);
      if (!begin.ok) throw Error(begin.error);
      const encounters = [];
      const start = performance.now();
      const end = playRun(begin.state, 'auto', battle => encounters.push({ won: battle.result === 'party', actions: battle.choices.length, rounds: battle.round, logHash: createHash('sha256').update(JSON.stringify(battle.log)).digest('hex') }));
      runs.push({ seed, won: end.run.won, milliseconds: performance.now() - start, encounters });
    }
    rows.push({ chapter, count, wins: runs.filter(r => r.won).length, winRate: runs.filter(r => r.won).length / count, runs });
  }
} finally { await vite.close(); }
await mkdir('reports/cardrpg-big/sim', { recursive: true });
const result = { phase, count, offset, method: 'Actual seven-node campaign runs with starter cats and gear. Auto controller, existing safe route bot. Chapter access unlocked solely in fixture. Seeds shared across before/after.', rows };
await writeFile(`reports/cardrpg-big/sim/auto-${phase}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(rows.map(r => ({ ...r, runs: undefined }))));
