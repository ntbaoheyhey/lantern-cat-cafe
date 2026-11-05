import { QUESTS } from './catalog';
import { CARD_RPG_CONFIG as C } from './config';
import { CURRENCY_IDS, type AccountState, type Cost, type ErrorCode, type Event, type Preview, type Quest, type Result, type Reward } from './contract';
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export class RuleFailure extends Error { constructor(readonly code: ErrorCode, message: string) { super(message); } }
export function requireRule(condition: unknown, code: ErrorCode, message: string): asserts condition { if (!condition) throw new RuleFailure(code, message); }
export function integer(n: number, min = 0, max = Number.MAX_SAFE_INTEGER): boolean { return Number.isSafeInteger(n) && n >= min && n <= max; }
export function noBattle(s: AccountState): void { requireRule(!s.pendingRun, 'BATTLE_PENDING', 'Finish or abandon the current battle first.'); }
export function transact<T>(state: AccountState, fn: (draft: AccountState, events: Event[]) => T): Result<T> {
  const s = clone(state), events: Event[] = [];
  try { const value = fn(s, events); return { ok: true, state: s, events, value }; }
  catch (e) { if (!(e instanceof RuleFailure)) throw e; return { ok: false, state, events: [], error: { code: e.code, message: e.message } }; }
}
export function preview<T>(fn: () => T): Preview<T> { try { return { ok: true, value: fn() }; } catch (e) { if (!(e instanceof RuleFailure)) throw e; return { ok: false, error: { code: e.code, message: e.message } }; } }
export function afford(s: AccountState, cost: Cost): void {
  for (const key of CURRENCY_IDS) { const n = cost[key] ?? 0; requireRule(integer(n), 'INVALID_AMOUNT', 'Costs must be nonnegative integer points.'); requireRule(s.currencies[key] >= n, 'INSUFFICIENT_FUNDS', `Need ${n} ${key}.`); }
}
export function spend(s: AccountState, cost: Cost): void { afford(s, cost); for (const key of CURRENCY_IDS) s.currencies[key] -= cost[key] ?? 0; }
export function progress(s: AccountState, metric: Quest['metric'], amount = 1): void { for (const q of QUESTS.filter(q => q.metric === metric)) { const p = s.quests[q.id]!; p.progress = Math.min(q.target, p.progress + amount); } }
export function grant(s: AccountState, reward: Reward, capped = true, events: Event[] = []): Reward {
  const actual: Reward = { currencies: {}, xp: reward.xp, ...(reward.stacks ? { stacks: { ...reward.stacks } } : {}) };
  for (const key of CURRENCY_IDS) {
    const n = reward.currencies[key] ?? 0; requireRule(integer(n), 'INVALID_AMOUNT', 'Rewards must be nonnegative integer points.');
    const value = capped ? Math.min(n, Math.max(0, C.dailyCaps[key] - s.daily.earned[key])) : n;
    if (value) { s.currencies[key] += value; actual.currencies[key] = value; if (capped) s.daily.earned[key] += value; }
  }
  requireRule(integer(reward.xp), 'INVALID_AMOUNT', 'XP must be a nonnegative integer.');
  s.accountXp = Math.min(C.accountXpStep * (C.accountLevelCap - 1), s.accountXp + reward.xp);
  const level = Math.min(C.accountLevelCap, 1 + Math.floor(s.accountXp / C.accountXpStep));
  if (level > s.accountLevel) events.push({ type: 'levelUp', level }); s.accountLevel = level;
  for (const [id, amount] of Object.entries(reward.stacks ?? {})) { requireRule(integer(amount), 'INVALID_AMOUNT', 'Stack count must be an integer.'); s.inventory.stacks[id] = (s.inventory.stacks[id] ?? 0) + amount; }
  return actual;
}
