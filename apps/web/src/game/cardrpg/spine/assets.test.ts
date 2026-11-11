import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import * as T from 'three';
import fixture from '../../../../../../tools/cardrpg-look/spine/fixtures/pass/mochi.json';
import atlasText from '../../../../../../tools/cardrpg-look/spine/fixtures/pass/mochi.atlas?raw';
import {loadSkeleton, loadSpineActor, spineAssetUrl} from './assets';
import {SPINE_UNIT_BY_ID, type AcceptedSequence, type AcceptedSkeleton} from './config';

vi.mock('../../squad/turn3d/look-puppet', () => ({
 loadPuppetModel: async () => {const scene=new T.Group();scene.userData.paintedRig={aspect:.5};return {scene};},
 animateIllustrated: vi.fn(),
}));
vi.mock('../../squad/turn3d/look-scale', () => ({fallbackScale: () => ({min:[0,0],max:[256,512],widthScale:1})}));

const fetchAsset=vi.fn(), decode=vi.fn();
beforeEach(() => {
 fetchAsset.mockReset();decode.mockReset().mockResolvedValue(undefined);
 vi.stubGlobal('fetch',fetchAsset);
 vi.stubGlobal('ImageBitmap',class {});
 vi.stubGlobal('WebGLRenderingContext',{STATIC_DRAW:0x88e4,DYNAMIC_DRAW:0x88e8});
 vi.stubGlobal('Image',class {width=64;height=128;src='';decode(){return decode();}});
});
afterEach(() => {vi.unstubAllGlobals();});

it.each(['atlas','skeleton'])('retries a failed %s request, then shares data but keeps actor states separate',async failure => {
 const unit=SPINE_UNIT_BY_ID.get(failure==='atlas'?'soot':'clover')!,spec=unit.placeholder;
 // Use the accepted parser fixture with this published atlas page name.
 const atlas=atlasText.replaceAll('mochi.png',failure==='atlas'?'soot.png':'clover.png');
 const failedUrl=spineAssetUrl(failure==='atlas'?spec.atlas:spec.skeleton);
 let fail=true;
 fetchAsset.mockImplementation(async (url:string) => {
  if(url===failedUrl&&fail){fail=false;return new Response('temporary',{status:503});}
  return new Response(url===spineAssetUrl(spec.atlas)?atlas:JSON.stringify(fixture));
 });
 const first=loadSkeleton(spec),concurrent=loadSkeleton(spec);
 expect(concurrent).toBe(first);
 await expect(Promise.all([first,concurrent])).rejects.toThrow('503');
 const recovered=await loadSkeleton(spec),calls=fetchAsset.mock.calls.length;
 expect(await loadSkeleton(spec)).toBe(recovered);expect(fetchAsset).toHaveBeenCalledTimes(calls);
 const one=recovered.create(),two=recovered.create();
 expect(one.skeleton.data).toBe(two.skeleton.data);expect(one.state).not.toBe(two.state);
 one.update(0);
 const materials:T.Material[]=[];
 one.traverse(child=>{if(child instanceof T.Mesh)materials.push(...(Array.isArray(child.material)?child.material:[child.material]));});
 expect(materials.length).toBeGreaterThan(0);
 for(const material of materials){expect(material.side).toBe(T.DoubleSide);expect(material.forceSinglePass).toBe(true);}
 one.state.setAnimation(0,'attack',false);two.state.setAnimation(0,'idle',true);
 expect(two.state.getCurrent(0)?.animation?.name).toBe('idle');one.dispose();two.dispose();
});

it.each(['manifest','image'])('recovers a PNG sequence after a temporary %s failure without caching the fallback',async failure => {
 const unit=SPINE_UNIT_BY_ID.get(failure==='manifest'?'panko':'mallow')!;
 const mutable=unit as unknown as {sequence:AcceptedSequence|null};const previous=mutable.sequence;
 // Only the in-memory slot changes. No fixture delivery or source file is installed.
 mutable.sequence={format:'sequence',manifest:unit.placeholder.skeleton,scale:1};
 const manifest={id:unit.id,height:512,width:256,fps:20,sockets:Object.fromEntries(unit.requiredBones.map(name=>[name,[0,256]])),animations:Object.fromEntries(unit.animations.map(name=>[name,{frames:Array(40).fill(unit.id+'.png')}]))};
 fetchAsset.mockImplementation(async () => new Response(JSON.stringify(manifest)));
 if(failure==='manifest')fetchAsset.mockResolvedValueOnce(new Response('temporary',{status:503}));
 else decode.mockRejectedValueOnce(new Error('temporary decode failure'));
 try{
  const fallback=await loadSpineActor(unit.id,'sequence');expect(fallback.source).toBe('puppet');fallback.dispose();
  const recovered=await loadSpineActor(unit.id,'sequence');expect(recovered.source).toBe('sequence');
  const fetches=fetchAsset.mock.calls.length,decodes=decode.mock.calls.length;
  const reused=await loadSpineActor(unit.id,'sequence');expect(reused.sequence).toBe(recovered.sequence);
  expect(reused.plane).not.toBe(recovered.plane);expect(fetchAsset).toHaveBeenCalledTimes(fetches);expect(decode).toHaveBeenCalledTimes(decodes);
  recovered.dispose();reused.dispose();
 }finally{mutable.sequence=previous;}
});

it('uses the active accepted format by default, keeping explicit previews and runtime-free playback',async()=>{
 const unit=SPINE_UNIT_BY_ID.get('cinnamon')!,sequenceUnit=SPINE_UNIT_BY_ID.get('inkcap')!;
 const mutable=unit as unknown as {designer:AcceptedSkeleton|null;sequence:AcceptedSequence|null;activeSource?:'designer'|'sequence'};
 const original={designer:mutable.designer,sequence:mutable.sequence,activeSource:mutable.activeSource};
 mutable.designer=unit.placeholder;mutable.sequence={format:'sequence',manifest:sequenceUnit.placeholder.skeleton,scale:1};mutable.activeSource='sequence';
 const manifest={id:unit.id,height:512,width:256,fps:20,sockets:Object.fromEntries(unit.requiredBones.map(name=>[name,[0,256]])),animations:Object.fromEntries(unit.animations.map(name=>[name,{frames:Array(40).fill('inkcap.png')}]))};
 fetchAsset.mockImplementation(async(url:string)=>new Response(url===spineAssetUrl(sequenceUnit.placeholder.skeleton)?JSON.stringify(manifest):url===spineAssetUrl(unit.placeholder.atlas)?atlasText.replaceAll('mochi.png','cinnamon.png'):JSON.stringify(fixture)));
 async function expectSource(expected:string,preference?:'designer'|'sequence'|'placeholder'){
  const actor=await loadSpineActor(unit.id,preference);try{expect(actor.source).toBe(expected);expect(actor.bounds.height).toBeCloseTo(512,6);}finally{actor.dispose();}
 }
 try{
  await expectSource('sequence');await expectSource('designer','designer');await expectSource('placeholder','placeholder');
  mutable.activeSource='designer';await expectSource('designer');await expectSource('sequence','sequence');
  delete mutable.activeSource;await expectSource('designer');
  mutable.activeSource='designer';vi.stubGlobal('location',{search:'?spineRuntime=0'});await expectSource('sequence');
 }finally{Object.assign(mutable,original);}
});
