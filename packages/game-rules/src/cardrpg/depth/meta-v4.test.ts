import { describe, it, expect } from 'vitest';
import * as R from './index';
import { QUESTS } from '../catalog';
import { clone } from '../internal';
const fresh=()=>R.setGameplayV4(R.createDepthAccount(17),true);
const take=(r:R.RuleResult<R.DepthAccount>)=>{expect(r.ok,r.error).toBe(true);return r.state;};
const capped=(s:R.DepthAccount)=>{s.account.daily.earned={...R.DEPTH_CAPS};return s;};
describe('v4 permanent collection and shared reward board',()=>{
 it('records the last owned template before salvage without mutating the caller',()=>{
  const s=fresh(),gear=R.makeGear(s,'bellsteel-weapon-common',3);s.gear.push(gear);const copy=clone(s);
  const next=take(R.salvageGear(s,gear.id));expect(s).toEqual(copy);expect(next.gear.some(g=>g.id===gear.id)).toBe(false);expect(R.journalV4(next).gear).toContain(gear.templateId);
  expect(R.journalV4(R.importSave(R.exportSave(next)))).toEqual(R.journalV4(next));
 });
 it('keeps a four-piece set discovery after unequip',()=>{
  let s=fresh();for(const slot of ['weapon','outfit','charm','relic'] as const){const gear=R.makeGear(s,`bellsteel-${slot}-common`,3);s.gear.push(gear);s=take(R.equipGear(s,'mochi',gear.id));}
  expect(R.journalV4(s).sets).toContain('bellsteel');s=take(R.equipGear(s,'mochi',null,'weapon'));expect(R.journalV4(s).sets).toContain('bellsteel');
 });
 it('retains a permanent milestone when daily space is zero and settles once next day',()=>{
  let s=capped(fresh());s.v4!.journal={cats:[],gear:R.GEAR.slice(0,12).map(g=>g.id),sets:[],rewardedRoutes:0,claims:[]};
  const refused=R.claimMilestoneV4(s,'twelve-templates');expect(refused.ok).toBe(false);expect(refused.state).toEqual(s);
  s=take(R.metaCommand(s,{type:'advanceLocalDay'}));const before=s.account.currencies.threads;s=take(R.claimMilestoneV4(s,'twelve-templates'));expect(s.account.currencies.threads-before).toBe(40);
  const twice=R.claimMilestoneV4(s,'twelve-templates');expect(twice.ok).toBe(false);expect(twice.state).toEqual(s);
 });
 it('previews partial reward exactly before a once-only claim',()=>{
  let s=fresh();s.v4!.journal={cats:[],gear:[],sets:[],rewardedRoutes:10,claims:[]};s.account.daily.earned.stamps=170;
  expect(R.milestonePreviewV4(s,'ten-routes').reward).toEqual({stamps:10});const before=s.account.currencies.stamps;s=take(R.claimMilestoneV4(s,'ten-routes'));expect(s.account.currencies.stamps-before).toBe(10);
 });
 it('grants a cosmetic ribbon once or its disclosed thread duplicate',()=>{
  for(const owned of [false,true]){let s=fresh();s.cleared=[1,2,3];if(owned)s.account.inventory.stacks['cafe-ribbon']=1;
   const before=s.account.currencies.threads;s=take(R.claimMilestoneV4(s,'three-chapters'));expect(s.account.inventory.stacks['cafe-ribbon']).toBe(1);expect(s.account.currencies.threads-before).toBe(owned?20:0);
   expect(R.claimMilestoneV4(s,'three-chapters').ok).toBe(false);}
 });
 it('keeps a completed achievement pending at a full daily allowance',()=>{
  let s=capped(fresh());s.account.quests['first-boss']!.progress=1;
  expect(R.metaCommand(s,{type:'claimQuest',questId:'first-boss'})).toMatchObject({ok:false,state:s});expect(R.boardPreviewV4(s,'first-boss').reason).toMatch(/full/);
  s=take(R.metaCommand(s,{type:'advanceLocalDay'}));s=take(R.metaCommand(s,{type:'claimQuest',questId:'first-boss'}));expect(s.account.daily.earned.essence).toBe(6);expect(s.account.quests['first-boss']!.claimed).toBe(true);
 });
 it('honors stack capacity and leaves a weekly claim atomic',()=>{
  let s=capped(fresh());s.account.quests['weekly-wins']!.progress=3;s.account.inventory.stacks['pantry-key']=99;
  expect(R.metaCommand(s,{type:'claimQuest',questId:'weekly-wins'}).ok).toBe(false);s.account.inventory.stacks['pantry-key']=0;
  s=take(R.metaCommand(s,{type:'claimQuest',questId:'weekly-wins'}));expect(s.account.inventory.stacks['pantry-key']).toBe(1);expect(s.account.daily.earned).toEqual(R.DEPTH_CAPS);
 });
 it('rejects unknown or unfinished claims without creating journal state',()=>{
  const s=fresh();for(const id of ['unknown','six-cats','ten-routes'])expect(R.claimMilestoneV4(s,id)).toMatchObject({ok:false,state:s});
  for(const q of QUESTS)expect(R.metaCommand(s,{type:'claimQuest',questId:q.id}).ok).toBe(false);
 });
 it('migrates THC11 and OFF THC7 without inventing historical route counts',()=>{
  const s=fresh(),payload=JSON.stringify(s),old=`THC11.${R.saveChecksum(payload)}.${payload}`;
  const loaded=R.importSave(old);expect(R.journalV4(loaded).rewardedRoutes).toBe(0);expect(R.journalV4(loaded).cats.length).toBe(3);expect(R.exportSave(loaded)).toMatch(/^THC12\./);
  const off=R.createDepthAccount(17);expect(R.importSave(R.exportSave(off))).toEqual(off);expect(R.exportSave(off)).toMatch(/^THC7\./);
 });
 it('rejects malformed histories, duplicates and invalid clocks in saved data',()=>{
  for(const journal of [null,{cats:['unknown'],gear:[],sets:[],rewardedRoutes:0,claims:[]},{cats:[],gear:[],sets:[],rewardedRoutes:-1,claims:[]},{cats:[],gear:[],sets:[],rewardedRoutes:0,claims:['six-cats','six-cats']}]){
   const s=fresh();s.v4!.journal=journal as R.CollectionJournalV4;expect(()=>R.exportSave(s)).toThrow();}
  const s=fresh();s.v4!.clockWatermark=-1;expect(()=>R.exportSave(s)).toThrow();
 });
});
describe('v4 elapsed cafe shift and staged lessons',()=>{
 it('claims actual elapsed time, caps at two and cannot replay or roll back',()=>{
  let s=fresh();expect(R.claimCafeShiftV4(s,0).ok).toBe(false);
  const preview=R.cafeShiftV4(s,3600000),before={...s.account.currencies};expect(preview.claims).toBe(2);s=take(R.claimCafeShiftV4(s,3600000));
  for(const [id,n]of Object.entries(preview.reward))expect(s.account.currencies[id as keyof typeof before]-before[id as keyof typeof before]).toBe(n);
  expect(s.account.daily.service).toBe(2);expect(s.idle.lastAt).toBe(3600000);expect(R.claimCafeShiftV4(s,3600000)).toMatchObject({ok:false,state:s});expect(R.cafeShiftV4(s,0).rollback).toBe(true);expect(R.cafeShiftV4(s,0).claims).toBe(0);
 });
 it('rejects rollback after a calendar refresh even before a service claim',()=>{
  const s=take(R.syncCalendarDay(fresh(),5*86400000));expect(R.cafeShiftV4(s,3600000).rollback).toBe(true);expect(R.claimCafeShiftV4(s,3600000)).toMatchObject({ok:false,state:s});
 });
 it('does not consume the service clock at a full allowance',()=>{
  const s=capped(fresh());expect(R.claimCafeShiftV4(s,3600000)).toMatchObject({ok:false,state:s});expect(s.idle.lastAt).toBe(0);
 });
 it('crossing thirty absent days credits only the current two services',()=>{
  const s=take(R.claimCafeShiftV4(fresh(),30*86400000+3600000));expect(s.account.daily.service).toBe(2);expect(s.account.day).toBe(31);expect(s.account.daily.earned.fish).toBe(280);expect(s.account.daily.earned.stamps).toBe(140);
 });
 it('reports a future useful time without mutating input',()=>{
  const s=fresh(),copy=clone(s),preview=R.cafeShiftV4(s,0);expect(preview.readyAt).toBeGreaterThan(0);expect(R.cafeShiftV4(s,preview.readyAt).claims).toBeGreaterThan(0);expect(s).toEqual(copy);
 });
 it('requires ON mode and keeps failed calls atomic',()=>{
  const s=R.createDepthAccount(17);expect(R.claimCafeShiftV4(s,3600000)).toMatchObject({ok:false,state:s});expect(R.claimMilestoneV4(s,'six-cats')).toMatchObject({ok:false,state:s});
 });
 it('teaches one ordered decision, persists it and stops repeating from day seven',()=>{
  let s=fresh();expect(R.currentLessonV4(s)?.id).toBe('front');expect(R.finishLessonV4(s,'gear').ok).toBe(false);
  for(const lesson of R.LESSONS_V4){s=take(R.finishLessonV4(s,lesson.id));expect(R.finishLessonV4(s,lesson.id).ok).toBe(false);}
  expect(R.currentLessonV4(R.importSave(R.exportSave(s)))).toBeNull();const returning=fresh();returning.account.day=7;expect(R.currentLessonV4(returning)).toBeNull();
 });
});
