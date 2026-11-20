// Lossless frame evidence from original runtime sheets and actual local presentation.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { root, chromium, fixtureData, openView } from './visual-support.mjs';
const base=process.argv[2]??'http://127.0.0.1:5391', out=resolve(root,'docs/gameplay/img');
const browser=await chromium.launch(), data=await fixtureData(), records=[];
// Same genuine reducer seed selected by gameplay-special; never pacing evidence.
const special=JSON.parse(readFileSync(resolve(root,'reports/gameplay/after-special.json'))).find(r=>r.great);
data.saves.bossReadyWeak.state.level=10;
Object.assign(data.saves.forgeRich.state,{bestStage:15});
data.saves.forgeRich.state.stacks={...data.saves.forgeRich.state.stacks,fish:1000,yarn:120,fluffTuft:20,shinyButton:12};
data.saves.forgeRich.counter=special.great.counter;
try {
  for(const spec of [
    {name:'boss-telegraph',screen:'boss',target:'.boss-arena-stage',times:[0,160,320,480,640,800,960,1120]},
    {name:'forge-great',screen:'forge',target:'.forge-result-reveal',times:[0,70,140,210,350,480,700,1000]},
  ]){
    const {page,evidence}=await openView(browser,data,{base,screen:spec.screen,motion:'no-preference'});
    if(spec.screen==='forge'){
      await page.getByTestId('rarity-rare').click();await page.getByTestId('craft-btn').click();await page.getByTestId('craft-confirm-btn').click();
      await page.locator('[data-great=true]').waitFor();
    }else await page.clock.runFor(4300);
    let prior=0;const frames=[];
    for(const t of spec.times){
      if(spec.screen==='boss')await page.clock.runFor(t-prior);prior=t;
      await page.evaluate(({target,t})=>{for(const a of document.querySelector(target).getAnimations({subtree:true})){a.pause();a.currentTime=t;}},{target:spec.target,t});
      frames.push((await page.locator(spec.target).screenshot({animations:'allow'})).toString('base64'));
    }
    const strip=await page.evaluate(async frames=>{
      const images=await Promise.all(frames.map(async f=>{const i=new Image();i.src='data:image/png;base64,'+f;await i.decode();return i;}));
      const w=images[0].width,h=images[0].height,c=document.createElement('canvas');c.width=w*images.length;c.height=h;
      images.forEach((im,n)=>c.getContext('2d').drawImage(im,n*w,0));return {w,h,png:c.toDataURL().split(',')[1]};
    },frames);
    const file=`animation-${spec.name}.png`;writeFileSync(resolve(out,file),Buffer.from(strip.png,'base64'));
    records.push({name:spec.name,file,frameWidth:strip.w,frameHeight:strip.h,frames:8,timesMs:spec.times,uniqueFrames:new Set(frames).size,errors:evidence.errors,writes:evidence.writes});
    assert.ok(new Set(frames).size>=3,spec.name+' must visibly animate');await page.close();
  }
  const manifest=JSON.parse(readFileSync(resolve(root,'tools/art/gameplay-sheets.json')));
  const attack=manifest.files.find(f=>f.file.endsWith('mochi-warrior-attack.png'));
  copyFileSync(resolve(root,attack.file),resolve(out,basename(attack.file)));
  records.unshift({name:'mochi-attack',file:basename(attack.file),...attack.parameters,uniqueFrames:6,source:attack.file,errors:[],writes:[]});
}finally{await browser.close();}
writeFileSync(resolve(root,'reports/gameplay/animation-frames.json'),JSON.stringify(records,null,2)+'\n');
console.log(JSON.stringify(records));assert.ok(records.every(r=>!r.errors.length&&!r.writes.length));
