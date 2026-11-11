import {expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from './model';

function victory(){
 const m=new DepthModel(true,true,true,true);m.state.tutorial=4;m.start(1);m.enter('0-0');
 m.battle!.result='party';m.watching=false;m.screen='result';m.autoContinue=true;
 R.observeDiscoveriesV4(m.state);m.state.v4!.journey!.pending=[];return m;
}
function capped(m:DepthModel){
 for(const boon of R.BOONS)m.state.run!.boons[boon.id]=boon.cap;
 for(const skill of m.state.team.flatMap(id=>R.defaultSkills(m.state,id)))m.state.run!.upgrades[skill]=3;
}
it('settles once and preserves every offered reward for the player',()=>{
 const m=victory(),expected=R.finishEncounter(m.state);expect(expected.ok).toBe(true);expect(expected.state.run!.rewardChoices.length).toBeGreaterThan(0);
 m.continueBattle();expect(m.state).toEqual(expected.state);expect(m.screen).toBe('map');expect(m.watching).toBe(false);
 m.continueBattle();expect(m.state).toEqual(expected.state);
});
it('leaves a fork undecided even when both paths have enemies',()=>{
 const m=victory();capped(m);const run=m.state.run!,node=run.nodes.find(n=>n.id===run.current)!;
 const next=run.nodes.filter(n=>n.depth===1).slice(0,2);expect(next.length).toBe(2);node.next=next.map(n=>n.id);
 for(const n of next){n.kind='battle';n.enemies=['crumb-sentinel'];}
 const expected=R.finishEncounter(m.state);expect(R.availableNodes(expected.state.run!).length).toBe(2);
 m.continueBattle();expect(m.state).toEqual(expected.state);expect(m.watching).toBe(false);
});
it('stops before the only rest stop without entering it',()=>{
 const m=victory();capped(m);const run=m.state.run!,next=run.nodes.find(n=>n.depth===1)!;
 run.nodes.find(n=>n.id===run.current)!.next=[next.id];next.kind='campfire';next.enemies=[];
 const expected=R.finishEncounter(m.state);m.continueBattle();expect(m.state).toEqual(expected.state);expect(m.watching).toBe(false);
});
it('starts only a single combat stop when no reward or route choice remains',()=>{
 const m=victory();capped(m);const run=m.state.run!,next=run.nodes.find(n=>n.depth===1)!;
 run.nodes.find(n=>n.id===run.current)!.next=[next.id];next.kind='battle';next.enemies=['crumb-sentinel'];
 const settled=R.finishEncounter(m.state),entered=R.enterNode(settled.state,next.id),committed=R.commitPreparation(entered.state);
 expect(committed.ok).toBe(true);m.continueBattle();expect(m.state).toEqual(committed.state);expect(m.watching).toBe(true);expect(m.screen).toBe('map');
});
it.each(['off','away','loss','practice','replay','gallery','error','discovery'] as const)('does not settle a %s result through a stale Auto-next callback',kind=>{
 const m=victory();
 if(kind==='off')m.autoContinue=false;
 if(kind==='away')m.screen='team';
 if(kind==='loss')m.battle!.result='enemy';
 if(kind==='practice')m.tutorialBattle=structuredClone(m.battle!);
 if(kind==='replay')m.replay=structuredClone(m.battle!);
 if(kind==='gallery')m.galleryBattle=structuredClone(m.battle!);
 if(kind==='error')m.error=true;
 if(kind==='discovery'){m.state.v4!.journey!.found=[];R.observeDiscoveriesV4(m.state);expect(m.state.v4!.journey!.pending.length).toBeGreaterThan(0);}
 const before=structuredClone(m.state);m.continueBattle();expect(m.state).toEqual(before);
});
it('finishes a Tower floor once without starting another floor',()=>{
 const m=victory();m.state.cleared=[1,2,3];m.state.run=null;m.state=R.startTowerFloorA6(m.state,1).state;
 m.enter(R.availableNodes(m.state.run!)[0]!.id);m.battle!.result='party';m.screen='result';
 const expected=R.finishEncounter(m.state);expect(expected.state.run!.complete).toBe(true);
 m.continueBattle();expect(m.state).toEqual(expected.state);expect(m.screen).toBe('tower');expect(m.watching).toBe(false);
});
