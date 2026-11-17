import {expect,it} from 'vitest';
import {createDepthAccount,startRun} from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {nextEncounterUnits} from './encounter-preloader';

it('warms the next connected encounter layer without pulling in later bosses',()=>{
 const result=startRun(createDepthAccount(71),1,71,'campaign','2026-11-17');
 if(!result.ok)throw Error('Fixture run failed');
 const state=result.state,run=state.run!;
 run.current='0-0';
 const elite=run.nodes.find(node=>node.id==='1-1')!;
 expect(new Set(nextEncounterUnits(state))).toEqual(new Set([...state.team,...elite.enemies]));
 expect(nextEncounterUnits(state)).not.toContain(run.nodes.find(node=>node.kind==='boss')!.enemies[0]);
});

it('looks past quiet stops while keeping both next encounter choices',()=>{
 const result=startRun(createDepthAccount(71),1,71,'campaign','2026-11-17');
 if(!result.ok)throw Error('Fixture run failed');
 const state=result.state,run=state.run!;run.current='1-1';
 expect(new Set(nextEncounterUnits(state))).toEqual(new Set([...state.team,...run.nodes.filter(node=>node.depth===5).flatMap(node=>node.enemies)]));
 run.complete=true;expect(nextEncounterUnits(state)).toEqual([]);
 expect(nextEncounterUnits(createDepthAccount(71))).toEqual([]);
});
