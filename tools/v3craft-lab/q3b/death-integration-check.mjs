// X09 production verification, native GPU source/mask methods from X06/X09.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),results=[];
try{
 for(const [width,height]of [[1280,720],[1440,900]]){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{width,height});
  const result=await page.evaluate(async()=>{
   const s=window.__depthScene,e=s.actors.get('soot'),d=e.craftDeath,l=e.craftLight,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
   const v=s.view(),W=s.width,H=s.height,rt=new T.WebGLRenderTarget(W,H,{depthBuffer:false,stencilBuffer:false});rt.texture.colorSpace=T.SRGBColorSpace;
   const render=(ms,reduced=false)=>{e.koAt=10;s.render({...v,frame:null,model:undefined,actors:v.actors.map(a=>a.id==='soot'?{...a,hp:0}:a),fixedTime:10+ms/1000,paused:true,reducedMotion:reduced},0);};
   const read=(parts)=>{
    const saved=s.renderer.getRenderTarget(),clear=s.renderer.getClearColor(new T.Color()).clone(),alpha=s.renderer.getClearAlpha(),visible=s.scene.children.map(o=>[o,o.visible]);
    visible.forEach(([o])=>o.visible=parts.includes(o)&&o.visible);
    try{s.renderer.setRenderTarget(rt);s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(s.scene,s.camera);const p=new Uint8Array(W*H*4);s.renderer.readRenderTargetPixels(rt,0,0,W,H,p);return p;}
    finally{visible.forEach(([o,v])=>o.visible=v);s.renderer.setRenderTarget(saved);s.renderer.setClearColor(clear,alpha);}
   };
   const area=p=>{let count=0,x0=W,y0=H,x1=0,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(p[(y*W+x)*4+3]>2){count++;x0=Math.min(x0,x);y0=Math.min(y0,H-1-y);x1=Math.max(x1,x);y1=Math.max(y1,H-1-y);}return {pixels:count,box:count?{x:x0,y:y0,width:x1-x0+1,height:y1-y0+1}:null};};
   const delta=(a,b)=>{let max=0,changed=0;for(let i=0;i<a.length;i++){const n=Math.abs(a[i]-b[i]);max=Math.max(max,n);if(n)changed++;}return {max,changed};};
   render(0);const patched=read([e.actor.root]),swaps=[];
   e.actor.root.traverse(mesh=>{if(!mesh.isMesh)return;const original=mesh.material,saved=d.saved.find(a=>a.material===original),native=original.clone();native.onBeforeCompile=saved.hook;native.customProgramCacheKey=saved.key;swaps.push([mesh,original,native]);mesh.material=native;});
   const native=read([e.actor.root]);for(const [mesh,original,copy]of swaps){mesh.material=original;copy.dispose();}
   const rows=[];
   for(const ms of [0,100,200,300,400,500,600,700]){
    render(ms);const body=area(read([e.actor.root])),fragments=area(read([d.fragments]));
    const target=l.target,data=new Uint16Array(target.width*target.height*4);s.renderer.readRenderTargetPixels(target,0,0,target.width,target.height,data);let sourceAlpha=0;for(let i=3;i<data.length;i+=4)if(data[i]>0x1800)sourceAlpha++;
    rows.push({ms,body,fragments,sourceAlpha,amount:d.amount.value,target:l.audit.target,rootAngle:e.actor.root.rotation.z});
   }
   render(260);const initial=read([e.actor.root,d.fragments]);render(510);render(90);render(260);const seek=delta(initial,read([e.actor.root,d.fragments]));
   const amount=d.amount.value;let restored=false;try{d.withSourcePaint(()=>{throw Error('Expected capture failure');});}catch{restored=d.amount.value===amount;}
   render(260,true);const reduced={visible:d.fragments.visible,pixels:area(read([d.fragments])).pixels,body:area(read([e.actor.root])).pixels};
   render(0);const returned=delta(patched,read([e.actor.root]));rt.dispose();return {rows,native:delta(patched,native),seek,returned,exceptionRestore:restored,reduced,scope:'Forced death render path; unchanged model HP/status UI is outside this probe. No whole-pilot FPS or filmed revision acceptance.'};
  });results.push({width,height,errors,...result});console.log(JSON.stringify({width,errors,...result}));await page.close();
 }
 writeFileSync('tools/v3craft-lab/q3b/death-integration-check.json',JSON.stringify({at:new Date().toISOString(),scriptSha256:createHash('sha256').update(readFileSync(import.meta.filename)).digest('hex'),results},null,2)+'\n');
}finally{await browser.close();}
