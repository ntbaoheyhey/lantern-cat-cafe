import { afterAll, beforeAll, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { as, migratedDb } from './game-db';
import { dripIpHash } from '../../functions/_shared/guest-drip';
let db: PGlite;
beforeAll(async () => { db = await migratedDb(); });
afterAll(async () => {await db?.close();});
const wallet = (n: number) => `0x${n.toString(16).padStart(40,'0')}`;
const ip = (n: number) => n.toString(16).padStart(64,'0');
const sponsor = wallet(9999);
async function player(n: number) {
  return (await db.query<{id: string}>('select public.upsert_player_by_wallet($1) id', [wallet(n)])).rows[0]!.id;
}
async function reserve(n: number, pIp = ip(n), balance = '10000000000000000000', pSponsor = sponsor) {
  return (await db.query<{r: {nonce: number; wallet: string; status: string}}>(
    'select public.chain_drip_reserve($1,$2,$3,$4,0,25000000000,$5) r', [await player(n),wallet(n),pIp,pSponsor,balance])).rows[0]!.r;
}
it('is address-idempotent, allocates distinct sponsor nonces, and never reserves below 1 AVAX', async () => {
  const first = await reserve(1); expect(first.nonce).toBe(0);
  expect(await reserve(1)).toEqual(first);
  expect((await reserve(2)).nonce).toBe(1);
  await expect(reserve(3,ip(3),'999999999999999999')).rejects.toThrow('sponsor_low');
  await expect(reserve(3,ip(3),'1100000000000000000')).rejects.toThrow('sponsor_low');
});
it('reserves at most three recipients per IP in a rolling day', async () => {
  for(const n of [10,11,12]) await reserve(n,ip(100));
  await expect(reserve(13,ip(100))).rejects.toThrow('ip_limit');
});
it('checks wallet identity and restricts RPC/table access to the service role', async () => {
  await expect(db.query('select public.chain_drip_reserve($1,$2,$3,$4,0,1,1)', [await player(20),wallet(21),ip(20),sponsor])).rejects.toThrow('unauthenticated');
  for(const role of ['anon','authenticated'] as const) {
    await expect(as(db,role,null,() => reserve(30))).rejects.toThrow(/permission denied/);
    await expect(as(db,role,null,() => db.query('select * from public.chain_guest_drips'))).rejects.toThrow(/permission denied/);
  }
});
it('retains identical signed bytes and refuses transaction replacement', async () => {
  const hash = `0x${'a'.repeat(64)}`;
  const save = async (raw: string) => (await db.query<{ok:boolean}>('select public.chain_drip_signed($1,$2,$3) ok',[wallet(1),raw,hash])).rows[0]!.ok;
  expect(await save('0xab')).toBe(true); expect(await save('0xab')).toBe(true); expect(await save('0xcd')).toBe(false);
  await db.query('select public.chain_drip_result($1,$2,true)',[wallet(1),hash]);
  expect((await reserve(1)).status).toBe('confirmed'); expect(await save('0xab')).toBe(false);
});
it('atomically enforces the UTC-day global budget under concurrent callers', async () => {
  const rows = await Promise.allSettled(Array.from({length:60},(_,i)=>reserve(100+i,ip(100+i),'100000000000000000000')));
  const count = (await db.query<{n:number}>('select count(*)::int n from public.chain_guest_drips')).rows[0]!.n;
  expect(count).toBe(50); expect(rows.filter(r=>r.status==='rejected').length).toBe(15);
  expect((await db.query<{n:number}>('select count(distinct nonce)::int n from public.chain_guest_drips')).rows[0]!.n).toBe(50);
});
it('hashes only the gateway-appended hop and never exposes a plaintext IP', async () => {
  const secret = 'test-only-secret';
  const hash = await dripIpHash('evil, 192.0.2.1',secret);
  expect(hash).toBe(await dripIpHash('different, 192.0.2.1',secret));
  expect(hash).toMatch(/^[a-f0-9]{64}$/); expect(hash).not.toContain('192.0.2.1');
  expect(await dripIpHash(null,secret)).toBe(await dripIpHash('',secret));
});
