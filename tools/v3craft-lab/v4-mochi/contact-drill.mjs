/** A4 contact-position variants on real opaque masks. No rules or production edits. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'));
 const rows=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const D=3,W=Math.round(s.width/D),H=Math.round(s.height/D),target=new T.WebGLRenderTarget(W,H),results=[];
  for(const ultimate of [false,true]){
   m.paused=false;for(let i=0;i<150;i++){if(!m.plan)m.step();if(m.plan?.actorId==='mochi'&&m.plan.ultimate===ultimate)break;while(m.plan)m.tick(100);}m.paused=true;m.animationAt=ultimate?1100:350;s.render({...s.view(),fixedTime:21,paused:true},0);
   const role=s.motionAudit.find(u=>u.id==='mochi'),units=s.sizeAudit().units,own=units.find(u=>u.id==='mochi'),masks=[];
   const clear=s.renderer.getClearColor(new T.Color()).clone(),alpha=s.renderer.getClearAlpha();
   for(const u of units){const a=new Uint8Array(W*H*4);s.renderer.setRenderTarget(target);s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(s.actors.get(u.id).actor.root,s.camera);s.renderer.readRenderTargetPixels(target,0,0,W,H,a);
    const mask=new Uint8Array(W*H),points=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(a[((H-1-y)*W+x)*4+3]>=128){mask[y*W+x]=1;points.push([x,y]);}masks.push({u,mask,points});}
   const self=masks.find(r=>r.u.id==='mochi'),others=masks.filter(r=>r.u.id!=='mochi'),ids=[...new Set(m.plan.events.filter(e=>e.type==='damage'&&e.actorId==='mochi').flatMap(e=>e.targetIds))],variants=[];
   const front=own.box.x+own.box.width-role.x;
   for(const id of ids){const t=units.find(u=>u.id===id);if(!t)continue;
    for(const gap of [8,24,40,48])for(let footY=250;footY<=630;footY+=10){
     const footX=t.box.x-gap-front,dx=Math.round((footX-role.x)/D),dy=Math.round((footY-role.y)/D),hits=others.map(()=>0);let hidden=0,clipped=0;
     const order=own.drawOrder/role.homeY*footY;
     for(const [x,y]of self.points){const xx=x+dx,yy=y+dy;if(xx<0||xx>=W||yy<14||yy>=H){clipped++;continue;}let behind=false;
      for(let i=0;i<others.length;i++)if(others[i].mask[yy*W+xx]){if(others[i].u.drawOrder>=order)behind=true;else hits[i]++;}if(behind)hidden++;
     }
     const losses=[{id:'mochi',fraction:hidden/self.points.length},...others.map((o,i)=>({id:o.u.id,fraction:hits[i]/o.points.length}))];
     variants.push({target:id,gap,footX,footY,sourceY:footY-(role.y-s.socket('mochi','vfxOrigin').y),clipped:clipped/self.points.length,max:Math.max(...losses.map(l=>l.fraction)),losses});
    }
   }
   s.renderer.setRenderTarget(null);s.renderer.setClearColor(clear,alpha);
   results.push({ultimate,key:s.actors.get('mochi').craftPose.drawing.key,primary:ids[0],best:variants.filter(v=>v.clipped===0).sort((a,b)=>a.max-b.max).slice(0,8),bestPrimary:variants.filter(v=>v.target===ids[0]&&v.clipped===0).sort((a,b)=>a.max-b.max).slice(0,8),note:'3px sampled alpha contact-only; source/target vertical alignment and full travel still require review'});
   if(!ultimate){m.paused=false;while(m.plan)m.tick(100);}
  }target.dispose();return results;
 });await writeFile('tools/v3craft-lab/v4-mochi/contact-drill.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows.map(r=>({ultimate:r.ultimate,best:r.best[0],bestPrimary:r.bestPrimary[0]}))));
}finally{await browser.close();}
