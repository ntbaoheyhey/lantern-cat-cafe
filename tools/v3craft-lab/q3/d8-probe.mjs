// D8 reuses D5's 1/2/4px contrast and D7's exact seek checks on moving paint.
// LEARN/Q3.md T28/T34–T39 and X19; no movie-clock claim.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const revision=Number(process.argv[2]??0),out=`tools/v3craft-lab/q3/raw/D8-r${revision}`;mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D8&revision=${revision}`);
 await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const p=window.__drill,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js'),W=1280,H=720;
  const rt=new T.WebGLRenderTarget(W,H);rt.texture.colorSpace=T.SRGBColorSpace;
  const bytes=new Uint8Array(W*H*4);p.renderer.setRenderTarget(rt);
  const render=()=>{p.renderer.render(p.scene,p.camera);p.renderer.readRenderTargetPixels(rt,0,0,W,H,bytes);return bytes.slice();};
  const linear=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  const luma=(a,i)=>.2126*linear(a[i*4])+.7152*linear(a[i*4+1])+.0722*linear(a[i*4+2]);
  const png=bytes=>{const c=document.createElement('canvas');c.width=W;c.height=H;const a=new Uint8ClampedArray(bytes.length);for(let y=0;y<H;y++)a.set(bytes.subarray(y*W*4,(y+1)*W*4),(H-1-y)*W*4);c.getContext('2d').putImageData(new ImageData(a,W,H),0,0);return c.toDataURL();};
  const samples=[],images={};
  for(const ms of [...new Set([...Array.from({length:25},(_,i)=>i*800/24),225,250,350,425,1100,1900])].sort((a,b)=>a-b)){
   p.draw(ms);const full=render(),state=p.drill.state(),face=p.drill.light.uFace.value.toArray();
   p.drill.root.visible=false;p.actor.root.visible=true;const base=render();
   const visible=p.scene.children.map(o=>[o,o.visible]);visible.forEach(([o])=>o.visible=o===p.actor.root);p.renderer.setClearColor(0,0);const mask=render();
   visible.forEach(([o,v])=>o.visible=v);p.renderer.setClearColor('#242336',1);p.drill.root.visible=true;p.actor.root.visible=false;
   const selected=(x,y,region)=>x>=0&&x<W&&y>=0&&y<H&&mask[(y*W+x)*4+3]>204&&(region==='body'||(x>=face[0]&&x<face[0]+face[2]&&y>=face[1]&&y<face[1]+face[3]));
   const metrics={};
   for(const region of ['face','body']){
    const scales={1:{aa:0,ab:0},2:{aa:0,ab:0},4:{aa:0,ab:0}};let aa=0,ab=0,white=0,count=0;
    for(let y=140;y<420;y++)for(let x=180;x<460;x++)if(selected(x,y,region)){
     const i=y*W+x,a=luma(base,i),b=luma(full,i);count++;if(Math.min(full[i*4],full[i*4+1],full[i*4+2])>=250)white++;
     for(const step of [1,2,4])for(const [dx,dy] of [[step,0],[0,step]])if(selected(x+dx,y+dy,region)){
      const j=i+dx+dy*W,aj=luma(base,j),bj=luma(full,j),da=aj-a,db=bj-b;if(Math.abs(da)<=.006)continue;
      if(step===1){aa+=da*da;ab+=da*db;}
      const ca=da/Math.max(1e-4,aj+a),cb=db/Math.max(1e-4,bj+b);scales[step].aa+=ca*ca;scales[step].ab+=ca*cb;
     }
    }
    metrics[region]={gradientRetention:ab/aa,localContrast:Object.entries(scales).map(([spacing,s])=>({spacing:Number(spacing),retention:s.ab/s.aa})),nearWhiteFraction:white/count,pixels:count};
   }
   let outside=0,changed=0;for(let i=0;i<W*H;i++)if(Math.max(...[0,1,2].map(c=>Math.abs(full[i*4+c]-base[i*4+c])))>8){changed++;const x=i%W,y=Math.floor(i/W);if(x<150||x>495||y<132||y>420)outside++;}
   // Isolate only the ground roles. Draw() refreshes current paint even when hidden.
   const vis=p.scene.children.map(o=>[o,o.visible]);vis.forEach(([o])=>o.visible=o===p.drill.root);p.renderer.setClearColor(0,0);p.drill.body.visible=false;p.drill.decal.visible=false;
   const shadow=render();const footAlpha=state.feet.map(([x,y])=>shadow[(Math.round(y)*W+Math.round(x))*4+3]/255);
   let shadowPixels=0;for(let i=0;i<W*H;i++)if(shadow[i*4+3]>8)shadowPixels++;
   p.drill.shadow.visible=false;p.drill.decal.visible=true;const decal=render();let decalPixels=0;for(let i=0;i<W*H;i++)if(decal[i*4+3]>8)decalPixels++;
   p.drill.shadow.visible=true;p.drill.body.visible=true;vis.forEach(([o,v])=>o.visible=v);p.renderer.setClearColor('#242336',1);
   samples.push({ms,state,metrics,changedPixels:changed,outsideLocalChangedPixels:outside,footAlpha,shadowPixels,decalPixels});
   if([0,225,350,1100,1900].includes(ms)){images['full-'+ms]=png(full);images['shadow-'+ms]=png(shadow);images['decal-'+ms]=png(decal);}
  }
  p.draw(350);const expected=render(),seek=[];
  for(const ms of [0,800,225,2000,500]){p.draw(ms);p.draw(350);const a=render();let difference=0;for(let i=0;i<a.length;i++)if(a[i]!==expected[i])difference++;seek.push({intermediateMs:ms,changedChannels:difference});}
  p.draw(0);const atRest=render();p.draw(800);const returned=render();let restDifference=0;for(let i=0;i<returned.length;i++)if(returned[i]!==atRest[i])restDifference++;
  p.renderer.setRenderTarget(null);rt.dispose();return{samples,seek,restDifference,images};
 });
 for(const [name,data] of Object.entries(result.images))writeFileSync(out+'/'+name+'.png',Buffer.from(data.split(',')[1],'base64'));delete result.images;
 const minimum={};for(const region of ['face','body'])minimum[region]=Math.min(...result.samples.flatMap(s=>s.metrics[region].localContrast.map(v=>v.retention)));
 const receipt={at:new Date().toISOString(),revision,errors,sourceSha256:createHash('sha256').update(readFileSync('tools/v3craft-drills/d8.ts')).digest('hex'),poseSha256:createHash('sha256').update(readFileSync('tools/v3craft-drills/d7.ts')).digest('hex'),method:'Current moving original-paint baseline at every pose; linear signed gradients and local pair-normalized contrast1/2/4px, isolated shadow/decal and independent seeks. No Q1 movie timing claim.',minimum,...result};
 writeFileSync(out+'/gpu-probe.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({revision,errors,minimum,seek:result.seek,restDifference:result.restDifference,footAlphaMin:Math.min(...result.samples.flatMap(s=>s.footAlpha)),outsideLocalMax:Math.max(...result.samples.map(s=>s.outsideLocalChangedPixels))}));
}finally{await browser.close();}
