/** Read-only compatibility with A's optional events-v4 version 1 contract.
 * No rules import: older battles and unknown future versions stay unchanged. */
export interface PresentationEventV4 {
  version: 1; sequence: number; round: number; kind: string; text: string;
  actorId?: string; targetId?: string;
  crew?: string; marks?: number; threshold?: number; contributors?: string[];
  bossId?: string; from?: number; to?: number; retiredIds?: string[];
  bannerId?: string; draw?: number; itemId?: string; rarity?: string;
  duplicate?: number; pityBefore?: number; pityAfter?: number;
}
export interface PresentationV4 {
  version: 1; plan: { focus: string; care: string }; events: PresentationEventV4[];
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object';
const ordinal = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
export function presentationEventV4(value: unknown): value is PresentationEventV4 {
  if (!object(value) || value.version !== 1 || !ordinal(value.sequence)
    || !ordinal(value.round) || typeof value.kind !== 'string' || typeof value.text !== 'string') return false;
  if (value.kind === 'crew-active') return ['door', 'kettle', 'table', 'lantern'].includes(String(value.crew))
    && ordinal(value.marks) && [2, 4].includes(value.threshold as number)
    && Array.isArray(value.contributors) && value.contributors.every(id => typeof id === 'string');
  if (value.kind === 'boss-phase') return typeof value.bossId === 'string' && ordinal(value.from)
    && ordinal(value.to) && typeof value.threshold === 'number' && Number.isFinite(value.threshold);
  if (value.kind === 'boss-finish') return typeof value.bossId === 'string'
    && Array.isArray(value.retiredIds) && value.retiredIds.every(id => typeof id === 'string');
  return true;
}
export function presentationV4(battle: unknown): PresentationV4 | undefined {
  if (!object(battle) || !object(battle.v4)) return;
  const value = battle.v4;
  if (value.version !== 1 || !object(value.plan) || typeof value.plan.focus !== 'string'
    || typeof value.plan.care !== 'string' || !Array.isArray(value.events)) return;
  return { version: 1, plan: { focus: value.plan.focus, care: value.plan.care }, events: value.events.filter(presentationEventV4) };
}
const focusNames: Record<string, string> = { finish: 'Finish injured foes', support: 'Focus support', leader: 'Focus the leader' };
const careNames: Record<string, string> = { steady: 'Steady care', protect: 'Protect the crew' };
export function standingPlanText(v4: PresentationV4) {
  return `${focusNames[v4.plan.focus] ?? 'Automatic focus'} · ${careNames[v4.plan.care] ?? 'Automatic care'}`;
}
export function skillReadinessV4(actor: { turns: number; cooldowns: Record<string, number>; passiveUsed: boolean },
  skill: { id: string; type: string; effects: readonly { kind: string }[] }) {
  if (skill.effects.some(effect => effect.kind === 'revive') && actor.passiveUsed) return 'Used this battle';
  const remaining = Math.max(actor.cooldowns[skill.id] ?? 0, skill.type === 'ultimate' ? 2 - actor.turns : 0);
  return remaining > 0 ? `${remaining} turn${remaining === 1 ? '' : 's'}` : 'Ready';
}
export const V4_CUE_MS = { 'boss-phase': 400, 'boss-finish': 800 } as const;
/** The cue borrows the current action's remaining time. Pause/speed/skip use
 * the existing action clock; this function cannot add playback time. */
export function bossCueV4(events: readonly PresentationEventV4[], elapsed: number, impact: number, duration: number) {
  if (elapsed < impact || elapsed >= duration) return;
  let event: PresentationEventV4 | undefined;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i]!.kind === 'boss-finish' || events[i]!.kind === 'boss-phase') { event = events[i]; break; }
  }
  if (!event) return;
  const end = Math.min(duration, impact + V4_CUE_MS[event.kind as keyof typeof V4_CUE_MS]);
  return elapsed < end ? { event, endsAt: end, duration: end - impact } : undefined;
}
export function earnedRevealV4(value: unknown) {
  if (!presentationEventV4(value) || value.kind !== 'earned-reveal' || typeof value.itemId !== 'string'
    || !value.itemId || typeof value.bannerId !== 'string' || !value.bannerId || !ordinal(value.draw)
    || value.draw < 1 || typeof value.rarity !== 'string' || !ordinal(value.duplicate)) return;
  return { key: `${value.bannerId}/${value.draw}/${value.sequence}`, itemId: value.itemId,
    rarity: value.rarity, duplicate: value.duplicate, text: value.text };
}
