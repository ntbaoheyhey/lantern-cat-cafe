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

/** Bound bytes while streaming; Content-Length is caller-controlled. */
async function requestObject(req: Request): Promise<Record<string, unknown>> {
  if (!req.body) throw new V2Error("invalid_request");
  const reader = req.body.getReader();
  const bytes = new Uint8Array(8192);
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > bytes.length - size) {
        await reader.cancel();
        throw new V2Error("invalid_request");
      }
      bytes.set(value, size);
      size += value.byteLength;
    }
    const body: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, size)));
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new V2Error("invalid_request");
    return body as Record<string, unknown>;
  } catch {
    throw new V2Error("invalid_request");
  } finally {
    reader.releaseLock();
  }
}

export function handlerV2(http: HttpDeps, fn: (playerId: string, body: Record<string, unknown>) => Promise<unknown>): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: http.json(req, {}).headers });
    if (req.method !== "POST") return http.json(req, { error: "method_not_allowed" }, 405);
    try {
      const player = await http.authenticate(req);
      const body = await requestObject(req);
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
