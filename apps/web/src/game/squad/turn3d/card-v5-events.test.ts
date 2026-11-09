import { describe,it,expect } from 'vitest';
import { readV5Events,applyV5Presentation,REACTION_WORDS } from './card-v5-events';
import { statusPresentation,statusImpactLabels } from './card-status-beats';
import { selectedFixture,caseNames } from '../../../../../../tools/cardrpg-look/skills-v5/v3-playback';

describe('published S4 fixture presentation',()=>{
 it.each(caseNames)('renders %s without mutating snapshots/events or action duration',name=>{
  const f=selectedFixture(name),before=JSON.stringify(f);
  const view=applyV5Presentation(f.plan,statusPresentation(f.plan,f.battle.log),f.plan.v5);
  expect(readV5Events(f.plan.v5!.events).length).toBeGreaterThan(0);
  for(const b of [...view.beats,...view.reactions??[],...view.landings??[]]){expect(b.at).toBeGreaterThanOrEqual(0);expect(b.at+b.duration).toBeLessThanOrEqual(f.plan.duration);}
  if(Object.hasOwn(REACTION_WORDS,name))expect(view.reactions?.some(r=>r.id===name)).toBe(true);
  if(name==='multi-hit'){const hits=view.landings!;expect(hits).toHaveLength(3);expect(new Set(hits.map(h=>h.targetId)).size).toBeLessThan(3);expect(hits.map(h=>h.at-hits[0]!.at)).toEqual([0,70,140]);}
  if(name==='splash')expect(view.landings?.slice(1).every(h=>h.scale<1)).toBe(true);
  if(name==='bitter')expect(f.plan.targetIds.flatMap(id=>statusImpactLabels(f.plan,id,view)).some(l=>l.bitter)).toBe(true);
  if(name==='bleed')expect([...view.tickIds!.values()]).toContain('snag');
  expect(JSON.stringify(f)).toBe(before);
 });
 it('ignores malformed and future event versions without guessing cues',()=>{
  const f=selectedFixture('wildfire'),legacy=statusPresentation(f.plan,f.battle.log);
  for(const events of [[{version:999}], [null], [{version:2,kind:'reaction',sequence:1,actionId:1,logIndex:1,reactionId:'wildfire',targets:42}],[]]){
   expect(readV5Events(events)).toEqual([]);expect(applyV5Presentation(f.plan,legacy,{events,before:[],after:[]})).toBe(legacy);
  }
 });
 it('clears consumed primers using published snapshots',()=>{
  const f=selectedFixture('rupture'),view=applyV5Presentation(f.plan,statusPresentation(f.plan,f.battle.log),f.plan.v5);
  expect(view.beats.some(b=>b.kind==='expire'&&b.statusId==='snag')).toBe(true);
  for(const r of view.reactions!){expect(r.duration).toBeGreaterThanOrEqual(400);expect(r.duration).toBeLessThanOrEqual(600);}
 });
});
