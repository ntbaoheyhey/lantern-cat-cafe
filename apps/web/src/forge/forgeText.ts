import { CONFIG, relicOdds, type ForgeBlock, type Rarity } from '@taskbar-hero/game-rules';
import type { RelicVoucher } from '../api/GameApi';
import { DEMO_SIGNATURE } from '../api/MockGameApi';
import { capitalize, LABELS } from '../theme/labels';

/** Friendly text for why forging is blocked. */
export function blockText(block: ForgeBlock, shards: number): string {
  switch (block) {
    case 'daily_limit':
      return `You already forged today's Relic. Come back after ${LABELS.resetTime()}.`;
    case 'no_boss_key':
      return `You need a ${LABELS.bossKey}. Win a boss fight to earn one.`;
    case 'not_enough_shards':
      return `You need ${CONFIG.relic.shardCost} ${LABELS.shards} (you have ${shards.toLocaleString('en-US')}).`;
  }
}

/** Relic odds as display rows, lowest rarity first. */
export function oddsRows(): { rarity: Rarity; percent: string }[] {
  const odds = relicOdds();
  return CONFIG.rarities.map((rarity) => ({ rarity, percent: `${Math.round(odds[rarity] * 1000) / 10}%` }));
}

/** Demo vouchers (MockGameApi) carry a dummy signature and must never reach a wallet. */
export function isDemoVoucher(v: RelicVoucher): boolean {
  return v.signature === DEMO_SIGNATURE;
}

/** RelicNFT.mint arguments: uint256 fields as bigint, rarity as a number (uint8). */
export function mintArgs(v: RelicVoucher) {
  return [
    {
      player: v.player,
      relicId: BigInt(v.relicId),
      rarity: v.rarity,
      nonce: BigInt(v.nonce),
      expiry: BigInt(v.expiry),
    },
    v.signature,
  ] as const;
}

/** True when the wallet user declined the request (EIP-1193 code 4001 / viem UserRejectedRequestError). */
export function isUserRejection(e: unknown): boolean {
  for (let cur: unknown = e, depth = 0; cur && depth < 5; depth++) {
    const err = cur as { name?: string; code?: number; cause?: unknown };
    if (err.name === 'UserRejectedRequestError' || err.code === 4001) return true;
    cur = err.cause;
  }
  return false;
}

/** Cat name of a Relic by rarity (Paw Charm, Silver Bell, ...). */
export function relicName(rarity: string): string {
  return LABELS.relics[rarity as Rarity] ?? capitalize(rarity);
}

export { capitalize } from '../theme/labels';
