import { describe, expect, it } from 'vitest';
import {
  ERROR_CODES_V2,
  HTTP_STATUS_V2,
  type BossFightResultV2,
  type ClaimResultV2,
  type CraftResultV2,
  type ForgeResultV2,
  type GameApiV2,
  type SalvageResultV2,
  type ServerStateV2,
} from './GameApiV2';

const notYet = (): never => {
  throw new Error('stub');
};

// Compile-time checks: both implementations (later cards) must be assignable to GameApiV2.
const mock = {
  getState: (): Promise<ServerStateV2> => notYet(),
  claim: (): Promise<ClaimResultV2> => notYet(),
  equip: (_itemId: string | null, _slot) => notYet() as Promise<ServerStateV2>,
  chooseClass: (_classId) => notYet() as Promise<ServerStateV2>,
  fightBoss: (_chapter: number): Promise<BossFightResultV2> => notYet(),
  craft: (_recipeId, _slot): Promise<CraftResultV2> => notYet(),
  salvage: (_itemIds: string[]): Promise<SalvageResultV2> => notYet(),
  setLocked: (_itemId: string, _locked: boolean): Promise<ServerStateV2> => notYet(),
  forgeRelic: (): Promise<ForgeResultV2> => notYet(),
} satisfies GameApiV2;

class SupabaseGameApiV2Stub implements GameApiV2 {
  getState = mock.getState;
  claim = mock.claim;
  equip = mock.equip;
  chooseClass = mock.chooseClass;
  fightBoss = mock.fightBoss;
  craft = mock.craft;
  salvage = mock.salvage;
  setLocked = mock.setLocked;
  forgeRelic = mock.forgeRelic;
}

describe('GameApiV2 contract', () => {
  it('is satisfied by the mock and Supabase stubs', () => {
    const impls: GameApiV2[] = [mock, new SupabaseGameApiV2Stub()];
    expect(impls).toHaveLength(2);
  });

  it('gives every error code an HTTP status in 400..599', () => {
    for (const code of ERROR_CODES_V2) expect(HTTP_STATUS_V2[code]).toBeGreaterThanOrEqual(400);
    expect(Object.keys(HTTP_STATUS_V2).sort()).toEqual([...ERROR_CODES_V2].sort());
  });
});
