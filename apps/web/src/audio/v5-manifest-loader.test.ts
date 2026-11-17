import {afterEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {applyV5Audio,loadV5AudioManifest} from './v5-manifest-loader';
import {resolveDesign,type AudioManifest} from './cues';
const read=(path:string)=>JSON.parse(readFileSync(resolve(import.meta.dirname,'../../public/audio',path),'utf8'));
afterEach(()=>vi.unstubAllGlobals());
describe('V5 audio delivery',()=>{
 it('preserves every ranged take, its duration and constituent layers while replacing available files',()=>{
  const base=read('manifest.json') as AudioManifest,delivery=read('v5/manifest.json'),next=applyV5Audio(base,delivery);
  for(const key of ['kit.ranged-ember.impact','kit.ranged-heavy.impact','kit.ranged-shadow.impact','kit.ranged-tide.impact','kit.ranged-ice.impact']){
   const before=base.designs![key]!,after=next.designs![key]!;
   expect(after.baked).toHaveLength(before.baked!.length);
   expect(after.pitchRange).toEqual(before.pitchRange);expect(after.cooldownMs).toBe(before.cooldownMs);
   before.baked!.forEach((take,index)=>{
    const updated=after.baked![index]!;
    expect(updated.layers).toEqual(take.layers);
    expect(updated.sample.duration).toBe(take.sample.duration);
    expect(updated.sample.variantId).toBe(take.sample.variantId);
    if(delivery[take.sample.variantId!]?.durationSeconds+.02>=take.sample.duration){expect(updated.sample.start).toBe(0);expect(next.packs[updated.sample.pack]?.opus).toBe(delivery[take.sample.variantId!].opus);}
    else expect(updated.sample).toEqual(take.sample);
   });
  }
  expect(base.packs['v5:legacy/ranged-ember-impact-0-0']).toBeUndefined();
  for(const element of ['ember','heavy','shadow','tide']){
   const replacements=next.packSubstitutions![`v4-ranged-${element}`]!;
   expect(replacements).toHaveLength(36);
   expect(replacements).not.toContain(`v4-ranged-${element}`);
  }
 });
 it('matches every delivered voice take by identity while preserving bus, duration and processed voice treatment',()=>{
  const base=read('manifest.json') as AudioManifest,next=applyV5Audio(base,read('v5/manifest.json'));
  for(const hero of ['mochi','soot','clover','panko'])for(const phase of ['hit','death']){
   const key=`voice.${hero}.${phase}`;
   expect(next.cues[key]).toHaveLength(base.cues[key]!.length);
   base.cues[key]!.forEach((sample,index)=>{
    const after=next.cues[key]![index]!;
    expect(after).toMatchObject({duration:sample.duration,variantId:sample.variantId,bus:'voice',processedVoice:true,start:0,gainDb:0});
    expect(after.pack).toMatch(/^v5:voice\//);expect(sample.pack).toBe(`cat-${hero}`);
   });
  }
 });
 it('keeps a missing voice variant on its original pack while using delivered peers',()=>{
  const base=read('manifest.json') as AudioManifest,rows=read('v5/manifest.json')['voice.mochi.hit'];
  const next=applyV5Audio(base,{'voice.mochi.hit':[rows[0]]});
  expect(next.cues['voice.mochi.hit']![0]!.pack).toMatch(/^v5:voice\//);
  expect(next.cues['voice.mochi.hit']![1]).toEqual(base.cues['voice.mochi.hit']![1]);
 });
 it('resolves explicit hero cues before generic element bindings and does not double scheduled impact offsets',()=>{
  const base=read('manifest.json'),delivery=read('v5/manifest.json');
  for(const row of Object.values(delivery) as Array<{opus:string;gainDb:number}>)if(row.opus==='/audio/v5/hero-mochi-basic.opus')row.gainDb=-3;
  const next=applyV5Audio(base,delivery),cue=resolveDesign('skill.mochi.1.impact',next,'holy')!;
  expect(cue.layers).toHaveLength(1);expect(cue.layers[0]!.offsetMs).toBe(0);
  expect(cue.layers[0]!.gainDb).toBe(-3);expect(cue.layers[0]!.variants[0]!.start).toBe(0);
  expect(resolveDesign('ult.mochi.impact',next,'holy')!.layers[0]!.variants[0]!.pack).toContain('hero-mochi-ultimate');
  expect(next.packSubstitutions!['v4-receipt']).toEqual(['v5:ui-receipt-confirmed']);
 });
 it('retains original packs for missing variants and ignores malformed or external entries',()=>{
  const base=read('manifest.json'),all=read('v5/manifest.json');
  const next=applyV5Audio(base,{'ranged.ember.impact/0-0':all['ranged.ember.impact/0-0'],bad:{...all['hero.mochi.basic'],opus:'https://untrusted.invalid/a.opus'}});
  expect(next.packSubstitutions!['v4-ranged-ember']).toContain('v4-ranged-ember');
  expect(next.packSubstitutions!['v4-ranged-ember']).toContain('v5:legacy/ranged-ember-impact-0-0');
  expect(next.deliveredDesigns!.bad).toBeUndefined();expect(applyV5Audio(base,{invalid:true})).toBe(base);
 });
 it.each(['missing','offline'])('keeps original audio when optional manifest is %s',async mode=>{
  const base=read('manifest.json');vi.stubGlobal('fetch',vi.fn(async()=>{if(mode==='offline')throw Error('offline');return {ok:false};}));
  expect(await loadV5AudioManifest(base,path=>path)).toBe(base);
 });
});
