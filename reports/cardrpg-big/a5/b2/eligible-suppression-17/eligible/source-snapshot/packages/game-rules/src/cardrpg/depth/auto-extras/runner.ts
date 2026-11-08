import { currentActor } from '../battle';
import { chooseAction, playBattle, type Policy } from '../policies';
import type { Battle } from '../contract';
import { actAutoExtras, createAutoExtrasMemory, DEFAULT_AUTO_EXTRAS, type AutoExtrasOptions } from './index';

/** Compatible with playBattle; captures options once and owns fresh memory per fight. */
export function createAutoExtrasRunner(options: Readonly<AutoExtrasOptions> = DEFAULT_AUTO_EXTRAS) {
  const fixed = Object.freeze({ ...options });
  return (battle: Battle, policy: Policy, maxActions = 900): Battle => {
    if (!fixed.autoExtras) return playBattle(battle, policy, maxActions);
    const memory = createAutoExtrasMemory();
    for (let step = 0; step < maxActions && !battle.result; step++) {
      const choice = currentActor(battle)?.side === 'party' ? chooseAction(battle, policy) : undefined;
      if (!actAutoExtras(battle, memory, fixed, choice)) throw Error('Automatic experiment stalled');
    }
    if (!battle.result) throw Error('Automatic experiment exceeded its action bound');
    return battle;
  };
}
