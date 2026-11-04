import { v2 } from '@taskbar-hero/game-rules';
import { chapterJourney } from '@taskbar-hero/game-rules/src/gameplay';
import type { ServerStateV2 } from '../api/GameApiV2';
import { bossGateStatus } from '../layout/boss/bossGate';
import { equipBest } from '../layout/bag/equipRules';
export function journeyGoals(state: ServerStateV2) {
  const p = state.progress, journey = chapterJourney(p.chapter, p.round, p.kills);
  const gate = bossGateStatus(state, p.chapter, state.serverTime);
  const upgrades = equipBest(state).length;
  const now = p.gated ? { text: 'Compare gear to pass this power wall', screen: 'bag' as const }
    : upgrades ? { text: `Compare ${upgrades} gear upgrade${upgrades === 1 ? '' : 's'}`, screen: 'bag' as const }
    : gate.kind === 'ready' ? { text: 'Challenge the household boss', screen: 'map' as const }
    : { text: `Clear round ${p.round} · ${Math.max(0, p.killsPerRound - p.kills)} foes left`, screen: 'home' as const };
  const soon = gate.kind === 'cooldown' ? `Retry after ${gate.secondsLeft}s · your key was kept`
    : gate.kind === 'no_key' ? 'Boss reached · a Cat Key is needed'
    : gate.kind === 'ready' ? 'Boss ready · losses keep your key'
    : `${journey.remaining} foes to the chapter boss`;
  const next = v2.CHAPTERS.find(c => c.index === p.chapter + 1);
  return { now, soon, later: next ? `Unlock ${next.name}` : 'Collect Moon Pearl for a Cat Relic', journey };
}
