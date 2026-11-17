/** Study-only geometry preview. Changes the isolated browser scene, never runtime files. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_PROTOTYPE_OUT??'work/v5/CXV/films/V-B-prototype');await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),method:'Study-only transforms after normal render: revised rear footprint and post-contact alpha. No runtime patch. Not delivery evidence.',rows:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:'http://127.0.0.1:6310',fixedClock:false});report.url=page.url();
 for(const owner of (process.env.CXV_PROTOTYPE_OWNERS??'mochi,clover,panko').split(',')){
  await page.evaluate(async owner=>{
   const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),{configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
   const f=pilotFixture(owner+'-4'),m=window.__depthReview,s=window.__depthScene;
   m.galleryBattle=f.battle;m.plan=configureSequence(f.plan);m.galleryId=owner+'-4';m.animationAt=0;m.paused=true;m.labOpen=false;m.sceneStarted=true;
   m.notify(false);cancelAnimationFrame(s.raf);s.ensureActors(s.view());
  },owner);
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
  for(const [index,ms]of [1280,1550].entries())for(const prototype of [false,true]){
   const audit=await page.evaluate(({owner,ms,prototype})=>{
    const s=window.__depthScene,m=window.__depthReview;m.animationAt=ms;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
    const k=s.height/720,smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
    const feet=s.view().actors.filter(a=>a.side==='party').map(a=>s.socket(a.id,'feet')).filter(Boolean);
    let meshes=[];
    if(owner==='mochi'||owner==='clover'){
     const mesh=owner==='mochi'?s.craftShield.crest:s.craftHeal.canopy;meshes=[mesh];
     if(prototype){
      const w=(owner==='mochi'?700:760)*k,h=(owner==='mochi'?430:480)*k;
      const cx=Math.max(w/2+12*k,Math.min(s.width-w/2-12*k,feet.reduce((n,p)=>n+p.x,0)/feet.length));
      const bottom=Math.min(s.height*.91,Math.max(...feet.map(p=>p.y))+65*k);
      mesh.position.set(cx,bottom-h/2,0);mesh.scale.set(w,-h,1);
      const decay=smooth((ms-1200)/560);mesh.material.uniforms.uAlpha.value=1-decay;mesh.material.uniforms.uErode.value=-.2+decay*.95;
     }
    }else if(owner==='soot'){
     meshes=[...s.craft.bodies,...s.craft.edges];
     if(prototype)for(let n=0;n<s.craft.bodies.length;n++){
      const b=s.craft.bodies[n].geometry.attributes.position,e=s.craft.edges[n].geometry.attributes.position;
      for(let i=0;i<b.count;i+=2){
       const x=(b.getX(i)+b.getX(i+1))/2,y=(b.getY(i)+b.getY(i+1))/2;
       const ex=(e.getX(i)+e.getX(i+1))/2,ey=(e.getY(i)+e.getY(i+1))/2;
       for(const j of [i,i+1]){b.setXY(j,x+(b.getX(j)-x)*.67,y+(b.getY(j)-y)*.67);e.setXY(j,e.getX(j)+(x-ex)*.33,e.getY(j)+(y-ey)*.33);}
      }
      b.needsUpdate=e.needsUpdate=true;
      for(const mesh of [s.craft.bodies[n],s.craft.edges[n]])mesh.material.uniforms.uAlpha.value*=1-smooth((ms-1230)/400);
     }
    }else{
     meshes=s.craftOven.doors;const foot=s.socket(m.plan.actorId,'feet'),w=540*k,h=400*k,cx=Math.max(w/2+16*k,Math.min(s.width-w/2-16*k,foot.x)),bottom=Math.min(s.height*.93,foot.y+24*k);
     if(prototype)meshes.forEach((mesh,i)=>{const ranges=[[0,.3],[.3,.7],[.7,1]],[a,b]=ranges[i],decay=smooth((ms-1200)/560);mesh.position.set(cx+((a+b)/2-.5)*w,bottom-h/2,0);mesh.scale.set((b-a)*w,-h,1);mesh.material.uniforms.uAlpha.value=1-decay;mesh.material.uniforms.uErode.value=-.2+decay*.95;});
    }
    s.renderer.render(s.scene,s.camera);
    return meshes.map(mesh=>({position:mesh.position.toArray(),scale:mesh.scale.toArray(),alpha:mesh.material.uniforms.uAlpha.value}));
   },{owner,ms,prototype});
   const file=resolve(out,`${owner}-${index}-${prototype?'after':'before'}.png`);await page.screenshot({path:file});report.rows.push({owner,ms,prototype,audit,file});
  }
  const files=[`${owner}-0-before`,`${owner}-0-after`,`${owner}-1-before`,`${owner}-1-after`].flatMap(n=>['-i',resolve(out,n+'.png')]);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...files,'-filter_complex','[0:v]scale=512:-1[a];[1:v]scale=512:-1[b];[2:v]scale=512:-1[c];[3:v]scale=512:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','4',resolve(out,owner+'.jpg')]);
 }
 report.errors=errors;
}finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'prototype.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({out,errors:report.errors,rows:report.rows.length}));
