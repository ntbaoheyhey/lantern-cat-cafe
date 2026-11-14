import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()}: ${r.url()}`);});
 await page.goto('http://127.0.0.1:5995/docs/ui-kit/',{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 const metrics=await page.evaluate(()=>({
  images:[...document.images].map(img=>({id:img.alt,loaded:img.complete&&img.naturalWidth>0,width:img.naturalWidth,height:img.naturalHeight})),
  fontLoaded:document.fonts.check('800 16px Baloo'),
  horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
 }));
 await page.screenshot({path:'reports/v3-shell/b2/shots/ui-kit-browser.png'});
 const result={...metrics,errors};
 writeFileSync('reports/v3-shell/b2/UI-KIT-BROWSER.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({images:metrics.images.length,failed:metrics.images.filter(i=>!i.loaded).length,errors,fontLoaded:metrics.fontLoaded,horizontalOverflow:metrics.horizontalOverflow}));
 if(errors.length||metrics.images.some(i=>!i.loaded)||!metrics.fontLoaded||metrics.horizontalOverflow)process.exitCode=1;
} finally {await browser.close();}
