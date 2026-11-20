import {afterEach, expect, it, vi} from 'vitest';
import {chainPost} from './api';
import {friendlyError} from './errors';

afterEach(() => {vi.unstubAllEnvs(); vi.unstubAllGlobals();});
it.each([
  [429, 'daily_limit', 'Daily limit. Try tomorrow.'], [429, 'ip_limit', 'Guest limit. Try later.'],
  [503, 'sponsor_low', 'Café gas is low. Ask the host to refill it.'], [409, 'seal_unpaid', 'Seal unpaid. Retry.'],
  [409, 'no_judge_pass', 'Get a judge pass.'], [404, 'no_item', 'Item unavailable. Refresh.'],
  [401, 'private-detail', 'Sign in again.'], [503, 'private-detail', 'Unavailable. Retry.'],
  [503, '__proto__', 'Unavailable. Retry.'], [503, 'constructor', 'Unavailable. Retry.'],
])('shows fixed recovery text for %s %s', async (status, code, expected) => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.test');
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({error: code, details: 'private-detail'}, {status})));
  const error = await chainPost('chain-items', 'session', {action: 'inventory'}).catch(e => e);
  expect(friendlyError(error)).toBe(expected);
});
it('handles gateway HTML and keeps successful response data intact', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.test');
  const fetcher = vi.fn().mockResolvedValueOnce(new Response('<html>bad gateway</html>', {status: 502}))
    .mockResolvedValueOnce(Response.json({items: []}));
  vi.stubGlobal('fetch', fetcher);
  const error = await chainPost('chain-items', 'session').catch(e => e);
  expect(friendlyError(error)).toBe('Unavailable. Retry.');
  await expect(chainPost('chain-items', 'session', {action: 'inventory'})).resolves.toEqual({items: []});
});
