import {expect,it,vi} from 'vitest';
import * as T from 'three';
import type {SpineActor} from '../spine/assets';
import {PaintDeath} from './paint-death';

function fixture(){
 const root=new T.Group();root.add(new T.Mesh(new T.PlaneGeometry(20,40),new T.MeshBasicMaterial({transparent:true})));
 const actor={root,bounds:{x:-10,y:0,width:20,height:40}} as unknown as SpineActor;
 const death=new PaintDeath(actor),previous=new T.WebGLRenderTarget(1,1);
 const renderer={getPixelRatio:()=>1,getRenderTarget:()=>previous,getClearAlpha:()=>.8,
  getClearColor:(c:T.Color)=>c.set('#204060'),setRenderTarget:vi.fn(),setClearColor:vi.fn(),clear:vi.fn(),render:vi.fn()} as unknown as T.WebGLRenderer;
 const camera=new T.OrthographicCamera(-640,640,720,0,0,200);camera.position.z=100;
 const frame={width:1280,worldWidth:1280,worldHeight:720,box:{x:200,y:100,width:80,height:120}};
 const paint=()=>((death.fragments.children[0] as T.Mesh).material as T.ShaderMaterial).uniforms.uPaint!.value;
 return {death,root,renderer,camera,frame,previous,paint};
}

it('supplies native fragments with original paint without a craftLight',()=>{
 const f=fixture();f.death.setTime(.2,false);expect(f.death.fragments.visible).toBe(false);
 f.death.captureNativeSource(f.renderer,f.camera,f.frame);
 expect(f.paint()).toBeInstanceOf(T.Texture);expect(f.death.fragments.visible).toBe(true);
 expect(f.renderer.render).toHaveBeenCalledWith(f.root,expect.any(T.OrthographicCamera));
 expect(f.renderer.setRenderTarget).toHaveBeenLastCalledWith(f.previous);
 expect(f.renderer.setClearColor).toHaveBeenLastCalledWith(new T.Color('#204060'),.8);
 f.death.dispose();f.previous.dispose();
});
it('does not allocate or capture for living, reduced-motion, or fully dissolved actors',()=>{
 const f=fixture();
 for(const [time,reduced]of [[null,false],[.2,true],[.6,false]] as const){
  f.death.setTime(time,reduced);f.death.captureNativeSource(f.renderer,f.camera,f.frame);
  expect(f.death.fragments.visible).toBe(false);
 }
 expect(f.renderer.render).not.toHaveBeenCalled();expect(f.paint()).toBeNull();
 f.death.dispose();f.previous.dispose();
});
it('reuses native source storage as the dying pose shrinks and releases it on disposal',()=>{
 const f=fixture();f.death.setTime(.2,false);f.death.captureNativeSource(f.renderer,f.camera,f.frame);
 const first=f.paint(),target=vi.mocked(f.renderer.setRenderTarget).mock.calls[0]![0]!;
 const disposed=vi.spyOn(target,'dispose');f.death.setTime(.4,false);
 f.death.captureNativeSource(f.renderer,f.camera,{...f.frame,box:{...f.frame.box,width:50,height:60}});
 expect(f.paint()).toBe(first);expect(target.width).toBe(96);expect(target.height).toBe(160);
 f.death.dispose();expect(disposed).toHaveBeenCalledOnce();f.previous.dispose();
});
it('restores renderer state when source rendering fails',()=>{
 const f=fixture();f.death.setTime(.2,false);vi.mocked(f.renderer.render).mockImplementation(()=>{throw Error('context lost');});
 expect(()=>f.death.captureNativeSource(f.renderer,f.camera,f.frame)).toThrow('context lost');
 expect(f.renderer.setRenderTarget).toHaveBeenLastCalledWith(f.previous);expect(f.death.fragments.visible).toBe(false);
 f.death.dispose();f.previous.dispose();
});
