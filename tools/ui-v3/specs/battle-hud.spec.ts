import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const fixtures=JSON.parse(readFileSync(resolve(__dirname,'../../../packages/game-rules/src/cardrpg/depth/skills-v5/fixtures/events-v2.json'),'utf8')).fixtures;
for(const look of ['on','off'])for(const [width,height] of [[1024,600],[1280,720],[1440,900]])test(`battle plates and HUD stay separate ${look} ${width}`,async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width:width!,height:height!});await page.goto(`?ui=v3&look=${look}`);await page.locator('.uv-shell').waitFor();
 for(const id of ['rupture','boss']){
  await page.evaluate(async initial=>{
   // Production rules and registered TRAIN fixtures; no synthetic enemy geometry.
   const R=await import('/packages/game-rules/src/cardrpg/depth/index.ts');
   const m=window.__depthReview!;m.plan=null;m.replay=R.createBattle(initial);m.watching=true;m.sceneStarted=true;m.paused=true;m.notify(false);
  },fixtures.find((f:{id:string})=>f.id===id).initial);
  await page.waitForFunction(()=>window.__depthReview!.sceneReady,{},{timeout:45000});
  for(const beat of ['ready','cast']){
   if(beat==='ready')await expect.poll(()=>page.locator('.dp-world-plate:visible:not([hidden])').count()).toBeGreaterThan(0);
   if(beat==='cast')await page.evaluate(()=>{
    const m=window.__depthReview!;m.paused=false;
    for(let i=0;i<120&&!m.battle!.result;i++){
     m.step();if(m.plan?.ultimate){m.animationAt=200;m.paused=true;m.notify(false);return}
     while(m.plan)m.finishMoment();
    }throw new Error('Fixture did not reach a natural ultimate');
   });
   await page.waitForTimeout(250);
   const geometry=await page.evaluate(()=>{
    const rects=(s:string)=>Array.from(document.querySelectorAll<HTMLElement>(s)).filter(e=>e.getClientRects().length&&!e.hidden&&getComputedStyle(e).visibility!=='hidden').map(e=>({name:e.dataset.actor??e.className,...Object.fromEntries(['x','y','width','height'].map(k=>[k,e.getBoundingClientRect()[k as 'x']]))})) as {name:string;x:number;y:number;width:number;height:number}[];
    const plates=rects('.dp-world-plate'),hud=rects('.uv-battle-top,.uv-battle-cat'),fallback=rects('.dp-v5-status-strip');
    const overlap=(a:typeof plates[number],b:typeof plates[number])=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
    return {plates,hud,fallback,collisions:plates.flatMap((a,i)=>[...plates.slice(i+1),...hud,...fallback].filter(b=>overlap(a,b)>0).map(b=>[a.name,b.name])),overflow:document.documentElement.scrollWidth>innerWidth};
   });
   if(beat==='ready')expect(geometry.plates.length).toBeGreaterThan(0);expect(geometry.collisions).toEqual([]);expect(geometry.overflow).toBe(false);
   await expect(page.locator('.dp-party')).toBeHidden();await expect(page.locator('.uv-hud')).toHaveCount(0);
   if(beat==='cast')await expect(page.getByRole('complementary',{name:'Ultimate cast'})).toBeVisible();
   const out=resolve(__dirname,'../../../reports/ui-v3/u5');mkdirSync(out,{recursive:true});
   const png=`/tmp/ui-v3-battle-${look}-${width}-${id}-${beat}.png`;await page.screenshot({path:png});
   execFileSync('/tmp/ui-v3-python/bin/python',['-c','from PIL import Image;import sys;Image.open(sys.argv[1]).save(sys.argv[2],quality=76)',png,`${out}/${look}-${width}-${id}-${beat}.webp`]);unlinkSync(png);
  }
 }
});

test('battle ignores unknown events and supports guide, speed and banners',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('?ui=v3');await page.getByRole('button',{name:'Night Patrol'}).click();await page.getByRole('button',{name:'Fight',exact:true}).click();
 await page.getByRole('button',{name:'Pause auto'}).click();
 await page.evaluate(()=>{const m=window.__depthReview!;m.battle!.v4!.events.push({version:99,kind:'future-event'} as never);m.notify(false)});
 await page.getByRole('button',{name:'Change playback speed'}).click();expect(await page.evaluate(()=>window.__depthReview!.state.settings.speed)).toBe(2);
 await page.getByRole('button',{name:'Read battle guide'}).click();await expect(page.getByRole('dialog',{name:'Battle guide'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Battle guide'})).toHaveCount(0);
 await page.getByRole('button',{name:'More battle options'}).click();await page.getByRole('button',{name:'Turn banners off'}).click();
 expect(await page.evaluate(()=>localStorage.getItem('lantern-ui-v3-banners'))).toBe('off');expect(errors).toEqual([]);
});
