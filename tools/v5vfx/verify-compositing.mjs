/** Browser-compositor pixel gate, on the exact live game route. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve('work/v5/CXV/films/V5-compositing');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:'http://127.0.0.1:6310',fixedClock:false});report.url=page.url();
 report.css=await page.evaluate(async()=>{
  const {SkillBlendLayers}=await import('/src/game/cardrpg/vfx-layered/skill-blend-layers.ts');const modes=['normal','add','screen'];
  return modes.map((mode,i)=>{
   const host=document.createElement('div');Object.assign(host.style,{position:'fixed',left:i*120+'px',top:'0',width:'100px',height:'100px',background:'rgb(80,64,48)',isolation:'isolate',zIndex:'999999'});document.body.appendChild(host);
   let c,canvas;if(mode==='normal'){canvas=document.createElement('canvas');canvas.width=canvas.height=100;host.append(canvas);c=canvas.getContext('2d');}
   else{const layer=new SkillBlendLayers(host);layer.begin(100,100,1);c=layer.context(mode);canvas=c.canvas;}
   c.fillStyle='#000';c.fillRect(0,0,100,100);c.fillStyle='rgb(40,80,120)';c.fillRect(0,0,50,50);
   return {mode,computed:getComputedStyle(canvas).mixBlendMode};
  });
 });
 const path=resolve(out,'pixels.png');await page.screenshot({path,clip:{x:0,y:0,width:340,height:100}});
 const pixels=execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',path,'-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
 const pixel=(x,y)=>Array.from(pixels.subarray((y*340+x)*3,(y*340+x)*3+3));
 report.pixels=Object.fromEntries(['normal','add','screen'].map((mode,i)=>[mode,{black:pixel(i*120+75,75),color:pixel(i*120+25,25)}]));
 const expected={normal:{black:[0,0,0],color:[40,80,120]},add:{black:[80,64,48],color:[120,144,168]},screen:{black:[80,64,48],color:[107,124,145]}};
 report.pass=Object.entries(expected).every(([mode,points])=>Object.entries(points).every(([point,rgb])=>rgb.every((v,i)=>Math.abs(report.pixels[mode][point][i]-v)<=1)))&&errors.length===0;
 report.errors=errors;await writeFile(resolve(out,'pixels.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
