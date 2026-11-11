import { expect, it } from 'vitest';
import { clone } from '../internal';
import { BOONS, boonValue } from './boons';
import { createDepthAccount, configureTeam, availableSkills, battleCats, defaultSkills } from './state';
import { abandonRun, availableNodes, calendarChallenge, CHAPTERS, chooseReward, enterNode, EVENTS, generateMap, resolveNode, startRun } from './run';
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
it('uses the complete default kit in new encounters regardless of a saved loadout order', () => {
  const state = createDepthAccount();
  expect(defaultSkills(state, 'mochi')).toEqual(['mochi-1', 'mochi-2', 'mochi-3']);
  state.account.cards[0]!.level = 6;
  state.skills.mochi = ['mochi-4', 'mochi-1', 'mochi-2'];
  expect(battleCats(state)[0]!.skills).toEqual(['mochi-1', 'mochi-2', 'mochi-3', 'mochi-4']);
  const entered = enterNode(startRun(state, 1, 11).state, '0-0').state;
  expect(entered.run!.battle!.actors[0]!.skills).toHaveLength(4);
  expect(state.skills.mochi).toEqual(['mochi-4', 'mochi-1', 'mochi-2']);
});
it('allows unlocked ultimates at campfires while rejecting locked skills', () => {
  const state = createDepthAccount();
  state.account.cards[0]!.stars = 3;
  const started = startRun(state, 1, 11).state;
  started.run!.current = '4-0';
  expect(resolveNode(started, 'upgrade', 'mochi-4').state.run!.upgrades['mochi-4']).toBe(1);
  expect(resolveNode(started, 'upgrade', 'clover-4').ok).toBe(false);
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
it.each(EVENTS)('HP costs at $name preserve fallen cats and the living one-HP floor',event=>{
  const s=startRun(createDepthAccount(),1,2).state,r=s.run!,option=event.choices.find(c=>c.heal<0)!;
  r.current='1-0';r.nodes.find(n=>n.id==='1-0')!.eventId=event.id;r.hp.mochi=1;r.hp.soot=0;
  const before=clone(s),result=resolveNode(s,option.id);expect(result.ok).toBe(true);expect(s).toEqual(before);
  expect(result.state.run!.hp.soot).toBe(0);expect(result.state.run!.hp.mochi).toBe(1);
  expect(result.state.run!.hp.clover).toBe(Math.round(r.hp.clover!*(1+option.heal/100)));
  expect(result.state.run!.points).toBe(r.points+option.points);
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

it('abandons an active encounter, preserves partial rewards and rejects duplicate settlement', () => {
  const started = startRun(createDepthAccount(), 1, 42).state;
  const encounter = enterNode(started, '0-0').state;
  const result = abandonRun(encounter);
  expect(result.ok).toBe(true);
  expect(result.state.run!.battle).toBeNull();
  expect(result.state.run!.complete).toBe(true);
  expect(result.state.run!.won).toBe(false);
  expect(result.state.claimedRuns).toContain(encounter.run!.id);
  expect(abandonRun(result.state).ok).toBe(false);
});
