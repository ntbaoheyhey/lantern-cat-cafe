import { afterEach, expect, it, vi } from "vitest";
import { GameError, type HttpDeps } from "../../functions/_shared/game.ts";
import { handlerV2 } from "../../functions/_shared/v2/http.ts";

const url = "https://example.test/v2-state";
const encoder = new TextEncoder();
type Refusal = { status: number; error: string; retryAfter: number };

function route(authenticated = true, refusal: Refusal | null = null) {
  const authenticate = vi.fn(async (_req: Request) => {
    if (!authenticated) throw new GameError("unauthenticated");
    return "body-limit-player";
  });
  const admit = vi.fn(async (_player: string) => refusal);
  const game = vi.fn(async (player: string, body: Record<string, unknown>) => ({ player, body }));
  const http: HttpDeps = {
    authenticate,
    json: (_req, body, status = 200) => Response.json(body, { status, headers: {
      "Access-Control-Allow-Origin": "https://example.test",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Expose-Headers": "X-Existing",
    } }),
  };
  return { authenticate, admit, game, handle: handlerV2(http, game, admit) };
}

function post(body: string | ReadableStream<Uint8Array> | null, headers: HeadersInit = {}, signal?: AbortSignal) {
  const init: RequestInit & { duplex: "half" } = { method: "POST", body, headers, signal, duplex: "half" };
  return new Request(url, init);
}

function objectOfSize(bytes: number): string {
  const body = JSON.stringify({ padding: "x".repeat(bytes - 14) });
  expect(encoder.encode(body)).toHaveLength(bytes);
  return body;
}

afterEach(() => vi.useRealTimers());

it.each([undefined, "2", "8193"])("rejects unsigned oversized bytes with Content-Length %s before auth or game work", async contentLength => {
  const r = route(false);
  const headers: HeadersInit = contentLength === undefined ? {} : { "Content-Length": contentLength };
  const response = await r.handle(post(objectOfSize(8193), headers));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "invalid_request" });
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://example.test");
  expect(r.authenticate).not.toHaveBeenCalled();
  expect(r.admit).not.toHaveBeenCalled();
  expect(r.game).not.toHaveBeenCalled();
});

it("accepts exactly 8192 actual bytes and passes the authenticated identity and object once", async () => {
  const r = route();
  const body = objectOfSize(8192);
  const response = await r.handle(post(body));
  expect(response.status).toBe(200);
  expect(r.authenticate).toHaveBeenCalledOnce();
  expect(r.admit).toHaveBeenCalledExactlyOnceWith("body-limit-player");
  expect(r.game).toHaveBeenCalledExactlyOnceWith("body-limit-player", JSON.parse(body));
});

it.each([true, false])("counts UTF-8 bytes rather than JavaScript characters (authenticated=%s)", async authenticated => {
  const body = JSON.stringify({ padding: "💫".repeat(2045) });
  expect(body.length).toBeLessThan(8192);
  expect(encoder.encode(body).length).toBeGreaterThan(8192);
  const r = route(authenticated);
  expect((await r.handle(post(body))).status).toBe(400);
  expect(r.game).not.toHaveBeenCalled();
});

it("bounds an unknown-length chunked stream and cancels the producer", async () => {
  const cancel = vi.fn();
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) { controller.enqueue(new Uint8Array(4096).fill(120)); },
    cancel,
  });
  const r = route(false);
  expect((await r.handle(post(stream))).status).toBe(400);
  expect(cancel).toHaveBeenCalledOnce();
  expect(r.authenticate).not.toHaveBeenCalled();
  expect(r.game).not.toHaveBeenCalled();
});

it.each([null, "{}", "[", "null", "[]"])("keeps ordinary unsigned requests unauthorized (%s)", async body => {
  const r = route(false);
  const response = await r.handle(post(body));
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "unauthenticated" });
  expect(r.admit).not.toHaveBeenCalled();
  expect(r.game).not.toHaveBeenCalled();
});

it.each([null, "[", "null", "[]"])("retains object-only JSON validation after authentication (%s)", async body => {
  const r = route();
  expect((await r.handle(post(body))).status).toBe(400);
  expect(r.authenticate).toHaveBeenCalledOnce();
  expect(r.admit).toHaveBeenCalledOnce();
  expect(r.game).not.toHaveBeenCalled();
});

it("retains fatal UTF-8 validation", async () => {
  const stream = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new Uint8Array([255])); c.close(); } });
  const r = route();
  expect((await r.handle(post(stream))).status).toBe(400);
  expect(r.game).not.toHaveBeenCalled();
});

it("rejects invalid UTF-8 inside otherwise valid JSON instead of accepting a replacement character", async () => {
  const prefix = encoder.encode('{"padding":"');
  const suffix = encoder.encode('"}');
  const bytes = new Uint8Array(prefix.length + 1 + suffix.length);
  bytes.set(prefix); bytes[prefix.length] = 255; bytes.set(suffix, prefix.length + 1);
  const stream = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(bytes); c.close(); } });
  const r = route();
  expect((await r.handle(post(stream))).status).toBe(400);
  expect(r.game).not.toHaveBeenCalled();
});

it.each([429, 503])("preserves budget refusal %s before JSON parsing and game work", async status => {
  const r = route(true, { status, error: status === 429 ? "rate_limited" : "server_error", retryAfter: 5 });
  const response = await r.handle(post("["));
  expect(response.status).toBe(status);
  expect(response.headers.get("Retry-After")).toBe("5");
  expect(response.headers.get("Access-Control-Expose-Headers")).toBe("X-Existing, Retry-After");
  expect(r.game).not.toHaveBeenCalled();
});

it.each([["OPTIONS", 204], ["GET", 405]] as const)("preserves %s handling without authentication", async (method, status) => {
  const r = route(false);
  const response = await r.handle(new Request(url, { method }));
  expect(response.status).toBe(status);
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://example.test");
  expect(r.authenticate).not.toHaveBeenCalled();
  expect(r.game).not.toHaveBeenCalled();
});

it("bounds total body-read time to ten seconds even when the producer never finishes", async () => {
  vi.useFakeTimers();
  const cancel = vi.fn(() => new Promise<void>(() => {}));
  const stream = new ReadableStream<Uint8Array>({ pull: () => new Promise<void>(() => {}), cancel });
  const r = route();
  let response: Response | undefined;
  void r.handle(post(stream)).then(value => { response = value; });
  await vi.advanceTimersByTimeAsync(9999);
  expect(response).toBeUndefined();
  await vi.advanceTimersByTimeAsync(1);
  expect(response?.status).toBe(400);
  expect(cancel).toHaveBeenCalledOnce();
  expect(r.authenticate).not.toHaveBeenCalled();
  expect(r.game).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it("does not wait for an oversized producer's cancellation promise", async () => {
  vi.useFakeTimers();
  const cancel = vi.fn(() => new Promise<void>(() => {}));
  const stream = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new Uint8Array(8193)); }, cancel });
  const r = route();
  let response: Response | undefined;
  void r.handle(post(stream)).then(value => { response = value; });
  await vi.advanceTimersByTimeAsync(0);
  expect(response?.status).toBe(400);
  expect(cancel).toHaveBeenCalledOnce();
  expect(r.game).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it("does not restart the total deadline when a slow producer sends another chunk", async () => {
  vi.useFakeTimers();
  let chunkTimer: ReturnType<typeof setTimeout> | undefined;
  const cancel = vi.fn(() => { if (chunkTimer !== undefined) clearTimeout(chunkTimer); });
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      return new Promise<void>(resolve => {
        chunkTimer = setTimeout(() => { controller.enqueue(new Uint8Array([120])); resolve(); }, 2000);
      });
    },
    cancel,
  });
  const r = route();
  let response: Response | undefined;
  void r.handle(post(stream)).then(value => { response = value; });
  await vi.advanceTimersByTimeAsync(10_000);
  expect(response?.status).toBe(400);
  expect(cancel).toHaveBeenCalledOnce();
  expect(r.game).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it("removes the deadline after a normal complete request", async () => {
  vi.useFakeTimers();
  const r = route();
  expect((await r.handle(post("{}"))).status).toBe(200);
  expect(vi.getTimerCount()).toBe(0);
});

it("stops a pending read when the request is aborted", async () => {
  vi.useFakeTimers();
  const abort = new AbortController();
  const cancel = vi.fn();
  const stream = new ReadableStream<Uint8Array>({ pull: () => new Promise<void>(() => {}), cancel });
  const r = route();
  let response: Response | undefined;
  void r.handle(post(stream, {}, abort.signal)).then(value => { response = value; });
  abort.abort();
  await vi.advanceTimersByTimeAsync(0);
  expect(response?.status).toBe(400);
  expect(cancel).toHaveBeenCalledOnce();
  expect(r.game).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
