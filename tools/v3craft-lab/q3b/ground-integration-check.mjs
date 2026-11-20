// Q3B production check, using X06 pixel/contrast and X03 seek/hold methods.
// No recorder changes. Own original paint only, all source state restored.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const results=[];
try{
 for(const [width,height]of [[1280,720],[1440,900]]){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{width,height});
  const result=await page.evaluate(async()=>{
   const s=window.__depthScene,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js'),entry=s.actors.get('soot'),actor=entry.actor;
   const W=s.width,H=s.height,output=new T.WebGLRenderTarget(W,H,{depthBuffer:false,stencilBuffer:false});output.texture.colorSpace=T.SRGBColorSpace;
   const read=()=>{const p=new Uint8Array(W*H*4);s.renderer.readRenderTargetPixels(output,0,0,W,H,p);return p;};
   const linear=x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;},lum=(p,i)=>.2126*linear(p[i])+.7152*linear(p[i+1])+.0722*linear(p[i+2]);
   const saved=s.renderer.getRenderTarget(),clear=s.renderer.getClearColor(new T.Color()).clone(),alpha=s.renderer.getClearAlpha();
   const v={...s.view(),fixedTime:10,paused:true},rows=[];
   const pose=(clip,total,ms)=>{s.render({...v,model:{clip},modelProgress:ms/total},0);return actor.mesh.children.flatMap(c=>Array.from(c.geometry.attributes.position.array)).concat(actor.root.matrixWorld.elements);};
   for(const [clip,total,ms]of [['attack',800,0],['attack',800,225],['attack',800,350],['ult',2200,600],['ult',2200,1100],['ult',2200,1360]]){
    pose(clip,total,ms);const light=entry.craftLight,face=s.sizeAudit().units.find(u=>u.id==='soot').faceBox;
    s.renderer.setRenderTarget(output);s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(actor.root,s.camera);const base=read();
    s.renderer.render(light.rim,s.camera);const current=read();
    const contrast={body:{aa:0,ab:0},face:{aa:0,ab:0}};let changed=0,outside=0,maxDifference=0;
    for(let y=0;y<H;y++)for(let x=0;x<W-1;x++){
     const i=(y*W+x)*4,j=i+4,diff=Math.max(...[0,1,2].map(c=>Math.abs(base[i+c]-current[i+c])));
     if(diff>2){changed++;if(base[i+3]<3)outside++;}maxDifference=Math.max(maxDifference,diff);
     if(base[i+3]<204||base[j+3]<204)continue;const a=lum(base,i),b=lum(base,j),c=lum(current,i),d=lum(current,j);if(Math.abs(a-b)<.006)continue;
     const before=(b-a)/Math.max(.0001,a+b),after=(d-c)/Math.max(.0001,c+d);contrast.body.aa+=before*before;contrast.body.ab+=before*after;
     const yy=H-1-y;if(x>=face.x&&x<=face.x+face.width&&yy>=face.y&&yy<=face.y+face.height){contrast.face.aa+=before*before;contrast.face.ab+=before*after;}
    }
    rows.push({clip,ms,light:structuredClone(light.audit),changedPixels:changed,changedOutsidePaint:outside,maxRgbDifference255:maxDifference,contrast:Object.fromEntries(Object.entries(contrast).map(([k,v])=>[k,v.aa?v.ab/v.aa:1]))});
    s.renderer.setRenderTarget(saved);s.renderer.setClearColor(clear,alpha);
   }
   const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i]))),holds=[];
   for(const [clip,total,start]of [['attack',800,350],['ult',2200,1100]]){
    const a=pose(clip,total,start),mid=pose(clip,total,start+37.5),end=pose(clip,total,start+75);pose(clip,total,total*.8);const seek=pose(clip,total,start);
    holds.push({clip,midResidual:delta(a,mid),endResidual:delta(a,end),seekResidual:delta(a,seek)});
   }
   const light=entry.craftLight,capacity=light.audit.target.slice(),uuid=light.target.texture.uuid;
   for(let n=0;n<12;n++)pose('attack',800,n*800/11);
   const reuse={sameTexture:uuid===light.target.texture.uuid,initialCapacity:capacity,finalCapacity:light.audit.target.slice()};
   s.renderer.setRenderTarget(saved);s.renderer.setClearColor(clear,alpha);output.dispose();return{rows,holds,reuse,scope:'Soot local rim paint contrast and source geometry hold/seek only; full effect washout/FPS and all-roster Q2 remain separate.'};
  });results.push({width,height,errors,...result});console.log(JSON.stringify({width,errors,minFace:Math.min(...result.rows.map(r=>r.contrast.face)),minBody:Math.min(...result.rows.map(r=>r.contrast.body)),maxOutside:Math.max(...result.rows.map(r=>r.changedOutsidePaint)),holds:result.holds,reuse:result.reuse}));await page.close();
 }
 writeFileSync('tools/v3craft-lab/q3b/ground-integration-check.json',JSON.stringify({at:new Date().toISOString(),results},null,2)+'\n');
}finally{await browser.close();}
