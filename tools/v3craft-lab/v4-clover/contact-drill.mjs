import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
const b=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{for(const fixture of config.fixtures.filter(f=>f.id==="wave1")){const {page}=await openFixture(b,fixture,{width:1440,height:900});console.log(fixture.id,JSON.stringify(await page.evaluate(async()=>{
 const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');m.paused=false;
 for(let i=0;i<=9;i++){m.paused=false;if(!m.plan&&!m.battle.result)m.step();m.tick(i===0?0:1000/30,1000+i*1000/30);m.paused=true;s.render({...s.view(),fixedTime:10+i/30,paused:true},1/30);}

 const W=s.width,H=s.height,rt=new T.WebGLRenderTarget(W,H),units=s.sizeAudit().units,masks=[];
 for(const u of units){const a=new Uint8Array(W*H*4);s.renderer.setRenderTarget(rt);s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(s.actors.get(u.id).actor.root,s.camera);s.renderer.readRenderTargetPixels(rt,0,0,W,H,a);masks.push({u,a});}
 const self=masks.find(r=>r.u.id==='mochi'),ordered=[...units].sort((a,b)=>b.drawOrder-a.drawOrder),front=ordered.slice(0,ordered.findIndex(u=>u.id==='mochi'));
 const union=new Uint8Array(W*H);for(const u of front){const m=masks.find(m=>m.u.id===u.id);for(let k=0;k<union.length;k++)if(m.a[k*4+3]>=128)union[k]=1;}
 const actor=s.actors.get('mochi').actor,home=actor.root.position.clone(),rows=[];
 for(const dx of [-32,-16,0,16,32])for(const dy of [-24,-12,0,12,24]){
  actor.root.position.set(home.x+dx,home.y+dy,home.z);const px=new Uint8Array(W*H*4);s.renderer.setRenderTarget(rt);s.renderer.clear();s.renderer.render(actor.root,s.camera);s.renderer.readRenderTargetPixels(rt,0,0,W,H,px);
  let n=0,h=0;for(let k=0;k<union.length;k++)if(px[k*4+3]>=128){n++;if(union[k])h++;}rows.push({dx,dy,occlusion:h/n});
 }return {base:self.u.box,rows:rows.sort((a,b)=>a.occlusion-b.occlusion)};

})));await page.close();}}finally{await b.close();}
