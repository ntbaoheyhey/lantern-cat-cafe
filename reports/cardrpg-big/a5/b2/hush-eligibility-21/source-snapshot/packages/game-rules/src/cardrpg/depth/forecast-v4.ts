import { createBattle } from './battle';
import { playBattle } from './policies';
import { ENEMY_BY_ID } from './catalog';
import { enemyGuideV4 } from './gameplay-v4';
import type { BattleSetup } from './contract';

export interface ForecastV4 {
  band: 'Risky' | 'Even' | 'Favoured';
  risk: string;
  samples: 20;
  wins: number;
  firstFallen: string | null;
  computeMs: number;
}

/** Fixed training seeds only. No state is changed, no acceptance seed is sampled. */
export function forecastV4(setup: BattleSetup, now: () => number = Date.now): ForecastV4 {
  if (!setup.gameplayV4) throw Error('Forecast requires Gameplay v4.');
  const started = now();
  let wins = 0;
  const fallen = new Map<string, { name: string; count: number }>();
  for (let seed = 1; seed <= 20; seed++) {
    const battle = playBattle(createBattle({ ...setup, seed }), 'auto');
    if (battle.result === 'party') wins++;
    const first = battle.log.find(event => event.kind === 'defeat' && setup.cats.some(cat => cat.id === event.targetId));
    if (first) {
      const old = fallen.get(first.targetId);
      fallen.set(first.targetId, { name: battle.actors.find(actor => actor.id === first.targetId)!.name, count: (old?.count ?? 0) + 1 });
    }
  }
  const likely = [...fallen.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))[0];
  const enemy = setup.enemies.map(id => ENEMY_BY_ID[id]!).find(e => e.tier === 'boss') ?? ENEMY_BY_ID[setup.enemies[0]!]!;
  const danger = enemyGuideV4(enemy.id);
  const risk = likely ? `${likely[1].name} often falls first. ${danger.counter}` : `${enemy.name}: ${danger.intent}`;
  return { band: wins < 8 ? 'Risky' : wins < 15 ? 'Even' : 'Favoured', risk,
    samples: 20, wins, firstFallen: likely?.[0] ?? null, computeMs: now() - started };
}

export { forecastKeyV4 } from './forecast-key-v4';
