import {afterEach,expect,it,vi} from 'vitest';
import {Box3,Mesh,MeshBasicMaterial,PlaneGeometry,Texture,Triangle,Vector3} from 'three';
import {opaqueWorldBounds} from './opaque-pose-bounds';
afterEach(()=>vi.restoreAllMocks());

it('reuses both alternating pose contours while still measuring current deformation',()=>{
 const first=document.createElement('canvas'),second=document.createElement('canvas');first.width=second.width=4;first.height=second.height=4;
 let source=first;const rgba=()=>{const data=new Uint8ClampedArray(64);for(let y=0;y<4;y++)for(let x=0;x<4;x++)data[(y*4+x)*4+3]=(source===first?x<2:x>=2)?255:0;return data;};
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:(image:HTMLCanvasElement)=>{source=image;},getImageData:()=>({data:rgba()})} as unknown as ReturnType<HTMLCanvasElement['getContext']>);
 const a=new Texture(first),b=new Texture(second),geometry=new PlaneGeometry(8,8),material=new MeshBasicMaterial({map:a}),mesh=new Mesh(geometry,material);
 const reads=vi.spyOn(geometry.attributes.uv!,'getX');const left=opaqueWorldBounds(mesh)!;const firstReads=reads.mock.calls.length;
 material.map=b;const right=opaqueWorldBounds(mesh)!;expect(right.x).toBeGreaterThan(left.x);expect(reads.mock.calls.length).toBeGreaterThan(firstReads);
 const bothReads=reads.mock.calls.length;geometry.translate(5,2,0);material.map=a;const moved=opaqueWorldBounds(mesh)!;
 expect(moved.x).toBeCloseTo(left.x+5);expect(moved.y).toBeCloseTo(left.y+2);expect(moved.width).toBeCloseTo(left.width);expect(reads).toHaveBeenCalledTimes(bothReads);
 material.map=b;expect(opaqueWorldBounds(mesh)!.x).toBeCloseTo(right.x+5);expect(reads).toHaveBeenCalledTimes(bothReads);
 geometry.dispose();material.dispose();a.dispose();b.dispose();
});

it.each([true,false])('retains every painted extremum through deformation and reflection (flipY=%s)',flipY=>{
 const image=document.createElement('canvas');image.width=8;image.height=6;
 const rgba=new Uint8ClampedArray(8*6*4);
 for(let y=0;y<6;y++)for(let x=0;x<8;x++)rgba[(y*8+x)*4+3]=(x+3*y)%5===0?128:(x*y)%7===3?255:127;
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:()=>{},getImageData:()=>({data:rgba})} as unknown as ReturnType<HTMLCanvasElement['getContext']>);
 const texture=new Texture(image);texture.flipY=flipY;
 const geometry=new PlaneGeometry(8,6,2,2),positions=geometry.attributes.position!,uv=geometry.attributes.uv!,index=geometry.index!;
 for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i);positions.setXYZ(i,x+.07*y*y,y+.13*x*x,.09*x*y);}
 const material=new MeshBasicMaterial({map:texture}),mesh=new Mesh(geometry,material);
 mesh.scale.set(-1.4,.8,1);mesh.rotation.z=.23;mesh.position.set(7,-3,2);mesh.updateMatrixWorld(true);
 // Independent oracle: transform every painted pixel through Three's triangle
 // interpolation, without row endpoints or convex-hull reduction.
 const expected=new Box3(),point=new Vector3(),weights=new Vector3(),world=new Vector3();
 for(let t=0;t<index.count;t+=3){
  const ids=[index.getX(t),index.getX(t+1),index.getX(t+2)];
  const triangle=new Triangle(...ids.map(i=>new Vector3(uv.getX(i)*8,(flipY?1-uv.getY(i):uv.getY(i))*6,0)) as [Vector3,Vector3,Vector3]);
  for(let y=0;y<6;y++)for(let x=0;x<8;x++){
   if(rgba[(y*8+x)*4+3]!<128)continue;
   triangle.getBarycoord(point.set(x+.5,y+.5,0),weights);
   if(Math.min(weights.x,weights.y,weights.z)<-.000001)continue;
   world.set(0,0,0);
   ids.forEach((id,j)=>world.addScaledVector(point.fromBufferAttribute(positions,id),weights.getComponent(j)));
   expected.expandByPoint(world.applyMatrix4(mesh.matrixWorld));
  }
 }
 const actual=opaqueWorldBounds(mesh)!;
 expect(actual.x).toBeCloseTo(expected.min.x,10);expect(actual.y).toBeCloseTo(expected.min.y,10);
 expect(actual.width).toBeCloseTo(expected.max.x-expected.min.x,10);expect(actual.height).toBeCloseTo(expected.max.y-expected.min.y,10);
 geometry.dispose();material.dispose();texture.dispose();
});
