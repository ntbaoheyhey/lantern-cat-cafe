// Eight actual rendered frames per key animation, at explicit presentation times.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, chromium, fixtureData, openView } from './visual-support.mjs';
const base=process.argv[2]??'http://localhost:5381', out=resolve(root,'docs/visual/img');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch(), data=await fixtureData(), manifest=[];
try {
  for (const spec of [
    { name:'mochi', screen:'home', target:'.mochi-portrait', times:[0,2800,3360,3640,5600,6720,21840,22680] },
    { name:'combat', screen:'boss', target:'.boss-arena-stage', times:[0,100,200,300,400,500,600,700] },
    { name:'forge', screen:'forge-reveal', target:'.forge-result-reveal', times:[0,70,140,210,350,480,700,1000] },
  ]) {
    const { page,evidence }=await openView(browser,data,{base,screen:spec.screen,motion:'no-preference'});
    const frames=[]; let prior=0;
    await page.locator(spec.target).waitFor();
    for (let i=0;i<spec.times.length;i++) {
      const t=spec.times[i];
      if(spec.name==='combat')await page.clock.runFor(t-prior); prior=t;
      await page.evaluate(({target,t})=>{
        for(const a of document.querySelector(target).getAnimations({subtree:true})) {a.pause();a.currentTime=t;}
      },{target:spec.target,t});
      const buffer=await page.locator(spec.target).screenshot({animations:'allow'}); frames.push(buffer.toString('base64'));
    }
    // Assemble a lossless strip from our own captures inside the browser canvas.
    const strip=await page.evaluate(async frames=>{
      const imgs=await Promise.all(frames.map(async f=>{const i=new Image();i.src='data:image/png;base64,'+f;await i.decode();return i;}));
      const c=document.createElement('canvas');c.width=imgs[0].width*imgs.length;c.height=imgs[0].height;
      const ctx=c.getContext('2d');imgs.forEach((i,n)=>ctx.drawImage(i,n*i.width,0));
      return {width:imgs[0].width,height:imgs[0].height,png:c.toDataURL().split(',')[1]};
    },frames);
    const file=`animation-${spec.name}.png`;writeFileSync(resolve(out,file),Buffer.from(strip.png,'base64'));
    manifest.push({name:spec.name,file,frameWidth:strip.width,frameHeight:strip.height,timesMs:spec.times,uniqueFrames:new Set(frames).size,errors:evidence.errors,writes:evidence.writes});
    assert.ok(new Set(frames).size>=3,spec.name+' must visibly animate');await page.close();
  }
}finally{await browser.close();}
writeFileSync(resolve(root,'reports/visual/animation-frames.json'),'[\n'+manifest.map(r=>'  '+JSON.stringify(r)).join(',\n')+'\n]\n');
console.log(JSON.stringify(manifest));
