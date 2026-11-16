import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
const b=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{for(const fixture of config.fixtures){const {page}=await openFixture(b,fixture,{width:1440,height:900});console.log(fixture.id,JSON.stringify(await page.evaluate(async()=>{
 const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');m.paused=false;
 for(let i=0;i<150;i++){if(!m.plan)m.step();if(m.plan?.actorId==='mochi'&&!m.plan.ultimate)break;while(m.plan)m.tick(100);}m.paused=true;m.animationAt=300;s.render({...s.view(),fixedTime:21,paused:true},0);
 const W=s.width,H=s.height,rt=new T.WebGLRenderTarget(W,H),units=s.sizeAudit().units,masks=[];
 for(const u of units){const a=new Uint8Array(W*H*4);s.renderer.setRenderTarget(rt);s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(s.actors.get(u.id).actor.root,s.camera);s.renderer.readRenderTargetPixels(rt,0,0,W,H,a);masks.push({u,a});}
 const self=masks.find(r=>r.u.id==='mochi');let n=0;for(let i=3;i<self.a.length;i+=4)if(self.a[i]>=128)n++;
 return {role:s.motionAudit.find(u=>u.id==='mochi'),targets:m.plan.targetIds,self:self.u.box,pairs:masks.filter(r=>r!==self).map(r=>{let hit=0;for(let i=3;i<r.a.length;i+=4)if(r.a[i]>=128&&self.a[i]>=128)hit++;return{id:r.u.id,box:r.u.box,order:r.u.drawOrder,fraction:hit/n};}).filter(r=>r.fraction>.005)};
})));await page.close();}}finally{await b.close();}
