import { NONCE_TTL_SECONDS, type AuthStore, type Clock } from "../index";

/** In-memory AuthStore with the same semantics as the Postgres store (for tests). */
export class MemoryStore implements AuthStore {
  readonly nonces = new Map<string, { createdAt: number; usedAt?: number }>();
  readonly players = new Map<string, { id: string }>();
  readonly idleState = new Set<string>();

  constructor(private readonly clock: Clock) {}

  async createNonce(nonce: string): Promise<void> {
    if (this.nonces.has(nonce)) throw new Error("duplicate nonce");
    this.nonces.set(nonce, { createdAt: this.clock().getTime() });
  }

  async consumeNonce(nonce: string): Promise<boolean> {
    // Yield to the event loop first so concurrent callers really interleave. The check and the
    // write below then run in one synchronous step, which models the single atomic
    // UPDATE ... WHERE used_at IS NULL RETURNING of the Postgres store.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const row = this.nonces.get(nonce);
    const now = this.clock().getTime();
    if (!row || row.usedAt !== undefined || row.createdAt <= now - NONCE_TTL_SECONDS * 1000) return false;
    row.usedAt = now;
    return true;
  }

  async upsertPlayerByWallet(wallet: string): Promise<{ id: string }> {
    let p = this.players.get(wallet);
    if (!p) {
      p = { id: globalThis.crypto.randomUUID() };
      this.players.set(wallet, p);
      this.idleState.add(p.id);
    }
    return { id: p.id };
  }
}
