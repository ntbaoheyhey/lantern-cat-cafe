import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, web, requireWeb } from './visual-support.mjs';
const { createServer } = await import(requireWeb.resolve('vite'));
const vite = await createServer({ configFile: false, root: web, envDir: false, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
try {
  const { createBattle, advanceBattle, commandBattle, replayBattle, exportReplay } = await vite.ssrLoadModule('../../packages/game-rules/src/squad/battle.ts');
  const rows = [];
  for (const preset of ['hearth', 'cinders', 'hunters']) for (const scenario of ['patrol', 'vacuum']) for (const route of scenario === 'patrol' ? ['safe', 'supplies', 'challenge'] : ['safe']) for (let seed = 1; seed <= 12; seed++) {
    for (const tactic of ['protect', 'backline']) {
      const battle = advanceBattle(commandBattle(createBattle({ preset, scenario, route, seed }), { type: 'tactic', tactic }), 180000);
      const replayed = replayBattle(exportReplay(battle)); assert.deepEqual(replayed, battle);
      rows.push({ preset, scenario, route, seed, tactic, outcome: battle.phase, seconds: battle.tick / 20, survivors: battle.actors.filter(a => a.side === 'hero' && a.hp > 0).length });
    }
  }
  const summary = { runs: rows.length, wins: rows.filter(x => x.outcome === 'won').length, minSeconds: Math.min(...rows.map(x => x.seconds)), maxSeconds: Math.max(...rows.map(x => x.seconds)), bySquad: Object.fromEntries(['hearth', 'cinders', 'hunters'].map(p => [p, { wins: rows.filter(x => x.preset === p && x.outcome === 'won').length, runs: rows.filter(x => x.preset === p).length }])) };
  assert(rows.filter(x => x.scenario === 'patrol' && x.route === 'safe' && x.tactic === 'protect').every(x => x.outcome === 'won'));
  writeFileSync(resolve(root, 'reports/squad-progression/balance.json'), JSON.stringify({ summary, note: 'Level 1, starter equipment, deterministic simulations. This is not human playtesting.', rows }, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally { await vite.close(); }
