import {expect,it} from 'vitest';
import {crowdPose} from './crowd';
import type {SceneView} from '../../squad/turn3d/scene';
const unit=(id:string,side='party',hp=100)=>({id,side,hp});
const make=()=>({actors:[unit('caster'),unit('friend'),unit('boss','enemy'),unit('foe','enemy')],bossPhases:{boss:1},reducedMotion:false,frame:{elapsed:400,plan:{actorId:'caster',ultimate:true,beats:[{start:0},{start:100},{start:200}],events:[{type:'damage',targetIds:['boss'],critical:true}]}}} as unknown as SceneView);
it('cheers allies and makes living enemy spectators flinch when their boss is hit',()=>{
 const view=make(),before=JSON.stringify(view);
 expect(crowdPose(view,view.actors[1]!,720).kind).toBe('cheer');
 expect(crowdPose(view,view.actors[3]!,720).kind).toBe('flinch');
 expect(crowdPose(view,view.actors[2]!,720).kind).toBe('idle');
 expect(crowdPose(view,view.actors[0]!,720).kind).toBe('idle');
 expect(JSON.stringify(view)).toBe(before);
});
it('preserves disabled poses, dead units, reduced motion and pre-contact stillness',()=>{
 const view=make(),friend=view.actors[1]!;
 expect(crowdPose({...view,reducedMotion:true},friend,720).kind).toBe('idle');
 expect(crowdPose({...view,cardStatuses:{friend:[{id:'freeze',stacks:1}]}},friend,720).kind).toBe('idle');
 expect(crowdPose(view,{...friend,hp:0},720).kind).toBe('idle');
 view.frame!.elapsed=100;expect(crowdPose(view,friend,720).kind).toBe('idle');
});
