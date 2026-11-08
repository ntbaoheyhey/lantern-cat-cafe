import starter from './starter-account.json';
import midgame from './midgame-account.json';
import nearHard from './pity-near-hard.json';
import reward from './battle-reward.json';
import type { AccountState, BattleRewardPayload } from '../contract';
/** Consumers clone before use. Generator and fixture tests validate these snapshots. */
export const STARTER_ACCOUNT = starter as AccountState;
export const MIDGAME_ACCOUNT = midgame as AccountState;
export const PITY_NEAR_HARD = nearHard as AccountState;
export const BATTLE_REWARD = reward as BattleRewardPayload;
export const FIXTURES = { starter: STARTER_ACCOUNT, midgame: MIDGAME_ACCOUNT, nearHard: PITY_NEAR_HARD, battleReward: BATTLE_REWARD };
