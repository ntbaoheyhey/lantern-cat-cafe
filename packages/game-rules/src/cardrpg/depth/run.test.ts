import { expect, it } from 'vitest';
import { clone } from '../internal';
import { BOONS, boonValue } from './boons';
import { createDepthAccount, configureTeam, availableSkills } from './state';
import { availableNodes, calendarChallenge, CHAPTERS, chooseReward, enterNode, EVENTS, generateMap, resolveNode, startRun } from './run';
import { playRun } from './run-bot';

it('generates nine connected nodes and seven-node routes with guaranteed shop and campfire',()=>{
  for(let seed=0;seed<60;seed++)for(const c of CHAPTERS){
    const map=generateMap(seed,c.id);expect(map).toEqual(generateMap(seed,c.id));expect(map).toHaveLength(9);
    expect(new Set(map.map(n=>n.kind)).size).toBe(7);
    const seen=new Set<string>();
    function walk(id:string,path:string[]){const n=map.find(n=>n.id===id)!;seen.add(id);const next=[...path,n.kind];if(n.kind==='boss'){expect(next).toHaveLength(7);expect(next).toContain('shop');expect(next).toContain('campfire');}for(const id of n.next)walk(id,next);}
    walk(map[0]!.id,[]);expect(seen.size).toBe(map.length);
  }
});
it('rejects unreachable nodes and changes during a run atomically',()=>{
  const s=startRun(createDepthAccount(),1,2).state,before=clone(s);
  expect(enterNode(s,'6-0').ok).toBe(false);expect(s).toEqual(before);
  expect(configureTeam(s,s.team,s.rows,s.skills).ok).toBe(false);
});
it('unlocks the fourth skill through either level or duplicate stars',()=>{
  const s=createDepthAccount();expect(availableSkills(s,'mochi')).toHaveLength(3);
  s.account.cards[0]!.stars=3;expect(availableSkills(s,'mochi')).toHaveLength(4);
  s.account.cards[0]!.stars=1;s.account.cards[0]!.level=6;expect(availableSkills(s,'mochi')).toHaveLength(4);
});
it('has thirty stack-capped charms across six build archetypes',()=>{
  expect(BOONS).toHaveLength(30);expect(new Set(BOONS.map(b=>b.archetype)).size).toBe(6);
  for(const boon of BOONS)expect(boonValue({boons:{[boon.id]:99}},boon.trigger)).toBe(boon.value*boon.cap);
});
it('rejects a reward selected twice and overflowing a charm cap',()=>{
  const s=startRun(createDepthAccount(),1,1).state,r=s.run!;r.current='0-0';r.rewardChoices=['shelter-1'];r.boons['shelter-1']=2;
  expect(chooseReward(s,'shelter-1').ok).toBe(false);r.boons['shelter-1']=1;
  const result=chooseReward(s,'shelter-1');expect(result.ok).toBe(true);expect(chooseReward(result.state,'shelter-1').ok).toBe(false);
});
for(const event of EVENTS)for(const option of event.choices)it(`resolves ${event.name} / ${option.label} with exact tradeoffs`,()=>{
  const s=startRun(createDepthAccount(),1,2).state,r=s.run!;r.current='1-0';r.nodes.find(n=>n.id==='1-0')!.eventId=event.id;r.points=100;
  const hp=clone(r.hp),result=resolveNode(s,option.id);expect(result.ok).toBe(true);expect(result.state.run!.points).toBe(100-option.cost+option.points);
  if(option.heal<0)for(const id of s.team)expect(result.state.run!.hp[id]).toBeLessThan(hp[id]!);
  if(option.boon)expect(result.state.run!.boons[option.boon]).toBe(1);
  expect(resolveNode(result.state,option.id).ok).toBe(false);
});
it('uses real calendar dates for deterministic daily and weekly challenges',()=>{
  expect(calendarChallenge('2026-11-06')).toEqual(calendarChallenge('2026-11-06'));
  expect(calendarChallenge('2026-11-07').seed).not.toBe(calendarChallenge('2026-11-06').seed);
  expect(calendarChallenge('2026-11-07').week).toBe(calendarChallenge('2026-11-06').week);
  expect(()=>calendarChallenge('2026-02-30')).toThrow();
});
it.each(CHAPTERS)('finishes a headless $name run with actual rules',chapter=>{
  const s=createDepthAccount(11);s.cleared=[1,2];
  const start=startRun(s,chapter.id,11);expect(start.ok).toBe(true);
  const finish=playRun(start.state,'smart');expect(finish.run!.complete).toBe(true);
  expect(availableNodes(finish.run!)).toEqual([]);expect(finish.claimedRuns).toContain(finish.run!.id);
});
