// Local combat-only comparison. No account state or economic rewards.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, requireWeb, web } from './visual-support.mjs';

const { createServer } = await import(requireWeb.resolve('vite'));
const vite = await createServer({ configFile: false, root: web, envDir: false, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
try {
  const { createBattle, commandBattle, advanceBattle } = await vite.ssrLoadModule('../../packages/game-rules/src/squad/battle.ts');
  const rows = [];
  for (const preset of ['hearth', 'cinders']) for (let seed = 1; seed <= 12; seed++) {
    for (const tactic of ['protect', 'backline']) {
      let battle = commandBattle(createBattle({ preset, seed }), { type: 'tactic', tactic });
      while (battle.phase === 'fighting' || battle.phase === 'between') battle = advanceBattle(battle, 1000);
      const team = battle.actors.filter(a => a.side === 'hero');
      rows.push({ preset, seed, tactic, outcome: battle.phase, seconds: battle.tick / 20, survivors: team.filter(a => a.hp > 0).length, damageReceived: team.reduce((n, a) => n + a.received, 0), healing: team.reduce((n, a) => n + a.healing, 0) });
    }
  }
  assert(rows.filter(r => r.tactic === 'protect').every(r => r.outcome === 'won'), 'Full auto must complete both starter compositions');
  const comparisons = rows.filter(r => r.tactic === 'protect').map(auto => {
    const focus = rows.find(r => r.preset === auto.preset && r.seed === auto.seed && r.tactic === 'backline');
    return { preset: auto.preset, seed: auto.seed, secondsSaved: Number((auto.seconds - focus.seconds).toFixed(2)), damageAvoided: auto.damageReceived - focus.damageReceived };
  });
  assert(comparisons.some(r => r.damageAvoided !== 0 || r.secondsSaved !== 0), 'Target policy must affect resolved outcomes');
  const report = { note: '48 deterministic simulations; backline selects the support-priority preset at tick zero. This is a policy comparison, not a human playtest or a claim that active input always wins.', rows, comparisons };
  const out = resolve(root, 'reports/squad-combat'); mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, 'balance.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ runs: rows.length, wins: rows.filter(r => r.outcome === 'won').length, minSeconds: Math.min(...rows.map(r => r.seconds)), maxSeconds: Math.max(...rows.map(r => r.seconds)), changedComparisons: comparisons.filter(r => r.damageAvoided !== 0 || r.secondsSaved !== 0).length }, null, 2));
} finally { await vite.close(); }
