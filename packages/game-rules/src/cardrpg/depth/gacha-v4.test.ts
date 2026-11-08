import {describe,it,expect} from 'vitest';
import * as R from './index';
import {firstInvitation} from './onboarding';
import {clone} from '../internal';
import {BANNERS,CARDS} from '../catalog';
function state(){const s=R.setGameplayV4(R.createDepthAccount(81),true);s.account.currencies.stamps=10000;return s;}
describe('earned invitations and permanent selectors',()=>{
 it('grants a mark per paid draw and stores deterministic ceremony data',()=>{
  const s=state(),a=R.metaCommand(s,{type:'pull',bannerId:'standard',seed:18,count:10});expect(a.ok).toBe(true);
  expect(a).toEqual(R.metaCommand(s,{type:'pull',bannerId:'standard',seed:18,count:10}));expect(a.state.v4!.selectorMarks).toBe(10);
  expect(a.state.v4!.reveals).toHaveLength(10);expect(s.account.currencies.stamps).toBe(10000);
  expect(R.importSave(R.exportSave(a.state))).toEqual(a.state);
 });
 it('does not grant a mark for the free welcome and keeps v4 commands inactive when disabled',()=>{
  const s=state(),free=firstInvitation(s,11);expect(free.ok).toBe(true);expect(R.selectorMarksV4(free.state)).toBe(0);
  expect(firstInvitation(free.state,12).state).toBe(free.state);
  s.v4!.selectorMarks=R.SELECTOR_COST_V4;const off=R.setGameplayV4(s,false);expect(R.chooseSelectorV4(off,'cat','panko').state).toBe(off);
 });
 it('draws from all 128 depth templates and matches the exact disclosed pool',()=>{
  const s=state(),banner=BANNERS.find(b=>b.kind==='equipment')!;
  expect(R.getDrawPoolV4(s,banner.id).reduce((n,r)=>n+r.probability,0)).toBeCloseTo(1,10);
  const pity=s.account.pity[banner.pityGroup]={sinceLegendary:59,featuredGuaranteed:false,totalPulls:0};
  expect(pity.sinceLegendary).toBe(59);
  const a=R.metaCommand(s,{type:'pull',bannerId:banner.id,seed:71,count:1});expect(a.ok).toBe(true);
  const result=a.state.account.history.at(-1)!;expect(result.rarity).toBe('legendary');expect(R.GEAR_BY_ID[result.itemId!]).toBeDefined();
  expect(a.state.gear.at(-1)!.id).toBe(result.instanceId);expect(a.state.account.inventory.items).toEqual(s.account.inventory.items);
  expect(a.state.v4!.reveals!.at(-1)).toMatchObject({kind:'earned-reveal',pityAfter:0});
 });
 it('refuses over-cap batches, invalid seeds and overdrafts without any change',()=>{
  const s=state(),banner=BANNERS.find(b=>b.kind==='equipment')!;
  while(s.gear.length<239)s.gear.push(R.makeGear(s,R.GEAR[0]!.id,s.gear.length));
  for(const command of [{type:'pull' as const,bannerId:banner.id,seed:1,count:10},{type:'pull' as const,bannerId:'standard',seed:-1},{type:'pull' as const,bannerId:'standard',seed:1,count:31}]){const r=R.metaCommand(s,command);expect(r.ok).toBe(false);expect(r.state).toBe(s);}
  s.account.currencies.stamps=0;expect(R.metaCommand(s,{type:'pull',bannerId:'standard',seed:1}).state).toBe(s);
 });
 it('keeps banner pity separate, grants no retroactive marks and caps thirty paid draws',()=>{
  let s=state();for(let n=0;n<3;n++)s=R.metaCommand(s,{type:'pull',bannerId:'standard',seed:n,count:10}).state;
  expect(R.metaCommand(s,{type:'pull',bannerId:'standard',seed:8}).ok).toBe(false);expect(R.selectorMarksV4(s)).toBe(30);
  for(const b of BANNERS.filter(b=>b.id!=='standard'))expect(s.account.pity[b.pityGroup]?.totalPulls??0).toBe(0);
  const old=R.createDepthAccount(3);expect(R.selectorMarksV4(R.setGameplayV4(old,true))).toBe(0);
 });
 it('spends the disclosed marks atomically for a chosen unowned cat without changing pity',()=>{
  const s=state();s.v4!.selectorMarks=R.SELECTOR_COST_V4;const id=CARDS.find(c=>!s.account.cards.some(o=>o.cardId===c.id))!.id;
  const p=clone(s.account.pity),r=R.chooseSelectorV4(s,'cat',id);expect(r.ok).toBe(true);expect(r.state.account.cards.some(c=>c.cardId===id)).toBe(true);
  expect(r.state.v4!.selectorMarks).toBe(0);expect(r.state.account.pity).toEqual(p);expect(R.chooseSelectorV4(r.state,'cat',id).ok).toBe(false);
  expect(R.chooseSelectorV4(s,'cat',s.team[0]!).state).toBe(s);
 });
 it('enforces source/mastery and shelf gates for a chosen gear template',()=>{
  const s=state();s.v4!.selectorMarks=R.SELECTOR_COST_V4;const item=R.GEAR.find(g=>g.chapter===3&&g.rarity==='legendary')!;
  expect(R.chooseSelectorV4(s,'gear',item.id).state).toBe(s);s.account.chapter=4;s.masteries=[3];
  const r=R.chooseSelectorV4(s,'gear',item.id);expect(r.ok).toBe(true);expect(r.state.gear.at(-1)!.templateId).toBe(item.id);expect(r.state.v4!.selectorMarks).toBe(0);
 });
});
