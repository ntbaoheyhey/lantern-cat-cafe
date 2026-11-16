import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3b/raw/staff-ground';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),results=[];
try{
 for(const [fixture,width,height]of [['wave3',1280,720],['boss',1440,900]]){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===fixture),{width,height});
  const r=await page.evaluate(async()=>{
   const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');m.paused=false;m.sceneReady=true;
   for(let i=0;i<150;i++){if(!m.plan)m.step();if(m.plan?.actorId==='soot'&&!m.plan.ultimate){m.paused=true;break;}while(m.plan)m.tick(100);}
   m.animationAt=450;s.render({...s.view(),fixedTime:10.45,paused:true},0);
   const W=s.width,H=s.height,rt=new T.WebGLRenderTarget(W,H,{depthBuffer:false,stencilBuffer:false}),saved=s.renderer.getRenderTarget(),clear=s.renderer.getClearColor(new T.Color()).clone(),alpha=s.renderer.getClearAlpha();
   const visible=s.scene.children.map(o=>[o,o.visible]),actors=[...s.actors.values()].map(e=>e.actor.root),ground=s.craftBasic.ground,baseY=ground.position.y;
   const read=parts=>{visible.forEach(([o,v])=>o.visible=parts.includes(o)&&v);s.renderer.setRenderTarget(rt);s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(s.scene,s.camera);const p=new Uint8Array(W*H*4);s.renderer.readRenderTargetPixels(rt,0,0,W,H,p);return p;};
   const body=read(actors),rows=[];
   for(const offset of [0,24]){
    ground.position.y=baseY-offset*s.worldWidth/W;const p=read([ground]);let total=0,occluded=0;for(let i=3;i<p.length;i+=4)if(p[i]>20){total++;if(body[i]>=204)occluded++;}
    rows.push({offset,total,occluded,exposed:total-occluded,exposedFraction:(total-occluded)/Math.max(1,total)});
   }
   ground.position.y=baseY;visible.forEach(([o,v])=>o.visible=v);s.renderer.setRenderTarget(saved);s.renderer.setClearColor(clear,alpha);rt.dispose();return {rows};
  });results.push({fixture,width,height,errors,...r});console.log(JSON.stringify(results.at(-1)));await page.close();
 }
 writeFileSync('tools/v3craft-lab/q3b/staff-ground-study.json',JSON.stringify({at:new Date().toISOString(),scope:'B1 stroke support behind actual actor alpha; no full-field visual or timing acceptance.',results},null,2)+'\n');
}finally{await browser.close();}
