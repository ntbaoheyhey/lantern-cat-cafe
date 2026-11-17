import {afterEach,expect,it,vi} from 'vitest';
import {Mesh,MeshBasicMaterial,PlaneGeometry,Texture} from 'three';
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
