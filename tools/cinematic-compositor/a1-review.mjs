import {createRequire} from 'node:module';import {mkdir,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';import sharp from 'sharp';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const out=resolve(root,'reports/v3-battle/A1');await mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});const report={errors:[],waves:[]};page.on('pageerror',e=>report.errors.push(e.message));
try{await page.goto('http://127.0.0.1:5990/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
 for(const [name,enemies] of [['wave1',['button-guard','sock-skipper','teacup-healer','needle-moth']],['wave3',['kettle-knight','spool-ram','pollen-scout','crumb-sentinel']],['boss',['yarn-giant','binding-thread','binding-thread']]]){
 await page.evaluate(async enemies=>{const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');m.state.tutorial=4;m.galleryBattle=R.createBattle({seed:71,chapter:3,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true,cats:R.battleCats(m.state),enemies});m.galleryBattle.v4.committed=true;m.galleryAction=null;m.watching=true;m.paused=true;m.sceneStarted=true;m.screen='map';m.plan=null;m.notify(false);},enemies);
 await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
 await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:10,paused:true,frame:null},0);});await page.waitForTimeout(150);
 const audit=await page.evaluate(()=>window.__depthScene.audit());const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y))/Math.min(a.width*a.height,b.width*b.height);
 const units=audit.units;const maxOverlap=Math.max(0,...units.flatMap((u,i)=>units.slice(i+1).map(v=>overlap(u.box,v.box))));const clipped=units.filter(u=>u.box.x<-.5||u.box.y<-.5||u.box.x+u.box.width>1280.5||u.box.y+u.box.height>492.5).map(u=>u.asset);
 const occlusion=await page.evaluate(async()=>{
 const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
 const s=window.__depthScene,entries=[...s.actors.values()].filter(e=>e.actor.root.visible),gl=s.renderer.getContext(),w=s.renderer.domElement.width,h=s.renderer.domElement.height;
 const renderTarget=new T.WebGLRenderTarget(w,h);s.renderer.setRenderTarget(renderTarget);
 const stage=s.stage.root.visible,background=s.scene.background;s.stage.root.visible=false;s.scene.background=null;s.renderer.setClearColor(0,0);
 for(const e of entries){e.actor.root.visible=false;e.shadow.visible=false;e.ring.visible=false;}
 const masks=entries.map(e=>{e.actor.root.visible=true;s.renderer.render(s.scene,s.camera);const pixels=new Uint8Array(w*h*4);s.renderer.readRenderTargetPixels(renderTarget,0,0,w,h,pixels);e.actor.root.visible=false;const mask=new Uint8Array(w*h);for(let i=0;i<mask.length;i++)mask[i]=pixels[i*4+3]>=100?1:0;return{asset:e.asset,mask,order:e.actor.root.children[0]?.renderOrder??0};});
 s.renderer.setRenderTarget(null);renderTarget.dispose();s.stage.root.visible=stage;s.scene.background=background;s.renderer.setClearColor('#bd9470',1);for(const e of entries)e.actor.root.visible=true;s.render({...s.view(),fixedTime:10,paused:true,frame:null},0);
 return masks.map(m=>{let total=0,hidden=0;const ahead=masks.filter(n=>n!==m&&n.order>m.order);for(let i=0;i<m.mask.length;i++)if(m.mask[i]){total++;if(ahead.some(n=>n.mask[i]))hidden++;}return{asset:m.asset,total,hidden,share:total?hidden/total:0};});
 });
 await page.screenshot({path:resolve(out,'after-'+name+'.png')});report.waves.push({name,renderer:audit.renderer,maxOverlap,clipped,occlusion,labels:audit.labels,units:units.map(u=>({asset:u.asset,box:u.box}))});
 }
 await sharp({create:{width:1280,height:360,channels:3,background:'#000'}}).composite([{input:await sharp(resolve(out,'before-wave1.png')).resize(640,360).toBuffer(),left:0,top:0},{input:await sharp(resolve(out,'after-wave1.png')).resize(640,360).toBuffer(),left:640,top:0}]).png().toFile(resolve(out,'before-after.png'));
 if(report.errors.length||report.waves.some(w=>w.clipped.length||w.occlusion.some(o=>o.share>.4)))throw Error('A1 visibility gate failed');
 console.log(JSON.stringify({errors:report.errors,waves:report.waves.map(({name,maxOverlap,clipped,occlusion})=>({name,maxOverlap,clipped,occlusion}))}));
}finally{await writeFile(resolve(out,'formation-review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
