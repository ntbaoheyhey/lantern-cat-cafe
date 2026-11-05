// Pure simulation only; no account, renderer, saved game or network.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
const root = resolve(import.meta.dirname, '..');
const req = createRequire(resolve(root, 'apps/web/package.json'));
const { createServer } = await import(req.resolve('vite'));
const vite = await createServer({ configFile: false, root, envDir: false,
  server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
try {
  const { createBattle, step, queueCommand, has, HEROES } = await vite.ssrLoadModule('/packages/game-rules/src/squad/index.ts');
  const rows = [], runs = [];
  for (const encounter of ['patrol', 'boss']) for (const preset of ['hearthkeepers', 'lanternbreakers']) for (const policy of ['auto', 'active']) {
    const batch = [];
    for (let seed = 1; seed <= 20; seed++) {
      const b = createBattle({ seed, preset, encounter });
      let lowestHp = 1;
      while (!b.result) {
        if (policy === 'active' && b.tick % 10 === 0) {
          const enemies = b.actors.filter(a => a.side === 'enemy' && a.hp > 0);
          const boss = enemies.find(a => a.role === 'yarn');
          const target = enemies.find(a => a.role === 'healer')
            ?? enemies.find(a => a.role === 'thread')
            ?? (boss && has(boss, 'exposed') ? boss : undefined)
            ?? boss;
          if ((target?.id ?? null) !== b.priority) queueCommand(b, { type: 'priority', target: target?.id ?? null });

        }
        step(b);
        for (const a of b.actors.filter(a => a.side === 'party')) lowestHp = Math.min(lowestHp, a.hp / a.maxHp);
      }
      const result = { ...b.result, lowestHp, enraged: b.enraged };
      batch.push(result); runs.push({ encounter, preset, policy, seed, ...result, commands: b.commands.length });
    }
    const wins = batch.filter(r => r.winner === 'party');
    const mean = arr => arr.length ? +(arr.reduce((a, z) => a + z, 0) / arr.length).toFixed(2) : null;
    rows.push({ encounter, preset, policy, seeds: 20, wins: wins.length, winRate: wins.length / 20,
      meanClearSeconds: mean(wins.map(r => r.durationMs / 1000)), minSeconds: Math.min(...batch.map(r => r.durationMs)) / 1000,
      maxSeconds: Math.max(...batch.map(r => r.durationMs)) / 1000, totalDeaths: batch.reduce((n, r) => n + r.deaths.length, 0),
      meanLowestHp: mean(batch.map(r => r.lowestHp)), enragedRuns: batch.filter(r => r.enraged).length,
      firstDeaths: Object.fromEntries(HEROES.map(h => [h, batch.filter(r => r.firstDeath === h).length])) });
  }
  mkdirSync(resolve(root, 'reports/squad'), { recursive: true });
  writeFileSync(resolve(root, 'reports/squad/balance.json'), JSON.stringify({ date: '2026-11-05', model: 'Pure deterministic simulation; no human playtest', policy: 'active-priority: mark healer, then binding thread, then boss; ultimates remain on the same auto policy in both arms', rows, runs }, null, 2) + '\n');
  console.table(rows);
} finally { await vite.close(); }
