import {chromium} from '../../scripts/v3feel/browser-fixture.mjs';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url),sharp=require('../../node_modules/sharp');
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'reports/v3-feel/REVIEW/QR-P3');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const rows=[];
 for(const [width,height] of [[1280,720],[1440,900],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto('http://127.0.0.1:5990/@fs'+root+'/tools/v3feel-pilot/index.html');await page.waitForFunction(()=>window.__pilot?.ready);
  const data=await page.evaluate(()=>{
   const p=window.__pilot,state=p.draw(4750),c=p.canvas.getContext('2d');c.font='600 25px Georgia';
   const canvas=p.canvas.getBoundingClientRect(),textWidth=c.measureText(p.recipe.name).width;
   return {banner:{x:305,y:280,width:326,height:58,textWidth,innerWidth:286},canvas:{x:canvas.x,y:canvas.y,width:canvas.width,height:canvas.height},overflow:document.documentElement.scrollWidth>innerWidth,state};
  });
  const shot=await page.screenshot();await sharp(shot).resize({width:Math.min(width,1280)}).toFile(`${out}/focus-${width}.png`);
  rows.push({width,height,...data});await page.close();
 }
 writeFileSync(out+'/responsive.json',JSON.stringify({at:new Date().toISOString(),rows},null,2)+'\n');
}finally{await browser.close();}
