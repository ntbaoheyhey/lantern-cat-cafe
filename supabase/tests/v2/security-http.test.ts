import { describe, expect, it, vi } from "vitest";
import { GameError } from "../../functions/_shared/game.ts";
import { handlerV2 } from "../../functions/_shared/v2/http.ts";

const json = (_req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const request = (body: string | ReadableStream<Uint8Array>, headers = {}) => new Request("https://example.test/v2-claim", {
  method: "POST", body, headers, ...(typeof body === "string" ? {} : { duplex: "half" }),
} as RequestInit);
function setup(authenticate = async () => "jwt-sub") {
  const mutate = vi.fn(async (player: string) => ({ player }));
  return { mutate, handle: handlerV2({ authenticate, json }, mutate) };
}

describe("v2 HTTP trust boundary", () => {
  it.each(["{", "null", "[]", "42", '"string"', "true", ""])("rejects malformed/non-object JSON %s before mutation", async body => {
    const { handle, mutate } = setup();
    const response = await handle(request(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(mutate).not.toHaveBeenCalled();
  });
  it("bounds actual streamed UTF-8 bytes without trusting Content-Length", async () => {
    const { handle, mutate } = setup();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"ignored":"'));
        controller.enqueue(new TextEncoder().encode("é".repeat(4096)));
        controller.enqueue(new TextEncoder().encode('"}'));
        controller.close();
      },
      cancel() { cancelled = true; },
    });
    const response = await handle(request(stream, { "Content-Length": "2" }));
    expect(response.status).toBe(400);
    expect(mutate).not.toHaveBeenCalled();
    expect(cancelled).toBe(true);
  });
  it("accepts an object exactly at 8 KiB and rejects the next byte", async () => {
    const { handle, mutate } = setup();
    const body = JSON.stringify({ x: "a".repeat(8184) });
    expect(new TextEncoder().encode(body)).toHaveLength(8192);
    expect((await handle(request(body))).status).toBe(200);
    mutate.mockClear();
    expect((await handle(request(body + " "))).status).toBe(400);
    expect(mutate).not.toHaveBeenCalled();
  });
  it("uses authenticated identity even when the body supplies a player and forged reward", async () => {
    const { handle, mutate } = setup();
    expect(await (await handle(request('{"playerId":"victim","reward":1e300}'))).json()).toEqual({ player: "jwt-sub" });
    expect(mutate.mock.calls[0]![0]).toBe("jwt-sub");
  });
  it("authenticates before reading and does not leak internal exceptions", async () => {
    const { handle, mutate } = setup(async () => { throw new GameError("unauthenticated"); });
    expect((await handle(request("{"))).status).toBe(401);
    expect(mutate).not.toHaveBeenCalled();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const broken = handlerV2({ authenticate: async () => "p", json }, async () => { throw new Error("SELECT secret FROM private_table"); });
      const response = await broken(request("{}"));
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "server_error" });
    } finally { log.mockRestore(); }
  });
});
