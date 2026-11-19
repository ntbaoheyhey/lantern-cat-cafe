import {expect} from '@playwright/test';
import {test} from './support/depth-fixture';
import type {SpineScene} from '../src/game/cardrpg/spine/scene';

for(const id of ['mochi-1','mochi-4','enemy:yarn-giant']){
 test(`C2 painted ${id}: live contact, protected faces and legacy calm flash`,async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
  await page.waitForFunction(()=>!!window.__depthReview);
  await page.evaluate(id=>{
   const m=window.__depthReview!;m.state.tutorial=4;m.inspect(id);
   // inspect prepares the same fixed action clock as live combat. Do not
   // overwrite it with an unconfigured legacy plan from pilotFixture.
   m.animationAt=0;m.paused=true;m.notify(false);
  },id);
  await page.waitForFunction(()=>window.__depthReview!.sceneReady);
  await page.evaluate(async()=>await (window.__depthScene as SpineScene).effects.ready);
  const audit=await page.evaluate(()=>{
   const m=window.__depthReview!,s=window.__depthScene as SpineScene,contact=m.plan!.beats[2]!.start;
   const pixels=(canvas:HTMLCanvasElement)=>canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data.filter((_,i)=>i%4===3).some(a=>a>0);
   const sample=(at:number,reduced=false)=>{m.animationAt=at;s.render({...s.view(),frame:m.frame,reducedMotion:reduced,fixedTime:3+at/1000},0);};
   sample(contact-1);const numberCanvas=document.querySelector<HTMLCanvasElement>('canvas[data-puppet-numbers]')!;
   const earlyNumbers=pixels(numberCanvas),earlyImpact=m.impactVisible;
   // Production now selects the V5/crafted/V9 pipeline. Verify actual painted
   // effects instead of expecting the superseded layered renderer to run too.
   sample(contact+35);const numbers=pixels(numberCanvas),craftedFaces:number[]=[];
   s.scene.traverseVisible(node=>{
    const material=(node as import('three').Mesh).material;
    for(const entry of Array.isArray(material)?material:[material]){
     const u=(entry as import('three').ShaderMaterial|undefined)?.uniforms;
     if(u?.uAlpha&&u.uAlpha.value>0&&u.uFaceCount)craftedFaces.push(u.uFaceCount.value);
    }
   });
   const draws=s.effects.stats.draws+craftedFaces.length,impact=m.impactVisible;
   const canvas=s.effects.canvas,ctx=canvas.getContext('2d')!,ratio=canvas.width/canvas.clientWidth;
   const faces=s.view().actors.filter(a=>a.hp>0).map(a=>s.socket(a.id,'head')!).filter(Boolean);
   const faceAlpha=faces.map(p=>ctx.getImageData(Math.round(p.x*ratio),Math.round(p.y*ratio),1,1).data[3]);
   // The legacy painter remains available for archived skills. Exercise its
   // real loaded atlas directly, without changing production renderer selection.
   const legacyFlash=(reducedMotion:boolean)=>{
    m.animationAt=contact+16;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    s.effects.layered.render(ctx,{...s.view(),frame:m.frame,reducedMotion},canvas.clientWidth,canvas.clientHeight);
    return s.effects.layered.stats.draws;
   };
   s.effects.layered.onlyLayers=new Set(['screen-flash']);
   const flash=legacyFlash(false),calmFlash=legacyFlash(true);
   s.effects.layered.onlyLayers=null;
   // Commissioned media authors ult_release as its contact cue; native rigs
   // author hit. Both must cross the same rules impact boundary.
   const caster=s.actors.get(m.plan!.actorId)!,contactCue=caster.actor.designerIdle&&m.plan!.ultimate?'ult_release':'hit';
   // Drawn poses own the fixed rules clock; their hidden native rig's cue
   // cursor does not drive contact. Check the visible impact boundary for all
   // renderers, and the authored cue too when that rig owns the animation.
   const drawnContact=caster.craftPose?.owns(m.plan!.ultimate?'ult':'attack')??false;
   return {earlyNumbers,numbers,earlyImpact,impact,draws,flash,calmFlash,faceAlpha,craftedFaces,drawnContact,failed:s.effects.layered.stats.failed,events:s.eventAudit.filter(e=>e.name===contactCue).map(e=>e.elapsed),contact};
  });
  expect(audit.failed).toEqual([]);expect(audit.earlyNumbers).toBe(false);expect(audit.numbers).toBe(true);
  expect(audit.earlyImpact).toBe(false);expect(audit.impact).toBe(true);
  expect(audit.draws,JSON.stringify(audit)).toBeGreaterThan(0);expect(audit.faceAlpha.length).toBeGreaterThanOrEqual(4);expect(audit.faceAlpha.every(a=>a===0)).toBe(true);
  expect(audit.craftedFaces.every(count=>count>=audit.faceAlpha.length)).toBe(true);
  expect(audit.flash).toBeGreaterThan(0);expect(audit.calmFlash).toBe(0);
  if(!audit.drawnContact)expect(audit.events.some(at=>at>=audit.contact&&at<=audit.contact+35),JSON.stringify(audit)).toBe(true);
  expect(errors).toEqual([]);
 });
}
