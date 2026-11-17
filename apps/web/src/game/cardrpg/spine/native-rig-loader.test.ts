import {afterEach,expect,it,vi} from 'vitest';
import {loadSpineActor} from './assets';
import nativeFixture from '../../../../public/units/marigold/rig.json';
afterEach(()=>vi.unstubAllGlobals());
it('loads explicit drawn-actor metadata without native pixels or opacity-canvas failures',async()=>{
 const fetchAsset=vi.fn(async()=>new Response(JSON.stringify(nativeFixture))),decode=vi.fn();
 vi.stubGlobal('fetch',fetchAsset);vi.stubGlobal('Image',class{decode=decode;});
 const actor=await loadSpineActor('marigold',undefined,{deferNativePixels:true});
 expect(actor.source).toBe('template');expect(actor.mesh?.bones.length).toBe(nativeFixture.nodes.length);
 expect(actor.bounds.height).toBeGreaterThan(0);expect(actor.boneRefs.size).toBeGreaterThan(0);
 expect(actor.opaqueWorld).toBeUndefined();expect(decode).not.toHaveBeenCalled();actor.dispose();
 expect(fetchAsset).toHaveBeenCalledTimes(1);
});
