import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {PaintedVfx} from './vfx';
import {animationCues} from './events';
import {galleryFixture} from '../depth/feel-lab';
import {project} from '../depth/scene-actors';
import {sampleActionPlan} from '../../squad/turn3d/effects';

vi.mock('./assets',()=>({spineAssetUrl:(path:string)=>path}));
vi.mock('./vfx-stamps',()=>({PaintedStamps:class {get(){return document.createElement('canvas');}dispose(){}}}));
beforeEach(()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({} as ReturnType<HTMLCanvasElement['getContext']>);
 vi.stubGlobal('Image',class {src='';decode(){return Promise.resolve();}});
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
async function setup(cue:'cast'|'hit'){
 const fixture=galleryFixture('mochi-1'),vfx=new PaintedVfx(document.createElement('div'),()=>({x:0,y:0}),()=>1);
 await vfx.ready;await vfx.overrides.prepare({'mochi-1':{format:'sequence',frames:['effect.png'],fps:1,width:512,height:512,scale:1,socket:'feet',cue}});
 return{vfx,fixture,frame:sampleActionPlan(fixture.plan,fixture.plan.beats[2]!.start,false),actors:project(fixture.battle),effect:vfx.overrides.effects.get('mochi-1')!};
}

it('plays a cast override once at first contact if the attack has no cast, keeping it on the caster',async()=>{
 const {vfx,fixture,frame,actors,effect}=await setup('cast'),cues=animationCues('attack',1,[{name:'hit',time:.4},{name:'hit',time:.7}]);
 vfx.cue(cues[0]!,frame,1,3,actors,cues);vfx.cue(cues[1]!,frame,1.2,3,actors,cues);
 expect(effect.players.filter(p=>p.active).map(p=>p.target)).toEqual([fixture.plan.actorId]);
 expect(vfx.overrides.warnings).toHaveLength(1);expect(vfx.overrides.warnings[0]).toMatch(/cast.*hit/);
 const replay=galleryFixture('mochi-1');vfx.cue(cues[0]!,sampleActionPlan(replay.plan,replay.plan.beats[2]!.start,false),2,1,actors,cues);
 expect(effect.players.filter(p=>p.active&&p.born===2).map(p=>p.target)).toEqual([replay.plan.actorId]);expect(vfx.overrides.warnings).toHaveLength(1);vfx.dispose();
});

it('waits for an authored cast after contact rather than using the missing-cast fallback',async()=>{
 const {vfx,fixture,frame,actors,effect}=await setup('cast'),cues=animationCues('attack',1,[{name:'hit',time:.4},{name:'cast',time:.7}]);
 vfx.cue(cues[0]!,frame,1,1,actors,cues);expect(effect.players.some(p=>p.active)).toBe(false);
 vfx.cue(cues[1]!,frame,1.2,1,actors,cues);expect(effect.players.filter(p=>p.active).map(p=>p.target)).toEqual([fixture.plan.actorId]);
 expect(vfx.overrides.warnings).toEqual([]);vfx.dispose();
});

it('keeps every authored hit override on the actual recipient',async()=>{
 const {vfx,fixture,frame,actors,effect}=await setup('hit'),cues=animationCues('attack',1,[{name:'hit',time:.4},{name:'hit',time:.7}]);
 for(const cue of cues)vfx.cue(cue,frame,1+cue.time,2,actors,cues);
 const recipients=fixture.plan.events.find(event=>event.type==='damage'&&event.actorId===fixture.plan.actorId)!.targetIds;
 expect(effect.players.filter(p=>p.active).map(p=>p.target)).toEqual([...recipients,...recipients]);
 expect(effect.players.filter(p=>p.active).some(p=>p.target===fixture.plan.actorId)).toBe(false);
 expect(vfx.overrides.warnings).toEqual([]);vfx.dispose();
});
