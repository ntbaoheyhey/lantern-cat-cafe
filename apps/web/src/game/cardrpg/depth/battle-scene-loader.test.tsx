import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {act,cleanup,render} from '@testing-library/react';
import {DepthModel} from './model';
import {BattleView} from './Battle';

const scene=vi.hoisted(()=>({load:vi.fn(),spine:vi.fn(),legacy:vi.fn(),dispose:vi.fn(),prepare:vi.fn()}));
vi.mock('./preview-loader',()=>({loadPreviewScene:scene.load}));
vi.mock('./FeelLab',()=>({FeelLab:()=>null}));
vi.mock('../spine/config',async original=>({...await original<object>(),lookSpineEnabled:()=>false}));
vi.mock('../spine/scene',()=>({SpineScene:class {
 ready=false;constructor(){scene.spine();}dispose=scene.dispose;prepare=scene.prepare;
}}));
class LegacyScene {
 ready=false;constructor(){scene.legacy();}dispose=scene.dispose;invalidate=vi.fn();
}
let resolveRenderer:(value:unknown)=>void;
const model=(formationC2:boolean)=>{
 const m=new DepthModel(true);m.tutorial();m.fight();const battle=m.battle!;
 m.galleryBattle={...battle,initial:{...battle.initial,formationC2}};return m;
};
beforeEach(()=>{
 vi.clearAllMocks();vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn());
 scene.load.mockImplementation(()=>new Promise(resolve=>{resolveRenderer=resolve;}));
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

it('starts the formation renderer without importing the legacy battle renderer',()=>{
 const view=render(<BattleView m={model(true)}/>);
 expect(scene.spine).toHaveBeenCalledOnce();expect(scene.load).not.toHaveBeenCalled();
 view.unmount();expect(scene.dispose).toHaveBeenCalledOnce();expect(window.__depthScene).toBeUndefined();
});
it('does not mount a legacy renderer when its import resolves after the battle unmounts',async()=>{
 const view=render(<BattleView m={model(false)}/>);
 expect(scene.load).toHaveBeenCalledOnce();view.unmount();
 await act(async()=>resolveRenderer(LegacyScene));expect(scene.legacy).not.toHaveBeenCalled();expect(window.__depthScene).toBeUndefined();
});
it('mounts and disposes the selected legacy renderer once after its import resolves',async()=>{
 const view=render(<BattleView m={model(false)}/>);
 expect(scene.legacy).not.toHaveBeenCalled();await act(async()=>resolveRenderer(LegacyScene));
 expect(scene.legacy).toHaveBeenCalledOnce();expect(scene.spine).not.toHaveBeenCalled();
 view.unmount();expect(scene.dispose).toHaveBeenCalledOnce();expect(window.__depthScene).toBeUndefined();
});
