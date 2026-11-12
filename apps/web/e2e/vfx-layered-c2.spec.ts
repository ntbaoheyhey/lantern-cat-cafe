import {expect,test} from '@playwright/test';
import type {SpineScene} from '../src/game/cardrpg/spine/scene';
import {pilotFixture} from '../src/game/cardrpg/vfx-layered/fixture';

for(const id of ['mochi-1','mochi-4','enemy:yarn-giant']){
 test(`C2 painted ${id}: real contact, protected faces and calm flash`,async({page})=>{
  const fixture=pilotFixture(id),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
  await page.waitForFunction(()=>!!window.__depthReview);
  await page.evaluate(({fixture,id})=>{
   const m=window.__depthReview!;m.state.tutorial=4;m.inspect(id);
   m.galleryBattle=fixture.battle;m.plan=fixture.plan;m.animationAt=0;m.paused=true;m.notify(false);
  },{fixture,id});
  await page.waitForFunction(()=>window.__depthReview!.sceneReady);
  await page.evaluate(async()=>await (window.__depthScene as SpineScene).effects.ready);
  const audit=await page.evaluate(()=>{
   const m=window.__depthReview!,s=window.__depthScene as SpineScene,contact=m.plan!.beats[2]!.start;
   const pixels=(canvas:HTMLCanvasElement)=>canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data.filter((_,i)=>i%4===3).some(a=>a>0);
   const sample=(at:number,reduced=false)=>{m.animationAt=at;s.render({...s.view(),frame:m.frame,reducedMotion:reduced,fixedTime:3+at/1000},0);};
   sample(contact-1);const numberCanvas=document.querySelector<HTMLCanvasElement>('canvas[data-puppet-numbers]')!;
   const earlyNumbers=pixels(numberCanvas);
   sample(contact+35);const numbers=pixels(numberCanvas),draws=s.effects.layered.stats.draws;
   const canvas=s.effects.canvas,ctx=canvas.getContext('2d')!,ratio=canvas.width/canvas.clientWidth;
   const faces=s.view().actors.filter(a=>a.hp>0).map(a=>s.socket(a.id,'head')!).filter(Boolean);
   const faceAlpha=faces.map(p=>ctx.getImageData(Math.round(p.x*ratio),Math.round(p.y*ratio),1,1).data[3]);
   s.effects.layered.onlyLayers=new Set(['screen-flash']);
   sample(contact+16);const flash=s.effects.layered.stats.draws;
   sample(contact+16,true);const calmFlash=s.effects.layered.stats.draws;
   s.effects.layered.onlyLayers=null;
   return {earlyNumbers,numbers,draws,flash,calmFlash,faceAlpha,failed:s.effects.layered.stats.failed,events:s.eventAudit.filter(e=>e.name==='hit').map(e=>e.elapsed),contact};
  });
  expect(audit.failed).toEqual([]);expect(audit.earlyNumbers).toBe(false);expect(audit.numbers).toBe(true);
  expect(audit.draws).toBeGreaterThan(0);expect(audit.faceAlpha.length).toBeGreaterThanOrEqual(4);expect(audit.faceAlpha.every(a=>a===0)).toBe(true);
  expect(audit.flash).toBeGreaterThan(0);expect(audit.calmFlash).toBe(0);
  expect(audit.events.some(at=>at>=audit.contact&&at<=audit.contact+35)).toBe(true);expect(errors).toEqual([]);
 });
}
