/** Author alternative Panko approach curves in screen pixels; production unchanged. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{width:1440,height:900});
 const result=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  m.paused=false;for(let i=0;i<160;i++){if(!m.plan)m.step();if(m.plan?.actorId==='panko'&&!m.plan.ultimate)break;while(m.plan)m.tick(100);}m.paused=true;
  const rt=new T.WebGLRenderTarget(s.width,s.height),renderer=s.renderer,k=s.height/720,px=s.worldWidth/s.width,results=[];
  const read=root=>{renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(root,s.camera);const a=new Uint8Array(s.width*s.height*4);renderer.readRenderTargetPixels(rt,0,0,s.width,s.height,a);return a;};
  for(const bow of [-280,-200,-120,0,120,200,280])for(const lift of [-80,40,160]){
   const rows=[];
   for(const ms of [150,200,250,300,350,500,600,700]){
    m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
    const smooth=x=>{const q=Math.max(0,Math.min(1,x));return q*q*(3-2*q);},q=ms<300?smooth((ms-100)/200):1-smooth((ms-440)/360),bend=4*q*(1-q);
    const actor=s.actors.get('panko').actor.root;actor.position.x+=bow*k*bend*px;actor.position.y+=(lift-40)*k*bend*px;
    const clear=renderer.getClearColor(new T.Color()).clone(),alpha=renderer.getClearAlpha(),units=s.sizeAudit().units,union=new Uint8Array(s.width*s.height);let max=0,worst='';
    for(const u of [...units].sort((a,b)=>b.drawOrder-a.drawOrder)){
     const a=read(s.actors.get(u.id).actor.root);let count=0,hidden=0;
     for(let i=0;i<union.length;i++)if(a[i*4+3]>=128){count++;if(union[i])hidden++;union[i]=1;}
     const v=count?hidden/count:0;if(v>max){max=v;worst=u.id;}
    }
    renderer.setRenderTarget(null);renderer.setClearColor(clear,alpha);
    rows.push({ms,max,worst,pankoBox:units.find(u=>u.id==='panko').box});
   }
   results.push({bow,lift,max:Math.max(...rows.map(r=>r.max)),clipped:rows.some(r=>r.pankoBox.y<0||r.pankoBox.x<s.width*.03||r.pankoBox.x+r.pankoBox.width>s.width*.97||r.pankoBox.y+r.pankoBox.height>s.height),rows});
  }
  rt.dispose();return results;
 });
 await writeFile('reports/v4-art/REVIEW/A6/path-drill.json',JSON.stringify({errors,method:'World displacement = desired screen px * worldWidth / width; screen-up increases world y. Curves preserve endpoints/clocks.',results:result},null,2)+'\n');
 console.log(JSON.stringify(result.sort((a,b)=>a.max-b.max).slice(0,8).map(({bow,lift,max,clipped})=>({bow,lift,max,clipped}))));
}finally{await browser.close();}
