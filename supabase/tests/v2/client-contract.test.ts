import type { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { SupabaseGameApiV2 } from '../../../apps/web/src/api/SupabaseGameApiV2.ts';
import { GameApiErrorV2 } from '../../../apps/web/src/api/GameApiErrorV2.ts';
import type { ServerStateV2 } from '../../../apps/web/src/api/GameApiV2.ts';
import { dayDate, GameError } from '../../functions/_shared/game.ts';
import { routesV2 } from '../../functions/_shared/v2/game.ts';
import type { ForgeDepsV2 } from '../../functions/_shared/v2/forge.ts';
import { handlerV2 } from '../../functions/_shared/v2/http.ts';
import { migratedDb } from '../src/game-db.ts';
import { fn, newPlayer, readyForBoss, setStacks, stack } from './helpers.ts';
import { pgliteV2Store } from './v2-store.ts';

let db: PGlite, clock = Date.now();
const players = new Set<string>(), exercised = new Set<string>();
const store = pgliteV2Store(() => db);
const sign = vi.fn(async (): Promise<`0x${string}`> => { throw new Error('blocked forge paths must never sign'); });
const deps: ForgeDepsV2 = { store, seedSecret: 'contract-test-seed', now: () => clock,
  relic: { signer: { verifyingContract: '0x0000000000000000000000000000000000000001', sign }, chain: { nonceUsed: async () => false, receipt: async () => null } } };
const started = performance.now();
beforeAll(async () => { db = await migratedDb(); });
beforeEach(() => { clock = Date.now(); });
afterAll(async () => { await db.close(); expect(performance.now() - started).toBeLessThan(60_000); });
function clientFor(player: string, using = deps) {
  let token: string | null = player;
  const calls: string[] = [], routes = routesV2(using);
  const fakeFetch: typeof fetch = async (input, init) => {
    const req = new Request(input, init), name = new URL(req.url).pathname.split('/').at(-1)!;
    calls.push(name); exercised.add(name);
    const route = routes[name as keyof typeof routes];
    if (!route) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
    expect(req.method).toBe('POST'); expect(req.headers.get('apikey')).toBe('anon-test');
    return handlerV2({ authenticate: async request => {
      const auth = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
      if (!auth || !players.has(auth)) throw new GameError('unauthenticated');
      return auth;
    }, json: (_request, data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } }) }, route)(req);
  };
  return { api: new SupabaseGameApiV2({ baseUrl: 'https://contract.test', anonKey: 'anon-test', getToken: () => token, fetch: fakeFetch }), calls,
    setToken: (next: string | null) => { token = next; }, fetch: fakeFetch };
}
async function fresh(chosen = true) {
  const player = await newPlayer(db); players.add(player);
  const transport = clientFor(player);
  await transport.api.getState();
  if (chosen) await transport.api.chooseClass('warrior');
  return { player, ...transport };
}
async function ready(strong: boolean, keys = v2.V2_CONFIG.boss.keyCost) {
  const account = await fresh(); await readyForBoss(db, account.player, keys);
  await db.query('update cat_state set kills = $2, level = $3 where player_id = $1', [account.player, v2.CHAPTERS[0]!.killsPerRound, strong ? v2.V2_CONFIG.cat.maxLevel : 1]);
  return account;
}
async function error(promise: Promise<unknown>, code: string, fields = {}) {
  const failure = await promise.then(() => { throw new Error(`expected ${code}, received success`); }, e => e);
  expect(failure).toBeInstanceOf(GameApiErrorV2); expect(failure).toMatchObject({ code, ...fields });
  return failure as GameApiErrorV2;
}
function expectServerStateShape(state: ServerStateV2) {
  expect(state.cat).toMatchObject({ level: expect.any(Number), xp: expect.any(Number), xpToNext: expect.any(Number) });
  // The documented wire representation of stacks is currencies + materials, not raw SQL stacks.
  expect(state.currencies).toEqual({ fish: expect.any(Number), yarn: expect.any(Number), keys: expect.any(Number) });
  expect(state.materials).toBeTypeOf('object'); expect(state.inventory).toBeInstanceOf(Array);
  expect(state.bosses.chapters).toHaveLength(5); expect(state.forge).toHaveProperty('blockedBy');
  expect(state.equipped).toHaveProperty('weapon'); expect(state.serverTime).toBeTypeOf('number');
}
it('1: covers all client endpoints, deployed folders and real route keys both ways', async () => {
  const clientSource = readFileSync(fileURLToPath(new URL('../../../apps/web/src/api/SupabaseGameApiV2.ts', import.meta.url)), 'utf8');
  const client = [...clientSource.matchAll(/this\.post\('(v2-[^']+)'/g)].map(m => m[1]!).sort();
  const folders = readdirSync(fileURLToPath(new URL('../../functions/', import.meta.url)), { withFileTypes: true }).filter(d => d.isDirectory() && d.name.startsWith('v2-')).map(d => d.name).sort();
  const routes = Object.keys(routesV2(deps)).sort();
  console.log('client:', client, 'folders:', folders, 'routes:', routes);
  expect(client).toEqual(folders); expect(routes).toEqual(client); expect(client).toHaveLength(9);
  const c = clientFor('unknown');
  expect((await c.fetch('https://contract.test/functions/v1/unknown', { method: 'POST' })).status).toBe(404);
});
it('2: client happy path persists claim revision, equipment, crafting, locks, salvage and boss state', async () => {
  const { player, api } = await fresh(false);
  expect((await api.getState()).cat.classId).toBeNull();
  const chosen = await api.chooseClass('warrior'); expectServerStateShape(chosen);
  const before = (await store.snapshot(player, dayDate(clock / 1000)))!;
  clock += 10 * 60_000;
  const claim = await api.claim(); expect(claim.gains.xp).toBeGreaterThan(0); expect(claim.gains.fish).toBeGreaterThan(0);
  expect((await store.snapshot(player, dayDate(clock / 1000)))!.progressRev).toBeGreaterThan(before.progressRev);
  const weapon = chosen.equipped.weapon!;
  expect((await api.equip(null, 'weapon')).equipped.weapon).toBeNull();
  expect((await api.equip(weapon, 'weapon')).equipped.weapon).toBe(weapon);
  const recipe = v2.RECIPES.find(r => r.id === 'rcp.common')!;
  await setStacks(db, player, { ...recipe.materials, fish: recipe.fish });
  const craft = await api.craft('rcp.common', 'weapon'); expect(craft.state.inventory).toContainEqual(craft.item);
  expect((await api.setLocked(craft.item.id, true)).inventory.find(i => i.id === craft.item.id)!.locked).toBe(true);
  await api.setLocked(craft.item.id, false);
  const salvaged = await api.salvage([craft.item.id]); expect(salvaged.state.inventory.some(i => i.id === craft.item.id)).toBe(false);
  const boss = await ready(true);
  const result = await boss.api.fightBoss(1);
  expect(result.won).toBe(true); expect(result.timeline.at(-1)?.type).toBe('end'); expect(result.keySpent).toBe(true);
  expect(result.state.progress.chapter).toBe(2); expect(await stack(db, boss.player, 'catKey')).toBe(result.chest!.keys);
  const reloaded = await boss.api.getState(); expect(reloaded).toEqual(result.state); expectServerStateShape(reloaded);
});
it('3: keeps documented authentication, state, forge-stack, lock and cooldown errors with their extra fields', async () => {
  const account = await fresh(false);
  account.setToken(null); await error(account.api.getState(), 'unauthenticated');
  account.setToken('bad-token'); await error(account.api.getState(), 'unauthenticated'); account.setToken(account.player);
  await error(account.api.claim(), 'no_class'); await account.api.chooseClass('warrior');
  await error(account.api.fightBoss(1), 'not_reached'); await error(account.api.fightBoss(0), 'invalid_request');
  const none = await ready(false, 0); await error(none.api.fightBoss(1), 'no_key');
  const weak = await ready(false); const loss = await weak.api.fightBoss(1); expect(loss.won).toBe(false);
  const cooldown = await error(weak.api.fightBoss(1), 'cooldown', { cooldownUntil: loss.state.bosses.cooldownUntil });
  expect(Number.isFinite(cooldown.cooldownUntil)).toBe(true);
  const recipe = v2.RECIPES.find(r => r.id === 'rcp.common')!;
  await setStacks(db, account.player, { ...recipe.materials, fish: 0 });
  await error(account.api.craft('rcp.common', 'weapon'), 'not_enough', { stackId: 'fish' });
  const state = await account.api.getState(); await error(account.api.salvage([state.equipped.weapon!]), 'equipped');
  await setStacks(db, account.player, { ...recipe.materials, fish: recipe.fish });
  const crafted = await account.api.craft('rcp.common', 'weapon'); await account.api.setLocked(crafted.item.id, true);
  await error(account.api.salvage([crafted.item.id]), 'locked');
});
it('4: preserves all three forge blocked reasons without a signature or transaction', async () => {
  const { player, api } = await fresh();
  await error(api.forgeRelic(), 'forge_blocked', { reason: 'not_enough_yarn' });
  await setStacks(db, player, { yarn: v2.RELIC_RECIPE.materials.yarn });
  await error(api.forgeRelic(), 'forge_blocked', { reason: 'no_moon_pearl' });
  await setStacks(db, player, { ...v2.RELIC_RECIPE.materials });
  const result = await fn(db).forge(player, dayDate(clock / 1000));
  await store.voucherMinted(player, result!.voucher.nonce, null);
  await error(api.forgeRelic(), 'forge_blocked', { reason: 'daily_limit' }); expect(sign).not.toHaveBeenCalled();
});
it('5: one parallel first-clear client request succeeds and the other is stale', async () => {
  const { player } = await ready(true);
  let arrivals = 0, release!: () => void;
  const both = new Promise<void>(resolve => { release = resolve; });
  const racing: ForgeDepsV2 = { ...deps, store: { ...store, snapshot: async (...args) => {
    const row = await store.snapshot(...args);
    if (arrivals < 2) { if (++arrivals === 2) release(); await both; }
    return row;
  } } };
  const { api } = clientFor(player, racing);
  const results = await Promise.allSettled([api.fightBoss(1), api.fightBoss(1)]);
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  const rejected = results.find(r => r.status === 'rejected'); expect(rejected?.status).toBe('rejected');
  if (rejected?.status === 'rejected') { expect(rejected.reason).toBeInstanceOf(GameApiErrorV2); expect(rejected.reason.code).toBe('stale'); }
});
it('6: every documented endpoint was actually exercised through the client transport', () => {
  expect([...exercised].filter(n => n.startsWith('v2-')).sort()).toEqual(Object.keys(routesV2(deps)).sort());
});
