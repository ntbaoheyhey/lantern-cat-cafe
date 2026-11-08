import type { Battle } from './contract';
import type { CrewJob, StandingPlan } from './gameplay-v4';

/** Presentation data only: consumers cannot resolve combat or spend rewards. */
export type GameplayEventPayload =
  | { kind: 'crew-active'; crew: CrewJob; marks: number; contributors: string[]; threshold: 2 | 4; text: string }
  | { kind: 'formation-cover'; amount: number; text: string }
  | { kind: 'plan-target'; plan: StandingPlan; reason: string; text: string }
  | { kind: 'gear-trigger'; templateId: string; effect: string; amount: number; text: string }
  | { kind: 'boss-phase'; bossId: string; from: number; to: number; threshold: number; text: string }
  | { kind: 'boss-finish'; bossId: string; retiredIds: string[]; outcome: 'party' | 'enemy'; text: string }
  | { kind: 'earned-reveal'; bannerId: string; draw: number; itemId: string; rarity: string; duplicate: number; pityBefore: number; pityAfter: number; text: string };
export type GameplayEventV4 = GameplayEventPayload & {
  version: 1; sequence: number; round: number; actorId?: string; targetId?: string;
};
export function emitGameplayEvent(battle: Battle, event: GameplayEventPayload & { actorId?: string; targetId?: string }): void {
  if (!battle.v4) return;
  battle.v4.events.push({ ...event, version: 1, sequence: battle.v4.events.length, round: battle.round });
}
export function battleReasons(battle: Battle): string[] {
  if (!battle.v4) return [];
  const reasons: string[] = [];
  const cover = battle.v4.events.reduce((n, e) => n + (e.kind === 'formation-cover' ? e.amount : 0), 0);
  if (cover) reasons.push(`Front-row cover prevented ${cover} direct damage to the back row.`);
  const shields = battle.log.filter(e => e.kind === 'absorbed' && battle.actors.some(a => a.id === e.targetId && a.side === 'party')).reduce((n, e) => n + e.amount, 0);
  if (shields) reasons.push(`Your shields absorbed ${shields} damage before it reached HP.`);
  const suppressed = battle.log.filter(e => e.kind === 'suppressed');
  if (suppressed.length) reasons.push(`Your control softened or stopped ${suppressed.length} enemy utility actions.`);
  const gear = battle.v4.events.find(e => e.kind === 'gear-trigger' && e.amount > 0);
  if (gear) reasons.push(gear.text);
  const healing = battle.log.filter(e => e.kind === 'heal' && battle.actors.some(a => a.id === e.targetId && a.side === 'party')).reduce((n, e) => n + e.amount, 0);
  if (healing) reasons.push(`The crew restored ${healing} missing HP.`);
  if (!reasons.length) reasons.push('Direct attacks and current health decided this encounter; no protection contribution was recorded.');
  return reasons.slice(0, 3);
}

/** Version 2 earned discoveries have no draw, banner or pity fields. Version 1 receipts remain readable. */
export interface DiscoveryRevealV4 {
  version: 2; kind: 'earned-reveal'; sequence: number; round: 0;
  discovery: { kind: 'crew' | 'set' | 'rank' | 'legendary' | 'stars'; id: string };
  itemId: string; text: string;
}
