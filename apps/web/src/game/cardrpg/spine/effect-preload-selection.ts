import type {SceneView} from '../../squad/turn3d/scene';
import {chargeEvent} from '../depth/card-action-plan';

// These A6 enemy actions use the craft or V5 renderer. The legacy charge and
// explicit designer-override paths still need their painted atlas fallback.
const replacedEnemyAtlases = new Set([
  'needle-moth', 'teacup-healer', 'kettle-knight', 'yarn-giant', 'binding-thread',
]);

export function canNarrowBattleAtlases(view: SceneView): boolean {
  const battle = view.battleKey;
  return view.formationC2 === true && !view.galleryPreview && !view.model &&
    typeof battle === 'object' && battle !== null &&
    'formationC2' in battle && battle.formationC2 === true &&
    'gameplayA6' in battle && battle.gameplayA6 === true &&
    !(view.frame && chargeEvent(view.frame.plan));
}

interface PreparedEffects {
  ready: Promise<void>;
  overrides: {effects: ReadonlyMap<string, unknown>};
  prepare(owners: Iterable<string>, layered: boolean): Promise<void>;
}

/** Decide only after override decoding settles, before the scene is ready. */
export async function prepareBattleAtlases(
  effects: PreparedEffects, owners: readonly string[], layered: boolean, narrow: boolean,
): Promise<void> {
  await effects.ready;
  const selected = narrow && effects.overrides.effects.size === 0
    ? owners.filter(owner => !replacedEnemyAtlases.has(owner)) : owners;
  await effects.prepare(selected, layered);
}
