import {expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import {battleLogCopy} from './battle-log-copy';

function fixture(){
 const m=new DepthModel(true,true,true,true);m.state.tutorial=4;m.start(1);m.enter('0-0');return m.battle!;
}
function event(b:R.Battle,kind:string,amount=0,text='',extra:Partial<R.BattleEvent>={}):R.BattleEvent {
 return {round:1,actorId:b.actors[0]!.id,targetId:b.actors[3]!.id,skillId:'',kind,amount,text,...extra};
}
it('identifies the actual source and recipient of damage, reflected damage and zero healing',()=>{
 const b=fixture(),source=b.actors[0]!,target=b.actors[3]!,before=structuredClone(b);
 expect(battleLogCopy(b,event(b,'damage',32))).toEqual({context:`${source.name} → ${target.name}`,summary:'32 HP damage'});
 expect(battleLogCopy(b,event(b,'reflect',12,'',{actorId:target.id,targetId:source.id}))).toEqual({context:`${target.name} → ${source.name}`,summary:'12 HP reflected damage'});
 expect(battleLogCopy(b,event(b,'heal',0,'',{targetId:source.id}))).toEqual({context:`${source.name} · self`,summary:'Restored 0 HP'});
 expect(battleLogCopy(b,event(b,'absorbed',18,'Shield absorbed Bleed')).summary).toBe('Shield blocked 18 damage from Bleed');
 expect(battleLogCopy(b,event(b,'shield',18)).summary).toBe('Gained 18 shield');
 expect(battleLogCopy(b,event(b,'shared',4)).summary).toBe('4 HP damage shared through a link');
 expect(b).toEqual(before);
});
it('shows accumulated status stacks and keeps tick detail distinct from a second damage event',()=>{
 const b=fixture(),source=b.actors[0]!,target=b.actors[1]!;
 R.applyStatus(b,source,target,'cozy',2);R.applyStatus(b,source,target,'cozy',1);
 expect(battleLogCopy(b,b.log.at(-1)!).summary).toBe('Warm · 3 stacks now');
 expect(battleLogCopy(b,event(b,'status-tick',12,'Burn',{skillId:'scald'})).summary).toBe('Tick detail · Burn · 12 HP lost');
 expect(battleLogCopy(b,event(b,'status-tick',18,'Regen',{skillId:'steep'})).summary).toBe('Tick detail · Regen · 18 HP restored');
 expect(battleLogCopy(b,event(b,'expire',0,'Warm')).summary).toBe('Warm expired');
});
it.each([false,true])('preserves the recorded status vocabulary in a saved V5=%s battle',skillsV5=>{
 const b=fixture();b.initial.skillsV5=skillsV5;
 R.applyStatus(b,b.actors[0]!,b.actors[1]!,'steep',1);
 expect(battleLogCopy(b,b.log.at(-1)!).summary).toBe(`${skillsV5?'Regen':'Steep'} · 1 stack now`);
});
it('names repeated enemies independently, including fallen helpers, without changing their records',()=>{
 const b=R.createBattle({...fixture().initial,enemies:['yarn-giant']});
 const threads=b.actors.filter(a=>a.catalogId==='binding-thread');threads[0]!.hp=0;
 const before=structuredClone(b);
 expect(battleLogCopy(b,event(b,'defeat',0,'',{targetId:threads[0]!.id})).context).toBe('Mochi → Binding Thread 1');
 expect(battleLogCopy(b,event(b,'status',1,'Mark',{targetId:threads[1]!.id})).context).toBe('Mochi → Binding Thread 2');
 expect(b).toEqual(before);
});
it('does not label an enemy support summary with its unused attack planning target',()=>{
 const b=R.createBattle({...fixture().initial,enemies:['teacup-healer','button-guard']});
 const healer=b.actors.find(a=>a.catalogId==='teacup-healer')!,patient=b.actors.find(a=>a.catalogId==='button-guard')!;
 patient.hp=20;b.queue=[healer.id];b.intents.find(i=>i.actorId===healer.id)!.signature=true;
 expect(R.enemyAct(b)).toBe(true);
 const heal=b.log.find(e=>e.kind==='heal'&&e.actorId===healer.id)!,action=b.log.find(e=>e.kind==='enemy-action')!;
 expect(heal.targetId).toBe(patient.id);expect(action.targetId).not.toBe(patient.id);
 expect(battleLogCopy(b,heal)).toEqual({context:'Teacup Healer → Button Guard',summary:`Restored ${heal.amount} HP`});
 expect(battleLogCopy(b,action).context).toBe('Teacup Healer');
});
it('explains actual targeting markers and retains unknown historical notes without guessing a skill',()=>{
 const b=fixture(),before=structuredClone(b);
 expect(battleLogCopy(b,event(b,'multi-hit',0,'splash',{skillId:'mochi-1'})).summary).toBe(`Target: Splash target · ${R.skillById('mochi-1',true)!.name}`);
 expect(battleLogCopy(b,event(b,'dispel',2,'Removed debuffs')).summary).toBe('Removed 2 debuffs');
 expect(battleLogCopy(b,event(b,'dispel',1,'Removed debuffs')).summary).toBe('Removed 1 debuff');
 expect(battleLogCopy(b,event(b,'revive',42)).summary).toBe('Revived with 42 HP');
 expect(battleLogCopy(b,event(b,'future-effect',7,'A saved custom note',{actorId:'retired',targetId:''}))).toEqual({context:'Unknown unit',summary:'A saved custom note'});
 expect(battleLogCopy(b,event(b,'future-effect',7,'',{actorId:'',targetId:''}))).toEqual({context:'Battle',summary:'future effect 7'});
 expect(b).toEqual(before);
});
