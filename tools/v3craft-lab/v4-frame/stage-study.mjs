import {writeFile} from 'node:fs/promises';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const result=[];
try{
 const {page}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'));
 for(const [name,filter] of [['unchanged','none'],['subdued','saturate(.82) contrast(.86) brightness(.88)'],['warm','saturate(.90) contrast(.90) brightness(.94)']]){
  const metrics=await page.evaluate(async filter=>{
   const s=window.__depthScene,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
   const mesh=s.stage.formation;window.__stageStudyOriginal??=mesh.material.map.image;
   const c=document.createElement('canvas');c.width=2048;c.height=1024;const ctx=c.getContext('2d');ctx.filter=filter;ctx.drawImage(window.__stageStudyOriginal,0,0);
   const data=ctx.getImageData(0,0,c.width,c.height).data;let sum=0,sq=0,n=0;
   for(let y=200;y<950;y+=8)for(let x=100;x<1948;x+=8){const i=(y*c.width+x)*4,l=(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)/255;sum+=l;sq+=l*l;n++;}
   const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;mesh.material.map=tex;s.render({...s.view(),fixedTime:10,paused:true},0);
   return {meanLuma:sum/n,stdLuma:Math.sqrt(sq/n-(sum/n)**2)};
  },filter);
  await page.screenshot({path:'reports/v4-art/REVIEW/A2/raw/stage-'+name+'.png'});
  result.push({name,filter,...metrics});
 }
 await page.close();
}finally{await browser.close();}
await writeFile('tools/v3craft-lab/v4-frame/stage-study.json',JSON.stringify(result,null,2)+'\n');
console.log(result);
