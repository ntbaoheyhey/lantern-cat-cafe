import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {FieldGuideA6} from './FieldGuideA6';
import {enemyGuideA6} from './guide-a6';
import {PrepareA6} from './FormationA6';
import {DepthModel} from '../depth/model';

afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function encounter(id:string,round:number,rage:number) {
 const account=R.setGameplayA6(R.createDepthAccount(826143,0),true);
 const battle=R.createBattle({seed:826143,chapter:R.ENEMY_BY_ID[id]!.chapter,cats:R.battleCats(account),enemies:[id],gameplayV4:true,skillsV5:true,gameplayA6:true});
 const foe=battle.actors.find(a=>a.catalogId===id)!;
 battle.round=round;foe.charge=rage;foe.turns=1;
 // Leave a living cat queued so the observation stops before round-end effects.
 battle.queue=[foe.id,'mochi'];
 return {battle,foe};
}

it('does not promise a third-round signature for rage-driven enemies',()=>{
 for(const id of ['binding-thread','pollen-scout','crumb-sentinel','practice-cushion']){
  const regular=encounter(id,3,0),ready=encounter(id,1,100);
  expect(R.enemyAct(regular.battle)).toBe(true);expect(R.enemyAct(ready.battle)).toBe(true);
  expect(regular.battle.log.find(e=>e.kind==='enemy-action')?.skillId).toBe(`enemy:${id}:basic`);
  expect(ready.battle.log.find(e=>e.kind==='enemy-action')?.skillId).toBe(`enemy:${id}`);
  if(id==='pollen-scout'){
   expect(regular.battle.log.some(e=>e.kind==='summon')).toBe(false);
   expect(ready.battle.log.some(e=>e.kind==='summon')).toBe(true);
  }
  expect(enemyGuideA6(id).intent.toLowerCase()).toContain('full rage');
  expect(enemyGuideA6(id).intent).not.toMatch(/third (round|turn)/);
 }
});

it('explains the healer refill on an odd round when rage is ready',()=>{
 const regular=encounter('teacup-healer',1,0),ready=encounter('teacup-healer',1,100);
 for(const f of [regular,ready]){f.foe.hp-=200;expect(R.enemyAct(f.battle)).toBe(true);}
 expect(regular.battle.log.some(e=>e.kind==='heal'&&e.actorId===regular.foe.id&&e.amount===35)).toBe(true);
 expect(ready.battle.log.some(e=>e.kind==='heal'&&e.actorId===ready.foe.id)).toBe(true);
 expect(enemyGuideA6('teacup-healer').intent).toContain('35 HP per basic, 65 HP at full rage');
});

it('describes Daze as a replacement hit rather than a skipped boss action',()=>{
 const f=encounter('yarn-giant',1,100);
 f.foe.statuses=[{id:'drowsy',stacks:1,remaining:1,source:'mochi',appliedRound:1}];
 expect(R.enemyAct(f.battle)).toBe(true);
 expect(f.battle.log.some(e=>e.kind==='damage'&&e.actorId===f.foe.id)).toBe(true);
 expect(f.battle.log.find(e=>e.kind==='enemy-action')?.skillId).toBe('enemy:yarn-giant:basic');
 expect(f.foe.charge).toBe(100);
 for(const id of ['yarn-giant','rain-spool','pantry-crown'])expect(enemyGuideA6(id).counter).toContain('signature into a basic hit');
});

it('keeps the entire live enemy catalogue available as read-only field notes',()=>{
 const before=JSON.stringify(R.ENEMIES);render(<FieldGuideA6 v4 skillsV5/>);
 fireEvent.click(screen.getByRole('button',{name:'enemies'}));
 const index=screen.getByRole('navigation',{name:'enemies index'});
 expect(within(index).getAllByRole('button')).toHaveLength(R.ENEMIES.length);
 for(const enemy of R.ENEMIES){
  fireEvent.click(within(index).getByRole('button',{name:enemy.name}));
  const note=screen.getByRole('region',{name:enemy.name+' field note'}).textContent!;
  expect(note).toContain(enemyGuideA6(enemy.id).counter);
  expect(note).not.toMatch(/Every third|every third|seeded|Hush|Tangle|Rattled/);
  if(enemy.tier==='boss')expect(note).toContain('Defeat the boss and its linked helpers leave.');
 }
 expect(JSON.stringify(R.ENEMIES)).toBe(before);
});

it('opens each preparation note as a fresh keyboard region without changing the battle',()=>{
 vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
 const m=new DepthModel(true,true,true,true);m.start(1);m.enter(R.availableNodes(m.state.run!)[0]!.id);
 m.state.run!.battle=R.createBattle({...m.battle!.initial,enemies:['pantry-crown','kettle-knight']});
 const before=JSON.stringify(m.state);render(<PrepareA6 m={m}/>);
 const boss=screen.getByRole('region',{name:'Pantry Crown tactics'});
 expect(boss.getAttribute('tabindex')).toBe('0');boss.scrollTop=120;
 fireEvent.click(screen.getByRole('button',{name:'Read Kettle Knight tactics'}));
 const kettle=screen.getByRole('region',{name:'Kettle Knight tactics'});
 expect(kettle.scrollTop).toBe(0);expect(kettle.textContent).toContain('Regen removes one stack');
 fireEvent.click(screen.getByRole('button',{name:'Read Pantry Crown tactics'}));
 expect(screen.getByRole('region',{name:'Pantry Crown tactics'})).not.toBe(boss);
 expect(screen.getByRole('region',{name:'Pantry Crown tactics'}).scrollTop).toBe(0);
 expect(JSON.stringify(m.state)).toBe(before);
});
