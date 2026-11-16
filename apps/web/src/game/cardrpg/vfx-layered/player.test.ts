import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import type {EffectPlan} from '../../squad/turn3d/effects';
import {LayeredVfx,PAINT_TIMELINES} from './player';
import sampledPages from './sampled-atlases.json';

let images:TestImage[];
class TestImage {
 src='';resolve!:()=>void;reject!:(error:Error)=>void;
 get naturalWidth(){return sampledPages.find(p=>p.url===this.src)?.width??1024;}
 get naturalHeight(){return sampledPages.find(p=>p.url===this.src)?.height??2560;}
 private decoded=new Promise<void>((yes,no)=>{this.resolve=yes;this.reject=no;});
 constructor(){images.push(this);}
 decode(){return this.decoded;}
}
beforeEach(()=>{images=[];vi.stubGlobal('Image',TestImage);});
afterEach(()=>vi.unstubAllGlobals());
const plan={skillId:'enemy:needle-moth:basic'} as EffectPlan;

it('requests no atlas at construction and selects enemies by timeline owner',async()=>{
 const fx=new LayeredVfx(()=>undefined);await fx.ready;expect(images).toHaveLength(0);
 const ready=fx.prepare(['needle-moth','needle-moth']);
 expect(images).toHaveLength(1);expect(images[0]!.src).toContain('needle-moth-0.webp');
 expect(fx.handles(plan)).toBe(false);images[0]!.resolve();await ready;
 expect(fx.handles(plan)).toBe(true);
 expect([...fx.images.keys()].every(id=>PAINT_TIMELINES.get(id)?.owner==='needle-moth')).toBe(true);fx.dispose();
});

it('shares overlapping decode requests and waits for every page in the new roster',async()=>{
 const fx=new LayeredVfx(()=>undefined),first=fx.prepare(['needle-moth']);
 let complete=false;const next=fx.prepare(['mochi','needle-moth']).then(()=>{complete=true;});
 expect(images).toHaveLength(2);images[1]!.resolve();await Promise.resolve();expect(complete).toBe(false);
 images[0]!.resolve();await Promise.all([first,next]);expect(complete).toBe(true);
 await fx.prepare(['needle-moth']);expect(images).toHaveLength(2);fx.dispose();
});

it('keeps the established procedural fallback available when an atlas fails',async()=>{
 const fx=new LayeredVfx(()=>undefined),ready=fx.prepare(['needle-moth']);
 images[0]!.reject(new Error('network unavailable'));await ready;
 expect(fx.handles(plan)).toBe(false);expect(fx.stats.failed).toContain(plan.skillId);fx.dispose();
});

it('does not publish an image that decodes after disposal',async()=>{
 const fx=new LayeredVfx(()=>undefined),ready=fx.prepare(['needle-moth']);fx.dispose();
 expect(images[0]!.src).toBe('');images[0]!.resolve();await ready;
 expect(fx.images.size).toBe(0);expect(fx.stats.failed).toEqual([]);
 await fx.prepare(['mochi']);expect(images).toHaveLength(1);
});

it('restores authored source coordinates if a sampled page fails to decode',async()=>{
 const fx=new LayeredVfx(()=>undefined),ready=fx.prepare(['mochi']);
 expect(images[0]!.src).toContain('.avif');images[0]!.reject(new Error('unsupported AVIF'));
 await vi.waitFor(()=>expect(images).toHaveLength(2));
 expect(images[1]!.src).toContain('mochi-0.webp');images[1]!.resolve();await ready;
 expect(fx.images.size).toBeGreaterThan(0);
 for(const paint of fx.images.values()){expect(paint.sourceScaleX).toBe(1);expect(paint.sourceScaleY).toBe(1);}
 expect(fx.stats.failed).toEqual([]);fx.dispose();
});
