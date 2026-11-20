import {expect,it,vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {battleControls,battleStep,ULTIMATE_GRACE_TURNS} from './controls';
function fixture(){
 const account=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true));
 for(const c of account.account.cards){c.level=6;account.skills[c.cardId]=R.CAT_BY_ID[c.cardId]!.skills.map(s=>s.id);}
 const battle=R.createBattle({seed:71,chapter:1,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true,cats:R.battleCats(account),enemies:['button-guard','sock-skipper','teacup-healer','needle-moth']});
 battle.v4!.committed=true;
 const act=vi.fn((choice?:R.Choice)=>{if(R.currentActor(battle)?.side==='party')R.act(battle,choice??R.chooseAction(battle,'auto'));else R.enemyAct(battle);});
 const m={state:account,battle,canAct:true,act,step:()=>act()} as unknown as DepthModel;
 return {m,battle,act};
}
it('retains every combat result under Auto for a seeded full battle',()=>{
 const {m,battle}=fixture(),expected=structuredClone(battle);battleControls(m).auto=true;
 R.playBattle(expected,'auto');
 for(let i=0;i<2000&&!battle.result;i++)battleStep(m);
 expect(battle).toEqual(expected);
});
it('queues a manual ultimate until that actor owns a legal turn',()=>{
 const {m,battle,act}=fixture(),controls=battleControls(m);controls.auto=false;
 const cat=battle.actors.find(a=>a.catalogId==='soot')!,other=battle.actors.find(a=>a.side==='party'&&a!==cat)!;
 cat.charge=100;controls.queued.add(cat.id);battle.queue=[other.id,cat.id];battle.acted=[];
 battleStep(m);expect(controls.queued.has(cat.id)).toBe(true);
 battle.queue=[cat.id];battleStep(m);
 expect(act.mock.calls.at(-1)?.[0]?.skillId).toBe('soot-4');expect(controls.queued.has(cat.id)).toBe(false);
});
it('defaults campaign battles to player-timed ultimates',()=>{
 localStorage.removeItem('lantern-auto-ultimates');
 const {m}=fixture();expect(battleControls(m).auto).toBe(false);
});
it('fires an untapped ready ultimate by itself after the grace turns',()=>{
 const {m,battle,act}=fixture(),controls=battleControls(m);controls.auto=false;
 const cat=battle.actors.find(a=>a.catalogId==='soot')!;
 const turn=()=>{cat.charge=100;battle.queue=[cat.id];battle.acted=[];battleStep(m);return act.mock.calls.at(-1)?.[0]?.skillId;};
 for(let i=0;i<ULTIMATE_GRACE_TURNS;i++)expect(turn()).not.toBe('soot-4');
 expect(turn()).toBe('soot-4');expect(controls.waited.has(cat.id)).toBe(false);
});
