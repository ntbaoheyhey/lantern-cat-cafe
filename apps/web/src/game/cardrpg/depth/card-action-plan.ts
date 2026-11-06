import type { TurnEvent } from '@taskbar-hero/game-rules/src/squad/turn/types';
import { createActionPlan, EFFECT_REGISTRY } from '../../squad/turn3d/effects';
import { CARD_EFFECT_RECIPES } from '../../squad/turn3d/card-effect-data';

/** Presentation identities preserve the rules' skill IDs and existing mixer clips. */
export function createCardActionPlan(events: TurnEvent[], presentationId: string) {
  const effect = CARD_EFFECT_RECIPES[presentationId];
  if (!effect) return createActionPlan(events);
  const skillId = events.find(event => event.type === 'action_start')?.skillId ?? presentationId;
  const previous = EFFECT_REGISTRY[skillId] ?? EFFECT_REGISTRY.status_apply!;
  const plan = createActionPlan(events, { ...previous, name: effect.name,
    color: effect.color, accent: effect.accent, duration: effect.durations,
    shake: effect.shake, ultimate: effect.ultimate, motifs: effect.layers.map(layer => layer.primitive) });
  plan.presentationId = presentationId;
  return plan;
}
