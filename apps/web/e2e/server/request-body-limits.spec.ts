import { test, expect } from '../support/test';

const api = `http://127.0.0.1:${process.env.E2E_PORT_API ?? '4176'}`;
const origin = `http://localhost:${process.env.E2E_PORT_SERVER ?? '4175'}`;
const routes = [
  'v2-boss-fight', 'v2-choose-class', 'v2-claim', 'v2-craft', 'v2-equip',
  'v2-lock', 'v2-relic-forge', 'v2-salvage', 'v2-state',
];
const oversized = JSON.stringify({ padding: 'x'.repeat(8193) });

for (const route of routes) {
  test(`${route}: CORS and unsigned body-size refusals over HTTP`, async ({ request }) => {
    const url = `${api}/functions/v1/${route}`;
    const preflight = await request.fetch(url, {
      method: 'OPTIONS', timeout: 15_000, maxRetries: 0,
      headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
    });
    expect(preflight.status()).toBe(204);
    expect(preflight.headers()['access-control-allow-origin']).toBe(origin);
    expect(preflight.headers()['access-control-allow-methods']).toContain('POST');
    expect(preflight.headers()['access-control-allow-headers']?.toLowerCase()).toContain('content-type');

    // No session, Authorization or API key is sent in either request.
    const small = await request.post(url, {
      data: '{}', timeout: 15_000, maxRetries: 0,
      headers: { Origin: origin, 'Content-Type': 'application/json' },
    });
    expect(small.status()).toBe(401);
    expect(await small.json()).toEqual({ error: 'unauthenticated' });

    const large = await request.post(url, {
      data: oversized, timeout: 15_000, maxRetries: 0,
      headers: { Origin: origin, 'Content-Type': 'application/json' },
    });
    // The loopback transport can reject first with413; the production handler
    // uses400. Both satisfy the mission contract, while401 must still fail.
    expect([400, 413]).toContain(large.status());
    if (large.status() === 400) {
      expect(await large.json()).toEqual({ error: 'invalid_request' });
      expect(large.headers()['access-control-allow-origin']).toBe(origin);
    }
  });
}
