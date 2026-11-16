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
