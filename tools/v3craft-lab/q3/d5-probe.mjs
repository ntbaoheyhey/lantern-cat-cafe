// Exact-time D5 colour/contrast samples. Uses X16/T28; not video timing proof.
import {chromium}from'../../../scripts/v3feel/browser-fixture.mjs';
import{writeFileSync,readFileSync,mkdirSync}from'node:fs';import{createHash}from'node:crypto';
const revision=Number(process.argv[2]??0),out=`tools/v3craft-lab/q3/raw/D5-r${revision}`;mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D5&revision=${revision}`);await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');const p=window.__drill,W=1280,H=720,target=new T.WebGLRenderTarget(W,H);target.texture.colorSpace=T.SRGBColorSpace;
  const pixels=new Uint8Array(W*H*4),mask=p.drill.mask.image.data,body=p.drill.body,face=p.drill.face;
  p.renderer.setRenderTarget(target);const render=ms=>{p.draw(ms);p.renderer.readRenderTargetPixels(target,0,0,W,H,pixels);return pixels.slice();};const base=render(0);
  const linear=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  const yAt=(bytes,i)=>.2126*linear(bytes[i*4])+.7152*linear(bytes[i*4+1])+.0722*linear(bytes[i*4+2]);
  const yBase=new Float32Array(W*H);for(let i=0;i<yBase.length;i++)yBase[i]=yAt(base,i);
  const selected=(x,y,region)=>x>=0&&x<W&&y>=0&&y<H&&mask[(y*W+x)*4+3]>204&&(region==='body'||(x>=face[0]&&x<face[0]+face[2]&&y>=face[1]&&y<face[1]+face[3]));
  const pairs={},points={};for(const region of ['face','body']){pairs[region]=[];points[region]=[];for(let y=body.y;y<body.y+body.height;y++)for(let x=body.x;x<body.x+body.width;x++)if(selected(x,y,region)){const i=y*W+x;points[region].push(i);for(const step of [1,2,4])for(const [dx,dy]of[[step,0],[0,step]])if(selected(x+dx,y+dy,region)){const j=i+dx+dy*W,a=yBase[j]-yBase[i];if(Math.abs(a)>.006)pairs[region].push({i,j,step,a,c:a/Math.max(1e-4,yBase[j]+yBase[i])});}}}
  const imageData=bytes=>{const c=document.createElement('canvas');c.width=W;c.height=H;const a=new Uint8ClampedArray(bytes.length);for(let y=0;y<H;y++)a.set(bytes.subarray(y*W*4,(y+1)*W*4),(H-1-y)*W*4);c.getContext('2d').putImageData(new ImageData(a,W,H),0,0);return c.toDataURL();};
  const samples=[],images={baseline:imageData(base)};
  for(let frame=0;frame<=60;frame++){const ms=frame/30*1000,bytes=render(ms),ys=new Float32Array(W*H);for(const i of points.body)ys[i]=yAt(bytes,i);const metrics={};
   for(const region of ['face','body']){let aa=0,ab=0,bb=0,absolute=0,white=0;const scales={1:{aa:0,ab:0},2:{aa:0,ab:0},4:{aa:0,ab:0}};
    for(const q of pairs[region]){const b=ys[q.j]-ys[q.i];if(q.step===1){aa+=q.a*q.a;ab+=q.a*b;bb+=b*b;}const c=b/Math.max(1e-4,ys[q.j]+ys[q.i]);scales[q.step].aa+=q.c*q.c;scales[q.step].ab+=q.c*c;}
    for(const i of points[region]){absolute+=Math.abs(ys[i]-yBase[i]);if(Math.min(bytes[i*4],bytes[i*4+1],bytes[i*4+2])>=250)white++;}
    metrics[region]={retainedOriginalGradient:ab/aa,rmsGradientRatio:Math.sqrt(bb/aa),localContrast:Object.entries(scales).map(([spacing,s])=>({spacing:Number(spacing),retention:s.ab/s.aa})),meanAbsoluteLuminanceChange:absolute/points[region].length,nearWhiteFraction:white/points[region].length,pixels:points[region].length};
   }
   let changedPixels=0;for(let i=0;i<W*H;i++){const k=i*4;if(Math.max(Math.abs(bytes[k]-base[k]),Math.abs(bytes[k+1]-base[k+1]),Math.abs(bytes[k+2]-base[k+2]))>8)changedPixels++;}
   samples.push({ms,metrics,changedPixels,state:p.drill.state()});if([6,9,15,24,33,42,51].includes(frame))images[`frame-${frame}`]=imageData(bytes);
  }
  const peak=samples.reduce((a,b)=>a.changedPixels>b.changedPixels?a:b);render(peak.ms);const exact=pixels.slice(),seek=[];for(const ms of[0,1900,300,1250,2000]){render(ms);render(peak.ms);let changedChannels=0;for(let i=0;i<pixels.length;i++)if(pixels[i]!==exact[i])changedChannels++;seek.push({intermediateMs:ms,changedChannels});}
  const roleSupport=[];p.scene.children.forEach(o=>o.visible=o===p.drill.root);p.renderer.setClearColor(0,0);
  for(const role of [0,1]){p.drill.layers.forEach((l,i)=>l.mesh.visible=i===role);for(const ms of [300,500,800,1100,1400]){
   render(ms);let all=0,bodyPixels=0,facePixels=0;for(let i=0;i<W*H;i++)if(pixels[i*4+3]>5){all++;const x=i%W,y=Math.floor(i/W);if(selected(x,y,'body'))bodyPixels++;if(selected(x,y,'face'))facePixels++;}
   roleSupport.push({role:p.drill.layers[role].role,ms,all,bodyPixels,facePixels});
  }}
  target.dispose();return{samples,peak,seek,images,body,face,roleSupport};
 });
 for(const[name,data]of Object.entries(result.images))writeFileSync(`${out}/${name}.png`,Buffer.from(data.split(',')[1],'base64'));delete result.images;
 const minimum={};for(const region of['face','body'])minimum[region]={gradient:Math.min(...result.samples.map(s=>s.metrics[region].retainedOriginalGradient)),localContrast:Math.min(...result.samples.flatMap(s=>s.metrics[region].localContrast.map(q=>q.retention)))};
 writeFileSync(`${out}/gpu-probe.json`,JSON.stringify({at:new Date().toISOString(),revision,errors,method:'61 fixed-time actual WebGL renders; same opaque actor and face masks; linear Rec.709 signed gradients and local pair-normalized contrast at1/2/4px. Not Peli full bandpass or movie timing.',sourceSha256:createHash('sha256').update(readFileSync('tools/v3craft-drills/d5.ts')).digest('hex'),minimum,...result},null,2)+'\n');console.log(JSON.stringify({revision,errors,minimum,peak:{ms:result.peak.ms,pixels:result.peak.changedPixels},seek:result.seek}));
}finally{await browser.close();}
