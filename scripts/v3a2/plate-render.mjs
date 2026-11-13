/** Offline 30 fps plates. Metrics collectors validate these logs against encoded file hashes. */
import {createRequire} from 'node:module';
import {mkdir,readFile,readdir,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {root,evidenceMeta} from './check-gates.mjs';
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const report=resolve(root,'reports/v3-battle/a2/V1'),out=resolve(root,'apps/web/public/cinematics');
await mkdir(report,{recursive:true});await mkdir(out,{recursive:true});
const ids=process.argv.includes('--all')?(await readdir(resolve(root,'tools/cinematic-compositor/plates'))).filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5)):process.argv.slice(2);
const hash=b=>createHash('sha256').update(b).digest('hex');
const ffmpeg=args=>new Promise((yes,no)=>{const p=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:['ignore','ignore','pipe']});let error='';p.stderr.on('data',d=>error=(error+d).slice(-3000));p.on('error',no);p.on('exit',c=>c?no(Error(error)):yes());});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5990/@fs'+resolve(root,'tools/cinematic-compositor/index.html'));
 await page.waitForFunction(()=>window.compositor,null,{timeout:60000});
 for(const id of ids){
  const framesDir=resolve(root,'work/v3a2-plate-frames',id);await mkdir(framesDir,{recursive:true});
  const spec=JSON.parse(await readFile(resolve(root,'tools/cinematic-compositor/plates',id+'.json'),'utf8'));
  const started=performance.now(),frames=[],strip=[];let poster;
  try{
   const actor=await page.evaluate(id=>window.compositor.load(id),id);
   for(let f=0;f<spec.frames;f++){
    const r=await page.evaluate(f=>({audit:window.compositor.renderFrame(f),png:document.querySelector('#plate').toDataURL('image/png')}),f);
    const png=Buffer.from(r.png.split(',')[1],'base64');frames.push(r.audit);
    await writeFile(resolve(framesDir,String(f).padStart(4,'0')+'.png'),png);
    if([0,12,35,54,55].includes(f))strip.push({input:await sharp(png).resize(256,144).png().toBuffer(),left:strip.length*256,top:0});
    if(f===35)poster=png;
   }
   const seek=async f=>page.evaluate(f=>{window.compositor.renderFrame(f);return document.querySelector('#plate').toDataURL();},f);
   const a=await seek(35);await seek(2);const b=await seek(35);
   if(a!==b)throw Error(id+': non-deterministic seek');
   const input=['-framerate','30','-i',resolve(framesDir,'%04d.png')];
   const codecs={webm:['-c:v','libvpx-vp9','-b:v','0','-crf','40','-row-mt','1','-cpu-used','4'],mp4:['-c:v','libx264','-crf','32','-preset','slow','-movflags','+faststart']};
   const encoded=await Promise.allSettled(Object.entries(codecs).map(async([ext,args])=>{
    const file=resolve(out,id+'.'+ext);await ffmpeg([...input,...args,'-pix_fmt','yuv420p',file]);const bytes=await readFile(file);return [ext,{bytes:bytes.length,sha256:hash(bytes)}];
   }));
   for(const r of encoded)if(r.status==='rejected')throw r.reason;
   await sharp(poster).webp({quality:80}).toFile(resolve(out,id+'-poster.webp'));
   await sharp({create:{width:1280,height:144,channels:3,background:'#151125'}}).composite(strip).png().toFile(resolve(report,id+'-film.png'));
   const result={_meta:evidenceMeta(),id,actor:actor.source,sourceHash:hash(await readFile(resolve(root,'tools/cinematic-compositor/compositor.ts'))),plateHash:hash(await readFile(resolve(root,'tools/cinematic-compositor/plates',id+'.json'))),deterministic:true,frames,encoded:Object.fromEntries(encoded.map(r=>r.value)),renderSeconds:(performance.now()-started)/1000,errors:[...errors]};
   await writeFile(resolve(report,id+'-render.json'),JSON.stringify(result,null,2)+'\n');
   console.log(id,JSON.stringify({seconds:result.renderSeconds,webm:result.encoded.webm.bytes,mp4:result.encoded.mp4.bytes,layers:[...new Set(frames.flatMap(f=>Object.keys(f.layers)))].length,particles:Math.max(...frames.map(f=>f.particles))}));
  }finally{await rm(framesDir,{recursive:true,force:true});}
 }
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
