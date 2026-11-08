import { CARDS } from '../catalog';
import { requireRule } from '../internal';
import { GEAR_BY_ID, SETS } from './equipment';
import { crewThresholds, gameplayV4 } from './gameplay-v4';
import { grantDepth, requireHome, transactDepth } from './state';
import { cappedPreviewV4 } from './meta-v4';
import { mergeNodeStarsV4, type NodeStarsV4 } from './stars-v4';
import type { DepthAccount } from './contract';
import type { DiscoveryRevealV4 } from './events-v4';

export interface JourneyV4 {
  version: 1;
  stars: Record<string, NodeStarsV4>;
  found: Array<{ id: string; day: number; text: string }>;
  pending: DiscoveryRevealV4[];
  sequence: number;
  claims: string[];
}
export const STAR_TIERS_V4 = [3, 9, 18, 30, 60] as const;
export const STAR_REWARDS_V4 = [
  { id: 'stars-3', target: 3, name: 'First constellation', reward: { stamps: 30 } },
  { id: 'stars-9', target: 9, name: 'A brighter route', reward: { threads: 20 } },
  { id: 'stars-18', target: 18, name: 'A sky of possibilities', reward: { stamps: 40 } },
] as const;
// Resolve catalog data only after module initialization; equipment imports state, which imports this module.
export const discoveryIdsV4 = (): string[] => [
  ...['door', 'kettle', 'table', 'lantern'].flatMap(id => [2, 4].map(n => `crew:${id}:${n}`)),
  ...SETS.map(s => `set:${s.id}`),
  ...CARDS.flatMap(c => [2, 3, 4, 5].map(rank => `rank:${c.id}:${rank}`)),
  'legendary:first', ...STAR_TIERS_V4.map(n => `stars:${n}`),
];
export const emptyJourneyV4 = (): JourneyV4 => ({ version: 1, stars: {}, found: [], pending: [], sequence: 0, claims: [] });
export const starCountV4 = (s: DepthAccount) => Object.values(s.v4?.journey?.stars ?? {}).reduce((n, r) => n + r.conditions.filter(Boolean).length, 0);

function presentDiscoveries(s: DepthAccount) {
  const discoveries: Array<{ id: string; kind: DiscoveryRevealV4['discovery']['kind']; itemId: string; text: string }> = [];
  for (const crew of crewThresholds(s.team)) for (const threshold of [2, 4]) if (crew.threshold >= threshold)
    discoveries.push({ id: `crew:${crew.id}:${threshold}`, kind: 'crew', itemId: crew.id, text: `${crew.name} reached its ${threshold}-mark bonus.` });
  const sets = new Set(s.v4?.journal?.sets ?? []);
  for (const slots of Object.values(s.equipment)) {
    const worn = Object.values(slots).map(id => s.gear.find(g => g.id === id)).filter(Boolean);
    if (worn.length === 4 && new Set(worn.map(g => GEAR_BY_ID[g!.templateId]!.setId)).size === 1) sets.add(GEAR_BY_ID[worn[0]!.templateId]!.setId);
  }
  for (const id of sets) discoveries.push({ id: `set:${id}`, kind: 'set', itemId: id, text: `${SETS.find(set => set.id === id)!.name}: all four pieces together.` });
  for (const cat of s.account.cards) for (let rank = 2; rank <= cat.stars; rank++)
    discoveries.push({ id: `rank:${cat.cardId}:${rank}`, kind: 'rank', itemId: cat.cardId, text: `${CARDS.find(c => c.id === cat.cardId)!.name} reached rank ${rank}.` });
  const legendaryCat = s.account.cards.find(c => CARDS.find(x => x.id === c.cardId)?.rarity === 'legendary');
  const legendaryGear = s.gear.find(g => GEAR_BY_ID[g.templateId]?.rarity === 'legendary');
  if (legendaryCat || legendaryGear) discoveries.push({ id: 'legendary:first', kind: 'legendary',
    itemId: legendaryCat?.cardId ?? legendaryGear!.templateId,
    text: `${legendaryCat ? CARDS.find(c => c.id === legendaryCat.cardId)!.name : GEAR_BY_ID[legendaryGear!.templateId]!.name}: your first Legendary.` });
  for (const n of STAR_TIERS_V4) if (starCountV4(s) >= n)
    discoveries.push({ id: `stars:${n}`, kind: 'stars', itemId: `stars-${n}`, text: `${n} route stars. A little brighter every evening.` });
  return discoveries;
}
/** Legacy saves keep existing discoveries quietly; importing is never a new earned celebration. */
export function initializeJourneyV4(s: DepthAccount, quiet = true): void {
  if (!s.v4 || s.v4.journey) return;
  s.v4.journey = emptyJourneyV4();
  if (quiet) observeDiscoveriesV4(s, true);
}
/** Called inside the same transaction as the earned change. No combat or currency mutation. */
export function observeDiscoveriesV4(s: DepthAccount, quiet = false): void {
  if (!s.v4 || !quiet && !gameplayV4(s)) return;
  if (!s.v4.journey) { initializeJourneyV4(s); return; }
  const journal = s.v4.journey;
  for (const discovery of presentDiscoveries(s)) {
    if (journal.found.some(d => d.id === discovery.id)) continue;
    journal.found.push({ id: discovery.id, day: s.account.day, text: discovery.text });
    if (!quiet) journal.pending.push({ version: 2, kind: 'earned-reveal', sequence: journal.sequence++, round: 0,
      discovery: { kind: discovery.kind, id: discovery.id }, itemId: discovery.itemId, text: discovery.text });
  }
  journal.pending = journal.pending.slice(-8);
}
export function recordNodeStarsV4(s: DepthAccount, receipt: NodeStarsV4 | null): void {
  if (!receipt || !gameplayV4(s) || !s.v4 || !receipt.conditions.some(Boolean)) return;
  initializeJourneyV4(s);
  const journal = s.v4.journey!;
  journal.stars[receipt.key] = mergeNodeStarsV4(journal.stars[receipt.key], receipt).value;
}
export function acknowledgeDiscoveryV4(state: DepthAccount, sequence: number) {
  return transactDepth(state, s => {
    requireRule(gameplayV4(s) && s.v4?.journey?.pending[0]?.sequence === sequence, 'NOT_READY', 'That discovery is already in your journal.');
    s.v4!.journey!.pending.shift();
  });
}
export function starRewardPreviewV4(s: DepthAccount, id: string) {
  const target = STAR_REWARDS_V4.find(t => t.id === id);
  requireRule(target, 'UNKNOWN_ID', 'Choose a star milestone.');
  const progress = starCountV4(s), claimed = !!s.v4?.journey?.claims.includes(id), reward = cappedPreviewV4(s, target.reward);
  const reason = !gameplayV4(s) ? 'Open Gameplay v4 first.' : s.run && !s.run.complete ? 'Finish your route first.'
    : claimed ? 'Already collected.' : progress < target.target ? 'Earn another route star.'
      : !Object.values(reward).some(n => n > 0) ? 'Your daily allowance is full. This reward can wait.' : null;
  return { ...target, progress, claimed, reward, reason };
}
export function claimStarRewardV4(state: DepthAccount, id: string) {
  return transactDepth(state, s => {
    requireHome(s); const p = starRewardPreviewV4(s, id);
    requireRule(!p.reason, 'NOT_READY', p.reason ?? '');
    initializeJourneyV4(s); grantDepth(s, p.reward); s.v4!.journey!.claims.push(id);
  });
}

export function validateJourneyV4(s: DepthAccount): void {
  const j = s.v4?.journey; if (j === undefined) return;
  const discoveryIds = discoveryIdsV4();
  const valid = (condition: unknown) => requireRule(condition, 'INVALID_AMOUNT', 'Invalid discovery journal.');
  valid(j && j.version === 1 && j.stars && typeof j.stars === 'object' && !Array.isArray(j.stars));
  valid(Number.isSafeInteger(j.sequence) && j.sequence >= 0);
  valid(Array.isArray(j.found) && j.found.length <= discoveryIds.length);
  valid(new Set(j.found.map(d => d.id)).size === j.found.length);
  for (const d of j.found) valid(discoveryIds.includes(d.id) && Number.isSafeInteger(d.day) && d.day >= 1 && typeof d.text === 'string' && d.text.length <= 180);
  valid(Array.isArray(j.pending) && j.pending.length <= 8);
  let previous = -1;
  for (const e of j.pending) {
    valid(e && e.version === 2 && e.kind === 'earned-reveal' && e.round === 0 && e.discovery);
    const found = j.found.find(d => d.id === e.discovery.id);
    valid(found && found.text === e.text && ['crew', 'set', 'rank', 'legendary', 'stars'].includes(e.discovery.kind));
    valid(e.discovery.id.startsWith(e.discovery.kind + ':') && typeof e.itemId === 'string' && e.itemId.length <= 100);
    valid(Number.isSafeInteger(e.sequence) && e.sequence > previous && e.sequence < j.sequence); previous = e.sequence;
  }
  valid(Array.isArray(j.claims) && new Set(j.claims).size === j.claims.length && j.claims.every(id => STAR_REWARDS_V4.some(r => r.id === id)));
  valid(Object.keys(j.stars).length <= 3 * 51 * 14 * 7);
  for (const [key, r] of Object.entries(j.stars)) {
    valid(r && r.key === key && Number.isInteger(r.chapter) && r.chapter >= 1 && r.chapter <= 3
      && Number.isInteger(r.band) && r.band >= 0 && r.band <= 50 && /^[0-6]-[01]$/.test(r.nodeId));
    valid(['battle', 'elite', 'boss', 'event', 'treasure', 'shop', 'campfire'].includes(r.kind));
    valid(key === `${r.chapter}/${r.band}/${r.nodeId}/${r.kind}` && Array.isArray(r.conditions) && r.conditions.length === 3 && r.conditions.every(c => typeof c === 'boolean'));
  }
}
