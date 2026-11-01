import { GameError, type HttpDeps } from "../game.ts";

/** Kept in sync with the client contract by a test; Edge Functions cannot import the app. */
export const HTTP_STATUS_V2 = {
  unauthenticated: 401,
  invalid_request: 400,
  not_found: 404,
  rate_limited: 429,
  server_error: 500,
  no_class: 409,
  not_owner: 403,
  wrong_slot: 409,
  slot_locked: 409,
  wrong_weapon: 409,
  stale: 409,
  cooldown: 409,
  not_reached: 409,
  no_key: 409,
  not_enough: 409,
  bag_full: 409,
  equipped: 409,
  locked: 409,
  forge_blocked: 409,
};
export type GameApiErrorCodeV2Like = keyof typeof HTTP_STATUS_V2;

export class V2Error extends Error {
  constructor(readonly code: GameApiErrorCodeV2Like, readonly extra: { reason?: string; stack?: string; cooldownUntil?: number } = {}) {
    super(code);
    this.name = "V2Error";
  }
}

const MAX_BODY_BYTES = 8192;
// Bound the entire upload, not each chunk, below the existing 15-second probe deadline.
const BODY_READ_TIMEOUT_MS = 10_000;

/** Bound raw input before auth; JSON parsing and game admission remain separate. */
async function requestBytes(req: Request): Promise<Uint8Array> {
  const declared = req.headers.get("Content-Length");
  if (req.signal.aborted || (declared !== null && /^\d+$/.test(declared) && Number(declared) > MAX_BODY_BYTES)) {
    // Cancellation is cleanup, not a dependency of the refusal response.
    void req.body?.cancel().catch(() => {});
    throw new V2Error("invalid_request");
  }
  if (!req.body) return new Uint8Array();
  const reader = req.body.getReader();
  const bytes = new Uint8Array(MAX_BODY_BYTES);
  const stopped = new AbortController();
  const abort = () => stopped.abort();
  const timer = setTimeout(abort, BODY_READ_TIMEOUT_MS);
  const stop = new Promise<never>((_resolve, reject) => {
    stopped.signal.addEventListener("abort", () => {
      void reader.cancel().catch(() => {});
      reject(new V2Error("invalid_request"));
    }, { once: true });
  });
  req.signal.addEventListener("abort", abort, { once: true });
  let size = 0;
  try {
    if (req.signal.aborted) abort();
    for (;;) {
      const { done, value } = await Promise.race([reader.read(), stop]);
      // cancel() can resolve the pending read before the rejection microtask runs.
      if (stopped.signal.aborted) throw new V2Error("invalid_request");
      if (done) break;
      if (value.byteLength > bytes.length - size) {
        throw new V2Error("invalid_request");
      }
      bytes.set(value, size);
      size += value.byteLength;
    }
    return bytes.subarray(0, size);
  } catch {
    if (!stopped.signal.aborted) void reader.cancel().catch(() => {});
    throw new V2Error("invalid_request");
  } finally {
    clearTimeout(timer);
    req.signal.removeEventListener("abort", abort);
    reader.releaseLock();
  }
}

function requestObject(bytes: Uint8Array): Record<string, unknown> {
  try {
    const body: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new V2Error("invalid_request");
    return body as Record<string, unknown>;
  } catch {
    throw new V2Error("invalid_request");
  }
}

/** After byte limits and auth, but before JSON parsing; a refusal stops all game work. */
export type Admit = (player: string) => Promise<{ status: number; error: string; retryAfter: number } | null>;

export function handlerV2(http: HttpDeps, fn: (playerId: string, body: Record<string, unknown>) => Promise<unknown>, admit?: Admit): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: http.json(req, {}).headers });
    if (req.method !== "POST") return http.json(req, { error: "method_not_allowed" }, 405);
    try {
      const bytes = await requestBytes(req);
      const player = await http.authenticate(req);
      const refusal = await admit?.(player);
      if (refusal) {
        const res = http.json(req, { error: refusal.error, retryAfter: refusal.retryAfter }, refusal.status);
        res.headers.set("Retry-After", String(refusal.retryAfter));
        res.headers.append("Access-Control-Expose-Headers", "Retry-After");
        return res;
      }
      const body = requestObject(bytes);
      return http.json(req, await fn(player, body));
    } catch (e) {
      if (e instanceof V2Error) {
        const extra = Object.fromEntries(Object.entries(e.extra).filter(([, value]) => value !== undefined));
        return http.json(req, { error: e.code, ...extra }, HTTP_STATUS_V2[e.code]);
      }
      if (e instanceof GameError && e.code === "unauthenticated") return http.json(req, { error: "unauthenticated" }, 401);
      console.error(e);
      return http.json(req, { error: "server_error" }, 500);
    }
  };
}
