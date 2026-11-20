import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {CasterFocus,FocusBannerAnchor} from './focus';

it('outlines only the current visible drawing through swaps and hidden ancestors',()=>{
 const focus=new CasterFocus(),actor=new T.Group(),hiddenRig=new T.Group();hiddenRig.visible=false;
 const geometry=new T.PlaneGeometry(),windup=new T.Texture(),cast=new T.Texture();
 const material=new T.MeshBasicMaterial({map:windup}),drawing=new T.Mesh(geometry,material);
 hiddenRig.add(new T.Mesh(new T.PlaneGeometry(),new T.MeshBasicMaterial()));actor.add(hiddenRig,drawing);actor.updateMatrixWorld(true);
 focus.render(actor,'#ffd892',1,1);
 const visible=()=>focus.root.children.filter(o=>o.visible) as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>[];
 expect(visible()).toHaveLength(8);expect(visible().every(m=>m.geometry===geometry&&m.material.map===windup)).toBe(true);
 material.map=cast;focus.render(actor,'#ffd892',1,1);
 expect(visible()).toHaveLength(8);expect(visible().every(m=>m.material.map===cast)).toBe(true);
 drawing.visible=false;focus.render(actor,'#ffd892',1,1);expect(visible()).toHaveLength(0);
 drawing.visible=true;actor.visible=false;focus.render(actor,'#ffd892',1,1);expect(visible()).toHaveLength(0);
 actor.visible=true;focus.render(actor,'#ffd892',1,1);expect(visible()).toHaveLength(8);
 const disposeGeometry=vi.spyOn(geometry,'dispose'),disposeTexture=vi.spyOn(cast,'dispose');focus.dispose();
 expect(disposeGeometry).not.toHaveBeenCalled();expect(disposeTexture).not.toHaveBeenCalled();
 geometry.dispose();windup.dispose();cast.dispose();material.dispose();
});

it('keeps the title still through breathing, then relayouts for a new action or viewport',()=>{
 const anchor=new FocusBannerAnchor(),plan={},caster={x:500,y:200,width:250,height:300};
 const first=anchor.place(plan,caster,1280,720,[caster]);
 for(const shift of [-8,4,9,-3])expect(anchor.place(plan,{...caster,y:caster.y+shift},1280,720,[{...caster,y:caster.y+shift}])).toEqual(first);
 const resized=anchor.place(plan,caster,390,720,[caster]);
 expect(resized.x).toBeGreaterThanOrEqual(8);expect(resized.x+resized.width).toBeLessThanOrEqual(382);
 const next=anchor.place({}, {...caster,x:50},1280,720,[]);
 expect(next).not.toEqual(first);
});

it('composes an opted-in packed media alpha decoder before focus tint and keeps its live uniforms',()=>{
 const focus=new CasterFocus(),actor=new T.Group(),geometry=new T.PlaneGeometry();
 const video=new T.Texture(),poster=new T.Texture(),source=new T.MeshBasicMaterial({map:video});
 const packed={value:1};
 source.onBeforeCompile=vi.fn(shader=>{
  shader.uniforms.designerPacked=packed;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','diffuseColor.a *= decodedMediaAlpha;');
 });
 source.customProgramCacheKey=()=> 'designer-four-plane-v2';
 actor.add(new T.Mesh(geometry,source));actor.updateMatrixWorld(true);
 focus.render(actor,'#ffd892',1,1,true);
 const copy=focus.root.children[0] as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>;
 const shader={uniforms:{},fragmentShader:'#include <map_fragment>\n#include <opaque_fragment>'} as Parameters<T.Material['onBeforeCompile']>[0];
 copy.material.onBeforeCompile(shader,{} as T.WebGLRenderer);
 expect(source.onBeforeCompile).toHaveBeenCalledOnce();
 expect(shader.fragmentShader).toContain('diffuseColor.a *= decodedMediaAlpha;');
 expect(shader.fragmentShader).toContain('outgoingLight = focusTint;');
 expect(shader.uniforms.designerPacked).toBe(packed);
 expect(copy.material.customProgramCacheKey()).toContain('designer-four-plane-v2');
 packed.value=0;source.map=poster;focus.render(actor,'#ffd892',1,1,true);
 expect(copy.material.map).toBe(poster);expect(shader.uniforms.designerPacked!.value).toBe(0);
 const disposed=vi.spyOn(copy.material,'dispose');
 focus.render(actor,'#ffd892',1,1,false);
 expect(disposed).toHaveBeenCalledOnce();
 const ordinary=focus.root.children[0] as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>;
 expect(ordinary.material.customProgramCacheKey()).toBe('v3-feel-caster-outline');
 const plain={uniforms:{},fragmentShader:'#include <map_fragment>\n#include <opaque_fragment>'} as Parameters<T.Material['onBeforeCompile']>[0];
 ordinary.material.onBeforeCompile(plain,{} as T.WebGLRenderer);
 expect(source.onBeforeCompile).toHaveBeenCalledOnce();expect(plain.fragmentShader).toContain('#include <map_fragment>');
 focus.dispose();geometry.dispose();source.dispose();video.dispose();poster.dispose();
});
