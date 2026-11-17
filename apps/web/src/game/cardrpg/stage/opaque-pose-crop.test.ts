import {afterEach,expect,it,vi} from 'vitest';
import * as T from 'three';
import {DrawingLayer,type DrawingManifest} from '../../rig/drawing-layer';
import {opaqueWorldBounds} from './opaque-pose-bounds';

afterEach(()=>vi.restoreAllMocks());

type Raster={image:HTMLCanvasElement;rgba:Uint8ClampedArray};
function raster(points:readonly (readonly [number,number,number])[]):Raster {
 const image=document.createElement('canvas');image.width=16;image.height=12;
 const rgba=new Uint8ClampedArray(image.width*image.height*4);
 for(const [x,y,alpha]of points)rgba[(y*image.width+x)*4+3]=alpha;
 return{image,rgba};
}
/** Emulate the actual source rectangle, so a full-image mock cannot mask offsets. */
function canvasReadback(rasters:Raster[]){
 let source:Raster|undefined,x=0,y=0;
 const drawImage=vi.fn((image:HTMLCanvasElement,...args:number[])=>{
  source=rasters.find(r=>r.image===image);expect(source).toBeDefined();
  x=args.length===8?args[0]!:0;y=args.length===8?args[1]!:0;
  if(args.length===8)expect(args.slice(4)).toEqual([0,0,args[2],args[3]]);
 });
 const getImageData=vi.fn((dx:number,dy:number,width:number,height:number)=>{
  const {image,rgba}=source!,data=new Uint8ClampedArray(width*height*4);
  for(let row=0;row<height;row++)for(let col=0;col<width;col++){
   const start=((y+dy+row)*image.width+x+dx+col)*4;
   data.set(rgba.subarray(start,start+4),(row*width+col)*4);
  }
  return{data};
 });
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage,getImageData} as unknown as ReturnType<HTMLCanvasElement['getContext']>);
 return{drawImage,getImageData};
}
/** Independent oracle transforms every full-image opaque pixel through Three. */
function expectFullPixelBounds(mesh:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>,source:Raster){
 const {width,height}=source.image,positions=mesh.geometry.attributes.position!,uv=mesh.geometry.attributes.uv!,index=mesh.geometry.index!;
 const expected=new T.Box3(),point=new T.Vector3(),weights=new T.Vector3(),world=new T.Vector3();
 mesh.updateMatrixWorld(true);
 for(let t=0;t<index.count;t+=3){
  const ids=[index.getX(t),index.getX(t+1),index.getX(t+2)];
  const triangle=new T.Triangle(...ids.map(i=>new T.Vector3(uv.getX(i)*width,(mesh.material.map!.flipY?1-uv.getY(i):uv.getY(i))*height,0)) as [T.Vector3,T.Vector3,T.Vector3]);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   if(source.rgba[(y*width+x)*4+3]!<128)continue;
   triangle.getBarycoord(point.set(x+.5,y+.5,0),weights);
   if(Math.min(weights.x,weights.y,weights.z)<-.000001)continue;
   world.set(0,0,0);
   ids.forEach((id,j)=>world.addScaledVector(point.fromBufferAttribute(positions,id),weights.getComponent(j)));
   expected.expandByPoint(world.applyMatrix4(mesh.matrixWorld));
  }
 }
 const actual=opaqueWorldBounds(mesh);
 if(expected.isEmpty())expect(actual).toBeUndefined();
 else{
  expect(actual!.x).toBeCloseTo(expected.min.x,10);expect(actual!.y).toBeCloseTo(expected.min.y,10);
  expect(actual!.width).toBeCloseTo(expected.max.x-expected.min.x,10);expect(actual!.height).toBeCloseTo(expected.max.y-expected.min.y,10);
 }
}
function posedMesh(source:Raster,flipY:boolean){
 const texture=new T.Texture(source.image);texture.flipY=flipY;
 const geometry=new T.PlaneGeometry(16,12,3,3),positions=geometry.attributes.position!;
 for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i);positions.setXYZ(i,x+.07*y*y,y+.13*x*x,.09*x*y);}
 const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({map:texture}));
 mesh.scale.set(-1.4,.8,1);mesh.rotation.set(.17,-.21,.23);mesh.position.set(7,-3,2);
 return mesh;
}
function dispose(mesh:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>){mesh.geometry.dispose();mesh.material.map?.dispose();mesh.material.dispose();}

const windows=[
 {name:'offset guard edges',bounds:[5,4,9,8],region:[3,2,8,8],points:[[3,2,128],[10,9,255],[5,5,127],[7,7,255]]},
 {name:'top left clamp',bounds:[0,0,4,4],region:[0,0,6,6],points:[[0,0,255],[5,5,128],[2,1,127]]},
 {name:'bottom right clamp',bounds:[12,8,16,12],region:[10,6,6,6],points:[[10,6,128],[15,11,255]]},
 {name:'empty guarded window',bounds:[5,4,9,8],region:[3,2,8,8],points:[]},
] as const;
it.each([true,false].flatMap(flipY=>windows.map(window=>({...window,flipY}))))('matches full pixels for $name, including reflection and flipY=$flipY',({bounds,region,points,flipY})=>{
 const source=raster(points),mock=canvasReadback([source]),mesh=posedMesh(source,flipY);
 mesh.userData.opaquePixelBounds=bounds;
 try{
  expectFullPixelBounds(mesh,source);
  const [x,y,width,height]=region;
  expect(mock.drawImage).toHaveBeenCalledWith(source.image,x,y,width,height,0,0,width,height);
  expect(mock.getImageData).toHaveBeenCalledWith(0,0,width,height);
  mesh.geometry.translate(3,-2,1);expectFullPixelBounds(mesh,source);
  expect(mock.getImageData).toHaveBeenCalledTimes(1);
 }finally{dispose(mesh);}
});

const invalidHints=[undefined,null,{},[],[1,2,3],[1,2,3,4,5],['1',2,3,4],[1.5,2,3,4],[-1,2,3,4],[1,-1,3,4],[3,2,3,4],[1,4,3,4],[4,2,3,4],[1,5,3,4],[1,2,17,4],[1,2,3,13],[1,2,NaN,4],[1,2,3,Infinity]];
it.each(invalidHints.map((hint,index)=>({hint,index})))('retains full-image fallback for missing or malformed hint $index',({hint})=>{
 const source=raster([[0,0,128],[15,11,255],[8,6,127]]),mock=canvasReadback([source]),mesh=posedMesh(source,true);
 mesh.userData.opaquePixelBounds=hint;
 try{expectFullPixelBounds(mesh,source);expect(mock.drawImage).toHaveBeenCalledWith(source.image,0,0);expect(mock.getImageData).toHaveBeenCalledWith(0,0,16,12);}
 finally{dispose(mesh);}
});

it('follows active drawing metadata, clears absent hints, and reuses returning poses',()=>{
 const idle=raster([[2,1,128],[7,6,255]]),attack=raster([[8,4,128],[14,10,255]]),hurt=raster([[0,0,128],[15,11,255]]),mock=canvasReadback([idle,attack,hurt]);
 const frame={image:'test',face:[4,2,8,4] as const,feet:[[6,11],[10,11]] as const,sockets:{head:[8,4] as const,mainHand:[11,7] as const}};
 const manifest:DrawingManifest={version:1,unit:'mochi',canvas:[16,12],baseline:[8,12],opaqueHeight:12,poses:{K0:{...frame,opaqueBounds:[4,3,6,5]},K1:{...frame,opaqueBounds:[10,6,13,9]},K4:frame}};
 const textures={K0:new T.Texture(idle.image),K1:new T.Texture(attack.image),K4:new T.Texture(hurt.image)};
 const layer=new DrawingLayer({manifest,textures},[0,0],1);
 try{
  expectFullPixelBounds(layer,idle);expect(mock.getImageData).toHaveBeenLastCalledWith(0,0,6,6);
  layer.sample('attack',.1,false);expectFullPixelBounds(layer,attack);expect(mock.getImageData).toHaveBeenLastCalledWith(0,0,7,7);
  layer.sample('ult',.1,false,.05);expectFullPixelBounds(layer,hurt);expect(mock.getImageData).toHaveBeenLastCalledWith(0,0,16,12);
  layer.sample('idle',1,true);expectFullPixelBounds(layer,idle);expect(mock.getImageData).toHaveBeenCalledTimes(3);
  layer.sample('attack',.1,false);expectFullPixelBounds(layer,attack);expect(mock.getImageData).toHaveBeenCalledTimes(3);
 }finally{layer.dispose();Object.values(textures).forEach(texture=>texture.dispose());}
});
