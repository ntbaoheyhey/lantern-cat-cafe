import {afterEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {applyV5Audio,loadV5AudioManifest} from './v5-manifest-loader';
import {resolveDesign,type AudioManifest,type Sample} from './cues';
const read=(path:string)=>JSON.parse(readFileSync(resolve(import.meta.dirname,'../../public/audio',path),'utf8'));
afterEach(()=>vi.unstubAllGlobals());
describe('V5 audio delivery',()=>{
 it('loads the delivered V9 battle and boss music as full loops',()=>{
  const next=applyV5Audio(read('manifest.json'),read('v5/manifest.json'));
  for(const scene of ['battle','boss']){
   const cue=resolveDesign(`music.${scene}`,next)!;
   const sample=cue.layers[0]!.variants[0]!;
   expect(sample).toMatchObject({pack:`v9:${scene}-v9`,start:0,duration:60,bus:'music',loop:true});
   expect(next.packs[sample.pack]).toMatchObject({opus:`/audio/v9/${scene}-v9.opus`,m4a:`/audio/v9/${scene}-v9.m4a`});
  }
 });
 it('rejects traversal and undelivered versions for music paths',()=>{
  const base=read('manifest.json'),music=read('v5/manifest.json')['music.battle'];
  for(const opus of ['/audio/v9/../battle.opus','/audio/v8/battle.opus']){
   expect(applyV5Audio(base,{'music.battle':{...music,opus}})).toBe(base);
  }
 });
 it('replaces every delivered B2 layer without changing its cue timing, mixing or variant identity',()=>{
  const base=read('manifest.json') as AudioManifest,next=applyV5Audio(base,read('v5/manifest.json'));
  const seen=new Set<string>();
  const check=(before:Sample,after:Sample)=>{
   if(!/^b2-(hits|ui|motion|magic)$/.test(before.pack))return;
   seen.add(before.variantId!);
   expect(after).toEqual({...before,pack:expect.stringMatching(/^v5:b2\//),start:0,gainDb:0});
  };
  for(const [id,design] of Object.entries(base.designs??{})){
   const delivered=next.designs![id]!;
   for(const [i,layer] of design.layers.entries()){
    expect({...delivered.layers[i],variants:[]}).toEqual({...layer,variants:[]});
    layer.variants.forEach((sample,j)=>check(sample,delivered.layers[i]!.variants[j]!));
   }
   design.baked?.forEach((take,i)=>check(take.sample,delivered.baked![i]!.sample));
  }
  for(const [id,samples] of Object.entries(base.cues))samples.forEach((sample,i)=>check(sample,next.cues[id]![i]!));
  expect(seen.size).toBe(264);
  for(const pack of ['b2-hits','b2-ui','b2-motion','b2-magic']){
   expect(next.packSubstitutions![pack]!.length).toBeGreaterThan(0);expect(next.packSubstitutions![pack]).not.toContain(pack);
  }
  expect(next.deliveredPacks?.some(pack=>pack.startsWith('v5:b2/'))).toBe(false);
 });
 it('retains the original B2 pack when one exact variant is absent',()=>{
  const base=read('manifest.json') as AudioManifest,delivery=read('v5/manifest.json');
  const missing=Object.values(delivery).flat().find((row:any)=>row.opus?.includes('/b2/b2-hits-')) as {variantId:string};
  for(const [key,value] of Object.entries(delivery)){
   const keep=(Array.isArray(value)?value:[value]).filter((row:any)=>row.variantId!==missing.variantId);
   if(keep.length)delivery[key]=keep;else delete delivery[key];
  }
  const next=applyV5Audio(base,delivery);
  expect(next.packSubstitutions!['b2-hits']).toContain('b2-hits');
  expect(next.packSubstitutions!['b2-ui']).not.toContain('b2-ui');
 });
 it('retains B2 source offsets when delivery context does not match, and preserves sample gain on an exact match',()=>{
  const base=read('manifest.json') as AudioManifest;
  const sample=Object.values(base.designs!).flatMap(d=>d.layers.flatMap(l=>l.variants)).find(s=>s.pack==='b2-hits')!;
  const exact={opus:'/audio/v5/b2/context.opus',m4a:'/audio/v5/b2/context.m4a',durationSeconds:sample.duration,
   gainDb:0,bus:sample.bus,variantId:sample.variantId,sourcePack:sample.pack,start:sample.start,duration:sample.duration};
  const fixture={...base,designs:{},cues:{check:[{...sample,gainDb:-3}]}};
  for(const wrong of [{sourcePack:'b2-ui'},{start:sample.start+1},{duration:sample.duration+.1},{bus:'voice'}]){
   expect(applyV5Audio(fixture,{slice:{...exact,...wrong}}).cues.check).toEqual(fixture.cues.check);
  }
  expect(applyV5Audio(fixture,{slice:exact}).cues.check![0]).toMatchObject({start:0,gainDb:-3,pack:'v5:b2/context'});
 });
 it('uses full-bed transcodes with unchanged loop cues and original-format fallback',()=>{
  const base=read('manifest.json') as AudioManifest,next=applyV5Audio(base,read('v5/manifest.json'));
  for(const pack of ['menu-home','score-battle','scene-night']){
   expect(next.packs[pack]!.opus).toBe(`/audio/v5/legacy/${pack}.opus`);
   expect(next.packs[pack]!.webm).toBe(base.packs[pack]!.webm);
   for(const [id,samples]of Object.entries(base.cues))if(samples.some(s=>s.pack===pack))expect(next.cues[id]).toEqual(samples);
  }
 });
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
  for(const hero of ['panko'])for(const phase of ['hit','death']){
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
  const base=read('manifest.json') as AudioManifest,rows=read('v5/manifest.json')['voice.panko.hit'];
  const next=applyV5Audio(base,{'voice.panko.hit':[rows[0]]});
  expect(next.cues['voice.panko.hit']![0]!.pack).toMatch(/^v5:voice\//);
  expect(next.cues['voice.panko.hit']![1]).toEqual(base.cues['voice.panko.hit']![1]);
 });
 it('resolves explicit hero cues before generic element bindings and does not double scheduled impact offsets',()=>{
  const base=read('manifest.json'),delivery=read('v5/manifest.json');
  for(const row of Object.values(delivery) as Array<{opus:string;gainDb:number}>)if(row.opus==='/audio/v5/hero-mochi-basic.opus')row.gainDb=-3;
  const next=applyV5Audio(base,delivery),cue=resolveDesign('skill.mochi.1.impact',next,'holy')!;
  expect(cue.layers).toHaveLength(1);expect(cue.layers[0]!.offsetMs).toBe(0);
  expect(cue.layers[0]!.gainDb).toBe(-3);expect(cue.layers[0]!.variants[0]!.start).toBe(0);
  expect(resolveDesign('ult.mochi.impact',next,'holy')!.layers[0]!.variants[0]!.pack).toContain('hero-mochi-ultimate');
  expect(next.packSubstitutions!['v4-receipt']).toEqual(['v5:chain-tx-confirmed']);
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
