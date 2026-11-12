import {afterEach, expect, it, vi} from 'vitest';
import {CHAIN_BODY_BYTES, CHAIN_BODY_TIMEOUT_MS, ChainRequestError, chainFailure, chainStoreError, readChainBody, type ChainEndpoint} from '../../functions/_shared/chain-http';

function request(body: string | ReadableStream<Uint8Array>, headers: HeadersInit = {}, signal?: AbortSignal) {
  return new Request('https://example.test/chain', {method: 'POST', body, headers, signal, duplex: 'half'} as RequestInit);
}
afterEach(() => vi.useRealTimers());

it.each([
  ['chain-cosmetics', {action:'state'}], ['chain-cosmetics', {action:'reserve',sku:'fern'}],
  ['chain-cosmetics', {action:'equip',sku:'none'}], ['chain-cosmetics', {action:'finalize',intent:'00000000-0000-4000-8000-000000000001'}],
  ['guest-drip', {}], ['chain-judge', {action: 'pass'}], ['chain-judge', {action: 'boss'}],
  ['chain-items', {action: 'inventory'}], ['chain-items', {action: 'reward'}],
  ['chain-items', {action: 'reserve', inventory: '00000000-0000-4000-8000-000000000001'}],
  ['chain-items', {action: 'finalize', intent: '00000000-0000-4000-8000-000000000001'}],
] as const)('accepts the exact %s protocol (%j)', async (endpoint, body) => {
  await expect(readChainBody(request(JSON.stringify(body)), endpoint)).resolves.toEqual(body);
});
it.each(['null', '[]', 'true', '"boss"', '{', '', '{"action":{}}'])('refuses malformed or non-object input: %s', async body => {
  await expect(readChainBody(request(body), 'chain-judge')).rejects.toBeInstanceOf(ChainRequestError);
});
it.each([
  ['chain-cosmetics', {action:'reserve',sku:'fern',cost:'1'}],
  ['chain-cosmetics', {action:'equip',sku:'fake'}], ['chain-cosmetics', {action:'finalize',intent:'bad'}],
  ['guest-drip', {amount: 1}], ['chain-judge', {action: 'boss', won: true}],
  ['chain-items', {action: 'reward', amount: 1000}], ['chain-items', {action: 'reserve', inventory: []}],
  ['chain-items', {action: 'finalize', intent: 'not-a-uuid'}], ['chain-items', {action: 'unseal'}],
  ['chain-items', {action: 'inventory', wallet: 'someone-else'}],
] as [ChainEndpoint, unknown][])('refuses client authority and malformed IDs: %s %j', async (endpoint, body) => {
  await expect(readChainBody(request(JSON.stringify(body)), endpoint)).rejects.toBeInstanceOf(ChainRequestError);
});
it.each([undefined, '1', '1025'])('counts actual bytes despite a missing/false Content-Length (%s)', async length => {
  const body = '{"action":"pass"}' + ' '.repeat(CHAIN_BODY_BYTES);
  await expect(readChainBody(request(body, length ? {'content-length': length} : {}), 'chain-judge')).rejects.toThrow('request_too_large');
});
it('accepts exactly the byte ceiling and rejects multibyte overflow', async () => {
  const body = '{"action":"pass"}';
  await expect(readChainBody(request(body.padEnd(CHAIN_BODY_BYTES)), 'chain-judge')).resolves.toEqual({action: 'pass'});
  await expect(readChainBody(request(JSON.stringify({action: '💫'.repeat(260)})), 'chain-judge')).rejects.toThrow('request_too_large');
});
it('rejects invalid UTF-8 rather than substituting characters', async () => {
  const stream = new ReadableStream<Uint8Array>({start(c) {c.enqueue(new Uint8Array([255])); c.close();}});
  await expect(readChainBody(request(stream), 'guest-drip')).rejects.toThrow('invalid_request');
});
it('cancels overflowing chunked uploads without awaiting producer cleanup', async () => {
  const cancel = vi.fn(() => new Promise<void>(() => {}));
  const stream = new ReadableStream<Uint8Array>({pull(c) {c.enqueue(new Uint8Array(600));}, cancel});
  await expect(readChainBody(request(stream), 'guest-drip')).rejects.toThrow('request_too_large');
  expect(cancel).toHaveBeenCalledOnce();
});
it('bounds the total body deadline and clears timers even if cancellation stalls', async () => {
  vi.useFakeTimers();
  const cancel = vi.fn(() => new Promise<void>(() => {}));
  const stream = new ReadableStream<Uint8Array>({pull: () => new Promise<void>(() => {}), cancel});
  const pending = readChainBody(request(stream), 'guest-drip');
  const checked = expect(pending).rejects.toThrow('request_timeout');
  await vi.advanceTimersByTimeAsync(CHAIN_BODY_TIMEOUT_MS);
  await checked;
  expect(cancel).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
});
it('stops aborted uploads and removes the timeout on a successful request', async () => {
  vi.useFakeTimers();
  const abort = new AbortController(), cancel = vi.fn();
  const stream = new ReadableStream<Uint8Array>({pull: () => new Promise<void>(() => {}), cancel});
  const pending = expect(readChainBody(request(stream, {}, abort.signal), 'guest-drip')).rejects.toThrow('invalid_request');
  abort.abort(); await pending;
  expect(cancel).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  await readChainBody(request('{}'), 'guest-drip'); expect(vi.getTimerCount()).toBe(0);
});
it('cancels a body whose request was already aborted', async () => {
  const abort = new AbortController(), cancel = vi.fn(); abort.abort();
  const stream = new ReadableStream<Uint8Array>({pull: () => new Promise<void>(() => {}), cancel});
  await expect(readChainBody(request(stream, {}, abort.signal), 'guest-drip')).rejects.toThrow('invalid_request');
  expect(cancel).toHaveBeenCalledOnce();
});
it('exposes only deliberate SQL recovery codes and hides all other details', () => {
  for (const [code, status] of [['daily_limit', 429], ['ip_limit', 429], ['sponsor_low', 503], ['no_item', 404]] as const) {
    expect(chainFailure(chainStoreError({code: 'P0001', message: code, details: 'private-detail'}), 'unavailable'))
      .toEqual({status, body: {error: code}});
  }
  for (const error of [new Error('daily_limit'), {code: '23505', message: 'daily_limit'}, {code: 'P0001', message: 'private-detail'}]) {
    expect(chainFailure(chainStoreError(error), 'unavailable')).toEqual({status: 503, body: {error: 'unavailable'}});
  }
  expect(chainFailure(new ChainRequestError('seal_unpaid'), 'unavailable')).toEqual({status: 409, body: {error: 'seal_unpaid'}});
});
