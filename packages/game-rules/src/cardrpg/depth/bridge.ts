import { CONFIG } from '../../config';
import { SCARCITY } from '../catalog';
import { CARD_RPG_CONFIG } from '../config';
import { integer, requireRule } from '../internal';
import { metaCommand, requireHome, transactDepth } from './state';
import type { DepthAccount } from './contract';

export const FUJI_RELIC_ADDRESS = '0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D' as const;
export const RELIC_EFFECTS = [
  { id: 1, rarity: 0, name: 'Common service cup', bonus: 'openingShield', value: 12, description: 'Begin each battle with 12 shield.' },
  { id: 2, rarity: 1, name: 'Rare mending cup', bonus: 'roundHeal', value: 3, description: 'Restore 3 HP at the start of each round.' },
  { id: 3, rarity: 2, name: 'Epic ringing cup', bonus: 'counterPower', value: 4, description: 'Saucer riposte returns 4 extra damage.' },
  { id: 4, rarity: 3, name: 'Legendary lantern cup', bonus: 'openingCharge', value: 8, description: 'Begin each battle with 8 ultimate charge.' },
] as const;
export interface RelicHolding { id: number; rarity: number; balance: string }
export const RELIC_FIXTURE: RelicHolding[] = RELIC_EFFECTS.map(r => ({ id: r.id, rarity: r.rarity, balance: '1' }));

/** ERC-1155 rarityOf is the existing attribute. Quantities never multiply power. */
export function acceptRelicSnapshot(state: DepthAccount, chainId: number, holdings: RelicHolding[]) {
  return transactDepth(state, draft => {
    requireRule(chainId === 43113, 'INVALID_AMOUNT', 'Use Avalanche Fuji 43113.');
    requireRule(holdings.every(h => RELIC_EFFECTS.some(r => r.id === h.id && r.rarity === h.rarity)
      && /^\d{1,78}$/.test(h.balance)), 'INVALID_AMOUNT', 'Relic attributes differ from the supported Fuji catalogue.');
    draft.relics = [...new Set(holdings.filter(h => BigInt(h.balance) > 0n).map(h => h.id))];
    if (draft.selectedRelic && !draft.relics.includes(draft.selectedRelic)) draft.selectedRelic = null;
  });
}
export function selectRelic(state: DepthAccount, id: number | null) {
  return transactDepth(state, draft => {
    requireHome(draft);
    requireRule(id === null || draft.relics.includes(id), 'LOCKED', 'Read an owned Relic or choose fixture mode first.');
    draft.selectedRelic = id;
  });
}
export function idlePreview(state: DepthAccount, now: number) {
  const elapsed = Math.min(CONFIG.idle.offlineCapSeconds, Math.max(0, Math.floor((now - state.idle.lastAt) / 1000)));
  const online = Math.min(elapsed, CONFIG.idle.onlineWindowSeconds);
  const effectiveMinutes = Math.floor((online + (elapsed - online) * CONFIG.idle.offlineEfficiency) / 60);
  const claims = Math.min(Math.floor(effectiveMinutes / CARD_RPG_CONFIG.service.minutesPerClaim),
    CARD_RPG_CONFIG.service.maxClaims - state.account.daily.service);
  return { elapsed, effectiveMinutes, claims, capHours: CONFIG.idle.offlineCapSeconds / 3600 };
}
export function claimIdleService(state: DepthAccount, now: number) {
  return transactDepth(state, draft => {
    requireHome(draft);
    requireRule(Number.isSafeInteger(now) && now >= draft.idle.lastAt, 'INVALID_AMOUNT', 'The service clock must move forward.');
    const preview = idlePreview(draft, now);
    requireRule(preview.claims > 0, 'NOT_READY', 'The kettle needs more time, or today’s two services are complete.');
    const result = metaCommand(draft, { type: 'service', minutes: preview.effectiveMinutes });
    requireRule(result.ok, 'NOT_READY', 'Service claim unavailable.');
    draft.account = result.state.account;
    draft.idle.lastAt = now;
  });
}
/** Read-only adapter contract. The main game's signed result IDs remain its authority. */
export interface IdleResultReceipt {
  source: 'taskbar-idle-v2'; id: string; day: number; chapter: number; bossWins: number; lootCount: number;
}
export const IDLE_RECEIPT_FIXTURE: IdleResultReceipt = {
  source: 'taskbar-idle-v2', id: 'fixture-idle-2026-11-06-1', day: 1, chapter: 1, bossWins: 1, lootCount: 2,
};
export function acceptIdleResult(state: DepthAccount, receipt: IdleResultReceipt) {
  return transactDepth(state, draft => {
    requireRule(receipt.source === 'taskbar-idle-v2' && /^[\w-]{1,100}$/.test(receipt.id)
      && receipt.day === draft.account.day && integer(receipt.chapter, 1, 5)
      && integer(receipt.bossWins, 0, 100) && integer(receipt.lootCount, 0, 1000), 'INVALID_AMOUNT', 'Invalid idle result receipt.');
    requireRule(!draft.idle.receiptIds.includes(receipt.id), 'ALREADY_CLAIMED', 'This idle result was already read.');
    const key = `depth-material-${draft.account.day}`;
    const earned = draft.account.inventory.stacks[key] ?? 0;
    const material = Math.max(0, Math.min(6, receipt.bossWins * 3 + receipt.lootCount, 30 - earned));
    draft.materials += material;
    draft.account.inventory.stacks[key] = earned + material;
    draft.idle.receiptIds.push(receipt.id);
  });
}
export function designEligibility(state: DepthAccount, id: string) {
  const spec = SCARCITY.find(s => s.id === id);
  const counters = state.account.scarcity[id];
  if (!spec || !counters) throw new Error('Unknown design');
  const seals = id === 'moon-collar' ? 3 : 10;
  const effort = state.seals >= seals && (id === 'moon-collar' ? state.cleared.length >= 1 : state.masteries.length === 3 || state.towerBest >= 5);
  const supply = counters.issuedDesign < spec.globalCap && counters.seasonIssuedDesign < spec.seasonCap;
  return { ...spec, seals, effort, supply, eligible: effort && supply && !state.designClaims.includes(id),
    globalRemaining: spec.globalCap - counters.issuedDesign, seasonRemaining: spec.seasonCap - counters.seasonIssuedDesign };
}
export function reserveDesignPreview(state: DepthAccount, id: string) {
  return transactDepth(state, draft => {
    const eligibility = designEligibility(draft, id);
    requireRule(eligibility.eligible, 'NOT_READY', 'Meet the effort requirements and remaining design supply.');
    draft.seals -= eligibility.seals;
    draft.account.scarcity[id]!.issuedDesign++;
    draft.account.scarcity[id]!.seasonIssuedDesign++;
    draft.designClaims.push(id);
  });
}
