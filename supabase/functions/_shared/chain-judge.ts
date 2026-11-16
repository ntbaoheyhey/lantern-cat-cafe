import {ChainRequestError} from './chain-http.ts';
import { keccak256, toBytes, type Address, type Hex } from 'viem';
import { battleCats, createDepthAccount } from '../../../packages/game-rules/src/cardrpg/depth/state.ts';
import { createBattle } from '../../../packages/game-rules/src/cardrpg/depth/battle.ts';
import { playBattle } from '../../../packages/game-rules/src/cardrpg/depth/policies.ts';
import {setGameplayA6} from '../../../packages/game-rules/src/cardrpg/depth/gameplay-a6.ts';
import {setFormationC2} from '../../../packages/game-rules/src/cardrpg/depth/formation-c2.ts';
import { type VoucherSigner } from './relic.ts';

export interface JudgeEntitlement { id: string; relic_id: number; rarity_index: number; source: string }
export interface JudgeStore {
  reserve(player: string, wallet: string, ip: string, bossWon: boolean): Promise<JudgeEntitlement[]>;
}
/** A fixed starter encounter, executed by the real game rules on the server.
 * Client saves, claimed wins, seed, inventory and stats never enter this setup. */
export function judgeBoss() {
  const state = createDepthAccount(43113, 0);
  const battle = playBattle(createBattle({ seed: 43113, chapter: 1,
    cats: battleCats(state), enemies: ['yarn-giant'],
    enemyStats: {'yarn-giant': {hp: 320, attack: 12, defense: 3}},
  }), 'smart');
  return { won: battle.result === 'party', rounds: battle.round,
    log: battle.log.map(row => ({actor:row.actorId,target:row.targetId,kind:row.kind,amount:row.amount})),
  };
}
/** Public scripted trial, not a campaign save or future loot projection.
 * Uses catalog stats and current four-cat rules; LEARN/S3.md measures its replay.
 */
export function judgeTrial(finale=false) {
  const state=setFormationC2(setGameplayA6(createDepthAccount(43113,0),true));
  const battle=playBattle(createBattle({seed:43113,chapter:1,cats:battleCats(state),
    enemies:[finale?'yarn-giant':'button-guard'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true}), 'auto');
  return {won:battle.result==='party',rounds:battle.round,
    replay:{setup:battle.initial,choices:battle.choices},
    log:battle.log.map(row=>({actor:row.actorId,target:row.targetId,kind:row.kind,amount:row.amount})),
  };
}
export function createJudge({store,signer,nonceUsed,now = () => Date.now()}: {
  store: JudgeStore; signer: VoucherSigner; nonceUsed(nonce: bigint): Promise<boolean>; now?: () => number;
}) {
  return async (player: string, wallet: Address, ip: string, action: unknown) => {
    if (typeof action!=='string'||!['pass','boss','intro','finale'].includes(action)) throw new ChainRequestError('invalid_action');
    // Both guided challenges use the real catalog boss. A Guard/pass alone is
    // deliberately ineligible for the existing boss-gated café quest.
    const battle = action === 'boss' ? judgeBoss() : action==='intro'||action==='finale'?judgeTrial(true):undefined;
    if (battle && !battle.won) throw new Error('boss_not_won');
    const entitlements = await store.reserve(player,wallet.toLowerCase(),ip,!!battle?.won);
    const expiry = BigInt(Math.floor(now()/1000) + 600);
    const vouchers = await Promise.all(entitlements.map(async row => {
      // Separate namespace from the existing sequential forge nonces. A renewed
      // signature always shares this nonce: old and new can mint only once total.
      const nonce = BigInt(keccak256(toBytes(`taskbar-hero:judge:v1:${row.id}`)));
      const used = await nonceUsed(nonce);
      const fields = {player:wallet,relicId:BigInt(row.relic_id),rarity:row.rarity_index,nonce,expiry};
      return {...fields,signature:used ? '0x' as Hex : await signer.sign(fields),used,source:row.source};
    }));
    return {vouchers,battle};
  };
}
