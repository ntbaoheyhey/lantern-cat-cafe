import {afterEach,expect,it,vi} from 'vitest';
import {Group,Mesh,MeshBasicMaterial,PlaneGeometry,Texture,Vector3} from 'three';
import {actorOpaqueWorldBounds,measuredMediaWorldBounds} from './media-pose-bounds';
afterEach(()=>vi.restoreAllMocks());

function fixture(segments=1){
 const video=document.createElement('video');expect(video.width).toBe(0);
 const geometry=new PlaneGeometry(4,4,segments,segments),material=new MeshBasicMaterial({map:new Texture(video)}),plane=new Mesh(geometry,material),root=new Group();root.add(plane);
 const manifest={width:4,height:4,opaqueBounds:[1,1,3,3] as [number,number,number,number]};
 return{plane,root,manifest,actor:{root,designerIdle:true,designerMedia:{media:{plane,manifest}}}};
}

it.each(['mochi','clover'])('uses measured %s bounds with a zero-width packed video and poster fallback',asset=>{
 const f=fixture(),canvas=vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(()=>{throw Error('Packed planes are not RGBA');});
 f.root.position.set(7,11,0);f.root.scale.set(-2,3,1);f.root.rotation.z=.3;
 const corners=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,y])=>f.root.localToWorld(new Vector3(x!,y!,0)));
 const x=Math.min(...corners.map(p=>p.x)),y=Math.min(...corners.map(p=>p.y));
 const expected={x,y,width:Math.max(...corners.map(p=>p.x))-x,height:Math.max(...corners.map(p=>p.y))-y};
 const actual=actorOpaqueWorldBounds(asset,f.actor)!;
 for(const key of ['x','y','width','height'] as const)expect(actual[key]).toBeCloseTo(expected[key],10);
 f.plane.material.map=new Texture(document.createElement('img'));
 expect(actorOpaqueWorldBounds(asset,f.actor)).toEqual(actual);expect(canvas).not.toHaveBeenCalled();
});

it('clips measured boundaries through the posed triangles, then follows current vertices',()=>{
 const f=fixture(),p=f.plane.geometry.attributes.position!;
 expect(measuredMediaWorldBounds(f.plane,f.manifest)).toEqual({x:-1,y:-1,width:2,height:2});
 p.setX(3,10);
 expect(measuredMediaWorldBounds(f.plane,f.manifest)).toEqual({x:-1,y:-1,width:6,height:2});
 f.root.position.set(4,-3,0);
 expect(measuredMediaWorldBounds(f.plane,f.manifest)).toEqual({x:3,y:-4,width:6,height:2});
});

it('retains interior cast extrema rather than projecting only four rectangle corners',()=>{
 const f=fixture(2);f.plane.geometry.attributes.position!.setX(4,9);
 expect(measuredMediaWorldBounds(f.plane,f.manifest)).toEqual({x:-1,y:-1,width:10,height:2});
});

it('invalidates cached clips when the measured logical crop changes',()=>{
 const f=fixture();measuredMediaWorldBounds(f.plane,f.manifest);
 f.manifest.opaqueBounds=[0,0,4,4];
 expect(measuredMediaWorldBounds(f.plane,f.manifest)).toEqual({x:-2,y:-2,width:4,height:4});
});

it.each([['panko',true],['mochi',false],['clover',false]] as const)('retains ordinary alpha measurement for %s marker=%s',(asset,designerIdle)=>{
 const f=fixture();f.actor.designerIdle=designerIdle;
 const image=document.createElement('canvas');image.width=image.height=4;f.plane.material.map=new Texture(image);
 const rgba=new Uint8ClampedArray(64);rgba[(1*4+2)*4+3]=255;
 const canvas=vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:()=>{},getImageData:()=>({data:rgba})} as unknown as ReturnType<HTMLCanvasElement['getContext']>);
 expect(actorOpaqueWorldBounds(asset,f.actor)).toEqual({x:.5,y:.5,width:0,height:0});expect(canvas).toHaveBeenCalledTimes(1);
});

it('does not inspect a packed texture while its measured descriptor is unavailable',()=>{
 const f=fixture(),canvas=vi.spyOn(HTMLCanvasElement.prototype,'getContext');
 expect(actorOpaqueWorldBounds('mochi',{root:f.root,designerIdle:true} as typeof f.actor)).toBeUndefined();
 f.manifest.opaqueBounds=[1,1,5,3];expect(actorOpaqueWorldBounds('clover',f.actor)).toBeUndefined();expect(canvas).not.toHaveBeenCalled();
});
