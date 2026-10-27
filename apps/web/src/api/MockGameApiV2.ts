import { CONFIG, deriveSeed, rarityIndex, relicIdFor, rollRelicRarity, v2 } from '@taskbar-hero/game-rules';
import { VOUCHER_TTL_SECONDS } from '@taskbar-hero/chain';
import type { RelicVoucher, TodayRelic } from '@taskbar-hero/api-contract';
import type { ClassId, GearSlotId, RecipeId, StackId, GameApiV2, ServerStateV2, ClaimResultV2, BossFightResultV2, CraftResultV2, SalvageResultV2, ForgeResultV2, ForgeStatusV2 } from './GameApiV2';
import { GameApiErrorV2, isGameApiErrorCodeV2 } from './GameApiErrorV2';
import { DEMO_SIGNATURE } from './MockGameApi';

export interface MockGameApiV2Options {
  /** Clock in ms; inject a fake one in tests. Default Date.now. */
  now?: () => number;
  /** Base seed; every roll derives from it and a counter. Default 1. */
  seed?: number;
  /** Storage to persist into; default window.localStorage when available. Pass null for memory only. */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  /** Starting stacks for UI tests and demos (e.g. enough to craft). */
  start?: Partial<Record<StackId, number>>;
}
export const MOCK_V2_STORAGE_KEY = 'taskbar-hero:v2-demo:1';
type ActionRecord = { intent: string; result: object };
type StoredV2 = { v: 1; state: v2.PlayerStateV2; lastClaimMs: number; counter: number; voucherNonce: number; founder: false;
  actions?: Record<string, ActionRecord>; pending?: RelicVoucher | null; todayRelic?: TodayRelic | null };
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const count = (value: unknown): value is number => finite(value) && Number.isSafeInteger(value) && value >= 0;
const date = (value: unknown) => value === null || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value));

/** Validate untrusted browser saves before any rule or view helper sees them. */
function validSave(value: unknown): value is StoredV2 {
  if (!object(value) || value.v !== 1 || value.founder !== false || !finite(value.lastClaimMs) || !count(value.counter) || !count(value.voucherNonce) || !object(value.state)) return false;
  const s = value.state;
  if (s.classId !== null && !v2.CLASSES.some(cls => cls.id === s.classId)) return false;
  if (!['level', 'xp', 'chapter', 'round', 'kills', 'bestStage', 'fights', 'progressRev'].every(key => count(s[key]))) return false;
  if ((s.level as number) < 1 || (s.level as number) > v2.V2_CONFIG.cat.maxLevel || (s.chapter as number) < 1) return false;
  const chapter = v2.CHAPTERS.find(ch => ch.index === s.chapter) ?? v2.CHAPTERS[v2.CHAPTERS.length - 1]!;
  if ((s.round as number) < 1 || (s.round as number) > chapter.roundsPerChapter || (s.kills as number) > chapter.killsPerRound) return false;
  if (!object(s.stacks) || !Object.entries(s.stacks).every(([key, n]) => (key === 'fish' || v2.MATERIALS.some(mat => mat.id === key)) && count(n))) return false;
  if (!object(s.bossClears) || !Object.entries(s.bossClears).every(([key, clear]) => v2.CHAPTERS.some(ch => String(ch.index) === key) && object(clear) && count(clear.wins))) return false;
  if (!(s.bossCooldownUntil === null || finite(s.bossCooldownUntil)) || !date(s.lastDailyKeyDay) || !date(s.lastRelicDay)) return false;
  if (!Array.isArray(s.items)) return false;
  const ids = new Set<string>();
  for (const item of s.items) {
    if (!object(item) || typeof item.id !== 'string' || !item.id || ids.has(item.id)) return false;
    ids.add(item.id);
    const def = v2.ITEMS.find(entry => entry.id === item.itemKey);
    if (!def || item.itemId !== def.id || item.slot !== def.slot || item.rarity !== def.rarity || item.weaponType !== def.weaponType || !count(item.level) || item.level < 1 || typeof item.locked !== 'boolean' || typeof item.equipped !== 'boolean') return false;
    if (item.source === undefined) item.source = 'drop';
    if (!['starter', 'drop', 'chest', 'craft', 'founder'].includes(String(item.source))) return false;
    const lines = (x: unknown) => Array.isArray(x) && x.every(line => object(line) && v2.STATS.some(stat => stat.id === line.stat) && finite(line.value));
    if (!lines(item.bonus) || (item.bonusLines !== undefined && !lines(item.bonusLines))) return false;
  }
  if (value.actions !== undefined && (!object(value.actions) || !Object.values(value.actions).every(record =>
    object(record) && typeof record.intent === 'string' && object(record.result)))) return false;
  if (value.pending != null) {
    const p = value.pending;
    if (!object(p) || p.signature !== DEMO_SIGNATURE || p.player !== '0x0000000000000000000000000000000000000000' || typeof p.relicId !== 'string' || typeof p.nonce !== 'string' || !count(p.rarity) || !finite(p.expiry) || !CONFIG.rarities.some(rarity => rarity === p.rarityName)) return false;
  }
  if (value.todayRelic != null) {
    const t = value.todayRelic;
    if (!object(t) || typeof t.relicId !== 'string' || !CONFIG.rarities.some(rarity => rarity === t.rarityName) || typeof t.minted !== 'boolean' || !(t.txHash === null || typeof t.txHash === 'string')) return false;
  }
  return true;
}

export class MockGameApiV2 implements GameApiV2 {
  private readonly now: () => number;
  private readonly baseSeed: number;
  private readonly storage: MockGameApiV2Options['storage'];
  private data: StoredV2;

  constructor(opts: MockGameApiV2Options = {}) {
    this.now = opts.now ?? Date.now;
    this.baseSeed = opts.seed ?? 1;
    let storage = opts.storage;
    if (storage === undefined) { try { storage = typeof window === 'undefined' ? null : window.localStorage; } catch { storage = null; } }
    this.storage = storage;
    const initial = v2.emptyState();
    if (!initial.ok) throw new Error('emptyState failed');
    this.data = { v: 1, state: initial.state, lastClaimMs: this.now(), counter: 0, voucherNonce: 0, founder: false };
    if (opts.start) this.data.state.stacks = { ...opts.start };
    try {
      const raw = this.storage?.getItem(MOCK_V2_STORAGE_KEY);
      if (raw) { const parsed: unknown = JSON.parse(raw); if (validSave(parsed)) { this.data = parsed; return; } }
    } catch { /* Private windows and corrupt JSON both fall back to memory. */ }
    this.save();
  }
  private save(): void { try { this.storage?.setItem(MOCK_V2_STORAGE_KEY, JSON.stringify(this.data)); } catch { /* Memory remains playable. */ } }
  private today(): string { return new Date(this.now() + 7 * 3600_000).toISOString().slice(0, 10); }
  private seed(offset = 0): number { return deriveSeed(this.baseSeed, this.data.counter + offset); }
  private accept<T extends object>(result: v2.StateResultV2<T>): Extract<v2.StateResultV2<T>, { ok: true }> {
    if (!result.ok) {
      if (result.code.startsWith('not_enough:')) throw new GameApiErrorV2('not_enough', { stack: result.code.slice('not_enough:'.length) as StackId });
      throw new GameApiErrorV2(isGameApiErrorCodeV2(result.code) ? result.code : 'server_error', result);
    }
    return result;
  }
  private forgeStatus(): ForgeStatusV2 {
    const today = this.today();
    const forgedToday = this.data.state.lastRelicDay === today;
    const day = Date.parse(`${today}T00:00:00Z`) / 86_400_000;
    return { blockedBy: this.data.pending ? null : v2.relicForgeBlockV2({ stacks: this.data.state.stacks, lastRelicDay: forgedToday ? day : -1 }, day),
      forgedToday, pending: this.data.pending ?? null, today: forgedToday ? this.data.todayRelic ?? null : null };
  }
  private snapshot(gate = v2.gateOfV2(this.data.state, this.today())): ServerStateV2 {
    const view = v2.stateViewV2(this.data.state, { nowS: Math.floor(this.now() / 1000), forge: this.forgeStatus(), founder: false, gate });
    return copy({ ...view, inventory: view.inventory.map(item => ({ ...item, source: this.data.state.items.find(owned => owned.id === item.id)!.source })) });
  }
  private replay<T>(route: string, requestId: string | undefined, intent: object): T | null {
    if (requestId === undefined) return null;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new GameApiErrorV2('invalid_request');
    const stored = this.data.actions?.[`${route}:${requestId.toLowerCase()}`];
    if (!stored) return null;
    if (stored.intent !== JSON.stringify(intent)) throw new GameApiErrorV2('invalid_request');
    return copy(stored.result) as T;
  }
  private remember(route: string, requestId: string | undefined, intent: object, result: object): void {
    if (requestId === undefined) return;
    this.data.actions ??= {};
    this.data.actions[`${route}:${requestId.toLowerCase()}`] = { intent: JSON.stringify(intent), result: copy(result) };
  }
  private equipmentRevision(before: v2.PlayerStateV2, after: v2.PlayerStateV2): void {
    after.progressRev += after.items.filter(item => item.equipped !== (before.items.find(old => old.id === item.id)?.equipped ?? false)).length;
  }
  async getState(): Promise<ServerStateV2> { return this.snapshot(); }
  async chooseClass(classId: ClassId): Promise<ServerStateV2> {
    const chosen = this.accept(v2.chooseClass(this.data.state, classId));
    let state = chosen.state;
    if (chosen.starterWeapon) {
      state = this.accept(v2.addItems(state, [chosen.starterWeapon], Math.max(v2.V2_CONFIG.bag.limit, state.items.length + 1), v2.salvage)).state;
      // SQL grants the starter beyond the bag cap; never auto-salvage a free grant.
      if (state.items.some(item => item.id === chosen.starterWeapon!.id)) state = this.accept(v2.equip(state, chosen.starterWeapon.id, 'weapon')).state;
    }
    this.equipmentRevision(this.data.state, state);
    this.data.state = state; this.save(); return this.snapshot();
  }
  async claim(): Promise<ClaimResultV2> {
    if (!this.data.state.classId) throw new GameApiErrorV2('no_class');
    const now = this.now();
    if ((now - this.data.lastClaimMs) / 1000 < 10) return { gains: { ...v2.lootViewV2({}, [], []), xp: 0, levelsGained: 0 }, state: this.snapshot() };
    const before = this.data.state;
    const delta = v2.computeClaimV2(v2.claimInputV2(before, { today: this.today(), offline: false }), (now - this.data.lastClaimMs) / 1000, this.seed());
    const r = this.accept(v2.applyClaim(before, delta));
    this.data.state = r.state; this.data.lastClaimMs = now; this.data.counter++; this.save();
    return { gains: v2.gainsViewV2(before, r.state, v2.lootViewV2(r.stackDeltas, r.items, r.autoSalvaged)),
      state: this.snapshot({ gated: r.gated, neededPower: r.neededPower ?? 0 }) };
  }
  async equip(itemId: string | null, slot: GearSlotId): Promise<ServerStateV2> {
    if (!v2.GEAR_SLOT_IDS.some(id => id === slot)) throw new GameApiErrorV2('invalid_request');
    const next = this.accept(v2.equip(this.data.state, itemId, slot)).state;
    this.equipmentRevision(this.data.state, next);
    this.data.state = next;
    this.save(); return this.snapshot();
  }
  async fightBoss(chapter: number, requestId?: string): Promise<BossFightResultV2> {
    const intent = { chapter };
    const replay = this.replay<Omit<BossFightResultV2, 'state'>>('v2-boss-fight', requestId, intent);
    if (replay) return { ...replay, state: this.snapshot() };
    const state = this.data.state;
    if (!state.classId) throw new GameApiErrorV2('no_class');
    const nowS = Math.floor(this.now() / 1000);
    if (state.bossCooldownUntil !== null && state.bossCooldownUntil > nowS) throw new GameApiErrorV2('cooldown', { cooldownUntil: state.bossCooldownUntil });
    const ch = v2.CHAPTERS.find(entry => entry.index === chapter);
    if (!ch || (!state.bossClears[chapter] && (chapter !== state.chapter || state.round !== ch.roundsPerChapter || state.kills < ch.killsPerRound))) throw new GameApiErrorV2('not_reached');
    if ((state.stacks.catKey ?? 0) < v2.V2_CONFIG.boss.keyCost) throw new GameApiErrorV2('no_key');
    const input = v2.claimInputV2(state, { today: this.today(), offline: false });
    const result = v2.simulateBossV2(v2.deriveStats({ classId: state.classId, level: state.level }, input.equipped), state.classId, v2.bossOfChapter(chapter), this.seed());
    const chest = result.won ? v2.rollChestV2({ chapter, firstClear: !state.bossClears[chapter], classId: state.classId, level: state.level }, this.seed(1)) : { stackDeltas: {}, items: [] };
    const r = this.accept(v2.applyBossResult(state, { won: result.won, chapter, chest, keyCost: v2.V2_CONFIG.boss.keyCost, cooldownS: v2.V2_CONFIG.boss.lossCooldownSeconds, now: nowS }));
    // Credit view includes overflow salvage and actual capped chest keys, excluding the spend.
    const added: v2.StacksV2 = {};
    for (const [id, qty] of Object.entries(r.state.stacks) as [StackId, number][]) {
      const delta = qty - (state.stacks[id] ?? 0) + (id === 'catKey' && r.keySpent ? v2.V2_CONFIG.boss.keyCost : 0);
      if (delta > 0) added[id] = delta;
    }
    this.data.state = r.state; this.data.counter += result.won ? 2 : 1;
    const payload = { won: result.won, timeline: v2.timelineViewV2(result.log), ...(result.won ? { chest: v2.lootViewV2(added, r.items, r.autoSalvaged) } : {}), keySpent: r.keySpent };
    this.remember('v2-boss-fight', requestId, intent, payload); this.save();
    return { ...payload, state: this.snapshot() };
  }
  async craft(recipeId: RecipeId, slot: GearSlotId, requestId?: string): Promise<CraftResultV2> {
    const intent = { recipeId, slot };
    const replay = this.replay<Omit<CraftResultV2, 'state'>>('v2-craft', requestId, intent);
    if (replay) return { ...replay, state: this.snapshot() };
    const r = this.accept(v2.applyCraft(this.data.state, recipeId, slot, this.seed(), Math.floor(this.now() / 1000)));
    this.data.state = r.state; this.data.counter++;
    const payload = { item: { ...v2.itemViewV2(r.item), source: r.item.source } };
    this.remember('v2-craft', requestId, intent, payload); this.save();
    return { ...payload, state: this.snapshot() };
  }
  async salvage(itemIds: string[]): Promise<SalvageResultV2> {
    const r = this.accept(v2.applySalvage(this.data.state, itemIds));
    if (this.data.state.items.some(item => itemIds.includes(item.id) && item.source === 'starter')) throw new GameApiErrorV2('invalid_request');
    this.data.state = r.state; this.save();
    const loot = v2.lootViewV2(r.gains, [], []);
    return { gains: { fish: loot.fish, yarn: loot.yarn, materials: loot.materials }, state: this.snapshot() };
  }
  async setLocked(itemId: string, locked: boolean): Promise<ServerStateV2> {
    this.data.state = this.accept(v2.lockItem(this.data.state, itemId, locked)).state;
    this.save(); return this.snapshot();
  }
  async forgeRelic(): Promise<ForgeResultV2> {
    const nowS = Math.floor(this.now() / 1000);
    if (this.data.pending) {
      if (this.data.pending.expiry <= nowS) {
        this.data.pending = { ...this.data.pending, nonce: String(this.data.voucherNonce++), expiry: nowS + VOUCHER_TTL_SECONDS }; this.save();
      }
      return { voucher: copy(this.data.pending), state: this.snapshot() };
    }
    const r = this.accept(v2.applyRelicForge(this.data.state, this.today()));
    const rarity = rollRelicRarity(this.seed());
    this.data.pending = { player: '0x0000000000000000000000000000000000000000', relicId: String(relicIdFor(rarity)), rarity: rarityIndex(rarity), rarityName: rarity,
      nonce: String(this.data.voucherNonce++), expiry: nowS + VOUCHER_TTL_SECONDS, signature: DEMO_SIGNATURE };
    this.data.todayRelic = { relicId: this.data.pending.relicId, rarityName: rarity, minted: false, txHash: null };
    this.data.state = r.state; this.data.counter++; this.save();
    return { voucher: copy(this.data.pending), state: this.snapshot() };
  }
}
