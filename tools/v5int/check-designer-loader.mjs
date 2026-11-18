/** Native checks of the unregistered loader. This is not gameplay/asset acceptance. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web');
const require=createRequire(resolve(app,'package.json'));
const {createServer}=await import(require.resolve('vite'));
const engines=require('@playwright/test');
const work=resolve(root,'work/v5/CXI/batch-m/loader');await mkdir(work,{recursive:true});
const sha=x=>createHash('sha256').update(x).digest('hex');
const study=JSON.parse(await readFile(resolve(root,'reports/v5/CXI/evidence/v8-m-delivery-study.json')));
const manifests={},routes=new Map();
for(const {measurement:m} of study.trials){
 const id=m.cat,folder=resolve(root,`work/v5/CXI/batch-m/experiments/${id}-384`);
 const video=await readFile(resolve(folder,'premul-mask-256-crf28-srgb.mp4'));
 const [w,h]=id==='mochi'?[312,260]:[212,260];
 const [sw,sh]=m.deliveryCanvas,raw=await readFile(resolve(folder,'estimated.rgba'));
 const poster=await sharp(raw.subarray(0,sw*sh*4),{raw:{width:sw,height:sh,channels:4}}).resize(w,h).webp({lossless:true}).toBuffer();
 const vp=`/units/${id}/designer-idle-${sha(video).slice(0,16)}.mp4`,pp=`/units/${id}/designer-idle-${sha(poster).slice(0,16)}.webp`;
 routes.set(vp,{data:video,type:'video/mp4'});routes.set(pp,{data:poster,type:'image/webp'});
 manifests[id]={version:1,id,format:'h264-rgb-mask',video:vp,poster:pp,width:w,height:h,opaqueHeight:256,foot:[w/2,257.33],duration:10,fps:30,frames:300,sourceSha256:m.sourceSha256,videoSha256:sha(video),posterSha256:sha(poster),videoBytes:video.length,sockets:Object.fromEntries(['root','hip','head','hp-anchor','vfx-origin','main-hand','off-hand'].map(k=>[k,[w/2,h/2]]))};
}
const html=`<!doctype html><style>body{margin:0;background:#eef4e8}canvas{display:block}</style><script type="module">
import * as T from '/@fs/${app}/node_modules/three/build/three.module.js';
import {DesignerIdleMedia,validateDesignerIdle,designerDrift} from '/src/game/cardrpg/spine/designer-idle-loader.ts';
window.control=async()=>{
 const renderer=new T.WebGLRenderer({preserveDrawingBuffer:true});renderer.setSize(64,64);document.body.append(renderer.domElement);
 const geometry=new T.PlaneGeometry(),material=new T.MeshBasicMaterial({color:'red'}),plane=new T.Mesh(geometry,material),scene=new T.Scene();scene.add(plane);
 const camera=new T.PerspectiveCamera(50,1,.1,100);camera.position.z=3;renderer.render(scene,camera);
 const restore=new Promise(r=>renderer.domElement.addEventListener('webglcontextrestored',r,{once:true}));
 const extension=renderer.getContext().getExtension('WEBGL_lose_context');extension.loseContext();await new Promise(r=>setTimeout(r,100));extension.restoreContext();await restore;renderer.render(scene,camera);
 geometry.dispose();material.dispose();renderer.dispose();return {stockThree:true};
};
window.run=async (m,mode='normal')=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async(test,label)=>{const end=performance.now()+6500;while(!test()){if(performance.now()>end)throw Error(label);await wait(20);}};
 const checks=[];const check=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
 const image=new Image();image.src=m.poster;await image.decode();
 const oldPlay=HTMLMediaElement.prototype.play;
 if(mode==='reject')HTMLMediaElement.prototype.play=()=>Promise.reject(Error('injected autoplay rejection'));
 let media;try{media=new DesignerIdleMedia(m,image);}finally{if(mode!=='reject')HTMLMediaElement.prototype.play=oldPlay;}
 let events=0;media.onFrame=()=>events++;
 const renderer=new T.WebGLRenderer({alpha:true,preserveDrawingBuffer:true,antialias:false});renderer.setSize(m.width,m.height);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
 document.body.replaceChildren(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#eef4e8');scene.add(media.plane);
 const scale=512/m.opaqueHeight;media.plane.position.set((m.foot[0]-m.width/2)*scale,(m.height/2-m.foot[1])*scale,0);
 const camera=new T.OrthographicCamera(-m.width*scale/2,m.width*scale/2,m.height*scale/2,-m.height*scale/2,.1,100);camera.position.z=10;
 const render=()=>renderer.render(scene,camera);
 render();check('poster-before-decode',media.packed.value===0);
 const initial=new Float32Array(media.basePositions);
 if(mode==='dispose-early'){media.dispose();check('early-disposal-resolves',await media.ready===false);check('early-src-released',!media.video.getAttribute('src'));renderer.dispose();return {mode,checks};}
 media.sample({worldTime:0,paused:true,fixedTime:true,frozen:false},false);
 const ready=await media.ready;
 HTMLMediaElement.prototype.play=oldPlay;
 check('ready-result',ready===(mode==='normal'),media.state);
 if(mode!=='normal'){
  check('failure-retains-poster',media.material.map===media.posterTexture&&media.packed.value===0,media.failure);
  check('failure-releases-decoder',!media.video.getAttribute('src')&&media.video.paused);
  media.dispose();renderer.dispose();return {mode,checks};
 }
 if(!ready){media.dispose();renderer.dispose();return {mode,checks};}
 check('off-DOM-video',!media.video.isConnected);
 const seek=async(time,reduced=false)=>{media.sample({worldTime:time,paused:true,fixedTime:true,frozen:false},reduced);await until(()=>!media.video.seeking&&designerDrift(media.video.currentTime,reduced?0:time)<.04,'seek did not settle');await wait(80);render();};
 await seek(2.5);
 const c=document.createElement('canvas');c.width=m.width;c.height=m.height*2;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(media.video,0,0);const native=ctx.getImageData(0,0,c.width,c.height).data;
 const out=document.createElement('canvas');out.width=m.width;out.height=m.height;const oc=out.getContext('2d');oc.drawImage(renderer.domElement,0,0);const gpu=oc.getImageData(0,0,m.width,m.height).data;
 const lin=x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4),srgb=x=>x<=.0031308?12.92*x:1.055*Math.pow(x,1/2.4)-.055;
 const bg=[238,244,232],diff=[];let transparent=0,opaque=0;
 for(let p=0;p<m.width*m.height;p++){
  const a=native[(p+m.width*m.height)*4]/255;if(a<.02)transparent++;if(a>.98)opaque++;
  for(let k=0;k<3;k++){const straight=Math.min(1,native[p*4+k]/255/Math.max(a,.001));const expected=srgb(lin(straight)*a+lin(bg[k]/255)*(1-a))*255;diff.push(Math.abs(expected-gpu[p*4+k]));}
 }
 diff.sort((a,b)=>a-b);const pixel={mae:diff.reduce((a,b)=>a+b,0)/diff.length,p95:diff[Math.floor(diff.length*.95)],transparent,opaque};
 check('shader-matches-native-mask',pixel.mae<3&&pixel.p95<8&&transparent>100&&opaque>100,pixel);
 const capture=renderer.domElement.toDataURL('image/png');
 await seek(7,true);check('reduced-holds-zero',media.video.currentTime<.04&&media.video.paused,media.state);
 await seek(3);media.sample({worldTime:8,paused:false,fixedTime:false,frozen:true},false);const frozen=media.video.currentTime;await wait(220);check('frozen-holds',Math.abs(media.video.currentTime-frozen)<.002&&media.video.paused);
 const beforeEvents=events;media.sample({worldTime:3,paused:false,fixedTime:false,frozen:false,playbackRate:1},false);const one=media.video.currentTime;await wait(420);check('normal-playback',media.video.currentTime-one>.25,media.video.currentTime-one);check('frame-invalidations',events-beforeEvents>=5,events-beforeEvents);
 media.sample({worldTime:media.video.currentTime,paused:false,fixedTime:false,frozen:false,playbackRate:2},false);const two=media.video.currentTime;await wait(350);check('double-speed',media.video.currentTime-two>.45&&media.video.currentTime-two<1.1,media.video.currentTime-two);
 await seek(9.9);media.sample({worldTime:9.9,paused:false,fixedTime:false,frozen:false,playbackRate:1},false);await wait(240);check('native-loop-crossing',media.video.currentTime<.6,media.state);
 media.sample({worldTime:1,paused:true,fixedTime:true,frozen:false},false);media.sample({worldTime:8,paused:true,fixedTime:true,frozen:false},false);
 await until(()=>!media.video.seeking&&designerDrift(media.video.currentTime,8)<.04,'queued seek lost');check('latest-seek-wins',true,media.state);
 await seek(4);const beforeRestore=renderer.domElement.toDataURL('image/png');const extension=renderer.getContext().getExtension('WEBGL_lose_context');let lost=false,restored=false;
 renderer.domElement.addEventListener('webglcontextlost',()=>lost=true);renderer.domElement.addEventListener('webglcontextrestored',()=>restored=true);
 extension?.loseContext();await until(()=>lost,'context-loss timeout');extension.restoreContext();await until(()=>restored,'context-restore timeout');render();check('context-recovered',renderer.info.render.calls===1&&media.packed.value===1);check('restored-pixels-exact',renderer.domElement.toDataURL('image/png')===beforeRestore);
 check('immutable-base',initial.every((v,i)=>v===media.basePositions[i]));
 media.dispose();media.dispose();render();check('dispose-src',media.state.disposed&&!media.video.getAttribute('src')&&media.video.paused);check('dispose-gpu',renderer.info.memory.textures===0&&renderer.info.memory.geometries===0,renderer.info.memory);renderer.dispose();
 return {mode,checks,capture};
};window.harnessReady=true;
</script>`;
const server=await createServer({configFile:false,envFile:false,root:app,publicDir:false,appType:'custom',logLevel:'error',server:{host:'127.0.0.1',port:6304,strictPort:true,fs:{allow:[root]}},plugins:[{name:'designer-harness',configureServer(s){s.middlewares.use((req,res,next)=>{
 const url=req.url?.split('?')[0];if(url==='/'){res.setHeader('content-type','text/html');res.end(html);return;}
 const asset=routes.get(url);if(!asset){next();return;}res.setHeader('content-type',asset.type);res.setHeader('accept-ranges','bytes');const range=req.headers.range?.match(/bytes=(\d+)-(\d*)/);
 if(range){const start=+range[1],end=range[2]?Math.min(+range[2],asset.data.length-1):asset.data.length-1;res.statusCode=206;res.setHeader('content-range',`bytes ${start}-${end}/${asset.data.length}`);res.setHeader('content-length',end-start+1);res.end(asset.data.subarray(start,end+1));}else res.end(asset.data);
 });}}]});
const controlOnly=process.argv.includes('--control');
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),loaderSha256:sha(await readFile(resolve(app,'src/game/cardrpg/spine/designer-idle-loader.ts'))),url:'http://127.0.0.1:6304/',viewport:[1280,720],purpose:'Isolated native loader checks; approximate anchors; no game integration or asset acceptance',runs:[]};
await server.listen();
try{for(const engine of ['chromium','webkit']){
 if(!existsSync(engines[engine].executablePath())){report.runs.push({engine,unavailable:true});continue;}
 const browser=await engines[engine].launch({headless:true,...(engine==='chromium'?{args:['--use-angle=metal']}: {})});
 try{if(controlOnly){const page=await browser.newPage(),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto(report.url);await page.waitForFunction(()=>window.harnessReady);await page.evaluate(()=>window.control());await page.waitForTimeout(100);report.runs.push({engine,errors});await page.close();continue;}
 for(const [cat,manifest] of Object.entries(manifests))for(const mode of ['normal','reject','dispose-early']){
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  try{await page.goto(report.url);await page.waitForFunction(()=>window.harnessReady);const row=await page.evaluate(({manifest,mode})=>window.run(manifest,mode),{manifest,mode});
   if(row.capture){const png=Buffer.from(row.capture.split(',')[1],'base64');delete row.capture;const file=resolve(work,`${engine}-${cat}.png`);await writeFile(file,png);row.image={path:file,sha256:sha(png),...await sharp(png).metadata()};delete row.image.icc;}
   report.runs.push({engine,cat,...row,errors});console.log(engine,cat,mode,row.checks.filter(c=>!c.pass));
  }catch(e){report.runs.push({engine,cat,mode,error:String(e),errors});console.log(engine,cat,mode,String(e));}finally{await page.close();}
 }}finally{await browser.close();}
}}finally{await server.close();}
report.pass=report.runs.length===12&&report.runs.every(r=>!r.error&&!r.errors?.length&&r.checks?.every(c=>c.pass));
await writeFile(resolve(root,'reports/v5/CXI/evidence/'+(controlOnly?'v8-m-loader-control.json':'v8-m-loader-native.json')),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,runs:report.runs.length,failures:report.runs.flatMap(r=>(r.checks??[]).filter(c=>!c.pass).map(c=>({engine:r.engine,cat:r.cat,...c})))}));
process.exitCode=report.pass?0:1;
