/** A9: observe real fixture plans, without changing rules, targets or clocks. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out='reports/v4-art/REVIEW/A9',attempt=process.argv[2]??'r1';
const validation=JSON.parse(await readFile(`${out}/validation.json`,'utf8'));
if(!validation.pass)throw Error('Full regression must pass before A9 observation');
for(const [path,hash]of Object.entries(validation.runtimeSourceHashes))if(createHash('sha256').update(await readFile(path)).digest('hex')!==hash)throw Error(`Unvalidated source: ${path}`);
const report={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),validatedSourceCommit:validation.sourceCommit,runtimeSourceHashes:validation.runtimeSourceHashes,method:'Live alpha readback at threshold128; separate from encoded-pixel film evidence.',fixtures:[]};
if(process.argv[3]){
 const previous=JSON.parse(await readFile(process.argv[3],'utf8'));
 if(JSON.stringify(previous.runtimeSourceHashes)!==JSON.stringify(report.runtimeSourceHashes))throw Error('Resume source mismatch');
 report.resumedFrom=process.argv[3];report.retainedFailure='r1 selected wave3 for Binding and sampled basic StaffBolt for Soot ultimate; both are probe errors, not runtime gate results.';
 report.fixtures=previous.fixtures.filter(f=>!(f.asset==='soot'&&f.plan.ultimate));
}
await mkdir(`${out}/raw/live-${attempt}`,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height]of [[1280,720],[1440,900]])for(const fixture of config.fixtures){
  const selected=fixture.id==='wave1'?['mochi','soot','clover','panko','teacup-healer','needle-moth']:fixture.id==='wave3'?[]:['binding-thread','yarn-giant'];
  if(!selected.length)continue;
  const found=report.fixtures.filter(f=>f.fixture===fixture.id&&f.viewport.height===height).map(f=>`${f.asset}:${f.plan.ultimate}`);
  if(found.length===selected.length*2)continue;
  const {page,errors}=await openFixture(browser,fixture,{width,height});
  for(let index=found.length;index<selected.length*2;index++){
   const observation=await page.evaluate(async({selected,found})=>{
    const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
    const names={'mochi':'craftShield','soot':'craftBasic','clover':'craftHeal','panko':'craftOven','binding-thread':'craftThread','teacup-healer':'craftTea','needle-moth':'craftNeedle','yarn-giant':'craftYarn'};
    m.paused=false;let entry,asset;
    for(let i=0;i<450;i++){
     if(!m.plan)m.step();entry=s.actors.get(m.plan?.actorId);asset=entry?.asset;
     if(m.plan&&selected.includes(asset)&&!found.includes(`${asset}:${m.plan.ultimate}`))break;
     while(m.plan)m.tick(100);
    }
    if(!m.plan||!selected.includes(asset)||found.includes(`${asset}:${m.plan.ultimate}`))return null;
    m.paused=true;const plan=structuredClone(m.plan),id=plan.actorId,fx=s[asset==='soot'&&plan.ultimate?'craft':names[asset]],W=s.width,H=s.height,rows=[];
    const rt=new T.WebGLRenderTarget(W,H),renderer=s.renderer,pixels=new Uint8Array(W*H*4);
    const times=plan.ultimate?[0,300,450,599,600,800,950,1000,1050,1100,1150,1200,1250,1300,1400,1500,1600,1800,2100,2199,2200]:[0,150,200,250,300,350,400,799,800];
    for(const ms of times){
     m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);s.scene.updateMatrixWorld(true);
     const source=s.socket(id,'vfxOrigin'),faces=[...s.actors.values()].filter(e=>e.actor.root.visible).map(e=>s.faceBounds(e));
     const scene=new T.Scene();for(const root of [fx.ground,fx.rear,fx.front])scene.add(root.clone(true));
     const color=renderer.getClearColor(new T.Color()).clone(),alpha=renderer.getClearAlpha();
     renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(scene,s.camera);
     renderer.readRenderTargetPixels(rt,0,0,W,H,pixels);
     let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>=128)count++;
     const coverage=faces.map(f=>{let n=0,c=0;for(let y=Math.max(0,Math.floor(f.y));y<Math.min(H,Math.ceil(f.y+f.height));y++)for(let x=Math.max(0,Math.floor(f.x));x<Math.min(W,Math.ceil(f.x+f.width));x++){n++;if(pixels[((H-1-y)*W+x)*4+3]>=128)c++;}return n?c/n:0;});
     const occlusion=[];
     if(ms===(plan.ultimate?1100:350)){
      const union=new Uint8Array(W*H);
      for(const unit of [...s.sizeAudit().units].sort((a,b)=>b.drawOrder-a.drawOrder)){
       renderer.clear();renderer.render(s.actors.get(unit.id).actor.root,s.camera);renderer.readRenderTargetPixels(rt,0,0,W,H,pixels);
       let opaque=0,hidden=0;for(let i=0;i<union.length;i++)if(pixels[i*4+3]>=128){opaque++;if(union[i])hidden++;union[i]=1;}
       occlusion.push({id:unit.id,opaque,hidden,fraction:opaque?hidden/opaque:0});
      }
     }
     renderer.setRenderTarget(null);renderer.setClearColor(color,alpha);
     const audit=s.audit();rows.push({ms,areaFraction:count/(W*H),maxFaceCoverage:Math.max(0,...coverage),source,fx:structuredClone(fx.audit),units:audit.units,motion:audit.motion,focus:audit.focus,sequence:audit.sequence,cameraPixels:Math.hypot(s.camera.position.x,s.camera.position.y)*W/s.worldWidth,occlusion});
    }
    const reduced=[];
    if(plan.ultimate)for(const ms of [1050,1100,1133,1166,1200,1233]){m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true,reducedMotion:true},0);reduced.push({ms,cameraPixels:Math.hypot(s.camera.position.x,s.camera.position.y)*W/s.worldWidth});}
    const peak=rows.reduce((a,b)=>b.areaFraction>a.areaFraction?b:a,rows[0]);
    m.animationAt=peak.ms;s.render({...s.view(),fixedTime:20+peak.ms/1000,paused:true},0);rt.dispose();
    return{asset,id,width:W,height:H,plan,rows,reducedMotionLiveOnly:reduced,peakMs:peak.ms,peakAreaFraction:peak.areaFraction};
   },{selected,found});
   if(!observation)break;
   found.push(`${observation.asset}:${observation.plan.ultimate}`);
   if(observation.plan.ultimate)await page.screenshot({path:`${out}/raw/live-${attempt}/${observation.asset}-${height}-peak.png`});
   report.fixtures.push({fixture:fixture.id,viewport:{width,height},errors:[...errors],...observation});
   await writeFile(`${out}/live-probe-${attempt}.json`,JSON.stringify(report,null,2)+'\n');
   console.log(JSON.stringify({fixture:fixture.id,height,asset:observation.asset,ultimate:observation.plan.ultimate,peak:observation.peakAreaFraction,errors}));
  }
  const missing=selected.flatMap(asset=>[false,true].map(u=>`${asset}:${u}`)).filter(k=>!found.includes(k));
  if(missing.length)throw Error(`Missing own actions ${fixture.id}/${height}: ${missing.join(',')}`);
  await page.close();
 }
 report.finished=new Date().toISOString();await writeFile(`${out}/live-probe-${attempt}.json`,JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
