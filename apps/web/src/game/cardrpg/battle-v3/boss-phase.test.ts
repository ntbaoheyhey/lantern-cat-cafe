import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import type {SceneView} from '../../squad/turn3d/scene';
import {BossPhase} from './boss-phase';
let portrait:ReturnType<typeof vi.fn>;
const phases:BossPhase[]=[];
beforeEach(()=>{
 portrait=vi.fn();
 const noop=()=>{},c={setTransform:noop,clearRect:noop,save:noop,restore:noop,translate:noop,scale:noop,beginPath:noop,ellipse:noop,stroke:noop,moveTo:noop,lineTo:noop,fillRect:noop,arc:noop,fill:noop,drawImage:portrait,createLinearGradient:()=>({addColorStop:noop})};
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(c as never);
 vi.stubGlobal('Image',class{complete=true;naturalWidth=512;src='';});vi.stubGlobal('devicePixelRatio',1);
});
afterEach(()=>{for(const phase of phases.splice(0))phase.dispose();vi.restoreAllMocks();vi.unstubAllGlobals();});
function fixture(reducedMotion=false){
 const phase=new BossPhase(document.createElement('div'));phases.push(phase);
 const view={battleKey:'first',actors:[{id:'boss',hp:100}],bossPhases:{boss:1},models:{boss:'yarn-giant'},reducedMotion} as unknown as SceneView;
 const render=(time:number)=>phase.render(view,time,1280,720,()=>({x:700,y:100,width:300,height:450}));
 render(0);return{phase,view,render,advance(time=1){view.bossPhases={boss:2};render(time);}};
}
function action(view:SceneView,elapsed=0,skillId='mochi-4'){
 view.frame={plan:{actorId:'mochi',skillId,ultimate:skillId==='mochi-4'},elapsed} as SceneView['frame'];
}
it.each([false,true])('yields the phase portrait before the next natural ultimate contact; reduced=%s',reduced=>{
 const f=fixture(reduced);f.advance(1);f.render(1.2);expect(f.phase.audit.visible).toBe(true);
 action(f.view);f.render(1.4);expect(f.phase.audit.visible).toBe(true);
 action(f.view,80);f.render(1.48);expect(f.phase.audit.opacity).toBeCloseTo(.5,10);
 action(f.view,170);f.render(1.57);expect(f.phase.audit.visible).toBe(false);expect(f.phase.audit.aura).toBe(true);
 portrait.mockClear();action(f.view,1100);f.render(2.5);expect(f.phase.audit.visible).toBe(false);expect(portrait).not.toHaveBeenCalled();
});
it('also yields to a basic action and never resurfaces when that action ends',()=>{
 const f=fixture();f.advance(1);f.render(1.2);action(f.view,0,'panko-1');f.render(1.4);f.render(1.6);
 f.view.frame=null;portrait.mockClear();f.render(2);expect(f.phase.audit.visible).toBe(false);expect(portrait).not.toHaveBeenCalled();expect(f.phase.audit.aura).toBe(true);
});
it('does not flash a phase portrait when the phase changes inside an active action',()=>{
 const f=fixture();action(f.view,350,'mochi-1');f.advance(1);f.render(1.1);expect(f.phase.audit.visible).toBe(false);
 f.view.frame=null;f.render(1.5);expect(f.phase.audit.visible).toBe(false);expect(f.phase.audit.aura).toBe(true);expect(portrait).not.toHaveBeenCalled();
});
it('uses action age if the first observed actor frame is already at contact',()=>{
 const f=fixture();f.advance(1);f.render(1.2);action(f.view,1100);portrait.mockClear();f.render(2.5);
 expect(f.phase.audit.visible).toBe(false);expect(portrait).not.toHaveBeenCalled();expect(f.phase.audit.aura).toBe(true);
});
it('retains the full unopposed portrait lifetime through a round-status presentation',()=>{
 const f=fixture();f.view.frame={plan:{actorId:'',skillId:'round-status'},elapsed:0} as SceneView['frame'];f.advance(1);f.render(1.2);f.render(3.49);
 expect(f.phase.audit.visible).toBe(true);expect(portrait).toHaveBeenCalled();f.render(3.5);expect(f.phase.audit.visible).toBe(false);expect(f.phase.audit.aura).toBe(true);
});
it('starts a later phase cleanly after a prior portrait has yielded',()=>{
 const f=fixture();f.advance(1);f.render(1.2);action(f.view);f.render(1.4);f.render(1.6);f.view.frame=null;
 f.view.bossPhases={boss:3};f.render(2);f.render(2.2);expect(f.phase.audit.visible).toBe(true);expect(f.phase.audit.phase).toBe(3);
});
it('clears transition history on a new battle and hides dead boss presentation',()=>{
 const f=fixture();f.advance(1);action(f.view);f.render(1.2);f.view.frame=null;f.view.battleKey='second';f.view.bossPhases={boss:1};f.render(3);
 expect(f.phase.audit.visible).toBe(false);f.advance(4);f.render(4.2);expect(f.phase.audit.visible).toBe(true);
 f.view.actors[0]!.hp=0;f.render(4.3);expect(f.phase.audit.visible).toBe(false);expect(f.phase.audit.aura).toBe(false);expect(f.phase.canvas.hidden).toBe(true);
});
