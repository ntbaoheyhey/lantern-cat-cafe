import { afterAll, beforeAll, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { getAddress, recoverTypedDataAddress, type Address } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { as, migratedDb } from './game-db';
import { createJudge, judgeBoss, judgeTrial, type JudgeEntitlement } from '../../functions/_shared/chain-judge';
import {replayBattle} from '../../../packages/game-rules/src/cardrpg/depth/battle';
import { voucherSigner, voucherDomain, VOUCHER_TYPES } from '../../functions/_shared/relic';
let db: PGlite;
beforeAll(async()=>{db=await migratedDb();});afterAll(async()=>{await db?.close();});
const wallet=(n:number)=>getAddress(`0x${n.toString(16).padStart(40,'0')}`);
const ip=(n:number)=>n.toString(16).padStart(64,'0');
const player=async(n:number)=>(await db.query<{id:string}>('select public.upsert_player_by_wallet($1) id',[wallet(n).toLowerCase()])).rows[0]!.id;
const reserve=async(p:string,w:string,h:string,b:boolean)=>(await db.query<{r:JudgeEntitlement[]}>('select public.chain_judge_reserve($1,$2,$3,$4) r',[p,w,h,b])).rows[0]!.r;
it('executes the scripted starter boss through real battle rules',()=>{
  const first=judgeBoss();expect(first.won).toBe(true);expect(first.rounds).toBeGreaterThan(0);
  expect(first.log.some(e=>e.kind==='defeat')).toBe(true);expect(judgeBoss()).toEqual(first);
});
it.each([false,true])('replays the three-cat V9 trial exactly, finale=%s',finale=>{
  const trial=judgeTrial(finale),battle=replayBattle(trial.replay.setup,trial.replay.choices);
  expect(trial.won).toBe(true);expect(battle.result).toBe('party');
  expect(trial.replay.setup.cats.map(c=>c.id)).toEqual(['mochi','clover','soot']);
  // The engine snapshots catalog stats so future balance changes cannot alter a recording.
  expect(trial.replay.setup.enemyStats).toBeDefined();
  expect(trial.replay.setup.enemies).toEqual(finale?['yarn-giant']:['needle-moth','teacup-healer','button-guard']);
  if(finale)expect(trial.replay.choices.filter(c=>c.skillId.endsWith('-4')).map(c=>c.skillId)).toEqual(['mochi-4','clover-4','soot-4']);
  expect(battle.log.map(row=>({actor:row.actorId,target:row.targetId,kind:row.kind,amount:row.amount}))).toEqual(trial.log);
  expect(trial.log.filter(e=>e.actor==='clover'&&['damage','dot','reflect','detonate'].includes(e.kind))).toEqual([]);
});
it('new trial actions reuse capped pass/boss entitlements without accepting client battle input',async()=>{
  const calls:boolean[]=[],judge=createJudge({store:{reserve:async(_p,_w,_ip,boss)=>{calls.push(boss);return [];}},signer:{verifyingContract:wallet(900),sign:async()=> '0x'},nonceUsed:async()=>false});
  expect((await judge('player',wallet(5),ip(5),'intro')).battle?.won).toBe(true);
  expect((await judge('player',wallet(5),ip(5),'finale')).battle?.won).toBe(true);
  expect(calls).toEqual([true,true]);
  await expect(judge('player',wallet(5),ip(5),{toString:()=> 'intro'})).rejects.toThrow('invalid_action');
  expect(calls).toEqual([true,true]);
});
it('issues exactly two pass entitlements plus one idempotent boss drop',async()=>{
  const p=await player(1),w=wallet(1).toLowerCase();
  const first=await reserve(p,w,ip(1),false);expect(first).toHaveLength(2);
  expect(await reserve(p,w,ip(1),false)).toEqual(first);
  const boss=await reserve(p,w,ip(1),true);expect(boss).toHaveLength(3);
  expect(await reserve(p,w,ip(1),true)).toEqual(boss);
});
it('never signs for a forged player and refuses public issuance/table access',async()=>{
  await expect(reserve(await player(2),wallet(1).toLowerCase(),ip(2),true)).rejects.toThrow('unauthenticated');
  for(const role of ['anon','authenticated'] as const){
    await expect(as(db,role,null,()=>reserve('00000000-0000-4000-8000-000000000001',wallet(1),ip(1),true))).rejects.toThrow('permission denied');
    await expect(as(db,role,null,()=>db.query('select * from chain_entitlements'))).rejects.toThrow('permission denied');
  }
});
it('caps accounts per trusted IP and globally per UTC day',async()=>{
  for(const n of [3,4,5])await reserve(await player(n),wallet(n).toLowerCase(),ip(3),false);
  await expect(reserve(await player(6),wallet(6).toLowerCase(),ip(3),false)).rejects.toThrow('ip_limit');
  for(let n=10;n<56;n++)await reserve(await player(n),wallet(n).toLowerCase(),ip(n),false);
  await expect(reserve(await player(60),wallet(60).toLowerCase(),ip(60),false)).rejects.toThrow('daily_limit');
});
it('binds signatures to the wallet and Fuji contract, renews the same nonce, suppresses used vouchers',async()=>{
  const key=generatePrivateKey(),signer=voucherSigner(key,wallet(900));let now=1700000000000,used=false;
  const judge=createJudge({signer,store:{reserve},nonceUsed:async()=>used,now:()=>now});
  const p=await player(1),w=wallet(1);
  const first=(await judge(p,w,ip(1),'pass')).vouchers;
  const {signature,used:_used,source:_source,...message}=first[0]!;
  expect(await recoverTypedDataAddress({domain:voucherDomain(wallet(900)),types:VOUCHER_TYPES,primaryType:'Voucher',message,signature})).toBe(privateKeyToAccount(key).address);
  expect(message.player).toBe(w);
  now+=700000;
  const renewed=(await judge(p,w,ip(1),'pass')).vouchers;
  expect(renewed[0]!.nonce).toBe(first[0]!.nonce);expect(renewed[0]!.expiry).toBeGreaterThan(first[0]!.expiry);
  used=true;expect((await judge(p,w,ip(1),'pass')).vouchers.every(v=>v.used&&v.signature==='0x')).toBe(true);
  await expect(judge(p,w,ip(1),'free-mint')).rejects.toThrow('invalid_action');
});
