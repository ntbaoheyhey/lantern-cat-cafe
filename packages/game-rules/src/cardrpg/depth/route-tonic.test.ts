import {expect,it} from 'vitest';
import {clone} from '../internal';
import * as R from './index';
const route=(a6=true)=>R.startRun(a6?R.setGameplayA6(R.setSkillsV5(R.setGameplayV4(R.createDepthAccount(11,0),true),true),true):R.createDepthAccount(11,0),1,41).state;
it.each([true,false])('keeps a full-health crew and its route stock unchanged (A6=%s)',a6=>{
 const s=route(a6),before=R.exportSave(s),result=R.useTonic(s);
 expect(result).toMatchObject({ok:false,error:'Every companion is already at full HP.'});expect(result.state).toBe(s);expect(R.exportSave(s)).toBe(before);
});
it('caps recovery for each companion, revives fallen cats, and spends only one route tonic',()=>{
 const s=route(),cats=R.battleCats(s);s.run!.supplies=2;
 s.run!.hp[cats[0]!.id]=cats[0]!.stats.hp-43;s.run!.hp[cats[1]!.id]=0;
 s.account.inventory.stacks['milk-tonic']=3;s.run!.packedSupply={id:'shield-biscuit',catId:cats[0]!.id};
 const before=clone(s),result=R.useTonic(s);
 expect(result.ok).toBe(true);expect(s).toEqual(before);expect(result.state.run!.supplies).toBe(1);
 expect(result.state.run!.hp[cats[0]!.id]).toBe(cats[0]!.stats.hp);
 expect(result.state.run!.hp[cats[1]!.id]).toBe(Math.min(100,cats[1]!.stats.hp));
 expect(result.state.run!.hp[cats[2]!.id]).toBe(cats[2]!.stats.hp);
 expect(result.state.account.inventory).toEqual(before.account.inventory);expect(result.state.run!.packedSupply).toEqual(before.run!.packedSupply);
});
it('allows recovery while choosing a post-battle reward, without taking that reward',()=>{
 const s=route();s.run!.hp.mochi!-=150;s.run!.current='0-0';s.run!.rewardChoices=['shelter-1'];
 const result=R.useTonic(s);expect(result.ok).toBe(true);expect(result.state.run!.hp.mochi).toBe(s.run!.hp.mochi!+100);expect(result.state.run!.rewardChoices).toEqual(['shelter-1']);expect(result.state.run!.visited).toEqual(s.run!.visited);
});
it.each(['home','complete','prepare','committed','empty'] as const)('rejects %s recovery without any mutation',kind=>{
 let s=route();s.run!.hp.mochi!-=43;
 if(kind==='home')s.run=null;else if(kind==='complete')s.run!.complete=true;else if(kind==='empty')s.run!.supplies=0;
 else {s=R.enterNode(s,R.availableNodes(s.run!)[0]!.id).state;if(kind==='committed')s=R.commitPreparation(s).state;}
 const before=R.exportSave(s),result=R.useTonic(s);expect(result.ok).toBe(false);expect(result.state).toBe(s);expect(R.exportSave(s)).toBe(before);
});
