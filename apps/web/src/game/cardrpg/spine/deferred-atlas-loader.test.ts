import {expect,it,vi} from 'vitest';
import * as T from 'three';
import native from '../../../../public/units/marigold/rig.json';
import poseManifest from '../../../../public/units/soot/poses/manifest.json';
import type {CutoutData} from '../../rig/cutout';
import type {DrawingManifest,DrawingSet} from '../../rig/drawing-layer';
import {deferredRigFactory} from './deferred-atlas-loader';
const data=native as unknown as CutoutData;
const drawings=():DrawingSet=>({manifest:poseManifest as unknown as DrawingManifest,textures:Object.fromEntries(['K0','K1','K2','K4','K5'].map(k=>[k,new T.Texture()]))});
it('retains sockets and geometry without loading hidden pixels, then restores once pixels decode',async()=>{
 let finish!:(value:T.Texture[])=>void;const load=vi.fn(()=>new Promise<T.Texture[]>(resolve=>finish=resolve));
 const mesh=deferredRigFactory(data,load)(),nativeMesh=mesh.children[0] as T.Mesh;
 expect(mesh.bones).toHaveLength(data.nodes.length);expect(mesh.skeleton.getBoundsRect().height).toBeGreaterThan(0);
 const drawing=mesh.installDrawings(drawings(),[0,0],1);expect(load).not.toHaveBeenCalled();
 mesh.clearDrawings();mesh.clearDrawings();expect(load).toHaveBeenCalledTimes(1);expect(mesh.drawing).toBe(drawing);expect(nativeMesh.visible).toBe(false);
 const pixels=data.pages.map(()=>new T.Texture());finish(pixels);
 await vi.waitFor(()=>expect(mesh.drawing).toBeUndefined());expect(nativeMesh.visible).toBe(true);
 expect((nativeMesh.material as T.MeshBasicMaterial).map).toBe(pixels[0]);mesh.dispose();
});
it('does not clear a replacement drawing or restore a disposed actor after late decoding',async()=>{
 let finish!:(value:T.Texture[])=>void;const load=vi.fn(()=>new Promise<T.Texture[]>(resolve=>finish=resolve)),create=deferredRigFactory(data,load);
 const a=create(),b=create();a.installDrawings(drawings(),[0,0],1);b.installDrawings(drawings(),[0,0],1);
 a.clearDrawings();const replacement=a.installDrawings(drawings(),[0,0],1);b.clearDrawings();b.dispose();
 finish(data.pages.map(()=>new T.Texture()));await Promise.resolve();await Promise.resolve();
 expect(a.drawing).toBe(replacement);expect(b.drawing).toBeUndefined();expect(load).toHaveBeenCalledTimes(1);
 a.clearDrawings();expect(a.drawing).toBeUndefined();a.dispose();
});
it('keeps the drawing after a decode failure and retries; disposing never requests atlas bytes',async()=>{
 const load=vi.fn<()=>Promise<T.Texture[]>>().mockRejectedValueOnce(Error('offline')).mockResolvedValue(data.pages.map(()=>new T.Texture()));
 const create=deferredRigFactory(data,load),mesh=create();mesh.installDrawings(drawings(),[0,0],1);mesh.clearDrawings();
 await vi.waitFor(()=>expect(mesh.userData.atlasRestoreError).toContain('offline'));expect(mesh.drawing).toBeDefined();
 mesh.clearDrawings();await vi.waitFor(()=>expect(mesh.drawing).toBeUndefined());expect(load).toHaveBeenCalledTimes(2);mesh.dispose();
 const unused=deferredRigFactory(data,load)();unused.installDrawings(drawings(),[0,0],1);unused.dispose();expect(load).toHaveBeenCalledTimes(2);
});
