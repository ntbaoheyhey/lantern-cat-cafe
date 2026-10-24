import { GameApiErrorV2 } from './GameApiErrorV2';
import type { GameApiV2 } from './GameApiV2';

/** Calls onUnauthenticated once per rejected call before rethrowing the same error. */
export function withSessionGuardV2(api: GameApiV2, onUnauthenticated: () => void): GameApiV2 {
  const guard = <T>(p: Promise<T>): Promise<T> =>
    p.catch((e: unknown) => {
      if (e instanceof GameApiErrorV2 && e.code === 'unauthenticated') onUnauthenticated();
      throw e;
    });
  return {
    getState: () => guard(api.getState()),
    claim: () => guard(api.claim()),
    equip: (itemId, slot) => guard(api.equip(itemId, slot)),
    chooseClass: (classId) => guard(api.chooseClass(classId)),
    fightBoss: (chapter) => guard(api.fightBoss(chapter)),
    craft: (recipeId, slot) => guard(api.craft(recipeId, slot)),
    salvage: (itemIds) => guard(api.salvage(itemIds)),
    setLocked: (itemId, locked) => guard(api.setLocked(itemId, locked)),
    forgeRelic: () => guard(api.forgeRelic()),
  };
}
