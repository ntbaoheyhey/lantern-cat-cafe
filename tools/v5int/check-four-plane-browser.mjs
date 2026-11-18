/** Isolated native decoder + WebGL four-plane reconstruction. No runtime registration. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=resolve(import.meta.dirname,'../..'),req=createRequire(resolve(root,'apps/web/package.json')),engines=req('@playwright/test');
const label=process.argv[2]??'four-plane-roi-r1';assert(/^[a-z0-9-]+$/.test(label));
const folder=resolve(root,'work/v5/CXI/batch-m',label),out=resolve(folder,'native');
try{await access(out);throw Error('Preserve prior native evidence');}catch(e){if(e.code!=='ENOENT')throw e;}await mkdir(out,{recursive:true});
const study=JSON.parse(await readFile(resolve(folder,'report.json'))),trial=study.trials.find(t=>t.mode==='ycrcb');assert(trial);
const data=await readFile(trial.video),source=await readFile(resolve(root,'work/v5/CXI/batch-m/packed-vp9-256-r1/source.rgba'));
const hash=b=>createHash('sha256').update(b).digest('hex');assert.equal(hash(data),trial.sha256);
const server=createServer((request,response)=>{
 if(request.url==='/clip.mp4'){
  response.setHeader('content-type','video/mp4');response.setHeader('accept-ranges','bytes');const range=request.headers.range?.match(/bytes=(\d+)-(\d*)/);
  if(range){const start=+range[1],end=range[2]?Math.min(+range[2],data.length-1):data.length-1;response.writeHead(206,{'content-range':`bytes ${start}-${end}/${data.length}`,'content-length':end-start+1});response.end(data.subarray(start,end+1));}
  else{response.setHeader('content-length',data.length);response.end(data);}return;
 }
 response.setHeader('content-type','text/html');response.end('<!doctype html><title>Four-plane decoder study</title><style>body{margin:0;background:#eee}</style>');
});await new Promise(r=>server.listen(6308,'127.0.0.1',r));
const report={utc:new Date().toISOString(),purpose:'Standalone decoder/WebGL study, not judge-scene acceptance or general FPS certification',viewport:[1280,720],video:{path:trial.video,sha256:hash(data),bytes:data.length},sourceRgbaSha256:hash(source),harnessSha256:hash(await readFile(import.meta.filename)),runs:[],images:[]};
try{
 for(const engine of ['chromium','webkit']){
  const browser=await engines[engine].launch({headless:true,...(engine==='chromium'?{args:['--use-angle=metal']}: {})});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:720}});await page.goto('http://127.0.0.1:6308/');
   const result=await page.evaluate(async()=>{
    const timeout=(p,n,label)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(Error(label)),n))]);
    const v=document.createElement('video');Object.assign(v,{muted:true,playsInline:true,loop:true,preload:'auto'});document.body.append(v);
    const ready=new Promise((r,j)=>{v.onloadeddata=r;v.onerror=()=>j(Error('decode '+v.error?.code));});v.src='/clip.mp4';await timeout(ready,10000,'loadeddata');
    const w=v.videoWidth/2,h=v.videoHeight/2,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;document.body.append(canvas);
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL unavailable');
    const shader=(kind,text)=>{const s=gl.createShader(kind);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 pos;void main(){gl_Position=vec4(pos,0.,1.);}'));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision highp float;uniform sampler2D packed;uniform vec2 size;uniform float mode;void main(){vec2 q=vec2(gl_FragCoord.x/size.x,1.-gl_FragCoord.y/size.y)*.5;float y=texture2D(packed,q).r;float cr=texture2D(packed,q+vec2(.5,0.)).r-128./255.;float cb=texture2D(packed,q+vec2(0.,.5)).r-128./255.;float a=texture2D(packed,q+vec2(.5,.5)).r;vec3 rgb=clamp(vec3(y+1.403*cr,y-.714*cr-.344*cb,y+1.773*cb),0.,1.);gl_FragColor=vec4(mode>1.5?vec3(a):clamp(rgb+vec3(mode)*(1.-a),0.,1.),1.);}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const at=gl.getAttribLocation(program,'pos');gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.uniform2f(gl.getUniformLocation(program,'size'),w,h);gl.viewport(0,0,w,h);
    const samples=[];
    for(const frame of [0,30,150,299]){
     if(frame){const seek=new Promise(r=>v.addEventListener('seeked',r,{once:true}));v.currentTime=(frame+.25)/30;await timeout(seek,5000,'seek '+frame);}
     gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,v);const captures={};
     for(const [name,mode]of [['black',0],['white',1],['alpha',2]]){gl.uniform1f(gl.getUniformLocation(program,'mode'),mode);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);const pixels=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let text='';for(let i=0;i<pixels.length;i+=16384)text+=String.fromCharCode(...pixels.subarray(i,i+16384));captures[name]=btoa(text);}
     if(gl.getError()!==gl.NO_ERROR)throw Error('WebGL reconstruction error');samples.push({frame,time:v.currentTime,captures});
    }
    const start=v.currentTime;await timeout(v.play(),5000,'play');await new Promise(r=>setTimeout(r,700));v.pause();const loopWrapped=v.currentTime<start;
    const result={width:w,height:h,samples,loopWrapped,ua:navigator.userAgent};v.removeAttribute('src');v.load();gl.deleteTexture(texture);gl.deleteBuffer(b);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();return result;
   });
   const row={engine,version:browser.version(),ua:result.ua,dimensions:[result.width,result.height],loopWrapped:result.loopWrapped,samples:[]};
   const w=result.width,h=result.height;assert.equal(source.length,300*w*h*4);
   for(const sample of result.samples){
    const buffers=Object.fromEntries(Object.entries(sample.captures).map(([k,v])=>[k,Buffer.from(v,'base64')]));let count=0,edgeCount=0,white=0,black=0,edge=0,mask=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const i=(y*w+x)*4,j=((h-1-y)*w+x)*4,k=sample.frame*w*h*4+i,a=source[k+3];mask+=Math.abs(buffers.alpha[j]-a);
     for(let c=0;c<3;c++){const delta=Math.abs(buffers.white[j+c]-Math.min(255,source[k+c]+255-a));if(a>16){white+=delta;black+=Math.abs(buffers.black[j+c]-source[k+c]);count++;}if(a>4&&a<250){edge+=delta;edgeCount++;}}
    }
    row.samples.push({frame:sample.frame,time:sample.time,foregroundWhiteMAE:white/count,foregroundBlackMAE:black/count,edgeMAE:edge/edgeCount,maskMAE:mask/(w*h)});
    if([0,150].includes(sample.frame)){
     const path=resolve(out,`${engine}-${sample.frame}-white.png`);await sharp(buffers.white,{raw:{width:w,height:h,channels:4}}).flip().png().toFile(path);const bytes=await readFile(path);report.images.push({path,width:w,height:h,bytes:bytes.length,sha256:hash(bytes),reviewed:false});
    }
   }
   row.numericPass=row.loopWrapped&&row.samples.every(s=>s.foregroundWhiteMAE<=3&&s.edgeMAE<=15&&s.maskMAE<=2);report.runs.push(row);
  }catch(error){report.runs.push({engine,version:browser.version(),error:String(error)});}finally{await browser.close();}
 }
}finally{await new Promise(r=>server.close(r));await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await writeFile(resolve(root,`reports/v5/CXI/evidence/v8-m-${label}-browser.json`),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({report:resolve(out,'report.json'),runs:report.runs}));
