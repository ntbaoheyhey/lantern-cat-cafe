import {describe,it,expect} from 'vitest';
import {applyIssuance,createIssuanceLedger,replayIssuance,validateIssuance,EDITIONS,type AuthorityContext,type IssuanceCommand,type IssuanceLedger} from './scarcity';
import {clone} from '../internal';
const now=Date.UTC(2026,10,8),nextMonth=Date.UTC(2026,11,8);
function ctx(accountId='a',time=now):AuthorityContext{return {accountId,now:time,effort:Array.from({length:20},(_,day)=>({id:`${accountId}:proof:${day}`,day,source:'boss-day'})),chapterOne:true,allMasteries:true,towerBest:5};}
const cmd=(revision=0,accountId='a',commandId='reserve-a'):Extract<IssuanceCommand,{kind:'reserve'}>=>({kind:'reserve',edition:'moon-collar',accountId,commandId,expectedRevision:revision});
function ok(l:IssuanceLedger,c:IssuanceCommand,x=ctx(c.accountId)){const r=applyIssuance(l,c,x);expect(r.ok,r.ok?'':r.error).toBe(true);return r.ledger;}
describe('local edition authority',()=>{
 it('issues atomically, returns exact replay and rejects changed command IDs',()=>{
  const l=createIssuanceLedger('local',now),c=cmd(),r=applyIssuance(l,c,ctx());expect(r.ok).toBe(true);expect(l.revision).toBe(0);
  expect(r.ledger.lifetimeIssued['moon-collar']).toBe(1);expect(r.ledger.consumedProofIds).toHaveLength(3);
  const replay=applyIssuance(r.ledger,c,ctx());expect(replay.ok).toBe(true);expect(replay.ledger).toBe(r.ledger);
  expect(applyIssuance(r.ledger,{...c,edition:'golden-maneki'},ctx()).ok).toBe(false);
  expect(replayIssuance(r.ledger.genesis,r.ledger.events)).toEqual(r.ledger);
 });
 it('lets only one concurrent request take the last lifetime or season slot',()=>{
  for(const cap of ['lifetime','season'] as const){
   const l=createIssuanceLedger('local',now,{lifetime:{'moon-collar':cap==='lifetime'?2399:399,'golden-maneki':0},seasonal:{'moon-collar':399,'golden-maneki':0},reservations:[]});
   const a=ok(l,cmd());expect(applyIssuance(a,cmd(0,'b','second'),ctx('b')).ok).toBe(false);
   expect(applyIssuance(a,cmd(a.revision,'b','retry'),ctx('b')).ok).toBe(false);
  }
 });
 it('enforces effort uniqueness, qualifications, owner and one reservation per day',()=>{
  const l=createIssuanceLedger('local',now),x=ctx();x.effort=x.effort.slice(0,2);expect(applyIssuance(l,cmd(),x).ok).toBe(false);
  x.effort=[ctx().effort[0]!,ctx().effort[0]!,ctx().effort[0]!];expect(applyIssuance(l,cmd(),x).ok).toBe(false);
  expect(applyIssuance(l,cmd(),{...ctx(),chapterOne:false}).ok).toBe(false);
  const a=ok(l,cmd());expect(applyIssuance(a,{...cmd(1),commandId:'gold',edition:'golden-maneki'},ctx()).ok).toBe(false);
  const own=a.reservations[0]!.id;expect(applyIssuance(a,{kind:'burn',commandId:'steal',expectedRevision:1,accountId:'b',reservationId:own},ctx('b')).ok).toBe(false);
 });
 it('does not reopen supply, proof or account allowances after burning',()=>{
  let l=ok(createIssuanceLedger('local',now),cmd());l=ok(l,{kind:'burn',commandId:'burn',expectedRevision:1,accountId:'a',reservationId:l.reservations[0]!.id});
  expect(l.lifetimeIssued['moon-collar']).toBe(1);expect(l.consumedProofIds).toHaveLength(3);expect(l.reservations[0]!.status).toBe('burned');
  expect(applyIssuance(l,cmd(2,'a','again'),ctx('a',now+86400000)).ok).toBe(false);
 });
 it('rolls months forward without resetting lifetime supply and fuses different seasons',()=>{
  let l=ok(createIssuanceLedger('local',now),cmd());
  expect(applyIssuance(l,cmd(1,'a','early'),ctx('a',nextMonth)).ok).toBe(false);
  l=ok(l,{kind:'advance-season',expectedRevision:1,accountId:'a',commandId:'month'},ctx('a',nextMonth));
  l=ok(l,cmd(2,'a','new-season'),ctx('a',nextMonth));expect(l.lifetimeIssued['moon-collar']).toBe(2);expect(l.consumedProofIds).toHaveLength(6);
  l=ok(l,{kind:'fuse',expectedRevision:3,accountId:'a',commandId:'fuse',reservationIds:[l.reservations[0]!.id,l.reservations[1]!.id]},ctx('a',nextMonth));
  expect(l.reservations.every(r=>r.status==='fused')).toBe(true);expect(l.badges).toEqual(['a']);expect(l.lifetimeIssued['moon-collar']).toBe(2);
  expect(applyIssuance(l,{kind:'advance-season',expectedRevision:4,accountId:'a',commandId:'back'},ctx()).ok).toBe(false);
  expect(replayIssuance(l.genesis,l.events)).toEqual(l);
 });
 it('rejects altered snapshots, proofs, sequence and unsafe numbers',()=>{
  const l=ok(createIssuanceLedger('local',now),cmd());
  for(const edit of [(s:IssuanceLedger)=>{s.lifetimeIssued['moon-collar']=0;},(s:IssuanceLedger)=>{s.events[0]!.proofIds=[];},(s:IssuanceLedger)=>{s.events[0]!.sequence=2;},(s:IssuanceLedger)=>{s.revision=Number.MAX_SAFE_INTEGER+1;}]){const bad=clone(l);edit(bad);expect(()=>validateIssuance(bad)).toThrow();expect(applyIssuance(bad,cmd(1),ctx()).ledger).toBe(bad);}
  expect(applyIssuance(l,{...cmd(1),commandId:'__proto__'},ctx()).ok).toBe(false);
 });
 it('keeps production edition caps explicit and rejects corrupt legacy counters',()=>{
  expect(EDITIONS['golden-maneki']).toMatchObject({lifetime:360,season:60,seals:10});
  expect(()=>createIssuanceLedger('local',now,{lifetime:{'moon-collar':2401,'golden-maneki':0},seasonal:{'moon-collar':0,'golden-maneki':0},reservations:[]})).toThrow();
 });
});
