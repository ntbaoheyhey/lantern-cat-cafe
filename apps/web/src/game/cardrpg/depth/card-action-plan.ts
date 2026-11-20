import type { TurnEvent } from '@taskbar-hero/game-rules/src/squad/turn/types';
import { createActionPlan, EFFECT_REGISTRY, type EffectPlan } from '../../squad/turn3d/effects';
import { CARD_EFFECT_RECIPES } from '../../squad/turn3d/card-effect-data';

/** A preparation is resolved by its own event, never inferred from a skill name. */
export function chargeEvent(plan: Pick<EffectPlan, 'actorId' | 'events'>) {
  if (plan.events.some(event => event.type === 'damage' && event.actorId === plan.actorId)) return undefined;
  return plan.events.find(event => event.type === 'charge' && event.actorId === plan.actorId);
}

/** Presentation identities preserve the rules' skill IDs and existing mixer clips. */
export function createCardActionPlan(events: TurnEvent[], presentationId: string) {
  const effect = CARD_EFFECT_RECIPES[presentationId];
  if (!effect) return paceCardAction(createActionPlan(events), presentationId);
  const skillId = events.find(event => event.type === 'action_start')?.skillId ?? presentationId;
  const previous = EFFECT_REGISTRY[skillId] ?? EFFECT_REGISTRY.status_apply!;
  const plan = createActionPlan(events, { ...previous, name: effect.name,
    color: effect.color, accent: effect.accent, duration: effect.durations,
    shake: effect.shake, ultimate: effect.ultimate, motifs: effect.layers.map(layer => layer.primitive) });
  plan.presentationId = presentationId;
  return paceCardAction(plan, presentationId);
}

/** Keep the anticipation readable and fit all hit-stop/settle time inside the budget. */
function paceCardAction(plan: ReturnType<typeof createActionPlan>, identity: string) {
  const charge = chargeEvent(plan);
  if (charge) plan.name = charge.note || 'Charging the next strike';
  if (plan.events.some(event => event.note === 'Clutch heal')) {
    plan.beats[3]!.duration += 90;
    plan.duration += 90;
  }
  const limit = identity.startsWith('enemy:') ? 1400 : plan.ultimate ? 2800 : identity.endsWith('-1') ? 1200 : 1800;
  // Leave one display frame of headroom for the measured settle boundary.
  const authoredBudget = limit - 25;
  const fixed = plan.beats[0]!.duration + plan.beats[2]!.duration;
  const flexible = plan.duration - fixed;
  const scale = Math.min(1, (authoredBudget - fixed) / Math.max(1, flexible));
  let start = 0;
  for (const beat of plan.beats) {
    beat.start = start;
    if (beat.kind !== 'anticipation' && beat.kind !== 'impact') beat.duration = Math.floor(beat.duration * scale);
    start += beat.duration;
  }
  plan.duration = start;
  return plan;
}
