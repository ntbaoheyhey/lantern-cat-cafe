// Per-player request budgets (docs/proposals/rate-limit-v2.md, U-3). No Deno imports so tests run it directly.
// Per-IP budgets are deliberately absent until a trusted IP header contract is verified.
export type V2Route = "v2-state" | "v2-claim" | "v2-equip" | "v2-choose-class" | "v2-boss-fight" | "v2-craft" | "v2-salvage" | "v2-lock" | "v2-relic-forge";

/** [per minute, burst] per player. HTTP budgets, not economy numbers; tune with real traffic. */
export const PLAYER_BUDGETS: Record<V2Route, readonly [number, number]> = {
  "v2-state": [30, 5], "v2-claim": [12, 2], "v2-equip": [30, 6], "v2-choose-class": [6, 2],
  "v2-boss-fight": [10, 2], "v2-craft": [10, 2], "v2-salvage": [10, 2], "v2-lock": [30, 6], "v2-relic-forge": [4, 1],
};
export const PLAYER_ALL_BUDGET = [120, 20] as const;

export interface Budget { key: string; perMinute: number; burst: number }
export type Rpc = (name: string, args: object) => PromiseLike<{ data: unknown; error: unknown }>;
export interface Refusal { status: 429 | 503; error: "rate_limited" | "server_error"; retryAfter: number }

/** Keys come only from the verified JWT subject and the fixed route table, never from the request body. */
export function playerBudgets(route: V2Route, player: string): Budget[] {
  const [perMinute, burst] = PLAYER_BUDGETS[route];
  return [
    { key: `player:${player}:all`, perMinute: PLAYER_ALL_BUDGET[0], burst: PLAYER_ALL_BUDGET[1] },
    { key: `player:${player}:${route}`, perMinute, burst },
  ];
}

/** Returns null when admitted. Fails closed (503) on any counter-store error, never continuing game work. */
export async function reserve(rpc: Rpc, budgets: Budget[]): Promise<Refusal | null> {
  const unavailable: Refusal = { status: 503, error: "server_error", retryAfter: 5 };
  try {
    const { data, error } = await rpc("v2_take_budgets", { p_budgets: budgets });
    const r = data as { allowed?: unknown; retryAfter?: unknown } | null;
    if (error || !r || typeof r.allowed !== "boolean") return unavailable;
    if (r.allowed) return null;
    const retryAfter = typeof r.retryAfter === "number" && r.retryAfter >= 1 ? Math.ceil(r.retryAfter) : 1;
    return { status: 429, error: "rate_limited", retryAfter };
  } catch {
    return unavailable;
  }
}

export const admitPlayer = (rpc: Rpc, route: V2Route, player: string) => reserve(rpc, playerBudgets(route, player));
