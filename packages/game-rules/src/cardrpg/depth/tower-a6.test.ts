import {expect,it} from 'vitest';
import {clone} from '../internal';
import * as R from './index';
const ready=(seed=3)=>{const s=R.setGameplayA6(R.createDepthAccount(seed,0),true);s.cleared=[1,2,3];for(const c of s.account.cards)c.level=10;return s;};
it('quotes the whole gift separately from available space without changing partial-claim settlement',()=>{
 const s=ready();s.towerBest=30;s.account.daily.earned={...R.depthCaps(s),threads:R.depthCaps(s).threads-12};
 const before=R.exportSave(s);
 for(const floor of R.TOWER_CHESTS_A6){const p=R.towerChestA6(s,floor);
  expect(p.requested).toEqual({stamps:50+floor*2,threads:10+floor});expect(p.reward).toEqual({stamps:0,threads:12});expect(p.reason).toBeNull();
 }
 expect(R.exportSave(s)).toBe(before);
 const result=R.claimTowerChestA6(s,5);expect(result.ok).toBe(true);
 expect(result.state.account.currencies).toEqual({...s.account.currencies,threads:s.account.currencies.threads+12});
 expect(result.state.challengeClaims).toContain('a6-tower-chest-5');
 const next=R.metaCommand(R.importSave(R.exportSave(result.state)),{type:'advanceLocalDay'}).state;
 expect(R.claimTowerChestA6(next,5).ok).toBe(false);expect(R.towerChestA6(next,10).reward).toEqual({stamps:70,threads:20});
});
it('has thirty fixed floors, ordered access and six milestone chests',()=>{
 const locked=R.setGameplayA6(R.createDepthAccount(3,0),true);
 expect(R.startTowerFloorA6(locked).ok).toBe(false);
 expect(R.startTowerFloorA6(ready(),0).ok).toBe(false);expect(R.startTowerFloorA6(ready(),31).ok).toBe(false);
 expect(R.startTowerFloorA6(ready(),2).ok).toBe(false);
 expect(R.TOWER_CHESTS_A6).toEqual([5,10,15,20,25,30]);
 for(let floor=1;floor<=30;floor++){
  const a=ready(3),b=ready(999);a.towerBest=b.towerBest=floor-1;
  const x=R.enterNode(R.startTowerFloorA6(a,floor).state,'0-0').state;
  const y=R.enterNode(R.startTowerFloorA6(b,floor).state,'0-0').state;
  expect(x.run!.nodes).toHaveLength(1);
  expect(x.run!.battle!.initial.seed).toBe(y.run!.battle!.initial.seed);
  expect(x.run!.battle!.initial.enemyStats).toEqual(y.run!.battle!.initial.enemyStats);
  expect(x.run!.battle!.initial.enemies).toEqual(y.run!.battle!.initial.enemies);
  expect(R.importSave(R.exportSave(x))).toEqual(x);
 }
});
it('uses the same preparation/replay engine and advances only a won floor',()=>{
 let s=R.enterNode(R.startTowerFloorA6(ready()).state,'0-0').state;
 const initial=s.run!.battle!.initial;
 const changed=R.configurePreparation(s,s.team,{...s.rows,soot:'front'},s.v4!.plan);
 expect(changed.ok).toBe(true);s=changed.state;
 expect(s.run!.battle!.initial.enemies).toEqual(initial.enemies);
 expect(s.run!.battle!.initial.enemyStats).toEqual(initial.enemyStats);
 const played=R.playBattle(s.run!.battle!,'auto');
 expect(R.replayBattle(played.initial,played.choices)).toEqual(played);
 expect(played.result).toBe('party');
 s.run!.battle=played;const stars=R.starCountV4(s),masteries=[...s.masteries];
 s=R.finishEncounter(s).state;
 expect(s.run!.complete).toBe(true);expect(s.towerBest).toBe(1);
 expect(R.starCountV4(s)).toBe(stars);expect(s.masteries).toEqual(masteries);
 const next=R.nextTowerFloor(s);expect(next.ok).toBe(true);expect(next.state.run!.floor).toBe(2);
 const lost=R.enterNode(next.state,'0-0').state;lost.run!.battle!.result='enemy';
 const result=R.finishEncounter(lost);expect(result.ok).toBe(true);expect(result.state.towerBest).toBe(1);
 expect(R.nextTowerFloor(result.state).ok).toBe(false);
});
it('waits when capped and awards each earned milestone once across saves',()=>{
 const s=ready();s.towerBest=5;
 const before=s.account.currencies.stamps,result=R.claimTowerChestA6(s,5);
 expect(result.ok).toBe(true);expect(result.state.account.currencies.stamps).toBeGreaterThan(before);
 expect(R.claimTowerChestA6(R.importSave(R.exportSave(result.state)),5).ok).toBe(false);
 expect(R.claimTowerChestA6(s,10).ok).toBe(false);
 s.account.daily.earned={...R.DEPTH_CAPS_V4};expect(R.claimTowerChestA6(s,5).ok).toBe(false);
 expect(s.challengeClaims).not.toContain('a6-tower-chest-5');
 const last=ready();last.towerBest=30;const end=R.startTowerFloorA6(last,30).state;end.run!.complete=true;end.run!.won=true;
 expect(R.nextTowerFloor(end).ok).toBe(false);
});
it('leaves the old Tower and flag-OFF saves unchanged',()=>{
 const s=R.setGameplayV4(R.createDepthAccount(3,0),true);s.cleared=[1,2,3];
 const before=R.exportSave(s);expect(R.startTowerFloorA6(s).ok).toBe(false);expect(R.exportSave(s)).toBe(before);
 const old=R.startRun(s,1,3,'tower');expect(old.ok).toBe(true);expect(old.state.run!.nodes.length).toBeGreaterThan(1);
});

it('keeps the floor snapshot before entry and permits a new crew on later floors',()=>{
 let s=ready();s.towerBest=5;
 s=R.startTowerFloorA6(s,6).state;
 const saved=R.importSave(R.exportSave(s));
 expect(saved.run!.towerA6).toEqual(s.run!.towerA6);
 s=R.enterNode(saved,'0-0').state;
 s.account.cards.push({id:'panko',cardId:'panko',level:10,stars:1,shards:0,soulbound:true});
 const changed=R.configurePreparation(s,['panko','soot','clover'],{panko:'front',soot:'rear',clover:'rear'},s.v4!.plan);
 expect(changed.ok).toBe(true);
 expect(changed.state.run!.battle!.initial.enemyStats).toEqual(s.run!.towerA6!.enemyStats);
 expect(changed.state.run!.battle!.initial.seed).toBe(s.run!.battle!.initial.seed);
 const invalid=clone(saved);invalid.run!.floor=31;
 expect(()=>R.exportSave(invalid)).toThrow();
});
