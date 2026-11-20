import {createRequire} from 'node:module';
import {mkdir,readFile,readdir,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const arg=process.argv[2],dir=resolve(root,'tools/cinematic-compositor/plates');
const ids=arg==='--all'?(await readdir(dir)).filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5)):[arg??'mochi-ult'];
const out=resolve(root,'apps/web/public/cinematics'),report=resolve(root,'reports/v3-battle/A3');await mkdir(out,{recursive:true});await mkdir(report,{recursive:true});
let server;const base='http://127.0.0.1:5990';
try{await fetch(base);}catch{server=spawn('pnpm',['--filter','@taskbar-hero/web','dev','--host','127.0.0.1','--port','5990','--strictPort'],{cwd:root,stdio:'ignore'});await writeFile(resolve(report,'render-server.pid'),String(server.pid));for(let n=0;n<80;n++){try{await fetch(base);break;}catch{await new Promise(r=>setTimeout(r,250));}}}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const run=(args)=>new Promise((yes,no)=>{const proc=spawn('ffmpeg',args,{stdio:['ignore','ignore','pipe']});let error='';proc.stderr.on('data',d=>error=(error+d).slice(-6000));proc.on('exit',code=>code===0?yes():no(Error(error)));});
try{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/@fs'+resolve(root,'tools/cinematic-compositor/index.html'));
 await page.waitForFunction(()=>window.compositor,{timeout:60000});
 for(const id of ids){
  if(!/^[a-z-]+$/.test(id))throw Error('Invalid plate ID');
  const plate=JSON.parse(await readFile(resolve(dir,id+'.json'),'utf8')),frames=resolve(root,'work/cine-frames',id);await mkdir(frames,{recursive:true});
  const started=performance.now();
  try{
   await page.evaluate(id=>window.compositor.load(id),id);
   const strips=[];let poster;
   for(let i=0;i<plate.frames;i++){
    await page.evaluate(i=>window.compositor.renderFrame(i),i);const file=resolve(frames,String(i).padStart(4,'0')+'.png');const buffer=await page.locator('#plate').screenshot({path:file});
    if([0,12,35,51,66].includes(i))strips.push({input:await sharp(buffer).resize(256,144).png().toBuffer(),left:strips.length*256,top:0});
    if(i===35)poster=buffer;
   }
   await page.evaluate(()=>window.compositor.renderFrame(35));const a=await page.locator('#plate').screenshot();await page.evaluate(()=>window.compositor.renderFrame(2));await page.evaluate(()=>window.compositor.renderFrame(35));const b=await page.locator('#plate').screenshot();
   const deterministic=createHash('sha256').update(a).digest('hex')===createHash('sha256').update(b).digest('hex');
   if(!deterministic)throw Error(id+': non-deterministic seek');
   const input=['-hide_banner','-loglevel','error','-y','-framerate','30','-i',resolve(frames,'%04d.png')];
   for(const ext of ['webm','mp4']){
    const target=resolve(out,id+'.'+ext);
    for(const crf of [34,38,42,46]){
     const codec=ext==='webm'?['-c:v','libvpx-vp9','-b:v','0','-crf',String(crf),'-row-mt','1','-cpu-used','4']:['-c:v','libx264','-crf',String(crf),'-preset','slow','-movflags','+faststart'];
     await run([...input,...codec,'-pix_fmt','yuv420p',target]);if((await readFile(target)).length<=600000)break;
    }
    if((await readFile(target)).length>600000)throw Error(id+' exceeds 600 KB');
   }
   await sharp(poster).webp({quality:80}).toFile(resolve(out,id+'-poster.webp'));
   await sharp({create:{width:1280,height:144,channels:3,background:'#151125'}}).composite(strips).png().toFile(resolve(report,id+'-film.png'));
   const result={id,frames:plate.frames,seconds:plate.frames/30,renderSeconds:(performance.now()-started)/1000,deterministic,webmBytes:(await readFile(resolve(out,id+'.webm'))).length,mp4Bytes:(await readFile(resolve(out,id+'.mp4'))).length,errors};
   await writeFile(resolve(report,id+'-render.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
  }finally{await rm(frames,{recursive:true,force:true});}
 }
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();if(server)server.kill();}
