// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('ships report-only CSP and defensive headers on every Vercel path', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  expect(config.ignoreCommand).toBeTruthy();
  expect(config.headers[0].source).toBe('/(.*)');
  const headers = Object.fromEntries(config.headers[0].headers.map((h: { key: string; value: string }) => [h.key, h.value]));
  expect(headers['Content-Security-Policy']).toBeUndefined();
  const policy = headers['Content-Security-Policy-Report-Only'];
  for (const directive of ["script-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'none'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://api.avax-test.network', 'https://qoalewtxflagoprrxrgh.supabase.co']) expect(policy).toContain(directive);
  expect(headers['X-Content-Type-Options']).toBe('nosniff');
  expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['X-Frame-Options']).toBe('DENY');
  expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
});
