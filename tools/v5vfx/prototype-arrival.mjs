/** Browser-only boss motion experiment, before choosing runtime changes. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve('work/v5/CXV/films/V-C-arrival-prototype');await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),method:'Study-only transform after normal render; no runtime delivery.',samples:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:'http://127.0.0.1:6310',fixedClock:false});report.url=page.url();
 await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene;m.plan=null;for(const e of s.actors.values()){e.entered=-100;e.entranceDone=true;e.hurtAt=-100;}});
 for(const [i,age]of [.08,.3,.48,.9].entries()){
  const sample=await page.evaluate(age=>{
   const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),frame:null,fixedTime:20+age,paused:true,galleryPreview:true},0);
   const [id,e]=[...s.actors].find(([,e])=>e.asset==='yarn-giant'),root=e.actor.root,k=s.height/720,px=s.worldWidth/s.width;
   const p=Math.min(1,Math.max(0,age/.36)),flight=1-p*p,land=Math.sin(Math.PI*Math.max(0,Math.min(1,(age-.36)/.42)));
   const before=s.socket(id,'feet'),dx=64*k*flight,dy=-58*k*flight;
   root.scale.x*=1+land*.035;root.scale.y*=1-land*.055;root.updateMatrixWorld(true);
   const scaled=s.socket(id,'feet');root.position.x+=(before.x-scaled.x+dx)*px;root.position.y-=(before.y-scaled.y+dy)*px;root.updateMatrixWorld(true);
   s.renderer.render(s.scene,s.camera);
   let c=document.querySelector('[data-arrival-prototype]');if(!c){c=document.createElement('canvas');c.dataset.arrivalPrototype='true';document.body.append(c);}
   c.width=1280;c.height=720;Object.assign(c.style,{position:'fixed',left:'0',top:'0',width:'1280px',height:'720px',pointerEvents:'none',zIndex:'100'});
   const q=c.getContext('2d');q.clearRect(0,0,1280,720);const fade=Math.min(1,age/.12)*Math.min(1,Math.max(0,(1.2-age)/.25));
   q.globalAlpha=fade;q.fillStyle='#33252ce8';q.fillRect(724,72,244,50);q.strokeStyle='#e7bd77';q.strokeRect(724,72,244,50);q.fillStyle='#fff0cf';q.textAlign='center';q.font='600 21px Georgia';q.fillText('Yarn Giant',846,104);
   if(age>=.36&&age<.72){const z=(age-.36)/.36;q.globalAlpha=.32*(1-z);q.strokeStyle='#e8c394';q.lineWidth=4*(1-z)+1;q.beginPath();q.ellipse(before.x,before.y,80+80*z,12+12*z,0,0,Math.PI*2);q.stroke();}
   return {age,dx,dy,land,feet:s.socket(id,'feet')};
  },age);report.samples.push(sample);await page.screenshot({path:resolve(out,`frame-${i}.png`)});
 }
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',resolve(out,'frame-%d.png'),'-vf','scale=512:288,tile=2x2','-frames:v','1','-q:v','4',resolve(out,'arrival.jpg')]);report.errors=errors;
}finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'experiment.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({out,errors:report.errors}));
